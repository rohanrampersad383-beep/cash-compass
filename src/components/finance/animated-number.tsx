"use client";

import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    `${prefix}${Math.round(latest).toLocaleString("en-US")}${suffix}`,
  );
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

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
