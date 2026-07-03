import { AppShell } from "@/components/AppShell";
import { ShoppingList } from "@/components/ShoppingList";
import { aggregateShopping, buildSamplePlan } from "@/lib/plan-view";

export const metadata = { title: "Shopping list — goodfood" };

export default function ShoppingPage() {
  const plan = buildSamplePlan();
  const items = aggregateShopping(plan);

  return (
    <AppShell active="/shopping">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Shopping list</h1>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 print:hidden dark:bg-amber-950 dark:text-amber-300">
              Sample plan
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 print:hidden">
            Everything the current plan needs, grouped by category with pantry subtracted.
          </p>
        </header>
        <ShoppingList items={items} />
      </div>
    </AppShell>
  );
}
