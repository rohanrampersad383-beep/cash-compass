import assert from "node:assert/strict";
import test from "node:test";
import { sendAuthMail } from "@/lib/mail";

function withEnv<T>(env: Record<string, string | undefined>, callback: () => Promise<T> | T) {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(env)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return Promise.resolve(callback()).finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
}

const mailInput = {
  to: "user@example.com",
  subject: "Reset your Cash Compass password",
  text: "Reset your password.",
  html: "<p>Reset your password.</p>",
  actionUrl: "https://cash-compass-finance.vercel.app/reset-password?token=test-token",
  type: "password-reset" as const,
};

test("production missing email provider fails safely without throwing", async () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };

  try {
    await withEnv(
      {
        NODE_ENV: "production",
        RESEND_API_KEY: undefined,
        EMAIL_FROM: undefined,
      },
      async () => {
        const result = await sendAuthMail(mailInput);

        assert.deepEqual(result, { ok: false, delivered: false, devFallback: false });
      },
    );
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.some((message) => message.includes("email provider is not configured")), true);
});

test("development missing email provider uses controlled console fallback", async () => {
  const infos: string[] = [];
  const originalInfo = console.info;
  console.info = (message?: unknown) => {
    infos.push(String(message));
  };

  try {
    await withEnv(
      {
        NODE_ENV: "development",
        RESEND_API_KEY: undefined,
        EMAIL_FROM: undefined,
      },
      async () => {
        const result = await sendAuthMail(mailInput);

        assert.deepEqual(result, { ok: true, delivered: false, devFallback: true });
      },
    );
  } finally {
    console.info = originalInfo;
  }

  assert.equal(infos.some((message) => message.includes("[Cash Compass dev email:password-reset]")), true);
});
