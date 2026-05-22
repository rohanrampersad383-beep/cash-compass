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

export type CsvTransactionKind = "INCOME" | "EXPENSE";
export type CsvPaymentType = "CARD" | "CASH" | "BANK_TRANSFER" | "DIGITAL_WALLET" | "OTHER";

export type CsvColumnMapping = {
  dateColumn?: string;
  descriptionColumn?: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  categoryColumn?: string;
  typeColumn?: string;
  notesColumn?: string;
  paymentMethodColumn?: string;
};

export type MappedCsvPreviewRow = {
  rowNumber: number;
  date: string;
  title: string;
  amount: number;
  kind: CsvTransactionKind;
  categoryName?: string;
  categoryId?: string | null;
  notes?: string;
  paymentType?: CsvPaymentType | null;
  issue?: string;
};

export type MappedCsvPreviewResult = {
  rows: MappedCsvPreviewRow[];
  hasBlockingIssues: boolean;
};

export type CsvImportCategoryAssignment = {
  rowNumber?: number;
  kind: CsvTransactionKind;
  categoryId?: string | null;
};

export type CsvImportCategoryForValidation = {
  id: string;
  type: CsvTransactionKind;
};

const HEADER_ALIASES = {
  date: ["date", "transaction date", "posted date", "time"],
  description: ["description", "merchant", "memo", "details", "transaction", "payee", "name"],
  amount: ["amount", "value", "total"],
  debit: ["debit", "withdrawal", "paid out", "outflow", "charge"],
  credit: ["credit", "deposit", "paid in", "inflow"],
  category: ["category", "spending category"],
  type: ["type", "transaction type", "kind"],
  notes: ["notes", "note", "comments", "comment"],
  paymentMethod: ["payment method", "method", "account"],
} as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findHeader(headers: string[], aliases: readonly string[]) {
  const normalizedHeaders = headers.map((header) => ({ header, normalized: normalizeHeader(header) }));
  return aliases
    .map((alias) => normalizedHeaders.find((item) => item.normalized === alias || item.normalized.includes(alias)))
    .find(Boolean)?.header;
}

function getMappedValue(row: Record<string, unknown>, column?: string) {
  if (!column) {
    return undefined;
  }

  return row[column];
}

function parseTransactionKind(value: unknown): CsvTransactionKind | null {
  const normalized = normalizeHeader(String(value ?? ""));

  if (!normalized) {
    return null;
  }

  if (["income", "credit", "deposit", "inflow", "salary", "refund"].some((token) => normalized.includes(token))) {
    return "INCOME";
  }

  if (["expense", "debit", "withdrawal", "outflow", "payment", "purchase", "charge"].some((token) => normalized.includes(token))) {
    return "EXPENSE";
  }

  return null;
}

export function parseCsvPaymentType(value: unknown): CsvPaymentType | null {
  const normalized = normalizeHeader(String(value ?? ""));

  if (!normalized) {
    return null;
  }

  if (normalized.includes("cash")) {
    return "CASH";
  }

  if (normalized.includes("bank") || normalized.includes("transfer") || normalized.includes("ach")) {
    return "BANK_TRANSFER";
  }

  if (normalized.includes("wallet") || normalized.includes("mobile") || normalized.includes("digital")) {
    return "DIGITAL_WALLET";
  }

  if (normalized.includes("card") || normalized.includes("visa") || normalized.includes("mastercard") || normalized.includes("debit")) {
    return "CARD";
  }

  return "OTHER";
}

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

  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const normalized = raw
    .replace(/,/g, "")
    .replace(/[^\d.()+\-]/g, "")
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

export function suggestCsvMapping(headers: string[]): CsvColumnMapping {
  const debitColumn = findHeader(headers, HEADER_ALIASES.debit);
  const creditColumn = findHeader(headers, HEADER_ALIASES.credit);
  const mapping: CsvColumnMapping = {
    dateColumn: findHeader(headers, HEADER_ALIASES.date),
    descriptionColumn: findHeader(headers, HEADER_ALIASES.description),
    categoryColumn: findHeader(headers, HEADER_ALIASES.category),
    typeColumn: findHeader(headers, HEADER_ALIASES.type),
    notesColumn: findHeader(headers, HEADER_ALIASES.notes),
    paymentMethodColumn: findHeader(headers, HEADER_ALIASES.paymentMethod),
  };

  if (debitColumn || creditColumn) {
    mapping.debitColumn = debitColumn;
    mapping.creditColumn = creditColumn;
  } else {
    mapping.amountColumn = findHeader(headers, HEADER_ALIASES.amount);
  }

  return Object.fromEntries(Object.entries(mapping).filter(([, value]) => Boolean(value))) as CsvColumnMapping;
}

