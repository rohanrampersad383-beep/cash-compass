import { prisma } from "@/lib/prisma";
import { TransactionKind } from "@/generated/prisma/client";

export async function getFinanceData(userId: string) {
  const [categories, transactions, incomes, expenses, bills, budgets, goals, statements] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.income.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.bill.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { targetDate: "asc" },
    }),
    prisma.uploadedStatement.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      take: 8,
    }),
  ]);

  const ledgerTransactions = [
    ...transactions,
    ...incomes.map((income) => ({
      id: `income-${income.id}`,
      title: income.source,
      amount: income.amount,
      date: income.date,
      kind: TransactionKind.INCOME,
      notes: income.notes,
      paymentType: null,
      isRecurring: income.isRecurring,
      userId: income.userId,
      categoryId: income.categoryId,
      statementId: null,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
      category: income.category,
      statement: null,
    })),
    ...expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      title: expense.merchant,
      amount: expense.amount,
      date: expense.date,
      kind: TransactionKind.EXPENSE,
      notes: expense.notes,
      paymentType: expense.paymentType,
      isRecurring: expense.isRecurring,
      userId: expense.userId,
      categoryId: expense.categoryId,
      statementId: null,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      category: expense.category,
      statement: null,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return { categories, transactions, ledgerTransactions, incomes, expenses, bills, budgets, goals, statements };
}
