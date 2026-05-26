export const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists. Please sign in instead.";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isDuplicateEmailError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002",
  );
}
