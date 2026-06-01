-- =============================================================================
-- Dropship Manager - initial schema
-- =============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Order of operations: extensions -> enums -> tables -> indexes -> functions
-- -> triggers -> RLS policies -> views.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type user_role as enum ('admin', 'order_manager', 'vendor');

create type customer_order_status as enum (
  'draft',
  'open',
  'partially_shipped',
  'shipped',
  'completed',
  'cancelled'
);

create type vendor_po_status as enum (
  'draft',
  'sent',
  'confirmed',
  'backordered',
  'partially_shipped',
  'shipped',
  'delivered',
  'cancelled'
);

create type delivery_status as enum (
  'pending',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception'
);

create type entity_type as enum ('customer_order', 'vendor_purchase_order');

-- -----------------------------------------------------------------------------
-- Helper: number sequences for human-friendly identifiers
-- -----------------------------------------------------------------------------
create sequence if not exists customer_order_seq start 1000;
create sequence if not exists vendor_po_seq start 1000;

create or replace function next_customer_order_number()
returns text language sql as $$
  select 'SO-' || lpad(nextval('customer_order_seq')::text, 6, '0');
$$;

create or replace function next_vendor_po_number()
returns text language sql as $$
  select 'PO-' || lpad(nextval('vendor_po_seq')::text, 6, '0');
$$;

-- -----------------------------------------------------------------------------
-- Generic updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Tables
-- =============================================================================

-- users (profile linked to auth.users)
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'order_manager',
  vendor_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  ship_to_line1 text,
  ship_to_line2 text,
  ship_to_city text,
  ship_to_state text,
  ship_to_postal_code text,
  ship_to_country text default 'US',
  notes text,
  is_active boolean not null default true,
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- vendors
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  payment_terms text,
  lead_time_days integer,
  notes text,
  is_active boolean not null default true,
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- now that vendors exists, add the FK from users.vendor_id
alter table users
  add constraint users_vendor_id_fkey
  foreign key (vendor_id) references vendors (id) on delete set null;

