-- Link non-recipe POS products to retail_good inventory items.

-- Croissant baked: reclassify as retail_good (was finished_good).
update public.inventory_items
set type = 'retail_good', updated_at = now()
where sku = 'FG-001'
  and company_id = '00000000-0000-4000-8000-000000000010';

-- Sandwich Club: new retail_good inventory item.
insert into public.inventory_items (
  id, company_id, type, sku, name, base_unit,
  track_stock, track_expiry, fifo_costing, reorder_point, is_active
) values (
  'f614e0f3-fdd8-4d8e-a017-c6b39f4b079b',
  '00000000-0000-4000-8000-000000000010',
  'retail_good',
  'FD-003',
  'Sandwich Club',
  'pcs',
  true, true, true, 10, true
)
on conflict (id) do update set
  type = excluded.type,
  sku = excluded.sku,
  name = excluded.name,
  track_stock = excluded.track_stock,
  updated_at = now();

-- Link products to inventory items.
update public.products
set inventory_item_id = '44dbfcd8-6eb9-4809-885f-632c3b61320c', updated_at = now()
where sku = 'FD-001'
  and company_id = '00000000-0000-4000-8000-000000000010';

update public.products
set inventory_item_id = '06c40a7f-f43d-4e44-9eda-d7acb1897d08', updated_at = now()
where sku = 'RTL-001'
  and company_id = '00000000-0000-4000-8000-000000000010';

update public.products
set inventory_item_id = 'f614e0f3-fdd8-4d8e-a017-c6b39f4b079b', updated_at = now()
where sku = 'FD-003'
  and company_id = '00000000-0000-4000-8000-000000000010';

-- Demo stock layers for Croissant baked and Sandwich Club.
insert into public.fifo_cost_layers (
  id, company_id, outlet_id, warehouse_id, inventory_item_id,
  batch_code, quantity_received, quantity_remaining, unit_cost, received_at, expires_at
) values
  (
    '720261eb-8987-4f0b-a120-67ffc5ea883a',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000020',
    '00000000-0000-4000-8000-000000000040',
    '44dbfcd8-6eb9-4809-885f-632c3b61320c',
    'CROISSANT-240601',
    40, 12, 8500, now(), now() + interval '2 days'
  ),
  (
    '7b89b443-1b3e-4d4c-a3f4-8bc8cd12590d',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000020',
    '00000000-0000-4000-8000-000000000040',
    'f614e0f3-fdd8-4d8e-a017-c6b39f4b079b',
    'SANDWICH-240601',
    20, 15, 22000, now(), now() + interval '1 day'
  )
on conflict (id) do nothing;
