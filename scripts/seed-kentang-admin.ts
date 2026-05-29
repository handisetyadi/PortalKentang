/**
 * Seeds Kentang tenant data + admin Supabase Auth user.
 * Run: npm run db:seed-admin
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { IDS } from "../src/lib/data/ids";

function loadEnv(): Record<string, string> {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USER_ID = IDS.user;
const ADMIN_EMAIL = "kentang@demo.portalkentang.local";
const ADMIN_PASSWORD = "Kentang";
const C = IDS.company;

async function upsertTenant() {
  await admin.from("companies").upsert({
    id: C,
    slug: "kentang",
    code: "KENTANG",
    name: "Kentang",
    accent_color: "teal",
  });

  await admin.from("brands").upsert({
    id: IDS.brand,
    company_id: C,
    name: "Kentang",
    slug: "kentang",
  });

  await admin.from("outlets").upsert([
    {
      id: IDS.outlet1,
      company_id: C,
      brand_id: IDS.brand,
      name: "Kentang Cafe Sudirman",
      code: "KTG-001",
      timezone: "Asia/Jakarta",
      address: "Jl. Sudirman No. 1",
      is_active: true,
    },
    {
      id: IDS.outlet2,
      company_id: C,
      brand_id: IDS.brand,
      name: "Kentang Cafe Kemang",
      code: "KTG-002",
      timezone: "Asia/Jakarta",
      is_active: true,
    },
  ]);

  await admin.from("warehouses").upsert({
    id: IDS.warehouse1,
    company_id: C,
    outlet_id: IDS.outlet1,
    name: "Main Warehouse Sudirman",
    code: "WH-001",
    is_default: true,
  });

  await admin.from("registers").upsert([
    {
      id: IDS.register1,
      company_id: C,
      outlet_id: IDS.outlet1,
      name: "Register 1",
      device_id: "POS-001",
      is_active: true,
    },
    {
      id: IDS.register2,
      company_id: C,
      outlet_id: IDS.outlet1,
      name: "Register 2",
      is_active: true,
    },
  ]);

  await admin.from("product_categories").upsert([
    { id: IDS.catCoffee, company_id: C, name: "Coffee", sort_order: 1 },
    { id: IDS.catFood, company_id: C, name: "Food", sort_order: 2 },
    { id: IDS.catRetail, company_id: C, name: "Retail", sort_order: 3 },
  ]);

  await admin.from("inventory_items").upsert([
    { id: IDS.i1, company_id: C, type: "raw_material", sku: "RM-001", barcode: "899001", name: "Coffee beans Arabica", base_unit: "g", track_stock: true, track_expiry: false, fifo_costing: true, reorder_point: 5000, is_active: true },
    { id: IDS.i2, company_id: C, type: "raw_material", sku: "RM-002", name: "Fresh milk", base_unit: "ml", track_stock: true, track_expiry: true, fifo_costing: true, reorder_point: 10000, is_active: true },
    { id: IDS.i3, company_id: C, type: "raw_material", sku: "RM-003", name: "Oat milk", base_unit: "ml", track_stock: true, track_expiry: true, fifo_costing: true, reorder_point: 5000, is_active: true },
    { id: IDS.i4, company_id: C, type: "raw_material", sku: "RM-004", name: "Potato fresh", base_unit: "g", track_stock: true, track_expiry: true, fifo_costing: true, reorder_point: 8000, is_active: true },
    { id: IDS.i5, company_id: C, type: "semi_finished_good", sku: "SF-001", name: "Croissant dough batch", base_unit: "pcs", track_stock: true, track_expiry: true, fifo_costing: true, reorder_point: 20, is_active: true },
    { id: IDS.i6, company_id: C, type: "finished_good", sku: "FG-001", name: "Croissant baked", base_unit: "pcs", track_stock: true, track_expiry: true, fifo_costing: true, is_active: true },
    { id: IDS.i7, company_id: C, type: "retail_good", sku: "RTL-001", name: "Tumbler stock", base_unit: "pcs", track_stock: true, track_expiry: false, fifo_costing: true, reorder_point: 5, is_active: true },
    { id: IDS.i8, company_id: C, type: "supply", sku: "SUP-001", name: "Paper cup 8oz", base_unit: "pcs", track_stock: true, track_expiry: false, fifo_costing: true, reorder_point: 200, is_active: true },
    { id: IDS.i9, company_id: C, type: "service_non_stock", sku: "SVC-001", name: "Delivery fee", base_unit: "order", track_stock: false, track_expiry: false, fifo_costing: false, is_active: true },
  ]);

  await admin.from("products").upsert([
    { id: IDS.p1, company_id: C, category_id: IDS.catCoffee, name: "Espresso", sku: "BEV-001", barcode: "899001", description: "Single shot", price: 18000, tax_rate: 0.11, is_recipe_based: true, is_active: true },
    { id: IDS.p2, company_id: C, category_id: IDS.catCoffee, name: "Latte", sku: "BEV-002", barcode: "899002", price: 32000, tax_rate: 0.11, is_recipe_based: true, is_active: true },
    { id: IDS.p3, company_id: C, category_id: IDS.catCoffee, name: "Cappuccino", sku: "BEV-003", barcode: "899003", price: 30000, tax_rate: 0.11, is_recipe_based: true, is_active: true },
    { id: IDS.p4, company_id: C, category_id: IDS.catFood, name: "Croissant", sku: "FD-001", barcode: "899101", price: 22000, tax_rate: 0.11, is_recipe_based: false, is_active: true },
    { id: IDS.p5, company_id: C, category_id: IDS.catFood, name: "Kentang Goreng", sku: "FD-002", barcode: "899102", price: 25000, tax_rate: 0.11, is_recipe_based: true, is_active: true },
    { id: IDS.p6, company_id: C, category_id: IDS.catRetail, name: "Tumbler Kentang", sku: "RTL-001", barcode: "899201", price: 89000, tax_rate: 0.11, is_recipe_based: false, is_active: true },
    { id: IDS.p7, company_id: C, category_id: IDS.catCoffee, name: "Americano", sku: "BEV-004", price: 20000, tax_rate: 0.11, is_recipe_based: true, is_active: true },
    { id: IDS.p8, company_id: C, category_id: IDS.catFood, name: "Sandwich Club", sku: "FD-003", price: 45000, tax_rate: 0.11, is_recipe_based: false, is_active: true },
  ]);

  await admin.from("product_variants").upsert([
    { id: IDS.v1, company_id: C, product_id: IDS.p2, name: "Large", sku: "BEV-002-L", price_delta: 5000, is_active: true },
    { id: IDS.v2, company_id: C, product_id: IDS.p2, name: "Small", sku: "BEV-002-S", price_delta: -3000, is_active: true },
  ]);

  await admin.from("modifier_groups").upsert([
    { id: IDS.mg1, company_id: C, name: "Milk", min_select: 0, max_select: 1 },
    { id: IDS.mg2, company_id: C, name: "Extra shot", min_select: 0, max_select: 2 },
  ]);

  await admin.from("modifiers").upsert([
    { id: IDS.m1, company_id: C, modifier_group_id: IDS.mg1, name: "Oat milk", price_delta: 5000, is_active: true },
    { id: IDS.m2, company_id: C, modifier_group_id: IDS.mg1, name: "Almond milk", price_delta: 6000, is_active: true },
    { id: IDS.m3, company_id: C, modifier_group_id: IDS.mg2, name: "Extra espresso", price_delta: 8000, is_active: true },
  ]);

  await admin.from("product_modifier_groups").upsert([
    { product_id: IDS.p2, modifier_group_id: IDS.mg1 },
    { product_id: IDS.p3, modifier_group_id: IDS.mg1 },
    { product_id: IDS.p1, modifier_group_id: IDS.mg2 },
    { product_id: IDS.p2, modifier_group_id: IDS.mg2 },
    { product_id: IDS.p3, modifier_group_id: IDS.mg2 },
    { product_id: IDS.p7, modifier_group_id: IDS.mg2 },
  ]);

  await admin.from("recipes").upsert([
    { id: IDS.r1, company_id: C, product_id: IDS.p1, name: "Espresso shot", version: 1, output_quantity: 1, output_unit: "shot", yield_factor: 1, is_active: true },
    { id: IDS.r2, company_id: C, product_id: IDS.p2, name: "Latte", version: 2, output_quantity: 1, output_unit: "cup", yield_factor: 1, is_active: true },
    { id: IDS.r3, company_id: C, product_id: IDS.p5, name: "Kentang goreng portion", version: 1, output_quantity: 1, output_unit: "portion", yield_factor: 0.95, is_active: true },
  ]);

  await admin.from("recipe_items").upsert([
    { id: IDS.ri1, company_id: C, recipe_id: IDS.r1, inventory_item_id: IDS.i1, quantity: 18, unit: "g", conversion_to_base_factor: 1, is_optional: false },
    { id: IDS.ri2, company_id: C, recipe_id: IDS.r2, inventory_item_id: IDS.i1, quantity: 18, unit: "g", conversion_to_base_factor: 1, is_optional: false },
    { id: IDS.ri3, company_id: C, recipe_id: IDS.r2, inventory_item_id: IDS.i2, quantity: 200, unit: "ml", conversion_to_base_factor: 1, is_optional: false },
    { id: IDS.ri4, company_id: C, recipe_id: IDS.r2, inventory_item_id: IDS.i3, modifier_id: IDS.m1, quantity: 200, unit: "ml", conversion_to_base_factor: 1, is_optional: false },
    { id: IDS.ri5, company_id: C, recipe_id: IDS.r3, inventory_item_id: IDS.i4, quantity: 150, unit: "g", conversion_to_base_factor: 1, is_optional: false },
  ]);

  const now = new Date().toISOString();
  await admin.from("fifo_cost_layers").upsert([
    { id: IDS.f1, company_id: C, outlet_id: IDS.outlet1, warehouse_id: IDS.warehouse1, inventory_item_id: IDS.i1, batch_code: "BATCH-COFFEE-01", quantity_received: 10000, quantity_remaining: 7200, unit_cost: 0.12, received_at: now },
    { id: IDS.f2, company_id: C, outlet_id: IDS.outlet1, warehouse_id: IDS.warehouse1, inventory_item_id: IDS.i2, batch_code: "MILK-240527", quantity_received: 20000, quantity_remaining: 8500, unit_cost: 0.008, received_at: now },
    { id: IDS.f3, company_id: C, outlet_id: IDS.outlet1, warehouse_id: IDS.warehouse1, inventory_item_id: IDS.i4, quantity_received: 15000, quantity_remaining: 12000, unit_cost: 0.015, received_at: now },
    { id: IDS.f4, company_id: C, outlet_id: IDS.outlet1, warehouse_id: IDS.warehouse1, inventory_item_id: IDS.i7, quantity_received: 24, quantity_remaining: 18, unit_cost: 45000, received_at: now },
    { id: IDS.f5, company_id: C, outlet_id: IDS.outlet1, warehouse_id: IDS.warehouse1, inventory_item_id: IDS.i5, batch_code: "DOUGH-240526", quantity_received: 30, quantity_remaining: 8, unit_cost: 3500, received_at: now },
  ]);

  await admin.from("customers").upsert([
    { id: IDS.cu1, company_id: C, brand_id: IDS.brand, name: "Budi Santoso", phone: "+6281234567890", email: "budi@example.com", tags: ["regular"], whatsapp_opt_in: true, email_opt_in: true },
    { id: IDS.cu2, company_id: C, brand_id: IDS.brand, name: "Siti Rahayu", phone: "+6289876543210", email: "siti@example.com", tags: ["vip"], whatsapp_opt_in: true, email_opt_in: false },
    { id: IDS.cu3, company_id: C, brand_id: IDS.brand, name: "Walk-in Guest", phone: "", tags: [], whatsapp_opt_in: false, email_opt_in: false },
  ]);

  await admin.from("approval_requests").upsert([
    { id: IDS.apr1, company_id: C, outlet_id: IDS.outlet1, request_type: "void", source_type: "transaction", source_id: IDS.txn001, status: "pending", reason: "Customer changed mind — wrong drink" },
    { id: IDS.apr2, company_id: C, outlet_id: IDS.outlet1, request_type: "refund", source_type: "transaction", source_id: IDS.txn001, status: "pending", reason: "Partial refund requested" },
    { id: IDS.apr3, company_id: C, outlet_id: IDS.outlet1, request_type: "stock_adjustment", source_type: "inventory", source_id: IDS.i2, status: "pending", reason: "Spilled milk during prep" },
  ]);

  await admin.from("receipt_settings").upsert({
    id: IDS.receiptSettings,
    company_id: C,
    store_name: "Kentang Cafe",
    paper_width_mm: 80,
    footer_text: "Terima kasih! Sampai jumpa lagi.",
    tax_number: "01.234.567.8-901.000",
    copy_count: 1,
    auto_cut: true,
  });
}

async function seedAdminUser() {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.id === USER_ID || u.email === ADMIN_EMAIL);

  if (!existing) {
    const { error } = await admin.auth.admin.createUser({
      id: USER_ID,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Kentang Superuser", username: "Kentang" },
    });
    if (error) throw error;
  } else {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
  }

  const userId = existing?.id ?? USER_ID;

  await admin.from("user_profiles").upsert({
    id: userId,
    company_id: C,
    default_outlet_id: IDS.outlet1,
    username: "Kentang",
    full_name: "Kentang Superuser",
    email: ADMIN_EMAIL,
    is_active: true,
  });

  const roles = [
    "cashier",
    "barista",
    "store_manager",
    "inventory_staff",
    "finance",
    "operations_manager",
    "commercial_analyst",
    "company_admin",
  ] as const;

  for (const role of roles) {
    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("outlet_id", IDS.outlet1)
      .eq("role", role)
      .maybeSingle();

    if (!existingRole) {
      await admin.from("user_roles").insert({
        company_id: C,
        user_id: userId,
        outlet_id: IDS.outlet1,
        role,
      });
    }
  }

  await admin.from("pos_sessions").upsert({
    id: IDS.sessDemoOpen,
    company_id: C,
    outlet_id: IDS.outlet1,
    register_id: IDS.register1,
    opened_by: userId,
    opening_cash: 500000,
    status: "open",
    opened_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  });

  await admin.from("transactions").upsert({
    id: IDS.txn001,
    company_id: C,
    outlet_id: IDS.outlet1,
    pos_session_id: IDS.sessDemoOpen,
    customer_id: IDS.cu1,
    cashier_id: userId,
    receipt_number: "KTG-001-0042",
    status: "completed",
    subtotal: 74000,
    discount_total: 0,
    tax_total: 8140,
    total: 74000,
    fifo_cogs_total: 12000,
    sync_status: "synced",
    completed_at: new Date(Date.now() - 3600000).toISOString(),
  });

  await admin.from("transaction_items").upsert({
    id: IDS.ti1,
    company_id: C,
    transaction_id: IDS.txn001,
    product_id: IDS.p2,
    product_variant_id: IDS.v1,
    recipe_id: IDS.r2,
    recipe_version: 2,
    quantity: 2,
    unit_price: 37000,
    discount_amount: 0,
    tax_amount: 8140,
    line_total: 74000,
    fifo_cogs: 12000,
  });

  await admin.from("transaction_item_modifiers").delete().eq("transaction_item_id", IDS.ti1);
  await admin.from("transaction_item_modifiers").insert({
    company_id: C,
    transaction_item_id: IDS.ti1,
    modifier_id: IDS.m1,
    price_delta: 5000,
  });

  await admin.from("payments").upsert({
    id: IDS.pay1,
    company_id: C,
    transaction_id: IDS.txn001,
    method: "qris",
    amount: 74000,
  });
}

async function main() {
  console.log("Seeding Kentang tenant...");
  await upsertTenant();
  console.log("Seeding admin user + POS sample...");
  await seedAdminUser();
  console.log("Done. Login: Company Kentang / Username Kentang / Password Kentang");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
