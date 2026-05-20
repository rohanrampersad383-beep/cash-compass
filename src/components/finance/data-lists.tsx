import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, CalendarClock, Gauge, Target } from "lucide-react";
import { BillStatus, Frequency, TransactionKind } from "@/generated/prisma/client";
import type { CategoryOption } from "@/components/finance/category-picker";
import { RecordActions } from "@/components/finance/record-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, toNumber, type BudgetHealth, type CurrencyCode, type MoneyLike } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function TransactionsTable({
  transactions,
  currencyCode = "TTD",
}: {
  transactions: {
    id: string;
    title: string;
    amount: MoneyLike;
    date: Date;
    kind: TransactionKind;
    category?: { name: string; color: string } | null;
    paymentType?: string | null;
  }[];
  currencyCode?: CurrencyCode;
}) {
  return (
    <Card className="glass-panel premium-glow spotlight-card">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Every row is scoped to your account session.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <Empty className="border bg-background/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ArrowDownRight />
              </EmptyMedia>
              <EmptyTitle>No transactions yet</EmptyTitle>
              <EmptyDescription>Add a transaction or import a CSV statement to start tracking.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full table-fixed sm:min-w-[34rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-24 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-9 items-center justify-center rounded-lg",
                            transaction.kind === TransactionKind.INCOME
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400",
                          )}
                          aria-hidden="true"
                        >
                          {transaction.kind === TransactionKind.INCOME ? <ArrowUpRight /> : <ArrowDownRight />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{transaction.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.paymentType?.replaceAll("_", " ").toLowerCase() ?? "ledger"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{transaction.category?.name ?? "Uncategorized"}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {format(transaction.date, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        transaction.kind === TransactionKind.INCOME ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {transaction.kind === TransactionKind.INCOME ? "+" : "-"}
                      {currency(toNumber(transaction.amount), currencyCode)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BillsList({
  bills,
  categories = [],
  currencyCode = "TTD",
}: {
  bills: {
    id: string;
    name: string;
    amount: MoneyLike;
    dueDate: Date;
    frequency: Frequency;
    status: BillStatus;
    categoryId?: string | null;
    category?: { name: string } | null;
  }[];
  categories?: CategoryOption[];
  currencyCode?: CurrencyCode;
}) {
  return (
    <Card className="glass-panel premium-glow spotlight-card">
      <CardHeader>
        <CardTitle>Upcoming bills</CardTitle>
        <CardDescription>Stay ahead of subscriptions and due dates.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {bills.length === 0 ? (
          <Empty className="border bg-background/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClock />
              </EmptyMedia>
              <EmptyTitle>No upcoming bills</EmptyTitle>
              <EmptyDescription>Add rent, utilities, phone, or subscription bills to stay ahead.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="premium-glow flex flex-col gap-3 rounded-xl border bg-background/50 p-3 transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{bill.name}</p>
                <p className="text-sm text-muted-foreground">
                  {bill.category?.name ?? "Bill"} - due {format(bill.dueDate, "MMM d")}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-right">
                  <p className="font-semibold">{currency(toNumber(bill.amount), currencyCode)}</p>
                  <Badge variant={bill.status === BillStatus.PAID ? "secondary" : "outline"}>
                    {bill.status.toLowerCase()}
                  </Badge>
                </div>
                <RecordActions
                  kind="bill"
                  categories={categories}
                  record={{
                    id: bill.id,
                    name: bill.name,
                    amount: toNumber(bill.amount),
                    dueDate: toDateInputValue(bill.dueDate),
                    frequency: bill.frequency,
                    status: bill.status,
                    categoryId: bill.categoryId,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function GoalsList({
  goals,
  currencyCode = "TTD",
}: {
  goals: {
    id: string;
    name: string;
    targetAmount: MoneyLike;
    currentAmount: MoneyLike;
    targetDate: Date;
    color: string;
  }[];
  currencyCode?: CurrencyCode;
}) {
  return (
    <Card className="glass-panel premium-glow spotlight-card">
      <CardHeader>
        <CardTitle>Savings goals</CardTitle>
        <CardDescription>Progress that feels visible and achievable.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {goals.length === 0 ? (
          <Empty className="border bg-background/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Target />
              </EmptyMedia>
              <EmptyTitle>No savings goals yet</EmptyTitle>
              <EmptyDescription>Create a goal for an emergency fund, carnival trip, or home deposit.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          goals.map((goal) => {
            const progress = Math.min(100, (toNumber(goal.currentAmount) / toNumber(goal.targetAmount)) * 100);
            return (
              <div
                key={goal.id}
                className="premium-glow spotlight-card rounded-xl border bg-background/50 p-4 transition hover:-translate-y-1 hover:border-primary/45 hover:bg-accent/25"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">Target {format(goal.targetDate, "MMM yyyy")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-right text-sm font-semibold">
                      {currency(toNumber(goal.currentAmount), currencyCode)} /{" "}
                      {currency(toNumber(goal.targetAmount), currencyCode)}
                    </p>
                    <RecordActions
                      kind="goal"
                      record={{
                        id: goal.id,
                        name: goal.name,
                        targetAmount: toNumber(goal.targetAmount),
                        currentAmount: toNumber(goal.currentAmount),
                        targetDate: toDateInputValue(goal.targetDate),
                        color: goal.color,
                      }}
                    />
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {Math.round(progress)}% funded. Keep the streak going.
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

const budgetTone: Record<BudgetHealth, string> = {
  Safe: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  Watch: "border-amber-400/25 bg-amber-500/10 text-amber-300",
  "Over Budget": "border-rose-400/25 bg-rose-500/10 text-rose-300",
};

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function BudgetsList({
  budgets,
  categories = [],
  currencyCode = "TTD",
}: {
  budgets: {
    id: string;
    name: string;
    limitAmount: MoneyLike;
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    health: BudgetHealth;
    period: Frequency;
    categoryId?: string | null;
    category?: { name: string; color?: string } | null;
  }[];
  categories?: CategoryOption[];
  currencyCode?: CurrencyCode;
}) {
  return (
    <Card className="glass-panel premium-glow spotlight-card">
      <CardHeader>
        <CardTitle>Monthly budgets</CardTitle>
        <CardDescription>Category limits with bill reserves included where applicable.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {budgets.length === 0 ? (
          <Empty className="border bg-background/40 md:col-span-2">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Gauge />
              </EmptyMedia>
              <EmptyTitle>No budgets yet</EmptyTitle>
              <EmptyDescription>Create budgets for groceries, utilities, transport, subscriptions, or rent.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          budgets.map((budget) => {
            const progress = Math.min(100, budget.percentUsed);
            return (
              <div
                key={budget.id}
                className="group premium-glow spotlight-card rounded-xl border bg-background/50 p-4 transition hover:-translate-y-1 hover:border-primary/45 hover:bg-accent/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{budget.name}</p>
                    <p className="text-sm text-muted-foreground">{budget.category?.name ?? "Budget category"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={budgetTone[budget.health]}>
                      {budget.health}
                    </Badge>
                    <RecordActions
                      kind="budget"
                      categories={categories}
                      record={{
                        id: budget.id,
                        name: budget.name,
                        limitAmount: toNumber(budget.limitAmount),
                        categoryId: budget.categoryId,
                        period: budget.period,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold">{currency(budget.spent, currencyCode)}</p>
                  <p className="text-sm text-muted-foreground">of {currency(budget.limit, currencyCode)}</p>
                </div>
                <Progress value={progress} className="mt-4 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {budget.remaining >= 0
                    ? `${currency(budget.remaining, currencyCode)} remaining this month.`
                    : `${currency(Math.abs(budget.remaining), currencyCode)} over budget.`}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
