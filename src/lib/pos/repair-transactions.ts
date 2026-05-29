import type { AppData, Transaction, TransactionItem } from "@/lib/data/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function repairEntityId(id: string, legacyPrefix: string): string {
  if (UUID_RE.test(id)) return id;
  if (id.startsWith(legacyPrefix)) {
    const stripped = id.slice(legacyPrefix.length);
    if (UUID_RE.test(stripped)) return stripped;
  }
  return crypto.randomUUID();
}

function repairItem(item: TransactionItem): TransactionItem {
  const id = repairEntityId(item.id, "ti-");
  return id === item.id ? item : { ...item, id };
}

function repairTransaction(txn: Transaction): Transaction {
  const subtotal = txn.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity - i.discountAmount,
    0
  );
  const taxTotal = txn.items.reduce((s, i) => s + i.taxAmount, 0);
  const total = subtotal + taxTotal;

  const items = txn.items.map(repairItem);
  const itemsChanged = items.some((item, i) => item !== txn.items[i]);

  const totalsOk =
    Math.abs(txn.subtotal - subtotal) < 0.01 &&
    Math.abs(txn.taxTotal - taxTotal) < 0.01 &&
    Math.abs(txn.total - total) < 0.01;

  if (totalsOk && !itemsChanged) return txn;

  return {
    ...txn,
    items,
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
