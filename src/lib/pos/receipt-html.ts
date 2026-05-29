import type { Transaction } from "@/lib/data/types";
import type { ReceiptSettings } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

function formatDt(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function paymentLabel(method: string) {
  const m = method.toLowerCase();
  if (m === "cash") return "Tunai";
  if (m === "card") return "Kartu";
  if (m === "qris") return "QRIS";
  return method;
}

export function formatReceiptHTML(txn: Transaction, settings: ReceiptSettings): string {
  const width = settings.paperWidthMm === 58 ? "58mm" : "80mm";
  const when = formatDt(txn.completedAt ?? txn.createdAt);

  const items = txn.items
    .map((i) => {
      const name = i.variantName ? `${i.productName} (${i.variantName})` : i.productName;
      return `<div class="item">
        <div>${name}</div>
        <div class="row"><span>${i.quantity} x ${formatCurrency(i.unitPrice)}</span><span>${formatCurrency(i.lineTotal)}</span></div>
      </div>`;
    })
    .join("");

  const payments = txn.payments
    .map(
      (p) =>
        `<div class="row"><span>${paymentLabel(p.method)}</span><span>${formatCurrency(p.amount)}</span></div>`
    )
    .join("");

  const discountRow =
    txn.discountTotal > 0
      ? `<div class="row"><span>Diskon</span><span>-${formatCurrency(txn.discountTotal)}</span></div>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Struk ${txn.receiptNumber}</title><style>
    @page{size:${width} auto;margin:3mm}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    html,body{margin:0;padding:0}
    body{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;max-width:${width};width:100%;padding:6px 8px;box-sizing:border-box;line-height:1.35}
    .center{text-align:center}.bold{font-weight:bold}
    .store{font-size:13px;font-weight:bold;margin-bottom:2px}
    .small{font-size:10px}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;gap:4px}
    .item{margin-bottom:6px}
    .total{font-weight:bold;font-size:12px}
  </style></head><body>
    <div class="center store">${settings.storeName}</div>
    ${settings.taxNumber ? `<div class="center small">NPWP: ${settings.taxNumber}</div>` : ""}
    <div class="center small bold">STRUK / INVOICE</div>
    <hr/>
    <div>No. ${txn.receiptNumber}</div>
    <div>${when}</div>
    <hr/>
    ${items}
    <hr/>
    <div class="row"><span>Subtotal</span><span>${formatCurrency(txn.subtotal)}</span></div>
    <div class="row"><span>Pajak</span><span>${formatCurrency(txn.taxTotal)}</span></div>
    ${discountRow}
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(txn.total)}</span></div>
    ${payments}
    <hr/>
    <div class="center small">${settings.footerText || "Terima kasih"}</div>
    ${txn.syncStatus !== "synced" ? '<div class="center small bold">PENDING SYNC</div>' : ""}
  </body></html>`;
}
