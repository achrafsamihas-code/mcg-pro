-- ============================================================================
-- Compatibility Views — bridge the frontend data-layer table names to the
-- canonical schema so the `withFallback` fetchers light up automatically.
-- ============================================================================
-- The role data layers (src/lib/<role>/data.ts) query role-specific names
-- (e.g. marketplace_products, buyer_negotiations, trade_deals). Rather than
-- rename either side, these views/aliases map those names onto the canonical
-- core tables. Apply AFTER schema.sql.
--
-- NOTE: Views inherit RLS from their underlying tables when created by a
-- non-superuser with security_invoker. On Supabase, prefer creating these as
-- security_invoker views (PG15+) so the caller's RLS still applies:
--   alter view <name> set (security_invoker = on);
-- ============================================================================

-- Marketplace products (buyer) — joins supplier verification badge.
create or replace view public.marketplace_products as
  select
    p.id,
    p.name,
    p.category,
    a.company_name        as supplier,
    a.is_verified         as "supplierVerified",
    p.base_price          as "basePrice",
    p.tiered_pricing      as tiers,
    p.moq,
    p.stock,
    a.region              as origin,
    4.6::numeric          as rating
  from public.products p
  join public.accounts a on a.id = p.supplier_id
  where p.status = 'active';
alter view public.marketplace_products set (security_invoker = on);

-- Supplier products (supplier) — direct projection with camelCase aliases.
create or replace view public.supplier_products as
  select
    id,
    supplier_id,
    name,
    sku,
    category,
    status,
    stock,
    base_price        as "basePrice",
    tiered_pricing    as tiers,
    updated_at        as "updatedAt"
  from public.products;
alter view public.supplier_products set (security_invoker = on);

-- Trade deals (admin) / buyer_orders / supplier_orders — projections of orders.
create or replace view public.trade_deals as
  select
    o.id,
    o.reference,
    pr.name               as product,
    b.company_name        as buyer,
    s.company_name        as supplier,
    o.stage,
    o.unit_price * o.quantity as value,
    o.destination,
    o.updated_at          as "updatedAt"
  from public.orders o
  left join public.products pr on pr.id = o.product_id
  left join public.accounts b on b.id = o.buyer_id
  left join public.accounts s on s.id = o.supplier_id;
alter view public.trade_deals set (security_invoker = on);

create or replace view public.buyer_orders as
  select
    o.id, o.reference,
    pr.name as product,
    s.company_name as supplier,
    o.quantity,
    o.unit_price as "unitPrice",
    o.origin, o.destination, o.eta,
    o.updated_at as "updatedAt"
  from public.orders o
  left join public.products pr on pr.id = o.product_id
  left join public.accounts s on s.id = o.supplier_id;
alter view public.buyer_orders set (security_invoker = on);

-- Negotiations aliases (buyer + supplier views read the same table).
create or replace view public.buyer_negotiations as
  select
    n.id, n.reference,
    pr.name as product,
    s.company_name as supplier,
    n.quantity,
    n.target_price as "targetPrice",
    n.current_price as "currentPrice",
    n.last_offer_by as "lastOfferBy",
    n.status,
    n.history as rounds,
    n.updated_at as "updatedAt"
  from public.negotiations n
  left join public.products pr on pr.id = n.product_id
  left join public.accounts s on s.id = n.supplier_id;
alter view public.buyer_negotiations set (security_invoker = on);

create or replace view public.supplier_negotiations as
  select
    n.id, n.reference,
    pr.name as product,
    b.company_name as buyer,
    n.quantity,
    n.target_price as "targetPrice",
    n.current_price as "currentPrice",
    n.status,
    n.history as rounds,
    n.updated_at as "updatedAt"
  from public.negotiations n
  left join public.products pr on pr.id = n.product_id
  left join public.accounts b on b.id = n.buyer_id;
alter view public.supplier_negotiations set (security_invoker = on);

-- Warehouse rental bookings (warehouse owner view).
create or replace view public.warehouse_rental_bookings as
  select
    wb.id, wb.reference,
    s.company_name as supplier,
    s.email        as "supplierEmail",
    wb.pallet_space as pallets,
    wb.daily_rate   as "ratePerPalletDay",
    wb.status,
    wb.start_date   as "startDate",
    wb.end_date     as "endDate",
    (wb.pallet_space * wb.daily_rate * 30) as "monthlyValue",
    wb.created_at   as "createdAt"
  from public.warehouse_bookings wb
  left join public.accounts s on s.id = wb.supplier_id;
alter view public.warehouse_rental_bookings set (security_invoker = on);

-- Disputes aliases (admin + buyer read the same table).
create or replace view public.buyer_disputes as
  select
    d.id, d.reference, d.subject, d.category, d.against,
    d.order_ref as "orderRef", d.priority, d.status,
    d.messages, d.updated_at as "updatedAt"
  from public.disputes d;
alter view public.buyer_disputes set (security_invoker = on);

create or replace view public.dispute_tickets as
  select
    d.id, d.reference, d.subject, d.priority, d.status,
    d.order_ref as "orderRef",
    a.company_name as "openedBy",
    d.messages, d.updated_at as "updatedAt"
  from public.disputes d
  left join public.accounts a on a.id = d.raised_by;
alter view public.dispute_tickets set (security_invoker = on);

-- Managed accounts (admin control center).
create or replace view public.managed_accounts as
  select
    id, full_name as name, email,
    role::text as type,
    status,
    is_verified as verified,
    region,
    created_at as "joinedAt"
  from public.accounts;
alter view public.managed_accounts set (security_invoker = on);

-- ============================================================================
-- END COMPAT VIEWS
-- ============================================================================
