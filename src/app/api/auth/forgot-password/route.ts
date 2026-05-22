import { NextResponse } from "next/server";
import { genericRecoveryResponse, sendPasswordResetLink } from "@/lib/auth-recovery";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.authRecovery);
  if (limited) {
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(genericRecoveryResponse());
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(genericRecoveryResponse());
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    await sendPasswordResetLink(user);
  }

  return NextResponse.json(genericRecoveryResponse());
}
