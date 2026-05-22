import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildAccountExport, createExportFileName } from "@/lib/data-export";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to export account data." }, { status: 401 });
  }

  const [categories, transactions, income, expenses, bills, budgets, savingsGoals, uploadedStatements] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        type: true,
        createdAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        amount: true,
        date: true,
        kind: true,
        notes: true,
        paymentType: true,
        isRecurring: true,
        categoryId: true,
        statementId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: {
        id: true,
        source: true,
        amount: true,
        date: true,
        notes: true,
        isRecurring: true,
        frequency: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: {
        id: true,
        merchant: true,
        amount: true,
        date: true,
        notes: true,
        paymentType: true,
        isRecurring: true,
        frequency: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.bill.findMany({
      where: { userId: user.id },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        name: true,
        amount: true,
        dueDate: true,
        frequency: true,
        status: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        limitAmount: true,
        period: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { targetDate: "asc" },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        color: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.uploadedStatement.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        rowCount: true,
        importedCount: true,
        uploadedAt: true,
      },
    }),
  ]);

  const exportedAt = new Date();
  const payload = buildAccountExport({
    exportedAt,
    user,
    categories,
    transactions,
    income,
    expenses,
    bills,
    budgets,
    savingsGoals,
    uploadedStatements,
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${createExportFileName(exportedAt)}"`,
      "Cache-Control": "no-store",
    },
  });
}
