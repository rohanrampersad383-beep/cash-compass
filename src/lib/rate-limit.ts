import { NextResponse } from "next/server";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __cashCompassRateLimitStore?: Map<string, RateLimitBucket>;
  __cashCompassRateLimitCleanupAt?: number;
};

const store = globalForRateLimit.__cashCompassRateLimitStore ?? new Map<string, RateLimitBucket>();
globalForRateLimit.__cashCompassRateLimitStore = store;

const CLEANUP_INTERVAL_MS = 60_000;

export const rateLimitPresets = {
  login: {
    key: "auth:login",
    limit: 5,
    windowMs: 10 * 60 * 1000,
    message: "Too many login attempts. Please wait a few minutes and try again.",
  },
  register: {
    key: "auth:register",
    limit: 3,
    windowMs: 30 * 60 * 1000,
    message: "Too many registration attempts. Please wait before creating another account.",
  },
  csvUpload: {
    key: "csv:upload",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    message: "Too many CSV imports. Please wait before uploading another statement.",
  },
  financeMutation: {
    key: "finance:mutation",
    limit: 60,
    windowMs: 60 * 1000,
    message: "Too many finance updates. Please slow down and try again shortly.",
  },
} satisfies Record<string, RateLimitConfig>;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    forwardedIp ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    "unknown"
  );
}

function cleanupExpiredBuckets(now: number) {
  if ((globalForRateLimit.__cashCompassRateLimitCleanupAt ?? 0) > now) {
    return;
  }

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }

  globalForRateLimit.__cashCompassRateLimitCleanupAt = now + CLEANUP_INTERVAL_MS;
}

export function rateLimit(request: Request, config: RateLimitConfig): NextResponse | null {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const ip = getClientIp(request);
  const key = `${config.key}:${ip}`;
  const existing = store.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + config.windowMs };

  bucket.count += 1;
  store.set(key, bucket);

  const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);

  if (bucket.count > config.limit) {
    return NextResponse.json(
      {
        error: config.message,
        retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
