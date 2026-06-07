-- Semi-finished substitute for a recipe material line (consumed before raw material when in stock).
alter table public.recipe_items
  add column if not exists substitute_inventory_item_id uuid
  references public.inventory_items(id) on delete restrict;
