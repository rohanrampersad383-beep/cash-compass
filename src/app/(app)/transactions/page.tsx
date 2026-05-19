import { CategoryType } from "@/generated/prisma/client";
import { TransactionsTable } from "@/components/finance/data-lists";
import { TransactionForm } from "@/components/finance/finance-form";
import { PageHeader } from "@/components/finance/page-header";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { normalizeCurrency } from "@/lib/finance";

export default async function TransactionsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);

  return (
    <div className="grid gap-6">
      <PageHeader title="Transactions" description="A unified ledger for income, spending, and imported statement rows." />
      <TransactionForm categories={data.categories.filter((category) => category.type !== CategoryType.BILL)} />
      <TransactionsTable transactions={data.transactions} currencyCode={currencyCode} />
    </div>
  );
}
