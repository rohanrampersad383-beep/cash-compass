import { ShieldCheck } from "lucide-react";
import { CurrencySettings } from "@/components/finance/currency-settings";
import { PageHeader } from "@/components/finance/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth";
import { normalizeCurrency } from "@/lib/finance";

export default async function SettingsPage() {
  const user = await requireUser();

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
