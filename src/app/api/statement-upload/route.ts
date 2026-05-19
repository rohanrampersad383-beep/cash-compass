import { TransactionKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const importRowSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number(),
  date: z.string().transform((value) => new Date(value)),
  kind: z.nativeEnum(TransactionKind),
  categoryName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const importSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  rows: z.array(importRowSchema).min(1).max(500),
});

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = importSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid CSV import" }, { status: 400 });
  }

  const statement = await prisma.uploadedStatement.create({
    data: {
      fileName: parsed.data.fileName.replace(/[^\w.\- ]/g, "").slice(0, 180),
      rowCount: parsed.data.rows.length,
      importedCount: parsed.data.rows.length,
      userId: user.id,
      transactions: {
        create: parsed.data.rows.map((row) => ({
          title: row.title,
          amount: Math.abs(row.amount),
          date: row.date,
          kind: row.kind,
          notes: row.notes?.slice(0, 500) || null,
          userId: user.id,
        })),
      },
    },
  });

  return NextResponse.json({ statement });
}
