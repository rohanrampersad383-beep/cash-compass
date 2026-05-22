import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_TOKEN_MINUTES = 45;
export const EMAIL_VERIFICATION_TOKEN_MINUTES = 24 * 60;

export type ConsumableAuthToken = {
  expiresAt: Date;
  consumedAt?: Date | null;
};

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAuthToken(now = new Date(), expiresInMinutes: number) {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: hashAuthToken(rawToken),
    expiresAt: new Date(now.getTime() + expiresInMinutes * 60 * 1000),
  };
}

export function isAuthTokenUsable(token: ConsumableAuthToken | null | undefined, now = new Date()) {
  return Boolean(token && !token.consumedAt && token.expiresAt > now);
}

export function genericAuthRecoveryResponse() {
  return {
    ok: true,
    message: "If an account exists for that email, a link has been sent.",
  };
}
