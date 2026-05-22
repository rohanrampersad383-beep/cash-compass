import { NextResponse } from "next/server";
import { z } from "zod";
import { destroySession, requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

const deleteAccountSchema = z.object({
  confirmation: z.string().trim(),
});

export async function DELETE(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Confirmation is required." }, { status: 400 });
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success || parsed.data.confirmation !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      await tx.transaction.deleteMany({ where: { userId: user.id } });
      await tx.income.deleteMany({ where: { userId: user.id } });
      await tx.expense.deleteMany({ where: { userId: user.id } });
      await tx.bill.deleteMany({ where: { userId: user.id } });
      await tx.budget.deleteMany({ where: { userId: user.id } });
      await tx.savingsGoal.deleteMany({ where: { userId: user.id } });
      await tx.uploadedStatement.deleteMany({ where: { userId: user.id } });
      await tx.category.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });

    await destroySession();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Account could not be deleted. Please try again." },
      { status: 500 },
    );
  }
}
