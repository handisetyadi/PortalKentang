import type { AppData, Transaction, TransactionItem } from "@/lib/data/types";
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
}): { data: AppData; transaction: Transaction } {
  const { data, lines, payments, outletId, sessionId, cashierId } = params;

  const recipes = data.recipes;

  const items: TransactionItem[] = lines.map((line) => {
    const unitPrice = line.unitPrice + (line.modifierPriceTotal ?? 0);
    const lineBase = getLineBase(line);
    const taxAmount = getLineTax(line);
    const recipe = recipes.find((r) => r.productId === line.productId && r.isActive);

    return {
      id: `ti-${crypto.randomUUID()}`,
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
    nextData = result.data;
    item.fifoCogs = result.cogs;
    cogsTotal += result.cogs;
  }

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
    syncStatus: params.syncStatus ?? "synced",
    cartNote: params.cartNote,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  nextData = {
    ...nextData,
    transactions: [transaction, ...nextData.transactions],
  };

  if (params.customerId) {
    const cust = nextData.customers.find((c) => c.id === params.customerId);
    if (cust) {
      cust.totalSpend += total;
      cust.lastVisitAt = transaction.completedAt;
    }
  }

  return { data: nextData, transaction };
}
