export const CSV_IMPORT_LIMITS = {
  maxFileSizeBytes: 1_000_000,
  maxRequestSizeBytes: 1_250_000,
  maxRows: 100,
  maxAmount: 1_000_000,
};

const ALLOWED_FILE_EXTENSIONS = [".csv"];
const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "",
]);

const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeImportedText(value: unknown, maxLength: number) {
  const normalized = String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  if (!normalized) {
    return "";
  }

  return FORMULA_PREFIX_PATTERN.test(normalized) ? `'${normalized}` : normalized;
}

export function sanitizeCsvFileName(fileName: unknown) {
  const normalized = normalizeImportedText(fileName, 180).replace(/[^\w.\- ']/g, "");
  return normalized || "statement.csv";
}

export function isAllowedCsvFile(fileName: string, fileType: string) {
  const lowerName = fileName.toLowerCase();
  const hasAllowedExtension = ALLOWED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

  return hasAllowedExtension && ALLOWED_MIME_TYPES.has(fileType.toLowerCase());
}

export function parseCsvAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/,/g, "")
    .replace(/[$£€¥₹]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidImportAmount(value: number) {
  return Number.isFinite(value) && value > 0 && value <= CSV_IMPORT_LIMITS.maxAmount;
}

export function normalizeCsvDate(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!ISO_DATE_PATTERN.test(raw)) {
    return null;
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    return null;
  }

  return raw;
}
