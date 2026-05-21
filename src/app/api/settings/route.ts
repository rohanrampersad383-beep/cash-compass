import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { settingsSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const parsed = settingsSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { currencyCode: parsed.data.currencyCode },
  });

  return NextResponse.json({ ok: true });
}
