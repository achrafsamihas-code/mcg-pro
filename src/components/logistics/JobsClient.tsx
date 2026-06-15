"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import TripStepper from "@/components/logistics/TripStepper";
import {
  acceptJob,
  fetchActiveTrips,
  fetchAvailableJobs,
  updateTripStage,
} from "@/lib/logistics/data";
import {
  TRIP_STAGES,
  type ActiveTrip,
  type DeliveryJob,
  type TripStage,
} from "@/lib/logistics/types";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/admin/format";

type Tab = "available" | "active";

export default function JobsClient() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("available");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchAvailableJobs(), fetchActiveTrips()]).then(([j, t]) => {
      if (mounted) {
        setJobs(j);
        setTrips(t);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------- actions ------------------------------- */

  const handleAccept = async (job: DeliveryJob) => {
    setBusyId(job.id);
    // Optimistic: remove from marketplace, add as an assigned trip.
    const newTrip: ActiveTrip = {
      id: `local-${Date.now()}`,
      reference: `TRIP-${Math.floor(5500 + Math.random() * 500)}`,
      orderRef: job.reference.replace("JOB", "DEAL"),
      shipper: job.shipper,
      cargo: job.cargo,
      weightKg: job.weightKg,
      pickup: job.pickup,
      dropoff: job.dropoff,
      distanceKm: job.distanceKm,
      pay: job.pay,
      stage: "Assigned",
      updatedAt: new Date().toISOString(),
    };
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    setTrips((prev) => [newTrip, ...prev]);
    setTab("active");
    await acceptJob(job.id);
    setBusyId(null);
  };

  const handleAdvance = async (trip: ActiveTrip) => {
    const idx = TRIP_STAGES.indexOf(trip.stage);
    if (idx >= TRIP_STAGES.length - 1) return;
    const next = TRIP_STAGES[idx + 1] as TripStage;
    setBusyId(trip.id);
    setTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id
          ? { ...t, stage: next, updatedAt: new Date().toISOString() }
          : t
      )
    );
    // Propagates to the global order tracker (mocked in the data layer).
    await updateTripStage(trip.id, trip.orderRef, next);
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Route Tracker & Job Board" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-white/[0.03]">
        <TabButton
          active={tab === "available"}
          label="Available Jobs"
          count={jobs.length}
          onClick={() => setTab("available")}
        />
        <TabButton
          active={tab === "active"}
          label="My Active Trips"
          count={trips.length}
          onClick={() => setTab("active")}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      ) : tab === "available" ? (
        <AvailableJobs
          jobs={jobs}
          busyId={busyId}
          onAccept={handleAccept}
        />
      ) : (
        <ActiveTrips trips={trips} busyId={busyId} onAdvance={handleAdvance} />
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-brand-500 text-white shadow-theme-xs"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-white/20 text-white"
            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab 1: Available jobs marketplace                                          */
/* -------------------------------------------------------------------------- */

function AvailableJobs({
  jobs,
  busyId,
  onAccept,
}: {
  jobs: DeliveryJob[];
  busyId: string | null;
  onAccept: (job: DeliveryJob) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
        No jobs available right now. Check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {job.cargo}
                </span>
                <Badge size="sm" color="light">
                  {formatNumber(job.weightKg)} kg
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {job.reference} · {job.shipper}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-brand-600 dark:text-brand-400">
                {formatCurrency(job.pay)}
              </div>
              <div className="text-xs text-gray-400">
                {formatNumber(job.distanceKm)} km
              </div>
            </div>
          </div>

          <div className="my-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {job.pickup.city}
              </span>
              <span className="text-xs text-gray-400">— {job.pickup.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {job.dropoff.city}
              </span>
              <span className="text-xs text-gray-400">— {job.dropoff.address}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Pickup by {formatRelativeTime(job.pickupBy)}
            </span>
            <Button
              size="sm"
              onClick={() => onAccept(job)}
              disabled={busyId === job.id}
            >
              {busyId === job.id ? "Accepting…" : "Accept Job"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab 2: My active trips with status stepper                                 */
/* -------------------------------------------------------------------------- */

function ActiveTrips({
  trips,
  busyId,
  onAdvance,
}: {
  trips: ActiveTrip[];
  busyId: string | null;
  onAdvance: (trip: ActiveTrip) => void;
}) {
  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
        No active trips. Accept a job to get started.
      </div>
    );
  }

  const nextLabel = (stage: TripStage) => {
    switch (stage) {
      case "Assigned":
        return "Mark Arrived at Pickup";
      case "Arrived at Pickup":
        return "Start Transit";
      case "In Transit":
        return "Mark Delivered";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {trips.map((trip) => {
        const label = nextLabel(trip.stage);
        const delivered = trip.stage === "Delivered";
        return (
          <div
            key={trip.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {trip.reference}
                  </span>
                  <Badge size="sm" color={delivered ? "success" : "primary"}>
                    {trip.stage}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {trip.cargo} · {trip.pickup.city} → {trip.dropoff.city} · Order{" "}
                  {trip.orderRef}
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 dark:text-white/90">
                  {formatCurrency(trip.pay)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatNumber(trip.distanceKm)} km
                </div>
              </div>
            </div>

            <TripStepper stage={trip.stage} />

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <span className="text-xs text-gray-400">
                Updated {formatRelativeTime(trip.updatedAt)}
              </span>
              {delivered ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-600 dark:text-success-500">
                  <svg viewBox="0 0 24 24" fill="none" className="size-4">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Completed
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onAdvance(trip)}
                  disabled={busyId === trip.id}
                >
                  {busyId === trip.id ? "Updating…" : label}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
