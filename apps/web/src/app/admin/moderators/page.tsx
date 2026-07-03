import { AppShell } from "@/components/AppShell";
import { AdminModerators } from "@/components/AdminModerators";

export const metadata = { title: "Admin · Moderators — goodfood", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminModeratorsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Moderator applications</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Review applications and promote trusted members to community moderators.
          </p>
        </header>
        <AdminModerators />
      </div>
    </AppShell>
  );
}
