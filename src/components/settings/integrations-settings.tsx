"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { name: "Resend", description: "Email invoices with PDF attachment", enabled: false },
  { name: "WhatsApp Cloud API", description: "Manual invoice delivery (placeholder)", enabled: false },
  { name: "Payment gateway", description: "QRIS, Midtrans, Xendit — coming soon", enabled: false },
];

export function IntegrationsSettings() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {integrations.map((i) => (
        <Card key={i.name}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{i.name}</CardTitle>
            <Badge variant={i.enabled ? "success" : "secondary"}>
              {i.enabled ? "Configured" : "Placeholder"}
            </Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{i.description}</CardContent>
        </Card>
      ))}
    </div>
  );
}
