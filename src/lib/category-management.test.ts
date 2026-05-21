import assert from "node:assert/strict";
import test from "node:test";
import { categoryDeletionBlockReason } from "@/lib/category-management";

test("allows deleting a category with no linked finance records", () => {
  assert.equal(
    categoryDeletionBlockReason({
      transactions: 0,
      incomes: 0,
      expenses: 0,
      bills: 0,
      budgets: 0,
    }),
    null,
  );
});

test("blocks deleting a category used by finance records", () => {
  assert.equal(
    categoryDeletionBlockReason({
      transactions: 1,
      incomes: 0,
      expenses: 0,
      bills: 0,
      budgets: 0,
    }),
    "This category is currently used by existing records. Reassign or remove those records before deleting it.",
  );
});
