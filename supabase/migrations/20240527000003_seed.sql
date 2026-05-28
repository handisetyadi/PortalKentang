-- Seed permissions and demo company (run after auth users exist in production)
insert into public.permissions (key, description) values
  ('pos.session.open', 'Open POS session'),
  ('pos.session.close', 'Close POS session'),
  ('pos.transaction.create', 'Create transactions'),
  ('pos.receipt.print', 'Print receipts'),
  ('inventory.item.read', 'View inventory'),
  ('inventory.item.manage', 'Manage inventory'),
  ('customer.read', 'View customers'),
  ('customer.manage', 'Manage customers'),
  ('dashboard.company.view', 'Company dashboard'),
  ('finance.view', 'Finance reports'),
  ('settings.company.manage', 'Company settings')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
select 'company_admin', key from public.permissions
on conflict do nothing;
