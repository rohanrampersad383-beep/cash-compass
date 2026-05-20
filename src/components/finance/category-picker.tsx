"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, Tag } from "lucide-react";
import { CategoryType } from "@/generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type CategoryOption = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

const typeLabels: Record<CategoryType, string> = {
  [CategoryType.INCOME]: "Income",
  [CategoryType.EXPENSE]: "Expenses",
  [CategoryType.BILL]: "Bills",
};

export function CategoryChip({ category, className }: { category?: CategoryOption | null; className?: string }) {
  if (!category) {
    return <span className={cn("rounded-full border px-2 py-0.5 text-xs text-muted-foreground", className)}>Uncategorized</span>;
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", className)}
      style={{ borderColor: `${category.color}55`, backgroundColor: `${category.color}18`, color: category.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />
      {category.name}
    </span>
  );
}

export function CategoryPicker({
  categories,
  name,
  label = "Category",
  placeholder = "Choose category",
  allowedTypes,
  defaultValue,
  required = false,
}: {
  categories: CategoryOption[];
  name: string;
  label?: string;
  placeholder?: string;
  allowedTypes?: CategoryType[];
  defaultType?: CategoryType;
  defaultValue?: string | null;
  required?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const types = useMemo(() => allowedTypes ?? Object.values(CategoryType), [allowedTypes]);
  const localCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);
  const selected = localCategories.find((category) => category.id === selectedId && types.includes(category.type));

  const filtered = localCategories.filter((category) => {
    const matchesType = types.includes(category.type);
    const matchesQuery = category.name.toLowerCase().includes(query.toLowerCase().trim());
    return matchesType && matchesQuery;
  });

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className="relative flex flex-col gap-2">
      <Label>{label}</Label>
      <input name={name} value={selected?.id ?? ""} required={required} readOnly hidden />
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        className="h-10 w-full justify-between bg-background/50 px-3 text-left"
        onClick={() => {
          updatePosition();
          setOpen((current) => !current);
        }}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} aria-hidden="true" />
              <span className="truncate">{selected.name}</span>
              <span className="text-xs text-muted-foreground">{typeLabels[selected.type]}</span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Tag className="size-4" aria-hidden="true" />
              {placeholder}
            </span>
          )}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </Button>

      {open && typeof document !== "undefined" && position.width > 0 ? createPortal(
        <div
          className="fixed z-[120] overflow-hidden rounded-xl border bg-popover shadow-2xl shadow-black/30 ring-1 ring-foreground/10"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <CategoryMenu
            query={query}
            setQuery={setQuery}
            filtered={filtered}
            types={types}
            selectedId={selectedId}
            onSelect={(categoryId) => {
              setSelectedId(categoryId);
              setOpen(false);
            }}
          />
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function CategoryMenu({
  query,
  setQuery,
  filtered,
  types,
  selectedId,
  onSelect,
}: {
  query: string;
  setQuery: (value: string) => void;
  filtered: CategoryOption[];
  types: CategoryType[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b p-2">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories"
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-0"
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {types.map((type) => {
          const group = filtered.filter((category) => category.type === type);
          if (group.length === 0) {
            return null;
          }
          return (
            <div key={type} className="py-1">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{typeLabels[type]}</p>
              {group.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  onClick={() => onSelect(category.id)}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{category.name}</span>
                  {selectedId === category.id ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matching categories yet.</div>
        ) : null}
      </div>
    </>
  );
}
