import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { validateMutationOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}
