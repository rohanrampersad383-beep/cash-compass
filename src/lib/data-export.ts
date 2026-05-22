const SENSITIVE_EXPORT_KEYS = new Set(["passwordHash", "sessionHash", "sessions"]);

type ExportInput = {
  exportedAt?: Date;
  user: Record<string, unknown>;
  categories: unknown[];
  transactions: unknown[];
  income: unknown[];
  expenses: unknown[];
  bills: unknown[];
  budgets: unknown[];
  savingsGoals: unknown[];
  uploadedStatements: unknown[];
};

type SerializedExportRecord = Record<string, unknown>;

function serializeExportValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeExportValue);
  }

  if (value && typeof value === "object") {
    if ("toJSON" in value && typeof value.toJSON === "function") {
      return value.toJSON();
    }

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_EXPORT_KEYS.has(key))
        .map(([key, nestedValue]) => [key, serializeExportValue(nestedValue)]),
    );
  }

  return value;
}

export function createExportFileName(date = new Date()) {
  return `cash-compass-export-${date.toISOString().slice(0, 10)}.json`;
}

export function buildAccountExport(input: ExportInput) {
  const exportedAt = input.exportedAt ?? new Date();

  return {
    exportedAt: exportedAt.toISOString(),
    app: "Cash Compass",
    user: {
      id: input.user.id,
      name: input.user.name,
      email: input.user.email,
      currency: input.user.currencyCode,
    },
    categories: serializeExportValue(input.categories) as SerializedExportRecord[],
    transactions: serializeExportValue(input.transactions) as SerializedExportRecord[],
    income: serializeExportValue(input.income) as SerializedExportRecord[],
    expenses: serializeExportValue(input.expenses) as SerializedExportRecord[],
    bills: serializeExportValue(input.bills) as SerializedExportRecord[],
    budgets: serializeExportValue(input.budgets) as SerializedExportRecord[],
    savingsGoals: serializeExportValue(input.savingsGoals) as SerializedExportRecord[],
    uploadedStatements: serializeExportValue(input.uploadedStatements) as SerializedExportRecord[],
  };
}
