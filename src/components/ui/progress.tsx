"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number | null;
  max?: number;
};

function normalizeProgress(value: number | null | undefined, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(max, Math.max(0, value));
}

function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const currentValue = normalizeProgress(value, max);
  const percentage = max > 0 ? (currentValue / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(currentValue)}
      aria-valuetext={`${Math.round(percentage)}%`}
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };
