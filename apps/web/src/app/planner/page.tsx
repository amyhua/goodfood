import { AppShell } from "@/components/AppShell";
import { GenerateButton } from "@/components/GenerateButton";
import { MealList } from "@/components/MealList";
import { NutrientRail } from "@/components/NutrientRail";
import { ProofTable } from "@/components/ProofTable";
import { buildSamplePlan, serializedToPlanView, type PlanView } from "@/lib/plan-view";

export const dynamic = "force-dynamic";

async function loadPlan(planId: string | undefined): Promise<{ plan: PlanView; error?: string }> {
  if (!planId) return { plan: buildSamplePlan() };
  try {
    // Lazy so the sample path never constructs a Prisma client / touches the DB.
    const { prisma } = await import("@goodfood/db");
    const { getPlan, serializePlan } = await import("@/server/plans/read");
    const raw = await getPlan(prisma, planId);
    if (!raw) return { plan: buildSamplePlan(), error: "That plan was not found — showing a sample." };
    return { plan: serializedToPlanView(serializePlan(raw)) };
  } catch {
    return { plan: buildSamplePlan(), error: "Could not load that plan — showing a sample." };
  }
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const planId = typeof params.planId === "string" ? params.planId : undefined;
  const { plan, error } = await loadPlan(planId);
  const day = plan.days[0];

  return (
    <AppShell active="/planner">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
            {plan.isSample && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Sample data
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {plan.isSample
              ? "An illustrative day built from clearly-labeled synthetic foods and the real proof engine."
              : `${plan.durationDays}-day plan · nutrient proof below.`}
          </p>
          {error && <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{error}</p>}
        </header>

        <div className="mb-4">
          <GenerateButton />
        </div>

        <div className="flex flex-col gap-6">
          <NutrientRail rows={plan.proof} />

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="meals-heading">
              <h2 id="meals-heading" className="mb-3 text-lg font-semibold">
                Meals — day {(day?.dayIndex ?? 0) + 1}
              </h2>
              {day ? <MealList meals={day.meals} /> : <p>No meals.</p>}
            </section>

            <ProofTable rows={plan.proof} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
