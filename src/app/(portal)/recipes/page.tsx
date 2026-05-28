import { AppShell } from "@/components/shell/app-shell";
import { RecipesList } from "@/components/recipes/recipes-list";

export default function RecipesPage() {
  return (
    <AppShell title="Recipes">
      <RecipesList />
    </AppShell>
  );
}
