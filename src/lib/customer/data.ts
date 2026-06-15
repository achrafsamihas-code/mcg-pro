/**
 * B2B Customer / Buyer App — Data Access Layer
 *
 * Identical architecture to the admin/supplier/warehouse/logistics layers:
 * every function attempts a Supabase read/write first, then transparently falls
 * back to representative mock data via `withFallback` if the table is not yet
 * provisioned. Flip `USE_MOCK_FALLBACK` to false once the buyer schema is live.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  BulkOrderInput,
  BuyerDispute,
  BuyerNegotiation,
  BuyerOrder,
  MarketplaceProduct,
  NewDisputeInput,
} from "./types";

import { isSupabaseConfigured } from "@/lib/supabase/config";

// Live toggle: when Supabase env vars are present (e.g. on Vercel), query live
// tables and surface real errors. Without env (local dev), serve mock data.
const USE_MOCK_FALLBACK = !isSupabaseConfigured;

/* -------------------------------------------------------------------------- */
/* Mock datasets                                                              */
/* -------------------------------------------------------------------------- */

const MOCK_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "p1", name: "Industrial Steel Coils", category: "Metals", supplier: "GulfMetals Co.",
    supplierVerified: true, basePrice: 52, moq: 100, stock: 1840, origin: "Dubai, UAE", rating: 4.7,
    tiers: [{ minQty: 100, unitPrice: 48 }, { minQty: 500, unitPrice: 44 }, { minQty: 1000, unitPrice: 41 }],
  },
  {
    id: "p2", name: "Solar Panels (450W Mono)", category: "Energy", supplier: "NovaTrade Inc.",
    supplierVerified: true, basePrice: 138, moq: 50, stock: 620, origin: "Hamburg, DE", rating: 4.9,
    tiers: [{ minQty: 50, unitPrice: 129 }, { minQty: 200, unitPrice: 121 }, { minQty: 1000, unitPrice: 112 }],
  },
  {
    id: "p3", name: "Cotton Textile Rolls", category: "Textiles", supplier: "EuroAgro Ltd.",
    supplierVerified: false, basePrice: 27, moq: 100, stock: 980, origin: "Milan, IT", rating: 4.3,
    tiers: [{ minQty: 100, unitPrice: 24 }, { minQty: 1000, unitPrice: 20 }],
  },
  {
    id: "p4", name: "Lithium Battery Cells 18650", category: "Energy", supplier: "NovaTrade Inc.",
    supplierVerified: true, basePrice: 3.4, moq: 1000, stock: 54000, origin: "Shanghai, CN", rating: 4.6,
    tiers: [{ minQty: 1000, unitPrice: 3.1 }, { minQty: 10000, unitPrice: 2.7 }],
  },
  {
    id: "p5", name: "Cold-Press Olive Oil (5L)", category: "Food", supplier: "EuroAgro Ltd.",
    supplierVerified: true, basePrice: 64, moq: 50, stock: 340, origin: "Athens, GR", rating: 4.8,
    tiers: [{ minQty: 50, unitPrice: 59 }, { minQty: 250, unitPrice: 54 }],
  },
  {
    id: "p6", name: "Recycled HDPE Pellets", category: "Polymers", supplier: "PolyCycle Group",
    supplierVerified: true, basePrice: 1.2, moq: 5000, stock: 220000, origin: "Rotterdam, NL", rating: 4.5,
    tiers: [{ minQty: 5000, unitPrice: 1.05 }, { minQty: 20000, unitPrice: 0.92 }],
  },
  {
    id: "p7", name: "Packaged Spice Assortment", category: "Food", supplier: "Orient Spices Ltd.",
    supplierVerified: false, basePrice: 18, moq: 200, stock: 4200, origin: "Kochi, IN", rating: 4.4,
    tiers: [{ minQty: 200, unitPrice: 16 }, { minQty: 1000, unitPrice: 13.5 }],
  },
  {
    id: "p8", name: "Baltic Pine Timber", category: "Materials", supplier: "Baltic Timber Co.",
    supplierVerified: true, basePrice: 240, moq: 20, stock: 760, origin: "Riga, LV", rating: 4.6,
    tiers: [{ minQty: 20, unitPrice: 225 }, { minQty: 100, unitPrice: 208 }],
  },
];

