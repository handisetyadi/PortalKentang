import type { AppData, Transaction } from "@/lib/data/types";

function repairTransaction(txn: Transaction): Transaction {
  const subtotal = txn.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity - i.discountAmount,
    0
  );
  const taxTotal = txn.items.reduce((s, i) => s + i.taxAmount, 0);
  const total = subtotal + taxTotal;

  if (
    Math.abs(txn.subtotal - subtotal) < 0.01 &&
    Math.abs(txn.taxTotal - taxTotal) < 0.01 &&
    Math.abs(txn.total - total) < 0.01
  ) {
    return txn;
  }

  return {
    ...txn,
    subtotal,
    taxTotal,
    total,
    payments: txn.payments.map((p, i) =>
      i === 0 ? { ...p, amount: total } : { ...p, amount: 0 }
    ),
  };
}

export function repairTransactions(data: AppData): AppData {
  const transactions = data.transactions.map(repairTransaction);
  const changed = transactions.some((t, i) => t !== data.transactions[i]);
  if (!changed) return data;
  return { ...data, transactions };
}
