/**
 * Supplier Dashboard — Data Access Layer
 *
 * Identical architecture to `src/lib/admin/data.ts`: every function attempts a
 * Supabase read/write first, then transparently falls back to representative
 * mock data via `withFallback` if the table is not yet provisioned. Flip
 * `USE_MOCK_FALLBACK` to false once the supplier schema is live to surface
 * real errors instead of masking them.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  Negotiation,
  NewBookingInput,
  NewProductInput,
  SupplierOrder,
  SupplierProduct,
  SupplierSnapshot,
  SupplierMetric,
  WarehouseBooking,
  WarehouseOption,
} from "./types";

import { isSupabaseConfigured } from "@/lib/supabase/config";

// Live toggle: when Supabase env vars are present (e.g. on Vercel), query live
// tables and surface real errors. Without env (local dev), serve mock data.
const USE_MOCK_FALLBACK = !isSupabaseConfigured;

/* -------------------------------------------------------------------------- */
/* Mock datasets                                                              */
/* -------------------------------------------------------------------------- */

const MOCK_METRICS: SupplierMetric[] = [
  { key: "sales", label: "Total Sales (30d)", value: 428600, changePct: 16.3, trend: "up", isCurrency: true, icon: "sales" },
  { key: "listings", label: "Active Listings", value: 48, changePct: 4.2, trend: "up", icon: "listings" },
  { key: "shipments", label: "Pending Shipments", value: 12, changePct: -8.5, trend: "down", icon: "shipments" },
  { key: "negotiations", label: "Ongoing Negotiations", value: 7, changePct: 12.0, trend: "up", icon: "negotiations" },
];

const MOCK_PRODUCTS: SupplierProduct[] = [
  {
    id: "p1", name: "Industrial Steel Coils", sku: "STL-COIL-G3", category: "Metals",
    status: "active", stock: 1840, basePrice: 52,
    tiers: [{ minQty: 100, unitPrice: 48 }, { minQty: 500, unitPrice: 44 }, { minQty: 1000, unitPrice: 41 }],
    updatedAt: "2026-06-14T10:00:00Z",
  },
  {
    id: "p2", name: "Solar Panels (450W Mono)", sku: "SOL-450M", category: "Energy",
    status: "active", stock: 620, basePrice: 138,
    tiers: [{ minQty: 50, unitPrice: 129 }, { minQty: 200, unitPrice: 121 }, { minQty: 1000, unitPrice: 112 }],
    updatedAt: "2026-06-15T08:30:00Z",
  },
  {
    id: "p3", name: "Cotton Textile Rolls", sku: "TXT-CTN-RAW", category: "Textiles",
    status: "active", stock: 0, basePrice: 27,
    tiers: [{ minQty: 100, unitPrice: 24 }, { minQty: 1000, unitPrice: 20 }],
    updatedAt: "2026-06-12T14:20:00Z",
  },
  {
    id: "p4", name: "Lithium Battery Cells 18650", sku: "BAT-LI-18650", category: "Energy",
    status: "draft", stock: 5400, basePrice: 3.4,
    tiers: [{ minQty: 1000, unitPrice: 3.1 }, { minQty: 10000, unitPrice: 2.7 }],
    updatedAt: "2026-06-11T09:10:00Z",
  },
  {
    id: "p5", name: "Cold-Press Olive Oil (5L)", sku: "FOOD-OLV-5L", category: "Food",
    status: "active", stock: 340, basePrice: 64,
    tiers: [{ minQty: 50, unitPrice: 59 }, { minQty: 250, unitPrice: 54 }],
    updatedAt: "2026-06-13T16:45:00Z",
  },
  {
    id: "p6", name: "Recycled HDPE Pellets", sku: "PLST-HDPE-R", category: "Polymers",
    status: "out_of_stock", stock: 0, basePrice: 1.2,
    tiers: [{ minQty: 5000, unitPrice: 1.05 }, { minQty: 20000, unitPrice: 0.92 }],
    updatedAt: "2026-06-10T11:30:00Z",
  },
];