-- customer_orders
create table customer_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default next_customer_order_number(),
  customer_id uuid not null references customers (id),
  customer_po_number text,
  salesperson text,
  requested_ship_date date,
  ship_to_line1 text,
  ship_to_line2 text,
  ship_to_city text,
  ship_to_state text,
  ship_to_postal_code text,
  ship_to_country text default 'US',
  internal_notes text,
  status customer_order_status not null default 'draft',
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- customer_order_items
create table customer_order_items (
  id uuid primary key default gen_random_uuid(),
  customer_order_id uuid not null references customer_orders (id) on delete cascade,
  sku text,
  description text,
  quantity numeric not null default 1,
  unit_cost numeric,
  sell_price numeric,
  tracking_number text,
  ship_date date,
  est_delivery_date date,
  notes text,
  vendor_po_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- vendor_purchase_orders
create table vendor_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique default next_vendor_po_number(),
  vendor_id uuid not null references vendors (id),
  customer_order_id uuid not null references customer_orders (id),
  ship_to_line1 text,
  ship_to_line2 text,
  ship_to_city text,
  ship_to_state text,
  ship_to_postal_code text,
  ship_to_country text default 'US',
  requested_ship_date date,
  special_instructions text,
  internal_notes text,
  status vendor_po_status not null default 'draft',
  confirm_token text unique default encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  confirmed_at timestamptz,
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- vendor_purchase_order_items
create table vendor_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  vendor_po_id uuid not null references vendor_purchase_orders (id) on delete cascade,
  customer_order_item_id uuid references customer_order_items (id) on delete set null,
  sku text,
  description text,
  quantity numeric not null default 1,
  unit_cost numeric,
  status vendor_po_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- link the customer order item back to its vendor po item
alter table customer_order_items
  add constraint customer_order_items_vendor_po_item_fkey
  foreign key (vendor_po_item_id)
  references vendor_purchase_order_items (id) on delete set null;

-- shipments
create table shipments (
  id uuid primary key default gen_random_uuid(),
  vendor_po_id uuid not null references vendor_purchase_orders (id) on delete cascade,
  carrier text,
  tracking_number text,
  est_ship_date date,
  actual_ship_date date,
  est_delivery_date date,
  delivery_status delivery_status not null default 'pending',
  delivered_at timestamptz,
  pod_file_path text,
  notes text,
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- order_notes (polymorphic)
create table order_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  body text not null,
  author_id uuid references users (id),
  created_at timestamptz not null default now()
);

-- audit_events
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  actor_id uuid references users (id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- email_logs
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  vendor_po_id uuid references vendor_purchase_orders (id) on delete set null,
  to_email text not null,
  subject text not null,
  resend_id text,
  status text not null default 'sent',
  error text,
  payload jsonb not null default '{}'::jsonb,
  sent_by uuid references users (id),
  sent_at timestamptz not null default now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
create index idx_customers_name on customers (lower(name));
create index idx_vendors_name on vendors (lower(name));
create index idx_co_customer on customer_orders (customer_id);
create index idx_co_status on customer_orders (status);
create index idx_co_order_number on customer_orders (order_number);
create index idx_co_salesperson on customer_orders (lower(salesperson));
create index idx_co_requested_ship on customer_orders (requested_ship_date);
create index idx_coi_order on customer_order_items (customer_order_id);
create index idx_coi_sku on customer_order_items (lower(sku));
create index idx_coi_tracking on customer_order_items (tracking_number);
create index idx_vpo_vendor on vendor_purchase_orders (vendor_id);
create index idx_vpo_order on vendor_purchase_orders (customer_order_id);
create index idx_vpo_status on vendor_purchase_orders (status);
create index idx_vpo_po_number on vendor_purchase_orders (po_number);
create index idx_vpo_sent_at on vendor_purchase_orders (sent_at);
create index idx_vpoi_po on vendor_purchase_order_items (vendor_po_id);
create index idx_vpoi_sku on vendor_purchase_order_items (lower(sku));
create index idx_shipments_po on shipments (vendor_po_id);
create index idx_shipments_tracking on shipments (tracking_number);
create index idx_notes_entity on order_notes (entity_type, entity_id);
create index idx_audit_entity on audit_events (entity_type, entity_id);
create index idx_audit_created on audit_events (created_at desc);
create index idx_email_po on email_logs (vendor_po_id);

-- =============================================================================
-- updated_at triggers
-- =============================================================================
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();
create trigger trg_customers_updated before update on customers
  for each row execute function set_updated_at();
create trigger trg_vendors_updated before update on vendors
  for each row execute function set_updated_at();
create trigger trg_co_updated before update on customer_orders
  for each row execute function set_updated_at();
create trigger trg_coi_updated before update on customer_order_items
  for each row execute function set_updated_at();
create trigger trg_vpo_updated before update on vendor_purchase_orders
  for each row execute function set_updated_at();
create trigger trg_vpoi_updated before update on vendor_purchase_order_items
  for each row execute function set_updated_at();
create trigger trg_shipments_updated before update on shipments
  for each row execute function set_updated_at();

-- =============================================================================
-- Auth helper functions (used by RLS)
-- =============================================================================
create or replace function current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid();
$$;

create or replace function current_user_vendor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select vendor_id from users where id = auth.uid();
$$;

create or replace function is_internal()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(current_user_role() in ('admin', 'order_manager'), false);
$$;

-- =============================================================================
-- Auto-create a profile row when a new auth user is created
-- =============================================================================
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'order_manager')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table users enable row level security;
alter table customers enable row level security;
alter table vendors enable row level security;
alter table customer_orders enable row level security;
alter table customer_order_items enable row level security;
alter table vendor_purchase_orders enable row level security;
alter table vendor_purchase_order_items enable row level security;
alter table shipments enable row level security;
alter table order_notes enable row level security;
alter table audit_events enable row level security;
alter table email_logs enable row level security;

-- users: everyone reads own row; internal reads all; admin manages all
create policy users_select_self on users for select
  using (id = auth.uid() or is_internal());
create policy users_admin_all on users for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
create policy users_update_self on users for update
  using (id = auth.uid());

-- customers: internal full access; vendors no access
create policy customers_internal on customers for all
  using (is_internal()) with check (is_internal());

-- vendors: internal full access; vendor user reads own vendor record
create policy vendors_internal on vendors for all
  using (is_internal()) with check (is_internal());
create policy vendors_self_read on vendors for select
  using (id = current_user_vendor_id());

-- customer_orders: internal full access; vendors read orders that have a PO to them
create policy co_internal on customer_orders for all
  using (is_internal()) with check (is_internal());
create policy co_vendor_read on customer_orders for select
  using (
    exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.customer_order_id = customer_orders.id
        and vpo.vendor_id = current_user_vendor_id()
    )
  );

