import Link from "next/link";
import {
  Banknote,
  CircleDollarSign,
  Compass,
  CreditCard,
  FileSpreadsheet,
  Flame,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CompassSweep } from "@/components/brand/compass-sweep";
import { IncomeExpenseChart, SpendingChart } from "@/components/finance/charts";
import { BillsList, GoalsList, TransactionsTable } from "@/components/finance/data-lists";
import { MetricCard } from "@/components/finance/metric-card";
import { MotionItem, MotionStack } from "@/components/finance/motion-shell";
import { PageHeader } from "@/components/finance/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBudgetSummary, buildFinanceSummary, currency, monthlyChartData, normalizeCurrency, percent, toNumber, type CurrencyCode } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { shouldShowOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const ledgerData = { ...data, transactions: data.ledgerTransactions };
  const summary = buildFinanceSummary(ledgerData);
  const budgetSummary = buildBudgetSummary(ledgerData);
  const monthlyData = monthlyChartData(data.ledgerTransactions);
  const bestSavingsMonth = monthlyData.reduce((best, item) => (item.savings > best.savings ? item : best), monthlyData[0]);
  const goalMilestone = data.goals
    .map((goal) => ({
      name: goal.name,
      progress: Math.min(100, (toNumber(goal.currentAmount) / toNumber(goal.targetAmount)) * 100),
    }))
    .sort((a, b) => b.progress - a.progress)[0];
  const showOnboarding = shouldShowOnboarding({
    transactions: data.ledgerTransactions.length,
    bills: data.bills.length,
    budgets: data.budgets.length,
    savingsGoals: data.goals.length,
    uploadedStatements: data.statements.length,
  });

  return (
    <div className="relative">
      <CompassSweep className="absolute right-0 top-0 hidden size-28 opacity-40 md:block" />
      <PageHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="A beginner-friendly snapshot of what came in, what went out, and what is coming next."
        badge={`${percent(summary.savingsRate)} savings rate`}
      />

      {showOnboarding ? (
        <MotionStack className="mb-6">
          <MotionItem><WelcomeOnboardingCard /></MotionItem>
        </MotionStack>
      ) : null}

      <MotionStack className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MotionItem><QuickAction href="/transactions?intent=income" label="Add income" detail="Salary, freelance, refunds" icon={Banknote} /></MotionItem>
        <MotionItem><QuickAction href="/transactions?intent=expense" label="Add expense" detail="Groceries, gas, transport" icon={CreditCard} /></MotionItem>
        <MotionItem><QuickAction href="/bills" label="Add bill" detail="T&TEC, WASA, phone" icon={ReceiptText} /></MotionItem>
        <MotionItem><QuickAction href="/budgets" label="Tune budget" detail="Groceries, utilities, rent" icon={CircleDollarSign} /></MotionItem>
        <MotionItem><QuickAction href="/statement-upload" label="Import CSV" detail="Manual bank statement upload" icon={FileSpreadsheet} /></MotionItem>
      </MotionStack>

      <MotionStack className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MotionItem><MetricCard title="Total balance" value={summary.totalBalance} helper="All tracked income minus expenses" icon={Wallet} currencyCode={currencyCode} /></MotionItem>
        <MotionItem><MetricCard title="Monthly income" value={summary.monthlyIncome} helper="This month across all sources" icon={Banknote} tone="cyan" currencyCode={currencyCode} /></MotionItem>
        <MotionItem><MetricCard title="Monthly expenses" value={summary.monthlyExpenses} helper="Manual and imported spending" icon={CreditCard} tone="rose" currencyCode={currencyCode} /></MotionItem>
        <MotionItem><MetricCard title="Monthly savings" value={summary.monthlySavings} helper="Income left after expenses" icon={PiggyBank} tone="amber" currencyCode={currencyCode} /></MotionItem>
      </MotionStack>

      <MotionStack className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <MotionItem><IncomeExpenseChart data={monthlyData} currencyCode={currencyCode} /></MotionItem>
        <MotionItem><SpendingChart data={summary.spendingByCategory} currencyCode={currencyCode} /></MotionItem>
      </MotionStack>

      <MotionStack className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <MotionItem>
          <BudgetSummaryCard
            status={budgetSummary.status}
            used={budgetSummary.percentUsed}
            spent={budgetSummary.totalSpent}
            limit={budgetSummary.totalLimit}
            currencyCode={currencyCode}
          />
        </MotionItem>
        <MotionItem>
          <FinancialMoments
            bestMonth={bestSavingsMonth?.month ?? "This month"}
            bestSavings={bestSavingsMonth?.savings ?? summary.monthlySavings}
            goalName={goalMilestone?.name ?? "Emergency fund"}
            goalProgress={goalMilestone?.progress ?? 0}
            currencyCode={currencyCode}
          />
        </MotionItem>
      </MotionStack>

      <MotionStack className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <MotionItem><TransactionsTable transactions={data.ledgerTransactions.slice(0, 7)} currencyCode={currencyCode} /></MotionItem>
        <MotionItem>
          <div className="grid gap-6">
            <BillsList bills={summary.upcomingBills} categories={data.categories.filter((category) => category.type === "BILL")} currencyCode={currencyCode} />
            <GoalsList goals={data.goals} currencyCode={currencyCode} />
          </div>
        </MotionItem>
      </MotionStack>

      <MotionStack className="mt-6 grid gap-4 md:grid-cols-3">
        <MotionItem><Insight title="Highest category" value={summary.highestCategory?.name ?? "None yet"} detail={`${currency(summary.highestCategory?.value ?? 0, currencyCode)} this month`} /></MotionItem>
        <MotionItem><Insight title="Savings health" value={percent(summary.savingsRate)} detail="of income saved this month" /></MotionItem>
        <MotionItem>
          <Insight
            title="Expense movement"
            value={`${summary.expenseDelta >= 0 ? "+" : ""}${Math.round(summary.expenseDelta)}%`}
            detail="compared with last month"
          />
        </MotionItem>
      </MotionStack>
    </div>
  );
}

