import { CategoryType } from "@/generated/prisma/client";
import { BillsList } from "@/components/finance/data-lists";
import { BillForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { normalizeCurrency } from "@/lib/finance";

export default async function BillsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);

  return (
    <div className="grid gap-6">
      <PageHeader title="Bills" description="Keep rent, subscriptions, utilities, and payment status visible." />
      <BillForm categories={data.categories.filter((category) => category.type === CategoryType.BILL)} />
      <BillsList bills={data.bills} categories={data.categories.filter((category) => category.type === CategoryType.BILL)} currencyCode={currencyCode} />
    </div>
  );
}
