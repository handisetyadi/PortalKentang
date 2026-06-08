-- Loyalty program & voucher system

create type public.loyalty_redeem_type as enum (
  'beverage', 'food', 'retail', 'specific_product'
);

create type public.voucher_discount_type as enum (
  'percentage', 'fixed_amount'
);

create type public.loyalty_point_ledger_type as enum (
  'earn', 'redeem'
);

-- Extend company_settings with loyalty conversion
alter table public.company_settings
  add column if not exists loyalty jsonb not null default '{"rupiahPerPoint": 1000}'::jsonb;

-- Extend customers with points & spend tracking
alter table public.customers
  add column if not exists member_points_balance integer not null default 0,
  add column if not exists total_spend numeric(18,2) not null default 0,
  add column if not exists last_transaction_at timestamptz;

-- Loyalty redemption rules (Marketing > Loyalty Program)
create table public.loyalty_redemption_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  points_required integer not null check (points_required > 0),
  redeem_type public.loyalty_redeem_type not null,
  product_id uuid references public.products(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_rule_specific_product check (
    (redeem_type = 'specific_product' and product_id is not null)
    or (redeem_type <> 'specific_product' and product_id is null)
  )
);

create index loyalty_redemption_rules_company_idx
  on public.loyalty_redemption_rules (company_id, is_active);

-- Vouchers (Marketing > Voucher)
create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  discount_type public.voucher_discount_type not null,
  discount_value numeric(18,2) not null check (discount_value > 0),
  min_spend numeric(18,2) not null default 0 check (min_spend >= 0),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vouchers_valid_period check (valid_until > valid_from)
);

create unique index vouchers_company_code_lower_idx
  on public.vouchers (company_id, lower(code));

-- Extend transactions with promo fields
alter table public.transactions
  add column if not exists voucher_id uuid references public.vouchers(id) on delete set null,
  add column if not exists voucher_code text,
  add column if not exists voucher_discount numeric(18,2) not null default 0,
  add column if not exists points_redeemed integer not null default 0,
  add column if not exists points_earned integer not null default 0,
  add column if not exists loyalty_rule_id uuid references public.loyalty_redemption_rules(id) on delete set null,
  add column if not exists redeemed_product_id uuid references public.products(id) on delete set null,
  add column if not exists redeemed_line_discount numeric(18,2) not null default 0;

-- Voucher redemption audit
create table public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  discount_applied numeric(18,2) not null,
  redeemed_at timestamptz not null default now()
);

create index voucher_redemptions_company_idx
  on public.voucher_redemptions (company_id, redeemed_at desc);

create index voucher_redemptions_voucher_idx
  on public.voucher_redemptions (voucher_id);

-- Loyalty point ledger (earn/redeem audit)
create table public.loyalty_point_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  type public.loyalty_point_ledger_type not null,
  points_delta integer not null,
  balance_after integer not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index loyalty_point_ledger_customer_idx
  on public.loyalty_point_ledger (customer_id, created_at desc);

create index loyalty_point_ledger_company_idx
  on public.loyalty_point_ledger (company_id, created_at desc);

-- RLS
alter table public.loyalty_redemption_rules enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.loyalty_point_ledger enable row level security;

create policy "tenant read loyalty rules" on public.loyalty_redemption_rules
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage loyalty rules" on public.loyalty_redemption_rules
  for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read vouchers" on public.vouchers
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage vouchers" on public.vouchers
  for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read voucher redemptions" on public.voucher_redemptions
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert voucher redemptions" on public.voucher_redemptions
  for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant read loyalty ledger" on public.loyalty_point_ledger
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert loyalty ledger" on public.loyalty_point_ledger
  for insert to authenticated
  with check (company_id = public.current_company_id());

-- Permissions
insert into public.permissions (key, description) values
  ('marketing.read', 'View marketing campaigns, loyalty rules, and vouchers'),
  ('marketing.manage', 'Manage loyalty rules and vouchers')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key) values
  ('company_owner', 'marketing.read'),
  ('company_owner', 'marketing.manage'),
  ('store_manager', 'marketing.read'),
  ('store_manager', 'marketing.manage'),
  ('operations_manager', 'marketing.read'),
  ('commercial_analyst', 'marketing.read'),
  ('finance', 'marketing.read')
on conflict do nothing;

insert into public.role_permissions (role, permission_key)
select 'company_owner', key from public.permissions
on conflict do nothing;

-- updated_at triggers
create trigger loyalty_redemption_rules_updated_at
  before update on public.loyalty_redemption_rules
  for each row execute function public.set_updated_at();

create trigger vouchers_updated_at
  before update on public.vouchers
  for each row execute function public.set_updated_at();
