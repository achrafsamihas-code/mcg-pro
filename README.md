# MCG Global — B2B Trade & Logistics Platform

A scalable, multi-role B2B trade and logistics platform built on Next.js 15, Supabase, and Vercel. The platform serves five distinct user roles from a single codebase, each with its own isolated dashboard, navigation, and data layer.

## The Five Roles

| Role | Route prefix | Purpose |
|------|-------------|---------|
| **Super Admin / CEO** | `/admin` | Platform command center — metrics, BI analytics, user & supplier control, global order tracking, dispute mediation |
| **Supplier** | `/supplier` | Product listings, B2B negotiations, order fulfilment, warehouse booking |
| **Warehouse** | `/warehouse` | Space utilisation, tenant/booking management, pricing & capacity config |
| **Logistics / Driver** | `/logistics` | Job board, route tracking, delivery status updates, wallet & earnings |
| **B2B Customer / Buyer** | `/customer` | Marketplace browsing, bulk ordering, negotiations, order tracking, disputes |

## Tech Stack

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4 (with `@tailwindcss/forms`) · full dark mode
- **Backend:** Supabase — Auth, PostgreSQL, Row-Level Security, Edge Functions
- **Charts:** ApexCharts (`react-apexcharts`)
- **Hosting:** Vercel (full server runtime — SSR, middleware, server actions)

## Architecture

### Route groups & role isolation
Each role lives in its own App Router segment under `src/app/(dashboards)/<role>/`, sharing a single `DashboardLayout` that adapts via a `role` prop. The sidebar navigation is role-aware, and no role's feature code imports another's.

### Multi-role authentication
- Roles are stored in the `accounts` table and mirrored into the JWT `app_metadata.role` (server-controlled, tamper-proof) via a database trigger.
- `src/middleware.ts` refreshes the Supabase session on every request and enforces role-based access — users are redirected to their own dashboard if they stray into another role's zone.
- Row-Level Security is the authoritative guard: every table has RLS enabled with policies keyed on role + ownership.

### Data layer with live toggle
Each role has a typed data layer under `src/lib/<role>/` (`types.ts` + `data.ts`) using a `withFallback` wrapper:
- **No Supabase env configured** → serves representative mock data (local dev works out of the box).
- **Supabase env present** (e.g. on Vercel) → queries live tables and surfaces real errors.

This is driven by `isSupabaseConfigured` in `src/lib/supabase/config.ts`, so the transition from mock to live is automatic once env vars are set.

## Project Structure

```text
src/
├── middleware.ts                 # session refresh + role-based access control
├── app/
│   ├── (dashboards)/             # the five role dashboards
│   │   ├── admin/  supplier/  warehouse/  logistics/  customer/
│   └── (full-width-pages)/       # auth pages (signin / signup)
├── components/
│   ├── admin/ supplier/ warehouse/ logistics/ customer/   # role-specific UI
│   ├── ui/  form/  common/  header/  footer/              # shared primitives
│   └── layout/DashboardLayout.tsx
├── lib/
│   ├── supabase/                 # browser/server/middleware clients + config
│   ├── admin/ supplier/ warehouse/ logistics/ customer/   # per-role data layers
│   └── utils/
├── context/                      # ThemeContext, SidebarContext
└── types/                        # UserRole enum, profile types, route map

supabase/
├── schema.sql                    # enums, tables, FKs, triggers, RLS policies
└── compat_views.sql              # maps data-layer table names to core schema
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy the example env file and fill in your Supabase credentials:
```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key (safe in browser — RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server only**, never expose to client |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for auth redirects |

> Leave the env vars empty to run against built-in mock data.

### 3. Set up the database
In the Supabase SQL Editor, run in order:
1. `supabase/schema.sql`
2. `supabase/compat_views.sql`

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment (Vercel)

1. Import the repository into Vercel (Next.js is auto-detected).
2. Add the four environment variables under **Project → Settings → Environment Variables** for Production, Preview, and Development.
3. In **Supabase → Auth → URL Configuration**, add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to the redirect URLs.
4. Push to your connected branch — Vercel builds and deploys automatically.

No custom routing config is required; the five route groups and middleware run natively on Vercel's runtime.

## Security Notes

- RLS is the real authorization boundary — middleware and layout checks are UX conveniences, not the security guarantee.
- Authorization always reads role from `app_metadata` (server-controlled), never `user_metadata` (user-editable).
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must only ever be used server-side.

## License

Built on the [TailAdmin](https://tailadmin.com/) Next.js template (MIT). Platform code and architecture © MCG Global.
