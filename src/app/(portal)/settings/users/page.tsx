import { AppShell } from "@/components/shell/app-shell";
import { PlaceholderFeature } from "@/components/shared/placeholder-feature";

export default function UsersSettingsPage() {
  return (
    <AppShell title="Users & Roles">
      <PlaceholderFeature
        title="User management"
        description="Invite users, assign roles and outlet scopes. Connect Supabase Auth for production user provisioning."
      />
    </AppShell>
  );
}