const MOCK_NEGOTIATIONS: BuyerNegotiation[] = [
  {
    id: "n1", reference: "NEG-3301", product: "Solar Panels (450W Mono)", supplier: "NovaTrade Inc.",
    quantity: 300, targetPrice: 115, currentPrice: 121, lastOfferBy: "supplier", status: "countered",
    updatedAt: "2026-06-15T08:40:00Z",
    rounds: [
      { id: "r1", author: "buyer", unitPrice: 110, quantity: 300, note: "Long-term contract potential.", createdAt: "2026-06-14T10:00:00Z" },
      { id: "r2", author: "supplier", unitPrice: 124, quantity: 300, note: "Can't go that low at 300 units.", createdAt: "2026-06-14T13:30:00Z" },
      { id: "r3", author: "buyer", unitPrice: 115, quantity: 300, note: "Meet us closer and we'll commit quarterly.", createdAt: "2026-06-15T08:00:00Z" },
      { id: "r4", author: "supplier", unitPrice: 121, quantity: 300, createdAt: "2026-06-15T08:40:00Z" },
    ],
  },
  {
    id: "n2", reference: "NEG-3305", product: "Industrial Steel Coils", supplier: "GulfMetals Co.",
    quantity: 600, targetPrice: 42, currentPrice: 42, lastOfferBy: "buyer", status: "open",
    updatedAt: "2026-06-15T09:10:00Z",
    rounds: [
      { id: "r1", author: "buyer", unitPrice: 42, quantity: 600, note: "Volume order, can pay upfront.", createdAt: "2026-06-15T09:10:00Z" },
    ],
  },
  {
    id: "n3", reference: "NEG-3290", product: "Cold-Press Olive Oil (5L)", supplier: "EuroAgro Ltd.",
    quantity: 250, targetPrice: 54, currentPrice: 54, lastOfferBy: "supplier", status: "accepted",
    updatedAt: "2026-06-13T16:00:00Z",
    rounds: [
      { id: "r1", author: "buyer", unitPrice: 52, quantity: 250, createdAt: "2026-06-12T09:00:00Z" },
      { id: "r2", author: "supplier", unitPrice: 54, quantity: 250, note: "Best at this volume.", createdAt: "2026-06-12T15:00:00Z" },
      { id: "r3", author: "buyer", unitPrice: 54, quantity: 250, note: "Agreed.", createdAt: "2026-06-13T16:00:00Z" },
    ],
  },
];

const MOCK_ORDERS: BuyerOrder[] = [
  { id: "o1", reference: "DEAL-10241", product: "Industrial Steel Coils", supplier: "GulfMetals Co.", quantity: 800, unitPrice: 44, stageIndex: 4, origin: "Dubai, UAE", destination: "Abu Dhabi, UAE", eta: "2026-06-18", updatedAt: "2026-06-15T09:12:00Z" },
  { id: "o2", reference: "DEAL-10243", product: "Cold-Press Olive Oil (5L)", supplier: "EuroAgro Ltd.", quantity: 250, unitPrice: 54, stageIndex: 5, origin: "Athens, GR", destination: "Singapore", eta: "2026-06-14", updatedAt: "2026-06-14T17:05:00Z" },
  { id: "o3", reference: "DEAL-10250", product: "Solar Panels (450W Mono)", supplier: "NovaTrade Inc.", quantity: 300, unitPrice: 121, stageIndex: 2, origin: "Hamburg, DE", destination: "Berlin, DE", eta: "2026-06-22", updatedAt: "2026-06-15T08:40:00Z" },
  { id: "o4", reference: "DEAL-10255", product: "Recycled HDPE Pellets", supplier: "PolyCycle Group", quantity: 12000, unitPrice: 1.05, stageIndex: 1, origin: "Rotterdam, NL", destination: "Lyon, FR", eta: "2026-06-25", updatedAt: "2026-06-15T07:30:00Z" },
];

