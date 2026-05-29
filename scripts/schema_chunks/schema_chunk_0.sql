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

