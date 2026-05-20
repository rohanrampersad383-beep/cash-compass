import { NextResponse } from "next/server";
import { CategoryType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = billSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid bill" }, { status: 400 });
  }

  const category = parsed.data.categoryId
    ? await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId: user.id, type: CategoryType.BILL },
      })
    : null;

  if (parsed.data.categoryId && !category) {
    return NextResponse.json({ error: "Choose a valid bill category." }, { status: 400 });
  }

  const bill = await prisma.bill.create({
    data: {
      ...parsed.data,
      userId: user.id,
      categoryId: category?.id ?? null,
    },
  });

  return NextResponse.json({ bill });
}
