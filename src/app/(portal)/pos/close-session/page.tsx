import { AppShell } from "@/components/shell/app-shell";
import { CloseSessionForm } from "@/components/pos/close-session-form";

export default function CloseSessionPage() {
  return (
    <AppShell title="Close POS Session">
      <CloseSessionForm />
    </AppShell>
  );
}
