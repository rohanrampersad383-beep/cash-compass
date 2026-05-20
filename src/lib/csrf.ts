import { NextResponse } from "next/server";

const STATIC_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://cash-compass-finance.vercel.app",
  "https://financial-tracks.vercel.app",
];

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);
    return url.origin;
  } catch {
    return null;
  }
}

function deploymentOrigin(value: string | null | undefined) {
  const origin = normalizeOrigin(value);

  if (!origin) {
    return null;
  }

  const hostname = new URL(origin).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".vercel.app")) {
    return origin;
  }

  return null;
}

function allowedOrigins() {
  const allowed = new Set(STATIC_ALLOWED_ORIGINS);

  for (const value of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    const origin = deploymentOrigin(value);
    if (origin) {
      allowed.add(origin);
    }
  }

  return allowed;
}

function requestOrigin(request: Request) {
  const origin = normalizeOrigin(request.headers.get("origin"));
  if (origin) {
    return origin;
  }

  return normalizeOrigin(request.headers.get("referer"));
}

export function validateMutationOrigin(request: Request) {
  const origin = requestOrigin(request);

  if (!origin || !allowedOrigins().has(origin)) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  }

  return null;
}
