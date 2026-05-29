-- Allow POS users to record stock consumption when completing a sale.

drop policy if exists "tenant insert stock ledger" on public.stock_ledger;

create policy "tenant insert stock ledger" on public.stock_ledger for insert to authenticated
  with check (
    company_id = public.current_company_id()
    and (
      public.has_permission('inventory.item.manage')
      or public.has_permission('pos.transaction.create')
    )
  );
