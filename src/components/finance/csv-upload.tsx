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
import {
  CSV_IMPORT_LIMITS,
  isAllowedCsvFile,
  isValidImportAmount,
  normalizeCsvDate,
  normalizeImportedText,
  parseCsvAmount,
} from "@/lib/csv-import";
import { currency, type CurrencyCode } from "@/lib/finance";

type PreviewRow = {
  title: string;
  amount: number;
  date: string;
  kind: TransactionKind;
  notes?: string;
};

export function CsvUpload({ currencyCode = "TTD" }: { currencyCode?: CurrencyCode }) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("");
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

    setRows([]);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type);

    if (file.size > CSV_IMPORT_LIMITS.maxFileSizeBytes) {
      toast.error("CSV file is too large. Use a file under 1 MB.");
      return;
    }

    if (!isAllowedCsvFile(file.name, file.type)) {
      toast.error("Upload a valid CSV file.");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          toast.error("Could not parse this CSV. Check the header row and file format.");
          return;
        }

        if (result.data.length > CSV_IMPORT_LIMITS.maxRows) {
          toast.error(`CSV imports are limited to ${CSV_IMPORT_LIMITS.maxRows} rows.`);
          return;
        }

        const normalized: PreviewRow[] = [];
        for (const [index, row] of result.data.entries()) {
          const rawAmount = parseCsvAmount(row.amount ?? row.Amount ?? row.AMOUNT);
          const title = normalizeImportedText(
            row.description ?? row.Description ?? row.title ?? row.Title ?? row.merchant,
            120,
          );
          const date = normalizeCsvDate(row.date ?? row.Date);

          if (!title) {
            toast.error(`Row ${index + 1} needs a description.`);
            return;
          }

          if (rawAmount === null || !isValidImportAmount(Math.abs(rawAmount))) {
            toast.error(`Row ${index + 1} has an invalid amount.`);
            return;
          }

          if (!date) {
            toast.error(`Row ${index + 1} has an invalid date. Use YYYY-MM-DD.`);
            return;
          }

          normalized.push({
            title,
            amount: Math.abs(rawAmount),
            date,
            kind: rawAmount >= 0 ? TransactionKind.INCOME : TransactionKind.EXPENSE,
            notes: normalizeImportedText("Imported from manual CSV upload", 500),
          });
        }

        if (!normalized.length) {
          toast.error("No valid transaction rows were found.");
          return;
        }

        setRows(normalized);
        toast.success(`Previewed ${normalized.length} clean rows`);
      },
      error: () => toast.error("Could not parse this CSV. Check the file and try again."),
    });
  }

  async function confirmImport() {
    setPending(true);
    try {
      const response = await fetch("/api/statement-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, fileSize, fileType, rows }),
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
          Cash Compass never asks for bank login details. CSV files are parsed in your browser for preview, then only the rows you confirm are saved.
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
                <Badge variant="secondary">{currency(totals.income, currencyCode)} income</Badge>
                <Badge variant="secondary">{currency(totals.expense, currencyCode)} expenses</Badge>
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
                        <TableCell className="text-right">{currency(row.amount, currencyCode)}</TableCell>
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
