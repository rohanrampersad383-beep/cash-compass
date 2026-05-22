import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowOnboarding } from "@/lib/onboarding";

test("shows onboarding for a user with no finance records", () => {
  assert.equal(
    shouldShowOnboarding({
      transactions: 0,
      bills: 0,
      budgets: 0,
      savingsGoals: 0,
      uploadedStatements: 0,
    }),
    true,
  );
});

test("hides onboarding when the user has any transaction activity", () => {
  assert.equal(
    shouldShowOnboarding({
      transactions: 1,
      bills: 0,
      budgets: 0,
      savingsGoals: 0,
      uploadedStatements: 0,
    }),
    false,
  );
});

test("hides onboarding when setup records already exist without transactions", () => {
  assert.equal(
    shouldShowOnboarding({
      transactions: 0,
      bills: 1,
      budgets: 1,
      savingsGoals: 1,
      uploadedStatements: 0,
    }),
    false,
  );
});
