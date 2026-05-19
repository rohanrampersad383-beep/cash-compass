import { BillStatus, TransactionKind } from "@/generated/prisma/browser";

export type MoneyLike = { toNumber?: () => number } | number | string;

export function toNumber(value: MoneyLike) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber?.() ?? Number(value);
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function previousMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

export function buildFinanceSummary({
  transactions,
  bills,
  goals,
}: {
  transactions: {
    amount: MoneyLike;
    date: Date;
    kind: TransactionKind;
    category?: { name: string; color: string } | null;
  }[];
  bills: { id: string; amount: MoneyLike; dueDate: Date; status: BillStatus; name: string; category?: { name: string } | null }[];
  goals: { id: string; targetAmount: MoneyLike; currentAmount: MoneyLike; name: string }[];
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const previous = previousMonthRange(now);

  const inRange = (date: Date, start: Date, end: Date) => date >= start && date <= end;
  const monthlyTransactions = transactions.filter((item) => inRange(item.date, monthStart, monthEnd));
  const previousTransactions = transactions.filter((item) => inRange(item.date, previous.start, previous.end));

  const monthlyIncome = sum(
    monthlyTransactions.filter((item) => item.kind === TransactionKind.INCOME).map((item) => item.amount),
  );
  const monthlyExpenses = sum(
    monthlyTransactions.filter((item) => item.kind === TransactionKind.EXPENSE).map((item) => item.amount),
  );
  const previousExpenses = sum(
    previousTransactions.filter((item) => item.kind === TransactionKind.EXPENSE).map((item) => item.amount),
  );
  const totalBalance =
    sum(transactions.filter((item) => item.kind === TransactionKind.INCOME).map((item) => item.amount)) -
    sum(transactions.filter((item) => item.kind === TransactionKind.EXPENSE).map((item) => item.amount));
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  const categoryTotals = monthlyTransactions
    .filter((item) => item.kind === TransactionKind.EXPENSE)
    .reduce<Record<string, { name: string; value: number; color: string }>>((acc, item) => {
      const name = item.category?.name ?? "Uncategorized";
      acc[name] ??= { name, value: 0, color: item.category?.color ?? "#94a3b8" };
      acc[name].value += toNumber(item.amount);
      return acc;
    }, {});

  const spendingByCategory = Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  const highestCategory = spendingByCategory[0];
  const expenseDelta =
    previousExpenses > 0 ? ((monthlyExpenses - previousExpenses) / previousExpenses) * 100 : 0;

  const upcomingBills = bills
    .filter((bill) => bill.status === BillStatus.UNPAID && bill.dueDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const goalProgress = goals.map((goal) => ({
    ...goal,
    progress: Math.min(100, (toNumber(goal.currentAmount) / toNumber(goal.targetAmount)) * 100),
  }));

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    spendingByCategory,
    highestCategory,
    expenseDelta,
    upcomingBills,
    goalProgress,
  };
}

export function sum(values: MoneyLike[]): number {
  return values.reduce<number>((total, value) => total + toNumber(value), 0);
}

export function monthlyChartData(
  transactions: { amount: MoneyLike; date: Date; kind: TransactionKind }[],
  months = 6,
) {
  const now = new Date();
  const buckets = Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString("en-US", { month: "short" }),
      income: 0,
      expenses: 0,
      savings: 0,
    };
  });

  for (const transaction of transactions) {
    const key = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (!bucket) {
      continue;
    }
    if (transaction.kind === TransactionKind.INCOME) {
      bucket.income += toNumber(transaction.amount);
    } else {
      bucket.expenses += toNumber(transaction.amount);
    }
    bucket.savings = bucket.income - bucket.expenses;
  }

  return buckets;
}
