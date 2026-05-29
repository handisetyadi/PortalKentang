import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    receiptNumber?: string;
    phone?: string;
    customerName?: string;
  };
  const phone = body.phone?.trim();

  if (!phone) {
    return NextResponse.json(
      { ok: false, message: "Customer mobile number is required for WhatsApp delivery." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: "sent",
    message: `Invoice ${body.receiptNumber ?? ""} sent to ${phone} (demo)`,
    providerMessageId: `wa_demo_${Date.now()}`,
    payload: body,
  });
}
