-- Phase 3: inventory_categories (separate from product_categories), invoice_pdf_path on transactions
-- brands: retained for future multi-brand; single-brand tenants use one brand per company

create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

-- Copy categories referenced by inventory items (preserve ids for FK continuity)
insert into public.inventory_categories (id, company_id, name, sort_order)
select distinct pc.id, pc.company_id, pc.name, pc.sort_order
from public.product_categories pc
inner join public.inventory_items ii on ii.category_id = pc.id
on conflict do nothing;

alter table public.inventory_items
  drop constraint if exists inventory_items_category_id_fkey;

alter table public.inventory_items
  add constraint inventory_items_category_id_fkey
  foreign key (category_id) references public.inventory_categories(id) on delete set null;

alter table public.transactions
  add column if not exists invoice_pdf_path text;

-- Backfill invoice path from sync_metadata
update public.transactions t
set invoice_pdf_path = t.sync_metadata->>'invoicePdfPath'
where t.invoice_pdf_path is null
  and t.sync_metadata ? 'invoicePdfPath'
  and (t.sync_metadata->>'invoicePdfPath') is not null
  and (t.sync_metadata->>'invoicePdfPath') <> '';

alter table public.inventory_categories enable row level security;

create policy "tenant read inventory categories" on public.inventory_categories
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage inventory categories" on public.inventory_categories
  for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));
