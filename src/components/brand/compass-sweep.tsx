"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function CompassSweep({ className }: { className?: string }) {
  const sweepRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      return;
    }

    void import("animejs").then(({ animate }) => {
      if (sweepRef.current) {
        animate(sweepRef.current, {
          strokeDashoffset: [180, 0],
          opacity: [0.2, 1],
          duration: 1350,
          ease: "outCubic",
        });
      }

      if (needleRef.current) {
        animate(needleRef.current, {
          rotate: ["-28deg", "0deg"],
          scale: [0.92, 1],
          duration: 1050,
          ease: "outBack",
        });
      }
    });
  }, []);

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("pointer-events-none text-primary", className)}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
      <path
        ref={sweepRef}
        d="M60 13a47 47 0 0 1 47 47"
        fill="none"
        stroke="currentColor"
        strokeDasharray="180"
        strokeDashoffset="180"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <g ref={needleRef} style={{ transformOrigin: "60px 60px" }}>
        <path d="M78 33 66 68a8 8 0 0 1-5 5L28 86l12-35a8 8 0 0 1 5-5l33-13Z" fill="currentColor" opacity="0.18" />
        <path d="M78 33 62 62 28 86l16-35 34-18Z" fill="currentColor" opacity="0.75" />
      </g>
    </svg>
  );
}
