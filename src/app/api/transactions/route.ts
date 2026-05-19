import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid transaction" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      userId: user.id,
      categoryId: parsed.data.categoryId || null,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({ transaction });
}
