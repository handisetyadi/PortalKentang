import { AppShell } from "@/components/shell/app-shell";
import { RecipeDetail } from "@/components/recipes/recipe-detail";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="Recipe">
      <RecipeDetail id={id} />
    </AppShell>
  );
}
