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
    update: { name: "Asha Demo", passwordHash, currencyCode: "TTD", emailVerifiedAt: now },
    create: {
      name: "Asha Demo",
      email: "demo@financialtracks.dev",
      passwordHash,
      currencyCode: "TTD",
      emailVerifiedAt: now,
    },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.bill.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
  await prisma.uploadedStatement.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  const categories = await Promise.all(
    [
      ["Salary", CategoryType.INCOME, "#22c55e", "briefcase"],
      ["Freelance", CategoryType.INCOME, "#06b6d4", "sparkles"],
      ["Groceries", CategoryType.EXPENSE, "#f59e0b", "utensils"],
      ["Rent", CategoryType.EXPENSE, "#38bdf8", "home"],
      ["Fuel", CategoryType.EXPENSE, "#a78bfa", "car"],
      ["Entertainment", CategoryType.EXPENSE, "#f472b6", "music"],
      ["Wellness", CategoryType.EXPENSE, "#fb7185", "heart"],
      ["Subscriptions", CategoryType.BILL, "#f97316", "repeat"],
      ["T&TEC", CategoryType.BILL, "#14b8a6", "plug"],
      ["WASA", CategoryType.BILL, "#0ea5e9", "droplets"],
      ["Digicel", CategoryType.BILL, "#ef4444", "smartphone"],
      ["bmobile", CategoryType.BILL, "#22c55e", "radio"],
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
      source: "Marketing salary",
      amount: 14500,
      date: date(1),
      categoryId: byName.get("Salary")?.id,
      isRecurring: true,
      frequency: Frequency.MONTHLY,
      notes: "Primary monthly salary",
    },
    {
      source: "Freelance landing page build",
      amount: 3200,
      date: date(9),
      categoryId: byName.get("Freelance")?.id,
      notes: "One-off client project",
    },
    {
      source: "Last month salary",
      amount: 14500,
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
    ["Massy Stores groceries", 820.5, 3, "Groceries", PaymentType.CARD, "Weekly groceries"],
    ["Unipet fuel", 340, 4, "Fuel", PaymentType.CARD, "Car fuel"],
    ["Rent - St. Augustine", 5200, 5, "Rent", PaymentType.BANK_TRANSFER, "Monthly apartment rent"],
    ["PriceSmart household run", 1180.75, 11, "Groceries", PaymentType.CARD, "Bulk groceries and household items"],
    ["Pharmacy and wellness", 360, 13, "Wellness", PaymentType.CARD, "Medication and personal care"],
    ["MovieTowne night out", 410, 15, "Entertainment", PaymentType.CARD, "Dinner and movie"],
    ["Maxi taxi and parking", 220, 18, "Fuel", PaymentType.CASH, "Local transport"],
    ["Last month rent - St. Augustine", 5200, 5, "Rent", PaymentType.BANK_TRANSFER, "Monthly apartment rent", -1],
    ["Last month groceries", 1720, 13, "Groceries", PaymentType.CARD, "Groceries and household items", -1],
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
        name: "T&TEC electricity",
        amount: 690,
        dueDate: date(23),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("T&TEC")?.id,
        userId: user.id,
      },
      {
        name: "Digicel mobile plan",
        amount: 225,
        dueDate: date(24),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("Digicel")?.id,
        userId: user.id,
      },
      {
        name: "bmobile home internet",
        amount: 315,
        dueDate: date(21),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("bmobile")?.id,
        userId: user.id,
      },
      {
        name: "Rent - St. Augustine",
        amount: 5200,
        dueDate: date(1, 1),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("Rent")?.id,
        userId: user.id,
      },
      {
        name: "WASA water",
        amount: 180,
        dueDate: date(27),
        frequency: Frequency.MONTHLY,
        status: BillStatus.UNPAID,
        categoryId: byName.get("WASA")?.id,
        userId: user.id,
      },
      {
        name: "WASA water",
        amount: 150,
        dueDate: date(27, -1),
        frequency: Frequency.MONTHLY,
        status: BillStatus.PAID,
        categoryId: byName.get("WASA")?.id,
        userId: user.id,
      },
      {
        name: "Netflix subscription",
        amount: 95,
        dueDate: date(12),
        frequency: Frequency.MONTHLY,
        status: BillStatus.PAID,
        categoryId: byName.get("Subscriptions")?.id,
        userId: user.id,
      },
    ],
  });

  await prisma.budget.createMany({
    data: [
      {
        name: "Groceries",
        limitAmount: 2800,
        categoryId: byName.get("Groceries")?.id,
        userId: user.id,
      },
      {
        name: "Utilities",
        limitAmount: 1200,
        categoryId: byName.get("T&TEC")?.id,
        userId: user.id,
      },
      {
        name: "Transport/Fuel",
        limitAmount: 900,
        categoryId: byName.get("Fuel")?.id,
        userId: user.id,
      },
      {
        name: "Subscriptions",
        limitAmount: 350,
        categoryId: byName.get("Subscriptions")?.id,
        userId: user.id,
      },
      {
        name: "Rent/Housing",
        limitAmount: 5400,
        categoryId: byName.get("Rent")?.id,
        userId: user.id,
      },
    ],
  });

  await prisma.savingsGoal.createMany({
    data: [
      {
        name: "Emergency fund",
        targetAmount: 30000,
        currentAmount: 18450,
        targetDate: date(30, 4),
        color: "#22c55e",
        userId: user.id,
      },
      {
        name: "Tobago long weekend",
        targetAmount: 8500,
        currentAmount: 3650,
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
