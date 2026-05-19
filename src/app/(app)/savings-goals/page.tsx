import { GoalsList } from "@/components/finance/data-lists";
import { SavingsGoalForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { normalizeCurrency } from "@/lib/finance";

export default async function SavingsGoalsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);

  return (
    <div className="grid gap-6">
      <PageHeader title="Savings Goals" description="Create targets with visible progress and encouraging feedback." />
      <SavingsGoalForm />
      <GoalsList goals={data.goals} currencyCode={currencyCode} />
    </div>
  );
}
