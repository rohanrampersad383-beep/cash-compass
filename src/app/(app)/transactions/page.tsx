import { PageHeader } from "@/components/finance/page-header";
import { TransactionLedger } from "@/components/finance/transaction-ledger";
import { TransactionKind } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { normalizeCurrency, toNumber } from "@/lib/finance";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const categories = data.categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
  }));
  const transactions = [
    ...data.transactions.map((transaction) => ({
      id: transaction.id,
      source: "transaction" as const,
      sourceId: transaction.id,
      title: transaction.title,
      amount: toNumber(transaction.amount),
      date: transaction.date.toISOString(),
      kind: transaction.kind,
      paymentType: transaction.paymentType,
      isRecurring: transaction.isRecurring,
      notes: transaction.notes,
      category: transaction.category
        ? {
            id: transaction.category.id,
            name: transaction.category.name,
            type: transaction.category.type,
            color: transaction.category.color,
            icon: transaction.category.icon,
          }
        : null,
    })),
    ...data.incomes.map((income) => ({
      id: `income-${income.id}`,
      source: "income" as const,
      sourceId: income.id,
      title: income.source,
      amount: toNumber(income.amount),
      date: income.date.toISOString(),
      kind: TransactionKind.INCOME,
      paymentType: null,
      isRecurring: income.isRecurring,
      notes: income.notes,
      category: income.category
        ? {
            id: income.category.id,
            name: income.category.name,
            type: income.category.type,
            color: income.category.color,
            icon: income.category.icon,
          }
        : null,
    })),
    ...data.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      source: "expense" as const,
      sourceId: expense.id,
      title: expense.merchant,
      amount: toNumber(expense.amount),
      date: expense.date.toISOString(),
      kind: TransactionKind.EXPENSE,
      paymentType: expense.paymentType,
      isRecurring: expense.isRecurring,
      notes: expense.notes,
      category: expense.category
        ? {
            id: expense.category.id,
            name: expense.category.name,
            type: expense.category.type,
            color: expense.category.color,
            icon: expense.category.icon,
          }
        : null,
    })),
  ];

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <PageHeader
        title="Transactions"
        description="Your master ledger for income, expenses, bills, recurring money movement, and custom categories."
      />
      <TransactionLedger
        transactions={transactions}
        bills={data.bills.map((bill) => ({
          id: bill.id,
          name: bill.name,
          amount: toNumber(bill.amount),
          dueDate: bill.dueDate.toISOString(),
          frequency: bill.frequency,
          status: bill.status,
          categoryId: bill.categoryId,
          category: bill.category
            ? {
                id: bill.category.id,
                name: bill.category.name,
                type: bill.category.type,
                color: bill.category.color,
                icon: bill.category.icon,
              }
            : null,
        }))}
        categories={categories}
        currencyCode={currencyCode}
        initialIntent={params.intent}
      />
    </div>
  );
}
