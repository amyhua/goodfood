import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PractitionersBrowse } from "@/components/PractitionersBrowse";

export const metadata = {
  title: "Practitioners — goodfood",
  description: "Adopt meal plans from verified nutritionists, dietitians, and doctors.",
};
export const dynamic = "force-dynamic";

export default function PractitionersPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Practitioners</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Verified professionals share plans you can adopt. Verification is a trust badge, not
            medical advice.
          </p>
          <Link
            href="/practitioners/apply"
            className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            Are you a professional? Apply for a verified badge →
          </Link>
        </header>
        <PractitionersBrowse />
      </div>
    </AppShell>
  );
}
