/**
 * Ad slot (F10). Renders NOTHING unless NEXT_PUBLIC_ADS_ENABLED is on — ads are off by
 * default. Even when enabled it's a labeled placeholder, not a real ad network, until one is
 * deliberately integrated.
 */
export function AdSlot({ slot = "default" }: { slot?: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={slot}
      className="my-4 flex min-h-24 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-400 dark:border-neutral-700"
    >
      Ad placeholder ({slot})
    </aside>
  );
}
