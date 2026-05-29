-- Remove waste_factor from recipes (no longer used by the app).

alter table public.recipes drop column if exists waste_factor;
