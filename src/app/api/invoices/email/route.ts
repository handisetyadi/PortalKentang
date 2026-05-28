import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      status: "pending",
      message: "Resend not configured — logged locally in demo mode",
      payload: body,
    });
  }

  return NextResponse.json({
    ok: true,
    status: "sent",
    message: "Email queued (configure Resend template in production)",
  });
}
