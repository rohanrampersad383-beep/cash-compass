import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountExport, createExportFileName } from "@/lib/data-export";

test("builds a Cash Compass export without sensitive authentication fields", () => {
  const exported = buildAccountExport({
    exportedAt: new Date("2026-05-21T12:00:00.000Z"),
    user: {
      id: "user_1",
      name: "Asha Demo",
      email: "demo@financialtracks.dev",
      currencyCode: "TTD",
      passwordHash: "should-not-export",
      sessions: [{ sessionHash: "should-not-export" }],
    },
    categories: [{ id: "cat_1", userId: "user_1", name: "Groceries", type: "EXPENSE", color: "#22c55e", icon: "cart" }],
    transactions: [{ id: "txn_1", userId: "user_1", title: "Groceries", amount: "120.00" }],
    income: [],
    expenses: [],
    bills: [],
    budgets: [],
    savingsGoals: [],
    uploadedStatements: [],
  });

  const serialized = JSON.stringify(exported);

  assert.equal(exported.app, "Cash Compass");
  assert.equal(exported.exportedAt, "2026-05-21T12:00:00.000Z");
  assert.deepEqual(exported.user, {
    id: "user_1",
    name: "Asha Demo",
    email: "demo@financialtracks.dev",
    currency: "TTD",
  });
  assert.equal(exported.categories[0].name, "Groceries");
  assert.equal(serialized.includes("passwordHash"), false);
  assert.equal(serialized.includes("sessionHash"), false);
  assert.equal(serialized.includes("should-not-export"), false);
});

test("creates a dated JSON export filename", () => {
  assert.equal(createExportFileName(new Date("2026-05-21T23:59:00.000Z")), "cash-compass-export-2026-05-21.json");
});
