import { NextResponse } from "next/server";
import { CategoryType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { billSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const parsed = billSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid bill" }, { status: 400 });
  }

  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId: user.id, type: CategoryType.BILL },
      })
    : null;

  if (parsed.data.categoryId && !category) {
    return NextResponse.json({ error: "Choose a valid bill category." }, { status: 400 });
  }

  const result = await prisma.bill.updateMany({
    where: { id, userId: user.id },
    data: {
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      frequency: parsed.data.frequency,
      status: parsed.data.status,
      categoryId: category?.id ?? null,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const result = await prisma.bill.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
