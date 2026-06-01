-- =============================================================================
-- Product catalog
-- =============================================================================
-- Tracks parts/products: our part number, the (preferred) vendor's part number,
-- our cost, customer price, SKU, description, etc. Run after 0001_init.sql.
-- =============================================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  internal_part_number text,         -- our part number
  sku text,
  vendor_part_number text,           -- the preferred vendor's part number
  description text,
  unit_cost numeric,                 -- our price (what we pay the vendor)
  sell_price numeric,                -- customer price
  vendor_id uuid references vendors (id) on delete set null,
  uom text,                          -- unit of measure (ea, box, etc.)
  notes text,
  is_active boolean not null default true,
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast catalog search.
create index idx_products_internal_pn on products (lower(internal_part_number));
create index idx_products_sku on products (lower(sku));
create index idx_products_vendor_pn on products (lower(vendor_part_number));
create index idx_products_description on products (lower(description));
create index idx_products_vendor on products (vendor_id);

-- Prevent duplicate part numbers / SKUs (allow multiple NULLs).
create unique index uq_products_internal_pn
  on products (lower(internal_part_number))
  where internal_part_number is not null;
create unique index uq_products_sku
  on products (lower(sku))
  where sku is not null;

create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

-- RLS: internal users (admin / order_manager) only. Vendors have no access.
alter table products enable row level security;

create policy products_internal on products for all
  using (is_internal()) with check (is_internal());
