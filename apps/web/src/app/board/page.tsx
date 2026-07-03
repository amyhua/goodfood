import { AppShell } from "@/components/AppShell";
import { BoardFeed } from "@/components/BoardFeed";

export const metadata = { title: "Community board — goodfood" };
export const dynamic = "force-dynamic";

export default function BoardPage() {
  return (
    <AppShell active="/board">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Community board</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Meal plans members chose to share. Filter by diet, adopt one into your account, like, save,
            or report.
          </p>
        </header>
        <BoardFeed />
      </div>
    </AppShell>
  );
}
