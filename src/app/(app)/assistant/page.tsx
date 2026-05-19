import { Bot, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFinanceSummary, currency, normalizeCurrency, percent, toNumber } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function AssistantPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const summary = buildFinanceSummary(data);
  const billTotal = summary.upcomingBills.reduce((total, bill) => total + toNumber(bill.amount), 0);

  const insights = [
    `Your highest spending category this month is ${summary.highestCategory?.name ?? "not available yet"}.`,
    `You saved ${percent(summary.savingsRate)} of your income this month.`,
    `You have ${summary.upcomingBills.length} upcoming unpaid bills totaling ${currency(billTotal, currencyCode)}.`,
    summary.expenseDelta > 0
      ? `Expenses increased ${Math.round(summary.expenseDelta)}% compared with last month. Review large recurring charges first.`
      : `Expenses decreased ${Math.abs(Math.round(summary.expenseDelta))}% compared with last month. Keep reinforcing that habit.`,
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Finance Assistant" description="A rule-based assistant placeholder, structured so an AI API can be added later." badge="No API key required" />
      <Card className="glass-panel overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <CardTitle>Financial Tracks Assistant</CardTitle>
              <CardDescription>Today&apos;s guidance from your current data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {insights.map((insight) => (
            <div key={insight} className="flex gap-3 rounded-2xl border bg-background/50 p-4">
              <Sparkles className="mt-0.5 size-5 text-primary" />
              <p className="text-sm leading-6">{insight}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed bg-background/40 p-5">
            <Badge variant="secondary">Version 2 ready</Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              The assistant page is intentionally isolated from paid model APIs. Add an OpenAI route later that receives scoped summaries, never raw passwords or bank credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
