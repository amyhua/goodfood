import { AppShell } from "@/components/AppShell";
import { FoodSearch } from "@/components/FoodSearch";

export const metadata = { title: "Foods — goodfood" };

export default function FoodsPage() {
  return (
    <AppShell active="/foods">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Foods</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Search USDA FoodData Central. Every food links back to its source record — nutrition is
            never fabricated.
          </p>
        </header>
        <FoodSearch />
      </div>
    </AppShell>
  );
}
