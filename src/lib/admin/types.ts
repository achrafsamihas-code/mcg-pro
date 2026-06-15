/**
 * Super Admin / CEO Dashboard — Domain Types
 * B2B Trade & Logistics Platform
 *
 * These interfaces map to Supabase tables/views. Where a table does not yet
 * exist, the query layer falls back to representative mock data so the UI
 * remains fully functional during early build-out.
 */

/* -------------------------------------------------------------------------- */
/* Dashboard Metrics                                                          */
/* -------------------------------------------------------------------------- */

export type TrendDirection = "up" | "down" | "neutral";

export interface PlatformMetric {
  key: string;
  label: string;
  value: number;
  /** Percentage change vs. the previous period. */
  changePct: number;
  trend: TrendDirection;
  /** Optional currency formatting flag. */
  isCurrency?: boolean;
  /** Icon key resolved by the card component. */
  icon:
    | "users"
    | "suppliers"
    | "drivers"
    | "warehouses"
    | "orders"
    | "deals"
    | "earnings-month"
    | "earnings-year";
}

export interface DashboardSnapshot {
  metrics: PlatformMetric[];
  /** ISO timestamp of when the snapshot was generated. */
  generatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Business Intelligence                                                      */
/* -------------------------------------------------------------------------- */

export interface TopProduct {
  name: string;
  requests: number;
}

export interface SupplierPerformance {
  supplier: string;
  /** Trade volume in platform currency for each month index (Jan..Dec). */
  monthlyVolume: number[];
}

export interface TradeVolumePoint {
  month: string;
  volume: number;
}

export interface CityHotspot {
  city: string;
  country: string;
  shipments: number;
  /** 0..100 intensity used for the heat indicator. */
  intensity: number;
}

export interface GrowthForecast {
  label: string;
  /** Projected percentage growth for next quarter. */
  projectedGrowthPct: number;
  /** Model confidence 0..100. */
  confidence: number;
  signal: "bullish" | "stable" | "bearish";
}

export interface BiAnalytics {
  topProducts: TopProduct[];
  supplierPerformance: SupplierPerformance[];
  tradeVolume: TradeVolumePoint[];
  hotspots: CityHotspot[];
  forecasts: GrowthForecast[];
}

/* -------------------------------------------------------------------------- */
/* User & Supplier Control Center                                             */
/* -------------------------------------------------------------------------- */

export type AccountType = "user" | "supplier" | "driver" | "warehouse";

export type AccountStatus =
  | "active"
  | "pending"
  | "suspended"
  | "rejected";

export interface ManagedAccount {
  id: string;
  name: string;
  email: string;
  type: AccountType;
  status: AccountStatus;
  /** Supplier-only: verified trade badge. */
  verified?: boolean;
  /** Free-form location / region. */
  region: string;
  joinedAt: string;
  avatarUrl?: string;
}

/* -------------------------------------------------------------------------- */
/* Global Order / Deal Tracker                                                */
/* -------------------------------------------------------------------------- */

export const ORDER_STAGES = [
  "Received",
  "Supplier Found",
  "Negotiation",
  "Production",
  "Shipping",
  "Delivered",
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

export interface TradeDeal {
  id: string;
  reference: string;
  product: string;
  buyer: string;
  supplier: string;
  /** Index into ORDER_STAGES (0..5). */
  stageIndex: number;
  value: number;
  destination: string;
  updatedAt: string;
  flagged?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Dispute & Ticket Resolution                                                */
/* -------------------------------------------------------------------------- */

export type DisputePriority = "low" | "medium" | "high" | "critical";
export type DisputeStatus = "open" | "in_review" | "resolved" | "escalated";
export type DisputeParties =
  | "Customer vs Supplier"
  | "Supplier vs Warehouse"
  | "Customer vs Logistics";

export interface DisputeMessage {
  id: string;
  author: string;
  authorRole: "admin" | "customer" | "supplier" | "warehouse" | "logistics";
  body: string;
  createdAt: string;
}

export interface DisputeTicket {
  id: string;
  reference: string;
  subject: string;
  parties: DisputeParties;
  priority: DisputePriority;
  status: DisputeStatus;
  orderRef: string;
  openedBy: string;
  updatedAt: string;
  messages: DisputeMessage[];
}
