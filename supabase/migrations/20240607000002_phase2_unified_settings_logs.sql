-- Phase 2: company_settings + transaction_document_logs; deprecate fragmented tables

create type public.document_channel as enum ('print', 'pdf', 'email', 'whatsapp');

create table public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  receipt jsonb not null default '{}',
  printer jsonb not null default '{}',
  integrations jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.transaction_document_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel public.document_channel not null,
  status text not null,
  recipient text,
  metadata jsonb not null default '{}',
  error_message text,
  sent_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now()
);

create index transaction_document_logs_txn_idx
  on public.transaction_document_logs (transaction_id, created_at desc);

-- Migrate receipt_settings → company_settings.receipt
insert into public.company_settings (company_id, receipt, updated_at)
select
  rs.company_id,
  jsonb_strip_nulls(jsonb_build_object(
    'storeName', rs.store_name,
    'logoUrl', rs.logo_url,
    'paperWidthMm', rs.paper_width_mm,
    'footerText', coalesce(rs.footer_text, ''),
    'taxNumber', coalesce(rs.tax_number, ''),
    'copyCount', rs.copy_count,
    'autoCut', rs.auto_cut
  )),
  rs.updated_at
from public.receipt_settings rs
on conflict (company_id) do update
set receipt = excluded.receipt,
    updated_at = excluded.updated_at;

-- Migrate print_settings → company_settings.printer (per-outlet map)
update public.company_settings cs
set printer = coalesce(ps.outlets, '{}'::jsonb),
    updated_at = greatest(cs.updated_at, coalesce(ps.latest, cs.updated_at))
from (
  select
    company_id,
    jsonb_object_agg(
      coalesce(outlet_id::text, 'default'),
      jsonb_strip_nulls(jsonb_build_object(
        'printerName', printer_name,
        'escPosMode', esc_pos_mode,
        'useQzTray', use_qz_tray
      ))
    ) as outlets,
    max(updated_at) as latest
  from public.print_settings
  group by company_id
) ps
where cs.company_id = ps.company_id;

insert into public.company_settings (company_id, printer)
select ps.company_id, ps.outlets
from (
  select
    company_id,
    jsonb_object_agg(
      coalesce(outlet_id::text, 'default'),
      jsonb_strip_nulls(jsonb_build_object(
        'printerName', printer_name,
        'escPosMode', esc_pos_mode,
        'useQzTray', use_qz_tray
      ))
    ) as outlets
  from public.print_settings
  group by company_id
) ps
where not exists (
  select 1 from public.company_settings cs where cs.company_id = ps.company_id
);

-- Migrate integration_settings → company_settings.integrations
update public.company_settings cs
set integrations = coalesce(is_agg.integrations, '{}'::jsonb),
    updated_at = greatest(cs.updated_at, coalesce(is_agg.latest, cs.updated_at))
from (
  select
    company_id,
    jsonb_object_agg(
      provider,
      jsonb_build_object(
        'config', config,
        'isEnabled', is_enabled
      )
    ) as integrations,
    max(updated_at) as latest
  from public.integration_settings
  group by company_id
) is_agg
where cs.company_id = is_agg.company_id;

insert into public.company_settings (company_id, integrations)
select is_agg.company_id, is_agg.integrations
from (
  select
    company_id,
    jsonb_object_agg(
      provider,
      jsonb_build_object(
        'config', config,
        'isEnabled', is_enabled
      )
    ) as integrations
  from public.integration_settings
  group by company_id
) is_agg
where not exists (
  select 1 from public.company_settings cs where cs.company_id = is_agg.company_id
);

-- Backfill document logs
insert into public.transaction_document_logs (
  company_id, transaction_id, channel, status, recipient, metadata, error_message, sent_by, created_at
)
select
  rl.company_id,
  rl.transaction_id,
  case when rl.status = 'pdf_saved' then 'pdf'::public.document_channel else 'print'::public.document_channel end,
  rl.status,
  rl.printer_name,
  '{}'::jsonb,
  rl.error_message,
  rl.user_id,
  rl.created_at
from public.receipt_logs rl;

insert into public.transaction_document_logs (
  company_id, transaction_id, customer_id, channel, status, recipient, metadata, error_message, sent_by, created_at
)
select
  idl.company_id,
  idl.transaction_id,
  idl.customer_id,
  case idl.channel
    when 'email' then 'email'::public.document_channel
    else 'whatsapp'::public.document_channel
  end,
  idl.status::text,
  idl.recipient,
  jsonb_strip_nulls(jsonb_build_object('providerMessageId', idl.provider_message_id)),
  idl.error_message,
  idl.sent_by,
  idl.created_at
from public.invoice_delivery_logs idl;

-- Drop deprecated tables
drop table if exists public.receipt_logs;
drop table if exists public.invoice_delivery_logs;
drop table if exists public.receipt_settings;
drop table if exists public.print_settings;
drop table if exists public.integration_settings;

-- RLS on new tables
alter table public.company_settings enable row level security;
alter table public.transaction_document_logs enable row level security;

create policy "tenant read company settings" on public.company_settings
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage company settings" on public.company_settings
  for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('settings.company.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('settings.company.manage'));

create policy "tenant read document logs" on public.transaction_document_logs
  for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert document logs" on public.transaction_document_logs
  for insert to authenticated
  with check (company_id = public.current_company_id());

create trigger company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();
