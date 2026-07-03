"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Me {
  id: string;
  email: string;
  name: string | null;
}

/** Account control (F2): shows the signed-in email + Sign out, or a Sign in link. */
export function AccountButton() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((b) => setMe(b.user ?? null))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.refresh();
    router.push("/");
  }

  if (!loaded) return <div className="h-9" aria-hidden />;

  if (!me) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-9 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[10rem] truncate text-xs text-neutral-500" title={me.email}>
        {me.name ?? me.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="min-h-9 rounded-lg px-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        Sign out
      </button>
    </div>
  );
}
