import { NextResponse } from "next/server";
import { createUserSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid registration" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "An account already exists for that email." }, { status: 409 });
  }

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

  await createUserSession(user.id);
  return NextResponse.json({ ok: true });
}
