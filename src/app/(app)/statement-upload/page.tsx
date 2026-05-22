import { CsvUpload } from "@/components/finance/csv-upload";
import { PageHeader } from "@/components/finance/page-header";
import { CategoryType } from "@/generated/prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import { normalizeCurrency } from "@/lib/finance";

export default async function StatementUploadPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const currencyCode = normalizeCurrency(user.currencyCode);
  const importCategories = data.categories
    .filter((category) => category.type === CategoryType.INCOME || category.type === CategoryType.EXPENSE)
    .map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    }));

  return (
    <div className="grid gap-6">
      <PageHeader title="Statement Upload" description="Import bank CSV exports manually, preview clean rows, then confirm what gets saved." />
      <CsvUpload currencyCode={currencyCode} categories={importCategories} />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>Imported statements attached to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.statements.length === 0 ? (
            <Empty className="border bg-background/40 md:col-span-2">
              <EmptyHeader>
                <EmptyTitle>No statements imported</EmptyTitle>
                <EmptyDescription>Choose a CSV file above, review the cleaned rows, then confirm the import.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            data.statements.map((statement) => (
              <div key={statement.id} className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/35 hover:bg-accent/20">
                <p className="font-medium">{statement.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {statement.importedCount} of {statement.rowCount} rows - {statement.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
