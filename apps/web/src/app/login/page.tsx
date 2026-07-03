import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Sign in — goodfood" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-6 text-lg font-semibold tracking-tight">
        good<span className="text-brand-600">food</span>
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        Access your saved meal plans and shopping lists.
      </p>
      <AuthForm mode="login" />
    </main>
  );
}
