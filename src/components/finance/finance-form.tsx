"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { BillStatus, CategoryType, Frequency, PaymentType, TransactionKind } from "@/generated/prisma/browser";
import { CategoryPicker, type CategoryOption } from "@/components/finance/category-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category = CategoryOption;

function fieldValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

async function submitJson(endpoint: string, payload: Record<string, unknown>, method = "POST") {
  const response = await fetch(endpoint, {
    method,
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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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
      formElement.reset();
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
        <Field label="Source" name="source" placeholder="Freelance design retainer" />
        <Field label="Amount" name="amount" type="number" placeholder="3200" />
        <Field label="Date" name="date" type="date" />
        <CategoryPicker categories={categories} name="categoryId" label="Income category" placeholder="Choose income category" allowedTypes={[CategoryType.INCOME]} defaultType={CategoryType.INCOME} />
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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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
      formElement.reset();
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
        <Field label="Merchant" name="merchant" placeholder="Massy Stores groceries" />
        <Field label="Amount" name="amount" type="number" placeholder="820.50" />
        <Field label="Date" name="date" type="date" />
        <CategoryPicker categories={categories} name="categoryId" label="Expense category" placeholder="Choose expense category" allowedTypes={[CategoryType.EXPENSE]} defaultType={CategoryType.EXPENSE} />
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
  return <BillEditorForm categories={categories} />;
}

export function BillEditorForm({
  categories,
  endpoint = "/api/bills",
  method = "POST",
  submitLabel = "Add bill",
  surface = "card",
  initialValues,
  onSaved,
}: {
  categories: Category[];
  endpoint?: string;
  method?: "POST" | "PATCH";
  submitLabel?: string;
  surface?: "card" | "plain";
  initialValues?: {
    name: string;
    amount: number;
    dueDate: string;
    categoryId?: string | null;
    frequency: Frequency;
    status: BillStatus;
  };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitJson(endpoint, {
        name: fieldValue(form, "name"),
        amount: fieldValue(form, "amount"),
        dueDate: fieldValue(form, "dueDate"),
        categoryId: fieldValue(form, "categoryId") || null,
        frequency: fieldValue(form, "frequency"),
        status: fieldValue(form, "status"),
      }, method);
      toast.success(method === "PATCH" ? "Bill updated" : "Bill added");
      formElement.reset();
      onSaved?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add bill");
    } finally {
      setPending(false);
    }
  }

  const form = (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Bill name" name="name" placeholder="T&TEC electricity" defaultValue={initialValues?.name} />
        <Field label="Amount" name="amount" type="number" placeholder="690" defaultValue={initialValues?.amount ? String(initialValues.amount) : undefined} />
        <Field label="Due date" name="dueDate" type="date" defaultValue={initialValues?.dueDate} />
        <CategoryPicker categories={categories} name="categoryId" label="Bill category" placeholder="Choose bill category" allowedTypes={[CategoryType.BILL]} defaultType={CategoryType.BILL} defaultValue={initialValues?.categoryId} />
        <FrequencySelect defaultValue={initialValues?.frequency ?? Frequency.MONTHLY} />
        <Select name="status" defaultValue={initialValues?.status ?? BillStatus.UNPAID}>
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
        <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : submitLabel}</Button>
    </form>
  );

  if (surface === "plain") {
    return form;
  }

  return (
    <EntryCard title="Add recurring bill" description="Keep subscriptions, rent, utilities, and due dates visible.">
      {form}
    </EntryCard>
  );
}

export function BudgetForm({ categories }: { categories: Category[] }) {
  return <BudgetEditorForm categories={categories} />;
}

export function BudgetEditorForm({
  categories,
  endpoint = "/api/budgets",
  method = "POST",
  submitLabel = "Create budget",
  surface = "card",
  initialValues,
  onSaved,
}: {
  categories: Category[];
  endpoint?: string;
  method?: "POST" | "PATCH";
  submitLabel?: string;
  surface?: "card" | "plain";
  initialValues?: {
    name: string;
    limitAmount: number;
    categoryId?: string | null;
    period?: Frequency;
  };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitJson(endpoint, {
        name: fieldValue(form, "name"),
        limitAmount: fieldValue(form, "limitAmount"),
        categoryId: fieldValue(form, "categoryId"),
        period: initialValues?.period ?? Frequency.MONTHLY,
      }, method);
      toast.success(method === "PATCH" ? "Budget updated" : "Budget created");
      formElement.reset();
      onSaved?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create budget");
    } finally {
      setPending(false);
    }
  }

  const form = (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Budget name" name="name" placeholder="Groceries budget" defaultValue={initialValues?.name} />
        <Field label="Monthly limit" name="limitAmount" type="number" placeholder="2800" defaultValue={initialValues?.limitAmount ? String(initialValues.limitAmount) : undefined} />
        <CategoryPicker categories={categories} name="categoryId" label="Budget category" placeholder="Choose budget category" allowedTypes={[CategoryType.EXPENSE, CategoryType.BILL]} defaultValue={initialValues?.categoryId} required />
        <Button type="submit" disabled={pending} className="md:self-end">
          {pending ? "Saving..." : submitLabel}
        </Button>
    </form>
  );

  if (surface === "plain") {
    return form;
  }

  return (
    <EntryCard title="Create monthly budget" description="Set practical category limits and let Cash Compass track the pace.">
      {form}
    </EntryCard>
  );
}

export function SavingsGoalForm() {
  return <SavingsGoalEditorForm />;
}

