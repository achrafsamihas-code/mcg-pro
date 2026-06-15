/**
 * Supplier Dashboard — Domain Types
 * B2B Trade & Logistics Platform
 *
 * Maps to supplier-scoped Supabase tables/views. Where a table is not yet
 * provisioned, the data layer falls back to representative mock data so the
 * supplier workspace renders end-to-end during early build-out.
 */

import type { TrendDirection } from "@/lib/admin/types";

export type { TrendDirection };

/* -------------------------------------------------------------------------- */
/* Dashboard Metrics                                                          */
/* -------------------------------------------------------------------------- */

export interface SupplierMetric {
  key: string;
  label: string;
  value: number;
  changePct: number;
  trend: TrendDirection;
  isCurrency?: boolean;
  icon: "sales" | "listings" | "shipments" | "negotiations";
}

export interface SupplierSnapshot {
  metrics: SupplierMetric[];
  generatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Products + B2B tiered pricing                                              */
/* -------------------------------------------------------------------------- */

export type ProductStatus = "active" | "draft" | "out_of_stock";

/** A single quantity-break price tier (e.g. 100 units @ $42). */
export interface PriceTier {
  /** Minimum order quantity that unlocks this tier. */
  minQty: number;
  /** Unit price at this tier, in platform currency. */
  unitPrice: number;
}

export interface SupplierProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  status: ProductStatus;
  /** Current available stock. */
  stock: number;
  /** Base / list unit price (qty = 1). */
  basePrice: number;
  /** B2B tiered pricing breaks, ascending by minQty. */
  tiers: PriceTier[];
  imageUrl?: string;
  updatedAt: string;
}

/** Payload for creating a new product (id/timestamps assigned server-side). */
export interface NewProductInput {
  name: string;
  sku: string;
  category: string;
  status: ProductStatus;
  stock: number;
  basePrice: number;
  tiers: PriceTier[];
}

/* -------------------------------------------------------------------------- */
/* Supplier Orders                                                            */
/* -------------------------------------------------------------------------- */

/** Mirrors the platform-wide order stages relevant to the supplier. */
export type SupplierOrderStage =
  | "Received"
  | "Negotiation"
  | "Production"
  | "Shipping"
  | "Delivered";

export interface SupplierOrder {
  id: string;
  reference: string;
  product: string;
  buyer: string;
  quantity: number;
  /** Agreed (or current offered) unit price. */
  unitPrice: number;
  stage: SupplierOrderStage;
  /** True when the order needs the supplier's immediate action. */
  actionRequired: boolean;
  destination: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* B2B Negotiations                                                           */
/* -------------------------------------------------------------------------- */

export type OfferAuthor = "buyer" | "supplier";
export type NegotiationStatus =
  | "open"
  | "countered"
  | "accepted"
  | "in_production"
  | "declined";

/** One round in a negotiation thread. */
export interface OfferRound {
  id: string;
  author: OfferAuthor;
  unitPrice: number;
  quantity: number;
  note?: string;
  createdAt: string;
}

export interface Negotiation {
  id: string;
  reference: string;
  product: string;
  buyer: string;
  quantity: number;
  /** The buyer's original target unit price. */
  targetPrice: number;
  /** The most recent offered unit price (from either party). */
  currentPrice: number;
  status: NegotiationStatus;
  rounds: OfferRound[];
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Warehouse Booking                                                          */
/* -------------------------------------------------------------------------- */

export type BookingStatus =
  | "pending_approval"
  | "active"
  | "expired"
  | "rejected";

export interface WarehouseOption {
  id: string;
  name: string;
  city: string;
  country: string;
  /** Average rating 0..5. */
  rating: number;
  /** Storage fee per pallet per day, in platform currency. */
  ratePerPalletDay: number;
  availablePallets: number;
}

export interface WarehouseBooking {
  id: string;
  warehouseId: string;
  warehouseName: string;
  city: string;
  pallets: number;
  status: BookingStatus;
  ratePerPalletDay: number;
  startDate: string;
  /** Null while pending or open-ended. */
  endDate: string | null;
  /** Accrued fee so far (driven by the storage fee counter). */
  accruedFee: number;
}

/** Payload for requesting a new warehouse booking. */
export interface NewBookingInput {
  warehouseId: string;
  pallets: number;
  startDate: string;
}
