import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = billSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid bill" }, { status: 400 });
  }

  const bill = await prisma.bill.create({
    data: {
      ...parsed.data,
      userId: user.id,
      categoryId: parsed.data.categoryId || null,
    },
  });

  return NextResponse.json({ bill });
}
