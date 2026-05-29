-- Invoice PDF storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated users can read invoices for their company (path: company_id/...)
create policy "invoice_select_company"
on storage.objects for select
to authenticated
using (
  bucket_id = 'invoices'
  and (storage.foldername(name))[1]::uuid in (
    select up.company_id from public.user_profiles up where up.id = auth.uid()
  )
);
