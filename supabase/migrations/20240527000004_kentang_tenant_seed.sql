-- Kentang tenant seed (generated)
insert into public.companies (id, slug, code, name, accent_color)
values ('00000000-0000-4000-8000-000000000010', 'kentang', 'KENTANG', 'Kentang', 'teal')
on conflict (id) do nothing;

insert into public.brands (id, company_id, name, slug)
values ('00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000010', 'Kentang', 'kentang')
on conflict (id) do nothing;

insert into public.outlets (id, company_id, brand_id, name, code, timezone, address, is_active) values
  ('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000030', 'Kentang Cafe Sudirman', 'KTG-001', 'Asia/Jakarta', 'Jl. Sudirman No. 1', true),
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000030', 'Kentang Cafe Kemang', 'KTG-002', 'Asia/Jakarta', null, true)
on conflict (id) do nothing;

insert into public.warehouses (id, company_id, outlet_id, name, code, is_default) values
  ('00000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', 'Main Warehouse Sudirman', 'WH-001', true)
on conflict (id) do nothing;

insert into public.registers (id, company_id, outlet_id, name, device_id, is_active) values
  ('00000000-0000-4000-8000-000000000050', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', 'Register 1', 'POS-001', true),
  ('00adcf21-f8df-4db0-85d1-4a913d28cfc3', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', 'Register 2', null, true)
on conflict (id) do nothing;

insert into public.product_categories (id, company_id, name, sort_order) values
  ('f801683d-abfb-478e-a2e2-2d41fc1ef3f9', '00000000-0000-4000-8000-000000000010', 'Coffee', 1),
  ('3343df2a-64db-4eed-8e2d-e648a13802c1', '00000000-0000-4000-8000-000000000010', 'Food', 2),
  ('4badc80a-5220-45e7-84de-f405934d2f0d', '00000000-0000-4000-8000-000000000010', 'Retail', 3)
on conflict (id) do nothing;

insert into public.inventory_items (id, company_id, type, sku, barcode, name, base_unit, track_stock, track_expiry, fifo_costing, reorder_point, is_active) values
  ('90120ad6-ff03-4a46-bdf2-1e45b6aec034', '00000000-0000-4000-8000-000000000010', 'raw_material', 'RM-001', '899001', 'Coffee beans Arabica', 'g', true, false, true, 5000, true),
  ('f96212d8-90fb-479d-9a95-2339c3569c3a', '00000000-0000-4000-8000-000000000010', 'raw_material', 'RM-002', null, 'Fresh milk', 'ml', true, true, true, 10000, true),
  ('d96917c9-7afe-4ec3-ad99-a8726a230713', '00000000-0000-4000-8000-000000000010', 'raw_material', 'RM-003', null, 'Oat milk', 'ml', true, true, true, 5000, true),
  ('e883defa-f54e-4105-b66d-4f9cbb5cb816', '00000000-0000-4000-8000-000000000010', 'raw_material', 'RM-004', null, 'Potato fresh', 'g', true, true, true, 8000, true),
  ('06cdcdc7-64c6-4ec1-b059-fb436e9b0703', '00000000-0000-4000-8000-000000000010', 'semi_finished_good', 'SF-001', null, 'Croissant dough batch', 'pcs', true, true, true, 20, true),
  ('44dbfcd8-6eb9-4809-885f-632c3b61320c', '00000000-0000-4000-8000-000000000010', 'finished_good', 'FG-001', null, 'Croissant baked', 'pcs', true, true, true, null, true),
  ('06c40a7f-f43d-4e44-9eda-d7acb1897d08', '00000000-0000-4000-8000-000000000010', 'retail_good', 'RTL-001', null, 'Tumbler stock', 'pcs', true, false, true, 5, true),
  ('f3edd0c1-ae58-44b7-ab6d-fd1697963ead', '00000000-0000-4000-8000-000000000010', 'supply', 'SUP-001', null, 'Paper cup 8oz', 'pcs', true, false, true, 200, true),
  ('a8648667-6c09-4881-8f07-65086838562d', '00000000-0000-4000-8000-000000000010', 'service_non_stock', 'SVC-001', null, 'Delivery fee', 'order', false, false, false, null, true)
on conflict (id) do nothing;

insert into public.products (id, company_id, category_id, name, sku, barcode, description, price, tax_rate, is_recipe_based, is_active) values
  ('933fe097-0284-4bd2-830c-f991bd3b87e0', '00000000-0000-4000-8000-000000000010', 'f801683d-abfb-478e-a2e2-2d41fc1ef3f9', 'Espresso', 'BEV-001', '899001', 'Single shot', 18000, 0.11, true, true),
  ('0e5bb413-00cb-48b8-8b43-2ca8540730f9', '00000000-0000-4000-8000-000000000010', 'f801683d-abfb-478e-a2e2-2d41fc1ef3f9', 'Latte', 'BEV-002', '899002', null, 32000, 0.11, true, true),
  ('ff1d54bf-b229-46ea-9f8b-fab48b8bcf1a', '00000000-0000-4000-8000-000000000010', 'f801683d-abfb-478e-a2e2-2d41fc1ef3f9', 'Cappuccino', 'BEV-003', '899003', null, 30000, 0.11, true, true),
  ('9d945306-6b34-4260-9ecd-3960821a107b', '00000000-0000-4000-8000-000000000010', '3343df2a-64db-4eed-8e2d-e648a13802c1', 'Croissant', 'FD-001', '899101', null, 22000, 0.11, false, true),
  ('e2cb0454-e4c8-445d-abca-655f7ac1de88', '00000000-0000-4000-8000-000000000010', '3343df2a-64db-4eed-8e2d-e648a13802c1', 'Kentang Goreng', 'FD-002', '899102', null, 25000, 0.11, true, true),
  ('08f10eb6-bcc4-4a94-96ba-9bd74c7ef67d', '00000000-0000-4000-8000-000000000010', '4badc80a-5220-45e7-84de-f405934d2f0d', 'Tumbler Kentang', 'RTL-001', '899201', null, 89000, 0.11, false, true),
  ('cba96bd4-b36c-483e-8c53-87843df0e4dc', '00000000-0000-4000-8000-000000000010', 'f801683d-abfb-478e-a2e2-2d41fc1ef3f9', 'Americano', 'BEV-004', null, null, 20000, 0.11, true, true),
  ('bd33ca01-ad23-4f5b-a248-2fa2e6384e36', '00000000-0000-4000-8000-000000000010', '3343df2a-64db-4eed-8e2d-e648a13802c1', 'Sandwich Club', 'FD-003', null, null, 45000, 0.11, false, true)
on conflict (id) do nothing;

insert into public.product_variants (id, company_id, product_id, name, sku, price_delta, is_active) values
  ('42c9003a-c5d4-4a3b-96ff-b4814591a342', '00000000-0000-4000-8000-000000000010', '0e5bb413-00cb-48b8-8b43-2ca8540730f9', 'Large', 'BEV-002-L', 5000, true),
  ('eb10c556-89ec-4835-bf5b-5f873e22a4dc', '00000000-0000-4000-8000-000000000010', '0e5bb413-00cb-48b8-8b43-2ca8540730f9', 'Small', 'BEV-002-S', -3000, true)
on conflict (id) do nothing;

insert into public.modifier_groups (id, company_id, name, min_select, max_select) values
  ('b42441ad-13f2-416d-8878-8137ec880120', '00000000-0000-4000-8000-000000000010', 'Milk', 0, 1),
  ('d1b78180-5bba-4028-ad90-990a676c3ae3', '00000000-0000-4000-8000-000000000010', 'Extra shot', 0, 2)
on conflict (id) do nothing;

insert into public.modifiers (id, company_id, modifier_group_id, name, price_delta, is_active) values
  ('42f7b73b-f8f6-4341-90b0-d1985b8ec602', '00000000-0000-4000-8000-000000000010', 'b42441ad-13f2-416d-8878-8137ec880120', 'Oat milk', 5000, true),
  ('3f5e98c8-89c6-4b5f-a9df-683847053ddf', '00000000-0000-4000-8000-000000000010', 'b42441ad-13f2-416d-8878-8137ec880120', 'Almond milk', 6000, true),
  ('c1fb3ca7-c4f5-492b-a360-ee9908d3aa42', '00000000-0000-4000-8000-000000000010', 'd1b78180-5bba-4028-ad90-990a676c3ae3', 'Extra espresso', 8000, true)
on conflict (id) do nothing;

insert into public.product_modifier_groups (product_id, modifier_group_id) values
  ('0e5bb413-00cb-48b8-8b43-2ca8540730f9', 'b42441ad-13f2-416d-8878-8137ec880120'),
  ('ff1d54bf-b229-46ea-9f8b-fab48b8bcf1a', 'b42441ad-13f2-416d-8878-8137ec880120'),
  ('933fe097-0284-4bd2-830c-f991bd3b87e0', 'd1b78180-5bba-4028-ad90-990a676c3ae3'),
  ('0e5bb413-00cb-48b8-8b43-2ca8540730f9', 'd1b78180-5bba-4028-ad90-990a676c3ae3'),
  ('ff1d54bf-b229-46ea-9f8b-fab48b8bcf1a', 'd1b78180-5bba-4028-ad90-990a676c3ae3'),
  ('cba96bd4-b36c-483e-8c53-87843df0e4dc', 'd1b78180-5bba-4028-ad90-990a676c3ae3')
on conflict do nothing;

insert into public.recipes (id, company_id, product_id, name, version, output_quantity, output_unit, yield_factor, is_active) values
  ('5d6e4d73-a002-4450-8f3e-d281f288a670', '00000000-0000-4000-8000-000000000010', '933fe097-0284-4bd2-830c-f991bd3b87e0', 'Espresso', 1, 1, 'shot', 1, true),
  ('22f2017e-5ede-408e-bae1-6a648dddfbc6', '00000000-0000-4000-8000-000000000010', '0e5bb413-00cb-48b8-8b43-2ca8540730f9', 'Latte', 2, 1, 'cup', 1, true),
  ('9e81a073-46b8-4de8-bfad-d8e973f1350d', '00000000-0000-4000-8000-000000000010', 'e2cb0454-e4c8-445d-abca-655f7ac1de88', 'Kentang Goreng', 1, 1, 'portion', 0.95, true)
on conflict (id) do nothing;

insert into public.recipe_items (id, company_id, recipe_id, inventory_item_id, modifier_id, quantity, unit, conversion_to_base_factor, is_optional) values
  ('3baae0d5-8c22-4763-842d-128694941813', '00000000-0000-4000-8000-000000000010', '5d6e4d73-a002-4450-8f3e-d281f288a670', '90120ad6-ff03-4a46-bdf2-1e45b6aec034', null, 18, 'g', 1, false),
  ('4bf523d0-50e7-438a-86b4-a087b59a19a7', '00000000-0000-4000-8000-000000000010', '22f2017e-5ede-408e-bae1-6a648dddfbc6', '90120ad6-ff03-4a46-bdf2-1e45b6aec034', null, 18, 'g', 1, false),
  ('abeb5818-4007-4012-a70b-b0d1dde54718', '00000000-0000-4000-8000-000000000010', '22f2017e-5ede-408e-bae1-6a648dddfbc6', 'f96212d8-90fb-479d-9a95-2339c3569c3a', null, 200, 'ml', 1, false),
  ('68df702f-a35d-4f5c-8032-163c8084284c', '00000000-0000-4000-8000-000000000010', '22f2017e-5ede-408e-bae1-6a648dddfbc6', 'd96917c9-7afe-4ec3-ad99-a8726a230713', '42f7b73b-f8f6-4341-90b0-d1985b8ec602', 200, 'ml', 1, false),
  ('3ebf01fb-31e5-4073-aaf3-1a0e6d9b38b8', '00000000-0000-4000-8000-000000000010', '9e81a073-46b8-4de8-bfad-d8e973f1350d', 'e883defa-f54e-4105-b66d-4f9cbb5cb816', null, 150, 'g', 1, false)
on conflict (id) do nothing;

insert into public.fifo_cost_layers (id, company_id, outlet_id, warehouse_id, inventory_item_id, batch_code, quantity_received, quantity_remaining, unit_cost, received_at) values
  ('9cc9117f-0135-4d7d-bf47-45da5c6c331d', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000040', '90120ad6-ff03-4a46-bdf2-1e45b6aec034', 'BATCH-COFFEE-01', 10000, 7200, 0.12, now()),
  ('7db9fbd6-8477-4c79-87e6-b897ac804652', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000040', 'f96212d8-90fb-479d-9a95-2339c3569c3a', 'MILK-240527', 20000, 8500, 0.008, now()),
  ('18c4bccf-8613-48bc-9322-dd0f313167cf', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000040', 'e883defa-f54e-4105-b66d-4f9cbb5cb816', null, 15000, 12000, 0.015, now()),
  ('b2b8fc8e-79c0-452d-a230-66f9c84503fa', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000040', '06c40a7f-f43d-4e44-9eda-d7acb1897d08', null, 24, 18, 45000, now()),
  ('cbcba7d8-3d6c-4fb1-887e-c2d26817120b', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000040', '06cdcdc7-64c6-4ec1-b059-fb436e9b0703', 'DOUGH-240526', 30, 8, 3500, now())
on conflict (id) do nothing;

insert into public.customers (id, company_id, brand_id, name, phone, email, tags, whatsapp_opt_in, email_opt_in) values
  ('8d479b8c-495a-4dea-b47e-05115df698ab', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000030', 'Budi Santoso', '+6281234567890', 'budi@example.com', '{regular}', true, true),
  ('7c9f0e8f-c354-43ea-93e8-82ea69a91ed6', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000030', 'Siti Rahayu', '+6289876543210', 'siti@example.com', '{vip}', true, false),
  ('e6983bd1-5b89-4317-81a3-0b3ebea9ee0b', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000030', 'Walk-in Guest', '', null, '{}', false, false)
on conflict (id) do nothing;

insert into public.approval_requests (id, company_id, outlet_id, request_type, source_type, source_id, status, reason) values
  ('1048cdd0-06f0-4feb-85a1-1f97f9954321', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', 'void', 'transaction', 'a88a28a8-f5e6-40e7-a20f-74eb9b5031e4', 'pending', 'Customer changed mind — wrong drink'),
  ('57125b31-30b2-4dc3-a8b0-352ab25a9c61', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', 'refund', 'transaction', 'a88a28a8-f5e6-40e7-a20f-74eb9b5031e4', 'pending', 'Partial refund requested'),
  ('f56a59a6-8529-4db1-96ad-db9b5e498578', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020', 'stock_adjustment', 'inventory', 'f96212d8-90fb-479d-9a95-2339c3569c3a', 'pending', 'Spilled milk during prep')
on conflict (id) do nothing;

insert into public.receipt_settings (id, company_id, store_name, paper_width_mm, footer_text, tax_number, copy_count, auto_cut) values
  ('b284a900-fcd7-43f7-a021-5a791513f1c9', '00000000-0000-4000-8000-000000000010', 'Kentang Cafe', 80, 'Terima kasih! Sampai jumpa lagi.', '01.234.567.8-901.000', 1, true)
on conflict (id) do nothing;
