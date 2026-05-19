import { CategoryType } from "@/generated/prisma/client";
import { IncomeForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { currency, normalizeCurrency, toNumber } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function IncomePage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);

  return (
    <div className="grid gap-6">
      <PageHeader title="Income" description="Track each source of money, whether recurring or one-time." />
      <IncomeForm categories={data.categories.filter((category) => category.type === CategoryType.INCOME)} />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Income sources</CardTitle>
          <CardDescription>Recent deposits and recurring money streams.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.incomes.length === 0 ? (
            <Empty className="border bg-background/40 md:col-span-2">
              <EmptyHeader>
                <EmptyTitle>No income sources yet</EmptyTitle>
                <EmptyDescription>Add salary, freelance, refunds, or other deposits to start tracking.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            data.incomes.map((income) => (
              <div key={income.id} className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/35 hover:bg-accent/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{income.source}</p>
                    <p className="text-sm text-muted-foreground">
                      {income.category?.name ?? "Income"} - {income.date.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{income.frequency.toLowerCase()}</Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold text-emerald-400">{currency(toNumber(income.amount), currencyCode)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
