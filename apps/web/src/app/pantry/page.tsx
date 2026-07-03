import { AppShell } from "@/components/AppShell";
import { Pantry } from "@/components/Pantry";

export const metadata = { title: "Pantry — goodfood" };

export default function PantryPage() {
  return (
    <AppShell active="/pantry">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Pantry</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Track what you already have. Stored on this device for now; the shopping list subtracts
            it from what a plan needs.
          </p>
        </header>
        <Pantry />
      </div>
    </AppShell>
  );
}