const MOCK_ORDERS: SupplierOrder[] = [
  { id: "o1", reference: "DEAL-10241", product: "Industrial Steel Coils", buyer: "BuildCorp", quantity: 800, unitPrice: 44, stage: "Production", actionRequired: false, destination: "Dubai, UAE", updatedAt: "2026-06-15T09:12:00Z" },
  { id: "o2", reference: "DEAL-10242", product: "Solar Panels (450W Mono)", buyer: "GreenVolt", quantity: 300, unitPrice: 121, stage: "Negotiation", actionRequired: true, destination: "Hamburg, DE", updatedAt: "2026-06-15T08:40:00Z" },
  { id: "o3", reference: "DEAL-10250", product: "Cold-Press Olive Oil (5L)", buyer: "Gourmet Foods", quantity: 120, unitPrice: 59, stage: "Received", actionRequired: true, destination: "Singapore", updatedAt: "2026-06-15T07:05:00Z" },
  { id: "o4", reference: "DEAL-10231", product: "Cotton Textile Rolls", buyer: "FashionLine", quantity: 1500, unitPrice: 20, stage: "Shipping", actionRequired: false, destination: "Jeddah, SA", updatedAt: "2026-06-14T18:20:00Z" },
  { id: "o5", reference: "DEAL-10228", product: "Solar Panels (450W Mono)", buyer: "SunGrid", quantity: 1000, unitPrice: 112, stage: "Delivered", actionRequired: false, destination: "Madrid, ES", updatedAt: "2026-06-13T12:00:00Z" },
];

const MOCK_NEGOTIATIONS: Negotiation[] = [
  {
    id: "n1", reference: "NEG-3301", product: "Solar Panels (450W Mono)", buyer: "GreenVolt",
    quantity: 300, targetPrice: 115, currentPrice: 121, status: "countered",
    updatedAt: "2026-06-15T08:40:00Z",
    rounds: [
      { id: "r1", author: "buyer", unitPrice: 110, quantity: 300, note: "Long-term contract potential. Looking for best price.", createdAt: "2026-06-14T10:00:00Z" },
      { id: "r2", author: "supplier", unitPrice: 124, quantity: 300, note: "Can't go that low at 300 units. Best offer below.", createdAt: "2026-06-14T13:30:00Z" },
      { id: "r3", author: "buyer", unitPrice: 115, quantity: 300, note: "Meet us closer and we'll commit quarterly.", createdAt: "2026-06-15T08:00:00Z" },
      { id: "r4", author: "supplier", unitPrice: 121, quantity: 300, createdAt: "2026-06-15T08:40:00Z" },
    ],
  },
  {
    id: "n2", reference: "NEG-3302", product: "Cold-Press Olive Oil (5L)", buyer: "Gourmet Foods",
    quantity: 120, targetPrice: 55, currentPrice: 59, status: "open",
    updatedAt: "2026-06-15T07:05:00Z",
    rounds: [
      { id: "r1", author: "buyer", unitPrice: 55, quantity: 120, note: "First order, hoping to establish a relationship.", createdAt: "2026-06-15T07:05:00Z" },
    ],
  },
  {
    id: "n3", reference: "NEG-3299", product: "Industrial Steel Coils", buyer: "BuildCorp",
    quantity: 800, targetPrice: 43, currentPrice: 44, status: "accepted",
    updatedAt: "2026-06-14T16:00:00Z",
    rounds: [
      { id: "r1", author: "buyer", unitPrice: 42, quantity: 800, createdAt: "2026-06-13T09:00:00Z" },
      { id: "r2", author: "supplier", unitPrice: 44, quantity: 800, note: "Final at this volume.", createdAt: "2026-06-13T15:00:00Z" },
      { id: "r3", author: "buyer", unitPrice: 44, quantity: 800, note: "Agreed.", createdAt: "2026-06-14T16:00:00Z" },
    ],
  },
];

const MOCK_WAREHOUSES: WarehouseOption[] = [
  { id: "w1", name: "Jebel Ali Logistics Hub", city: "Dubai", country: "UAE", rating: 4.8, ratePerPalletDay: 2.4, availablePallets: 1200 },
  { id: "w2", name: "Rotterdam Cold Storage", city: "Rotterdam", country: "Netherlands", rating: 4.6, ratePerPalletDay: 3.1, availablePallets: 540 },
  { id: "w3", name: "Singapore FreePort Bonded", city: "Singapore", country: "Singapore", rating: 4.9, ratePerPalletDay: 3.8, availablePallets: 800 },
  { id: "w4", name: "Hamburg Süd Depot", city: "Hamburg", country: "Germany", rating: 4.4, ratePerPalletDay: 2.7, availablePallets: 320 },
];

