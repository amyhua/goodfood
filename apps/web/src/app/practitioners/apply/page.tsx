import { AppShell } from "@/components/AppShell";
import { PractitionerApply } from "@/components/PractitionerApply";

export const metadata = { title: "Apply as a practitioner — goodfood" };

export default function PractitionerApplyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Apply as a practitioner</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Submit your credentials for manual review. Once verified, your shared plans carry a badge.
            This badge is a trust signal, not medical advice.
          </p>
        </header>
        <PractitionerApply />
      </div>
    </AppShell>
  );
}
