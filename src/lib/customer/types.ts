/**
 * B2B Customer / Buyer App — Domain Types
 * B2B Trade & Logistics Platform
 *
 * Maps to buyer-scoped Supabase tables/views. Where a table is not yet
 * provisioned, the data layer falls back to representative mock data so the
 * buyer workspace renders end-to-end during early build-out.
 */

import type { TrendDirection } from "@/lib/admin/types";
import type { OrderStage } from "@/lib/admin/types";

export type { TrendDirection, OrderStage };
export { ORDER_STAGES } from "@/lib/admin/types";

/* -------------------------------------------------------------------------- */
/* Marketplace                                                                */
/* -------------------------------------------------------------------------- */

/** Quantity-break price tier (mirrors the supplier's PriceTier). */
export interface PriceTier {
  minQty: number;
  unitPrice: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  /** Supplier offering the product. */
  supplier: string;
  /** Whether the supplier carries the verified trade badge. */
  supplierVerified: boolean;
  /** Base / list unit price (qty = 1). */
  basePrice: number;
  /** B2B tiered pricing breaks, ascending by minQty. */
  tiers: PriceTier[];
  /** Minimum order quantity accepted. */
  moq: number;
  /** Available stock. */
  stock: number;
  /** Origin / shipping location. */
  origin: string;
  rating: number;
}

/** Payload for placing a bulk order / initiating a negotiation. */
export interface BulkOrderInput {
  productId: string;
  quantity: number;
  /** Buyer's target unit price. */
  targetPrice: number;
  note?: string;
}

/* -------------------------------------------------------------------------- */
/* Negotiations (buyer-facing)                                                */
/* -------------------------------------------------------------------------- */

export type OfferAuthor = "buyer" | "supplier";
export type NegotiationStatus =
  | "open"
  | "countered"
  | "accepted"
  | "in_production"
  | "declined";

export interface OfferRound {
  id: string;
  author: OfferAuthor;
  unitPrice: number;
  quantity: number;
  note?: string;
  createdAt: string;
}

export interface BuyerNegotiation {
  id: string;
  reference: string;
  product: string;
  supplier: string;
  quantity: number;
  /** Buyer's original target unit price. */
  targetPrice: number;
  /** Most recent offered unit price (from either party). */
  currentPrice: number;
  /** Who made the most recent offer — drives the call-to-action. */
  lastOfferBy: OfferAuthor;
  status: NegotiationStatus;
  rounds: OfferRound[];
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Order tracking (universal 6-stage)                                         */
/* -------------------------------------------------------------------------- */

export interface BuyerOrder {
  id: string;
  reference: string;
  product: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  /** Index into ORDER_STAGES (0..5). */
  stageIndex: number;
  origin: string;
  destination: string;
  /** Estimated delivery date (ISO). */
  eta: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Disputes (buyer-raised)                                                    */
/* -------------------------------------------------------------------------- */

export type DisputeCategory =
  | "damaged_goods"
  | "shipment_delay"
  | "quality_issue"
  | "billing"
  | "other";

export type DisputeAgainst = "supplier" | "warehouse" | "logistics";
export type DisputePriority = "low" | "medium" | "high";
export type DisputeStatus = "open" | "in_review" | "resolved" | "escalated";

export interface DisputeMessage {
  id: string;
  author: string;
  authorRole: "buyer" | "admin" | "supplier" | "warehouse" | "logistics";
  body: string;
  createdAt: string;
}

export interface BuyerDispute {
  id: string;
  reference: string;
  subject: string;
  category: DisputeCategory;
  against: DisputeAgainst;
  orderRef: string;
  priority: DisputePriority;
  status: DisputeStatus;
  updatedAt: string;
  messages: DisputeMessage[];
}

/** Payload for opening a new dispute. */
export interface NewDisputeInput {
  subject: string;
  category: DisputeCategory;
  against: DisputeAgainst;
  orderRef: string;
  priority: DisputePriority;
  details: string;
}
