import { AppShell } from "@/components/shell/app-shell";
import { LoyaltyRulesList } from "@/components/marketing/loyalty-rules-list";

export default function MarketingLoyaltyPage() {
  return (
    <AppShell title="Loyalty Program">
      <LoyaltyRulesList />
    </AppShell>
  );
}
