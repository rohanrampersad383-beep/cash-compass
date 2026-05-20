"use client";

import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { currency, type CurrencyCode } from "@/lib/finance";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  currencyCode,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  currencyCode?: CurrencyCode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    currencyCode ? currency(latest, currencyCode) : `${prefix}${Math.round(latest).toLocaleString("en-US")}${suffix}`,
  );
  const [display, setDisplay] = useState(currencyCode ? currency(0, currencyCode) : `${prefix}0${suffix}`);

  useEffect(() => rounded.on("change", setDisplay), [rounded]);

  useEffect(() => {
    if (!inView) {
      return;
    }
    const controls = animate(motionValue, value, { duration: 1.1, ease: "easeOut" });
    return controls.stop;
  }, [inView, motionValue, value]);

  return <span ref={ref}>{display}</span>;
}
