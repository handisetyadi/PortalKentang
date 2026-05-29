import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "@/lib/data/types";
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

  if (data.receiptSettings) {
    const { error } = await supabase.from("receipt_settings").upsert({
      company_id: companyId,
      store_name: data.receiptSettings.storeName,
      paper_width_mm: data.receiptSettings.paperWidthMm,
      footer_text: data.receiptSettings.footerText,
      tax_number: data.receiptSettings.taxNumber ?? null,
      copy_count: data.receiptSettings.copyCount,
      auto_cut: data.receiptSettings.autoCut,
    });
    throwIfError(error);
  }

  for (const recipe of data.recipes) {
    const { error } = await supabase.from("recipes").upsert({
      id: recipe.id,
      company_id: companyId,
      product_id: recipe.productId,
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
    });
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

  for (const entry of data.stockLedger) {
    const { error } = await supabase.from("stock_ledger").upsert({
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
    });
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
      completed_at: txn.completedAt ?? null,
    });
    throwIfError(txnErr);

    for (const item of txn.items) {
      const { error: itemErr } = await supabase.from("transaction_items").upsert({
        id: item.id,
        company_id: companyId,
        transaction_id: txn.id,
        product_id: item.productId,
        product_variant_id: item.productVariantId ?? null,
        recipe_id: item.recipeId ?? null,
        recipe_version: item.recipeVersion ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_amount: item.discountAmount,
        tax_amount: item.taxAmount,
        line_total: item.lineTotal,
        fifo_cogs: item.fifoCogs,
      });
      throwIfError(itemErr);

      await supabase.from("transaction_item_modifiers").delete().eq("transaction_item_id", item.id);
      for (let i = 0; i < item.modifierIds.length; i++) {
        const { error: modErr } = await supabase.from("transaction_item_modifiers").insert({
          company_id: companyId,
          transaction_item_id: item.id,
          modifier_id: item.modifierIds[i],
          price_delta: 0,
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
