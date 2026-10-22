-- Run in Supabase SQL Editor. RLS is enabled on every application table.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('LP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 20),
  address text not null check (char_length(address) between 3 and 250),
  service text not null check (service in ('Regular Wash','Wash and Fold','Delicate Care','Express Service')),
  estimated_kg numeric(6,2) not null default 3 check (estimated_kg between 0.5 and 100),
  pickup_date date not null,
  pickup_window text,
  notes text,
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Processing','Ready for Pickup','Completed','Cancelled')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Partially Paid','Paid')),
  amount_due numeric(10,2) not null default 0 check (amount_due >= 0),
  amount_paid numeric(10,2) not null default 0 check (amount_paid >= 0),
  sms_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
-- Users may read only their own profile. Role is set by a trusted operator in SQL, never by public signup.
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
-- No public direct order reads/writes. Customer order creation is through server route using anon client;
-- for production, use a dedicated server-side RPC or server-only service-role client to insert orders because
-- this intentionally keeps browser-side writes unavailable.
create policy "admins read orders" on public.orders for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admins update orders" on public.orders for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
-- No anonymous policies. Server-side order insert uses SUPABASE_SERVICE_ROLE_KEY in the route in production.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
