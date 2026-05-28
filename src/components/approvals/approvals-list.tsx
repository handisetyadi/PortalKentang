"use client";

import { useAppData } from "@/hooks/use-app-data";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ClipboardCheck } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApprovalRequest } from "@/lib/data/types";
import { toast } from "@/hooks/use-toast";

export function ApprovalsList() {
  const { data, loading, persist } = useAppData();
  if (loading || !data) return <LoadingState />;

  const pending = data.approvals.filter((a) => a.status === "pending");

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const next = {
      ...data,
      approvals: data.approvals.map((a) => (a.id === id ? { ...a, status } : a)),
    };
    await persist(next);
    toast({
      title: status === "approved" ? "Approved" : "Rejected",
      description: `Request ${id} has been ${status}.`,
    });
  };

  if (data.approvals.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No pending approvals"
        description="Void requests, refunds, and stock adjustments will appear here."
      />
    );
  }

  const columns: Column<ApprovalRequest>[] = [
    { key: "type", header: "Type", cell: (r) => r.requestType },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.status === "pending" ? "warning" : "secondary"}>{r.status}</Badge>
      ),
    },
    { key: "reason", header: "Reason", cell: (r) => r.reason ?? "—" },
    {
      key: "actions",
      header: "Actions",
      cell: (r) =>
        r.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => updateStatus(r.id, "approved")}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "rejected")}>
              Reject
            </Button>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <p className="text-sm text-muted-foreground">{pending.length} pending request(s)</p>
      )}
      <DataTable
        columns={columns}
        data={data.approvals}
        emptyTitle="No approvals"
        searchPlaceholder="Search approvals…"
        searchFilter={(r, q) =>
          r.requestType.toLowerCase().includes(q) ||
          (r.reason?.toLowerCase().includes(q) ?? false)
        }
      />
    </div>
  );
}
