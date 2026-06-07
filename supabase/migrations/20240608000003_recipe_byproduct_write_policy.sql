-- Recipe byproducts were read-only; inserts from recipe form were blocked by RLS.
create policy "tenant manage recipe byproducts" on public.recipe_byproducts for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));
