import { AppShell } from "@/components/AppShell";
import { ContentSubmit } from "@/components/ContentSubmit";

export const metadata = { title: "Submit content — goodfood" };

export default function ContentSubmitPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Submit content</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Highlight a creator or share a tip. Everything is reviewed before it goes live.
          </p>
        </header>
        <ContentSubmit />
      </div>
    </AppShell>
  );
}
