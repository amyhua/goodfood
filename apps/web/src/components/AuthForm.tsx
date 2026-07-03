"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Email/password auth form (F2), shared by /login and /signup. Mobile-first: full-width
 * ≥44px fields and button. Client-side required/length hints; the server is the source of
 * truth for validation and error messages.
 */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isSignup ? { email, name: name || undefined, password } : { email, password },
        ),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Something went wrong");
      router.refresh();
      router.push("/plans");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-neutral-300 px-4 text-base outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {isSignup && (
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-neutral-300 px-4 text-base outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      )}

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-neutral-300 px-4 text-base outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {isSignup && <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
      </button>

      <p className="text-sm text-neutral-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 underline underline-offset-2">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-brand-600 underline underline-offset-2">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
