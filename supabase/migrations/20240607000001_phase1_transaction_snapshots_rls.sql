-- Phase 1: transaction snapshots, cart note, RLS on exposed tables

alter table public.transactions
  add column if not exists cart_note text;

alter table public.transaction_items
  add column if not exists product_name text,
  add column if not exists variant_name text;

alter table public.transaction_item_modifiers
  add column if not exists modifier_name text;

-- Backfill snapshots from current catalog
update public.transaction_items ti
set product_name = p.name
from public.products p
where ti.product_id = p.id
  and ti.product_name is null;

update public.transaction_items ti
set variant_name = v.name
from public.product_variants v
where ti.product_variant_id = v.id
  and ti.variant_name is null;

update public.transaction_item_modifiers tim
set modifier_name = m.name
from public.modifiers m
where tim.modifier_id = m.id
  and tim.modifier_name is null;

-- RLS: permissions (global read-only catalog)
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "authenticated read permissions" on public.permissions
  for select to authenticated using (true);

create policy "authenticated read role permissions" on public.role_permissions
  for select to authenticated using (true);

-- RLS: settings & logs (tenant-scoped)
alter table public.integration_settings enable row level security;
alter table public.print_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.receipt_logs enable row level security;
alter table public.invoice_delivery_logs enable row level security;
alter table public.user_invites enable row level security;

create policy "tenant read integration settings" on public.integration_settings
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage integration settings" on public.integration_settings
  for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('settings.company.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('settings.company.manage'));

create policy "tenant read print settings" on public.print_settings
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage print settings" on public.print_settings
  for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('settings.company.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('settings.company.manage'));

create policy "tenant read audit logs" on public.audit_logs
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert audit logs" on public.audit_logs
  for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant read receipt logs" on public.receipt_logs
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert receipt logs" on public.receipt_logs
  for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant read invoice delivery logs" on public.invoice_delivery_logs
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert invoice delivery logs" on public.invoice_delivery_logs
  for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant manage invoice delivery logs" on public.invoice_delivery_logs
  for update to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read user invites" on public.user_invites
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage user invites" on public.user_invites
  for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('settings.company.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('settings.company.manage'));
