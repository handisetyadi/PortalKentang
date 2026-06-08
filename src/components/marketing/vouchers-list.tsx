"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Voucher, VoucherDiscountType } from "@/lib/data/types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { MarketingSubnav } from "./marketing-subnav";
import {
  isVoucherCodeTaken,
  normalizeVoucherCode,
} from "@/lib/marketing/voucher-validation";

const schema = z.object({
  code: z.string().min(2, "Kode minimal 2 karakter"),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.coerce.number().positive(),
  minSpend: z.coerce.number().min(0),
  validFrom: z.string().min(1),
  validUntil: z.string().min(1),
  maxRedemptions: z.coerce.number().int().positive().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function VouchersList() {
  const { data, loading, persist } = useAppData();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const now = new Date();
  const defaultFrom = now.toISOString().slice(0, 16);
  const defaultUntil = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 16);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minSpend: 0,
      validFrom: defaultFrom,
      validUntil: defaultUntil,
      maxRedemptions: "",
      isActive: true,
    },
  });

  const discountType = form.watch("discountType");

  const vouchers = data?.vouchers ?? [];
  const sortedVouchers = useMemo(
    () => [...vouchers].sort((a, b) => a.code.localeCompare(b.code)),
    [vouchers]
  );
  const allSelected = vouchers.length > 0 && selectedIds.size === vouchers.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(vouchers.map((v) => v.id)) : new Set());
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const removeVouchers = async (ids: string[]) => {
    if (!data || ids.length === 0) return;
    const idSet = new Set(ids);
    const nextVouchers = data.vouchers.filter((v) => !idSet.has(v.id));
    const nextRedemptions = data.voucherRedemptions.filter((r) => !idSet.has(r.voucherId));
    await persist({
      ...data,
      vouchers: nextVouchers,
      voucherRedemptions: nextRedemptions,
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const deleteOne = async (voucher: Voucher) => {
    await removeVouchers([voucher.id]);
    toast({ title: "Voucher dihapus", description: voucher.code });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    await removeVouchers(ids);
    toast({ title: `${ids.length} voucher dihapus` });
  };

  if (loading || !data) return <LoadingState />;

  const onSubmit = async (values: FormValues) => {
    const code = normalizeVoucherCode(values.code);
    if (isVoucherCodeTaken(data.vouchers, code)) {
      form.setError("code", {
        message: `Kode "${code}" sudah digunakan. Gunakan kode lain.`,
      });
      toast({
        variant: "destructive",
        title: "Kode voucher duplikat",
        description: `Kode "${code}" sudah ada.`,
      });
      return;
    }

    const voucher: Voucher = {
      id: crypto.randomUUID(),
      code,
      discountType: values.discountType,
      discountValue: values.discountValue,
      minSpend: values.minSpend,
      validFrom: new Date(values.validFrom).toISOString(),
      validUntil: new Date(values.validUntil).toISOString(),
      maxRedemptions:
        values.maxRedemptions === "" || values.maxRedemptions == null
          ? undefined
          : Number(values.maxRedemptions),
      redemptionCount: 0,
      isActive: values.isActive,
    };
    await persist({ ...data, vouchers: [...data.vouchers, voucher] });
    form.reset({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minSpend: 0,
      validFrom: defaultFrom,
      validUntil: defaultUntil,
      maxRedemptions: "",
      isActive: true,
    });
    setOpen(false);
    toast({ title: "Voucher ditambahkan" });
  };

  const toggleActive = async (voucher: Voucher) => {
    await persist({
      ...data,
      vouchers: data.vouchers.map((v) =>
        v.id === voucher.id ? { ...v, isActive: !v.isActive } : v
      ),
    });
  };

  return (
    <div className="space-y-4">
      <MarketingSubnav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Voucher berlaku untuk member dan non-member. Diskon diterapkan setelah redeem point.
        </p>
        <div className="flex items-center gap-2">
          {someSelected && (
            <Button variant="destructive" size="sm" onClick={() => void deleteSelected()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus ({selectedIds.size})
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Tambah voucher</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Voucher baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input {...form.register("code")} placeholder="KENTANG10" />
                  {form.formState.errors.code && (
                    <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Discount type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) =>
                      form.setValue("discountType", v as VoucherDiscountType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed amount (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{discountType === "percentage" ? "Discount %" : "Discount (Rp)"}</Label>
                  <Input type="number" min={0} step="any" {...form.register("discountValue")} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum spend (before tax)</Label>
                  <Input type="number" min={0} {...form.register("minSpend")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Valid from</Label>
                    <Input type="datetime-local" {...form.register("validFrom")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid until</Label>
                    <Input type="datetime-local" {...form.register("validUntil")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max redemptions (kosongkan = unlimited)</Label>
                  <Input type="number" min={1} {...form.register("maxRedemptions")} />
                </div>
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
      </div>

      {sortedVouchers.length === 0 ? (
        <EmptyState title="Belum ada voucher." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleSelectAll(v === true)}
                  aria-label="Pilih semua voucher"
                />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead className="text-right">Min spend</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVouchers.map((v) => (
              <TableRow key={v.id} data-state={selectedIds.has(v.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(v.id)}
                    onCheckedChange={(checked) => toggleSelect(v.id, checked === true)}
                    aria-label={`Pilih voucher ${v.code}`}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-mono">{v.code}</span>
                </TableCell>
                <TableCell>
                  {v.discountType === "percentage"
                    ? `${v.discountValue}%`
                    : formatCurrency(v.discountValue)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(v.minSpend)}</TableCell>
                <TableCell className="text-right">
                  {v.maxRedemptions != null
                    ? `${v.redemptionCount} / ${v.maxRedemptions}`
                    : String(v.redemptionCount)}
                </TableCell>
                <TableCell>{new Date(v.validUntil).toLocaleDateString("id-ID")}</TableCell>
                <TableCell>
                  <Badge variant={v.isActive ? "default" : "secondary"}>
                    {v.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => void toggleActive(v)}>
                      {v.isActive ? "Off" : "On"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus voucher ${v.code}`}
                      onClick={() => void deleteOne(v)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
