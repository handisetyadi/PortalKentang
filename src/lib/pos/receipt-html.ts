import type { Transaction } from "@/lib/data/types";
import type { ReceiptSettings } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

export function formatReceiptHTML(txn: Transaction, settings: ReceiptSettings): string {
  const width = settings.paperWidthMm === 58 ? "58mm" : "80mm";
  const items = txn.items
    .map(
      (i) =>
        `<tr><td>${i.productName} x${i.quantity}</td><td align="right">${formatCurrency(i.lineTotal)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:monospace;font-size:12px;width:${width};margin:0 auto;padding:8px}
    table{width:100%;border-collapse:collapse} td{padding:2px 0}
    .center{text-align:center}.bold{font-weight:bold}
  </style></head><body>
    <div class="center bold">${settings.storeName}</div>
    <div class="center">${settings.taxNumber}</div>
    <hr/>
    <div>${txn.receiptNumber}</div>
    <div>${new Date(txn.createdAt).toLocaleString("id-ID")}</div>
    <hr/>
    <table>${items}</table>
    <hr/>
    <table>
      <tr><td>Subtotal</td><td align="right">${formatCurrency(txn.subtotal)}</td></tr>
      <tr><td>Tax</td><td align="right">${formatCurrency(txn.taxTotal)}</td></tr>
      <tr class="bold"><td>TOTAL</td><td align="right">${formatCurrency(txn.total)}</td></tr>
    </table>
    <hr/>
    <div class="center">${settings.footerText}</div>
    ${txn.syncStatus !== "synced" ? '<div class="center">PENDING SYNC</div>' : ""}
  </body></html>`;
}
