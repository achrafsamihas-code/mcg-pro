"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { WarehouseMetric } from "@/lib/warehouse/types";
import { formatCurrency, formatNumber, formatPct } from "@/lib/admin/format";
import { useCountUp } from "@/hooks/useCountUp";

const ICONS: Record<WarehouseMetric["icon"], React.ReactNode> = {
  earnings: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  tenants: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  space: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35ZM6 18h12M6 14h12M6 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function WarehouseMetricCard({
  metric,
}: {
  metric: WarehouseMetric;
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
