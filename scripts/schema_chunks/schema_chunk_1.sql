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

