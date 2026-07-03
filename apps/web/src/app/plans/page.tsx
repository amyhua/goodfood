import { AppShell } from "@/components/AppShell";
import { MyPlans } from "@/components/MyPlans";

export const metadata = { title: "My plans — goodfood" };
export const dynamic = "force-dynamic";

export default function PlansPage() {
  return (
    <AppShell active="/plans">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">My plans</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Your saved meal plans and shopping lists, under your own names.
          </p>
        </header>
        <MyPlans />
      </div>
    </AppShell>
  );
}
