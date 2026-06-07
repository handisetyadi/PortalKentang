import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "@/lib/data/types";
import type { AccentColor } from "@/types/domain";
import { parseReceiptSettings } from "./company-settings";
import { throwIfError } from "./base";

export async function hydrateAppData(
  supabase: SupabaseClient,
  companyId: string
): Promise<AppData> {
  const [
    companyRes,
    outletsRes,
    registersRes,
    categoriesRes,
    productsRes,
    variantsRes,
    modifierGroupsRes,
    modifiersRes,
    pmgRes,
    inventoryRes,
    fifoRes,
    recipesRes,
    recipeItemsRes,
    recipeByproductsRes,
    customersRes,
    sessionsRes,
    transactionsRes,
    approvalsRes,
    companySettingsRes,
    inventoryCategoriesRes,
    stockLedgerRes,
    stockCountsRes,
    heldRes,
  ] = await Promise.all([
    supabase.from("companies").select("name, slug, accent_color").eq("id", companyId).single(),
    supabase.from("outlets").select("*").eq("company_id", companyId),
    supabase.from("registers").select("*").eq("company_id", companyId),
    supabase.from("product_categories").select("*").eq("company_id", companyId).order("sort_order"),
    supabase.from("products").select("*").eq("company_id", companyId),
    supabase.from("product_variants").select("*").eq("company_id", companyId),
    supabase.from("modifier_groups").select("*").eq("company_id", companyId),
    supabase.from("modifiers").select("*").eq("company_id", companyId),
    supabase.from("product_modifier_groups").select("product_id, modifier_group_id"),
    supabase.from("inventory_items").select("*").eq("company_id", companyId),
    supabase.from("fifo_cost_layers").select("*").eq("company_id", companyId),
    supabase.from("recipes").select("*").eq("company_id", companyId),
    supabase.from("recipe_items").select("*").eq("company_id", companyId),
    supabase.from("recipe_byproducts").select("*").eq("company_id", companyId),
    supabase.from("customers").select("*").eq("company_id", companyId),
    supabase.from("pos_sessions").select("*").eq("company_id", companyId),
    supabase.from("transactions").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("approval_requests").select("*").eq("company_id", companyId),
    supabase.from("company_settings").select("receipt, printer, integrations").eq("company_id", companyId).maybeSingle(),
    supabase.from("inventory_categories").select("*").eq("company_id", companyId).order("sort_order"),
    supabase.from("stock_ledger").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(500),
    supabase.from("stock_counts").select("*").eq("company_id", companyId),
    supabase.from("held_orders").select("*").eq("company_id", companyId),
  ]);

  throwIfError(companyRes.error);
  throwIfError(outletsRes.error);
  throwIfError(registersRes.error);
  throwIfError(categoriesRes.error);
  throwIfError(productsRes.error);
  throwIfError(variantsRes.error);
  throwIfError(modifierGroupsRes.error);
  throwIfError(modifiersRes.error);
  throwIfError(pmgRes.error);
  throwIfError(inventoryRes.error);
  throwIfError(fifoRes.error);
  throwIfError(recipesRes.error);
  throwIfError(recipeItemsRes.error);
  throwIfError(customersRes.error);
  throwIfError(sessionsRes.error);
  throwIfError(transactionsRes.error);
  throwIfError(approvalsRes.error);
  throwIfError(stockLedgerRes.error);
  throwIfError(stockCountsRes.error);
  throwIfError(heldRes.error);

  const txnIds = (transactionsRes.data ?? []).map((t) => t.id);
  const [itemsRes, paymentsRes] = await Promise.all([
    txnIds.length
      ? supabase.from("transaction_items").select("*").in("transaction_id", txnIds)
      : Promise.resolve({ data: [], error: null }),
    txnIds.length
      ? supabase.from("payments").select("*").in("transaction_id", txnIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwIfError(itemsRes.error);
  throwIfError(paymentsRes.error);

  const itemIds = (itemsRes.data ?? []).map((i) => i.id);
  const modRes = itemIds.length
    ? await supabase.from("transaction_item_modifiers").select("*").in("transaction_item_id", itemIds)
    : { data: [], error: null };
  throwIfError(modRes.error);

  const pmgByGroup = new Map<string, string[]>();
  for (const row of pmgRes.data ?? []) {
    const list = pmgByGroup.get(row.modifier_group_id) ?? [];
    list.push(row.product_id);
    pmgByGroup.set(row.modifier_group_id, list);
  }

  const itemsByTxn = new Map<string, typeof itemsRes.data>();
  for (const item of itemsRes.data ?? []) {
    const list = itemsByTxn.get(item.transaction_id) ?? [];
    list.push(item);
    itemsByTxn.set(item.transaction_id, list);
  }

  const modsByItem = new Map<string, typeof modRes.data>();
  for (const m of modRes.data ?? []) {
    const list = modsByItem.get(m.transaction_item_id) ?? [];
    list.push(m);
    modsByItem.set(m.transaction_item_id, list);
  }

  const paymentsByTxn = new Map<string, typeof paymentsRes.data>();
  for (const p of paymentsRes.data ?? []) {
    const list = paymentsByTxn.get(p.transaction_id) ?? [];
    list.push(p);
    paymentsByTxn.set(p.transaction_id, list);
  }

  const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variantsRes.data ?? []).map((v) => [v.id, v]));
  const modifierMap = new Map((modifiersRes.data ?? []).map((m) => [m.id, m]));

  return {
    company: {
      name: companyRes.data!.name,
      slug: companyRes.data!.slug,
      accentColor: (companyRes.data!.accent_color ?? "teal") as AccentColor,
    },
    outlets: (outletsRes.data ?? []).map((o) => ({
      id: o.id,
      companyId: o.company_id,
      brandId: o.brand_id ?? "",
      name: o.name,
      code: o.code,
      timezone: o.timezone,
      address: o.address ?? undefined,
      isActive: o.is_active,
    })),
    registers: (registersRes.data ?? []).map((r) => ({
      id: r.id,
      outletId: r.outlet_id,
      name: r.name,
      deviceId: r.device_id ?? undefined,
      isActive: r.is_active,
    })),
    categories: (categoriesRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
    })),
    inventoryCategories: (inventoryCategoriesRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
    })),
    products: (productsRes.data ?? []).map((p) => ({
      id: p.id,
      categoryId: p.category_id ?? "",
      inventoryItemId: p.inventory_item_id ?? undefined,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? undefined,
      description: p.description ?? undefined,
      price: Number(p.price),
      taxRate: Number(p.tax_rate),
      isRecipeBased: p.is_recipe_based,
      isActive: p.is_active,
    })),
    variants: (variantsRes.data ?? []).map((v) => ({
      id: v.id,
      productId: v.product_id,
      name: v.name,
      sku: v.sku,
      priceDelta: Number(v.price_delta),
      isActive: v.is_active,
    })),
    modifierGroups: (modifierGroupsRes.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.min_select,
      maxSelect: g.max_select,
      productIds: pmgByGroup.get(g.id) ?? [],
    })),
    modifiers: (modifiersRes.data ?? []).map((m) => ({
      id: m.id,
      groupId: m.modifier_group_id,
      name: m.name,
      priceDelta: Number(m.price_delta),
      isActive: m.is_active,
    })),
    inventoryItems: (inventoryRes.data ?? []).map((i) => ({
      id: i.id,
      categoryId: i.category_id ?? undefined,
      type: i.type,
      sku: i.sku,
      barcode: i.barcode ?? undefined,
      name: i.name,
      baseUnit: i.base_unit,
      trackStock: i.track_stock,
      trackExpiry: i.track_expiry,
      fifoCosting: i.fifo_costing,
      reorderPoint: i.reorder_point != null ? Number(i.reorder_point) : undefined,
      isActive: i.is_active,
    })),
    fifoLayers: (fifoRes.data ?? []).map((f) => ({
      id: f.id,
      outletId: f.outlet_id ?? "",
      warehouseId: f.warehouse_id ?? "",
      inventoryItemId: f.inventory_item_id,
      batchCode: f.batch_code ?? undefined,
      quantityReceived: Number(f.quantity_received),
      quantityRemaining: Number(f.quantity_remaining),
      unitCost: Number(f.unit_cost),
      receivedAt: f.received_at,
      expiresAt: f.expires_at ?? undefined,
    })),
    stockLedger: (stockLedgerRes.data ?? []).map((s) => ({
      id: s.id,
      outletId: s.outlet_id ?? "",
      warehouseId: s.warehouse_id ?? "",
      inventoryItemId: s.inventory_item_id,
      movementType: s.movement_type,
      quantityDelta: Number(s.quantity_delta),
      unit: s.unit,
      fifoCostLayerId: s.fifo_cost_layer_id ?? undefined,
      unitCost: s.unit_cost != null ? Number(s.unit_cost) : undefined,
      totalCost: s.total_cost != null ? Number(s.total_cost) : undefined,
      batchCode: s.batch_code ?? undefined,
      expiresAt: s.expires_at ?? undefined,
      sourceType: s.source_type,
      sourceId: s.source_id ?? undefined,
      notes: s.notes ?? undefined,
      createdAt: s.created_at,
    })),
    recipes: (recipesRes.data ?? []).map((r) => ({
      id: r.id,
      productId: r.product_id ?? undefined,
      name: r.name,
      version: r.version,
      outputQuantity: Number(r.output_quantity),
      outputUnit: r.output_unit,
      yieldFactor: Number(r.yield_factor),
      isActive: r.is_active,
    })),
    recipeItems: (recipeItemsRes.data ?? []).map((ri) => ({
      id: ri.id,
      recipeId: ri.recipe_id,
      inventoryItemId: ri.inventory_item_id,
      substituteInventoryItemId: ri.substitute_inventory_item_id ?? undefined,
      substituteQuantity:
        ri.substitute_quantity != null ? Number(ri.substitute_quantity) : undefined,
      substituteUnit: ri.substitute_unit ?? undefined,
      modifierId: ri.modifier_id ?? undefined,
      quantity: Number(ri.quantity),
      unit: ri.unit,
      conversionToBaseFactor: Number(ri.conversion_to_base_factor),
      isOptional: ri.is_optional,
    })),
    recipeByproducts: (recipeByproductsRes.data ?? []).map((bp) => {
      const alternateId = bp.alternate_inventory_item_id;
      const primaryId = bp.inventory_item_id;
      if (alternateId) {
        return {
          id: bp.id,
          recipeId: bp.recipe_id,
          semiFinishedInventoryItemId: primaryId,
          rawMaterialInventoryItemId: alternateId,
          quantity: Number(bp.quantity),
          unit: bp.unit,
          expiryDays: bp.expiry_days,
          costAllocationPercent: Number(bp.cost_allocation_percent),
        };
      }
      return {
        id: bp.id,
        recipeId: bp.recipe_id,
        semiFinishedInventoryItemId: primaryId,
        quantity: Number(bp.quantity),
        unit: bp.unit,
        expiryDays: bp.expiry_days,
        costAllocationPercent: Number(bp.cost_allocation_percent),
      };
    }),
    customers: (customersRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? undefined,
      tags: c.tags ?? [],
      whatsappOptIn: c.whatsapp_opt_in,
      emailOptIn: c.email_opt_in,
      totalSpend: 0,
      lastVisitAt: c.updated_at,
    })),
    posSessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id,
      outletId: s.outlet_id,
      registerId: s.register_id ?? "",
      openedBy: s.opened_by,
      openingCash: Number(s.opening_cash),
      closingCash: s.closing_cash != null ? Number(s.closing_cash) : undefined,
      status: s.status as "open" | "closed",
      openedAt: s.opened_at,
      closedAt: s.closed_at ?? undefined,
    })),
    transactions: (transactionsRes.data ?? []).map((t) => {
      const items = (itemsByTxn.get(t.id) ?? []).map((item) => {
        const product = productMap.get(item.product_id);
        const variant = item.product_variant_id ? variantMap.get(item.product_variant_id) : undefined;
        const itemMods = modsByItem.get(item.id) ?? [];
        return {
          id: item.id,
          productId: item.product_id,
          productName: item.product_name ?? product?.name ?? "Product",
          productVariantId: item.product_variant_id ?? undefined,
          variantName: item.variant_name ?? variant?.name,
          modifierIds: itemMods.map((m) => m.modifier_id),
          modifierNames: itemMods.map(
            (m) => m.modifier_name ?? modifierMap.get(m.modifier_id)?.name ?? ""
          ),
          recipeId: item.recipe_id ?? undefined,
          recipeVersion: item.recipe_version ?? undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          discountAmount: Number(item.discount_amount),
          taxAmount: Number(item.tax_amount),
          lineTotal: Number(item.line_total),
          fifoCogs: Number(item.fifo_cogs),
          notes: item.notes ?? undefined,
        };
      });
      return {
        id: t.id,
        outletId: t.outlet_id,
        posSessionId: t.pos_session_id ?? "",
        customerId: t.customer_id ?? undefined,
        cashierId: t.cashier_id,
        receiptNumber: t.receipt_number,
        status: t.status,
        items,
        payments: (paymentsByTxn.get(t.id) ?? []).map((p) => ({
          id: p.id,
          method: p.method,
          amount: Number(p.amount),
        })),
        subtotal: Number(t.subtotal),
        discountTotal: Number(t.discount_total),
        taxTotal: Number(t.tax_total),
        total: Number(t.total),
        fifoCogsTotal: Number(t.fifo_cogs_total),
        syncStatus: t.sync_status as "synced" | "pending" | "failed",
        invoicePdfPath: t.invoice_pdf_path ?? undefined,
        cartNote: t.cart_note ?? undefined,
        createdAt: t.created_at,
        completedAt: t.completed_at ?? undefined,
      };
    }),
    stockCounts: (stockCountsRes.data ?? []).map((sc) => ({
      id: sc.id,
      outletId: sc.outlet_id,
      warehouseId: sc.warehouse_id ?? undefined,
      posSessionId: sc.pos_session_id ?? undefined,
      status: sc.status as "draft" | "submitted",
      countedBy: sc.counted_by ?? undefined,
      submittedAt: sc.submitted_at ?? undefined,
      createdAt: sc.created_at,
      items: [],
    })),
    heldOrders: (heldRes.data ?? []).map((h) => ({
      id: h.id,
      outletId: h.outlet_id,
      label: h.label ?? undefined,
      payload: h.payload as Record<string, unknown>,
      createdAt: h.created_at,
    })),
    approvals: (approvalsRes.data ?? []).map((a) => ({
      id: a.id,
      outletId: a.outlet_id ?? "",
      requestType: a.request_type as "void" | "refund" | "stock_adjustment",
      sourceType: a.source_type,
      sourceId: String(a.source_id),
      status: a.status,
      reason: a.reason ?? undefined,
      createdAt: a.created_at,
    })),
    receiptSettings: parseReceiptSettings(companySettingsRes.data, companyRes.data!.name),
  };
}