-- customer_order_items: internal full access; vendor read of linked items only
create policy coi_internal on customer_order_items for all
  using (is_internal()) with check (is_internal());
create policy coi_vendor_read on customer_order_items for select
  using (
    exists (
      select 1
      from vendor_purchase_order_items vpoi
      join vendor_purchase_orders vpo on vpo.id = vpoi.vendor_po_id
      where vpoi.id = customer_order_items.vendor_po_item_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  );

-- vendor_purchase_orders: internal full; vendor reads & updates own POs
create policy vpo_internal on vendor_purchase_orders for all
  using (is_internal()) with check (is_internal());
create policy vpo_vendor_read on vendor_purchase_orders for select
  using (vendor_id = current_user_vendor_id());
create policy vpo_vendor_update on vendor_purchase_orders for update
  using (vendor_id = current_user_vendor_id())
  with check (vendor_id = current_user_vendor_id());

-- vendor_purchase_order_items: internal full; vendor reads own
create policy vpoi_internal on vendor_purchase_order_items for all
  using (is_internal()) with check (is_internal());
create policy vpoi_vendor_read on vendor_purchase_order_items for select
  using (
    exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.id = vendor_purchase_order_items.vendor_po_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  );

-- shipments: internal full; vendor reads & writes own PO shipments
create policy shipments_internal on shipments for all
  using (is_internal()) with check (is_internal());
create policy shipments_vendor_rw on shipments for all
  using (
    exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.id = shipments.vendor_po_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  )
  with check (
    exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.id = shipments.vendor_po_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  );

-- order_notes: internal full; vendor reads/writes notes on their POs
create policy notes_internal on order_notes for all
  using (is_internal()) with check (is_internal());
create policy notes_vendor on order_notes for all
  using (
    entity_type = 'vendor_purchase_order' and exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.id = order_notes.entity_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  )
  with check (
    entity_type = 'vendor_purchase_order' and exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.id = order_notes.entity_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  );

-- audit_events: internal full read/insert; vendor reads own PO events
create policy audit_internal on audit_events for all
  using (is_internal()) with check (is_internal());
create policy audit_vendor_read on audit_events for select
  using (
    entity_type = 'vendor_purchase_order' and exists (
      select 1 from vendor_purchase_orders vpo
      where vpo.id = audit_events.entity_id
        and vpo.vendor_id = current_user_vendor_id()
    )
  );

-- email_logs: internal only
create policy email_internal on email_logs for all
  using (is_internal()) with check (is_internal());

-- =============================================================================
-- Reporting view: order financials (margin). Internal use only via RLS on base
-- tables; queried server-side with the user's session.
-- =============================================================================
create or replace view order_financials as
select
  co.id as customer_order_id,
  co.order_number,
  co.customer_id,
  co.status,
  co.created_at,
  coalesce(sum(coi.sell_price * coi.quantity), 0) as total_revenue,
  coalesce(sum(coi.unit_cost * coi.quantity), 0) as total_cost,
  coalesce(sum((coi.sell_price - coi.unit_cost) * coi.quantity), 0) as gross_margin
from customer_orders co
left join customer_order_items coi on coi.customer_order_id = co.id
group by co.id;
