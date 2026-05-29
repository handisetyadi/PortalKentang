-- Additional RLS for tenant hydration and admin operations

alter table public.brands enable row level security;
alter table public.outlets enable row level security;
alter table public.warehouses enable row level security;
alter table public.registers enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.product_modifier_groups enable row level security;
alter table public.recipe_items enable row level security;
alter table public.recipe_byproducts enable row level security;
alter table public.fifo_cost_layers enable row level security;
alter table public.pos_sessions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.transaction_item_modifiers enable row level security;
alter table public.payments enable row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_count_items enable row level security;
alter table public.approval_requests enable row level security;
alter table public.receipt_settings enable row level security;
alter table public.held_orders enable row level security;

create policy "tenant read companies" on public.companies for select to authenticated
  using (id = public.current_company_id());

create policy "tenant read brands" on public.brands for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read outlets" on public.outlets for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read warehouses" on public.warehouses for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read registers" on public.registers for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read own profile" on public.user_profiles for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read roles" on public.user_roles for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read categories" on public.product_categories for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read variants" on public.product_variants for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read modifier groups" on public.modifier_groups for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read modifiers" on public.modifiers for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read product modifier groups" on public.product_modifier_groups for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.company_id = public.current_company_id()
    )
  );

create policy "tenant read recipes" on public.recipes for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read recipe items" on public.recipe_items for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read recipe byproducts" on public.recipe_byproducts for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant read inventory" on public.inventory_items for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage inventory" on public.inventory_items for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));

create policy "tenant read fifo layers" on public.fifo_cost_layers for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage fifo layers" on public.fifo_cost_layers for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));

create policy "tenant read stock ledger" on public.stock_ledger for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert stock ledger" on public.stock_ledger for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('inventory.item.manage'));

create policy "tenant read pos sessions" on public.pos_sessions for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage pos sessions" on public.pos_sessions for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read txn items" on public.transaction_items for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert txn items" on public.transaction_items for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant read txn modifiers" on public.transaction_item_modifiers for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert txn modifiers" on public.transaction_item_modifiers for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant read payments" on public.payments for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant insert payments" on public.payments for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "tenant read stock counts" on public.stock_counts for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage stock counts" on public.stock_counts for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read stock count items" on public.stock_count_items for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage stock count items" on public.stock_count_items for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read approvals" on public.approval_requests for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage approvals" on public.approval_requests for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy "tenant read receipt settings" on public.receipt_settings for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage receipt settings" on public.receipt_settings for all to authenticated
  using (company_id = public.current_company_id() and public.has_permission('settings.company.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('settings.company.manage'));

create policy "tenant read held orders" on public.held_orders for select to authenticated
  using (company_id = public.current_company_id());

create policy "tenant manage held orders" on public.held_orders for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Login lookup: resolve company + username before auth (anon)
create policy "anon lookup companies" on public.companies for select to anon
  using (true);

create policy "anon lookup profiles" on public.user_profiles for select to anon
  using (true);
