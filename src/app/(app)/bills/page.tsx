import { CategoryType } from "@/generated/prisma/client";
import { BillsList } from "@/components/finance/data-lists";
import { BillForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function BillsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);

  return (
    <div className="grid gap-6">
      <PageHeader title="Bills" description="Keep rent, subscriptions, utilities, and payment status visible." />
      <BillForm categories={data.categories.filter((category) => category.type === CategoryType.BILL)} />
      <BillsList bills={data.bills} />
    </div>
  );
}
