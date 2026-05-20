import Link from "next/link";
import { ArrowRight, Banknote, Bot, CircleDollarSign, Compass, FileSpreadsheet, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { CashCompassLogo } from "@/components/brand/cash-compass-logo";
import { CompassSweep } from "@/components/brand/compass-sweep";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const features = [
  { title: "Track flow", description: "Income, expenses, bills, budgets, and savings sit in one calm dashboard.", icon: WalletCards },
  { title: "Import manually", description: "Preview CSV statements before saving rows to your account.", icon: FileSpreadsheet },
  { title: "Budget smarter", description: "See safe, watch, and over-budget states before the month slips away.", icon: CircleDollarSign },
  { title: "Smart insights", description: "Rule-based guidance explains what changed without accounting jargon.", icon: Bot },
  { title: "Private by design", description: "No bank credentials, hashed passwords, scoped user data.", icon: ShieldCheck },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="relative min-h-screen px-4 py-6">
        <div className="absolute inset-0 grid-glow opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 ambient-spotlight" aria-hidden="true" />
        <div className="absolute inset-0 app-beams" aria-hidden="true" />
        <div className="absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
        <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border bg-background/85 px-3 py-3 supports-backdrop-filter:bg-background/70 supports-backdrop-filter:backdrop-blur-sm sm:px-4">
          <Link href="/" className="min-w-0 font-semibold">
            <CashCompassLogo showTagline={false} />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>Log in</Link>
            <Link href="/register" className={buttonVariants()}>Create your tracker</Link>
          </div>
        </header>

        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-semibold md:text-7xl">Cash Compass points your money in the right direction</h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Track spending, understand bills, upload statements, set goals, build budgets, and get smart rule-based guidance without accounting complexity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
                Create your tracker <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/login?demo=true" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>Try demo account</Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["TT$42k tracked", "43% saved", "5 budgets guided"].map((item) => (
                <div key={item} className="premium-glow spotlight-card rounded-xl border bg-card/70 p-4">
                  <p className="text-sm font-medium">{item}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sample workspace</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_center,var(--chart-1),transparent_62%)] opacity-25" aria-hidden="true" />
            <CompassSweep className="absolute -right-8 -top-8 z-10 size-36 opacity-90" />
            <div className="premium-glow spotlight-card relative rounded-3xl border bg-card/86 p-4 shadow-xl shadow-primary/10 supports-backdrop-filter:backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dashboard preview</p>
                  <p className="text-2xl font-semibold">Total balance TT$28,840</p>
                </div>
                <Compass className="size-6 text-primary" aria-hidden="true" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Income", "TT$17,700", "bg-emerald-500/15"],
                  ["Expenses", "TT$6,925", "bg-rose-500/15"],
                  ["Savings", "TT$10,775", "bg-cyan-500/15"],
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
                        <span className="landing-bar rounded-t-lg bg-primary/70" style={{ height, animationDelay: `${index * 80}ms` }} />
                        <span className="landing-bar rounded-t-lg bg-rose-400/70" style={{ height: Math.max(18, height - 24 - index * 2), animationDelay: `${160 + index * 80}ms` }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/60 p-4">
                  <p className="font-medium">Emergency fund</p>
                  <p className="mt-1 text-sm text-muted-foreground">TT$9,500 / TT$18,000</p>
                  <Progress value={65} className="mt-4" />
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary/10 p-3 text-sm">
                    <Sparkles className="size-5 text-primary" />
                    Emergency fund pace improved this month.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-4 md:grid-cols-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="glass-panel premium-glow spotlight-card transition hover:-translate-y-1.5">
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
          <div key={title} className="premium-glow spotlight-card rounded-3xl border bg-card/70 p-8">
            <p className="text-sm font-semibold uppercase text-primary/70" aria-label={`Step ${index + 1}`}>
              Step {String(index + 1).padStart(2, "0")}
            </p>
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
        <Card className="glass-panel premium-glow spotlight-card overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex size-14 items-center justify-center rounded-2xl border bg-primary/10 text-primary">
                <LockKeyhole className="size-7" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold">Security without bank-linking risk</h2>
              <p className="mt-4 text-muted-foreground">
                Cash Compass keeps imports manual and transparent. No bank login details are stored, and CSV rows are saved only after you preview and confirm them.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["No bank credentials stored", "Manual CSV control", "Hashed passwords", "User-scoped PostgreSQL data", "Secure Vercel deployment"].map((item) => (
                <div key={item} className="premium-glow rounded-xl border bg-background/60 p-4">
                  <Banknote className="mb-4 size-5 text-primary" aria-hidden="true" />
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
