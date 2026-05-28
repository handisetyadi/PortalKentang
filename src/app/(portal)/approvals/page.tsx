import { AppShell } from "@/components/shell/app-shell";
import { ApprovalsList } from "@/components/approvals/approvals-list";

export default function ApprovalsPage() {
  return (
    <AppShell title="Approvals">
      <ApprovalsList />
    </AppShell>
  );
}
