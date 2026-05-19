"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/finance";

type CategoryDatum = { name: string; value: number; color: string };
type MonthlyDatum = { month: string; income: number; expenses: number; savings: number };

const chartMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

export function SpendingChart({ data }: { data: CategoryDatum[] }) {
  return (
    <motion.div {...chartMotion}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
          <CardDescription>Your month-to-date expense mix.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105} paddingAngle={4}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function IncomeExpenseChart({ data }: { data: MonthlyDatum[] }) {
  return (
    <motion.div {...chartMotion}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Income vs expense</CardTitle>
          <CardDescription>Six-month flow with soft chart reveals.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="var(--chart-1)" />
              <Bar dataKey="expenses" radius={[8, 8, 0, 0]} fill="var(--chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SavingsTrendChart({ data }: { data: MonthlyDatum[] }) {
  return (
    <motion.div {...chartMotion}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Monthly savings trend</CardTitle>
          <CardDescription>Net money left after expenses.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="savings" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.16} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Area type="monotone" dataKey="savings" stroke="var(--chart-1)" fill="url(#savings)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
