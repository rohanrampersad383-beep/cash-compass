import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/finance/animated-number";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "emerald",
}: {
  title: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  tone?: "emerald" | "cyan" | "amber" | "rose";
}) {
  const tones = {
    emerald: "from-emerald-400/20 to-emerald-400/0 text-emerald-300",
    cyan: "from-cyan-400/20 to-cyan-400/0 text-cyan-300",
    amber: "from-amber-400/20 to-amber-400/0 text-amber-300",
    rose: "from-rose-400/20 to-rose-400/0 text-rose-300",
  };

  return (
    <Card className="group relative overflow-hidden glass-panel transition duration-300 hover:-translate-y-1 hover:shadow-primary/10">
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-80", tones[tone])} />
      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-lg border bg-background/50 p-2", tones[tone])}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-semibold tracking-tight">
          <AnimatedNumber value={value} prefix="$" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
