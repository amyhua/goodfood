import { AppShell } from "@/components/AppShell";
import { ModeratorApply } from "@/components/ModeratorApply";

export const metadata = { title: "Become a moderator — goodfood" };

export default function ModeratorApplyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Become a community moderator</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Help keep the community safe. Moderators can approve/reject/flag content but never see
            other users’ private data.
          </p>
        </header>
        <ModeratorApply />
      </div>
    </AppShell>
  );
}