const MOCK_DISPUTES: BuyerDispute[] = [
  {
    id: "d1", reference: "TKT-5012", subject: "Damaged goods on arrival", category: "damaged_goods",
    against: "supplier", orderRef: "DEAL-10241", priority: "high", status: "in_review",
    updatedAt: "2026-06-15T10:02:00Z",
    messages: [
      { id: "m1", author: "You", authorRole: "buyer", body: "Two steel coils arrived dented. We need a partial refund or replacement.", createdAt: "2026-06-14T12:00:00Z" },
      { id: "m2", author: "Platform Admin", authorRole: "admin", body: "Thanks for flagging. Reviewing the carrier's condition report now — please share photos.", createdAt: "2026-06-15T09:10:00Z" },
    ],
  },
  {
    id: "d2", reference: "TKT-5014", subject: "Late delivery penalty", category: "shipment_delay",
    against: "logistics", orderRef: "DEAL-10243", priority: "medium", status: "open",
    updatedAt: "2026-06-14T18:20:00Z",
    messages: [
      { id: "m1", author: "You", authorRole: "buyer", body: "Delivery was 3 days late, requesting penalty clause enforcement.", createdAt: "2026-06-14T18:20:00Z" },
    ],
  },
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
      console.warn(`[customer/data] ${context} fell back to mock data:`, error);
      return fallback;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .order("rating", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No products");
      return data as MarketplaceProduct[];
    },
    MOCK_PRODUCTS,
    "fetchMarketplaceProducts"
  );
}

export async function fetchBuyerNegotiations(): Promise<BuyerNegotiation[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("buyer_negotiations")
        .select("*, rounds:negotiation_rounds(*)")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No negotiations");
      return data as BuyerNegotiation[];
    },
    MOCK_NEGOTIATIONS,
    "fetchBuyerNegotiations"
  );
}

export async function fetchBuyerOrders(): Promise<BuyerOrder[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("buyer_orders")
        .select("*")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No orders");
      return data as BuyerOrder[];
    },
    MOCK_ORDERS,
    "fetchBuyerOrders"
  );
}

export async function fetchBuyerDisputes(): Promise<BuyerDispute[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("buyer_disputes")
        .select("*, messages:dispute_messages(*)")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No disputes");
      return data as BuyerDispute[];
    },
    MOCK_DISPUTES,
    "fetchBuyerDisputes"
  );
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** Buyer places a bulk order / initiates a negotiation from the marketplace. */
export async function placeBulkOrder(input: BulkOrderInput): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase.from("buyer_negotiations").insert({
        product_id: input.productId,
        quantity: input.quantity,
        target_price: input.targetPrice,
        note: input.note,
        status: "open",
        last_offer_by: "buyer",
      });
      if (error) throw error;
    },
    undefined,
    `placeBulkOrder(${input.productId})`
  );
}

/** Buyer submits a new counter-offer in a negotiation. */
export async function submitBuyerCounter(
  negotiationId: string,
  unitPrice: number,
  quantity: number,
  note?: string
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase.from("negotiation_rounds").insert({
        negotiation_id: negotiationId,
        author: "buyer",
        unit_price: unitPrice,
        quantity,
        note,
      });
      if (error) throw error;
    },
    undefined,
    `submitBuyerCounter(${negotiationId})`
  );
}

/** Buyer accepts the supplier's current counter-offer. */
export async function acceptSupplierCounter(negotiationId: string): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("buyer_negotiations")
        .update({ status: "accepted" })
        .eq("id", negotiationId);
      if (error) throw error;
    },
    undefined,
    `acceptSupplierCounter(${negotiationId})`
  );
}

/** Buyer opens a new dispute ticket. */
export async function createDispute(input: NewDisputeInput): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase.from("buyer_disputes").insert({
        subject: input.subject,
        category: input.category,
        against: input.against,
        order_ref: input.orderRef,
        priority: input.priority,
        details: input.details,
        status: "open",
      });
      if (error) throw error;
    },
    undefined,
    `createDispute(${input.subject})`
  );
}

/** Buyer posts a message in an existing dispute thread. */
export async function postBuyerDisputeMessage(
  disputeId: string,
  body: string
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase.from("dispute_messages").insert({
        dispute_id: disputeId,
        body,
        author: "You",
        author_role: "buyer",
      });
      if (error) throw error;
    },
    undefined,
    `postBuyerDisputeMessage(${disputeId})`
  );
}
