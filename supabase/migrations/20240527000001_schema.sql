create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'cashier', 'barista', 'store_manager', 'inventory_staff',
  'finance', 'operations_manager', 'commercial_analyst', 'company_admin'
);

create type public.inventory_item_type as enum (
  'raw_material', 'semi_finished_good', 'finished_good',
  'retail_good', 'supply', 'service_non_stock'
);

create type public.stock_movement_type as enum (
  'sale_consumption', 'recipe_production', 'byproduct_creation',
  'purchase_receipt', 'transfer_out', 'transfer_in', 'wastage',
  'stock_count_adjustment', 'return', 'manual_adjustment'
);

create type public.transaction_status as enum (
  'draft', 'completed', 'void_requested', 'voided', 'refunded', 'sync_pending', 'sync_failed'
);

create type public.delivery_channel as enum ('email', 'whatsapp');
create type public.delivery_status as enum ('pending', 'sent', 'failed', 'delivered', 'read');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  code text not null unique,
  name text not null,
  accent_color text default 'teal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(company_id, slug)
);

create table public.outlets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  code text not null,
  timezone text not null default 'Asia/Jakarta',
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, code)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete cascade,
  name text not null,
  code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique(company_id, code)
);

create table public.registers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  device_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  default_outlet_id uuid references public.outlets(id) on delete set null,
  username text not null,
  full_name text not null,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, username)
);

create table public.permissions (
  key text primary key,
  description text not null
);

create table public.role_permissions (
  role public.app_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key(role, permission_key)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, outlet_id, role)
);

create table public.user_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  username text not null,
  role public.app_role not null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  type public.inventory_item_type not null,
  sku text not null,
  barcode text,
  name text not null,
  base_unit text not null,
  purchase_unit text,
  purchase_to_base_factor numeric(18,6) default 1,
  track_stock boolean not null default true,
  track_expiry boolean not null default false,
  fifo_costing boolean not null default true,
  reorder_point numeric(18,4),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, sku)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  description text,
  price numeric(18,2) not null default 0,
  tax_rate numeric(8,4) not null default 0,
  is_recipe_based boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, sku)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text not null,
  price_delta numeric(18,2) not null default 0,
  is_active boolean not null default true,
  unique(company_id, sku)
);

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  min_select int not null default 0,
  max_select int not null default 1
);

create table public.modifiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(18,2) not null default 0,
  is_active boolean not null default true
);

create table public.product_modifier_groups (
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  primary key(product_id, modifier_group_id)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  version int not null default 1,
  output_quantity numeric(18,4) not null default 1,
  output_unit text not null default 'pcs',
  yield_factor numeric(10,6) not null default 1,
  waste_factor numeric(10,6) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, product_id, product_variant_id, version)
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  modifier_id uuid references public.modifiers(id) on delete cascade,
  quantity numeric(18,6) not null,
  unit text not null,
  conversion_to_base_factor numeric(18,6) not null default 1,
  is_optional boolean not null default false
);

create table public.recipe_byproducts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(18,6) not null,
  unit text not null,
  conversion_to_base_factor numeric(18,6) not null default 1,
  expiry_days int not null,
  cost_allocation_percent numeric(8,4) not null default 0
);

create table public.fifo_cost_layers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  batch_code text,
  quantity_received numeric(18,6) not null,
  quantity_remaining numeric(18,6) not null,
  unit_cost numeric(18,6) not null,
  received_at timestamptz not null default now(),
  expires_at timestamptz,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index idx_fifo_layers_company_outlet on public.fifo_cost_layers(company_id, outlet_id, inventory_item_id);
create index idx_fifo_layers_expires on public.fifo_cost_layers(expires_at) where expires_at is not null;

create table public.pos_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  register_id uuid references public.registers(id) on delete set null,
  opened_by uuid not null references public.user_profiles(id),
  closed_by uuid references public.user_profiles(id),
  device_id text,
  opening_cash numeric(18,2) not null default 0,
  closing_cash numeric(18,2),
  status text not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  name text,
  phone text,
  email text,
  birthday date,
  tags text[] not null default '{}',
  whatsapp_opt_in boolean not null default false,
  email_opt_in boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  pos_session_id uuid references public.pos_sessions(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  cashier_id uuid not null references public.user_profiles(id),
  local_id text,
  receipt_number text not null,
  status public.transaction_status not null default 'completed',
  subtotal numeric(18,2) not null default 0,
  discount_total numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  fifo_cogs_total numeric(18,2) not null default 0,
  sync_status text not null default 'synced',
  sync_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(company_id, receipt_number),
  unique(company_id, local_id)
);

create index idx_transactions_company_outlet_created on public.transactions(company_id, outlet_id, created_at desc);

create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_variant_id uuid references public.product_variants(id),
  recipe_id uuid references public.recipes(id),
  recipe_version int,
  quantity numeric(18,4) not null,
  unit_price numeric(18,2) not null,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  line_total numeric(18,2) not null,
  fifo_cogs numeric(18,2) not null default 0,
  notes text
);

create table public.transaction_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_item_id uuid not null references public.transaction_items(id) on delete cascade,
  modifier_id uuid not null references public.modifiers(id),
  price_delta numeric(18,2) not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  method text not null,
  amount numeric(18,2) not null,
  reference text,
  created_at timestamptz not null default now()
);

create table public.stock_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity_delta numeric(18,6) not null,
  unit text not null,
  fifo_cost_layer_id uuid references public.fifo_cost_layers(id) on delete set null,
  unit_cost numeric(18,6),
  total_cost numeric(18,6),
  batch_code text,
  expires_at timestamptz,
  source_type text not null,
  source_id uuid,
  notes text,
  created_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now()
);

create index idx_stock_ledger_company_outlet_created on public.stock_ledger(company_id, outlet_id, created_at desc);

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  pos_session_id uuid references public.pos_sessions(id) on delete set null,
  status text not null default 'draft',
  counted_by uuid references public.user_profiles(id),
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.stock_count_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stock_count_id uuid not null references public.stock_counts(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id),
  expected_quantity numeric(18,6) not null,
  counted_quantity numeric(18,6) not null,
  variance_quantity numeric(18,6) generated always as (counted_quantity - expected_quantity) stored,
  reason text
);

create table public.receipt_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid references public.user_profiles(id),
  printer_name text,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.invoice_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel public.delivery_channel not null,
  recipient text not null,
  status public.delivery_status not null default 'pending',
  provider_message_id text,
  error_message text,
  sent_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete set null,
  request_type text not null,
  source_type text not null,
  source_id uuid not null,
  status public.approval_status not null default 'pending',
  requested_by uuid references public.user_profiles(id),
  reviewed_by uuid references public.user_profiles(id),
  reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references public.user_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  config jsonb not null default '{}',
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, provider)
);

create table public.receipt_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  store_name text not null,
  logo_url text,
  paper_width_mm int not null default 80,
  footer_text text,
  tax_number text,
  copy_count int not null default 1,
  auto_cut boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.print_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete cascade,
  printer_name text,
  esc_pos_mode text default 'generic',
  use_qz_tray boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(company_id, outlet_id)
);

create table public.held_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  cashier_id uuid not null references public.user_profiles(id),
  local_id text,
  payload jsonb not null default '{}',
  label text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger inventory_items_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
