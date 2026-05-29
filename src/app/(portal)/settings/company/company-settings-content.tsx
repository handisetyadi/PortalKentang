"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CompanySettingsContent() {
  const { session } = useAuth();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{session?.companyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Slug:</span> {session?.companySlug}
        </p>
        <p>
          <span className="text-muted-foreground">User:</span> {session?.username}
        </p>
        <p>
          <span className="text-muted-foreground">Roles:</span> {session?.roles.join(", ")}
        </p>
        <Badge variant="secondary">{session?.permissions.length} permissions</Badge>
      </CardContent>
    </Card>
  );
}
