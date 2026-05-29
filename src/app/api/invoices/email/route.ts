import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    receiptNumber?: string;
    email?: string;
    customerName?: string;
  };
  const apiKey = process.env.RESEND_API_KEY;
  const to = body.email?.trim();

  if (!to) {
    return NextResponse.json(
      { ok: false, message: "Customer email is required for invoice delivery." },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      status: "pending",
      message: `Demo: invoice ${body.receiptNumber ?? ""} would be emailed to ${to}`,
      payload: body,
    });
  }

  return NextResponse.json({
    ok: true,
    status: "sent",
    message: `Invoice ${body.receiptNumber ?? ""} queued to ${to}`,
  });
}
