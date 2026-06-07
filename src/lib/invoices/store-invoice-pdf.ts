import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "invoices";

export function invoiceStoragePath(
  companyId: string,
  transactionId: string,
  receiptNumber: string
): string {
  const safeReceipt = receiptNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${companyId}/${transactionId}/${safeReceipt}.pdf`;
}

export async function uploadInvoicePdf(
  companyId: string,
  transactionId: string,
  receiptNumber: string,
  pdf: Buffer
): Promise<{ path: string; error?: string }> {
  const service = createServiceClient();
  const path = invoiceStoragePath(companyId, transactionId, receiptNumber);

  const { error } = await service.storage.from(BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) {
    return { path, error: error.message };
  }

  await service
    .from("transactions")
    .update({ invoice_pdf_path: path })
    .eq("id", transactionId)
    .eq("company_id", companyId);

  return { path };
}

export async function getInvoicePdfSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
