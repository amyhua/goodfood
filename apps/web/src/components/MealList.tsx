import type { MealView } from "../lib/plan-view";

/**
 * Meal sections with ingredient cards (F1). Uses native <details>/<summary> so each
 * meal is collapsible on small screens with zero client JS and a full-width (>=44px)
 * touch target. Source is shown per ingredient (FDC id when real, "sample" when synthetic).
 */
const ROLE_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

function SourceTag({ source }: { source: { fdcId?: number | null; dataset?: string | null } }) {
  if (source.fdcId) {
    return (
      <a
        href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${source.fdcId}/nutrients`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-brand-600 underline underline-offset-2"
      >
        FDC {source.fdcId}
      </a>
    );
  }
  return (
    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
      sample data
    </span>
  );
}

export function MealList({ meals }: { meals: MealView[] }) {
  return (
    <div className="flex flex-col gap-3">
      {meals.map((meal) => (
        <details
          key={meal.role}
          open
          className="group rounded-xl border border-neutral-200 open:pb-2 dark:border-neutral-800"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold marker:content-none">
            <span>{ROLE_LABEL[meal.role] ?? meal.role}</span>
            <span className="text-sm font-normal text-neutral-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <ul className="flex flex-col gap-2 px-4">
            {meal.items.map((item, i) => (
              <li
                key={`${item.foodName}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.foodName}</p>
                  <p className="text-xs text-neutral-500">
                    {item.grams == null ? "—" : `${Math.round(item.grams)} g`}
                    {item.fromPantry ? " · from pantry" : ""}
                  </p>
                </div>
                <SourceTag source={item.source} />
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
