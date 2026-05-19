import Link from "next/link";
import { ArrowRight, Banknote, Bot, FileSpreadsheet, LockKeyhole, PieChart, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const features = [
  { title: "Track flow", description: "Income, expenses, bills, and savings sit in one calm dashboard.", icon: WalletCards },
  { title: "Import manually", description: "Preview CSV statements before saving rows to your account.", icon: FileSpreadsheet },
  { title: "Simple insights", description: "Rule-based guidance explains what changed without accounting jargon.", icon: Bot },
  { title: "Private by design", description: "No bank credentials, hashed passwords, scoped user data.", icon: ShieldCheck },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="relative min-h-screen px-4 py-6">
        <div className="absolute inset-0 grid-glow opacity-50" />
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full border border-primary/20 bg-primary/10 blur-3xl" />
        <header className="relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl border bg-background/70 px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PieChart className="size-5" />
            </span>
            Financial Tracks
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Log in</Link>
            <Link href="/register" className={buttonVariants()}>Start tracking</Link>
          </div>
        </header>

        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Money clarity without the accounting fog</h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Financial Tracks turns everyday income, spending, bills, uploads, and goals into a dashboard that feels approachable from day one.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
                Start tracking <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>View demo</Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["$9.8k tracked", "43% saved", "4 bills ahead"].map((item) => (
                <div key={item} className="rounded-xl border bg-card/70 p-4 backdrop-blur">
                  <p className="text-sm font-medium">{item}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sample workspace</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-[conic-gradient(from_90deg,var(--chart-1),var(--chart-2),transparent,var(--chart-1))] opacity-30 blur-3xl" />
            <div className="relative rounded-3xl border bg-card/80 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dashboard preview</p>
                  <p className="text-2xl font-semibold">Total balance $12,840</p>
                </div>
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Income", "$7,650", "bg-emerald-500/15"],
                  ["Expenses", "$2,639", "bg-rose-500/15"],
                  ["Savings", "$5,011", "bg-cyan-500/15"],
                ].map(([label, value, className]) => (
                  <div key={label} className={`rounded-2xl border p-4 ${className}`}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_0.8fr]">
                <div className="rounded-2xl border bg-background/60 p-4">
                  <div className="flex h-44 items-end gap-3">
                    {[48, 64, 42, 78, 56, 88].map((height, index) => (
                      <div key={height} className="flex flex-1 flex-col justify-end gap-2">
                        <span className="rounded-t-lg bg-primary/70" style={{ height }} />
                        <span className="rounded-t-lg bg-rose-400/70" style={{ height: Math.max(18, height - 24 - index * 2) }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/60 p-4">
                  <p className="font-medium">Emergency fund</p>
                  <p className="mt-1 text-sm text-muted-foreground">$7,850 / $12,000</p>
                  <Progress value={65} className="mt-4" />
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary/10 p-3 text-sm">
                    <Bot className="size-5 text-primary" />
                    You saved 65% of your target.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="glass-panel transition hover:-translate-y-1">
                <CardHeader>
                  <Icon className="size-6 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto grid max-w-7xl gap-8 px-4 py-20 lg:grid-cols-3">
        {["Add your money events", "Preview statements", "Read simple habits"].map((title, index) => (
          <div key={title} className="rounded-3xl border bg-card/70 p-8">
            <p className="text-5xl font-semibold text-primary/60">0{index + 1}</p>
            <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
            <p className="mt-3 text-muted-foreground">
              {index === 0
                ? "Record income, expenses, bills, and goals with beginner-friendly forms."
                : index === 1
                  ? "Import CSV data only after reviewing cleaned rows in a safe preview table."
                  : "See category leaders, savings rate, and month-over-month changes automatically."}
            </p>
          </div>
        ))}
      </section>

      <section id="privacy" className="mx-auto max-w-7xl px-4 py-20">
        <Card className="glass-panel overflow-hidden">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <LockKeyhole className="size-10 text-primary" />
              <h2 className="mt-6 text-3xl font-semibold">Security without bank-linking risk</h2>
              <p className="mt-4 text-muted-foreground">
                Version 1 uses hashed passwords, HTTP-only sessions, server-side route protection, Zod validation, and userId-scoped database queries.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["No bank credentials stored", "Manual CSV control", "Protected dashboard pages", "PostgreSQL + Prisma data layer"].map((item) => (
                <div key={item} className="rounded-xl border bg-background/60 p-4">
                  <Banknote className="mb-4 size-5 text-primary" />
                  <p className="font-medium">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
