import { CategoryType, PaymentType, TransactionKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  CSV_IMPORT_LIMITS,
  type CsvColumnMapping,
  isAllowedCsvFile,
  isValidImportAmount,
  normalizeCsvDate,
  normalizeImportedText,
  sanitizeCsvFileName,
  validateCsvMapping,
} from "@/lib/csv-import";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

const mappingSchema = z.object({
  dateColumn: z.string().trim().min(1).optional(),
  descriptionColumn: z.string().trim().min(1).optional(),
  amountColumn: z.string().trim().min(1).optional(),
  debitColumn: z.string().trim().min(1).optional(),
  creditColumn: z.string().trim().min(1).optional(),
  categoryColumn: z.string().trim().min(1).optional(),
  typeColumn: z.string().trim().min(1).optional(),
  notesColumn: z.string().trim().min(1).optional(),
  paymentMethodColumn: z.string().trim().min(1).optional(),
});

const importRowSchema = z.object({
  rowNumber: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Each row needs a description.").max(120),
  amount: z.number().finite("Each row needs a valid amount."),
  date: z.string().trim().min(1, "Each row needs a date."),
  kind: z.nativeEnum(TransactionKind),
  categoryId: z.string().trim().min(1).nullable().optional(),
  categoryName: z.string().trim().max(48).optional(),
  paymentType: z.nativeEnum(PaymentType).nullable().optional(),
  notes: z.string().trim().max(500).optional(),
  issue: z.string().trim().max(500).optional(),
});

const importSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  fileSize: z.number().int().positive().max(CSV_IMPORT_LIMITS.maxFileSizeBytes),
  fileType: z.string().trim().max(120).default(""),
  mapping: mappingSchema,
  rows: z.array(importRowSchema).min(1).max(CSV_IMPORT_LIMITS.maxRows),
});

function badImport(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  const invalidOrigin = validateMutationOrigin(request);
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const limited = await rateLimit(request, rateLimitPresets.csvUpload);
  if (limited) {
    return limited;
  }

  const user = await requireUser();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > CSV_IMPORT_LIMITS.maxRequestSizeBytes) {
    return badImport("CSV import payload is too large.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badImport("Upload data could not be read. Please try the CSV import again.");
  }

  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return badImport(parsed.error.issues[0]?.message ?? "Invalid CSV import.");
  }

  if (!isAllowedCsvFile(parsed.data.fileName, parsed.data.fileType)) {
    return badImport("Upload a valid CSV file.");
  }

  const mappingError = validateCsvMapping(parsed.data.mapping as CsvColumnMapping);
  if (mappingError) {
    return badImport(mappingError);
  }

  const issueRow = parsed.data.rows.find((row) => row.issue);
  if (issueRow) {
    return badImport(`Row ${issueRow.rowNumber ?? parsed.data.rows.indexOf(issueRow) + 1} needs review before import.`);
  }

  const categoryIds = [...new Set(parsed.data.rows.map((row) => row.categoryId).filter(Boolean))] as string[];
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          userId: user.id,
          type: { in: [CategoryType.INCOME, CategoryType.EXPENSE] },
        },
        select: { id: true, type: true },
      })
    : [];
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const rows = [];

  for (const [index, row] of parsed.data.rows.entries()) {
    const normalizedDate = normalizeCsvDate(row.date);
    const amount = Math.abs(row.amount);
    const rowNumber = row.rowNumber ?? index + 1;

    if (!normalizedDate) {
      return badImport(`Row ${rowNumber} has an invalid date. Use YYYY-MM-DD.`);
    }

    if (!isValidImportAmount(amount)) {
      return badImport(`Row ${rowNumber} has an invalid amount.`);
    }

    if (row.categoryId) {
      const category = categoryById.get(row.categoryId);
      if (!category) {
        return badImport(`Row ${rowNumber} uses a category that is not available for this account.`);
      }

      if (
        (row.kind === TransactionKind.INCOME && category.type !== CategoryType.INCOME) ||
        (row.kind === TransactionKind.EXPENSE && category.type !== CategoryType.EXPENSE)
      ) {
        return badImport(`Row ${rowNumber} uses a category that does not match its transaction type.`);
      }
    }

    rows.push({
      title: normalizeImportedText(row.title, 120),
      amount,
      date: new Date(`${normalizedDate}T00:00:00.000Z`),
      kind: row.kind,
      categoryId: row.categoryId ?? null,
      paymentType: row.kind === TransactionKind.EXPENSE ? row.paymentType ?? null : null,
      notes: row.notes ? normalizeImportedText(row.notes, 500) : null,
    });
  }

  const emptyTextRowIndex = rows.findIndex((row) => !row.title);
  if (emptyTextRowIndex >= 0) {
    return badImport(`Row ${emptyTextRowIndex + 1} needs a description.`);
  }

  const statement = await prisma.uploadedStatement.create({
    data: {
      fileName: sanitizeCsvFileName(parsed.data.fileName),
      rowCount: rows.length,
      importedCount: rows.length,
      userId: user.id,
      transactions: {
        create: rows.map((row) => ({
          title: row.title,
          amount: row.amount,
          date: row.date,
          kind: row.kind,
          categoryId: row.categoryId,
          paymentType: row.paymentType,
          notes: row.notes,
          userId: user.id,
        })),
      },
    },
  });

  return NextResponse.json({ statement });
}
