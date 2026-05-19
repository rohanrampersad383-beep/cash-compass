import { CategoryType } from "@/generated/prisma/client";
import { ExpenseForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currency, toNumber } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function ExpensesPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);

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
          {data.expenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border bg-background/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{expense.merchant}</p>
                  <p className="text-sm text-muted-foreground">{expense.category?.name ?? "Expense"} · {expense.date.toLocaleDateString()}</p>
                </div>
                <Badge variant="outline">{expense.paymentType.replaceAll("_", " ").toLowerCase()}</Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold text-rose-400">{currency(toNumber(expense.amount))}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
