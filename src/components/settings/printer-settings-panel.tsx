"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPrintAdapter } from "@/lib/print/adapter";

export function PrinterSettingsPanel() {
  const [printerName, setPrinterName] = useState("Generic ESC/POS");
  const [status, setStatus] = useState<string | null>(null);

  const testPrint = async () => {
    const adapter = getPrintAdapter();
    const result = await adapter.testPrinter();
    setStatus(result.message ?? result.status);
  };

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QZ Tray</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Install QZ Tray for thermal printing. Supports Epson, Xprinter, Panda, Star (ESC/POS).</p>
          <div className="space-y-2">
            <Label>Printer name</Label>
            <Input value={printerName} onChange={(e) => setPrinterName(e.target.value)} />
          </div>
          <Button type="button" onClick={testPrint}>
            Test print
          </Button>
          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browser fallback</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If QZ Tray is unavailable, receipts open in a print dialog via browser print.
        </CardContent>
      </Card>
    </div>
  );
}
