import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "@/lib/data/types";
import { loyaltyToJson, receiptToJson } from "./company-settings";
import { throwIfError } from "./base";

export async function persistAppData(
  supabase: SupabaseClient,
  companyId: string,
  data: AppData
): Promise<void> {
  await supabase
    .from("companies")
    .update({ name: data.company.name, accent_color: data.company.accentColor })
    .eq("id", companyId);

  // Inventory rows must exist before products that reference inventory_item_id.
  for (const item of data.inventoryItems) {
    const { error } = await supabase.from("inventory_items").upsert({
      id: item.id,
      company_id: companyId,
      category_id: item.categoryId ?? null,
      type: item.type,
      sku: item.sku,
      barcode: item.barcode ?? null,
      name: item.name,
      base_unit: item.baseUnit,
      track_stock: item.trackStock,
      track_expiry: item.trackExpiry,
      fifo_costing: item.fifoCosting,
      reorder_point: item.reorderPoint ?? null,
      is_active: item.isActive,
    });
    throwIfError(error);
  }

  for (const p of data.products) {
    const { error } = await supabase.from("products").upsert({
      id: p.id,
      company_id: companyId,
      category_id: p.categoryId || null,
      inventory_item_id: p.inventoryItemId ?? null,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? null,
      description: p.description ?? null,
      price: p.price,
      tax_rate: p.taxRate,
      is_recipe_based: p.isRecipeBased,
      is_active: p.isActive,
    });
    throwIfError(error);
  }

  if (data.receiptSettings || data.loyaltySettings) {
    const { error } = await supabase.from("company_settings").upsert({
      company_id: companyId,
      receipt: receiptToJson(data.receiptSettings),
      loyalty: loyaltyToJson(data.loyaltySettings ?? { rupiahPerPoint: 1000 }),
    } as Record<string, unknown>);
    throwIfError(error);
  }

  for (const recipe of data.recipes) {
    const { error } = await supabase.from("recipes").upsert({
      id: recipe.id,
      company_id: companyId,
      product_id: recipe.productId || null,
      product_variant_id: recipe.productVariantId ?? null,
      name: recipe.name,
      version: recipe.version,
      output_quantity: recipe.outputQuantity,
      output_unit: recipe.outputUnit,
      yield_factor: recipe.yieldFactor,
      is_active: recipe.isActive,
    });
    throwIfError(error);
  }

  for (const item of data.recipeItems) {
    const { error } = await supabase.from("recipe_items").upsert({
      id: item.id,
      company_id: companyId,
      recipe_id: item.recipeId,
      inventory_item_id: item.inventoryItemId,
      modifier_id: item.modifierId ?? null,
      quantity: item.quantity,
      unit: item.unit,
      conversion_to_base_factor: item.conversionToBaseFactor,
      is_optional: item.isOptional,
      substitute_inventory_item_id: item.substituteInventoryItemId ?? null,
      substitute_quantity: item.substituteQuantity ?? null,
      substitute_unit: item.substituteUnit ?? null,
    });
    throwIfError(error);
  }

  for (const bp of data.recipeByproducts) {
    const semiFinishedId = bp.semiFinishedInventoryItemId;
    const rawMaterialId = bp.rawMaterialInventoryItemId;
    const primaryId = semiFinishedId ?? rawMaterialId;
    if (!primaryId) continue;

    const { error } = await supabase.from("recipe_byproducts").upsert({
      id: bp.id,
      company_id: companyId,
      recipe_id: bp.recipeId,
      inventory_item_id: primaryId,
      alternate_inventory_item_id:
        semiFinishedId && rawMaterialId ? rawMaterialId : null,
      quantity: bp.quantity,
      unit: bp.unit,
      conversion_to_base_factor: 1,
      expiry_days: bp.expiryDays,
      cost_allocation_percent: bp.costAllocationPercent,
    });
    throwIfError(error);
  }

  for (const c of data.customers) {
    const { error } = await supabase.from("customers").upsert({
      id: c.id,
      company_id: companyId,
      name: c.name,
      phone: c.phone || null,
      email: c.email ?? null,
      tags: c.tags,
      whatsapp_opt_in: c.whatsappOptIn,
      email_opt_in: c.emailOptIn,
      member_points_balance: c.memberPointsBalance,
      total_spend: c.totalSpend,
      last_transaction_at: c.lastTransactionAt ?? null,
    } as Record<string, unknown>);
    throwIfError(error);
  }

  for (const rule of data.loyaltyRules ?? []) {
    const { error } = await supabase.from("loyalty_redemption_rules").upsert({
      id: rule.id,
      company_id: companyId,
      points_required: rule.pointsRequired,
      redeem_type: rule.redeemType,
      product_id: rule.productId ?? null,
      is_active: rule.isActive,
    } as Record<string, unknown>);
    throwIfError(error);
  }

  const keptVoucherIds = new Set((data.vouchers ?? []).map((v) => v.id));
  const { data: remoteVouchers, error: remoteVouchersErr } = await supabase
    .from("vouchers")
    .select("id")
    .eq("company_id", companyId);
  throwIfError(remoteVouchersErr);
  for (const row of remoteVouchers ?? []) {
    if (!keptVoucherIds.has(row.id)) {
      const { error } = await supabase
        .from("vouchers")
        .delete()
        .eq("id", row.id)
        .eq("company_id", companyId);
      throwIfError(error);
    }
  }

  for (const voucher of data.vouchers ?? []) {
    const { error } = await supabase.from("vouchers").upsert({
      id: voucher.id,
      company_id: companyId,
      code: voucher.code,
      discount_type: voucher.discountType,
      discount_value: voucher.discountValue,
      min_spend: voucher.minSpend,
      valid_from: voucher.validFrom,
      valid_until: voucher.validUntil,
      max_redemptions: voucher.maxRedemptions ?? null,
      redemption_count: voucher.redemptionCount,
      is_active: voucher.isActive,
    } as Record<string, unknown>);
    throwIfError(error);
  }

  for (const layer of data.fifoLayers) {
    const { error } = await supabase.from("fifo_cost_layers").upsert({
      id: layer.id,
      company_id: companyId,
      outlet_id: layer.outletId || null,
      warehouse_id: layer.warehouseId || null,
      inventory_item_id: layer.inventoryItemId,
      batch_code: layer.batchCode ?? null,
      quantity_received: layer.quantityReceived,
      quantity_remaining: layer.quantityRemaining,
      unit_cost: layer.unitCost,
      received_at: layer.receivedAt,
      expires_at: layer.expiresAt ?? null,
    });
    throwIfError(error);
  }

  // Append-only: RLS allows INSERT only (no UPDATE policy); skip existing rows.
  if (data.stockLedger.length > 0) {
    const { error } = await supabase.from("stock_ledger").upsert(
      data.stockLedger.map((entry) => ({
        id: entry.id,
        company_id: companyId,
        outlet_id: entry.outletId || null,
        warehouse_id: entry.warehouseId || null,
        inventory_item_id: entry.inventoryItemId,
        movement_type: entry.movementType,
        quantity_delta: entry.quantityDelta,
        unit: entry.unit,
        fifo_cost_layer_id: entry.fifoCostLayerId ?? null,
        unit_cost: entry.unitCost ?? null,
        total_cost: entry.totalCost ?? null,
        batch_code: entry.batchCode ?? null,
        expires_at: entry.expiresAt ?? null,
        source_type: entry.sourceType,
        source_id: entry.sourceId ?? null,
        notes: entry.notes ?? null,
        created_at: entry.createdAt,
      })),
      { onConflict: "id", ignoreDuplicates: true }
    );
    throwIfError(error);
  }

  for (const session of data.posSessions) {
    const { error } = await supabase.from("pos_sessions").upsert({
      id: session.id,
      company_id: companyId,
      outlet_id: session.outletId,
      register_id: session.registerId || null,
      opened_by: session.openedBy,
      opening_cash: session.openingCash,
      closing_cash: session.closingCash ?? null,
      status: session.status,
      opened_at: session.openedAt,
      closed_at: session.closedAt ?? null,
    });
    throwIfError(error);
  }

  for (const txn of data.transactions) {
    const { error: txnErr } = await supabase.from("transactions").upsert({
      id: txn.id,
      company_id: companyId,
      outlet_id: txn.outletId,
      pos_session_id: txn.posSessionId || null,
      customer_id: txn.customerId ?? null,
      cashier_id: txn.cashierId,
      local_id: txn.localId ?? txn.id,
      receipt_number: txn.receiptNumber,
      status: txn.status,
      subtotal: txn.subtotal,
      discount_total: txn.discountTotal,
      tax_total: txn.taxTotal,
      total: txn.total,
      fifo_cogs_total: txn.fifoCogsTotal,
      sync_status: txn.syncStatus,
      cart_note: txn.cartNote ?? null,
      invoice_pdf_path: txn.invoicePdfPath ?? null,
      completed_at: txn.completedAt ?? null,
    });
    throwIfError(txnErr);

    for (const item of txn.items) {
      const { error: itemErr } = await supabase.from("transaction_items").upsert({
        id: item.id,
        company_id: companyId,
        transaction_id: txn.id,
        product_id: item.productId,
        product_name: item.productName,
        product_variant_id: item.productVariantId ?? null,
        variant_name: item.variantName ?? null,
        recipe_id: item.recipeId ?? null,
        recipe_version: item.recipeVersion ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_amount: item.discountAmount,
        tax_amount: item.taxAmount,
        line_total: item.lineTotal,
        fifo_cogs: item.fifoCogs,
        notes: item.notes ?? null,
      });
      throwIfError(itemErr);

      await supabase.from("transaction_item_modifiers").delete().eq("transaction_item_id", item.id);
      for (let i = 0; i < item.modifierIds.length; i++) {
        const mod = data.modifiers.find((m) => m.id === item.modifierIds[i]);
        const { error: modErr } = await supabase.from("transaction_item_modifiers").insert({
          company_id: companyId,
          transaction_item_id: item.id,
          modifier_id: item.modifierIds[i],
          modifier_name: item.modifierNames[i] ?? mod?.name ?? null,
          price_delta: mod?.priceDelta ?? 0,
        });
        throwIfError(modErr);
      }
    }

    for (const pay of txn.payments) {
      const { error: payErr } = await supabase.from("payments").upsert({
        id: pay.id,
        company_id: companyId,
        transaction_id: txn.id,
        method: pay.method,
        amount: pay.amount,
      });
      throwIfError(payErr);
    }
  }

  for (const approval of data.approvals) {
    const { error } = await supabase.from("approval_requests").upsert({
      id: approval.id,
      company_id: companyId,
      outlet_id: approval.outletId || null,
      request_type: approval.requestType,
      source_type: approval.sourceType,
      source_id: approval.sourceId,
      status: approval.status,
      reason: approval.reason ?? null,
      created_at: approval.createdAt,
    });
    throwIfError(error);
  }

  for (const sc of data.stockCounts) {
    const { error } = await supabase.from("stock_counts").upsert({
      id: sc.id,
      company_id: companyId,
      outlet_id: sc.outletId,
      warehouse_id: sc.warehouseId ?? null,
      pos_session_id: sc.posSessionId ?? null,
      status: sc.status,
      counted_by: null,
      submitted_at: sc.submittedAt ?? null,
      created_at: sc.createdAt,
    });
    throwIfError(error);

    for (const item of sc.items) {
      const { error: sciErr } = await supabase.from("stock_count_items").upsert({
        id: item.id,
        company_id: companyId,
        stock_count_id: sc.id,
        inventory_item_id: item.inventoryItemId,
        expected_quantity: item.expectedQuantity,
        counted_quantity: item.countedQuantity,
        reason: item.reason ?? null,
      });
      throwIfError(sciErr);
    }
  }
}
