import { TransactionKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  CSV_IMPORT_LIMITS,
  isAllowedCsvFile,
  isValidImportAmount,
  normalizeCsvDate,
  normalizeImportedText,
  sanitizeCsvFileName,
} from "@/lib/csv-import";
import { validateMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

const importRowSchema = z.object({
  title: z.string().trim().min(1, "Each row needs a description.").max(120),
  amount: z.number().finite("Each row needs a valid amount."),
  date: z.string().trim().min(1, "Each row needs a date."),
  kind: z.nativeEnum(TransactionKind),
  categoryName: z.string().trim().max(48).optional(),
  notes: z.string().trim().max(500).optional(),
});

const importSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  fileSize: z.number().int().positive().max(CSV_IMPORT_LIMITS.maxFileSizeBytes),
  fileType: z.string().trim().max(120).default(""),
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

  const rows = [];

  for (const [index, row] of parsed.data.rows.entries()) {
    const normalizedDate = normalizeCsvDate(row.date);
    const amount = Math.abs(row.amount);

    if (!normalizedDate) {
      return badImport(`Row ${index + 1} has an invalid date. Use YYYY-MM-DD.`);
    }

    if (!isValidImportAmount(amount)) {
      return badImport(`Row ${index + 1} has an invalid amount.`);
    }

    rows.push({
      title: normalizeImportedText(row.title, 120),
      amount,
      date: new Date(`${normalizedDate}T00:00:00.000Z`),
      kind: row.kind,
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
          notes: row.notes,
          userId: user.id,
        })),
      },
    },
  });

  return NextResponse.json({ statement });
}
