"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { compactCurrency, currency, type CurrencyCode } from "@/lib/finance";

type CategoryDatum = { name: string; value: number; color: string };
type MonthlyDatum = { month: string; income: number; expenses: number; savings: number };

const MAX_DONUT_CATEGORIES = 6;
const OTHER_CATEGORY_COLOR = "#64748b";

function ChartFrame({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0 w-full"
    >
      {children}
    </motion.div>
  );
}

function ChartSurface({
  className,
  children,
}: {
  className: string;
  children: (size: { width: number; height: number }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = { width: Math.floor(rect.width), height: Math.floor(rect.height) };
      setSize((currentSize) =>
        currentSize.width === nextSize.width && currentSize.height === nextSize.height ? currentSize : nextSize,
      );
    };

    const frame = requestAnimationFrame(updateSize);
    window.addEventListener("resize", updateSize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <CardContent ref={ref} className={className}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </CardContent>
  );
}

export function SpendingChart({ data, currencyCode = "TTD" }: { data: CategoryDatum[]; currencyCode?: CurrencyCode }) {
  const reducedMotion = useReducedMotion();
  const { entries, total, topCategory } = prepareCategoryData(data);
  const ariaSummary = entries
    .map((entry) => `${entry.name}: ${currency(entry.value, currencyCode)}, ${formatPercent(entry.value, total)}`)
    .join("; ");

  return (
    <ChartFrame>
      <Card className="glass-panel premium-glow spotlight-card min-w-0 w-full">
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
          <CardDescription>Your month-to-date expense mix.</CardDescription>
        </CardHeader>
        {entries.length === 0 ? (
          <CardContent className="h-80 min-w-0">
            <Empty className="h-full border bg-background/40">
              <EmptyHeader>
                <EmptyTitle>No spending yet</EmptyTitle>
                <EmptyDescription>Add expenses or import a CSV to see categories.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <CardContent className="grid min-w-0 gap-5 px-4 pb-5 pt-0 2xl:grid-cols-[minmax(13rem,0.9fr)_minmax(15rem,1fr)] 2xl:items-center">
            <div
              className="relative min-w-0"
              role="img"
              aria-label={`Spending by category chart. Total spent ${currency(total, currencyCode)}. ${ariaSummary}`}
            >
              <ChartSurface className="chart-reveal h-64 min-w-0 sm:h-72 md:h-80">
                {({ width, height }) => {
                  const outerRadius = Math.max(82, Math.min(112, Math.floor(Math.min(width, height) / 2) - 18));
                  const innerRadius = Math.max(62, Math.floor(outerRadius * 0.74));

                  return (
                    <PieChart width={width} height={height}>
                      <Pie
                        data={entries}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={3}
                        cornerRadius={8}
                        stroke="hsl(var(--background))"
                        strokeWidth={3}
                        isAnimationActive={!reducedMotion}
                        animationBegin={60}
                        animationDuration={520}
                        animationEasing="ease-out"
                      >
                        {entries.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} aria-label={`${entry.name}, ${formatPercent(entry.value, total)}`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(Number(value), currencyCode)} />
                    </PieChart>
                  );
                }}
              </ChartSurface>
            </div>
            <SpendingLegend entries={entries} total={total} topCategory={topCategory} currencyCode={currencyCode} />
          </CardContent>
        )}
      </Card>
    </ChartFrame>
  );
}

function prepareCategoryData(data: CategoryDatum[]) {
  const sorted = data.filter((entry) => entry.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, entry) => sum + entry.value, 0);

  if (sorted.length <= MAX_DONUT_CATEGORIES) {
    return { entries: sorted, total, topCategory: sorted[0] };
  }

  const leadingCategories = sorted.slice(0, MAX_DONUT_CATEGORIES - 1);
  const otherValue = sorted.slice(MAX_DONUT_CATEGORIES - 1).reduce((sum, entry) => sum + entry.value, 0);
  const entries = otherValue > 0
    ? [...leadingCategories, { name: "Other", value: otherValue, color: OTHER_CATEGORY_COLOR }]
    : leadingCategories;

  return { entries, total, topCategory: entries[0] };
}

