"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MetricCard from "@/components/admin/MetricCard";
import { fetchDashboardSnapshot } from "@/lib/admin/data";
import type { DashboardSnapshot } from "@/lib/admin/types";
import { formatRelativeTime } from "@/lib/admin/format";

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

export default function DashboardClient() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await fetchDashboardSnapshot();
      if (mounted) {
        setSnapshot(data);
        setLoading(false);
      }
    };

    load();
    // Simulated real-time refresh cadence (replace with Supabase realtime channel).
    const interval = setInterval(load, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadCrumb pageTitle="CEO Command Center" />
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
          </span>
          Live
          {snapshot && (
            <span className="text-gray-400">
              · updated {formatRelativeTime(snapshot.generatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white dark:border-gray-800 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <h2 className="text-xl font-semibold md:text-2xl">
          B2B Trade &amp; Logistics — Global Overview
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Real-time pulse across users, suppliers, fleet, warehousing, and
          revenue. All counters refresh automatically.
        </p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {loading || !snapshot
          ? Array.from({ length: 8 }).map((_, i) => <MetricSkeleton key={i} />)
          : snapshot.metrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
      </div>
    </div>
  );
}
