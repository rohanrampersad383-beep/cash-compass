import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { savingsGoalSchema } from "@/lib/validations";

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
  const parsed = savingsGoalSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid savings goal" }, { status: 400 });
  }

  const result = await prisma.savingsGoal.updateMany({
    where: { id, userId: user.id },
    data: {
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      targetDate: parsed.data.targetDate,
      color: parsed.data.color,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
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

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const { id } = await params;
  const result = await prisma.savingsGoal.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
