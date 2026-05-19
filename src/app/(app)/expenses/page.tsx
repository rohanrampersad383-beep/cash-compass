import { CategoryType } from "@/generated/prisma/client";
import { ExpenseForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { currency, normalizeCurrency, toNumber } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function ExpensesPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);

  return (
    <div className="grid gap-6">
      <PageHeader title="Expenses" description="Add everyday spending with category, payment type, and recurring context." />
      <ExpenseForm categories={data.categories.filter((category) => category.type === CategoryType.EXPENSE)} />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Expense log</CardTitle>
          <CardDescription>Recent manually tracked expenses.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.expenses.length === 0 ? (
            <Empty className="border bg-background/40 md:col-span-2">
              <EmptyHeader>
                <EmptyTitle>No expenses yet</EmptyTitle>
                <EmptyDescription>Add groceries, gas, rent, subscriptions, or import a CSV statement.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            data.expenses.map((expense) => (
              <div key={expense.id} className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/35 hover:bg-accent/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{expense.merchant}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.category?.name ?? "Expense"} - {expense.date.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{expense.paymentType.replaceAll("_", " ").toLowerCase()}</Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold text-rose-400">{currency(toNumber(expense.amount), currencyCode)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
