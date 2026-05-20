import Image from "next/image";
import { cn } from "@/lib/utils";

export function CashCompassLogo({
  compact = false,
  subtitle = "Guide. Track. Grow.",
  showTagline = true,
  variant,
  className,
}: {
  compact?: boolean;
  subtitle?: string;
  showTagline?: boolean;
  variant?: "lockup" | "icon" | "full";
  className?: string;
}) {
  const resolvedVariant = variant ?? (compact ? "icon" : "lockup");

  if (resolvedVariant === "full") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <Image
          src="/cash-compass-logo.png"
          alt="Cash Compass full logo"
          width={214}
          height={56}
          priority
          className="h-12 w-auto shrink-0 object-contain drop-shadow-[0_0_18px_rgba(20,184,166,0.18)] sm:h-14"
        />
      </span>
    );
  }

  if (resolvedVariant === "icon") {
    return (
      <Image
        src="/cash-compass-icon.png"
        alt="Cash Compass compass icon"
        width={40}
        height={40}
        priority
        className={cn("size-10 shrink-0 rounded-xl object-contain drop-shadow-[0_0_16px_rgba(20,184,166,0.22)]", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <Image
        src="/cash-compass-icon.png"
        alt="Cash Compass compass icon"
        width={44}
        height={44}
        priority
        className="size-10 shrink-0 rounded-xl object-contain drop-shadow-[0_0_18px_rgba(20,184,166,0.24)] sm:size-11"
      />
      <span className="grid min-w-0 gap-0.5 leading-none">
        <span className="flex items-baseline gap-1 text-lg font-semibold tracking-[0.06em] sm:gap-1.5 sm:text-[1.32rem] sm:tracking-[0.08em]">
          <span className="text-white">Cash</span>
          <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Compass
          </span>
        </span>
        {showTagline && subtitle ? (
          <span className="truncate text-[0.55rem] font-medium uppercase tracking-[0.24em] text-muted-foreground sm:text-[0.62rem] sm:tracking-[0.36em]">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
