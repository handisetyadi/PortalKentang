import type { Customer } from "@/lib/data/types";

export type MemberInvoiceOptions = {
  customer: Customer | undefined;
  canEmail: boolean;
  canWhatsApp: boolean;
  emailHint: string;
  whatsAppHint: string;
};

export function getMemberInvoiceOptions(customer?: Customer): MemberInvoiceOptions {
  if (!customer) {
    return {
      customer: undefined,
      canEmail: false,
      canWhatsApp: false,
      emailHint: "Select a member customer on the sale to send by email.",
      whatsAppHint: "Select a member customer on the sale to send by WhatsApp.",
    };
  }

  const hasEmail = Boolean(customer.email?.trim());
  const hasPhone = Boolean(customer.phone?.trim());

  return {
    customer,
    canEmail: hasEmail && customer.emailOptIn,
    canWhatsApp: hasPhone && customer.whatsappOptIn,
    emailHint: !hasEmail
      ? "Customer has no email on file."
      : !customer.emailOptIn
        ? "Customer has not opted in to email."
        : `Send to ${customer.email}`,
    whatsAppHint: !hasPhone
      ? "Customer has no mobile number on file."
      : !customer.whatsappOptIn
        ? "Customer has not opted in to WhatsApp."
        : `Buka WhatsApp ke ${customer.phone}`,
  };
}
