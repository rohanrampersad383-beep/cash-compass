import { CsvUpload } from "@/components/finance/csv-upload";
import { PageHeader } from "@/components/finance/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";

export default async function StatementUploadPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);

  return (
    <div className="grid gap-6">
      <PageHeader title="Statement Upload" description="Import bank CSV exports manually, preview clean rows, then confirm what gets saved." />
      <CsvUpload />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>Imported statements attached to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.statements.map((statement) => (
            <div key={statement.id} className="rounded-xl border bg-background/50 p-4">
              <p className="font-medium">{statement.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {statement.importedCount} of {statement.rowCount} rows · {statement.uploadedAt.toLocaleDateString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
