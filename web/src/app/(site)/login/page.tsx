"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/profile";
import PasswordInput from "@/components/PasswordInput";
import Turnstile from "@/components/Turnstile";
import { TURNSTILE_SITE_KEY } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (data.user) {
      await ensureProfile(supabase, data.user);
      router.push("/my-quotes");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-bold">Log in</h1>
      <p className="mb-6 text-ink-muted">Welcome back.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-line bg-panel px-4 py-3 text-base font-normal text-ink"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Password
          <PasswordInput value={password} onChange={setPassword} required />
        </label>
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} />
        <button
          type="submit"
          disabled={submitting || !captchaToken}
          className="mt-2 rounded-full bg-brand px-6 py-3 font-bold text-brand-ink disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-ink underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
