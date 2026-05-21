"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CategoryType } from "@/generated/prisma/browser";
import { CATEGORY_IN_USE_MESSAGE } from "@/lib/category-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ManagedCategory = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  usageCount: number;
};

const typeLabels: Record<CategoryType, string> = {
  [CategoryType.INCOME]: "Income",
  [CategoryType.EXPENSE]: "Expense",
  [CategoryType.BILL]: "Bill",
};

const typeDescriptions: Record<CategoryType, string> = {
  [CategoryType.INCOME]: "Available in income forms and filters.",
  [CategoryType.EXPENSE]: "Available in expense, transaction, and budget flows.",
  [CategoryType.BILL]: "Available in bill and budget flows.",
};

export function CategoryManagement({ categories }: { categories: ManagedCategory[] }) {
  const router = useRouter();
  const [items, setItems] = useState(categories);
  const [editing, setEditing] = useState<ManagedCategory | null>(null);
  const [deleting, setDeleting] = useState<ManagedCategory | null>(null);
  const [pending, setPending] = useState(false);

  const grouped = useMemo(() => {
    return Object.values(CategoryType).map((type) => ({
      type,
      categories: items.filter((category) => category.type === type),
    }));
  }, [items]);

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) {
      return;
    }

    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          color: String(form.get("color") ?? "#14b8a6"),
          icon: String(form.get("icon") ?? "tag"),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to update category");
      }

      const updated = {
        ...editing,
        name: String(form.get("name") ?? editing.name).trim(),
        color: String(form.get("color") ?? editing.color),
        icon: String(form.get("icon") ?? editing.icon).trim() || "tag",
      };

      setItems((current) =>
        current
          .map((category) => (category.id === updated.id ? updated : category))
          .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
      );
      toast.success("Category updated");
      setEditing(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update category");
    } finally {
      setPending(false);
    }
  }

  async function deleteCategory() {
    if (!deleting) {
      return;
    }

    if (deleting.usageCount > 0) {
      toast.error(CATEGORY_IN_USE_MESSAGE);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to delete category");
      }

      setItems((current) => current.filter((category) => category.id !== deleting.id));
      toast.success("Category deleted");
      setDeleting(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete category");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="glass-panel premium-glow spotlight-card overflow-visible">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="size-5 text-primary" aria-hidden="true" />
          Categories
        </CardTitle>
        <CardDescription>
          Manage the category names, colors, and icon labels used across transactions, bills, budgets, charts, and filters.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {items.length === 0 ? (
          <Empty className="border bg-background/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tags />
              </EmptyMedia>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>Create categories from the Transactions page, then manage them here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          grouped.map((group) => (
            <section key={group.type} className="grid gap-3">
              <div>
                <h3 className="text-sm font-semibold">{typeLabels[group.type]} categories</h3>
                <p className="text-xs text-muted-foreground">{typeDescriptions[group.type]}</p>
              </div>
              {group.categories.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-background/35 p-4 text-sm text-muted-foreground">
                  No {typeLabels[group.type].toLowerCase()} categories yet.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {group.categories.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/35 hover:bg-accent/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className="mt-1 size-3 shrink-0 rounded-full ring-2 ring-white/10"
                            style={{ backgroundColor: category.color }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{category.name}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{typeLabels[category.type]}</Badge>
                              <Badge variant={category.usageCount > 0 ? "outline" : "secondary"}>
                                {category.usageCount > 0 ? `${category.usageCount} linked` : "Unused"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Icon: {category.icon || "tag"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditing(category)}
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleting(category)}
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2
                              className={cn("size-4", category.usageCount > 0 ? "text-muted-foreground" : "text-destructive")}
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </CardContent>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Category type stays fixed so existing records, charts, and forms keep working.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <form onSubmit={saveCategory} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Name</Label>
                <Input id="category-name" name="name" defaultValue={editing.name} required maxLength={48} />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="category-icon">Icon label</Label>
                  <Input id="category-icon" name="icon" defaultValue={editing.icon} maxLength={32} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category-color">Color</Label>
                  <Input id="category-color" name="color" type="color" defaultValue={editing.color} className="h-10 w-14 p-1" />
                </div>
              </div>
              <div className="rounded-xl border bg-background/50 p-3 text-sm text-muted-foreground">
                Type: <span className="font-medium text-foreground">{typeLabels[editing.type]}</span>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save category"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              Unused categories can be removed. Categories linked to finance records are protected.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-background/50 p-4">
            <p className="font-medium">{deleting?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {deleting && deleting.usageCount > 0
                ? CATEGORY_IN_USE_MESSAGE
                : "This category is unused and can be deleted. This action cannot be undone."}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteCategory}
              disabled={pending || !deleting || deleting.usageCount > 0}
            >
              {pending ? "Deleting..." : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
