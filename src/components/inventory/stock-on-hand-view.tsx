"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { useAuth } from "@/components/providers/auth-provider";
import { getAvailableQty } from "@/lib/inventory/fifo";
import { adjustStockAction } from "@/lib/inventory/adjust-stock-action";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { RoleGate } from "@/components/gates/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IDS } from "@/lib/data/ids";
import { toast } from "@/hooks/use-toast";

type Row = { id: string; name: string; sku: string; onHand: number; unit: string; low: boolean };

export function StockOnHandView() {
  const { data, loading, persist } = useAppData();
  const { session } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const outletId = session?.activeOutletId ?? IDS.outlet1;
  const warehouseId = IDS.warehouse1;

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    return data.inventoryItems
      .filter((i) => i.trackStock)
      .map((i) => {
        const onHand = getAvailableQty(data, i.id, outletId);
        return {
          id: i.id,
          name: i.name,
          sku: i.sku,
          onHand,
          unit: i.baseUnit,
          low: i.reorderPoint != null && onHand < i.reorderPoint,
        };
      });
  }, [data, outletId]);

  const changes = useMemo(() => {
    if (!data) return [];
    return rows
      .map((row) => {
        const raw = draftQty[row.id] ?? String(row.onHand);
        const newQuantity = Number(raw);
        const delta = newQuantity - row.onHand;
        if (!Number.isFinite(newQuantity) || Math.abs(delta) < 0.000_001) return null;
        return { row, newQuantity, delta };
      })
      .filter(Boolean) as { row: Row; newQuantity: number; delta: number }[];
  }, [rows, draftQty, data]);

  const startEdit = () => {
    const initial: Record<string, string> = {};
    for (const row of rows) {
      initial[row.id] = row.onHand.toFixed(2).replace(/\.?0+$/, "");
    }
    setDraftQty(initial);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setDraftQty({});
    setConfirmOpen(false);
  };

  const handleSaveClick = () => {
    if (changes.length === 0) {
      toast({
        title: "No changes",
        description: "Adjust at least one item quantity before saving.",
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const result = await adjustStockAction(data, {
        outletId,
        warehouseId,
        changes: changes.map((c) => ({
          inventoryItemId: c.row.id,
          newQuantity: c.newQuantity,
        })),
      });

      if (!result.ok) {
        toast({
          title: "Could not adjust stock",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      await persist({
        ...data,
        fifoLayers: result.fifoLayers,
        stockLedger: result.stockLedger,
      });

      toast({
        title: "Stock updated",
        description: `${changes.length} item(s) adjusted.`,
      });
      cancelEdit();
    } catch (e) {
      toast({
        title: "Could not adjust stock",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setConfirmOpen(false);
    }
  };

  if (loading || !data) return <LoadingState />;

  const columns: Column<Row>[] = [
    { key: "sku", header: "SKU", cell: (r) => r.sku },
    { key: "name", header: "Item", cell: (r) => r.name },
    {
      key: "qty",
      header: "On hand",
      cell: (r) =>
        editMode ? (
          <div className="flex items-center gap-1">
            <Input
              type="text"
              inputMode="decimal"
              className="h-8 w-28"
              value={draftQty[r.id] ?? ""}
              onChange={(e) => setDraftQty((prev) => ({ ...prev, [r.id]: e.target.value }))}
            />
            <span className="text-sm text-muted-foreground">{r.unit}</span>
          </div>
        ) : (
          <span className={r.low ? "font-medium text-amber-600" : ""}>
            {r.onHand.toFixed(2)} {r.unit}
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (r.low ? <Badge variant="warning">Low stock</Badge> : <Badge variant="success">OK</Badge>),
    },
  ];

  return (
    <div className="space-y-4">
      <RoleGate roles={["company_owner", "store_manager"]}>
        <div className="flex justify-end gap-2">
          {!editMode ? (
            <Button type="button" variant="outline" onClick={startEdit}>
              Adjust stock
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveClick} disabled={isSaving}>
                Save
              </Button>
            </>
          )}
        </div>
      </RoleGate>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No stock tracked"
        searchPlaceholder="Search items…"
        searchFilter={(r, q) =>
          r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
        }
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm stock adjustment</DialogTitle>
            <DialogDescription>
              You are about to change stock for {changes.length} item(s). This will be recorded in
              the stock ledger.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {changes.map((c) => (
              <li key={c.row.id}>
                <span className="font-medium">{c.row.name}</span>: {c.row.onHand.toFixed(2)} →{" "}
                {c.newQuantity.toFixed(2)} {c.row.unit} (
                <span className={c.delta >= 0 ? "text-green-600" : "text-destructive"}>
                  {c.delta >= 0 ? "+" : ""}
                  {c.delta.toFixed(2)}
                </span>
                )
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
