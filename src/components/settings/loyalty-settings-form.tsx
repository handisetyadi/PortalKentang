"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/hooks/use-app-data";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export function LoyaltySettingsForm() {
  const { data, persist, loading } = useAppData();
  const [rupiahPerPoint, setRupiahPerPoint] = useState("1000");

  useEffect(() => {
    if (data?.loyaltySettings.rupiahPerPoint) {
      setRupiahPerPoint(String(data.loyaltySettings.rupiahPerPoint));
    }
  }, [data?.loyaltySettings.rupiahPerPoint]);

  if (loading || !data) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Math.floor(Number(rupiahPerPoint));
    if (!Number.isFinite(value) || value <= 0) {
      toast({
        variant: "destructive",
        title: "Nilai tidak valid",
        description: "Masukkan nominal rupiah per point yang lebih dari 0.",
      });
      return;
    }
    await persist({
      ...data,
      loyaltySettings: { rupiahPerPoint: value },
    });
    toast({
      title: "Pengaturan disimpan",
      description: `1 member point = ${formatCurrency(value)}`,
    });
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rupiahPerPoint">1 member point setara dengan (Rp)</Label>
        <Input
          id="rupiahPerPoint"
          type="number"
          min={1}
          step={1}
          value={rupiahPerPoint}
          onChange={(e) => setRupiahPerPoint(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Default: Rp 1.000 = 1 point. Member mendapatkan point dari nominal pembayaran
          tunai setelah redeem & voucher, dibagi nilai ini.
        </p>
      </div>
      <Button type="submit">Simpan</Button>
    </form>
  );
}
