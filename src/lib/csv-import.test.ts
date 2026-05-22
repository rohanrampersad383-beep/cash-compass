import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMappedCsvPreviewRows,
  suggestCsvMapping,
  validateCsvMapping,
  validateCsvImportCategoryAssignment,
  normalizeImportedText,
} from "@/lib/csv-import";

test("suggests common Date, Description, and Amount columns", () => {
  assert.deepEqual(
    suggestCsvMapping(["Posted Date", "Memo", "Amount"]),
    {
      dateColumn: "Posted Date",
      descriptionColumn: "Memo",
      amountColumn: "Amount",
    },
  );
});

test("maps signed amount rows into income and expense transactions", () => {
  const result = buildMappedCsvPreviewRows(
    [
      { Date: "2026-05-01", Description: "Salary", Amount: "1200" },
      { Date: "2026-05-02", Description: "Groceries", Amount: "-140.50" },
    ],
    { dateColumn: "Date", descriptionColumn: "Description", amountColumn: "Amount" },
  );

  assert.equal(result.hasBlockingIssues, false);
  assert.equal(result.rows[0].kind, "INCOME");
  assert.equal(result.rows[0].amount, 1200);
  assert.equal(result.rows[1].kind, "EXPENSE");
  assert.equal(result.rows[1].amount, 140.5);
});

test("maps debit and credit columns without double counting", () => {
  const result = buildMappedCsvPreviewRows(
    [
      { Date: "2026-05-01", Merchant: "Fuel", Debit: "300", Credit: "" },
      { Date: "2026-05-02", Merchant: "Client payment", Debit: "", Credit: "2500" },
      { Date: "2026-05-03", Merchant: "Ambiguous", Debit: "10", Credit: "20" },
    ],
    { dateColumn: "Date", descriptionColumn: "Merchant", debitColumn: "Debit", creditColumn: "Credit" },
  );

  assert.equal(result.rows[0].kind, "EXPENSE");
  assert.equal(result.rows[0].amount, 300);
  assert.equal(result.rows[1].kind, "INCOME");
  assert.equal(result.rows[1].amount, 2500);
  assert.equal(result.rows[2].issue, "Row has both debit and credit amounts. Choose one amount source before import.");
  assert.equal(result.hasBlockingIssues, true);
});

test("reports invalid dates, invalid amounts, and missing descriptions", () => {
  const result = buildMappedCsvPreviewRows(
    [{ Date: "05/01/2026", Description: "", Amount: "NaN" }],
    { dateColumn: "Date", descriptionColumn: "Description", amountColumn: "Amount" },
  );

  assert.equal(result.hasBlockingIssues, true);
  assert.match(result.rows[0].issue ?? "", /description/i);
  assert.match(result.rows[0].issue ?? "", /amount/i);
  assert.match(result.rows[0].issue ?? "", /date/i);
});

test("validates required mapping fields", () => {
  assert.equal(validateCsvMapping({ dateColumn: "Date", descriptionColumn: "Memo", amountColumn: "Amount" }), null);
  assert.equal(
    validateCsvMapping({ dateColumn: "Date", descriptionColumn: "Memo" }),
    "Map either an amount column or debit/credit columns before previewing.",
  );
});

test("neutralizes spreadsheet formula text", () => {
  assert.equal(normalizeImportedText("=IMPORTXML('x')", 120), "'=IMPORTXML('x')");
});

test("blocks CSV import category IDs that are not available to the current user", () => {
  assert.equal(
    validateCsvImportCategoryAssignment(
      { rowNumber: 4, kind: "EXPENSE", categoryId: "other-user-category" },
      undefined,
    ),
    "Row 4 uses a category that is not available for this account.",
  );
});

test("blocks CSV import category type mismatches", () => {
  assert.equal(
    validateCsvImportCategoryAssignment(
      { rowNumber: 5, kind: "INCOME", categoryId: "expense-category" },
      { id: "expense-category", type: "EXPENSE" },
    ),
    "Row 5 uses a category that does not match its transaction type.",
  );
});

test("allows CSV import categories owned by the user with the matching type", () => {
  assert.equal(
    validateCsvImportCategoryAssignment(
      { rowNumber: 6, kind: "EXPENSE", categoryId: "groceries-category" },
      { id: "groceries-category", type: "EXPENSE" },
    ),
    null,
  );
});
