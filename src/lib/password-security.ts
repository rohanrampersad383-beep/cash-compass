const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "qwerty",
  "12345678",
  "123456789",
  "admin123",
  "cashcompass",
]);

export const PASSWORD_REQUIREMENTS = [
  "Use at least 10 characters.",
  "Include at least one letter and one number.",
  "Add a symbol, or use a passphrase of 16+ characters.",
  "Avoid obvious passwords like password123, qwerty, or cashcompass.",
];

export const PASSWORD_ERROR =
  "Use 10+ characters with a letter, number, and symbol, or a 16+ character passphrase. Avoid obvious passwords.";

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
