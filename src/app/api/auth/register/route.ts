import { NextResponse } from "next/server";
import { sendEmailVerificationLink } from "@/lib/auth-recovery";
import { DUPLICATE_EMAIL_MESSAGE, isDuplicateEmailError } from "@/lib/auth-email";
import { hashPassword } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

const REGISTER_RESPONSE = {
  ok: true,
  message: "If this email can be registered, you can log in after submitting.",
  redirectTo: "/login",
};

const DUPLICATE_EMAIL_RESPONSE = {
  error: DUPLICATE_EMAIL_MESSAGE,
};

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.register);
  if (limited) {
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Check your registration details." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your registration details." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) {
    return NextResponse.json(DUPLICATE_EMAIL_RESPONSE, { status: 409 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        currencyCode: "TTD",
        categories: {
          create: [
            { name: "Salary", type: "INCOME", color: "#22c55e", icon: "briefcase" },
            { name: "Freelance", type: "INCOME", color: "#06b6d4", icon: "sparkles" },
            { name: "Food", type: "EXPENSE", color: "#f59e0b", icon: "utensils" },
            { name: "Housing", type: "EXPENSE", color: "#38bdf8", icon: "home" },
            { name: "Transport", type: "EXPENSE", color: "#a78bfa", icon: "car" },
            { name: "Subscriptions", type: "BILL", color: "#f97316", icon: "repeat" },
          ],
        },
      },
    });

    await sendEmailVerificationLink(user);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return NextResponse.json(DUPLICATE_EMAIL_RESPONSE, { status: 409 });
    }

    return NextResponse.json({ error: "Account could not be created. Please try again." }, { status: 500 });
  }

  return NextResponse.json(REGISTER_RESPONSE);
}
