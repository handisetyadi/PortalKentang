-- Allow authenticated users with inventory manage permission to create/update recipes.

create policy "tenant manage recipes" on public.recipes for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));

create policy "tenant manage recipe items" on public.recipe_items for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));
