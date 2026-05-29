import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData, Transaction } from "@/lib/data/types";
import { throwIfError } from "./base";

/** Push a single completed sale and its stock impact to Supabase (insert-only). */
export async function persistSale(
  supabase: SupabaseClient,
  companyId: string,
  data: AppData,
  transaction: Transaction
): Promise<void> {
  const itemIds = new Set(transaction.items.map((i) => i.id));

  const { error: txnErr } = await supabase.from("transactions").insert({
    id: transaction.id,
    company_id: companyId,
    outlet_id: transaction.outletId,
    pos_session_id: transaction.posSessionId ?? null,
    customer_id: transaction.customerId ?? null,
    cashier_id: transaction.cashierId,
    local_id: transaction.localId ?? transaction.id,
    receipt_number: transaction.receiptNumber,
    status: transaction.status,
    subtotal: transaction.subtotal,
    discount_total: transaction.discountTotal,
    tax_total: transaction.taxTotal,
    total: transaction.total,
    fifo_cogs_total: transaction.fifoCogsTotal,
    sync_status: transaction.syncStatus,
    completed_at: transaction.completedAt ?? null,
  });
  throwIfError(txnErr);

  for (const item of transaction.items) {
    const { error: itemErr } = await supabase.from("transaction_items").insert({
      id: item.id,
      company_id: companyId,
      transaction_id: transaction.id,
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

  for (const pay of transaction.payments) {
    const { error: payErr } = await supabase.from("payments").insert({
      id: pay.id,
      company_id: companyId,
      transaction_id: transaction.id,
      method: pay.method,
      amount: pay.amount,
    });
    throwIfError(payErr);
  }

  const touchedLayerIds = new Set(
    data.stockLedger
      .filter((e) => e.sourceType === "transaction_item" && itemIds.has(e.sourceId ?? ""))
      .map((e) => e.fifoCostLayerId)
      .filter(Boolean) as string[]
  );

  for (const layer of data.fifoLayers.filter((l) => touchedLayerIds.has(l.id))) {
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

  const saleLedger = data.stockLedger.filter(
    (e) => e.sourceType === "transaction_item" && itemIds.has(e.sourceId ?? "")
  );

  for (const entry of saleLedger) {
    const { error } = await supabase.from("stock_ledger").insert({
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

  if (transaction.customerId) {
    const cust = data.customers.find((c) => c.id === transaction.customerId);
    if (cust) {
      const { error } = await supabase
        .from("customers")
        .update({
          name: cust.name,
          phone: cust.phone || null,
          email: cust.email ?? null,
          tags: cust.tags,
          whatsapp_opt_in: cust.whatsappOptIn,
          email_opt_in: cust.emailOptIn,
        })
        .eq("id", cust.id)
        .eq("company_id", companyId);
      throwIfError(error);
    }
  }
}
