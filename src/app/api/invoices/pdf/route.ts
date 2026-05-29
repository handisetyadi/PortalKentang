import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { renderInvoicePdfBuffer } from "@/lib/invoices/render-invoice-pdf";
import {
  getInvoicePdfSignedUrl,
  uploadInvoicePdf,
} from "@/lib/invoices/store-invoice-pdf";
import type { ReceiptSettings, Transaction } from "@/lib/data/types";

type PdfRequestBody = {
  transaction?: Transaction;
  receiptSettings?: ReceiptSettings;
  customerName?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json(
        { ok: false, message: "Not signed in to Supabase." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as PdfRequestBody;
    const transaction = body.transaction;
    const receiptSettings = body.receiptSettings;

    if (!transaction?.id || !transaction.receiptNumber || !receiptSettings) {
      return NextResponse.json(
        { ok: false, message: "transaction and receiptSettings are required." },
        { status: 400 }
      );
    }

    const pdf = await renderInvoicePdfBuffer({
      transaction,
      receiptSettings,
      customerName: body.customerName,
    });

    const { path, error: uploadError } = await uploadInvoicePdf(
      session.companyId,
      transaction.id,
      transaction.receiptNumber,
      pdf
    );

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Could not save PDF to storage: ${uploadError}. Ensure the "invoices" bucket exists.`,
        },
        { status: 500 }
      );
    }

    const pdfUrl = await getInvoicePdfSignedUrl(path);
    if (!pdfUrl) {
      return NextResponse.json(
        { ok: false, message: "PDF saved but could not create download link." },
        { status: 500 }
      );
    }

    const service = createServiceClient();
    await service.from("receipt_logs").insert({
      company_id: session.companyId,
      transaction_id: transaction.id,
      user_id: session.userId,
      status: "pdf_saved",
      error_message: null,
    });

    return NextResponse.json({
      ok: true,
      pdfUrl,
      storagePath: path,
      message: "Invoice PDF saved to Supabase.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const storagePath = searchParams.get("path");

    if (!storagePath && !transactionId) {
      return NextResponse.json(
        { ok: false, message: "transactionId or path is required." },
        { status: 400 }
      );
    }

    let path = storagePath;
    if (!path && transactionId) {
      const service = createServiceClient();
      const { data } = await service
        .from("transactions")
        .select("sync_metadata")
        .eq("id", transactionId)
        .eq("company_id", session.companyId)
        .maybeSingle();

      const meta = data?.sync_metadata as { invoicePdfPath?: string } | null;
      path = meta?.invoicePdfPath ?? null;
    }

    if (!path) {
      return NextResponse.json({ ok: false, message: "Invoice PDF not found." }, { status: 404 });
    }

    const pdfUrl = await getInvoicePdfSignedUrl(path);
    if (!pdfUrl) {
      return NextResponse.json({ ok: false, message: "Could not open PDF." }, { status: 500 });
    }

    return NextResponse.redirect(pdfUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load PDF";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
