import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { categoryDeletionBlockReason } from "@/lib/category-management";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { categoryUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const parsed = categoryUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid category" }, { status: 400 });
  }

  try {
    const result = await prisma.category.updateMany({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        icon: parsed.data.icon || "tag",
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That category already exists for this type." }, { status: 409 });
    }

    return NextResponse.json({ error: "Category could not be updated." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      _count: {
        select: {
          transactions: true,
          incomes: true,
          expenses: true,
          bills: true,
          budgets: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const blockReason = categoryDeletionBlockReason(category._count);
  if (blockReason) {
    return NextResponse.json({ error: blockReason }, { status: 409 });
  }

  const result = await prisma.category.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
