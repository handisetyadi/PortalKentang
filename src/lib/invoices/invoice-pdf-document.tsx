import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReceiptSettings, Transaction } from "@/lib/data/types";

const MM_TO_PT = 2.834645669;

function thermalPageSize(paperWidthMm: 58 | 80, lineCount: number): [number, number] {
  const width = paperWidthMm * MM_TO_PT;
  const height = Math.min(320 + lineCount * 28, 1400);
  return [width, height];
}

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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

function createStyles(paperWidthMm: 58 | 80) {
  const compact = paperWidthMm === 58;
  return StyleSheet.create({
    page: {
      paddingHorizontal: compact ? 6 : 8,
      paddingVertical: compact ? 8 : 10,
      fontSize: compact ? 7 : 8,
      fontFamily: "Courier",
      color: "#000",
    },
    center: { textAlign: "center" },
    bold: { fontFamily: "Courier-Bold", fontWeight: "bold" },
    storeName: {
      fontSize: compact ? 9 : 10,
      fontFamily: "Courier-Bold",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 2,
    },
    small: { fontSize: compact ? 6 : 7, textAlign: "center", marginBottom: 1 },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      borderStyle: "dashed",
      marginVertical: compact ? 4 : 6,
    },
    metaLine: { marginBottom: 2 },
    itemBlock: { marginBottom: compact ? 4 : 5 },
    itemName: { marginBottom: 1 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    grandTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 2,
      marginBottom: 2,
      fontFamily: "Courier-Bold",
      fontWeight: "bold",
      fontSize: compact ? 8 : 9,
    },
    footer: {
      textAlign: "center",
      marginTop: 4,
      fontSize: compact ? 6 : 7,
    },
    pending: {
      textAlign: "center",
      marginTop: 4,
      fontFamily: "Courier-Bold",
      fontSize: compact ? 6 : 7,
    },
  });
}

export type InvoicePdfProps = {
  transaction: Transaction;
  receiptSettings: ReceiptSettings;
  customerName?: string;
};

export function InvoicePdfDocument({
  transaction,
  receiptSettings,
  customerName,
}: InvoicePdfProps) {
  const styles = createStyles(receiptSettings.paperWidthMm);
  const lineCount =
    transaction.items.length * 2 +
    transaction.payments.length +
    12 +
    (customerName ? 1 : 0);
  const pageSize = thermalPageSize(receiptSettings.paperWidthMm, lineCount);
  const when = formatDt(transaction.completedAt ?? transaction.createdAt);

  return (
    <Document title={`Struk ${transaction.receiptNumber}`}>
      <Page size={pageSize} style={styles.page} wrap={false}>
        <Text style={styles.storeName}>{receiptSettings.storeName}</Text>
        {receiptSettings.taxNumber ? (
          <Text style={styles.small}>NPWP: {receiptSettings.taxNumber}</Text>
        ) : null}
        <Text style={[styles.small, styles.bold]}>STRUK / INVOICE</Text>

        <View style={styles.divider} />

        <Text style={styles.metaLine}>No. {transaction.receiptNumber}</Text>
        <Text style={styles.metaLine}>{when}</Text>
        {customerName ? (
          <Text style={styles.metaLine}>Pelanggan: {customerName}</Text>
        ) : null}

        <View style={styles.divider} />

        {transaction.items.map((item) => {
          const name = item.variantName
            ? `${item.productName} (${item.variantName})`
            : item.productName;
          const unit = item.unitPrice;
          return (
            <View key={item.id} style={styles.itemBlock}>
              <Text style={styles.itemName}>{name}</Text>
              <View style={styles.row}>
                <Text>
                  {item.quantity} x {formatIdr(unit)}
                </Text>
                <Text>{formatIdr(item.lineTotal)}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text>Subtotal</Text>
          <Text>{formatIdr(transaction.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Pajak</Text>
          <Text>{formatIdr(transaction.taxTotal)}</Text>
        </View>
        {transaction.discountTotal > 0 ? (
          <View style={styles.totalRow}>
            <Text>Diskon</Text>
            <Text>-{formatIdr(transaction.discountTotal)}</Text>
          </View>
        ) : null}

        <View style={styles.grandTotal}>
          <Text>TOTAL</Text>
          <Text>{formatIdr(transaction.total)}</Text>
        </View>

        {transaction.payments.map((p) => (
          <View key={p.id} style={styles.totalRow}>
            <Text>{paymentLabel(p.method)}</Text>
            <Text>{formatIdr(p.amount)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {receiptSettings.footerText ? (
          <Text style={styles.footer}>{receiptSettings.footerText}</Text>
        ) : (
          <Text style={styles.footer}>Terima kasih</Text>
        )}

        {transaction.syncStatus !== "synced" ? (
          <Text style={styles.pending}>PENDING SYNC</Text>
        ) : null}
      </Page>
    </Document>
  );
}
