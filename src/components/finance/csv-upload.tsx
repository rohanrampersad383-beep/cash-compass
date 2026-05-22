"use client";

import Papa from "papaparse";
import { AlertTriangle, CheckCircle2, Columns3, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryType } from "@/generated/prisma/browser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CSV_IMPORT_LIMITS,
  type CsvColumnMapping,
  type MappedCsvPreviewRow,
  buildMappedCsvPreviewRows,
  isAllowedCsvFile,
  normalizeImportedText,
  suggestCsvMapping,
  validateCsvMapping,
} from "@/lib/csv-import";
import { currency, type CurrencyCode } from "@/lib/finance";

type ImportCategory = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

const mappingFields: Array<{
  key: keyof CsvColumnMapping;
  label: string;
  required?: boolean;
  helper?: string;
}> = [
  { key: "dateColumn", label: "Date", required: true },
  { key: "descriptionColumn", label: "Description / Merchant / Memo", required: true },
  { key: "amountColumn", label: "Amount", helper: "Use this for signed amount CSVs." },
  { key: "debitColumn", label: "Debit", helper: "Debit rows import as expenses." },
  { key: "creditColumn", label: "Credit", helper: "Credit rows import as income." },
  { key: "categoryColumn", label: "Category" },
  { key: "typeColumn", label: "Type" },
  { key: "notesColumn", label: "Notes" },
  { key: "paymentMethodColumn", label: "Payment method" },
];

function SelectClassName() {
  return "h-10 rounded-md border border-input bg-background/60 px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring";
}

function categoryTypeForKind(kind: MappedCsvPreviewRow["kind"]) {
  return kind === "INCOME" ? CategoryType.INCOME : CategoryType.EXPENSE;
}

