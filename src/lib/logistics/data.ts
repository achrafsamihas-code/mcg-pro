/**
 * Logistics / Driver Dashboard — Data Access Layer
 *
 * Identical architecture to the admin/supplier/warehouse layers: every function
 * attempts a Supabase read/write first, then transparently falls back to
 * representative mock data via `withFallback` if the table is not yet
 * provisioned. Flip `USE_MOCK_FALLBACK` to false once the logistics schema is
 * live to surface real errors instead of masking them.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  ActiveTrip,
  DeliveryJob,
  LogisticsMetric,
  Payout,
  TripEarning,
  TripStage,
  WalletSummary,
} from "./types";

import { isSupabaseConfigured } from "@/lib/supabase/config";

// Live toggle: when Supabase env vars are present (e.g. on Vercel), query live
// tables and surface real errors. Without env (local dev), serve mock data.
const USE_MOCK_FALLBACK = !isSupabaseConfigured;

/* -------------------------------------------------------------------------- */
/* Mock datasets                                                              */
/* -------------------------------------------------------------------------- */

const MOCK_METRICS: LogisticsMetric[] = [
  { key: "completed", label: "Completed Deliveries", value: 348, changePct: 7.8, trend: "up", icon: "completed" },
  { key: "active", label: "Active Shipments", value: 3, changePct: 0, trend: "neutral", icon: "active" },
  { key: "earnings", label: "Total Delivery Earnings", value: 52840, changePct: 12.5, trend: "up", isCurrency: true, icon: "earnings" },
  { key: "available", label: "Available Jobs", value: 14, changePct: -5.2, trend: "down", icon: "available" },
];

const MOCK_JOBS: DeliveryJob[] = [
  {
    id: "j1", reference: "JOB-7741", shipper: "GulfMetals Co.", cargo: "Steel Coils", weightKg: 18000,
    pickup: { label: "Pickup", address: "Plot 12, Industrial Zone 3", city: "Dubai, UAE", contactName: "Omar Saleh", contactPhone: "+971 50 123 4567" },
    dropoff: { label: "Dropoff", address: "BuildCorp Yard, Sector 9", city: "Abu Dhabi, UAE", contactName: "Hassan Ali", contactPhone: "+971 55 987 6543" },
    distanceKm: 148, pay: 620, pickupBy: "2026-06-16T09:00:00Z",
  },
  {
    id: "j2", reference: "JOB-7742", shipper: "EuroAgro Ltd.", cargo: "Olive Oil (palletised)", weightKg: 6400,
    pickup: { label: "Pickup", address: "Port Warehouse 4B", city: "Rotterdam, NL", contactName: "Jan de Vries", contactPhone: "+31 6 1122 3344" },
    dropoff: { label: "Dropoff", address: "Gourmet Foods DC", city: "Hamburg, DE", contactName: "Lena Bauer", contactPhone: "+49 151 2233 4455" },
    distanceKm: 480, pay: 1180, pickupBy: "2026-06-16T07:30:00Z",
  },
  {
    id: "j3", reference: "JOB-7743", shipper: "NovaTrade Inc.", cargo: "Solar Panels", weightKg: 9200,
    pickup: { label: "Pickup", address: "Logistikpark Süd, Halle 2", city: "Hamburg, DE", contactName: "Markus Roth", contactPhone: "+49 152 6677 8899" },
    dropoff: { label: "Dropoff", address: "GreenVolt Installation Site", city: "Berlin, DE", contactName: "Sofia Klein", contactPhone: "+49 160 1234 5678" },
    distanceKm: 289, pay: 760, pickupBy: "2026-06-17T10:00:00Z",
  },
  {
    id: "j4", reference: "JOB-7744", shipper: "Orient Spices Ltd.", cargo: "Packaged Spices", weightKg: 3200,
    pickup: { label: "Pickup", address: "Cochin Export Terminal", city: "Kochi, IN", contactName: "Ravi Menon", contactPhone: "+91 98 4712 3456" },
    dropoff: { label: "Dropoff", address: "Spice Bazaar Distributors", city: "Mumbai, IN", contactName: "Anjali Rao", contactPhone: "+91 99 8765 4321" },
    distanceKm: 1380, pay: 1640, pickupBy: "2026-06-18T06:00:00Z",
  },
];

const MOCK_TRIPS: ActiveTrip[] = [
  {
    id: "t1", reference: "TRIP-5510", orderRef: "DEAL-10241", shipper: "GulfMetals Co.", cargo: "Steel Coils", weightKg: 16000,
    pickup: { label: "Pickup", address: "Plot 12, Industrial Zone 3", city: "Dubai, UAE", contactName: "Omar Saleh", contactPhone: "+971 50 123 4567" },
    dropoff: { label: "Dropoff", address: "BuildCorp Yard, Sector 9", city: "Abu Dhabi, UAE", contactName: "Hassan Ali", contactPhone: "+971 55 987 6543" },
    distanceKm: 148, pay: 620, stage: "In Transit", updatedAt: "2026-06-15T09:30:00Z",
  },
  {
    id: "t2", reference: "TRIP-5511", orderRef: "DEAL-10243", shipper: "EuroAgro Ltd.", cargo: "Olive Oil", weightKg: 5800,
    pickup: { label: "Pickup", address: "Port Warehouse 4B", city: "Rotterdam, NL", contactName: "Jan de Vries", contactPhone: "+31 6 1122 3344" },
    dropoff: { label: "Dropoff", address: "Gourmet Foods DC", city: "Singapore", contactName: "Wei Lin", contactPhone: "+65 8123 4567" },
    distanceKm: 220, pay: 540, stage: "Arrived at Pickup", updatedAt: "2026-06-15T08:10:00Z",
  },
  {
    id: "t3", reference: "TRIP-5512", orderRef: "DEAL-10250", shipper: "NovaTrade Inc.", cargo: "Battery Cells", weightKg: 2400,
    pickup: { label: "Pickup", address: "Logistikpark Süd, Halle 2", city: "Shanghai, CN", contactName: "Chen Hao", contactPhone: "+86 138 0011 2233" },
    dropoff: { label: "Dropoff", address: "VoltX Assembly Plant", city: "Shenzhen, CN", contactName: "Li Na", contactPhone: "+86 139 4455 6677" },
    distanceKm: 1430, pay: 1720, stage: "Assigned", updatedAt: "2026-06-15T07:00:00Z",
  },
];