export function validateCsvMapping(mapping: CsvColumnMapping) {
  if (!mapping.dateColumn) {
    return "Map a date column before previewing.";
  }

  if (!mapping.descriptionColumn) {
    return "Map a description, merchant, or memo column before previewing.";
  }

  if (!mapping.amountColumn && !mapping.debitColumn && !mapping.creditColumn) {
    return "Map either an amount column or debit/credit columns before previewing.";
  }

  return null;
}

function getDebitCreditAmount(row: Record<string, unknown>, mapping: CsvColumnMapping) {
  const debit = parseCsvAmount(getMappedValue(row, mapping.debitColumn));
  const credit = parseCsvAmount(getMappedValue(row, mapping.creditColumn));

  if (debit !== null && credit !== null) {
    return {
      issue: "Row has both debit and credit amounts. Choose one amount source before import.",
      amount: 0,
      kind: "EXPENSE" as CsvTransactionKind,
    };
  }

  if (debit !== null) {
    return { amount: Math.abs(debit), kind: "EXPENSE" as CsvTransactionKind };
  }

  if (credit !== null) {
    return { amount: Math.abs(credit), kind: "INCOME" as CsvTransactionKind };
  }

  return { issue: "Row needs a valid debit or credit amount.", amount: 0, kind: "EXPENSE" as CsvTransactionKind };
}

function getSignedAmount(row: Record<string, unknown>, mapping: CsvColumnMapping) {
  const parsedAmount = parseCsvAmount(getMappedValue(row, mapping.amountColumn));

  if (parsedAmount === null) {
    return { issue: "Row needs a valid amount.", amount: 0, kind: "EXPENSE" as CsvTransactionKind };
  }

  const mappedKind = parseTransactionKind(getMappedValue(row, mapping.typeColumn));
  return {
    amount: Math.abs(parsedAmount),
    kind: mappedKind ?? (parsedAmount >= 0 ? "INCOME" : "EXPENSE"),
  };
}

export function buildMappedCsvPreviewRows(
  sourceRows: Record<string, unknown>[],
  mapping: CsvColumnMapping,
): MappedCsvPreviewResult {
  const rows = sourceRows.map((row, index) => {
    const issues: string[] = [];
    const date = normalizeCsvDate(getMappedValue(row, mapping.dateColumn));
    const title = normalizeImportedText(getMappedValue(row, mapping.descriptionColumn), 120);
    const amountResult =
      mapping.debitColumn || mapping.creditColumn ? getDebitCreditAmount(row, mapping) : getSignedAmount(row, mapping);

    if (!title) {
      issues.push("Row needs a description.");
    }

    if (!date) {
      issues.push("Row has an invalid date. Use YYYY-MM-DD.");
    }

    if (amountResult.issue) {
      issues.push(amountResult.issue);
    } else if (!isValidImportAmount(amountResult.amount)) {
      issues.push("Row has an invalid amount.");
    }

    return {
      rowNumber: index + 1,
      date: date ?? "",
      title,
      amount: amountResult.amount,
      kind: amountResult.kind,
      categoryName: normalizeImportedText(getMappedValue(row, mapping.categoryColumn), 48) || undefined,
      notes: normalizeImportedText(getMappedValue(row, mapping.notesColumn), 500) || undefined,
      paymentType: parseCsvPaymentType(getMappedValue(row, mapping.paymentMethodColumn)),
      issue: issues.length ? issues.join(" ") : undefined,
    };
  });

  return {
    rows,
    hasBlockingIssues: rows.some((row) => Boolean(row.issue)),
  };
}

export function validateCsvImportCategoryAssignment(
  row: CsvImportCategoryAssignment,
  category: CsvImportCategoryForValidation | undefined,
) {
  if (!row.categoryId) {
    return null;
  }

  const rowNumber = row.rowNumber ?? 1;

  if (!category) {
    return `Row ${rowNumber} uses a category that is not available for this account.`;
  }

  if (category.type !== row.kind) {
    return `Row ${rowNumber} uses a category that does not match its transaction type.`;
  }

  return null;
}
