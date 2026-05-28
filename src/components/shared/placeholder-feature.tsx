import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
