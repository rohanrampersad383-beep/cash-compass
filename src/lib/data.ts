import { prisma } from "@/lib/prisma";

export async function getFinanceData(userId: string) {
  const [categories, transactions, incomes, expenses, bills, goals, statements] = await Promise.all([
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

  return { categories, transactions, incomes, expenses, bills, goals, statements };
}
