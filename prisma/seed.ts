import "dotenv/config";
import bcrypt from "bcryptjs";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  BillStatus,
  CategoryType,
  Frequency,
  PaymentType,
  PrismaClient,
  TransactionKind,
} from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const thisMonth = now.getMonth();
const thisYear = now.getFullYear();

const date = (day: number, monthOffset = 0) =>
  new Date(thisYear, thisMonth + monthOffset, day, 12, 0, 0);

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@financialtracks.dev" },
    update: { name: "Demo User", passwordHash },
    create: {
      name: "Demo User",
      email: "demo@financialtracks.dev",
      passwordHash,
    },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.bill.deleteMany({ where: { userId: user.id } });
  await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
  await prisma.uploadedStatement.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  const categories = await Promise.all(
    [
      ["Salary", CategoryType.INCOME, "#22c55e", "briefcase"],
      ["Freelance", CategoryType.INCOME, "#06b6d4", "sparkles"],
      ["Food", CategoryType.EXPENSE, "#f59e0b", "utensils"],
      ["Housing", CategoryType.EXPENSE, "#38bdf8", "home"],
      ["Transport", CategoryType.EXPENSE, "#a78bfa", "car"],
      ["Wellness", CategoryType.EXPENSE, "#fb7185", "heart"],
      ["Subscriptions", CategoryType.BILL, "#f97316", "repeat"],
      ["Utilities", CategoryType.BILL, "#14b8a6", "plug"],
    ].map(([name, type, color, icon]) =>
      prisma.category.create({
        data: {
          name: name as string,
          type: type as CategoryType,
          color: color as string,
          icon: icon as string,
          userId: user.id,
        },
      }),
    ),
  );

  const byName = new Map(categories.map((category) => [category.name, category]));

  const incomes = [
    {
      source: "Design salary",
      amount: 6400,
      date: date(1),
      categoryId: byName.get("Salary")?.id,
      isRecurring: true,
      frequency: Frequency.MONTHLY,
      notes: "Primary paycheck",
    },
    {
      source: "Freelance website audit",
      amount: 1250,
      date: date(9),
      categoryId: byName.get("Freelance")?.id,
      notes: "One-off client work",
    },
    {
      source: "Last month salary",
      amount: 6400,
      date: date(1, -1),
      categoryId: byName.get("Salary")?.id,
      isRecurring: true,
      frequency: Frequency.MONTHLY,
    },
  ];

  for (const income of incomes) {
    await prisma.income.create({ data: { ...income, userId: user.id } });

    await prisma.transaction.create({
      data: {
        title: income.source,
        amount: income.amount,
        date: income.date,
        kind: TransactionKind.INCOME,
        notes: income.notes,
        isRecurring: income.isRecurring ?? false,
        categoryId: income.categoryId,
        userId: user.id,
      },
    });
  }

  const expenses = [
    ["Whole Market", 186.42, 3, "Food", PaymentType.CARD, "Weekly groceries"],
    ["Metro pass", 96, 4, "Transport", PaymentType.DIGITAL_WALLET, "Monthly pass"],
    ["Apartment rent", 2100, 5, "Housing", PaymentType.BANK_TRANSFER, "Recurring housing"],
    ["Lunch meetings", 128.75, 11, "Food", PaymentType.CARD, "Client lunch"],
    ["Yoga studio", 84, 13, "Wellness", PaymentType.CARD, "Class pack"],
    ["Ride share", 44.5, 18, "Transport", PaymentType.CARD, "Airport ride"],
    ["Last month rent", 2100, 5, "Housing", PaymentType.BANK_TRANSFER, "Recurring housing", -1],
    ["Last month groceries", 460, 13, "Food", PaymentType.CARD, "Groceries", -1],
  ] as const;

  for (const [merchant, amount, day, categoryName, paymentType, notes, monthOffset = 0] of expenses) {
    const expenseDate = date(day, monthOffset);
    const categoryId = byName.get(categoryName)?.id;
    const isRecurring = merchant.toLowerCase().includes("rent");

    await prisma.expense.create({
      data: {
        merchant,
        amount,
        date: expenseDate,
        categoryId,
        paymentType,
        notes,
        isRecurring,
        frequency: isRecurring ? Frequency.MONTHLY : Frequency.ONCE,
        userId: user.id,
      },
    });

    await prisma.transaction.create({
      data: {
        title: merchant,
        amount,
        date: expenseDate,
        kind: TransactionKind.EXPENSE,
        notes,
        paymentType,
        isRecurring,
        categoryId,
        userId: user.id,
      },
    });
  }

  await prisma.bill.createMany({
    data: [
      {
        name: "Netflix",
        amount: 18.99,
        dueDate: date(22),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("Subscriptions")?.id,
        userId: user.id,
      },
      {
        name: "Phone plan",
        amount: 72,
        dueDate: date(24),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("Utilities")?.id,
        userId: user.id,
      },
      {
        name: "Rent",
        amount: 2100,
        dueDate: date(5, 1),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("Utilities")?.id,
        userId: user.id,
      },
      {
        name: "Internet",
        amount: 64,
        dueDate: date(12),
        frequency: Frequency.MONTHLY,
        status: BillStatus.PAID,
        categoryId: byName.get("Utilities")?.id,
        userId: user.id,
      },
    ],
  });

  await prisma.savingsGoal.createMany({
    data: [
      {
        name: "Emergency fund",
        targetAmount: 12000,
        currentAmount: 7850,
        targetDate: date(30, 4),
        color: "#22c55e",
        userId: user.id,
      },
      {
        name: "Japan trip",
        targetAmount: 5200,
        currentAmount: 2140,
        targetDate: date(15, 8),
        color: "#06b6d4",
        userId: user.id,
      },
    ],
  });

  console.log("Seeded demo@financialtracks.dev / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
