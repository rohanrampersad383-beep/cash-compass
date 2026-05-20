import { AlertTriangle, Bot, CheckCircle2, Compass, Sparkles } from "lucide-react";
import { TransactionKind } from "@/generated/prisma/client";
import { CompassSweep } from "@/components/brand/compass-sweep";
import { MotionItem, MotionStack } from "@/components/finance/motion-shell";
import { PageHeader } from "@/components/finance/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBudgetSummary, buildFinanceSummary, currency, normalizeCurrency, previousMonthRange, startOfMonth, toNumber, type MoneyLike } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function AssistantPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const ledgerData = { ...data, transactions: data.ledgerTransactions };
  const summary = buildFinanceSummary(ledgerData);
  const budgetSummary = buildBudgetSummary(ledgerData);
  const billTotal = summary.upcomingBills.reduce((total, bill) => total + toNumber(bill.amount), 0);
  const monthStart = startOfMonth();
  const previous = previousMonthRange();
  const currentGroceries = categorySpend(data.ledgerTransactions, "Groceries", monthStart, new Date());
  const previousGroceries = categorySpend(data.ledgerTransactions, "Groceries", previous.start, previous.end);
  const groceryDelta = previousGroceries > 0 ? ((currentGroceries - previousGroceries) / previousGroceries) * 100 : 0;
  const wasaBills = data.bills.filter((bill) => bill.name === "WASA water").sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  const wasaDelta = wasaBills.length > 1 ? toNumber(wasaBills[0].amount) - toNumber(wasaBills[1].amount) : 0;
  const emergencyGoal = data.goals.find((goal) => goal.name.toLowerCase().includes("emergency")) ?? data.goals[0];
  const emergencyRemaining = emergencyGoal ? toNumber(emergencyGoal.targetAmount) - toNumber(emergencyGoal.currentAmount) : 0;
  const emergencyMonths = summary.monthlySavings > 0 ? Math.max(1, Math.ceil(emergencyRemaining / summary.monthlySavings)) : 0;
  const strongestDrivers = summary.spendingByCategory.slice(0, 2).map((item) => item.name).join(" and ");

  const insightCards = [
    {
      title: "Spending driver",
      detail: `${strongestDrivers || "Your tracked categories"} are your strongest spending drivers this month.`,
      icon: Compass,
      tone: "text-primary",
    },
    {
      title: "Groceries trend",
      detail: `Groceries are ${Math.abs(Math.round(groceryDelta))}% ${groceryDelta >= 0 ? "higher" : "lower"} than last month.`,
      icon: groceryDelta > 0 ? AlertTriangle : CheckCircle2,
      tone: groceryDelta > 0 ? "text-amber-300" : "text-emerald-300",
    },
    {
      title: "Utility watch",
      detail: wasaDelta > 0 ? `Your WASA bill increased by ${currency(wasaDelta, currencyCode)} compared with the last utility cycle.` : "Your WASA utility cycle is stable against the last tracked bill.",
      icon: AlertTriangle,
      tone: wasaDelta > 0 ? "text-amber-300" : "text-primary",
    },
    {
      title: "Goal forecast",
      detail: emergencyGoal ? `At your current savings pace, ${emergencyGoal.name} could be reached in about ${emergencyMonths} months.` : "Create a goal to unlock savings forecasts.",
      icon: Sparkles,
      tone: "text-primary",
    },
  ];

  const recommendations = [
    `Keep groceries under ${currency(Math.max(0, currentGroceries + budgetSummary.totalRemaining * 0.08), currencyCode)} for the rest of the month to protect your savings rate.`,
    `You have ${summary.upcomingBills.length} upcoming unpaid bills totaling ${currency(billTotal, currencyCode)}.`,
    budgetSummary.overCount > 0
      ? `${budgetSummary.overCount} budget needs attention. Start with the over-budget category before adding new subscriptions.`
      : `Budget health is ${budgetSummary.status.toLowerCase()}. Keep checking the watch categories after each CSV import.`,
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Cash Compass Assistant" description="Rule-based money guidance from your seeded transactions, bills, budgets, and goals." badge="No API key required" />
      <Card className="glass-panel premium-glow spotlight-card relative overflow-hidden">
        <CompassSweep className="absolute right-4 top-4 size-24 opacity-30" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <CardTitle>Cash Compass guide</CardTitle>
              <CardDescription>Today&apos;s guidance from your current data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <MotionStack className="grid gap-3 md:grid-cols-2">
            {insightCards.map((insight) => {
              const Icon = insight.icon;
              return (
                <MotionItem key={insight.title}>
                  <div className="group premium-glow spotlight-card rounded-2xl border bg-background/50 p-4 transition hover:-translate-y-1 hover:border-primary/45 hover:bg-accent/25">
                    <Icon className={`size-5 ${insight.tone}`} aria-hidden="true" />
                    <p className="mt-3 font-semibold">{insight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
                  </div>
                </MotionItem>
              );
            })}
          </MotionStack>
          <MotionStack className="grid gap-3 md:grid-cols-3">
            {recommendations.map((recommendation) => (
              <MotionItem key={recommendation}>
                <div className="premium-glow spotlight-card rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <Badge variant="secondary">Next action</Badge>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{recommendation}</p>
                </div>
              </MotionItem>
            ))}
          </MotionStack>
          <div className="rounded-2xl border border-dashed bg-background/40 p-5">
            <Badge variant="secondary">AI-ready architecture</Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              The assistant is still rule-based. A future AI route can receive scoped summaries from this page without sending passwords, bank credentials, or raw connection secrets.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function categorySpend(
  transactions: {
    amount: MoneyLike;
    date: Date;
    kind: TransactionKind;
    category?: { name: string } | null;
  }[],
  categoryName: string,
  start: Date,
  end: Date,
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.kind === TransactionKind.EXPENSE &&
        transaction.category?.name === categoryName &&
        transaction.date >= start &&
        transaction.date <= end,
    )
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
}
