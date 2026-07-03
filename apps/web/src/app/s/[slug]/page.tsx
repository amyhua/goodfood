import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MealList } from "@/components/MealList";
import { NutrientRail } from "@/components/NutrientRail";
import { ProofTable } from "@/components/ProofTable";
import { appBaseUrl, shareUrl } from "@/lib/app-url";
import { loadShareRender } from "@/server/shares/render";

export const dynamic = "force-dynamic";

/** Per-share SEO: title, description, canonical, Open Graph + Twitter Card. Next wires the
 *  generated opengraph-image automatically. Robots left indexable (public share). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const render = await loadShareRender(slug);
  if (!render) return { title: "Share not found — goodfood", robots: { index: false } };
  const url = shareUrl(slug);
  const title = `${render.title} — goodfood`;
  const description = render.summary;
  return {
    title,
    description,
    metadataBase: new URL(appBaseUrl()),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "goodfood",
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const render = await loadShareRender(slug);
  if (!render) notFound();
  const day = render.plan?.days[0];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <Link href="/" className="text-sm font-semibold tracking-tight">
            good<span className="text-brand-600">food</span>
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{render.title}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{render.summary}</p>
        </div>
        <Link
          href="/planner"
          className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Make your own
        </Link>
      </header>

      {render.kind === "PLAN" && render.plan && (
        <div className="flex flex-col gap-6">
          <NutrientRail rows={render.plan.proof} />
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="meals-heading">
              <h2 id="meals-heading" className="mb-3 text-lg font-semibold">
                Meals
              </h2>
              {day ? <MealList meals={day.meals} /> : <p>No meals.</p>}
            </section>
            <ProofTable rows={render.plan.proof} />
          </div>
        </div>
      )}

      {render.kind === "LIST" && render.items && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Shopping list</h2>
          <ul className="flex flex-col gap-1.5">
            {render.items.map((item, i) => (
              <li
                key={`${item.foodName}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-2 dark:border-neutral-800"
              >
                <span className="min-w-0 truncate font-medium">{item.foodName}</span>
                <span className="shrink-0 text-sm text-neutral-500 tabular-nums">
                  {item.grams == null ? "—" : `${Math.round(item.grams)} g`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-sm text-neutral-500 dark:border-neutral-800">
        Shared from goodfood — source-traceable meal plans with a nutrient proof. Missing data is
        shown as missing, never as zero.
      </footer>
    </main>
  );
}
