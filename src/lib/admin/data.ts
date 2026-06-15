/**
 * Super Admin / CEO Dashboard — Data Access Layer
 *
 * Each function attempts to read from Supabase. If the underlying table/view
 * is not yet provisioned (or the query errors), it transparently falls back to
 * representative mock data so the CEO interface renders end-to-end during the
 * early build-out. Swap `USE_MOCK_FALLBACK` to false once the schema is live
 * to surface real errors instead.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  BiAnalytics,
  DashboardSnapshot,
  DisputeTicket,
  ManagedAccount,
  PlatformMetric,
  TradeDeal,
} from "./types";

import { isSupabaseConfigured } from "@/lib/supabase/config";

// Live toggle: when Supabase env vars are present (e.g. on Vercel), query live
// tables and surface real errors. Without env (local dev), serve mock data.
const USE_MOCK_FALLBACK = !isSupabaseConfigured;

/* -------------------------------------------------------------------------- */
/* Mock datasets                                                              */
/* -------------------------------------------------------------------------- */

const MOCK_METRICS: PlatformMetric[] = [
  { key: "users", label: "Total Users", value: 18432, changePct: 12.4, trend: "up", icon: "users" },
  { key: "suppliers", label: "Active Suppliers", value: 1287, changePct: 8.1, trend: "up", icon: "suppliers" },
  { key: "drivers", label: "Logistics Drivers", value: 642, changePct: -2.3, trend: "down", icon: "drivers" },
  { key: "warehouses", label: "Warehouses", value: 94, changePct: 4.0, trend: "up", icon: "warehouses" },
  { key: "orders", label: "New Orders (24h)", value: 376, changePct: 21.7, trend: "up", icon: "orders" },
  { key: "deals", label: "Active Deals", value: 1543, changePct: 5.6, trend: "up", icon: "deals" },
  { key: "earnings_month", label: "Monthly Earnings", value: 892450, changePct: 14.2, trend: "up", isCurrency: true, icon: "earnings-month" },
  { key: "earnings_year", label: "Yearly Earnings", value: 9734120, changePct: -1.8, trend: "down", isCurrency: true, icon: "earnings-year" },
];

const MOCK_BI: BiAnalytics = {
  topProducts: [
    { name: "Industrial Steel Coils", requests: 4820 },
    { name: "Solar Panels (450W)", requests: 3910 },
    { name: "Cold-Press Olive Oil", requests: 3140 },
    { name: "Cotton Textile Rolls", requests: 2755 },
    { name: "Lithium Battery Cells", requests: 2310 },
  ],
  supplierPerformance: [
    { supplier: "NovaTrade Inc.", monthlyVolume: [120, 145, 160, 175, 190, 210, 245, 268, 290, 312, 340, 372] },
    { supplier: "GulfMetals Co.", monthlyVolume: [90, 110, 118, 130, 142, 150, 168, 180, 195, 205, 220, 238] },
    { supplier: "EuroAgro Ltd.", monthlyVolume: [60, 72, 80, 95, 102, 118, 130, 142, 150, 162, 175, 188] },
  ],
  tradeVolume: [
    { month: "Jan", volume: 270 }, { month: "Feb", volume: 327 }, { month: "Mar", volume: 358 },
    { month: "Apr", volume: 400 }, { month: "May", volume: 434 }, { month: "Jun", volume: 478 },
    { month: "Jul", volume: 543 }, { month: "Aug", volume: 590 }, { month: "Sep", volume: 635 },
    { month: "Oct", volume: 679 }, { month: "Nov", volume: 735 }, { month: "Dec", volume: 798 },
  ],
  hotspots: [
    { city: "Dubai", country: "UAE", shipments: 1842, intensity: 100 },
    { city: "Rotterdam", country: "Netherlands", shipments: 1456, intensity: 79 },
    { city: "Singapore", country: "Singapore", shipments: 1320, intensity: 72 },
    { city: "Shanghai", country: "China", shipments: 1198, intensity: 65 },
    { city: "Hamburg", country: "Germany", shipments: 980, intensity: 53 },
    { city: "Jeddah", country: "Saudi Arabia", shipments: 845, intensity: 46 },
  ],
  forecasts: [
    { label: "Trade Volume", projectedGrowthPct: 18.5, confidence: 87, signal: "bullish" },
    { label: "Supplier Onboarding", projectedGrowthPct: 9.2, confidence: 74, signal: "stable" },
    { label: "Gross Revenue", projectedGrowthPct: 22.1, confidence: 81, signal: "bullish" },
    { label: "Logistics Cost Ratio", projectedGrowthPct: -4.6, confidence: 69, signal: "bearish" },
  ],
};

