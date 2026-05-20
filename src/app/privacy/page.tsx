import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Database, FileSpreadsheet, LineChart, ShieldCheck, Trash2 } from "lucide-react";
import { CashCompassLogo } from "@/components/brand/cash-compass-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How Cash Compass stores, uses, and deletes personal finance tracker data.",
};

const privacySections = [
  {
    title: "Data stored in your account",
    icon: Database,
    items: [
      "Name, email address, display currency, and password hash.",
      "Transactions, income, expenses, bills, budgets, savings goals, categories, and session records.",
      "Uploaded statement import records, including the file name and imported transaction rows you confirm.",
    ],
  },
  {
    title: "CSV imports",
    icon: FileSpreadsheet,
    items: [
      "CSV files are manually selected by you and previewed before import.",
      "Cash Compass stores only the cleaned rows you confirm for transaction tracking.",
      "The app does not ask for bank login credentials or direct bank-linking access.",
    ],
  },
  {
    title: "Analytics",
    icon: LineChart,
    items: [
      "Vercel Analytics is used for basic page-view analytics and product reliability signals.",
      "Analytics helps understand which pages are used, but it is not a replacement for financial advice.",
    ],
  },
  {
    title: "Your controls",
    icon: Trash2,
    items: [
      "Settings includes an account deletion control for deleting your account and associated app data.",
      "Deletion removes your finance records from the application database and clears your session.",
      "While Cash Compass is still improving, use sample or test data instead of sensitive real financial details.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 grid-glow opacity-30" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 ambient-spotlight" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-5xl gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label="Cash Compass home">
            <CashCompassLogo />
          </Link>
          <Button variant="outline" render={<Link href="/" />}>
            <ArrowLeft data-icon="inline-start" />
            Back home
          </Button>
        </header>

        <section className="grid gap-4">
          <Badge variant="secondary" className="w-fit">Privacy notice</Badge>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Simple data transparency for Cash Compass.</h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Cash Compass is a personal finance tracker that stores the records you create so the dashboard,
              charts, budgets, and rule-based insights can work. This notice explains what is stored, how CSV
              imports are handled, and how you can delete your account data.
            </p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {privacySections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>Clear, practical details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-3 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="glass-panel border-primary/20">
          <CardHeader>
            <CardTitle>Current readiness</CardTitle>
            <CardDescription>Use the app with appropriate caution while it continues to improve.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>
              Cash Compass uses hashed passwords, HTTP-only cookies, user-scoped database queries, rate limiting,
              origin checks, CSV validation, and security headers. It is still an evolving app, so sample or test
              data is recommended over highly sensitive financial data.
            </p>
            <p>
              Account deletion is available in Settings after sign-in. It deletes the account and associated finance
              records for the signed-in user.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
