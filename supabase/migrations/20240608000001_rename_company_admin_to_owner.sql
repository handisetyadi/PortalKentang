-- Rename company_admin role to company_owner
ALTER TYPE public.app_role RENAME VALUE 'company_admin' TO 'company_owner';
