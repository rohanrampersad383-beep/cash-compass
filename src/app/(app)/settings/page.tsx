import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CategoryManagement } from "@/components/finance/category-management";
import { CurrencySettings } from "@/components/finance/currency-settings";
import { DeleteAccountControl } from "@/components/finance/delete-account-control";
import { LogoutAllSessionsControl } from "@/components/finance/logout-all-sessions-control";
import { PageHeader } from "@/components/finance/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth";
import { normalizeCurrency } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await requireUser();
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
      icon: true,
      _count: {
        select: {
          transactions: true,
          incomes: true,
          expenses: true,
          bills: true,
          budgets: true,
        },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description="Account, privacy, and Cash Compass workspace preferences." />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your signed-in demo or registered account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Setting label="Name" value={user.name} />
          <Setting label="Email" value={user.email} />
          <Setting label="Display currency" value={normalizeCurrency(user.currencyCode)} />
        </CardContent>
      </Card>
      <CurrencySettings initialCurrency={user.currencyCode} />
      <CategoryManagement
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          usageCount:
            category._count.transactions +
            category._count.incomes +
            category._count.expenses +
            category._count.bills +
            category._count.budgets,
        }))}
      />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Privacy and data controls</CardTitle>
          <CardDescription>Review what Cash Compass stores and control your account data.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            The privacy notice explains stored account data, finance records, CSV imports, Vercel Analytics, and deletion controls.
          </div>
          <Button variant="outline" render={<Link href="/privacy" />}>View privacy notice</Button>
        </CardContent>
      </Card>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Security model
          </CardTitle>
          <CardDescription>Version 1 uses server-side checks and avoids bank-linking.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {["Hashed passwords with bcrypt", "HTTP-only session cookies", "User-scoped Prisma queries", "Manual CSV uploads only"].map((item) => (
            <div key={item} className="rounded-xl border bg-background/50 p-4">
              <Badge variant="secondary">Enabled</Badge>
              <p className="mt-3 font-medium">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Session management</CardTitle>
          <CardDescription>Session cookies are HTTP-only, secure in production, and expire automatically.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Use this if you signed in on another device or want to invalidate all active sessions for this account.
          </p>
          <LogoutAllSessionsControl />
        </CardContent>
      </Card>
      <Card className="glass-panel border-destructive/30">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Permanently delete this account and all app data associated with it.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Deletion is user-scoped, requires confirmation, clears your session, and cannot be undone.
          </p>
          <DeleteAccountControl />
        </CardContent>
      </Card>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      <Separator className="mt-4" />
    </div>
  );
}
