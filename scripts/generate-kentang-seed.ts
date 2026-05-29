/**
 * Generates stable UUIDs and Kentang tenant seed SQL from mock-seed structure.
 * Run: npx tsx scripts/generate-kentang-seed.ts
 */
import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname ?? __dirname, "..");

function uuid(key: string): string {
  const hash = createHash("sha256").update(`kentang:${key}`).digest("hex");
  const variant = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${variant}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

const IDS = {
  company: "00000000-0000-4000-8000-000000000010",
  brand: "00000000-0000-4000-8000-000000000030",
  outlet1: "00000000-0000-4000-8000-000000000020",
  outlet2: "00000000-0000-4000-8000-000000000021",
  warehouse1: "00000000-0000-4000-8000-000000000040",
  register1: "00000000-0000-4000-8000-000000000050",
  register2: uuid("reg-2"),
  user: "00000000-0000-4000-8000-000000000001",
  catCoffee: uuid("c1"),
  catFood: uuid("c2"),
  catRetail: uuid("c3"),
  p1: uuid("p1"),
  p2: uuid("p2"),
  p3: uuid("p3"),
  p4: uuid("p4"),
  p5: uuid("p5"),
  p6: uuid("p6"),
  p7: uuid("p7"),
  p8: uuid("p8"),
  v1: uuid("v1"),
  v2: uuid("v2"),
  mg1: uuid("mg1"),
  mg2: uuid("mg2"),
  m1: uuid("m1"),
  m2: uuid("m2"),
  m3: uuid("m3"),
  i1: uuid("i1"),
  i2: uuid("i2"),
  i3: uuid("i3"),
  i4: uuid("i4"),
  i5: uuid("i5"),
  i6: uuid("i6"),
  i7: uuid("i7"),
  i8: uuid("i8"),
  i9: uuid("i9"),
  f1: uuid("f1"),
  f2: uuid("f2"),
  f3: uuid("f3"),
  f4: uuid("f4"),
  f5: uuid("f5"),
  r1: uuid("r1"),
  r2: uuid("r2"),
  r3: uuid("r3"),
  ri1: uuid("ri1"),
  ri2: uuid("ri2"),
  ri3: uuid("ri3"),
  ri4: uuid("ri4"),
  ri5: uuid("ri5"),
  cu1: uuid("cu1"),
  cu2: uuid("cu2"),
  cu3: uuid("cu3"),
  sessDemoOpen: uuid("sess-demo-open"),
  txn001: uuid("txn-001"),
  ti1: uuid("ti1"),
  pay1: uuid("pay1"),
  apr1: uuid("apr1"),
  apr2: uuid("apr2"),
  apr3: uuid("apr3"),
  receiptSettings: uuid("receipt-settings"),
};

function sql(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

const C = IDS.company;

const seedSql = `-- Kentang tenant seed (generated)
insert into public.companies (id, slug, code, name, accent_color)
values (${sql(IDS.company)}, 'kentang', 'KENTANG', 'Kentang', 'teal')
on conflict (id) do nothing;

insert into public.brands (id, company_id, name, slug)
values (${sql(IDS.brand)}, ${sql(C)}, 'Kentang', 'kentang')
on conflict (id) do nothing;

insert into public.outlets (id, company_id, brand_id, name, code, timezone, address, is_active) values
  (${sql(IDS.outlet1)}, ${sql(C)}, ${sql(IDS.brand)}, 'Kentang Cafe Sudirman', 'KTG-001', 'Asia/Jakarta', 'Jl. Sudirman No. 1', true),
  (${sql(IDS.outlet2)}, ${sql(C)}, ${sql(IDS.brand)}, 'Kentang Cafe Kemang', 'KTG-002', 'Asia/Jakarta', null, true)
on conflict (id) do nothing;

insert into public.warehouses (id, company_id, outlet_id, name, code, is_default) values
  (${sql(IDS.warehouse1)}, ${sql(C)}, ${sql(IDS.outlet1)}, 'Main Warehouse Sudirman', 'WH-001', true)
on conflict (id) do nothing;

insert into public.registers (id, company_id, outlet_id, name, device_id, is_active) values
  (${sql(IDS.register1)}, ${sql(C)}, ${sql(IDS.outlet1)}, 'Register 1', 'POS-001', true),
  (${sql(IDS.register2)}, ${sql(C)}, ${sql(IDS.outlet1)}, 'Register 2', null, true)
on conflict (id) do nothing;

insert into public.product_categories (id, company_id, name, sort_order) values
  (${sql(IDS.catCoffee)}, ${sql(C)}, 'Coffee', 1),
  (${sql(IDS.catFood)}, ${sql(C)}, 'Food', 2),
  (${sql(IDS.catRetail)}, ${sql(C)}, 'Retail', 3)
on conflict (id) do nothing;

insert into public.inventory_items (id, company_id, type, sku, barcode, name, base_unit, track_stock, track_expiry, fifo_costing, reorder_point, is_active) values
  (${sql(IDS.i1)}, ${sql(C)}, 'raw_material', 'RM-001', '899001', 'Coffee beans Arabica', 'g', true, false, true, 5000, true),
  (${sql(IDS.i2)}, ${sql(C)}, 'raw_material', 'RM-002', null, 'Fresh milk', 'ml', true, true, true, 10000, true),
  (${sql(IDS.i3)}, ${sql(C)}, 'raw_material', 'RM-003', null, 'Oat milk', 'ml', true, true, true, 5000, true),
  (${sql(IDS.i4)}, ${sql(C)}, 'raw_material', 'RM-004', null, 'Potato fresh', 'g', true, true, true, 8000, true),
  (${sql(IDS.i5)}, ${sql(C)}, 'semi_finished_good', 'SF-001', null, 'Croissant dough batch', 'pcs', true, true, true, 20, true),
  (${sql(IDS.i6)}, ${sql(C)}, 'finished_good', 'FG-001', null, 'Croissant baked', 'pcs', true, true, true, null, true),
  (${sql(IDS.i7)}, ${sql(C)}, 'retail_good', 'RTL-001', null, 'Tumbler stock', 'pcs', true, false, true, 5, true),
  (${sql(IDS.i8)}, ${sql(C)}, 'supply', 'SUP-001', null, 'Paper cup 8oz', 'pcs', true, false, true, 200, true),
  (${sql(IDS.i9)}, ${sql(C)}, 'service_non_stock', 'SVC-001', null, 'Delivery fee', 'order', false, false, false, null, true)
on conflict (id) do nothing;

insert into public.products (id, company_id, category_id, name, sku, barcode, description, price, tax_rate, is_recipe_based, is_active) values
  (${sql(IDS.p1)}, ${sql(C)}, ${sql(IDS.catCoffee)}, 'Espresso', 'BEV-001', '899001', 'Single shot', 18000, 0.11, true, true),
  (${sql(IDS.p2)}, ${sql(C)}, ${sql(IDS.catCoffee)}, 'Latte', 'BEV-002', '899002', null, 32000, 0.11, true, true),
  (${sql(IDS.p3)}, ${sql(C)}, ${sql(IDS.catCoffee)}, 'Cappuccino', 'BEV-003', '899003', null, 30000, 0.11, true, true),
  (${sql(IDS.p4)}, ${sql(C)}, ${sql(IDS.catFood)}, 'Croissant', 'FD-001', '899101', null, 22000, 0.11, false, true),
  (${sql(IDS.p5)}, ${sql(C)}, ${sql(IDS.catFood)}, 'Kentang Goreng', 'FD-002', '899102', null, 25000, 0.11, true, true),
  (${sql(IDS.p6)}, ${sql(C)}, ${sql(IDS.catRetail)}, 'Tumbler Kentang', 'RTL-001', '899201', null, 89000, 0.11, false, true),
  (${sql(IDS.p7)}, ${sql(C)}, ${sql(IDS.catCoffee)}, 'Americano', 'BEV-004', null, null, 20000, 0.11, true, true),
  (${sql(IDS.p8)}, ${sql(C)}, ${sql(IDS.catFood)}, 'Sandwich Club', 'FD-003', null, null, 45000, 0.11, false, true)
on conflict (id) do nothing;

insert into public.product_variants (id, company_id, product_id, name, sku, price_delta, is_active) values
  (${sql(IDS.v1)}, ${sql(C)}, ${sql(IDS.p2)}, 'Large', 'BEV-002-L', 5000, true),
  (${sql(IDS.v2)}, ${sql(C)}, ${sql(IDS.p2)}, 'Small', 'BEV-002-S', -3000, true)
on conflict (id) do nothing;

insert into public.modifier_groups (id, company_id, name, min_select, max_select) values
  (${sql(IDS.mg1)}, ${sql(C)}, 'Milk', 0, 1),
  (${sql(IDS.mg2)}, ${sql(C)}, 'Extra shot', 0, 2)
on conflict (id) do nothing;

insert into public.modifiers (id, company_id, modifier_group_id, name, price_delta, is_active) values
  (${sql(IDS.m1)}, ${sql(C)}, ${sql(IDS.mg1)}, 'Oat milk', 5000, true),
  (${sql(IDS.m2)}, ${sql(C)}, ${sql(IDS.mg1)}, 'Almond milk', 6000, true),
  (${sql(IDS.m3)}, ${sql(C)}, ${sql(IDS.mg2)}, 'Extra espresso', 8000, true)
on conflict (id) do nothing;

insert into public.product_modifier_groups (product_id, modifier_group_id) values
  (${sql(IDS.p2)}, ${sql(IDS.mg1)}),
  (${sql(IDS.p3)}, ${sql(IDS.mg1)}),
  (${sql(IDS.p1)}, ${sql(IDS.mg2)}),
  (${sql(IDS.p2)}, ${sql(IDS.mg2)}),
  (${sql(IDS.p3)}, ${sql(IDS.mg2)}),
  (${sql(IDS.p7)}, ${sql(IDS.mg2)})
on conflict do nothing;

insert into public.recipes (id, company_id, product_id, name, version, output_quantity, output_unit, yield_factor, is_active) values
  (${sql(IDS.r1)}, ${sql(C)}, ${sql(IDS.p1)}, 'Espresso shot', 1, 1, 'shot', 1, true),
  (${sql(IDS.r2)}, ${sql(C)}, ${sql(IDS.p2)}, 'Latte', 2, 1, 'cup', 1, true),
  (${sql(IDS.r3)}, ${sql(C)}, ${sql(IDS.p5)}, 'Kentang goreng portion', 1, 1, 'portion', 0.95, true)
on conflict (id) do nothing;

insert into public.recipe_items (id, company_id, recipe_id, inventory_item_id, modifier_id, quantity, unit, conversion_to_base_factor, is_optional) values
  (${sql(IDS.ri1)}, ${sql(C)}, ${sql(IDS.r1)}, ${sql(IDS.i1)}, null, 18, 'g', 1, false),
  (${sql(IDS.ri2)}, ${sql(C)}, ${sql(IDS.r2)}, ${sql(IDS.i1)}, null, 18, 'g', 1, false),
  (${sql(IDS.ri3)}, ${sql(C)}, ${sql(IDS.r2)}, ${sql(IDS.i2)}, null, 200, 'ml', 1, false),
  (${sql(IDS.ri4)}, ${sql(C)}, ${sql(IDS.r2)}, ${sql(IDS.i3)}, ${sql(IDS.m1)}, 200, 'ml', 1, false),
  (${sql(IDS.ri5)}, ${sql(C)}, ${sql(IDS.r3)}, ${sql(IDS.i4)}, null, 150, 'g', 1, false)
on conflict (id) do nothing;

insert into public.fifo_cost_layers (id, company_id, outlet_id, warehouse_id, inventory_item_id, batch_code, quantity_received, quantity_remaining, unit_cost, received_at) values
  (${sql(IDS.f1)}, ${sql(C)}, ${sql(IDS.outlet1)}, ${sql(IDS.warehouse1)}, ${sql(IDS.i1)}, 'BATCH-COFFEE-01', 10000, 7200, 0.12, now()),
  (${sql(IDS.f2)}, ${sql(C)}, ${sql(IDS.outlet1)}, ${sql(IDS.warehouse1)}, ${sql(IDS.i2)}, 'MILK-240527', 20000, 8500, 0.008, now()),
  (${sql(IDS.f3)}, ${sql(C)}, ${sql(IDS.outlet1)}, ${sql(IDS.warehouse1)}, ${sql(IDS.i4)}, null, 15000, 12000, 0.015, now()),
  (${sql(IDS.f4)}, ${sql(C)}, ${sql(IDS.outlet1)}, ${sql(IDS.warehouse1)}, ${sql(IDS.i7)}, null, 24, 18, 45000, now()),
  (${sql(IDS.f5)}, ${sql(C)}, ${sql(IDS.outlet1)}, ${sql(IDS.warehouse1)}, ${sql(IDS.i5)}, 'DOUGH-240526', 30, 8, 3500, now())
on conflict (id) do nothing;

insert into public.customers (id, company_id, brand_id, name, phone, email, tags, whatsapp_opt_in, email_opt_in) values
  (${sql(IDS.cu1)}, ${sql(C)}, ${sql(IDS.brand)}, 'Budi Santoso', '+6281234567890', 'budi@example.com', '{regular}', true, true),
  (${sql(IDS.cu2)}, ${sql(C)}, ${sql(IDS.brand)}, 'Siti Rahayu', '+6289876543210', 'siti@example.com', '{vip}', true, false),
  (${sql(IDS.cu3)}, ${sql(C)}, ${sql(IDS.brand)}, 'Walk-in Guest', '', null, '{}', false, false)
on conflict (id) do nothing;

insert into public.approval_requests (id, company_id, outlet_id, request_type, source_type, source_id, status, reason) values
  (${sql(IDS.apr1)}, ${sql(C)}, ${sql(IDS.outlet1)}, 'void', 'transaction', ${sql(IDS.txn001)}, 'pending', 'Customer changed mind — wrong drink'),
  (${sql(IDS.apr2)}, ${sql(C)}, ${sql(IDS.outlet1)}, 'refund', 'transaction', ${sql(IDS.txn001)}, 'pending', 'Partial refund requested'),
  (${sql(IDS.apr3)}, ${sql(C)}, ${sql(IDS.outlet1)}, 'stock_adjustment', 'inventory', ${sql(IDS.i2)}, 'pending', 'Spilled milk during prep')
on conflict (id) do nothing;

insert into public.receipt_settings (id, company_id, store_name, paper_width_mm, footer_text, tax_number, copy_count, auto_cut) values
  (${sql(IDS.receiptSettings)}, ${sql(C)}, 'Kentang Cafe', 80, 'Terima kasih! Sampai jumpa lagi.', '01.234.567.8-901.000', 1, true)
on conflict (id) do nothing;
`;

const idsTs = `/** Stable UUIDs for Kentang tenant — generated by scripts/generate-kentang-seed.ts */
export const IDS = ${JSON.stringify(IDS, null, 2)} as const;

export type EntityId = (typeof IDS)[keyof typeof IDS];

/** Map legacy mock string ids to stable UUIDs */
export const LEGACY_ID_MAP: Record<string, string> = {
  c1: IDS.catCoffee,
  c2: IDS.catFood,
  c3: IDS.catRetail,
  p1: IDS.p1,
  p2: IDS.p2,
  p3: IDS.p3,
  p4: IDS.p4,
  p5: IDS.p5,
  p6: IDS.p6,
  p7: IDS.p7,
  p8: IDS.p8,
  v1: IDS.v1,
  v2: IDS.v2,
  mg1: IDS.mg1,
  mg2: IDS.mg2,
  m1: IDS.m1,
  m2: IDS.m2,
  m3: IDS.m3,
  i1: IDS.i1,
  i2: IDS.i2,
  i3: IDS.i3,
  i4: IDS.i4,
  i5: IDS.i5,
  i6: IDS.i6,
  i7: IDS.i7,
  i8: IDS.i8,
  i9: IDS.i9,
  f1: IDS.f1,
  f2: IDS.f2,
  f3: IDS.f3,
  f4: IDS.f4,
  f5: IDS.f5,
  r1: IDS.r1,
  r2: IDS.r2,
  r3: IDS.r3,
  ri1: IDS.ri1,
  ri2: IDS.ri2,
  ri3: IDS.ri3,
  ri4: IDS.ri4,
  ri5: IDS.ri5,
  cu1: IDS.cu1,
  cu2: IDS.cu2,
  cu3: IDS.cu3,
  "sess-demo-open": IDS.sessDemoOpen,
  "txn-001": IDS.txn001,
  ti1: IDS.ti1,
  pay1: IDS.pay1,
  apr1: IDS.apr1,
  apr2: IDS.apr2,
  apr3: IDS.apr3,
  "reg-2": IDS.register2,
};

export function resolveId(id: string): string {
  return LEGACY_ID_MAP[id] ?? id;
}
`;

writeFileSync(join(ROOT, "supabase/migrations/20240527000004_kentang_tenant_seed.sql"), seedSql);
writeFileSync(join(ROOT, "src/lib/data/ids.ts"), idsTs);
console.log("Wrote seed SQL and ids.ts");
