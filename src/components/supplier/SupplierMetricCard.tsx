"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { SupplierMetric } from "@/lib/supplier/types";
import { formatCurrency, formatNumber, formatPct } from "@/lib/admin/format";
import { useCountUp } from "@/hooks/useCountUp";

const ICONS: Record<SupplierMetric["icon"], React.ReactNode> = {
  sales: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  listings: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shipments: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M16 3h1.4a2 2 0 0 1 1.9 1.4L21 9v9a2 2 0 0 1-2 2h-1M16 3H3v15a2 2 0 0 0 2 2h1M16 3v17M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  negotiations: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M14 9V5a3 3 0 0 0-6 0v4M5 9h14l1 12H4L5 9ZM9 13a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function SupplierMetricCard({
  metric,
}: {
  metric: SupplierMetric;
}) {
  const isUp = metric.trend === "up";
  const isDown = metric.trend === "down";
  const animated = useCountUp(metric.value);
  const rounded = Math.round(animated);
  const display = metric.isCurrency
    ? formatCurrency(rounded)
    : formatNumber(rounded);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg hover:shadow-brand-500/5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-100 ${
          isDown ? "bg-error-500/10" : "bg-brand-500/10"
        }`}
      />
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDown
              ? "bg-error-50 text-error-500 dark:bg-error-500/15"
              : "bg-brand-50 text-brand-500 dark:bg-brand-500/15"
          }`}
        >
          {ICONS[metric.icon]}
        </div>
        <Badge color={isUp ? "success" : isDown ? "error" : "light"}>
          {isUp && <ArrowUpIcon />}
          {isDown && <ArrowDownIcon className="text-error-500" />}
          {formatPct(metric.changePct)}
        </Badge>
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {metric.label}
        </span>
        <h4 className="mt-1.5 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {display}
        </h4>
      </div>
    </div>
  );
}