const MOCK_WALLET: WalletSummary = {
  balance: 4280.5,
  pending: 1160,
  lifetimeNet: 47620,
};

const MOCK_PAYOUTS: Payout[] = [
  { id: "p1", reference: "PO-9001", amount: 2400, method: "Bank Transfer ••4521", status: "paid", date: "2026-06-10" },
  { id: "p2", reference: "PO-9002", amount: 1850, method: "Bank Transfer ••4521", status: "paid", date: "2026-06-03" },
  { id: "p3", reference: "PO-9003", amount: 980, method: "Bank Transfer ••4521", status: "processing", date: "2026-06-15" },
  { id: "p4", reference: "PO-8998", amount: 1520, method: "Bank Transfer ••4521", status: "paid", date: "2026-05-27" },
];

function buildEarning(
  id: string,
  reference: string,
  route: string,
  completedAt: string,
  gross: number,
  commissionRate: number
): TripEarning {
  const commission = Math.round(gross * commissionRate * 100) / 100;
  return {
    id,
    reference,
    route,
    completedAt,
    gross,
    commissionRate,
    commission,
    net: Math.round((gross - commission) * 100) / 100,
  };
}

const MOCK_EARNINGS: TripEarning[] = [
  buildEarning("e1", "TRIP-5501", "Dubai → Abu Dhabi", "2026-06-14", 620, 0.15),
  buildEarning("e2", "TRIP-5499", "Rotterdam → Hamburg", "2026-06-13", 1180, 0.15),
  buildEarning("e3", "TRIP-5495", "Hamburg → Berlin", "2026-06-12", 760, 0.12),
  buildEarning("e4", "TRIP-5490", "Kochi → Mumbai", "2026-06-10", 1640, 0.15),
  buildEarning("e5", "TRIP-5486", "Dubai → Sharjah", "2026-06-08", 320, 0.1),
];

/* -------------------------------------------------------------------------- */
/* Query helper (identical contract across role data layers)                  */
/* -------------------------------------------------------------------------- */

async function withFallback<T>(
  loader: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      console.warn(`[logistics/data] ${context} fell back to mock data:`, error);
      return fallback;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchLogisticsMetrics(): Promise<LogisticsMetric[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("logistics_metrics").select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No metrics");
      return data as LogisticsMetric[];
    },
    MOCK_METRICS,
    "fetchLogisticsMetrics"
  );
}

export async function fetchAvailableJobs(): Promise<DeliveryJob[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("delivery_jobs")
        .select("*")
        .order("pickupBy", { ascending: true });
      if (error) throw error;
      if (!data) throw new Error("No jobs");
      return data as DeliveryJob[];
    },
    MOCK_JOBS,
    "fetchAvailableJobs"
  );
}

export async function fetchActiveTrips(): Promise<ActiveTrip[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("active_trips")
        .select("*")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No trips");
      return data as ActiveTrip[];
    },
    MOCK_TRIPS,
    "fetchActiveTrips"
  );
}

export async function fetchWalletSummary(): Promise<WalletSummary> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("driver_wallet")
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("No wallet");
      return data as WalletSummary;
    },
    MOCK_WALLET,
    "fetchWalletSummary"
  );
}

export async function fetchPayouts(): Promise<Payout[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("driver_payouts")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No payouts");
      return data as Payout[];
    },
    MOCK_PAYOUTS,
    "fetchPayouts"
  );
}

export async function fetchTripEarnings(): Promise<TripEarning[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trip_earnings")
        .select("*")
        .order("completedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No earnings");
      return data as TripEarning[];
    },
    MOCK_EARNINGS,
    "fetchTripEarnings"
  );
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** Driver accepts a job from the marketplace; creates an active trip. */
export async function acceptJob(jobId: string): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("delivery_jobs")
        .update({ status: "assigned" })
        .eq("id", jobId);
      if (error) throw error;
    },
    undefined,
    `acceptJob(${jobId})`
  );
}

/**
 * Advance a trip's delivery stage. This mutation also propagates to the global
 * order tracker (the admin "shipping" leg) so platform-wide tracking stays in
 * sync — mocked here via the trips + deals tables.
 */
export async function updateTripStage(
  tripId: string,
  orderRef: string,
  stage: TripStage
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error: tripErr } = await supabase
        .from("active_trips")
        .update({ stage })
        .eq("id", tripId);
      if (tripErr) throw tripErr;

      // Propagate to the global order tracker.
      const globalStage = stage === "Delivered" ? "Delivered" : "Shipping";
      const { error: dealErr } = await supabase
        .from("trade_deals")
        .update({ stageLabel: globalStage })
        .eq("reference", orderRef);
      if (dealErr) throw dealErr;
    },
    undefined,
    `updateTripStage(${tripId} → ${stage})`
  );
}
