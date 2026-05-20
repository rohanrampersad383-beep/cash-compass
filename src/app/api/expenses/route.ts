import { CategoryType, TransactionKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { expenseSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const parsed = expenseSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid expense" }, { status: 400 });
  }

  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId: user.id, type: CategoryType.EXPENSE },
      })
    : null;

  if (parsed.data.categoryId && !category) {
    return NextResponse.json({ error: "Choose a valid expense category." }, { status: 400 });
  }

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        ...parsed.data,
        userId: user.id,
        categoryId: category?.id ?? null,
        notes: parsed.data.notes || null,
      },
    });

    await tx.transaction.create({
      data: {
        title: parsed.data.merchant,
        amount: parsed.data.amount,
        date: parsed.data.date,
        kind: TransactionKind.EXPENSE,
        notes: parsed.data.notes || null,
        paymentType: parsed.data.paymentType,
        isRecurring: parsed.data.isRecurring,
        categoryId: category?.id ?? null,
        userId: user.id,
      },
    });

    return created;
  });

  return NextResponse.json({ expense });
}
