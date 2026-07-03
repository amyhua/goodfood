import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { appBaseUrl } from "@/lib/app-url";

const GITHUB_URL = "https://github.com/amyhua/goodfood";

const FEATURES = [
  {
    title: "Meal plans with a proof",
    body: "Every plan ships a source-linked nutrient proof table. Numbers trace back to USDA FoodData Central — missing data is shown as missing, never as zero.",
  },
  {
    title: "Your rules, enforced",
    body: "Vegan, allergies, custom bans — exclusions are absolute. Disable a nutrient and it’s removed, not silently capped at zero.",
  },
  {
    title: "Pantry & shopping",
    body: "Track what you have; the shopping list subtracts it and groups the rest by category, print-ready.",
  },
  {
    title: "Save & share",
    body: "Save plans and lists under your own names. Share a public page with a real link preview — or keep it private. You choose, per item, and can revoke anytime.",
  },
];

const title = "goodfood — free, source-traceable meal planning";
const description =
  "Build meal plans with an honest, source-linked nutrient proof. Free, open source, and privacy-first — missing data is never faked as zero.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(appBaseUrl()),
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", siteName: "goodfood", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "goodfood",
      url: appBaseUrl(),
      sameAs: [GITHUB_URL],
    },
    {
      "@type": "WebSite",
      name: "goodfood",
      url: appBaseUrl(),
      description,
    },
    {
      "@type": "SoftwareApplication",
      name: "goodfood",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
      <JsonLd data={structuredData} />
      {/* Hero */}
      <section aria-labelledby="hero-heading">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Free · open source · no ads
        </span>
        <h1 id="hero-heading" className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Meal plans you can actually trust.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          goodfood builds meal plans around your nutrient targets and shows its work — a
          source-linked proof table for every plan. It’s completely free, and the whole thing is
          open source.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/planner"
            className="inline-flex min-h-12 items-center rounded-lg bg-brand-600 px-7 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Try the planner — no account needed
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-12 items-center rounded-lg border border-neutral-300 px-7 text-sm font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Create a free account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="mt-16">
        <h2 id="features-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          What you get
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Free + open source */}
      <section
        aria-labelledby="oss-heading"
        className="mt-16 rounded-2xl border border-brand-200 bg-brand-50/50 p-6 dark:border-brand-900 dark:bg-brand-950/20"
      >
        <h2 id="oss-heading" className="text-2xl font-semibold tracking-tight">
          Free, and open source
        </h2>
        <p className="mt-2 max-w-2xl text-neutral-700 dark:text-neutral-300">
          goodfood is free to use with no ads and no upsells. The code is open — read it, file an
          issue, or send a pull request. Contributions of foods, tests, and features are welcome.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <span aria-hidden>★</span> Contribute on GitHub
          </a>
          <Link
            href="/planner"
            className="inline-flex min-h-12 items-center rounded-lg border border-neutral-300 px-6 text-sm font-semibold hover:bg-white dark:border-neutral-700"
          >
            Open the planner
          </Link>
        </div>
      </section>

      <footer className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800">
        <Link href="/planner" className="hover:text-brand-600">
          Planner
        </Link>
        <Link href="/foods" className="hover:text-brand-600">
          Foods
        </Link>
        <Link href="/plans" className="hover:text-brand-600">
          My plans
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-brand-600">
          GitHub
        </a>
        <Link href="/health" className="hover:text-brand-600">
          Status
        </Link>
      </footer>
    </main>
  );
}
