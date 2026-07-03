import { AppShell } from "@/components/AppShell";
import { ModerationQueue } from "@/components/ModerationQueue";

export const metadata = { title: "Moderation queue — goodfood", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function ModerationPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Moderation queue</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Content pending review. The automated safety check is guidance — you make the final call.
          </p>
        </header>
        <ModerationQueue />
      </div>
    </AppShell>
  );
}
