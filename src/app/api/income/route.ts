import { TransactionKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = incomeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid income" }, { status: 400 });
  }

  const income = await prisma.$transaction(async (tx) => {
    const created = await tx.income.create({
      data: {
        ...parsed.data,
        userId: user.id,
        categoryId: parsed.data.categoryId || null,
        notes: parsed.data.notes || null,
      },
    });

    await tx.transaction.create({
      data: {
        title: parsed.data.source,
        amount: parsed.data.amount,
        date: parsed.data.date,
        kind: TransactionKind.INCOME,
        notes: parsed.data.notes || null,
        isRecurring: parsed.data.isRecurring,
        categoryId: parsed.data.categoryId || null,
        userId: user.id,
      },
    });

    return created;
  });

  return NextResponse.json({ income });
}
