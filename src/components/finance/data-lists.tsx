import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BillStatus, TransactionKind } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, toNumber, type MoneyLike } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function TransactionsTable({
  transactions,
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
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Every row is scoped to your account session.</CardDescription>
      </CardHeader>
      <CardContent>
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
                    >
                      {transaction.kind === TransactionKind.INCOME ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.title}</p>
                      <p className="text-xs text-muted-foreground">{transaction.paymentType?.replaceAll("_", " ").toLowerCase() ?? "ledger"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{transaction.category?.name ?? "Uncategorized"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{format(transaction.date, "MMM d, yyyy")}</TableCell>
                <TableCell className={cn("text-right font-semibold", transaction.kind === TransactionKind.INCOME ? "text-emerald-400" : "text-rose-400")}>
                  {transaction.kind === TransactionKind.INCOME ? "+" : "-"}
                  {currency(toNumber(transaction.amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function BillsList({
  bills,
}: {
  bills: {
    id: string;
    name: string;
    amount: MoneyLike;
    dueDate: Date;
    status: BillStatus;
    category?: { name: string } | null;
  }[];
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Upcoming bills</CardTitle>
        <CardDescription>Stay ahead of subscriptions and due dates.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {bills.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between rounded-xl border bg-background/50 p-3">
            <div>
              <p className="font-medium">{bill.name}</p>
              <p className="text-sm text-muted-foreground">
                {bill.category?.name ?? "Bill"} · due {format(bill.dueDate, "MMM d")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{currency(toNumber(bill.amount))}</p>
              <Badge variant={bill.status === BillStatus.PAID ? "secondary" : "outline"}>{bill.status.toLowerCase()}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GoalsList({
  goals,
}: {
  goals: {
    id: string;
    name: string;
    targetAmount: MoneyLike;
    currentAmount: MoneyLike;
    targetDate: Date;
    color: string;
  }[];
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Savings goals</CardTitle>
        <CardDescription>Progress that feels visible and achievable.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {goals.map((goal) => {
          const progress = Math.min(100, (toNumber(goal.currentAmount) / toNumber(goal.targetAmount)) * 100);
          return (
            <div key={goal.id} className="rounded-xl border bg-background/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{goal.name}</p>
                  <p className="text-sm text-muted-foreground">Target {format(goal.targetDate, "MMM yyyy")}</p>
                </div>
                <p className="text-sm font-semibold">{currency(toNumber(goal.currentAmount))} / {currency(toNumber(goal.targetAmount))}</p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">{Math.round(progress)}% funded. Keep the streak going.</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