export function SavingsGoalEditorForm({
  endpoint = "/api/savings-goals",
  method = "POST",
  submitLabel = "Create goal",
  surface = "card",
  initialValues,
  onSaved,
}: {
  endpoint?: string;
  method?: "POST" | "PATCH";
  submitLabel?: string;
  surface?: "card" | "plain";
  initialValues?: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    color: string;
  };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitJson(endpoint, {
        name: fieldValue(form, "name"),
        targetAmount: fieldValue(form, "targetAmount"),
        currentAmount: fieldValue(form, "currentAmount"),
        targetDate: fieldValue(form, "targetDate"),
        color: fieldValue(form, "color") || "#22c55e",
      }, method);
      toast.success(method === "PATCH" ? "Savings goal updated" : "Savings goal added");
      formElement.reset();
      onSaved?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add goal");
    } finally {
      setPending(false);
    }
  }

  const form = (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label="Goal name" name="name" placeholder="Emergency fund" defaultValue={initialValues?.name} />
      <Field label="Target amount" name="targetAmount" type="number" placeholder="10000" defaultValue={initialValues?.targetAmount ? String(initialValues.targetAmount) : undefined} />
      <Field label="Current saved" name="currentAmount" type="number" placeholder="2400" defaultValue={initialValues?.currentAmount ? String(initialValues.currentAmount) : undefined} />
      <Field label="Target date" name="targetDate" type="date" defaultValue={initialValues?.targetDate} />
      <Field label="Accent color" name="color" type="color" defaultValue={initialValues?.color ?? "#22c55e"} />
      <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : submitLabel}</Button>
    </form>
  );

  if (surface === "plain") {
    return form;
  }

  return (
    <EntryCard title="Create savings goal" description="Set a target and watch progress build over time.">
      {form}
    </EntryCard>
  );
}

export function TransactionForm({
  categories,
  defaultKind = TransactionKind.EXPENSE,
  lockedKind,
  surface = "card",
  endpoint = "/api/transactions",
  method = "POST",
  submitLabel,
  initialValues,
  onSaved,
}: {
  categories: Category[];
  defaultKind?: TransactionKind;
  lockedKind?: TransactionKind;
  surface?: "card" | "plain";
  endpoint?: string;
  method?: "POST" | "PATCH";
  submitLabel?: string;
  initialValues?: {
    title: string;
    amount: number;
    date: string;
    kind: TransactionKind;
    categoryId?: string | null;
    paymentType?: PaymentType | null;
    notes?: string | null;
    isRecurring?: boolean;
  };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState(lockedKind ?? initialValues?.kind ?? defaultKind);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitJson(endpoint, {
        title: fieldValue(form, "title"),
        amount: fieldValue(form, "amount"),
        date: fieldValue(form, "date"),
        kind: fieldValue(form, "kind"),
        categoryId: fieldValue(form, "categoryId") || null,
        paymentType: fieldValue(form, "paymentType") || null,
        notes: fieldValue(form, "notes"),
        isRecurring: form.get("isRecurring") === "on",
      }, method);
      toast.success(method === "PATCH" ? "Transaction updated" : "Transaction added");
      formElement.reset();
      setKind(lockedKind ?? initialValues?.kind ?? defaultKind);
      onSaved?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add transaction");
    } finally {
      setPending(false);
    }
  }

  const form = (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label={kind === TransactionKind.INCOME ? "Income source" : "Merchant or payee"} name="title" placeholder={kind === TransactionKind.INCOME ? "Freelance design retainer" : "Unipet fuel"} defaultValue={initialValues?.title} />
      <Field label="Amount" name="amount" type="number" placeholder={kind === TransactionKind.INCOME ? "3200" : "340"} defaultValue={initialValues?.amount ? String(initialValues.amount) : undefined} />
      <Field label="Date" name="date" type="date" defaultValue={initialValues?.date} />
      {lockedKind ? (
        <input name="kind" value={lockedKind} readOnly hidden />
      ) : (
        <NativeSelectField
          label="Transaction type"
          name="kind"
          value={kind}
          onChange={(value) => setKind(value as TransactionKind)}
          options={Object.values(TransactionKind).map((value) => ({ value, label: value.toLowerCase() }))}
        />
      )}
      <CategoryPicker
        categories={categories}
        name="categoryId"
        label="Category"
        placeholder="Choose category"
        allowedTypes={kind === TransactionKind.INCOME ? [CategoryType.INCOME] : [CategoryType.EXPENSE]}
        defaultType={kind === TransactionKind.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE}
        defaultValue={initialValues?.categoryId}
      />
      {kind === TransactionKind.EXPENSE ? <PaymentSelect defaultValue={initialValues?.paymentType ?? PaymentType.CARD} /> : <div className="hidden md:block" />}
      <RecurringToggle defaultChecked={initialValues?.isRecurring} />
      <NotesField defaultValue={initialValues?.notes ?? undefined} />
      <Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Saving..." : submitLabel ?? (kind === TransactionKind.INCOME ? "Add income" : "Add expense")}</Button>
    </form>
  );

  if (surface === "plain") {
    return form;
  }

  return (
    <EntryCard title="Quick transaction" description="Add income or spending directly to the unified ledger.">
      {form}
    </EntryCard>
  );
}

function EntryCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="glass-panel spotlight-card overflow-visible">
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

function PaymentSelect({ defaultValue = PaymentType.CARD }: { defaultValue?: PaymentType }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Payment type</Label>
      <Select name="paymentType" defaultValue={defaultValue}>
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

function NativeSelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function RecurringToggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
      <Checkbox id="isRecurring" name="isRecurring" defaultChecked={defaultChecked} />
      <Label htmlFor="isRecurring">Recurring</Label>
    </div>
  );
}

function NotesField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" name="notes" placeholder="Add helpful context for future you." defaultValue={defaultValue} />
    </div>
  );
}
