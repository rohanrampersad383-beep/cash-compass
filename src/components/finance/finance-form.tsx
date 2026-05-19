"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { BillStatus, CategoryType, Frequency, PaymentType, TransactionKind } from "@/generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: string; name: string; type: CategoryType };

function fieldValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

async function submitJson(endpoint: string, payload: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error ?? "Something went wrong");
  }
}

export function IncomeForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitJson("/api/income", {
        source: fieldValue(form, "source"),
        amount: fieldValue(form, "amount"),
        date: fieldValue(form, "date"),
        categoryId: fieldValue(form, "categoryId") || null,
        notes: fieldValue(form, "notes"),
        frequency: fieldValue(form, "frequency"),
        isRecurring: form.get("isRecurring") === "on",
      });
      toast.success("Income added");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add income");
    } finally {
      setPending(false);
    }
  }

  return (
    <EntryCard title="Add income source" description="Track paychecks, freelance work, refunds, and recurring deposits.">
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Source" name="source" placeholder="Design salary" />
        <Field label="Amount" name="amount" type="number" placeholder="3200" />
        <Field label="Date" name="date" type="date" />
        <CategorySelect categories={categories} name="categoryId" placeholder="Income category" />
        <FrequencySelect />
        <RecurringToggle />
        <NotesField />
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : "Add income"}</Button>
      </form>
    </EntryCard>
  );
}

export function ExpenseForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitJson("/api/expenses", {
        merchant: fieldValue(form, "merchant"),
        amount: fieldValue(form, "amount"),
        date: fieldValue(form, "date"),
        categoryId: fieldValue(form, "categoryId") || null,
        notes: fieldValue(form, "notes"),
        paymentType: fieldValue(form, "paymentType"),
        frequency: fieldValue(form, "frequency"),
        isRecurring: form.get("isRecurring") === "on",
      });
      toast.success("Expense added");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add expense");
    } finally {
      setPending(false);
    }
  }

  return (
    <EntryCard title="Add expense" description="Log purchases manually with payment type and category context.">
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Merchant" name="merchant" placeholder="Whole Market" />
        <Field label="Amount" name="amount" type="number" placeholder="84.50" />
        <Field label="Date" name="date" type="date" />
        <CategorySelect categories={categories} name="categoryId" placeholder="Expense category" />
        <PaymentSelect />
        <FrequencySelect />
        <RecurringToggle />
        <NotesField />
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : "Add expense"}</Button>
      </form>
    </EntryCard>
  );
}

export function BillForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitJson("/api/bills", {
        name: fieldValue(form, "name"),
        amount: fieldValue(form, "amount"),
        dueDate: fieldValue(form, "dueDate"),
        categoryId: fieldValue(form, "categoryId") || null,
        frequency: fieldValue(form, "frequency"),
        status: fieldValue(form, "status"),
      });
      toast.success("Bill added");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add bill");
    } finally {
      setPending(false);
    }
  }

  return (
    <EntryCard title="Add recurring bill" description="Keep subscriptions, rent, utilities, and due dates visible.">
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Bill name" name="name" placeholder="Netflix" />
        <Field label="Amount" name="amount" type="number" placeholder="18.99" />
        <Field label="Due date" name="dueDate" type="date" />
        <CategorySelect categories={categories} name="categoryId" placeholder="Bill category" />
        <FrequencySelect defaultValue={Frequency.MONTHLY} />
        <Select name="status" defaultValue={BillStatus.UNPAID}>
          <SelectTrigger aria-label="Bill status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(BillStatus).map((status) => (
                <SelectItem key={status} value={status}>{status.toLowerCase()}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : "Add bill"}</Button>
      </form>
    </EntryCard>
  );
}

export function SavingsGoalForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitJson("/api/savings-goals", {
        name: fieldValue(form, "name"),
        targetAmount: fieldValue(form, "targetAmount"),
        currentAmount: fieldValue(form, "currentAmount"),
        targetDate: fieldValue(form, "targetDate"),
        color: fieldValue(form, "color") || "#22c55e",
      });
      toast.success("Savings goal added");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add goal");
    } finally {
      setPending(false);
    }
  }

  return (
    <EntryCard title="Create savings goal" description="Set a target and watch progress build over time.">
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Goal name" name="name" placeholder="Emergency fund" />
        <Field label="Target amount" name="targetAmount" type="number" placeholder="10000" />
        <Field label="Current saved" name="currentAmount" type="number" placeholder="2400" />
        <Field label="Target date" name="targetDate" type="date" />
        <Field label="Accent color" name="color" type="color" defaultValue="#22c55e" />
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : "Create goal"}</Button>
      </form>
    </EntryCard>
  );
}

export function TransactionForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitJson("/api/transactions", {
        title: fieldValue(form, "title"),
        amount: fieldValue(form, "amount"),
        date: fieldValue(form, "date"),
        kind: fieldValue(form, "kind"),
        categoryId: fieldValue(form, "categoryId") || null,
        paymentType: fieldValue(form, "paymentType") || null,
        notes: fieldValue(form, "notes"),
        isRecurring: form.get("isRecurring") === "on",
      });
      toast.success("Transaction added");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add transaction");
    } finally {
      setPending(false);
    }
  }

  return (
    <EntryCard title="Quick transaction" description="Use this when you only need the unified ledger entry.">
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" placeholder="Coffee run" />
        <Field label="Amount" name="amount" type="number" placeholder="6.50" />
        <Field label="Date" name="date" type="date" />
        <Select name="kind" defaultValue={TransactionKind.EXPENSE}>
          <SelectTrigger aria-label="Transaction type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(TransactionKind).map((kind) => (
                <SelectItem key={kind} value={kind}>{kind.toLowerCase()}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <CategorySelect categories={categories} name="categoryId" placeholder="Category" />
        <PaymentSelect />
        <RecurringToggle />
        <NotesField />
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : "Add transaction"}</Button>
      </form>
    </EntryCard>
  );
}

function EntryCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} step={type === "number" ? "0.01" : undefined} placeholder={placeholder} defaultValue={defaultValue} required />
    </div>
  );
}

function CategorySelect({ categories, name, placeholder }: { categories: Category[]; name: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{placeholder}</Label>
      <Select name={name}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function PaymentSelect() {
  return (
    <div className="flex flex-col gap-2">
      <Label>Payment type</Label>
      <Select name="paymentType" defaultValue={PaymentType.CARD}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.values(PaymentType).map((type) => (
              <SelectItem key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function FrequencySelect({ defaultValue = Frequency.ONCE }: { defaultValue?: Frequency }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Frequency</Label>
      <Select name="frequency" defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.values(Frequency).map((frequency) => (
              <SelectItem key={frequency} value={frequency}>{frequency.toLowerCase()}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function RecurringToggle() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
      <Checkbox id="isRecurring" name="isRecurring" />
      <Label htmlFor="isRecurring">Recurring</Label>
    </div>
  );
}

function NotesField() {
  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" name="notes" placeholder="Add helpful context for future you." />
    </div>
  );
}
