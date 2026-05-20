"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, CirclePlus, FilterX, Pencil, ReceiptText, Repeat2, Search, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BillStatus, CategoryType, Frequency, PaymentType, TransactionKind } from "@/generated/prisma/browser";
import { CategoryChip, type CategoryOption } from "@/components/finance/category-picker";
import { TransactionForm } from "@/components/finance/finance-form";
import { RecordActions } from "@/components/finance/record-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currency, type CurrencyCode } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type LedgerTransaction = {
  id: string;
  source: "transaction" | "income" | "expense";
  sourceId: string;
  title: string;
  amount: number;
  date: string;
  kind: TransactionKind;
  paymentType: PaymentType | null;
  isRecurring: boolean;
  notes: string | null;
  category: CategoryOption | null;
};

type LedgerBill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: Frequency;
  status: BillStatus;
  categoryId?: string | null;
  category: CategoryOption | null;
};

type LedgerRow =
  | (LedgerTransaction & { rowType: "transaction"; displayDate: Date })
  | (LedgerBill & { rowType: "bill"; displayDate: Date });

const tabs = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "bills", label: "Bills" },
  { id: "recurring", label: "Recurring" },
] as const;

const dateFilters = [
  { value: "all", label: "All dates" },
  { value: "month", label: "This month" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const categoryTypeLabels: Record<CategoryType, string> = {
  [CategoryType.INCOME]: "Income",
  [CategoryType.EXPENSE]: "Expense",
  [CategoryType.BILL]: "Bill",
};

export function TransactionLedger({
  transactions,
  bills,
  categories,
  currencyCode,
  initialIntent,
}: {
  transactions: LedgerTransaction[];
  bills: LedgerBill[];
  categories: CategoryOption[];
  currencyCode: CurrencyCode;
  initialIntent?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>(
    initialIntent === "income" ? "income" : initialIntent === "expense" ? "expenses" : "all",
  );
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentType, setPaymentType] = useState("all");
  const [dialog, setDialog] = useState<"income" | "expense" | "category" | null>(
    initialIntent === "income" ? "income" : initialIntent === "expense" ? "expense" : null,
  );
  const [editing, setEditing] = useState<LedgerTransaction | null>(null);
  const [deleting, setDeleting] = useState<LedgerTransaction | null>(null);
  const [categoryList, setCategoryList] = useState(categories);
  const [categoryPending, setCategoryPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const rows = useMemo<LedgerRow[]>(() => {
    const transactionRows: LedgerRow[] = transactions.map((transaction) => ({
      ...transaction,
      rowType: "transaction",
      displayDate: new Date(transaction.date),
    }));
    const billRows: LedgerRow[] = bills.map((bill) => ({
      ...bill,
      rowType: "bill",
      displayDate: new Date(bill.dueDate),
    }));
    return [...transactionRows, ...billRows].sort((a, b) => b.displayDate.getTime() - a.displayDate.getTime());
  }, [transactions, bills]);

  const filtered = rows.filter((row) => {
    const category = row.category;
    const title = row.rowType === "bill" ? row.name : row.title;
    const rowPayment = row.rowType === "transaction" ? row.paymentType : null;
    const recurring = row.rowType === "bill" ? row.frequency !== Frequency.ONCE : row.isRecurring;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "income" && row.rowType === "transaction" && row.kind === TransactionKind.INCOME) ||
      (activeTab === "expenses" && row.rowType === "transaction" && row.kind === TransactionKind.EXPENSE) ||
      (activeTab === "bills" && row.rowType === "bill") ||
      (activeTab === "recurring" && recurring);
    const matchesSearch = `${title} ${category?.name ?? ""}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesCategory = categoryId === "all" || category?.id === categoryId;
    const matchesPayment = paymentType === "all" || rowPayment === paymentType;
    const matchesDate = matchesDateFilter(row.displayDate, dateFilter);

    return matchesTab && matchesSearch && matchesCategory && matchesPayment && matchesDate;
  });

  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.kind === TransactionKind.INCOME) {
        acc.income += transaction.amount;
      } else {
        acc.expenses += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 },
  );

  async function createCategory(formData: FormData) {
    setCategoryPending(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          type: String(formData.get("type") ?? CategoryType.EXPENSE),
          color: String(formData.get("color") ?? "#14b8a6"),
          icon: String(formData.get("icon") ?? "tag"),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to create category");
      }
      setCategoryList((current) => [...current, json.category].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Category created");
      setDialog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create category");
    } finally {
      setCategoryPending(false);
    }
  }

  const resetFilters = () => {
    setActiveTab("all");
    setQuery("");
    setCategoryId("all");
    setDateFilter("all");
    setPaymentType("all");
  };

  async function deleteLedgerRow() {
    if (!deleting) {
      return;
    }

    setDeletePending(true);
    try {
      const response = await fetch(`/api/ledger/${deleting.source}/${deleting.sourceId}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to delete transaction");
      }
      toast.success("Transaction deleted");
      setDeleting(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete transaction");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <SummaryCard title="Income" value={currency(totals.income, currencyCode)} detail={`${transactions.filter((item) => item.kind === TransactionKind.INCOME).length} ledger entries`} tone="emerald" />
        <SummaryCard title="Expenses" value={currency(totals.expenses, currencyCode)} detail={`${transactions.filter((item) => item.kind === TransactionKind.EXPENSE).length} tracked payments`} tone="rose" />
        <SummaryCard title="Upcoming bills" value={String(bills.filter((bill) => bill.status === BillStatus.UNPAID).length)} detail="included in the Bills tab" tone="cyan" />
      </div>

      <Card className="glass-panel premium-glow spotlight-card min-w-0 overflow-visible">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Unified ledger</CardTitle>
              <CardDescription>Search, filter, and add money movement from one place.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setDialog("income")}>
                <ArrowUpRight className="size-4" aria-hidden="true" />
                Add income
              </Button>
              <Button variant="outline" onClick={() => setDialog("expense")}>
                <ArrowDownRight className="size-4" aria-hidden="true" />
                Add expense
              </Button>
              <Button variant="outline" onClick={() => setDialog("category")}>
                <CirclePlus className="size-4" aria-hidden="true" />
                Create category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4">
          <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative rounded-full border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                  activeTab === tab.id && "border-primary/40 bg-primary/10 text-foreground shadow-lg shadow-primary/10",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr_auto]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions, bills, categories" className="h-10 pl-9" />
            </div>
            <FilterSelect label="Category filter" value={categoryId} onChange={setCategoryId}>
              <option value="all">All categories</option>
              {Object.values(CategoryType).map((type) => (
                <optgroup key={type} label={categoryTypeLabels[type]}>
                  {categoryList.filter((category) => category.type === type).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </optgroup>
              ))}
            </FilterSelect>
            <FilterSelect label="Date filter" value={dateFilter} onChange={setDateFilter}>
              {dateFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Payment filter" value={paymentType} onChange={setPaymentType}>
              <option value="all">All payment types</option>
              {Object.values(PaymentType).map((type) => (
                <option key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</option>
              ))}
            </FilterSelect>
            <Button type="button" variant="outline" className="w-full lg:w-auto" onClick={resetFilters}>
              <FilterX className="size-4" aria-hidden="true" />
              Reset
            </Button>
          </div>

          {filtered.length === 0 ? (
            <Empty className="border bg-background/40">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Tags /></EmptyMedia>
                <EmptyTitle>No ledger rows match</EmptyTitle>
                <EmptyDescription>Adjust filters or create a transaction/category to keep your ledger complete.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-right font-medium">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, index) => (
                      <LedgerTableRow key={`${row.rowType}-${row.id}`} row={row} index={index} categories={categoryList} currencyCode={currencyCode} onEdit={setEditing} onDelete={setDeleting} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid min-w-0 gap-3 md:hidden">
                {filtered.map((row, index) => (
                  <LedgerMobileCard key={`${row.rowType}-${row.id}`} row={row} index={index} categories={categoryList} currencyCode={currencyCode} onEdit={setEditing} onDelete={setDeleting} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog === "income"} onOpenChange={(open) => setDialog(open ? "income" : null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add income</DialogTitle>
            <DialogDescription>Create an income ledger entry without leaving Transactions.</DialogDescription>
          </DialogHeader>
          <TransactionForm categories={categoryList} lockedKind={TransactionKind.INCOME} surface="plain" onSaved={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "expense"} onOpenChange={(open) => setDialog(open ? "expense" : null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>Log spending with category, payment type, and recurring context.</DialogDescription>
          </DialogHeader>
          <TransactionForm categories={categoryList} lockedKind={TransactionKind.EXPENSE} surface="plain" onSaved={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "category"} onOpenChange={(open) => setDialog(open ? "category" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create category</DialogTitle>
            <DialogDescription>Add a permanent category to this Cash Compass account.</DialogDescription>
          </DialogHeader>
          <form action={createCategory} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category name</Label>
              <Input id="name" name="name" placeholder="Doubles & lunch" required maxLength={48} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" defaultValue={CategoryType.EXPENSE} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm">
                {Object.values(CategoryType).map((type) => (
                  <option key={type} value={type}>{categoryTypeLabels[type]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon label</Label>
                <Input id="icon" name="icon" placeholder="tag" defaultValue="tag" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" type="color" defaultValue="#14b8a6" className="h-10 w-14 p-1" />
              </div>
            </div>
            <Button type="submit" disabled={categoryPending}>{categoryPending ? "Saving..." : "Create category"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>
              Update the ledger details. Legacy income and expense rows keep their original type.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <TransactionForm
              key={`${editing.source}-${editing.sourceId}`}
              categories={categoryList}
              lockedKind={editing.source === "transaction" ? undefined : editing.kind}
              defaultKind={editing.kind}
              surface="plain"
              endpoint={`/api/ledger/${editing.source}/${editing.sourceId}`}
              method="PATCH"
              submitLabel="Save changes"
              initialValues={{
                title: editing.title,
                amount: editing.amount,
                date: toDateInput(editing.date),
                kind: editing.kind,
                categoryId: editing.category?.id,
                paymentType: editing.paymentType,
                notes: editing.notes,
                isRecurring: editing.isRecurring,
              }}
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogDescription>
              This removes the ledger row from Cash Compass and updates dashboards, budgets, analytics, and insights after refresh.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-background/50 p-4">
            <p className="font-medium">{deleting?.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={deletePending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={deleteLedgerRow} disabled={deletePending}>
              {deletePending ? "Deleting..." : "Delete transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: "emerald" | "rose" | "cyan" }) {
  const tones = {
    emerald: "from-emerald-500/20",
    rose: "from-rose-500/20",
    cyan: "from-cyan-500/20",
  };

  return (
    <Card className={cn("glass-panel premium-glow min-w-0 bg-gradient-to-br to-transparent", tones[tone])}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = `filter-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div className="grid min-w-0 gap-1">
      <Label className="sr-only" htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </select>
    </div>
  );
}

function LedgerTableRow({
  row,
  index,
  categories,
  currencyCode,
  onEdit,
  onDelete,
}: {
  row: LedgerRow;
  index: number;
  categories: CategoryOption[];
  currencyCode: CurrencyCode;
  onEdit: (row: LedgerTransaction) => void;
  onDelete: (row: LedgerTransaction) => void;
}) {
  const display = rowDisplay(row, currencyCode);
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.25) }}
      className="border-t bg-background/20 transition hover:bg-accent/25 hover:shadow-[inset_3px_0_0_var(--primary)]"
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-10 items-center justify-center rounded-xl", display.iconTone)} aria-hidden="true">
            {display.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{display.title}</p>
            <p className="text-xs text-muted-foreground">{display.subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><CategoryChip category={row.category} /></td>
      <td className="px-4 py-4 text-muted-foreground">{display.date}</td>
      <td className="px-4 py-4">{display.badges}</td>
      <td className={cn("px-4 py-4 text-right font-semibold", display.amountTone)}>{display.amount}</td>
      <td className="px-4 py-4">
        {row.rowType === "transaction" ? <RowActions row={row} onEdit={onEdit} onDelete={onDelete} /> : <BillRowActions row={row} categories={categories} />}
      </td>
    </motion.tr>
  );
}

function LedgerMobileCard({
  row,
  index,
  categories,
  currencyCode,
  onEdit,
  onDelete,
}: {
  row: LedgerRow;
  index: number;
  categories: CategoryOption[];
  currencyCode: CurrencyCode;
  onEdit: (row: LedgerTransaction) => void;
  onDelete: (row: LedgerTransaction) => void;
}) {
  const display = rowDisplay(row, currencyCode);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.25) }}
      className="premium-glow spotlight-card min-w-0 max-w-full rounded-xl border bg-background/45 p-4 transition hover:-translate-y-1 hover:border-primary/45"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", display.iconTone)} aria-hidden="true">
            {display.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{display.title}</p>
            <p className="text-xs text-muted-foreground">{display.date} - {display.subtitle}</p>
          </div>
        </div>
        <p className={cn("shrink-0 text-right font-semibold", display.amountTone)}>{display.amount}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CategoryChip category={row.category} />
        {display.badges}
      </div>
      <div className="mt-3 flex justify-end">
        {row.rowType === "transaction" ? <RowActions row={row} onEdit={onEdit} onDelete={onDelete} /> : <BillRowActions row={row} categories={categories} />}
      </div>
    </motion.div>
  );
}

function BillRowActions({ row, categories }: { row: LedgerBill; categories: CategoryOption[] }) {
  return (
    <RecordActions
      kind="bill"
      categories={categories.filter((category) => category.type === CategoryType.BILL)}
      record={{
        id: row.id,
        name: row.name,
        amount: row.amount,
        dueDate: toDateInput(row.dueDate),
        frequency: row.frequency,
        status: row.status,
        categoryId: row.categoryId,
      }}
    />
  );
}

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: LedgerTransaction;
  onEdit: (row: LedgerTransaction) => void;
  onDelete: (row: LedgerTransaction) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(row)} aria-label={`Edit ${row.title}`}>
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete(row)} aria-label={`Delete ${row.title}`}>
        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
      </Button>
    </div>
  );
}

function rowDisplay(row: LedgerRow, currencyCode: CurrencyCode) {
  if (row.rowType === "bill") {
    return {
      title: row.name,
      subtitle: `${row.frequency.toLowerCase()} bill`,
      date: row.displayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      amount: currency(row.amount, currencyCode),
      amountTone: "text-amber-300",
      iconTone: "bg-amber-500/15 text-amber-300",
      icon: <ReceiptText className="size-4" />,
      badges: (
        <div className="flex flex-wrap gap-2">
          <Badge variant={row.status === BillStatus.PAID ? "secondary" : "outline"}>{row.status.toLowerCase()}</Badge>
          {row.frequency !== Frequency.ONCE ? <Badge variant="secondary"><Repeat2 className="size-3" aria-hidden="true" /> recurring</Badge> : null}
        </div>
      ),
    };
  }

  const income = row.kind === TransactionKind.INCOME;
  return {
    title: row.title,
    subtitle: row.paymentType?.replaceAll("_", " ").toLowerCase() ?? "ledger entry",
    date: row.displayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    amount: `${income ? "+" : "-"}${currency(row.amount, currencyCode)}`,
    amountTone: income ? "text-emerald-300" : "text-rose-300",
    iconTone: income ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300",
    icon: income ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />,
    badges: (
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{row.kind.toLowerCase()}</Badge>
        {row.isRecurring ? <Badge variant="outline"><Repeat2 className="size-3" aria-hidden="true" /> recurring</Badge> : null}
      </div>
    ),
  };
}

function matchesDateFilter(date: Date, filter: string) {
  const now = new Date();
  if (filter === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (filter === "30" || filter === "90") {
    const start = new Date(now);
    start.setDate(now.getDate() - Number(filter));
    return date >= start && date <= now;
  }
  return true;
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
