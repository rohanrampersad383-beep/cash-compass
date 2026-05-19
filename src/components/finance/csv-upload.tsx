"use client";

import Papa from "papaparse";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { TransactionKind } from "@/generated/prisma/browser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency } from "@/lib/finance";

type PreviewRow = {
  title: string;
  amount: number;
  date: string;
  kind: TransactionKind;
  notes?: string;
};

export function CsvUpload() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [pending, setPending] = useState(false);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          if (row.kind === TransactionKind.INCOME) {
            acc.income += row.amount;
          } else {
            acc.expense += row.amount;
          }
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [rows],
  );

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const normalized = result.data
          .map((row) => {
            const rawAmount = Number(row.amount ?? row.Amount ?? row.AMOUNT ?? 0);
            const title = row.description ?? row.Description ?? row.title ?? row.Title ?? row.merchant ?? "Imported transaction";
            const date = row.date ?? row.Date ?? new Date().toISOString().slice(0, 10);
            return {
              title: String(title).replace(/[<>]/g, "").slice(0, 120),
              amount: Math.abs(rawAmount),
              date,
              kind: rawAmount >= 0 ? TransactionKind.INCOME : TransactionKind.EXPENSE,
              notes: "Imported from manual CSV upload",
            };
          })
          .filter((row) => row.amount > 0 && !Number.isNaN(Date.parse(row.date)))
          .slice(0, 100);
        setRows(normalized);
        toast.success(`Previewed ${normalized.length} clean rows`);
      },
      error: () => toast.error("Could not parse this CSV"),
    });
  }

  async function confirmImport() {
    setPending(true);
    try {
      const response = await fetch("/api/statement-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, rows }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Import failed");
      }
      toast.success("Transactions imported");
      setRows([]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Alert className="glass-panel">
        <UploadCloud data-icon="inline-start" />
        <AlertTitle>You control the upload</AlertTitle>
        <AlertDescription>
          Financial Tracks never asks for bank login details. CSV files are parsed in your browser for preview, then only the rows you confirm are saved.
        </AlertDescription>
      </Alert>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>CSV upload preview</CardTitle>
          <CardDescription>Upload columns like Date, Description, and Amount. Negative amounts become expenses.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background/50 p-10 text-center transition hover:bg-accent/40">
            <UploadCloud className="size-9 text-primary" />
            <span className="font-medium">Choose a CSV statement</span>
            <span className="text-sm text-muted-foreground">Preview first, then confirm import.</span>
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={onFile} />
          </label>

          {rows.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{rows.length} rows ready</Badge>
                <Badge variant="secondary">{currency(totals.income)} income</Badge>
                <Badge variant="secondary">{currency(totals.expense)} expenses</Badge>
              </div>
              <div className="max-h-96 overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 20).map((row, index) => (
                      <TableRow key={`${row.title}-${index}`}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.kind.toLowerCase()}</TableCell>
                        <TableCell className="text-right">{currency(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={confirmImport} disabled={pending}>{pending ? "Importing..." : "Confirm imported transactions"}</Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
