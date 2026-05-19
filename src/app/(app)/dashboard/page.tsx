import { Banknote, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { IncomeExpenseChart, SpendingChart } from "@/components/finance/charts";
import { BillsList, GoalsList, TransactionsTable } from "@/components/finance/data-lists";
import { MetricCard } from "@/components/finance/metric-card";
import { PageHeader } from "@/components/finance/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFinanceSummary, currency, monthlyChartData, percent } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const summary = buildFinanceSummary(data);
  const monthlyData = monthlyChartData(data.transactions);

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="A beginner-friendly snapshot of what came in, what went out, and what is coming next."
        badge={`${percent(summary.savingsRate)} savings rate`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total balance" value={summary.totalBalance} helper="All tracked income minus expenses" icon={Wallet} />
        <MetricCard title="Monthly income" value={summary.monthlyIncome} helper="This month across all sources" icon={Banknote} tone="cyan" />
        <MetricCard title="Monthly expenses" value={summary.monthlyExpenses} helper="Manual and imported spending" icon={CreditCard} tone="rose" />
        <MetricCard title="Monthly savings" value={summary.monthlySavings} helper="Income left after expenses" icon={PiggyBank} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <IncomeExpenseChart data={monthlyData} />
        <SpendingChart data={summary.spendingByCategory} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <TransactionsTable transactions={data.transactions.slice(0, 7)} />
        <div className="grid gap-6">
          <BillsList bills={summary.upcomingBills} />
          <GoalsList goals={data.goals} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Insight title="Highest category" value={summary.highestCategory?.name ?? "None yet"} detail={`${currency(summary.highestCategory?.value ?? 0)} this month`} />
        <Insight title="Savings health" value={percent(summary.savingsRate)} detail="of income saved this month" />
        <Insight
          title="Expense movement"
          value={`${summary.expenseDelta >= 0 ? "+" : ""}${Math.round(summary.expenseDelta)}%`}
          detail="compared with last month"
        />
      </div>
    </div>
  );
}

function Insight({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}
