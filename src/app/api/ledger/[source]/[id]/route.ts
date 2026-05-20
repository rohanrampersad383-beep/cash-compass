import { NextResponse } from "next/server";
import { CategoryType, PaymentType, TransactionKind } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";

type LedgerSource = "transaction" | "income" | "expense";

function isLedgerSource(value: string): value is LedgerSource {
  return value === "transaction" || value === "income" || value === "expense";
}

async function categoryFor(userId: string, categoryId: string | null | undefined, kind: TransactionKind) {
  if (!categoryId) {
    return null;
  }

  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
      type: kind === TransactionKind.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ source: string; id: string }> },
) {
  const user = await requireUser();
  const { source, id } = await params;

  if (!isLedgerSource(source)) {
    return NextResponse.json({ error: "Invalid ledger row" }, { status: 404 });
  }

  const parsed = transactionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid transaction" }, { status: 400 });
  }

  if (source === "income" && parsed.data.kind !== TransactionKind.INCOME) {
    return NextResponse.json({ error: "Income rows must stay income entries." }, { status: 400 });
  }

  if (source === "expense" && parsed.data.kind !== TransactionKind.EXPENSE) {
    return NextResponse.json({ error: "Expense rows must stay expense entries." }, { status: 400 });
  }

  const category = await categoryFor(user.id, parsed.data.categoryId, parsed.data.kind);

  if (parsed.data.categoryId && !category) {
    return NextResponse.json({ error: "Choose a valid category for this transaction type." }, { status: 400 });
  }

  if (source === "transaction") {
    const result = await prisma.transaction.updateMany({
      where: { id, userId: user.id },
      data: {
        title: parsed.data.title,
        amount: parsed.data.amount,
        date: parsed.data.date,
        kind: parsed.data.kind,
        categoryId: category?.id ?? null,
        paymentType: parsed.data.kind === TransactionKind.EXPENSE ? parsed.data.paymentType ?? PaymentType.CARD : null,
        notes: parsed.data.notes || null,
        isRecurring: parsed.data.isRecurring,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  if (source === "income") {
    const result = await prisma.income.updateMany({
      where: { id, userId: user.id },
      data: {
        source: parsed.data.title,
        amount: parsed.data.amount,
        date: parsed.data.date,
        categoryId: category?.id ?? null,
        notes: parsed.data.notes || null,
        isRecurring: parsed.data.isRecurring,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  const result = await prisma.expense.updateMany({
    where: { id, userId: user.id },
    data: {
      merchant: parsed.data.title,
      amount: parsed.data.amount,
      date: parsed.data.date,
      categoryId: category?.id ?? null,
      paymentType: parsed.data.paymentType ?? PaymentType.CARD,
      notes: parsed.data.notes || null,
      isRecurring: parsed.data.isRecurring,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ source: string; id: string }> },
) {
  const user = await requireUser();
  const { source, id } = await params;

  if (!isLedgerSource(source)) {
    return NextResponse.json({ error: "Invalid ledger row" }, { status: 404 });
  }

  const result =
    source === "transaction"
      ? await prisma.transaction.deleteMany({ where: { id, userId: user.id } })
      : source === "income"
        ? await prisma.income.deleteMany({ where: { id, userId: user.id } })
        : await prisma.expense.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    return NextResponse.json({ error: "Ledger row not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
