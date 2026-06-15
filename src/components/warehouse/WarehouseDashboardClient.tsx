"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import WarehouseMetricCard from "@/components/warehouse/WarehouseMetricCard";
import CapacityDonut from "@/components/warehouse/CapacityDonut";
import {
  fetchLogisticsAlerts,
  fetchWarehouseSnapshot,
} from "@/lib/warehouse/data";
import type {
  LogisticsAlert,
  LogisticsAlertStatus,
  WarehouseSnapshot,
} from "@/lib/warehouse/types";
import { formatRelativeTime } from "@/lib/admin/format";

const ALERT_STATUS_COLOR: Record<
  LogisticsAlertStatus,
  "info" | "warning" | "primary" | "success"
> = {
  scheduled: "info",
  arriving: "warning",
  in_progress: "primary",
  completed: "success",
};

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-7 w-20 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export default function WarehouseDashboardClient() {
  const [snapshot, setSnapshot] = useState<WarehouseSnapshot | null>(null);
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchWarehouseSnapshot(), fetchLogisticsAlerts()]).then(
      ([snap, al]) => {
        if (mounted) {
          setSnapshot(snap);
          setAlerts(al);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Warehouse Console" />

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {loading || !snapshot
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : snapshot.metrics.map((m) => (
              <WarehouseMetricCard key={m.key} metric={m} />
            ))}
      </div>

      {/* Capacity + logistics feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {loading || !snapshot ? (
          <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        ) : (
          <CapacityDonut capacity={snapshot.capacity} />
        )}

        <LogisticsFeed alerts={alerts} loading={loading} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inbound / Outbound logistics live feed                                     */
/* -------------------------------------------------------------------------- */

function LogisticsFeed({
  alerts,
  loading,
}: {
  alerts: LogisticsAlert[];
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Inbound / Outbound Logistics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upcoming driver arrivals and dispatches
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
          </span>
          Live
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
          {alerts.map((alert) => {
            const isInbound = alert.direction === "inbound";
            return (
              <li
                key={alert.id}
                className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isInbound
                      ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                      : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-5">
                    {isInbound ? (
                      <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {alert.carrier}
                    </span>
                    <span className="text-xs text-gray-400">
                      {alert.reference}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {isInbound ? "Inbound" : "Outbound"} ·{" "}
                    {alert.pallets} pallets · {alert.tenant}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge size="sm" color={ALERT_STATUS_COLOR[alert.status]}>
                    {alert.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(alert.scheduledAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