function formatPercent(value: number, total: number) {
  if (total <= 0 || value <= 0) {
    return "0%";
  }

  const percent = (value / total) * 100;
  return percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

function SpendingLegend({
  entries,
  total,
  topCategory,
  currencyCode,
}: {
  entries: CategoryDatum[];
  total: number;
  topCategory: CategoryDatum;
  currencyCode: CurrencyCode;
}) {
  return (
    <div className="min-w-0 space-y-2" aria-label="Spending by category legend">
      <div className="grid gap-2 rounded-2xl border border-white/10 bg-background/45 p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Total spent</p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">{currency(total, currencyCode)}</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">{entries.length} categories</p>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: topCategory.color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">Top category</p>
            <p className="truncate text-sm font-semibold text-foreground" title={topCategory.name}>{topCategory.name}</p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-sm font-semibold text-foreground">{currency(topCategory.value, currencyCode)}</p>
            <p className="text-xs text-muted-foreground">{formatPercent(topCategory.value, total)}</p>
          </div>
        </div>
      </div>
      <div className="grid min-w-0 gap-2">
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-background/35 px-3 py-2.5 transition-colors duration-200 hover:border-white/20 hover:bg-background/55 focus-within:border-white/25"
          >
            <span
              className="h-3.5 w-3.5 rounded-full ring-2 ring-white/10"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{formatPercent(entry.value, total)} of total spending</p>
            </div>
            <p className="shrink-0 text-right text-sm font-semibold text-foreground">{currency(entry.value, currencyCode)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IncomeExpenseChart({ data, currencyCode = "TTD" }: { data: MonthlyDatum[]; currencyCode?: CurrencyCode }) {
  const reducedMotion = useReducedMotion();

  return (
    <ChartFrame>
      <Card className="glass-panel premium-glow spotlight-card min-w-0 w-full">
        <CardHeader>
          <CardTitle>Income vs expense</CardTitle>
          <CardDescription>Six-month flow with soft chart reveals.</CardDescription>
        </CardHeader>
        <ChartSurface className="chart-reveal h-80 min-w-0">
          {({ width, height }) => (
            <BarChart data={data} width={width} height={height}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => compactCurrency(Number(value), currencyCode)} tickLine={false} axisLine={false} width={64} />
              <Tooltip formatter={(value) => currency(Number(value), currencyCode)} />
              <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="var(--chart-1)" isAnimationActive={!reducedMotion} animationBegin={80} animationDuration={620} animationEasing="ease-out" />
              <Bar dataKey="expenses" radius={[8, 8, 0, 0]} fill="var(--chart-4)" isAnimationActive={!reducedMotion} animationBegin={180} animationDuration={680} animationEasing="ease-out" />
            </BarChart>
          )}
        </ChartSurface>
      </Card>
    </ChartFrame>
  );
}

export function SavingsTrendChart({ data, currencyCode = "TTD" }: { data: MonthlyDatum[]; currencyCode?: CurrencyCode }) {
  const reducedMotion = useReducedMotion();

  return (
    <ChartFrame>
      <Card className="glass-panel premium-glow spotlight-card min-w-0 w-full">
        <CardHeader>
          <CardTitle>Monthly savings trend</CardTitle>
          <CardDescription>Net money left after expenses.</CardDescription>
        </CardHeader>
        <ChartSurface className="chart-reveal h-72 min-w-0">
          {({ width, height }) => (
            <AreaChart data={data} width={width} height={height}>
              <defs>
                <linearGradient id="savings" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.16} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => compactCurrency(Number(value), currencyCode)} tickLine={false} axisLine={false} width={64} />
              <Tooltip formatter={(value) => currency(Number(value), currencyCode)} />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="var(--chart-1)"
                fill="url(#savings)"
                strokeWidth={3}
                isAnimationActive={!reducedMotion}
                animationBegin={80}
                animationDuration={780}
                animationEasing="ease-out"
                dot={{ r: 3, strokeWidth: 2, fill: "var(--background)", stroke: "var(--chart-1)" }}
                activeDot={{ r: 6, strokeWidth: 2, fill: "var(--chart-1)", stroke: "var(--background)" }}
              />
            </AreaChart>
          )}
        </ChartSurface>
      </Card>
    </ChartFrame>
  );
}
