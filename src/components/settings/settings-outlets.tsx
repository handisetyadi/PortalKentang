"use client";

import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsOutlets() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.outlets.map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle className="text-base">{o.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Code: {o.code}</p>
            <p>{o.address}</p>
            <p className="mt-2">
              Registers:{" "}
              {data.registers.filter((r) => r.outletId === o.id).map((r) => r.name).join(", ")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
