import type { SupabaseClient } from "@supabase/supabase-js";

export type DocumentChannel = "print" | "pdf" | "email" | "whatsapp";

export async function logTransactionDocument(
  supabase: SupabaseClient,
  params: {
    companyId: string;
    transactionId: string;
    channel: DocumentChannel;
    status: string;
    recipient?: string | null;
    customerId?: string | null;
    metadata?: Record<string, unknown>;
    errorMessage?: string | null;
    sentBy?: string | null;
  }
): Promise<void> {
  const { error } = await supabase.from("transaction_document_logs").insert({
    company_id: params.companyId,
    transaction_id: params.transactionId,
    customer_id: params.customerId ?? null,
    channel: params.channel,
    status: params.status,
    recipient: params.recipient ?? null,
    metadata: params.metadata ?? {},
    error_message: params.errorMessage ?? null,
    sent_by: params.sentBy ?? null,
  });
  if (error) {
    console.error("transaction_document_logs insert failed:", error.message);
  }
}
