"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BillStatus, Frequency } from "@/generated/prisma/browser";
import { BillEditorForm, BudgetEditorForm, SavingsGoalEditorForm } from "@/components/finance/finance-form";
import type { CategoryOption } from "@/components/finance/category-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type RecordKind = "bill" | "budget" | "goal";

type BillRecord = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: Frequency;
  status: BillStatus;
  categoryId?: string | null;
};

type BudgetRecord = {
  id: string;
  name: string;
  limitAmount: number;
  categoryId?: string | null;
  period: Frequency;
};

type GoalRecord = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
};

type EditableRecord =
  | { kind: "bill"; record: BillRecord; categories: CategoryOption[] }
  | { kind: "budget"; record: BudgetRecord; categories: CategoryOption[] }
  | { kind: "goal"; record: GoalRecord; categories?: never };

const recordLabels: Record<RecordKind, { singular: string; endpoint: string }> = {
  bill: { singular: "bill", endpoint: "/api/bills" },
  budget: { singular: "budget", endpoint: "/api/budgets" },
  goal: { singular: "savings goal", endpoint: "/api/savings-goals" },
};

export function RecordActions(props: EditableRecord) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const label = recordLabels[props.kind];

  async function deleteRecord() {
    setDeletePending(true);
    try {
      const response = await fetch(`${label.endpoint}/${props.record.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? `Unable to delete ${label.singular}`);
      }
      toast.success(`${capitalize(label.singular)} deleted`);
      setDeleting(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to delete ${label.singular}`);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={`Edit ${props.record.name}`}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDeleting(true)} aria-label={`Delete ${props.record.name}`}>
          <Trash2 className="size-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {label.singular}</DialogTitle>
            <DialogDescription>Save changes and Cash Compass will refresh the affected summaries.</DialogDescription>
          </DialogHeader>
          <RecordEditForm {...props} onSaved={() => setEditing(false)} endpoint={`${label.endpoint}/${props.record.id}`} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {label.singular}?</DialogTitle>
            <DialogDescription>This removes the record and refreshes dashboards, analytics, budgets, and insights.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-background/50 p-4">
            <p className="font-medium">{props.record.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleting(false)} disabled={deletePending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={deleteRecord} disabled={deletePending}>
              {deletePending ? "Deleting..." : `Delete ${label.singular}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecordEditForm(props: EditableRecord & { endpoint: string; onSaved: () => void }) {
  if (props.kind === "bill") {
    return (
      <BillEditorForm
        categories={props.categories}
        endpoint={props.endpoint}
        method="PATCH"
        surface="plain"
        submitLabel="Save bill"
        initialValues={props.record}
        onSaved={props.onSaved}
      />
    );
  }

  if (props.kind === "budget") {
    return (
      <BudgetEditorForm
        categories={props.categories}
        endpoint={props.endpoint}
        method="PATCH"
        surface="plain"
        submitLabel="Save budget"
        initialValues={props.record}
        onSaved={props.onSaved}
      />
    );
  }

  return (
    <SavingsGoalEditorForm
      endpoint={props.endpoint}
      method="PATCH"
      surface="plain"
      submitLabel="Save goal"
      initialValues={props.record}
      onSaved={props.onSaved}
    />
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
