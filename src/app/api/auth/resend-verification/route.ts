import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sendEmailVerificationLink } from "@/lib/auth-recovery";
import { validateMutationOrigin } from "@/lib/csrf";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.emailVerification);
  if (limited) {
    return limited;
  }

  const user = await requireUser();

  if (!user.emailVerifiedAt) {
    await sendEmailVerificationLink(user);
  }

  return NextResponse.json({
    ok: true,
    message: "If verification is needed, a verification link has been sent.",
  });
}
