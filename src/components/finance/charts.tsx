"use client";

import { motion } from "framer-motion";
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

const chartMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

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
  return (
    <motion.div {...chartMotion}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
          <CardDescription>Your month-to-date expense mix.</CardDescription>
        </CardHeader>
        {data.length === 0 ? (
          <CardContent className="h-80 min-w-0">
            <Empty className="h-full border bg-background/40">
              <EmptyHeader>
                <EmptyTitle>No spending yet</EmptyTitle>
                <EmptyDescription>Add expenses or import a CSV to see categories.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <ChartSurface className="h-80 min-w-0">
            {({ width, height }) => (
            <PieChart width={width} height={height}>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105} paddingAngle={4}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currency(Number(value), currencyCode)} />
            </PieChart>
            )}
          </ChartSurface>
        )}
      </Card>
    </motion.div>
  );
}

export function IncomeExpenseChart({ data, currencyCode = "TTD" }: { data: MonthlyDatum[]; currencyCode?: CurrencyCode }) {
  return (
    <motion.div {...chartMotion}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Income vs expense</CardTitle>
          <CardDescription>Six-month flow with soft chart reveals.</CardDescription>
        </CardHeader>
        <ChartSurface className="h-80 min-w-0">
          {({ width, height }) => (
            <BarChart data={data} width={width} height={height}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => compactCurrency(Number(value), currencyCode)} tickLine={false} axisLine={false} width={64} />
              <Tooltip formatter={(value) => currency(Number(value), currencyCode)} />
              <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="var(--chart-1)" />
              <Bar dataKey="expenses" radius={[8, 8, 0, 0]} fill="var(--chart-4)" />
            </BarChart>
          )}
        </ChartSurface>
      </Card>
    </motion.div>
  );
}

export function SavingsTrendChart({ data, currencyCode = "TTD" }: { data: MonthlyDatum[]; currencyCode?: CurrencyCode }) {
  return (
    <motion.div {...chartMotion}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Monthly savings trend</CardTitle>
          <CardDescription>Net money left after expenses.</CardDescription>
        </CardHeader>
        <ChartSurface className="h-72 min-w-0">
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
              <Area type="monotone" dataKey="savings" stroke="var(--chart-1)" fill="url(#savings)" strokeWidth={3} />
            </AreaChart>
          )}
        </ChartSurface>
      </Card>
    </motion.div>
  );
}
