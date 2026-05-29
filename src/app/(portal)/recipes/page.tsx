import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { RecipesList } from "@/components/recipes/recipes-list";
import { Button } from "@/components/ui/button";

export default function RecipesPage() {
  return (
    <AppShell
      title="Recipes"
      actions={
        <Button
          asChild
          size="icon"
          className="h-9 w-9 shrink-0 shadow-sm ring-1 ring-primary/20 transition-transform hover:scale-105 active:scale-95"
          title="Add recipe"
        >
          <Link href="/recipes/new" aria-label="Add recipe">
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </Button>
      }
    >
      <RecipesList />
    </AppShell>
  );
}
