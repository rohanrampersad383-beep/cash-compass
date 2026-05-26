import assert from "node:assert/strict";
import test from "node:test";
import { DUPLICATE_EMAIL_MESSAGE, isDuplicateEmailError, normalizeEmail } from "@/lib/auth-email";
import { isStrongPassword, PASSWORD_ERROR } from "@/lib/password-security";
import { registerSchema, resetPasswordSchema } from "@/lib/validations";

test("accepts 10+ characters with a letter, number, and symbol", () => {
  assert.equal(isStrongPassword("Compass123!"), true);
  assert.equal(registerSchema.safeParse({ name: "Asha", email: "asha@example.com", password: "Compass123!" }).success, true);
});

test("accepts a 16+ character passphrase with a letter and number but no symbol", () => {
  assert.equal(isStrongPassword("longpassphrase2026"), true);
  assert.equal(resetPasswordSchema.safeParse({ token: "a".repeat(24), password: "longpassphrase2026" }).success, true);
});

test("rejects passwords under 10 characters", () => {
  assert.equal(isStrongPassword("Short1!"), false);
});

test("rejects passwords missing a letter", () => {
  assert.equal(isStrongPassword("1234567890!"), false);
});

test("rejects passwords missing a number", () => {
  assert.equal(isStrongPassword("CompassOnly!"), false);
});

test("rejects obvious weak passwords", () => {
  for (const password of ["password123", "password1234", "qwerty123", "cashcompass123", "letmein123", "1234567890", "user123456"]) {
    assert.equal(isStrongPassword(password), false, password);
  }
});

test("uses the user-facing password helper copy consistently", () => {
  assert.equal(
    PASSWORD_ERROR,
    "Use at least 10 characters with a letter and number. Add a symbol, or use a 16+ character passphrase. Avoid obvious passwords.",
  );
});

test("normalizes email casing and spacing before registration", () => {
  assert.equal(normalizeEmail("  Test@Email.com "), "test@email.com");
  const parsed = registerSchema.parse({ name: "Asha", email: "  Test@Email.com ", password: "Compass123!" });

  assert.equal(parsed.email, "test@email.com");
});

test("detects duplicate email conflicts without exposing database internals", () => {
  assert.equal(isDuplicateEmailError({ code: "P2002" }), true);
  assert.equal(isDuplicateEmailError({ code: "P2003" }), false);
  assert.equal(DUPLICATE_EMAIL_MESSAGE, "An account with this email already exists. Please sign in instead.");
});