const MOCK_ACCOUNTS: ManagedAccount[] = [
  { id: "u1", name: "Aisha Rahman", email: "aisha@globex.com", type: "user", status: "active", region: "UAE", joinedAt: "2025-09-14" },
  { id: "u2", name: "Marcus Lee", email: "marcus@tradehub.io", type: "user", status: "suspended", region: "Singapore", joinedAt: "2025-07-02" },
  { id: "s1", name: "NovaTrade Inc.", email: "ops@novatrade.com", type: "supplier", status: "active", verified: true, region: "Germany", joinedAt: "2024-11-21" },
  { id: "s2", name: "GulfMetals Co.", email: "sales@gulfmetals.ae", type: "supplier", status: "active", verified: false, region: "UAE", joinedAt: "2025-03-08" },
  { id: "s3", name: "EuroAgro Ltd.", email: "hello@euroagro.eu", type: "supplier", status: "pending", verified: false, region: "Italy", joinedAt: "2026-05-30" },
  { id: "d1", name: "Diego Fernandez", email: "diego.f@fleet.com", type: "driver", status: "pending", region: "Spain", joinedAt: "2026-06-01" },
  { id: "d2", name: "Kwame Osei", email: "kwame@fleet.com", type: "driver", status: "active", region: "Ghana", joinedAt: "2025-12-12" },
  { id: "d3", name: "Liang Wei", email: "liang.wei@fleet.com", type: "driver", status: "rejected", region: "China", joinedAt: "2026-04-19" },
  { id: "w1", name: "Jebel Ali Logistics Hub", email: "hub@jebelali.ae", type: "warehouse", status: "active", region: "UAE", joinedAt: "2024-08-15" },
  { id: "w2", name: "Rotterdam Cold Storage", email: "cold@rdam.nl", type: "warehouse", status: "active", region: "Netherlands", joinedAt: "2025-01-30" },
];

const MOCK_DEALS: TradeDeal[] = [
  { id: "o1", reference: "DEAL-10241", product: "Industrial Steel Coils", buyer: "BuildCorp", supplier: "GulfMetals Co.", stageIndex: 4, value: 184000, destination: "Dubai, UAE", updatedAt: "2026-06-15T09:12:00Z" },
  { id: "o2", reference: "DEAL-10242", product: "Solar Panels (450W)", buyer: "GreenVolt", supplier: "NovaTrade Inc.", stageIndex: 2, value: 96500, destination: "Hamburg, DE", updatedAt: "2026-06-15T08:40:00Z" },
  { id: "o3", reference: "DEAL-10243", product: "Cold-Press Olive Oil", buyer: "Gourmet Foods", supplier: "EuroAgro Ltd.", stageIndex: 5, value: 42300, destination: "Singapore", updatedAt: "2026-06-14T17:05:00Z" },
  { id: "o4", reference: "DEAL-10244", product: "Lithium Battery Cells", buyer: "VoltX", supplier: "NovaTrade Inc.", stageIndex: 1, value: 220000, destination: "Shanghai, CN", updatedAt: "2026-06-15T07:55:00Z", flagged: true },
  { id: "o5", reference: "DEAL-10245", product: "Cotton Textile Rolls", buyer: "FashionLine", supplier: "EuroAgro Ltd.", stageIndex: 3, value: 58700, destination: "Jeddah, SA", updatedAt: "2026-06-15T06:20:00Z" },
];

