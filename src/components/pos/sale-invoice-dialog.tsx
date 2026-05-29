"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { getMemberInvoiceOptions } from "@/lib/customers/member-invoice-eligibility";
import {
  printInvoiceWithPdf,
  sendInvoiceEmail,
  sendInvoiceWhatsApp,
} from "@/lib/invoices/deliver-invoice";
import type { Customer, ReceiptSettings, Transaction } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Action = "print" | "email" | "whatsapp" | null;

export function SaleInvoiceDialog({
  open,
  onOpenChange,
  transaction,
  customer,
  receiptSettings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  customer?: Customer;
  receiptSettings: ReceiptSettings;
}) {
  const { hasPermission } = useAuth();
  const [busy, setBusy] = useState<Action>(null);
  const member = getMemberInvoiceOptions(customer);

  const deliveryPayload = {
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
        variant: result.ok && !thermalFailed ? "default" : result.ok ? "default" : "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = async () => {
    if (!member.canEmail) return;
    setBusy("email");
    try {
      const result = await sendInvoiceEmail(deliveryPayload);
      toast({
        title: result.ok ? "Invoice emailed" : "Email failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Email failed",
        description: "Could not reach the invoice API.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleWhatsApp = async () => {
    if (!member.canWhatsApp) return;
    setBusy("whatsapp");
    try {
      const result = await sendInvoiceWhatsApp(deliveryPayload);
      toast({
        title: result.ok ? "WhatsApp sent" : "WhatsApp failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "WhatsApp failed",
        description: "Could not reach the invoice API.",
      });
    } finally {
      setBusy(null);
    }
  };

  const canPrint = hasPermission("pos.receipt.print") || hasPermission("pos.transaction.create");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sale completed</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                {transaction.receiptNumber} · {formatCurrency(transaction.total)}
              </p>
              {customer ? (
                <p>
                  Customer:{" "}
                  <span className="font-medium text-foreground">{customer.name}</span>
                </p>
              ) : (
                <p>Walk-in sale — digital invoice is for members only.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">How should the invoice be delivered?</p>

        <div className="grid gap-2">
          {canPrint && (
            <Button
              type="button"
              variant="default"
              className="h-auto justify-start gap-3 py-3"
              disabled={busy !== null}
              onClick={handlePrint}
            >
              <Printer className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <div className="font-medium">Print invoice & receipt</div>
                <div className="text-xs font-normal opacity-90">
                  PDF opens in a new tab (saved to Supabase), then thermal print
                </div>
              </div>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 py-3"
            disabled={!member.canEmail || busy !== null || !hasPermission("pos.invoice.email")}
            onClick={handleEmail}
          >
            <Mail className="h-5 w-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">Send email invoice</div>
              <div className="text-xs font-normal text-muted-foreground">{member.emailHint}</div>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 py-3"
            disabled={
              !member.canWhatsApp || busy !== null || !hasPermission("pos.invoice.whatsapp")
            }
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">Send WhatsApp invoice</div>
              <div className="text-xs font-normal text-muted-foreground">{member.whatsAppHint}</div>
            </div>
          </Button>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
            {busy ? "Close" : "Done — next sale"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href={`/orders/${transaction.id}`}>View order details</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
