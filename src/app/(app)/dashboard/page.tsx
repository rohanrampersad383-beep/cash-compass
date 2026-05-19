import Link from "next/link";
import { Banknote, CreditCard, FileSpreadsheet, PiggyBank, Plus, ReceiptText, Wallet, type LucideIcon } from "lucide-react";
import { IncomeExpenseChart, SpendingChart } from "@/components/finance/charts";
import { BillsList, GoalsList, TransactionsTable } from "@/components/finance/data-lists";
import { MetricCard } from "@/components/finance/metric-card";
import { PageHeader } from "@/components/finance/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFinanceSummary, currency, monthlyChartData, normalizeCurrency, percent } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const summary = buildFinanceSummary(data);
  const monthlyData = monthlyChartData(data.transactions);

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="A beginner-friendly snapshot of what came in, what went out, and what is coming next."
        badge={`${percent(summary.savingsRate)} savings rate`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction href="/income" label="Add income" detail="Salary, freelance, refunds" icon={Banknote} />
        <QuickAction href="/expenses" label="Add expense" detail="Groceries, gas, transport" icon={CreditCard} />
        <QuickAction href="/bills" label="Add bill" detail="T&TEC, WASA, phone" icon={ReceiptText} />
        <QuickAction href="/statement-upload" label="Import CSV" detail="Manual bank statement upload" icon={FileSpreadsheet} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total balance" value={summary.totalBalance} helper="All tracked income minus expenses" icon={Wallet} currencyCode={currencyCode} />
        <MetricCard title="Monthly income" value={summary.monthlyIncome} helper="This month across all sources" icon={Banknote} tone="cyan" currencyCode={currencyCode} />
        <MetricCard title="Monthly expenses" value={summary.monthlyExpenses} helper="Manual and imported spending" icon={CreditCard} tone="rose" currencyCode={currencyCode} />
        <MetricCard title="Monthly savings" value={summary.monthlySavings} helper="Income left after expenses" icon={PiggyBank} tone="amber" currencyCode={currencyCode} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <IncomeExpenseChart data={monthlyData} currencyCode={currencyCode} />
        <SpendingChart data={summary.spendingByCategory} currencyCode={currencyCode} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <TransactionsTable transactions={data.transactions.slice(0, 7)} currencyCode={currencyCode} />
        <div className="grid gap-6">
          <BillsList bills={summary.upcomingBills} currencyCode={currencyCode} />
          <GoalsList goals={data.goals} currencyCode={currencyCode} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Insight title="Highest category" value={summary.highestCategory?.name ?? "None yet"} detail={`${currency(summary.highestCategory?.value ?? 0, currencyCode)} this month`} />
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

function QuickAction({
  href,
  label,
  detail,
  icon: Icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-auto justify-start gap-3 rounded-xl border bg-card/70 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/35 focus-visible:ring-primary/40",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <Icon />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-semibold">
          {label}
          <Plus className="size-3.5" aria-hidden="true" />
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
      </span>
    </Link>
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
