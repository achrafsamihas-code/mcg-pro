/**
 * Warehouse Dashboard — Data Access Layer
 *
 * Identical architecture to the admin/supplier layers: every function attempts
 * a Supabase read/write first, then transparently falls back to representative
 * mock data via `withFallback` if the table is not yet provisioned. Flip
 * `USE_MOCK_FALLBACK` to false once the warehouse schema is live to surface
 * real errors instead of masking them.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  LogisticsAlert,
  RentalBooking,
  RentalBookingStatus,
  WarehouseConfig,
  WarehouseMetric,
  WarehouseSnapshot,
} from "./types";

import { isSupabaseConfigured } from "@/lib/supabase/config";

// Live toggle: when Supabase env vars are present (e.g. on Vercel), query live
// tables and surface real errors. Without env (local dev), serve mock data.
const USE_MOCK_FALLBACK = !isSupabaseConfigured;

/* -------------------------------------------------------------------------- */
/* Mock datasets                                                              */
/* -------------------------------------------------------------------------- */

const MOCK_METRICS: WarehouseMetric[] = [
  { key: "earnings", label: "Monthly Rental Earnings", value: 184500, changePct: 9.4, trend: "up", isCurrency: true, icon: "earnings" },
  { key: "tenants", label: "Active Tenants", value: 23, changePct: 6.1, trend: "up", icon: "tenants" },
  { key: "pending", label: "Pending Requests", value: 5, changePct: 25.0, trend: "up", icon: "pending" },
  { key: "space", label: "Free Pallet Space", value: 1360, changePct: -4.8, trend: "down", icon: "space" },
];

const MOCK_SNAPSHOT: WarehouseSnapshot = {
  metrics: MOCK_METRICS,
  capacity: { totalPallets: 5000, occupiedPallets: 3640 },
  generatedAt: new Date().toISOString(),
};

const MOCK_ALERTS: LogisticsAlert[] = [
  { id: "a1", direction: "inbound", reference: "MV-8801", carrier: "Diego Fernandez", tenant: "GulfMetals Co.", pallets: 60, status: "arriving", scheduledAt: "2026-06-15T11:30:00Z" },
  { id: "a2", direction: "outbound", reference: "MV-8802", carrier: "Kwame Osei", tenant: "NovaTrade Inc.", pallets: 40, status: "scheduled", scheduledAt: "2026-06-15T14:00:00Z" },
  { id: "a3", direction: "inbound", reference: "MV-8803", carrier: "FleetX Hauling", tenant: "EuroAgro Ltd.", pallets: 25, status: "in_progress", scheduledAt: "2026-06-15T10:15:00Z" },
  { id: "a4", direction: "outbound", reference: "MV-8804", carrier: "Liang Wei", tenant: "GulfMetals Co.", pallets: 80, status: "scheduled", scheduledAt: "2026-06-15T16:45:00Z" },
  { id: "a5", direction: "inbound", reference: "MV-8799", carrier: "RapidFreight", tenant: "NovaTrade Inc.", pallets: 30, status: "completed", scheduledAt: "2026-06-15T08:00:00Z" },
];

const MOCK_BOOKINGS: RentalBooking[] = [
  { id: "b1", reference: "RNT-2201", supplier: "GulfMetals Co.", supplierEmail: "sales@gulfmetals.ae", pallets: 320, ratePerPalletDay: 2.4, status: "active", startDate: "2026-04-01", endDate: "2026-10-01", monthlyValue: 23040, createdAt: "2026-03-20T10:00:00Z" },
  { id: "b2", reference: "RNT-2202", supplier: "NovaTrade Inc.", supplierEmail: "ops@novatrade.com", pallets: 180, ratePerPalletDay: 2.4, status: "active", startDate: "2026-05-15", endDate: null, monthlyValue: 12960, createdAt: "2026-05-10T09:30:00Z" },
  { id: "b3", reference: "RNT-2210", supplier: "EuroAgro Ltd.", supplierEmail: "hello@euroagro.eu", pallets: 90, ratePerPalletDay: 2.6, status: "pending_approval", startDate: "2026-06-20", endDate: null, monthlyValue: 7020, createdAt: "2026-06-14T16:00:00Z" },
  { id: "b4", reference: "RNT-2211", supplier: "FreshFarm Exports", supplierEmail: "trade@freshfarm.com", pallets: 50, ratePerPalletDay: 2.6, status: "pending_approval", startDate: "2026-06-22", endDate: null, monthlyValue: 3900, createdAt: "2026-06-15T07:20:00Z" },
  { id: "b5", reference: "RNT-2150", supplier: "Orient Spices Ltd.", supplierEmail: "info@orientspices.in", pallets: 70, ratePerPalletDay: 2.2, status: "expired", startDate: "2026-01-01", endDate: "2026-05-31", monthlyValue: 4620, createdAt: "2025-12-18T12:00:00Z" },
  { id: "b6", reference: "RNT-2120", supplier: "Baltic Timber Co.", supplierEmail: "sales@baltictimber.lv", pallets: 110, ratePerPalletDay: 2.3, status: "terminated", startDate: "2025-11-01", endDate: "2026-02-15", monthlyValue: 7590, createdAt: "2025-10-25T11:00:00Z" },
];

const MOCK_CONFIG: WarehouseConfig = {
  pricePerSqm: 14.5,
  pricePerPalletDay: 2.4,
  capacityPallets: 5000,
  capacitySqm: 12000,
  occupancyAlertThreshold: 90,
  occupancyAlertEnabled: true,
};

/* -------------------------------------------------------------------------- */
/* Query helper (identical contract to admin/supplier layers)                 */
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
      console.warn(`[warehouse/data] ${context} fell back to mock data:`, error);
      return fallback;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchWarehouseSnapshot(): Promise<WarehouseSnapshot> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("warehouse_snapshot")
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("No warehouse snapshot");
      return data as WarehouseSnapshot;
    },
    { ...MOCK_SNAPSHOT, generatedAt: new Date().toISOString() },
    "fetchWarehouseSnapshot"
  );
}

export async function fetchLogisticsAlerts(): Promise<LogisticsAlert[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("warehouse_logistics_alerts")
        .select("*")
        .order("scheduledAt", { ascending: true });
      if (error) throw error;
      if (!data) throw new Error("No alerts");
      return data as LogisticsAlert[];
    },
    MOCK_ALERTS,
    "fetchLogisticsAlerts"
  );
}

export async function fetchRentalBookings(): Promise<RentalBooking[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("warehouse_rental_bookings")
        .select("*")
        .order("createdAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No bookings");
      return data as RentalBooking[];
    },
    MOCK_BOOKINGS,
    "fetchRentalBookings"
  );
}

export async function fetchWarehouseConfig(): Promise<WarehouseConfig> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("warehouse_config")
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("No config");
      return data as WarehouseConfig;
    },
    MOCK_CONFIG,
    "fetchWarehouseConfig"
  );
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** Approve or reject a pending supplier booking request. */
export async function updateBookingStatus(
  id: string,
  status: RentalBookingStatus
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("warehouse_rental_bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    undefined,
    `updateBookingStatus(${id}, ${status})`
  );
}

/** Persist the pricing & capacity configuration. */
export async function saveWarehouseConfig(
  config: WarehouseConfig
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("warehouse_config")
        .upsert(config);
      if (error) throw error;
    },
    undefined,
    "saveWarehouseConfig"
  );
}
