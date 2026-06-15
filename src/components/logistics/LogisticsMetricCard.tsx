"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { LogisticsMetric } from "@/lib/logistics/types";
import { formatCurrency, formatNumber, formatPct } from "@/lib/admin/format";
import { useCountUp } from "@/hooks/useCountUp";

const ICONS: Record<LogisticsMetric["icon"], React.ReactNode> = {
  completed: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  active: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M16 3h1.4a2 2 0 0 1 1.9 1.4L21 9v9a2 2 0 0 1-2 2h-1M16 3H3v15a2 2 0 0 0 2 2h1M16 3v17M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  earnings: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  available: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
};

export default function LogisticsMetricCard({
  metric,
}: {
  metric: LogisticsMetric;
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
        {metric.trend !== "neutral" && (
          <Badge color={isUp ? "success" : "error"}>
            {isUp && <ArrowUpIcon />}
            {isDown && <ArrowDownIcon className="text-error-500" />}
            {formatPct(metric.changePct)}
          </Badge>
        )}
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
