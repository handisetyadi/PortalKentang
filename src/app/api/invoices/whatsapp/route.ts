import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    ok: true,
    status: "sent",
    message: "WhatsApp placeholder — manual send logged",
    providerMessageId: `wa_demo_${Date.now()}`,
    payload: body,
  });
}
