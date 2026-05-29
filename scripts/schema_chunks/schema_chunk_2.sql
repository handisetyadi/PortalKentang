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

