import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  logTransactionDocument,
  type DocumentChannel,
} from "@/lib/invoices/log-transaction-document";

type Body = {
  transactionId?: string;
  channel?: DocumentChannel;
  status?: string;
  recipient?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
};

const CHANNELS: DocumentChannel[] = ["print", "pdf", "email", "whatsapp"];

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json().catch(() => ({}))) as Body;

    if (!body.transactionId || !body.channel || !body.status) {
      return NextResponse.json(
        { ok: false, message: "transactionId, channel, and status are required." },
        { status: 400 }
      );
    }

    if (!CHANNELS.includes(body.channel)) {
      return NextResponse.json({ ok: false, message: "Invalid channel." }, { status: 400 });
    }

    const supabase = await createClient();
    await logTransactionDocument(supabase, {
      companyId: session.companyId,
      transactionId: body.transactionId,
      channel: body.channel,
      status: body.status,
      recipient: body.recipient,
      customerId: body.customerId,
      metadata: body.metadata,
      sentBy: session.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to log document event";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
