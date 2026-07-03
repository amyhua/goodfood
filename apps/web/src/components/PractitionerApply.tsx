"use client";

import { useState } from "react";

const ROLES = [
  { value: "NUTRITIONIST", label: "Nutritionist" },
  { value: "DIETITIAN", label: "Dietitian" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "COACH", label: "Health coach" },
];

/** Practitioner application form (F12). Submits for manual review. */
export function PractitionerApply() {
  const [role, setRole] = useState("DIETITIAN");
  const [roleTitle, setRoleTitle] = useState("");
  const [credentials, setCredentials] = useState("");
  const [bio, setBio] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/practitioners/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, roleTitle, credentials, bio }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? "Could not submit");
      setNote("Submitted — an admin will review your application.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  const field = "min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-base dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Role
        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${field} mt-1`}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <input className={field} placeholder="Title (e.g. Registered Dietitian)" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} required />
      <textarea
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
        rows={2}
        placeholder="Credentials / license number for verification"
        value={credentials}
        onChange={(e) => setCredentials(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
        rows={3}
        placeholder="Short bio shown on your profile"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        required
      />
      <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Submitting…" : "Submit application"}
      </button>
      {note && <p className="text-sm text-neutral-600 dark:text-neutral-400">{note}</p>}
    </form>
  );
}
