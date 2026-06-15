"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import LogisticsMetricCard from "@/components/logistics/LogisticsMetricCard";
import { fetchActiveTrips, fetchLogisticsMetrics } from "@/lib/logistics/data";
import type {
  ActiveTrip,
  LogisticsMetric,
  Waypoint,
} from "@/lib/logistics/types";
import { formatCurrency, formatNumber } from "@/lib/admin/format";

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

export default function LogisticsDashboardClient() {
  const [metrics, setMetrics] = useState<LogisticsMetric[]>([]);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchLogisticsMetrics(), fetchActiveTrips()]).then(
      ([m, t]) => {
        if (mounted) {
          setMetrics(m);
          setTrips(t);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // The "current active route" = the trip that has progressed furthest but
  // isn't delivered yet; falls back to the first active trip.
  const currentTrip =
    trips.find((t) => t.stage === "In Transit") ??
    trips.find((t) => t.stage === "Arrived at Pickup") ??
    trips[0] ??
    null;

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Driver Console" />

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : metrics.map((m) => (
              <LogisticsMetricCard key={m.key} metric={m} />
            ))}
      </div>

      {/* Current active route */}
      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
      ) : currentTrip ? (
        <CurrentRouteCard trip={currentTrip} />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
          No active route. Visit the Job Board to accept a delivery.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Current active route overview                                              */
/* -------------------------------------------------------------------------- */

function CurrentRouteCard({ trip }: { trip: ActiveTrip }) {
  // The immediate next milestone: pickup if not yet picked up, else dropoff.
  const nextIsPickup = trip.stage === "Assigned";
  const milestone: Waypoint = nextIsPickup ? trip.pickup : trip.dropoff;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Current Active Route
            </h3>
            <Badge size="sm" color="primary">
              {trip.stage}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            {trip.reference} · Order {trip.orderRef} · {trip.cargo}
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-800 dark:text-white/90">
            {formatCurrency(trip.pay)}
          </div>
          <div className="text-xs text-gray-400">
            {formatNumber(trip.distanceKm)} km · {formatNumber(trip.weightKg)} kg
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
        {/* Route line */}
        <div className="space-y-4">
          <WaypointRow waypoint={trip.pickup} done={!nextIsPickup} kind="pickup" />
          <div className="ml-[18px] h-8 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <WaypointRow waypoint={trip.dropoff} done={false} kind="dropoff" />
        </div>

        {/* Next milestone highlight */}
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Next milestone — {nextIsPickup ? "Pickup" : "Dropoff"}
          </span>
          <h4 className="mt-2 font-semibold text-gray-800 dark:text-white/90">
            {milestone.city}
          </h4>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            {milestone.address}
          </p>
          <div className="mt-3 space-y-1 border-t border-brand-200/60 pt-3 text-sm dark:border-brand-500/20">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" className="size-4 text-brand-500">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {milestone.contactName}
            </div>
            <a
              href={`tel:${milestone.contactPhone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-4">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {milestone.contactPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaypointRow({
  waypoint,
  done,
  kind,
}: {
  waypoint: Waypoint;
  done: boolean;
  kind: "pickup" | "dropoff";
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          kind === "pickup"
            ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
            : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
        } ${done ? "opacity-60" : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {waypoint.label}
        </span>
        <h4 className="font-medium text-gray-800 dark:text-white/90">
          {waypoint.city}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {waypoint.address}
        </p>
      </div>
    </div>
  );
}
