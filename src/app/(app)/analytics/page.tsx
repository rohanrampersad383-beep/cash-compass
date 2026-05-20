import { IncomeExpenseChart, SavingsTrendChart, SpendingChart } from "@/components/finance/charts";
import { PageHeader } from "@/components/finance/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFinanceSummary, currency, monthlyChartData, normalizeCurrency, percent, toNumber } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const ledgerData = { ...data, transactions: data.ledgerTransactions };
  const summary = buildFinanceSummary(ledgerData);
  const monthlyData = monthlyChartData(data.ledgerTransactions);

  return (
    <div className="grid gap-6">
      <PageHeader title="Analytics" description="Readable charts and plain-language insights for monthly habits." />
      <div className="grid gap-6 xl:grid-cols-2">
        <IncomeExpenseChart data={monthlyData} currencyCode={currencyCode} />
        <SpendingChart data={summary.spendingByCategory} currencyCode={currencyCode} />
      </div>
      <SavingsTrendChart data={monthlyData} currencyCode={currencyCode} />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Simple insights</CardTitle>
          <CardDescription>Rule-based assistant logic that can later be swapped for an AI model.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Insight text={`Your highest spending category this month is ${summary.highestCategory?.name ?? "not available yet"}.`} />
          <Insight text={`You saved ${percent(summary.savingsRate)} of your income this month.`} />
          <Insight text={`Expenses are ${Math.abs(Math.round(summary.expenseDelta))}% ${summary.expenseDelta >= 0 ? "higher" : "lower"} than last month.`} />
          <Insight text={`Upcoming unpaid bills total ${currency(summary.upcomingBills.reduce((total, bill) => total + toNumber(bill.amount), 0), currencyCode)}.`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Insight({ text }: { text: string }) {
  return <div className="rounded-xl border bg-background/50 p-4 text-sm text-muted-foreground">{text}</div>;
}
