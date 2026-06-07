alter table public.recipe_items
  add column if not exists substitute_quantity numeric(18,6),
  add column if not exists substitute_unit text;
