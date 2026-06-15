/**
 * Central Supabase configuration / live-mode detection.
 *
 * The role data layers (`src/lib/<role>/data.ts`) use `withFallback` to serve
 * mock data until real tables exist. This helper lets them detect, at runtime,
 * whether a live Supabase connection is even possible — so on Vercel (with env
 * vars set) they attempt the real REST/RPC call, and only fall back to mock if
 * the env is genuinely absent (e.g. a preview build with no secrets).
 *
 * Because NEXT_PUBLIC_* vars are inlined at build time, this evaluates
 * correctly in both server and browser bundles.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True when both public Supabase env vars are present, i.e. a live backend is
 * configured. Data layers use this to decide whether to attempt live queries.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
