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
    cart_note: transaction.cartNote ?? null,
    completed_at: transaction.completedAt ?? null,
    voucher_id: transaction.voucherId ?? null,
    voucher_code: transaction.voucherCode ?? null,
    voucher_discount: transaction.voucherDiscount,
    points_redeemed: transaction.pointsRedeemed,
    points_earned: transaction.pointsEarned,
    loyalty_rule_id: transaction.loyaltyRuleId ?? null,
    redeemed_product_id: transaction.redeemedProductId ?? null,
    redeemed_line_discount: transaction.redeemedLineDiscount,
  } as Record<string, unknown>);
  throwIfError(txnErr);

  for (const item of transaction.items) {
    const { error: itemErr } = await supabase.from("transaction_items").insert({
      id: item.id,
      company_id: companyId,
      transaction_id: transaction.id,
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
          member_points_balance: cust.memberPointsBalance,
          total_spend: cust.totalSpend,
          last_transaction_at: cust.lastTransactionAt ?? transaction.completedAt ?? null,
        } as Record<string, unknown>)
        .eq("id", cust.id)
        .eq("company_id", companyId);
      throwIfError(error);
    }
  }

  const ledgerForTxn = data.loyaltyPointLedger.filter(
    (e) => e.transactionId === transaction.id
  );
  for (const entry of ledgerForTxn) {
    const { error } = await supabase.from("loyalty_point_ledger").insert({
      id: entry.id,
      company_id: companyId,
      customer_id: entry.customerId,
      transaction_id: entry.transactionId ?? null,
      type: entry.type,
      points_delta: entry.pointsDelta,
      balance_after: entry.balanceAfter,
      metadata: entry.metadata ?? {},
      created_at: entry.createdAt,
    } as Record<string, unknown>);
    throwIfError(error);
  }

  const redemptionForTxn = data.voucherRedemptions.find(
    (vr) => vr.transactionId === transaction.id
  );
  if (redemptionForTxn) {
    const { error } = await supabase.from("voucher_redemptions").insert({
      id: redemptionForTxn.id,
      company_id: companyId,
      voucher_id: redemptionForTxn.voucherId,
      transaction_id: redemptionForTxn.transactionId,
      customer_id: redemptionForTxn.customerId ?? null,
      discount_applied: redemptionForTxn.discountApplied,
      redeemed_at: redemptionForTxn.redeemedAt,
    } as Record<string, unknown>);
    throwIfError(error);

    const voucher = data.vouchers.find((v) => v.id === redemptionForTxn.voucherId);
    if (voucher) {
      const { error: voucherErr } = await supabase
        .from("vouchers")
        .update({ redemption_count: voucher.redemptionCount })
        .eq("id", voucher.id)
        .eq("company_id", companyId);
      throwIfError(voucherErr);
    }
  }
}