const MOCK_BOOKINGS: WarehouseBooking[] = [
  { id: "b1", warehouseId: "w1", warehouseName: "Jebel Ali Logistics Hub", city: "Dubai", pallets: 60, status: "active", ratePerPalletDay: 2.4, startDate: "2026-06-01", endDate: null, accruedFee: 2016 },
  { id: "b2", warehouseId: "w3", warehouseName: "Singapore FreePort Bonded", city: "Singapore", pallets: 25, status: "pending_approval", ratePerPalletDay: 3.8, startDate: "2026-06-18", endDate: null, accruedFee: 0 },
  { id: "b3", warehouseId: "w4", warehouseName: "Hamburg Süd Depot", city: "Hamburg", pallets: 40, status: "expired", ratePerPalletDay: 2.7, startDate: "2026-03-01", endDate: "2026-05-31", accruedFee: 9828 },
];

/* -------------------------------------------------------------------------- */
/* Query helper (identical contract to admin layer)                           */
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
      console.warn(`[supplier/data] ${context} fell back to mock data:`, error);
      return fallback;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchSupplierSnapshot(): Promise<SupplierSnapshot> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("supplier_metrics")
        .select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No supplier metrics");
      return { metrics: data as SupplierMetric[], generatedAt: new Date().toISOString() };
    },
    { metrics: MOCK_METRICS, generatedAt: new Date().toISOString() },
    "fetchSupplierSnapshot"
  );
}

export async function fetchSupplierProducts(): Promise<SupplierProduct[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("supplier_products")
        .select("*")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No products");
      return data as SupplierProduct[];
    },
    MOCK_PRODUCTS,
    "fetchSupplierProducts"
  );
}

export async function fetchSupplierOrders(): Promise<SupplierOrder[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("supplier_orders")
        .select("*")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No orders");
      return data as SupplierOrder[];
    },
    MOCK_ORDERS,
    "fetchSupplierOrders"
  );
}

export async function fetchNegotiations(): Promise<Negotiation[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("supplier_negotiations")
        .select("*, rounds:negotiation_rounds(*)")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No negotiations");
      return data as Negotiation[];
    },
    MOCK_NEGOTIATIONS,
    "fetchNegotiations"
  );
}

export async function fetchWarehouseOptions(): Promise<WarehouseOption[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("warehouse_options")
        .select("*")
        .order("rating", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No warehouses");
      return data as WarehouseOption[];
    },
    MOCK_WAREHOUSES,
    "fetchWarehouseOptions"
  );
}

export async function fetchWarehouseBookings(): Promise<WarehouseBooking[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("warehouse_bookings")
        .select("*")
        .order("startDate", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No bookings");
      return data as WarehouseBooking[];
    },
    MOCK_BOOKINGS,
    "fetchWarehouseBookings"
  );
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export async function createProduct(input: NewProductInput): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase.from("supplier_products").insert(input);
      if (error) throw error;
    },
    undefined,
    `createProduct(${input.sku})`
  );
}

export async function updateProductStockPrice(
  id: string,
  patch: { stock?: number; basePrice?: number }
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("supplier_products")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    undefined,
    `updateProductStockPrice(${id})`
  );
}

/** Supplier posts a counter-offer in a negotiation. */
export async function counterOffer(
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
        author: "supplier",
        unit_price: unitPrice,
        quantity,
        note,
      });
      if (error) throw error;
    },
    undefined,
    `counterOffer(${negotiationId})`
  );
}

/** Supplier accepts current terms, shifting the deal toward production. */
export async function acceptNegotiation(negotiationId: string): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("supplier_negotiations")
        .update({ status: "in_production" })
        .eq("id", negotiationId);
      if (error) throw error;
    },
    undefined,
    `acceptNegotiation(${negotiationId})`
  );
}

export async function requestWarehouseBooking(
  input: NewBookingInput
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("warehouse_bookings")
        .insert({ ...input, status: "pending_approval" });
      if (error) throw error;
    },
    undefined,
    `requestWarehouseBooking(${input.warehouseId})`
  );
}
