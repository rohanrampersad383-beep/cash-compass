import { NextResponse } from "next/server";
import { CategoryType, TransactionKind } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid transaction" }, { status: 400 });
  }

  const categoryType = parsed.data.kind === TransactionKind.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId: user.id, type: categoryType },
      })
    : null;

  if (parsed.data.categoryId && !category) {
    return NextResponse.json({ error: "Choose a valid category for this transaction type." }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      userId: user.id,
      categoryId: category?.id ?? null,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({ transaction });
}
