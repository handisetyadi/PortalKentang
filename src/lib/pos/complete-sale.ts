import type {
  AppData,
  LoyaltyPointLedgerEntry,
  Transaction,
  TransactionItem,
  VoucherRedemption,
} from "@/lib/data/types";
import type { CartLine, PaymentLine } from "@/types/domain";
import { consumeStockForSale } from "@/lib/inventory/fifo";
import { IDS } from "@/lib/data/ids";
import { getLineBase, getLineTax } from "@/lib/pos/pricing";

function nextReceiptNumber(data: AppData, outletId: string): string {
  const outlet = data.outlets.find((o) => o.id === outletId);
  const code = outlet?.code ?? "OUT";
  const count = data.transactions.filter((t) => t.outletId === outletId).length + 1;
  return `${code}-${String(count).padStart(4, "0")}`;
}

export interface SalePromotion {
  loyaltyRuleId?: string;
  redeemedProductId?: string;
  pointsRedeemed: number;
  redeemedLineDiscount: number;
  voucherId?: string;
  voucherCode?: string;
  voucherDiscount: number;
  pointsEarned: number;
}

export function completeSale(params: {
  data: AppData;
  outletId: string;
  sessionId: string;
  cashierId: string;
  lines: CartLine[];
  payments: PaymentLine[];
  customerId?: string;
  cartNote?: string;
  localId?: string;
  syncStatus?: Transaction["syncStatus"];
  promotion?: SalePromotion;
}): { data: AppData; transaction: Transaction } {
  const { data, lines, payments, outletId, sessionId, cashierId, promotion } = params;
  const promo = promotion ?? {
    pointsRedeemed: 0,
    redeemedLineDiscount: 0,
    voucherDiscount: 0,
    pointsEarned: 0,
  };

  const recipes = data.recipes;

  const items: TransactionItem[] = lines.map((line) => {
    const unitPrice = line.unitPrice + (line.modifierPriceTotal ?? 0);
    const lineBase = getLineBase(line);
    const taxAmount = getLineTax(line);
    const recipe = recipes.find((r) => r.productId === line.productId && r.isActive);

    return {
      id: crypto.randomUUID(),
      productId: line.productId,
      productName: line.productName,
      productVariantId: line.variantId,
      variantName: line.variantName,
      modifierIds: line.modifierIds,
      modifierNames: line.modifierNames,
      recipeId: recipe?.id ?? line.recipeId,
      recipeVersion: recipe?.version ?? line.recipeVersion,
      quantity: line.quantity,
      unitPrice,
      discountAmount: line.discountAmount,
      taxAmount,
      lineTotal: lineBase + taxAmount,
      fifoCogs: 0,
      notes: line.notes,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity - i.discountAmount, 0);
  const taxTotal = items.reduce((s, i) => s + i.taxAmount, 0);
  const total = subtotal + taxTotal;

  const paymentSum = payments.reduce((s, p) => s + p.amount, 0);
  const normalizedPayments =
    Math.abs(paymentSum - total) > 0.01
      ? [{ method: payments[0]?.method ?? "cash", amount: total }]
      : payments;

  let nextData = { ...data };
  let cogsTotal = 0;

  for (const item of items) {
    const result = consumeStockForSale(nextData, {
      outletId,
      warehouseId: IDS.warehouse1,
      productId: item.productId,
      variantId: item.productVariantId,
      modifierIds: item.modifierIds,
      quantity: item.quantity,
      transactionItemId: item.id,
    });
    if (result.shortfall) {
      const inv = data.inventoryItems.find((i) => i.id === result.shortfall!.inventoryItemId);
      throw new Error(
        `Stok tidak cukup untuk ${item.productName}${inv ? ` (${inv.name})` : ""}.`
      );
    }
    nextData = result.data;
    item.fifoCogs = result.cogs;
    cogsTotal += result.cogs;
  }

  const completedAt = new Date().toISOString();

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    localId: params.localId,
    outletId,
    posSessionId: sessionId,
    customerId: params.customerId,
    cashierId,
    receiptNumber: nextReceiptNumber(data, outletId),
    status: "completed",
    items,
    payments: normalizedPayments.map((p) => ({ ...p, id: crypto.randomUUID() })),
    subtotal,
    discountTotal: lines.reduce((s, l) => s + l.discountAmount, 0),
    taxTotal,
    total,
    fifoCogsTotal: cogsTotal,
    voucherId: promo.voucherId,
    voucherCode: promo.voucherCode,
    voucherDiscount: promo.voucherDiscount,
    pointsRedeemed: promo.pointsRedeemed,
    pointsEarned: promo.pointsEarned,
    loyaltyRuleId: promo.loyaltyRuleId,
    redeemedProductId: promo.redeemedProductId,
    redeemedLineDiscount: promo.redeemedLineDiscount,
    syncStatus: params.syncStatus ?? "synced",
    cartNote: params.cartNote,
    createdAt: completedAt,
    completedAt,
  };

  nextData = {
    ...nextData,
    transactions: [transaction, ...nextData.transactions],
  };

  if (params.customerId) {
    const custIdx = nextData.customers.findIndex((c) => c.id === params.customerId);
    if (custIdx >= 0) {
      const cust = { ...nextData.customers[custIdx] };
      cust.memberPointsBalance = Math.max(
        0,
        cust.memberPointsBalance - promo.pointsRedeemed + promo.pointsEarned
      );
      cust.totalSpend += total;
      cust.lastTransactionAt = completedAt;
      cust.lastVisitAt = completedAt;
      nextData.customers = nextData.customers.map((c, i) => (i === custIdx ? cust : c));

      const ledgerEntries: LoyaltyPointLedgerEntry[] = [];
      if (promo.pointsRedeemed > 0) {
        ledgerEntries.push({
          id: crypto.randomUUID(),
          customerId: cust.id,
          transactionId: transaction.id,
          type: "redeem",
          pointsDelta: -promo.pointsRedeemed,
          balanceAfter: cust.memberPointsBalance - promo.pointsEarned,
          createdAt: completedAt,
        });
      }
      if (promo.pointsEarned > 0) {
        ledgerEntries.push({
          id: crypto.randomUUID(),
          customerId: cust.id,
          transactionId: transaction.id,
          type: "earn",
          pointsDelta: promo.pointsEarned,
          balanceAfter: cust.memberPointsBalance,
          createdAt: completedAt,
        });
      }
      if (ledgerEntries.length > 0) {
        nextData.loyaltyPointLedger = [...ledgerEntries, ...nextData.loyaltyPointLedger];
      }
    }
  }

  if (promo.voucherId && promo.voucherDiscount > 0) {
    const voucherRedemption: VoucherRedemption = {
      id: crypto.randomUUID(),
      voucherId: promo.voucherId,
      transactionId: transaction.id,
      customerId: params.customerId,
      discountApplied: promo.voucherDiscount,
      redeemedAt: completedAt,
    };
    nextData.voucherRedemptions = [voucherRedemption, ...nextData.voucherRedemptions];
    nextData.vouchers = nextData.vouchers.map((v) =>
      v.id === promo.voucherId
        ? { ...v, redemptionCount: v.redemptionCount + 1 }
        : v
    );
  }

  return { data: nextData, transaction };
}
