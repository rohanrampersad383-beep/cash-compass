import { z } from "zod";
import { BillStatus, CategoryType, Frequency, PaymentType, TransactionKind } from "@/generated/prisma/client";
import { supportedCurrencyCodes } from "@/lib/finance";
import { isStrongPassword, PASSWORD_ERROR } from "@/lib/password-security";

const money = z.coerce.number().positive("Enter an amount greater than zero").max(1_000_000);
const dateString = z.string().min(1, "Choose a date").transform((value) => new Date(value));

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(10, PASSWORD_ERROR).max(128, "Use 128 characters or fewer.").refine(isStrongPassword, {
    message: PASSWORD_ERROR,
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const transactionSchema = z.object({
  title: z.string().trim().min(2).max(120),
  amount: money,
  date: dateString,
  kind: z.nativeEnum(TransactionKind),
  categoryId: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional(),
  paymentType: z.nativeEnum(PaymentType).optional().nullable(),
  isRecurring: z.coerce.boolean().optional().default(false),
});

export const incomeSchema = z.object({
  source: z.string().trim().min(2).max(120),
  amount: money,
  date: dateString,
  categoryId: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional(),
  isRecurring: z.coerce.boolean().optional().default(false),
  frequency: z.nativeEnum(Frequency).optional().default(Frequency.ONCE),
});

export const expenseSchema = z.object({
  merchant: z.string().trim().min(2).max(120),
  amount: money,
  date: dateString,
  categoryId: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional(),
  paymentType: z.nativeEnum(PaymentType).default(PaymentType.CARD),
  isRecurring: z.coerce.boolean().optional().default(false),
  frequency: z.nativeEnum(Frequency).optional().default(Frequency.ONCE),
});

export const billSchema = z.object({
  name: z.string().trim().min(2).max(120),
  amount: money,
  dueDate: dateString,
  categoryId: z.string().optional().nullable(),
  frequency: z.nativeEnum(Frequency).default(Frequency.MONTHLY),
  status: z.nativeEnum(BillStatus).default(BillStatus.UNPAID),
});

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(2).max(120),
  targetAmount: money,
  currentAmount: z.coerce.number().min(0).max(1_000_000),
  targetDate: dateString,
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#22c55e"),
});

export const budgetSchema = z.object({
  name: z.string().trim().min(2).max(120),
  limitAmount: money,
  categoryId: z.string().min(1, "Choose a category"),
  period: z.nativeEnum(Frequency).default(Frequency.MONTHLY),
});

export const settingsSchema = z.object({
  currencyCode: z.enum(supportedCurrencyCodes),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters").max(48),
  type: z.nativeEnum(CategoryType),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#14b8a6"),
  icon: z.string().trim().max(32).optional().default("tag"),
});
