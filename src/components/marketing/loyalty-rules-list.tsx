"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import type { LoyaltyRedemptionRule, LoyaltyRedeemType } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { MarketingSubnav } from "./marketing-subnav";

const schema = z
  .object({
    pointsRequired: z.coerce.number().int().min(1),
    redeemType: z.enum(["beverage", "food", "retail", "specific_product"]),
    productId: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (v) => v.redeemType !== "specific_product" || (v.productId && v.productId.length > 0),
    { message: "Pilih product untuk tipe specific product", path: ["productId"] }
  );

type FormValues = z.infer<typeof schema>;

const TYPE_LABELS: Record<LoyaltyRedeemType, string> = {
  beverage: "Beverage",
  food: "Food",
  retail: "Retail",
  specific_product: "Specific product",
};

export function LoyaltyRulesList() {
  const { data, loading, persist } = useAppData();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pointsRequired: 50,
      redeemType: "beverage",
      productId: "",
      isActive: true,
    },
  });

  const redeemType = form.watch("redeemType");

  if (loading || !data) return <LoadingState />;

  const onSubmit = async (values: FormValues) => {
    const rule: LoyaltyRedemptionRule = {
      id: crypto.randomUUID(),
      pointsRequired: values.pointsRequired,
      redeemType: values.redeemType,
      productId: values.redeemType === "specific_product" ? values.productId : undefined,
      isActive: values.isActive,
    };
    await persist({ ...data, loyaltyRules: [...data.loyaltyRules, rule] });
    form.reset({ pointsRequired: 50, redeemType: "beverage", productId: "", isActive: true });
    setOpen(false);
    toast({ title: "Rule ditambahkan" });
  };

  const toggleActive = async (rule: LoyaltyRedemptionRule) => {
    await persist({
      ...data,
      loyaltyRules: data.loyaltyRules.map((r) =>
        r.id === rule.id ? { ...r, isActive: !r.isActive } : r
      ),
    });
  };

  const columns: Column<LoyaltyRedemptionRule>[] = [
    {
      key: "points",
      header: "Points required",
      cell: (r) => r.pointsRequired,
      className: "text-right",
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => TYPE_LABELS[r.redeemType],
    },
    {
      key: "product",
      header: "Product",
      cell: (r) => {
        if (!r.productId) return "—";
        return data.products.find((p) => p.id === r.productId)?.name ?? r.productId;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.isActive ? "default" : "secondary"}>
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="outline" size="sm" onClick={() => toggleActive(r)}>
          {r.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <MarketingSubnav />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Atur product/kategori yang bisa di-redeem dengan member point.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tambah rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Loyalty redemption rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Points required</Label>
                <Input type="number" min={1} {...form.register("pointsRequired")} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={redeemType}
                  onValueChange={(v) =>
                    form.setValue("redeemType", v as LoyaltyRedeemType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {redeemType === "specific_product" && (
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={form.watch("productId") ?? ""}
                    onValueChange={(v) => form.setValue("productId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih product" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.products
                        .filter((p) => p.isActive)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) => form.setValue("isActive", v === true)}
                />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full">
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={data.loyaltyRules} emptyTitle="Belum ada rule." />
    </div>
  );
}
