import { CategoryType } from "@/generated/prisma/client";
import { BudgetsList } from "@/components/finance/data-lists";
import { BudgetForm } from "@/components/finance/finance-form";
import { MotionItem, MotionStack } from "@/components/finance/motion-shell";
import { PageHeader } from "@/components/finance/page-header";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { buildBudgetSummary, normalizeCurrency, percent } from "@/lib/finance";

export default async function BudgetsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const budgetSummary = buildBudgetSummary({ ...data, transactions: data.ledgerTransactions });
  const categories = data.categories.filter((category) => category.type === CategoryType.EXPENSE || category.type === CategoryType.BILL);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Budgets"
        description="Set monthly limits for everyday categories and see when spending needs attention."
        badge={`${percent(budgetSummary.percentUsed)} used`}
      />
      <MotionStack className="grid gap-6">
        <MotionItem><BudgetForm categories={categories} /></MotionItem>
        <MotionItem><BudgetsList budgets={budgetSummary.items} categories={categories} currencyCode={currencyCode} /></MotionItem>
      </MotionStack>
    </div>
  );
}
