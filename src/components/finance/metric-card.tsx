import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/finance/animated-number";
import type { CurrencyCode } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "emerald",
  currencyCode = "TTD",
}: {
  title: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  tone?: "emerald" | "cyan" | "amber" | "rose";
  currencyCode?: CurrencyCode;
}) {
  const tones = {
    emerald: "from-emerald-400/20 to-emerald-400/0 text-emerald-300",
    cyan: "from-cyan-400/20 to-cyan-400/0 text-cyan-300",
    amber: "from-amber-400/20 to-amber-400/0 text-amber-300",
    rose: "from-rose-400/20 to-rose-400/0 text-rose-300",
  };

  return (
    <Card className="group premium-glow spotlight-card relative overflow-hidden glass-panel animate-in fade-in-0 slide-in-from-bottom-2 duration-300 transition hover:-translate-y-1 hover:border-primary/45 hover:shadow-primary/10 focus-within:border-primary/50">
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-80", tones[tone])} />
      <div className="absolute -right-6 -top-8 size-20 rounded-full border border-primary/16 opacity-60 transition duration-200 group-hover/card:scale-110 group-hover/card:border-primary/35" aria-hidden="true" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-lg border bg-background/50 p-2", tones[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-semibold">
          <AnimatedNumber value={value} currencyCode={currencyCode} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