const MOCK_DISPUTES: DisputeTicket[] = [
  {
    id: "t1",
    reference: "TKT-5012",
    subject: "Damaged goods on arrival",
    parties: "Customer vs Supplier",
    priority: "high",
    status: "in_review",
    orderRef: "DEAL-10241",
    openedBy: "BuildCorp",
    updatedAt: "2026-06-15T10:02:00Z",
    messages: [
      { id: "m1", author: "BuildCorp", authorRole: "customer", body: "Two steel coils arrived dented. We need a partial refund or replacement.", createdAt: "2026-06-14T12:00:00Z" },
      { id: "m2", author: "GulfMetals Co.", authorRole: "supplier", body: "We packaged per spec. Could this be handling damage in transit?", createdAt: "2026-06-14T14:30:00Z" },
      { id: "m3", author: "Platform Admin", authorRole: "admin", body: "Reviewing the carrier's condition report now. Please share photos.", createdAt: "2026-06-15T09:10:00Z" },
    ],
  },
  {
    id: "t2",
    reference: "TKT-5013",
    subject: "Storage slot double-booked",
    parties: "Supplier vs Warehouse",
    priority: "critical",
    status: "escalated",
    orderRef: "DEAL-10244",
    openedBy: "NovaTrade Inc.",
    updatedAt: "2026-06-15T09:45:00Z",
    messages: [
      { id: "m1", author: "NovaTrade Inc.", authorRole: "supplier", body: "Our reserved slot at Jebel Ali was given to another shipment.", createdAt: "2026-06-15T08:00:00Z" },
      { id: "m2", author: "Jebel Ali Logistics Hub", authorRole: "warehouse", body: "Apologies, a sync error caused the overlap. Allocating overflow bay now.", createdAt: "2026-06-15T08:50:00Z" },
    ],
  },
  {
    id: "t3",
    reference: "TKT-5014",
    subject: "Late delivery penalty dispute",
    parties: "Customer vs Logistics",
    priority: "medium",
    status: "open",
    orderRef: "DEAL-10243",
    openedBy: "Gourmet Foods",
    updatedAt: "2026-06-14T18:20:00Z",
    messages: [
      { id: "m1", author: "Gourmet Foods", authorRole: "customer", body: "Delivery was 3 days late, requesting penalty clause enforcement.", createdAt: "2026-06-14T18:20:00Z" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

async function withFallback<T>(
  loader: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    const result = await loader();
    return result;
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      console.warn(`[admin/data] ${context} fell back to mock data:`, error);
      return fallback;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("admin_platform_metrics")
        .select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No metrics returned");
      return {
        metrics: data as PlatformMetric[],
        generatedAt: new Date().toISOString(),
      };
    },
    { metrics: MOCK_METRICS, generatedAt: new Date().toISOString() },
    "fetchDashboardSnapshot"
  );
}

export async function fetchBiAnalytics(): Promise<BiAnalytics> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("admin_bi_analytics")
        .select("payload")
        .single();
      if (error) throw error;
      if (!data?.payload) throw new Error("No BI payload");
      return data.payload as BiAnalytics;
    },
    MOCK_BI,
    "fetchBiAnalytics"
  );
}

export async function fetchManagedAccounts(): Promise<ManagedAccount[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("managed_accounts")
        .select("*")
        .order("joinedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No accounts");
      return data as ManagedAccount[];
    },
    MOCK_ACCOUNTS,
    "fetchManagedAccounts"
  );
}

export async function fetchTradeDeals(): Promise<TradeDeal[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trade_deals")
        .select("*")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No deals");
      return data as TradeDeal[];
    },
    MOCK_DEALS,
    "fetchTradeDeals"
  );
}

export async function fetchDisputeTickets(): Promise<DisputeTicket[]> {
  return withFallback(
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dispute_tickets")
        .select("*, messages:dispute_messages(*)")
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      if (!data) throw new Error("No tickets");
      return data as DisputeTicket[];
    },
    MOCK_DISPUTES,
    "fetchDisputeTickets"
  );
}

/* -------------------------------------------------------------------------- */
/* Mutations (action triggers)                                                */
/* -------------------------------------------------------------------------- */

export async function updateAccountStatus(
  id: string,
  status: ManagedAccount["status"]
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("managed_accounts")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    undefined,
    `updateAccountStatus(${id}, ${status})`
  );
}

export async function setSupplierVerified(
  id: string,
  verified: boolean
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("managed_accounts")
        .update({ verified })
        .eq("id", id);
      if (error) throw error;
    },
    undefined,
    `setSupplierVerified(${id}, ${verified})`
  );
}

export async function postDisputeMessage(
  ticketId: string,
  body: string
): Promise<void> {
  await withFallback(
    async () => {
      const supabase = createClient();
      const { error } = await supabase.from("dispute_messages").insert({
        ticket_id: ticketId,
        body,
        author: "Platform Admin",
        author_role: "admin",
      });
      if (error) throw error;
    },
    undefined,
    `postDisputeMessage(${ticketId})`
  );
}
