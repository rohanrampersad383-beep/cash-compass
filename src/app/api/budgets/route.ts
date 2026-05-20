import { NextResponse } from "next/server";
import { CategoryType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireUser();
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

  const budget = await prisma.budget.create({
    data: {
      name: parsed.data.name,
      limitAmount: parsed.data.limitAmount,
      period: parsed.data.period,
      categoryId: category.id,
      userId: user.id,
    },
  });

  return NextResponse.json({ budget });
}
