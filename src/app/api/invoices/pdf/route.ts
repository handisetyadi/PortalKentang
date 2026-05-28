import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("transactionId");
  return NextResponse.json({
    message: "PDF generation placeholder",
    transactionId: id,
    note: "Connect @react-pdf/renderer with transaction data when Supabase is live",
  });
}
