const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "password1234",
  "qwerty",
  "qwerty123",
  "12345678",
  "123456789",
  "1234567890",
  "admin123",
  "letmein123",
  "user123456",
  "cashcompass",
  "cashcompass123",
]);

export const PASSWORD_REQUIREMENTS = [
  "Use at least 10 characters with a letter and number. Add a symbol, or use a 16+ character passphrase. Avoid obvious passwords.",
];

export const PASSWORD_ERROR =
  "Use at least 10 characters with a letter and number. Add a symbol, or use a 16+ character passphrase. Avoid obvious passwords.";

function normalizedPassword(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isStrongPassword(password: string) {
  const normalized = normalizedPassword(password);
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);
  const isPassphraseLength = password.length >= 16;

  return (
    password.length >= 10 &&
    password.length <= 128 &&
    hasLetter &&
    hasNumber &&
    (hasSymbol || isPassphraseLength) &&
    !WEAK_PASSWORDS.has(normalized)
  );
}
