"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useAuth } from "@/components/providers/auth-provider";
import { IDS } from "@/lib/data/ids";

const schema = z.object({
  outletId: z.string().min(1),
  registerId: z.string().optional(),
  openingCash: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function OpenSessionForm() {
  const router = useRouter();
  const { data, persist, loading } = useAppData();
  const { session } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      outletId: IDS.outlet1,
      registerId: IDS.register1,
      openingCash: 500000,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!data || !session) return;
    const existing = data.posSessions.find((s) => s.status === "open");
    if (existing) {
      router.push("/pos");
      return;
    }
    const newSession = {
      id: crypto.randomUUID(),
      outletId: values.outletId,
      registerId: values.registerId,
      openedBy: session.userId,
      openingCash: values.openingCash,
      status: "open" as const,
      openedAt: new Date().toISOString(),
      notes: values.notes,
    };
    await persist({ ...data, posSessions: [newSession, ...data.posSessions] });
    router.push("/pos");
  };

  if (loading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>Outlet</Label>
        <Select
          value={form.watch("outletId")}
          onValueChange={(v) => form.setValue("outletId", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Register</Label>
        <Select
          value={form.watch("registerId") ?? ""}
          onValueChange={(v) => form.setValue("registerId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select register" />
          </SelectTrigger>
          <SelectContent>
            {data.registers
              .filter((r) => r.outletId === form.watch("outletId"))
              .map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="openingCash">Opening cash (Rp)</Label>
        <Input
          id="openingCash"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          {...form.register("openingCash")}
        />
        <p className="text-xs text-muted-foreground">Example: 500000 for Rp 500.000</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...form.register("notes")} />
      </div>
      <Button type="submit" className="w-full">
        Open session
      </Button>
    </form>
  );
}
