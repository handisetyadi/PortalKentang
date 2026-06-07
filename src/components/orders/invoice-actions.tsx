"use client";

import { useState } from "react";
import { Mail, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { PermissionGate } from "@/components/gates/PermissionGate";
import { getMemberInvoiceOptions } from "@/lib/customers/member-invoice-eligibility";
import {
  printInvoiceWithPdf,
  sendInvoiceEmail,
  shareInvoiceViaWhatsApp,
} from "@/lib/invoices/deliver-invoice";
import type { Customer, ReceiptSettings, Transaction } from "@/lib/data/types";
import { toast } from "@/hooks/use-toast";

export function InvoiceActions({
  transaction,
  customer,
  receiptSettings,
}: {
  transaction: Transaction;
  customer?: Customer;
  receiptSettings: ReceiptSettings;
}) {
  const { hasPermission } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const member = getMemberInvoiceOptions(customer);

  const payload = {
    transactionId: transaction.id,
    receiptNumber: transaction.receiptNumber,
    customerId: customer?.id,
    customerName: customer?.name,
    email: customer?.email,
    phone: customer?.phone,
  };

  const handlePrint = async () => {
    setBusy("print");
    try {
      const result = await printInvoiceWithPdf(transaction, receiptSettings, {
        customerName: customer?.name,
      });
      const thermalFailed = result.print && !result.print.ok;
      toast({
        title: result.ok ? (thermalFailed ? "PDF ready" : "Invoice ready") : "Print failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = async () => {
    if (!member.canEmail) return;
    setBusy("email");
    try {
      const result = await sendInvoiceEmail(payload);
      toast({
        title: result.ok ? "Invoice emailed" : "Email failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    } catch {
      toast({ variant: "destructive", title: "Email failed", description: "API unreachable." });
    } finally {
      setBusy(null);
    }
  };

  const handleWhatsApp = async () => {
    if (!member.canWhatsApp || !customer?.phone) return;
    setBusy("whatsapp");
    try {
      const result = await shareInvoiceViaWhatsApp({
        transaction,
        receiptSettings,
        phone: customer.phone,
        customerName: customer.name,
      });
      toast({
        title: result.ok ? "WhatsApp dibuka" : "WhatsApp gagal",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "WhatsApp gagal",
        description: "Tidak dapat membuka WhatsApp.",
      });
    } finally {
      setBusy(null);
    }
  };

  const canPrint = hasPermission("pos.receipt.print") || hasPermission("pos.transaction.create");

  return (
    <div className="space-y-2">
      {canPrint && (
        <Button
          className="w-full"
          variant="outline"
          disabled={busy !== null}
          onClick={handlePrint}
        >
          <Printer className="mr-2 h-4 w-4" />
          {busy === "print" ? "Printing…" : "Print thermal receipt"}
        </Button>
      )}
      <PermissionGate permission="pos.invoice.email">
        <Button
          className="w-full"
          variant="outline"
          disabled={!member.canEmail || busy !== null}
          onClick={handleEmail}
          title={member.emailHint}
        >
          <Mail className="mr-2 h-4 w-4" />
          {busy === "email" ? "Sending…" : "Send email invoice"}
        </Button>
      </PermissionGate>
      <PermissionGate permission="pos.invoice.whatsapp">
        <Button
          className="w-full"
          variant="outline"
          disabled={!member.canWhatsApp || busy !== null}
          onClick={handleWhatsApp}
          title={member.whatsAppHint}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {busy === "whatsapp" ? "Menyiapkan PDF…" : "Kirim invoice via WhatsApp"}
        </Button>
      </PermissionGate>
      {customer && (!member.canEmail || !member.canWhatsApp) && (
        <p className="text-xs text-muted-foreground">
          Digital invoice requires a member with email/WhatsApp opt-in on file.
        </p>
      )}
    </div>
  );
}
