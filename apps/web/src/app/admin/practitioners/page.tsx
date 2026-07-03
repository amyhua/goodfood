import { AppShell } from "@/components/AppShell";
import { AdminPractitioners } from "@/components/AdminPractitioners";

export const metadata = { title: "Admin · Practitioners — goodfood", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminPractitionersPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Practitioner applications</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Manually verify professional credentials before granting a badge.
          </p>
        </header>
        <AdminPractitioners />
      </div>
    </AppShell>
  );
}
