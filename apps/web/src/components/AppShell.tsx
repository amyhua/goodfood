import Link from "next/link";
import { AccountButton } from "./AccountButton";

/**
 * Responsive application shell (F1/F2).
 * Mobile: sticky top bar (account control) + fixed bottom tab bar (touch targets >= 44px).
 * Desktop (>= md): left sidebar with account control in the footer.
 */
const NAV = [
  { href: "/planner", label: "Planner", icon: "🍽️" },
  { href: "/foods", label: "Foods", icon: "🔎" },
  { href: "/pantry", label: "Pantry", icon: "🧺" },
  { href: "/shopping", label: "Shopping", icon: "🛒" },
  { href: "/plans", label: "Plans", icon: "📚" },
] as const;

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: (typeof NAV)[number]["href"];
}) {
  return (
    <div className="md:flex md:min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-neutral-200 md:px-3 md:py-6 dark:md:border-neutral-800">
        <Link href="/" className="mb-6 px-3 text-lg font-semibold tracking-tight">
          good<span className="text-brand-600">food</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                active === item.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-1 pt-6">
          <AccountButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/90">
        <Link href="/" className="text-base font-semibold tracking-tight">
          good<span className="text-brand-600">food</span>
        </Link>
        <AccountButton />
      </header>

      {/* Content — padded bottom on mobile so the tab bar never overlaps */}
      <main className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active === item.href ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
              active === item.href ? "text-brand-600" : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
