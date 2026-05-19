import { NextResponse } from "next/server";
import { createUserSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  await createUserSession(user.id);
  return NextResponse.json({ ok: true });
}
