-- Stock adjustment permission for company_owner and store_manager
insert into public.permissions (key, description) values
  ('inventory.stock.adjust', 'Manually adjust stock on hand')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key) values
  ('company_owner', 'inventory.stock.adjust'),
  ('store_manager', 'inventory.stock.adjust')
on conflict do nothing;

-- company_owner gets all permissions (replaces prior company_admin seed pattern)
insert into public.role_permissions (role, permission_key)
select 'company_owner', key from public.permissions
on conflict do nothing;
