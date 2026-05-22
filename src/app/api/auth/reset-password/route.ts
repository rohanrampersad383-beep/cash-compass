import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth-recovery";
import { validateMutationOrigin } from "@/lib/csrf";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.authRecovery);
  if (limited) {
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your new password." }, { status: 400 });
  }

  const updated = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!updated) {
    return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Your password has been updated." });
}
