import { NextResponse } from "next/server";
import { CategoryType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { budgetSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const parsed = budgetSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid budget" }, { status: 400 });
  }

  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      userId: user.id,
      type: { in: [CategoryType.EXPENSE, CategoryType.BILL] },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Choose a valid spending or bill category." }, { status: 400 });
  }

  const result = await prisma.budget.updateMany({
    where: { id, userId: user.id },
    data: {
      name: parsed.data.name,
      limitAmount: parsed.data.limitAmount,
      period: parsed.data.period,
      categoryId: category.id,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const result = await prisma.budget.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
