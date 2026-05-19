import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, CalendarClock, Target } from "lucide-react";
import { BillStatus, TransactionKind } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, toNumber, type CurrencyCode, type MoneyLike } from "@/lib/finance";
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
    <Card className="glass-panel">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
                      <div>
                        <p className="font-medium">{transaction.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.paymentType?.replaceAll("_", " ").toLowerCase() ?? "ledger"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{transaction.category?.name ?? "Uncategorized"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(transaction.date, "MMM d, yyyy")}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
}

export function BillsList({
  bills,
  currencyCode = "TTD",
}: {
  bills: {
    id: string;
    name: string;
    amount: MoneyLike;
    dueDate: Date;
    status: BillStatus;
    category?: { name: string } | null;
  }[];
  currencyCode?: CurrencyCode;
}) {
  return (
    <Card className="glass-panel">
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
              className="flex items-center justify-between rounded-xl border bg-background/50 p-3 transition hover:border-primary/35 hover:bg-accent/20"
            >
              <div>
                <p className="font-medium">{bill.name}</p>
                <p className="text-sm text-muted-foreground">
                  {bill.category?.name ?? "Bill"} - due {format(bill.dueDate, "MMM d")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{currency(toNumber(bill.amount), currencyCode)}</p>
                <Badge variant={bill.status === BillStatus.PAID ? "secondary" : "outline"}>
                  {bill.status.toLowerCase()}
                </Badge>
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
    <Card className="glass-panel">
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
                className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/35 hover:bg-accent/20"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">Target {format(goal.targetDate, "MMM yyyy")}</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {currency(toNumber(goal.currentAmount), currencyCode)} /{" "}
                    {currency(toNumber(goal.targetAmount), currencyCode)}
                  </p>
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
