"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const numeric = typeof value === "number" || /^\d+$/.test(String(value));
  const target = numeric ? Number(value) : null;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === null) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || target === 0) {
      const id = window.requestAnimationFrame(() => setDisplay(target));
      return () => window.cancelAnimationFrame(id);
    }

    const end = target;
    const started = performance.now();
    const duration = 420;
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(end * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  if (target === null) {
    return <span className={cn("tabular-nums", className)}>{value}</span>;
  }

  return <span className={cn("tabular-nums", className)}>{display}</span>;
}