export function CsvUpload({
  currencyCode = "TTD",
  categories,
}: {
  currencyCode?: CurrencyCode;
  categories: ImportCategory[];
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [rows, setRows] = useState<MappedCsvPreviewRow[]>([]);
  const [pending, setPending] = useState(false);

  const blockingRows = rows.filter((row) => row.issue);
  const isMapped = rawRows.length > 0;

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          if (row.issue) {
            acc.issues += 1;
          } else if (row.kind === "INCOME") {
            acc.income += row.amount;
          } else {
            acc.expense += row.amount;
          }
          return acc;
        },
        { income: 0, expense: 0, issues: 0 },
      ),
    [rows],
  );

  function updateMapping(key: keyof CsvColumnMapping, value: string) {
    setMapping((current) => ({ ...current, [key]: value || undefined }));
    setRows([]);
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setRows([]);
    setRawRows([]);
    setHeaders([]);
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

        const fields = result.meta.fields?.filter(Boolean) ?? [];
        const parsedRows = result.data.filter((row) =>
          Object.values(row).some((value) => String(value ?? "").trim().length > 0),
        );

        if (!fields.length) {
          toast.error("This CSV needs a header row so columns can be mapped.");
          return;
        }

        if (parsedRows.length > CSV_IMPORT_LIMITS.maxRows) {
          toast.error(`CSV imports are limited to ${CSV_IMPORT_LIMITS.maxRows} rows.`);
          return;
        }

        if (!parsedRows.length) {
          toast.error("No transaction rows were found.");
          return;
        }

        const suggested = suggestCsvMapping(fields);
        setHeaders(fields);
        setRawRows(parsedRows);
        setMapping(suggested);
        toast.success(`Loaded ${parsedRows.length} rows. Review the column mapping next.`);
      },
      error: () => toast.error("Could not parse this CSV. Check the file and try again."),
    });
  }

  function buildPreview() {
    const mappingError = validateCsvMapping(mapping);
    if (mappingError) {
      toast.error(mappingError);
      return;
    }

    const result = buildMappedCsvPreviewRows(rawRows, mapping);
    const matchedRows = result.rows.map((row) => {
      const type = categoryTypeForKind(row.kind);
      const category = row.categoryName
        ? categories.find((item) => item.type === type && item.name.toLowerCase() === row.categoryName?.toLowerCase())
        : null;

      return { ...row, categoryId: category?.id ?? null };
    });

    setRows(matchedRows);

    if (result.hasBlockingIssues) {
      toast.error("Some rows need review before import.");
      return;
    }

    toast.success(`Previewed ${matchedRows.length} rows`);
  }

  function updateRowCategory(rowNumber: number, categoryId: string) {
    setRows((current) => current.map((row) => (row.rowNumber === rowNumber ? { ...row, categoryId: categoryId || null } : row)));
  }

  async function confirmImport() {
    if (blockingRows.length) {
      toast.error("Fix rows with validation issues before importing.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/statement-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileSize,
          fileType,
          mapping,
          rows: rows.map((row) => ({
            ...row,
            notes: row.notes ?? normalizeImportedText("Imported from manual CSV upload", 500),
          })),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Import failed");
      }
      toast.success(`Imported ${rows.length} transactions`);
      setRows([]);
      setRawRows([]);
      setHeaders([]);
      setMapping({});
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
          <CardTitle>CSV import workspace</CardTitle>
          <CardDescription>Upload a statement, map columns, review categories, then confirm what gets saved.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background/50 p-10 text-center transition hover:bg-accent/40">
            <UploadCloud className="size-9 text-primary" />
            <span className="font-medium">Choose a CSV statement</span>
            <span className="text-sm text-muted-foreground">Date, description, amount, debit, credit, category, and notes columns can be mapped.</span>
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={onFile} />
          </label>

          {isMapped ? (
            <div className="rounded-2xl border bg-background/40 p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Columns3 className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">Map statement columns</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Required: Date, description, and either Amount or Debit/Credit. Debit rows become expenses; credit rows become income.
                  </p>
                </div>
                <Badge variant="secondary">{rawRows.length} rows loaded</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mappingFields.map((field) => (
                  <label key={field.key} className="grid gap-2 text-sm">
                    <span className="font-medium">
                      {field.label} {field.required ? <span className="text-primary">*</span> : null}
                    </span>
                    <select
                      className={SelectClassName()}
                      value={mapping[field.key] ?? ""}
                      onChange={(event) => updateMapping(field.key, event.target.value)}
                    >
                      <option value="">Not mapped</option>
                      {headers.map((header) => (
                        <option key={`${field.key}-${header}`} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                    {field.helper ? <span className="text-xs text-muted-foreground">{field.helper}</span> : null}
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={buildPreview}>
                  Build preview
                </Button>
                <span className="text-sm text-muted-foreground">{fileName}</span>
              </div>
            </div>
          ) : null}

          {rows.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{rows.length} preview rows</Badge>
                <Badge variant="secondary">{currency(totals.income, currencyCode)} income</Badge>
                <Badge variant="secondary">{currency(totals.expense, currencyCode)} expenses</Badge>
                {totals.issues ? <Badge variant="destructive">{totals.issues} need review</Badge> : <Badge variant="secondary">Ready to import</Badge>}
              </div>

              <div className="overflow-hidden rounded-xl border">
                <div className="max-h-[32rem] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const type = categoryTypeForKind(row.kind);
                        const categoryOptions = categories.filter((category) => category.type === type);
                        return (
                          <TableRow key={row.rowNumber} className={row.issue ? "bg-destructive/5" : ""}>
                            <TableCell className="min-w-28">{row.date || "Invalid date"}</TableCell>
                            <TableCell className="min-w-56">
                              <div className="font-medium">{row.title || "Missing description"}</div>
                              {row.categoryName ? <div className="text-xs text-muted-foreground">CSV category: {row.categoryName}</div> : null}
                            </TableCell>
                            <TableCell>
                              <Badge variant={row.kind === "INCOME" ? "secondary" : "outline"}>{row.kind.toLowerCase()}</Badge>
                            </TableCell>
                            <TableCell className="min-w-52">
                              <select
                                className={SelectClassName()}
                                value={row.categoryId ?? ""}
                                onChange={(event) => updateRowCategory(row.rowNumber, event.target.value)}
                                aria-label={`Category for row ${row.rowNumber}`}
                              >
                                <option value="">Uncategorized</option>
                                {categoryOptions.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell className="min-w-64">
                              {row.issue ? (
                                <span className="inline-flex items-center gap-2 text-sm text-destructive">
                                  <AlertTriangle className="size-4" aria-hidden="true" />
                                  {row.issue}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-sm text-emerald-300">
                                  <CheckCircle2 className="size-4" aria-hidden="true" />
                                  Clean
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{currency(row.amount, currencyCode)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button onClick={confirmImport} disabled={pending || blockingRows.length > 0}>
                {pending ? "Importing..." : "Confirm imported transactions"}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
