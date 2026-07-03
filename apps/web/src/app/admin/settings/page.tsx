import { AppShell } from "@/components/AppShell";
import { AdminSettings } from "@/components/AdminSettings";

export const metadata = { title: "Admin · Monetization — goodfood", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Monetization settings</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Off by default — the app is 100% free until you flip this on. Changes apply immediately.
          </p>
        </header>
        <AdminSettings />
      </div>
    </AppShell>
  );
}
