import { AppShell } from "@/components/shell/app-shell";
import { OpenSessionForm } from "@/components/pos/open-session-form";

export default function OpenSessionPage() {
  return (
    <AppShell title="Open POS Session">
      <OpenSessionForm />
    </AppShell>
  );
}
