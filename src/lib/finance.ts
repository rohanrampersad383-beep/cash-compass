import { BillStatus, Frequency, TransactionKind } from "@/generated/prisma/browser";

export type MoneyLike = { toNumber?: () => number } | number | string;

export const supportedCurrencyCodes = [
  "TTD",
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "NZD",
  "JPY",
  "CNY",
  "INR",
  "SGD",
  "AED",
  "ZAR",
  "JMD",
  "BBD",
  "XCD",
] as const;
export type CurrencyCode = (typeof supportedCurrencyCodes)[number];

export const supportedCurrencies: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: "TTD", label: "Trinidad and Tobago dollar", locale: "en-TT" },
  { code: "USD", label: "US dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "en-IE" },
  { code: "GBP", label: "British pound", locale: "en-GB" },
  { code: "CAD", label: "Canadian dollar", locale: "en-CA" },
  { code: "AUD", label: "Australian dollar", locale: "en-AU" },
  { code: "NZD", label: "New Zealand dollar", locale: "en-NZ" },
  { code: "JPY", label: "Japanese yen", locale: "ja-JP" },
  { code: "CNY", label: "Chinese yuan", locale: "zh-CN" },
  { code: "INR", label: "Indian rupee", locale: "en-IN" },
  { code: "SGD", label: "Singapore dollar", locale: "en-SG" },
  { code: "AED", label: "UAE dirham", locale: "en-AE" },
  { code: "ZAR", label: "South African rand", locale: "en-ZA" },
  { code: "JMD", label: "Jamaican dollar", locale: "en-JM" },
  { code: "BBD", label: "Barbadian dollar", locale: "en-BB" },
  { code: "XCD", label: "East Caribbean dollar", locale: "en-AG" },
];

const currencyMeta = new Map(supportedCurrencies.map((item) => [item.code, item]));

export function toNumber(value: MoneyLike) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber?.() ?? Number(value);
}

export function normalizeCurrency(value?: string | null): CurrencyCode {
  return supportedCurrencyCodes.includes(value as CurrencyCode) ? (value as CurrencyCode) : "TTD";
}

export function currency(value: number, currencyCode: CurrencyCode = "TTD") {
  const locale = currencyMeta.get(currencyCode)?.locale ?? "en-TT";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactCurrency(value: number, currencyCode: CurrencyCode = "TTD") {
  const locale = currencyMeta.get(currencyCode)?.locale ?? "en-TT";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    notation: "compact",
    maximumFractionDigits: 1,
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
    category?: { id?: string; name: string; color: string } | null;
  }[];
  bills: { id: string; amount: MoneyLike; dueDate: Date; frequency: Frequency; status: BillStatus; name: string; categoryId?: string | null; category?: { id?: string; name: string; color?: string; icon?: string; type?: unknown } | null }[];
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

export type BudgetHealth = "Safe" | "Watch" | "Over Budget";

export function budgetHealth(percentUsed: number): BudgetHealth {
  if (percentUsed >= 100) {
    return "Over Budget";
  }

  if (percentUsed >= 80) {
    return "Watch";
  }

  return "Safe";
}

export function buildBudgetSummary({
  budgets,
  transactions,
  bills,
}: {
  budgets: {
    id: string;
    name: string;
    limitAmount: MoneyLike;
    period: Frequency;
    categoryId?: string | null;
    category?: { id: string; name: string; color: string; icon?: string; type?: unknown } | null;
  }[];
  transactions: {
    amount: MoneyLike;
    date: Date;
    kind: TransactionKind;
    categoryId?: string | null;
  }[];
  bills: {
    amount: MoneyLike;
    dueDate: Date;
    categoryId?: string | null;
  }[];
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const inCurrentMonth = (date: Date) => date >= monthStart && date <= monthEnd;

  const items = budgets.map((budget) => {
    const spentFromTransactions = sum(
      transactions
        .filter(
          (transaction) =>
            transaction.kind === TransactionKind.EXPENSE &&
            transaction.categoryId === budget.categoryId &&
            inCurrentMonth(transaction.date),
        )
        .map((transaction) => transaction.amount),
    );
    const reservedFromBills = sum(
      bills
        .filter((bill) => bill.categoryId === budget.categoryId && inCurrentMonth(bill.dueDate))
        .map((bill) => bill.amount),
    );
    const limit = toNumber(budget.limitAmount);
    const spent = spentFromTransactions + reservedFromBills;
    const percentUsed = limit > 0 ? Math.min(140, (spent / limit) * 100) : 0;

    return {
      ...budget,
      limit,
      spent,
      remaining: limit - spent,
      percentUsed,
      health: budgetHealth(percentUsed),
    };
  });

  const totalLimit = sum(items.map((item) => item.limit));
  const totalSpent = sum(items.map((item) => item.spent));
  const overCount = items.filter((item) => item.health === "Over Budget").length;
  const watchCount = items.filter((item) => item.health === "Watch").length;

  return {
    items,
    totalLimit,
    totalSpent,
    totalRemaining: totalLimit - totalSpent,
    percentUsed: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
    overCount,
    watchCount,
    status: overCount > 0 ? "Over Budget" : watchCount > 0 ? "Watch" : "Safe",
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
