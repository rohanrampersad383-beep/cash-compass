import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { savingsGoalSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const limited = rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const parsed = savingsGoalSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid savings goal" }, { status: 400 });
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  return NextResponse.json({ goal });
}
