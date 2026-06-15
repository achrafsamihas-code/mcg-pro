-- ============================================================================
-- B2B Trade & Logistics Platform — Production PostgreSQL Schema (Supabase)
-- ============================================================================
-- Apply with the Supabase SQL Editor, or:
--   supabase db push   (with this file referenced by a migration)
--
-- IMPORTANT — role naming:
--   The frontend (src/types/index.ts, middleware, layouts) uses these role
--   values: super_admin | supplier | warehouse | logistics | customer.
--   The enum below MATCHES THE RUNNING CODE so role-based redirects and RLS
--   JWT checks line up. (The original task spec proposed
--   warehouse_owner/driver/buyer; using those would break the middleware
--   comparison against app_metadata.role unless the TS enum is changed too.)
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------

do $$ begin
  create type user_role as enum
    ('super_admin', 'supplier', 'warehouse', 'logistics', 'customer');
exception when duplicate_object then null; end $$;

-- Account lifecycle
do $$ begin
  create type account_status as enum ('active', 'pending', 'suspended', 'rejected');
exception when duplicate_object then null; end $$;

-- Product lifecycle
do $$ begin
  create type product_status as enum ('active', 'draft', 'out_of_stock');
exception when duplicate_object then null; end $$;

-- Negotiation lifecycle
do $$ begin
  create type negotiation_status as enum
    ('open', 'countered', 'accepted', 'in_production', 'declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_author as enum ('buyer', 'supplier');
exception when duplicate_object then null; end $$;

-- Order / deal stages (the universal 6-stage tracker)
do $$ begin
  create type order_stage as enum
    ('Received', 'Supplier Found', 'Negotiation', 'Production', 'Shipping', 'Delivered');
exception when duplicate_object then null; end $$;

-- Warehouse booking lifecycle
do $$ begin
  create type booking_status as enum
    ('pending_approval', 'active', 'expired', 'rejected', 'terminated');
exception when duplicate_object then null; end $$;

-- Dispute lifecycle
do $$ begin
  create type dispute_status as enum ('open', 'in_review', 'resolved', 'escalated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispute_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispute_target as enum ('supplier', 'warehouse', 'logistics');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. SHARED: updated_at trigger function
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 3. CORE TABLES
-- ----------------------------------------------------------------------------

-- 3.1 accounts — 1:1 with auth.users; the source of truth for role.
create table if not exists public.accounts (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  role         user_role not null default 'customer',
  status       account_status not null default 'pending',
  is_verified  boolean not null default false,   -- supplier "verified badge"
  is_banned    boolean not null default false,
  full_name    text,
  company_name text,
  region       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3.2 products — owned by a supplier account. Tiered pricing as JSONB:
--      [{ "minQty": 100, "unitPrice": 48 }, ...]
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  supplier_id    uuid not null references public.accounts(id) on delete cascade,
  name           text not null,
  sku            text,
  description    text,
  category       text not null default 'General',
  status         product_status not null default 'active',
  stock          integer not null default 0 check (stock >= 0),
  base_price     numeric(12,2) not null default 0 check (base_price >= 0),
  moq            integer not null default 1 check (moq >= 1),
  image_url      text,
  tiered_pricing jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_products_supplier on public.products(supplier_id);
create index if not exists idx_products_category on public.products(category);

-- 3.3 negotiations — bulk-order bargaining between a buyer and supplier.
--      `history` holds the ordered offer rounds as JSONB:
--      [{ "author":"buyer", "unitPrice":110, "quantity":300, "note":"...", "createdAt":"..." }]
create table if not exists public.negotiations (
  id            uuid primary key default gen_random_uuid(),
  reference     text unique not null default ('NEG-' || substr(gen_random_uuid()::text, 1, 8)),
  buyer_id      uuid not null references public.accounts(id) on delete cascade,
  supplier_id   uuid not null references public.accounts(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  status        negotiation_status not null default 'open',
  last_offer_by offer_author not null default 'buyer',
  target_price  numeric(12,2) not null check (target_price >= 0),
  current_price numeric(12,2) not null default 0,
  quantity      integer not null check (quantity > 0),
  history       jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_negotiations_buyer on public.negotiations(buyer_id);
create index if not exists idx_negotiations_supplier on public.negotiations(supplier_id);

-- 3.4 orders / deals — the universal 6-stage tracker, the spine read by
--      admin, supplier, logistics, and buyer dashboards.
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  reference   text unique not null default ('DEAL-' || substr(gen_random_uuid()::text, 1, 8)),
  buyer_id    uuid not null references public.accounts(id) on delete cascade,
  supplier_id uuid not null references public.accounts(id) on delete cascade,
  driver_id   uuid references public.accounts(id) on delete set null,
  product_id  uuid references public.products(id) on delete set null,
  stage       order_stage not null default 'Received',
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(12,2) not null default 0,
  origin      text,
  destination text,
  eta         date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_orders_buyer on public.orders(buyer_id);
create index if not exists idx_orders_supplier on public.orders(supplier_id);
create index if not exists idx_orders_driver on public.orders(driver_id);
create index if not exists idx_orders_stage on public.orders(stage);

-- 3.5 warehouse_bookings — suppliers renting pallet space from warehouses.
create table if not exists public.warehouse_bookings (
  id            uuid primary key default gen_random_uuid(),
  reference     text unique not null default ('RNT-' || substr(gen_random_uuid()::text, 1, 8)),
  warehouse_id  uuid not null references public.accounts(id) on delete cascade,
  supplier_id   uuid not null references public.accounts(id) on delete cascade,
  status        booking_status not null default 'pending_approval',
  pallet_space  integer not null check (pallet_space > 0),
  daily_rate    numeric(12,2) not null check (daily_rate >= 0),
  start_date    date not null,
  end_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_bookings_warehouse on public.warehouse_bookings(warehouse_id);
create index if not exists idx_bookings_supplier on public.warehouse_bookings(supplier_id);

-- 3.6 disputes — buyer-raised (or party-raised) claims, mediated by admin.
--      `messages` holds the thread as JSONB:
--      [{ "author":"You", "authorRole":"buyer", "body":"...", "createdAt":"..." }]
create table if not exists public.disputes (
  id          uuid primary key default gen_random_uuid(),
  reference   text unique not null default ('TKT-' || substr(gen_random_uuid()::text, 1, 8)),
  raised_by   uuid not null references public.accounts(id) on delete cascade,
  against_id  uuid references public.accounts(id) on delete set null,
  against     dispute_target not null default 'supplier',
  order_ref   text,
  subject     text not null,
  category    text not null default 'other',
  status      dispute_status not null default 'open',
  priority    dispute_priority not null default 'medium',
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_disputes_raised_by on public.disputes(raised_by);
create index if not exists idx_disputes_against on public.disputes(against_id);

-- ----------------------------------------------------------------------------
-- 4. updated_at TRIGGERS
-- ----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'accounts','products','negotiations','orders','warehouse_bookings','disputes'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 5. AUTH BRIDGE: auto-provision account + mirror role into JWT
-- ----------------------------------------------------------------------------

-- 5.1 Create an account row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.accounts (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.2 Mirror accounts.role into auth JWT app_metadata so middleware & RLS read
--     it cheaply (app_metadata is server-controlled / not user-editable).
create or replace function public.sync_role_to_jwt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update auth.users
    set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end $$;

drop trigger if exists on_account_role_change on public.accounts;
create trigger on_account_role_change
  after insert or update of role on public.accounts
  for each row execute function public.sync_role_to_jwt();

-- 5.3 JWT role helper used by RLS policies.
create or replace function public.current_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'customer');
$$;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Strategy: every table has RLS enabled (no table is open). Policies combine
-- ROLE (current_role()) with OWNERSHIP (auth.uid() = a fk column). super_admin
-- has read oversight everywhere. The service_role key bypasses RLS for admin
-- jobs / Edge Functions.

alter table public.accounts            enable row level security;
alter table public.products            enable row level security;
alter table public.negotiations        enable row level security;
alter table public.orders              enable row level security;
alter table public.warehouse_bookings  enable row level security;
alter table public.disputes            enable row level security;

-- 6.1 accounts: read own row; admin reads all. No self role escalation.
drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts for select
  using (id = auth.uid() or public.current_role() = 'super_admin');

drop policy if exists accounts_update_self on public.accounts;
create policy accounts_update_self on public.accounts for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.accounts where id = auth.uid()));

drop policy if exists accounts_admin_write on public.accounts;
create policy accounts_admin_write on public.accounts for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- 6.2 products: public read (marketplace); supplier writes own; admin all.
drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (true);

drop policy if exists products_supplier_write on public.products;
create policy products_supplier_write on public.products for all
  using (
    (public.current_role() = 'supplier' and supplier_id = auth.uid())
    or public.current_role() = 'super_admin'
  )
  with check (
    (public.current_role() = 'supplier' and supplier_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- 6.3 negotiations: visible to the two parties + admin; either party may write.
drop policy if exists negotiations_rw on public.negotiations;
create policy negotiations_rw on public.negotiations for all
  using (
    buyer_id = auth.uid() or supplier_id = auth.uid()
    or public.current_role() = 'super_admin'
  )
  with check (
    buyer_id = auth.uid() or supplier_id = auth.uid()
    or public.current_role() = 'super_admin'
  );

-- 6.4 orders: visible to buyer, supplier, assigned driver + admin.
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select
  using (
    buyer_id = auth.uid() or supplier_id = auth.uid() or driver_id = auth.uid()
    or public.current_role() = 'super_admin'
  );

drop policy if exists orders_party_update on public.orders;
create policy orders_party_update on public.orders for update
  using (
    supplier_id = auth.uid() or driver_id = auth.uid()
    or public.current_role() = 'super_admin'
  );

-- 6.5 warehouse_bookings: visible to the warehouse + supplier + admin.
drop policy if exists bookings_rw on public.warehouse_bookings;
create policy bookings_rw on public.warehouse_bookings for all
  using (
    warehouse_id = auth.uid() or supplier_id = auth.uid()
    or public.current_role() = 'super_admin'
  )
  with check (
    warehouse_id = auth.uid() or supplier_id = auth.uid()
    or public.current_role() = 'super_admin'
  );

-- 6.6 disputes: visible to raiser + the party named + admin (the mediator).
drop policy if exists disputes_rw on public.disputes;
create policy disputes_rw on public.disputes for all
  using (
    raised_by = auth.uid() or against_id = auth.uid()
    or public.current_role() = 'super_admin'
  )
  with check (
    raised_by = auth.uid()
    or public.current_role() = 'super_admin'
  );

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
