import assert from "node:assert/strict";
import test from "node:test";
import { PaymentType, TransactionKind } from "@/generated/prisma/client";
import { billSchema, budgetSchema, transactionSchema } from "@/lib/validations";

test("transaction validation rejects zero, negative, and oversized amounts", () => {
  const base = {
    title: "Groceries",
    date: "2026-05-21",
    kind: TransactionKind.EXPENSE,
    paymentType: PaymentType.CARD,
  };

  assert.equal(transactionSchema.safeParse({ ...base, amount: 0 }).success, false);
  assert.equal(transactionSchema.safeParse({ ...base, amount: -10 }).success, false);
  assert.equal(transactionSchema.safeParse({ ...base, amount: 1_000_001 }).success, false);
});

test("transaction validation rejects invalid transaction kinds", () => {
  const parsed = transactionSchema.safeParse({
    title: "Groceries",
    amount: 100,
    date: "2026-05-21",
    kind: "TRANSFER",
    paymentType: PaymentType.CARD,
  });

  assert.equal(parsed.success, false);
});

test("budget validation requires a category and positive monthly limit", () => {
  assert.equal(
    budgetSchema.safeParse({
      name: "Groceries budget",
      limitAmount: 500,
      categoryId: "",
    }).success,
    false,
  );
  assert.equal(
    budgetSchema.safeParse({
      name: "Groceries budget",
      limitAmount: 0,
      categoryId: "category_1",
    }).success,
    false,
  );
});

test("bill validation rejects invalid dates and amounts", () => {
  assert.equal(
    billSchema.safeParse({
      name: "T&TEC electricity",
      amount: 120,
      dueDate: "",
      categoryId: "bill_category",
    }).success,
    false,
  );
  assert.equal(
    billSchema.safeParse({
      name: "T&TEC electricity",
      amount: Number.POSITIVE_INFINITY,
      dueDate: "2026-05-21",
      categoryId: "bill_category",
    }).success,
    false,
  );
});
