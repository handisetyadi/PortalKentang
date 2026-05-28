create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.user_profiles where id = auth.uid()
$$;

create or replace function public.has_permission(permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = auth.uid()
      and ur.company_id = public.current_company_id()
      and rp.permission_key = permission
  )
$$;

alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.inventory_items enable row level security;
alter table public.transactions enable row level security;
alter table public.stock_ledger enable row level security;
alter table public.customers enable row level security;
alter table public.recipes enable row level security;

create policy "tenant read products" on public.products for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage products" on public.products for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));

create policy "tenant read transactions" on public.transactions for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant create transactions" on public.transactions for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('pos.transaction.create'));

create policy "tenant read customers" on public.customers for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage customers" on public.customers for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('customer.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('customer.manage'));
