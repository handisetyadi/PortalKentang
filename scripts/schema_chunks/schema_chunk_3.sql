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
