import { NextResponse } from "next/server";
import { destroyAllUserSessions, requireUser } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.financeMutation);
  if (limited) {
    return limited;
  }

  const user = await requireUser();

  try {
    await destroyAllUserSessions(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Sessions could not be cleared. Please try again." },
      { status: 500 },
    );
  }
}
