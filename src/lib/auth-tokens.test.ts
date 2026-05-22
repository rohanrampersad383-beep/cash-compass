import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthToken,
  genericAuthRecoveryResponse,
  hashAuthToken,
  isAuthTokenUsable,
} from "@/lib/auth-tokens";

test("hashes auth recovery tokens without returning the raw token as the stored value", () => {
  const token = createAuthToken(new Date("2026-05-21T12:00:00.000Z"), 30);

  assert.ok(token.rawToken.length >= 32);
  assert.notEqual(token.tokenHash, token.rawToken);
  assert.equal(token.tokenHash, hashAuthToken(token.rawToken));
  assert.equal(token.expiresAt.toISOString(), "2026-05-21T12:30:00.000Z");
});

test("considers unexpired unused tokens usable", () => {
  assert.equal(
    isAuthTokenUsable(
      {
        expiresAt: new Date("2026-05-21T12:30:00.000Z"),
        consumedAt: null,
      },
      new Date("2026-05-21T12:00:00.000Z"),
    ),
    true,
  );
});

test("rejects expired tokens", () => {
  assert.equal(
    isAuthTokenUsable(
      {
        expiresAt: new Date("2026-05-21T12:30:00.000Z"),
        consumedAt: null,
      },
      new Date("2026-05-21T12:30:01.000Z"),
    ),
    false,
  );
});

test("rejects consumed tokens so reset and verification links cannot be reused", () => {
  assert.equal(
    isAuthTokenUsable(
      {
        expiresAt: new Date("2026-05-21T12:30:00.000Z"),
        consumedAt: new Date("2026-05-21T12:05:00.000Z"),
      },
      new Date("2026-05-21T12:10:00.000Z"),
    ),
    false,
  );
});

test("uses generic auth recovery response copy to avoid email enumeration", () => {
  assert.deepEqual(genericAuthRecoveryResponse(), {
    ok: true,
    message: "If an account exists for that email, a link has been sent.",
  });
});
