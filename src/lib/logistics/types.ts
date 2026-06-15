/**
 * Logistics / Driver Dashboard — Domain Types
 * B2B Trade & Logistics Platform
 *
 * Maps to carrier/driver-scoped Supabase tables/views. Where a table is not yet
 * provisioned, the data layer falls back to representative mock data so the
 * driver workspace renders end-to-end during early build-out.
 */

import type { TrendDirection } from "@/lib/admin/types";

export type { TrendDirection };

/* -------------------------------------------------------------------------- */
/* Dashboard Metrics                                                          */
/* -------------------------------------------------------------------------- */

export interface LogisticsMetric {
  key: string;
  label: string;
  value: number;
  changePct: number;
  trend: TrendDirection;
  isCurrency?: boolean;
  icon: "completed" | "active" | "earnings" | "available";
}

/* -------------------------------------------------------------------------- */
/* Trip stages (mirrors the global order tracker's shipping leg)              */
/* -------------------------------------------------------------------------- */

export const TRIP_STAGES = [
  "Assigned",
  "Arrived at Pickup",
  "In Transit",
  "Delivered",
] as const;

export type TripStage = (typeof TRIP_STAGES)[number];

/* -------------------------------------------------------------------------- */
/* A geographic waypoint with contact info.                                   */
/* -------------------------------------------------------------------------- */

export interface Waypoint {
  label: string;
  address: string;
  city: string;
  contactName: string;
  contactPhone: string;
}

/* -------------------------------------------------------------------------- */
/* Available jobs (marketplace)                                               */
/* -------------------------------------------------------------------------- */

export interface DeliveryJob {
  id: string;
  reference: string;
  /** Originating supplier / shipper. */
  shipper: string;
  cargo: string;
  /** Payload weight in kilograms. */
  weightKg: number;
  pickup: Waypoint;
  dropoff: Waypoint;
  /** Route distance in kilometers. */
  distanceKm: number;
  /** Offered gross pay in platform currency. */
  pay: number;
  /** ISO deadline for pickup. */
  pickupBy: string;
}

/* -------------------------------------------------------------------------- */
/* Active trips                                                               */
/* -------------------------------------------------------------------------- */

export interface ActiveTrip {
  id: string;
  reference: string;
  /** Links back to the global order/deal being fulfilled. */
  orderRef: string;
  shipper: string;
  cargo: string;
  weightKg: number;
  pickup: Waypoint;
  dropoff: Waypoint;
  distanceKm: number;
  pay: number;
  stage: TripStage;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Wallet & Earnings                                                          */
/* -------------------------------------------------------------------------- */

export interface WalletSummary {
  /** Currently withdrawable balance. */
  balance: number;
  /** Funds pending clearance from in-flight trips. */
  pending: number;
  /** Lifetime net earnings. */
  lifetimeNet: number;
}

export type PayoutStatus = "paid" | "processing" | "failed";

export interface Payout {
  id: string;
  reference: string;
  amount: number;
  method: string;
  status: PayoutStatus;
  date: string;
}

/** A completed trip's financial breakdown. */
export interface TripEarning {
  id: string;
  reference: string;
  route: string;
  completedAt: string;
  /** Gross pay before deductions. */
  gross: number;
  /** Platform commission rate applied (0..1). */
  commissionRate: number;
  /** Commission amount deducted. */
  commission: number;
  /** Net payout to the driver. */
  net: number;
}
