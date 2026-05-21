import { CategoryType, TransactionKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { incomeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const parsed = incomeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid income" }, { status: 400 });
  }

  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId: user.id, type: CategoryType.INCOME },
      })
    : null;

  if (parsed.data.categoryId && !category) {
    return NextResponse.json({ error: "Choose a valid income category." }, { status: 400 });
  }

  const income = await prisma.$transaction(async (tx) => {
    const created = await tx.income.create({
      data: {
        ...parsed.data,
        userId: user.id,
        categoryId: category?.id ?? null,
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
        categoryId: category?.id ?? null,
        userId: user.id,
      },
    });

    return created;
  });

  return NextResponse.json({ income });
}