const onboardingActions = [
  { href: "/transactions?intent=income", label: "Add income", icon: Banknote },
  { href: "/transactions?intent=expense", label: "Add expense", icon: CreditCard },
  { href: "/budgets", label: "Create budget", icon: CircleDollarSign },
  { href: "/bills", label: "Add bill", icon: ReceiptText },
  { href: "/savings-goals", label: "Set savings goal", icon: Target },
  { href: "/statement-upload", label: "Upload CSV statement", icon: FileSpreadsheet },
];

function WelcomeOnboardingCard() {
  return (
    <Card className="glass-panel premium-glow spotlight-card relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full border border-primary/20" aria-hidden="true" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Compass className="size-5 text-primary" aria-hidden="true" />
          Welcome to Cash Compass
        </CardTitle>
        <CardDescription>
          Set up your finance workspace by adding your first transaction, creating a budget, adding a bill,
          setting a savings goal, or uploading a CSV statement.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {onboardingActions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-2 rounded-xl bg-background/50 p-3 text-left transition hover:border-primary/45 hover:bg-accent/30",
              )}
            >
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Want to explore a filled dashboard first? Use the demo workspace from the login page when signed out.
        </p>
      </CardContent>
    </Card>
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
        "premium-glow spotlight-card h-auto min-w-0 justify-start gap-3 whitespace-normal rounded-xl border bg-card/76 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/45 hover:bg-accent/35 hover:shadow-primary/10 focus-visible:ring-primary/40",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <Icon />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 font-semibold">
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
    <Card className="glass-panel premium-glow spotlight-card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}

function BudgetSummaryCard({
  status,
  used,
  spent,
  limit,
  currencyCode,
}: {
  status: string;
  used: number;
  spent: number;
  limit: number;
  currencyCode: CurrencyCode;
}) {
  return (
    <Card className="glass-panel premium-glow spotlight-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" aria-hidden="true" />
      <CardHeader>
        <CardDescription>Budget compass</CardDescription>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <CircleDollarSign className="size-5 text-primary" aria-hidden="true" />
          {status}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">Monthly budget used</p>
          <p className="font-semibold">{percent(used)}</p>
        </div>
        <Progress value={Math.min(100, used)} className="mt-3 h-2" />
        <p className="mt-3 text-sm text-muted-foreground">
          {currency(spent, currencyCode)} spent or reserved from {currency(limit, currencyCode)} planned.
        </p>
      </CardContent>
    </Card>
  );
}

function FinancialMoments({
  bestMonth,
  bestSavings,
  goalName,
  goalProgress,
  currencyCode,
}: {
  bestMonth: string;
  bestSavings: number;
  goalName: string;
  goalProgress: number;
  currencyCode: CurrencyCode;
}) {
  return (
    <Card className="glass-panel premium-glow spotlight-card relative overflow-hidden">
      <div className="pointer-events-none absolute -right-1 -top-10 size-32 rounded-full border border-primary/20 sm:-right-10" aria-hidden="true" />
      <CardHeader>
        <CardTitle>Financial moments</CardTitle>
        <CardDescription>Progress signals worth noticing.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Moment icon={Trophy} title="Best savings month" value={bestMonth} detail={`${currency(bestSavings, currencyCode)} saved`} />
        <Moment icon={PiggyBank} title="Goal milestone" value={`${Math.round(goalProgress)}%`} detail={`${goalName} funded`} />
        <Moment icon={Flame} title="Consistency" value="2-month streak" detail="Salary, rent, and utilities are tracked." />
      </CardContent>
    </Card>
  );
}

function Moment({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="premium-glow spotlight-card rounded-xl border bg-background/50 p-4 transition hover:-translate-y-1 hover:border-primary/45 hover:bg-accent/25">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <p className="mt-3 text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
