import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { NewRecipeForm } from "@/components/recipes/new-recipe-form";
import { Button } from "@/components/ui/button";

export default function NewRecipePage() {
  return (
    <AppShell
      title="Add recipe"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recipes">Back to recipes</Link>
        </Button>
      }
    >
      <NewRecipeForm />
    </AppShell>
  );
}
