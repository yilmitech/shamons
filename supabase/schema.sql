-- =============================================================================
-- SHAMONS Poultry & Feeds — Supabase schema
-- Run this once in your Supabase project: SQL Editor > New query > paste > Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE throughout).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ADMIN ROLE TABLE
-- Supabase Auth (auth.users) handles admin *login* (email + password).
-- This table decides which logged-in auth users are actually allowed to act
-- as admins. Nobody gets admin rights just by creating an account.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- An admin can see their own row (used by the app to confirm admin status
-- right after login). Nobody can grant themselves admin via the client.
create policy "admins can read own row"
  on public.admin_users for select
  using (auth.uid() = id);

-- Helper used by every other table's policies below.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  sub_category text,
  brand text,
  breed text,
  description text not null default '',
  base_price numeric not null default 0,
  unit text not null default '',
  min_order_quantity integer,
  image_url text,
  is_feed boolean not null default false,
  feed_sizes jsonb,
  chick_pricing jsonb,
  in_stock boolean not null default true,
  stock_count integer not null default 0,
  tags text[],
  hatch_schedule text,
  next_hatch_date text,
  badge text,
  features text[],
  nutritional_info jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "anyone can read products"
  on public.products for select
  using (true);

create policy "admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. HATCHERY BATCHES (upcoming DOC hatch batches shown in the live ticker)
-- ---------------------------------------------------------------------------
create table if not exists public.hatchery_batches (
  id text primary key,
  title text,
  breed text not null,
  delivery_date text,
  booking_closes text,
  price_per_carton numeric not null default 0,
  available_cartons integer,
  status text not null default 'open',
  hatch_date text,
  total_chicks integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hatchery_batches enable row level security;

create policy "anyone can read batches"
  on public.hatchery_batches for select
  using (true);

create policy "admins can write batches"
  on public.hatchery_batches for insert
  with check (public.is_admin());

create policy "admins can update batches"
  on public.hatchery_batches for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete batches"
  on public.hatchery_batches for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. ORDERS (bookings)
-- Customers can create orders anonymously (no login required to buy) but
-- can NEVER list every order in the table — that would leak every other
-- customer's name, phone, and address. Lookup happens only through the
-- track_order() RPC below, which returns just the matching row(s).
-- Admins (authenticated + in admin_users) get full read/write.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  customer_name text not null,
  phone text not null,
  alt_phone text,
  email text,
  address text,
  lga text,
  fulfillment_method text,
  delivery_or_pickup_location text,
  preferred_date text,
  notes text,
  items jsonb not null,
  total_amount numeric not null default 0,
  payment_method text default 'bank_transfer',
  payment_status text default 'pending_transfer',
  payer_name text,
  transaction_ref text,
  payment_date text,
  payment_proof_image text,
  payment_proof_notes text,
  payment_confirmed_at timestamptz,
  order_status text not null default 'pending',
  approval_status text,
  stock_status text,
  stock_deducted boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sold_at timestamptz
);

alter table public.orders enable row level security;

create policy "anyone can create an order"
  on public.orders for insert
  with check (true);

create policy "admins can read all orders"
  on public.orders for select
  using (public.is_admin());

create policy "admins can update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- Look up a single customer's own order(s) by booking code or phone number,
-- without exposing the rest of the table. SECURITY DEFINER lets this bypass
-- the "admins only" SELECT policy above, safely, because it only returns
-- rows that match the caller-supplied code/phone.
create or replace function public.track_order(p_query text)
returns setof public.orders
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.orders
  where booking_code ilike p_query
     or regexp_replace(phone, '[^0-9]', '', 'g') ilike '%' || regexp_replace(p_query, '[^0-9]', '', 'g') || '%'
  order by created_at desc
  limit 20;
$$;

grant execute on function public.track_order(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. STOCK ALERT SUBSCRIPTIONS
-- Customers can sign up (insert) but not read the list — only admins can,
-- since it's a list of customer names/phone numbers.
-- ---------------------------------------------------------------------------
create table if not exists public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  lga text,
  preferred_product text,
  product_interest text,
  created_at timestamptz not null default now()
);

alter table public.alert_subscriptions enable row level security;

create policy "anyone can subscribe to alerts"
  on public.alert_subscriptions for insert
  with check (true);

create policy "admins can read subscriptions"
  on public.alert_subscriptions for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Keep updated_at current on products / batches
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists trg_batches_updated_at on public.hatchery_batches;
create trigger trg_batches_updated_at
  before update on public.hatchery_batches
  for each row execute function public.set_updated_at();

-- =============================================================================
-- AFTER RUNNING THIS FILE:
--
-- 1. Create your admin login:
--    Authentication > Users > Add user (set an email + password).
--
-- 2. Grant that user admin rights by running (swap in their UUID from the
--    Users list, or their email):
--
--      insert into public.admin_users (id, full_name)
--      select id, 'Depot Admin' from auth.users where email = 'you@example.com';
--
-- 3. Load starting product/batch data — see supabase/seed.sql.
-- =============================================================================
