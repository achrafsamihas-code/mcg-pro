/**
 * Warehouse Dashboard — Domain Types
 * B2B Trade & Logistics Platform
 *
 * Maps to warehouse-owner-scoped Supabase tables/views. Where a table is not
 * yet provisioned, the data layer falls back to representative mock data so the
 * warehouse workspace renders end-to-end during early build-out.
 */

import type { TrendDirection } from "@/lib/admin/types";

export type { TrendDirection };

/* -------------------------------------------------------------------------- */
/* Dashboard Metrics & Capacity                                               */
/* -------------------------------------------------------------------------- */

export interface WarehouseMetric {
  key: string;
  label: string;
  value: number;
  changePct: number;
  trend: TrendDirection;
  isCurrency?: boolean;
  icon: "earnings" | "tenants" | "pending" | "space";
}

/** Live capacity utilisation snapshot. */
export interface CapacitySnapshot {
  /** Total pallet capacity. */
  totalPallets: number;
  /** Currently occupied pallets. */
  occupiedPallets: number;
}

export interface WarehouseSnapshot {
  metrics: WarehouseMetric[];
  capacity: CapacitySnapshot;
  generatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Logistics Alerts (inbound / outbound)                                      */
/* -------------------------------------------------------------------------- */

export type LogisticsDirection = "inbound" | "outbound";
export type LogisticsAlertStatus = "scheduled" | "arriving" | "in_progress" | "completed";

export interface LogisticsAlert {
  id: string;
  direction: LogisticsDirection;
  reference: string;
  /** Driver or carrier name. */
  carrier: string;
  /** Supplier/tenant the movement is for. */
  tenant: string;
  pallets: number;
  status: LogisticsAlertStatus;
  /** ISO timestamp of the expected arrival/dispatch. */
  scheduledAt: string;
}

/* -------------------------------------------------------------------------- */
/* Bookings & Tenants                                                         */
/* -------------------------------------------------------------------------- */

export type RentalBookingStatus =
  | "pending_approval"
  | "active"
  | "expired"
  | "rejected"
  | "terminated";

export interface RentalBooking {
  id: string;
  reference: string;
  /** Supplier requesting / holding the lease. */
  supplier: string;
  supplierEmail: string;
  pallets: number;
  /** Agreed rate per pallet per day, in platform currency. */
  ratePerPalletDay: number;
  status: RentalBookingStatus;
  startDate: string;
  /** Null while pending or open-ended. */
  endDate: string | null;
  /** Monthly recurring revenue from this booking. */
  monthlyValue: number;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Pricing & Capacity Configuration                                          */
/* -------------------------------------------------------------------------- */

export interface WarehouseConfig {
  /** Rental price per square meter per month. */
  pricePerSqm: number;
  /** Rental price per pallet per day. */
  pricePerPalletDay: number;
  /** Total warehouse capacity in pallets. */
  capacityPallets: number;
  /** Total floor area in square meters. */
  capacitySqm: number;
  /** Emit an alert when occupancy exceeds this percentage (0..100). */
  occupancyAlertThreshold: number;
  /** Master switch for the high-occupancy alert. */
  occupancyAlertEnabled: boolean;
}
