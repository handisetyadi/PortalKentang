"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/use-app-data";

export function ReceiptSettingsForm() {
  const { data, persist, loading } = useAppData();
  const form = useForm({
    defaultValues: data?.receiptSettings,
  });

  if (loading || !data) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    await persist({
      ...data,
      receiptSettings: {
        ...data.receiptSettings,
        ...values,
        paperWidthMm: Number(values.paperWidthMm) as 58 | 80,
      },
    });
  });

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Store name</Label>
        <Input defaultValue={data.receiptSettings.storeName} {...form.register("storeName")} />
      </div>
      <div className="space-y-2">
        <Label>Paper width</Label>
        <Select
          defaultValue={String(data.receiptSettings.paperWidthMm)}
          onValueChange={(v) => form.setValue("paperWidthMm", Number(v) as 58 | 80)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="58">58mm</SelectItem>
            <SelectItem value="80">80mm</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Footer text</Label>
        <Textarea defaultValue={data.receiptSettings.footerText} {...form.register("footerText")} />
      </div>
      <div className="space-y-2">
        <Label>Tax number (NPWP)</Label>
        <Input defaultValue={data.receiptSettings.taxNumber} {...form.register("taxNumber")} />
      </div>
      <Button type="submit">Save receipt settings</Button>
    </form>
  );
}
