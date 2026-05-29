import { renderToBuffer } from "@react-pdf/renderer";
import {
  InvoicePdfDocument,
  type InvoicePdfProps,
} from "./invoice-pdf-document";

export async function renderInvoicePdfBuffer(props: InvoicePdfProps): Promise<Buffer> {
  const element = <InvoicePdfDocument {...props} />;
  const buf = await renderToBuffer(element);
  return Buffer.from(buf);
}
