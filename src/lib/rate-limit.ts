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
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

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
  authRecovery: {
    key: "auth:recovery",
    limit: 5,
    windowMs: 30 * 60 * 1000,
    message: "Too many account recovery attempts. Please wait before trying again.",
  },
  emailVerification: {
    key: "auth:verify-email",
    limit: 3,
    windowMs: 60 * 60 * 1000,
    message: "Too many verification email requests. Please wait before trying again.",
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

function rateLimitResponse(config: RateLimitConfig, retryAfterSeconds: number) {
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
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + retryAfterSeconds * 1000) / 1000)),
      },
    },
  );
}

function memoryRateLimit(request: Request, config: RateLimitConfig): NextResponse | null {
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
    return rateLimitResponse(config, retryAfterSeconds);
  }

  return null;
}

async function redisRateLimit(request: Request, config: RateLimitConfig): Promise<NextResponse | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return memoryRateLimit(request, config);
  }

  const ip = getClientIp(request);
  const key = `cash-compass:${config.key}:${ip}`;

  try {
    const response = await fetch(`${UPSTASH_URL}/eval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([RATE_LIMIT_SCRIPT, "1", key, String(config.windowMs)]),
      cache: "no-store",
    });

    if (!response.ok) {
      return memoryRateLimit(request, config);
    }

    const payload = await response.json() as { result?: [number | string, number | string] };
    const [rawCount, rawTtl] = payload.result ?? [];
    const count = Number(rawCount);
    const ttlMs = Number(rawTtl);

    if (!Number.isFinite(count) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
      return memoryRateLimit(request, config);
    }

    if (count > config.limit) {
      const retryAfterSeconds = Math.max(Math.ceil(ttlMs / 1000), 1);
      return rateLimitResponse(config, retryAfterSeconds);
    }

    return null;
  } catch {
    return memoryRateLimit(request, config);
  }
}

export async function rateLimit(request: Request, config: RateLimitConfig): Promise<NextResponse | null> {
  return redisRateLimit(request, config);
}
