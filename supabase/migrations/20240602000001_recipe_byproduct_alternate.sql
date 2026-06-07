-- Fallback raw material when semi-finished stock is used first in production.
alter table public.recipe_byproducts
  add column if not exists alternate_inventory_item_id uuid
  references public.inventory_items(id) on delete restrict;
