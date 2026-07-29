"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/profile";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import PasswordInput from "@/components/PasswordInput";
import Turnstile, { type TurnstileHandle } from "@/components/Turnstile";
import { TURNSTILE_SITE_KEY } from "@/lib/config";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");

    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      setError("Username must be 3-30 characters: lowercase letters, numbers, - or _ only.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the verification challenge.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (existingProfile) {
      setSubmitting(false);
      setError("That username is already taken.");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: normalizedUsername, display_name: displayName.trim() || null },
        captchaToken,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      // The token just spent on this failed attempt is dead -- without a
      // fresh one, retrying fails with Cloudflare's "timeout-or-duplicate"
      // regardless of whether the resubmitted details are valid.
      setCaptchaToken("");
      turnstileRef.current?.reset();
      return;
    }

    if (data.session && data.user) {
      await ensureProfile(supabase, data.user);
      router.push("/my-quotes");
      return;
    }

    setStatus("Account created! Check your email to confirm it, then log in.");
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-bold">Create an account</h1>
      <p className="mb-6 text-ink-muted">Save the quotes and words you live by — private to you.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-lg border border-line bg-panel px-4 py-3 text-base font-normal text-ink"
            placeholder="e.g. rami"
            required
          />
          {username.trim() && !isValidUsername(normalizeUsername(username)) && (
            <span className="text-xs font-normal text-red-600">
              No spaces or symbols — lowercase letters, numbers, - or _ only. Try &quot;
              {normalizeUsername(username).replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "")}
              &quot; instead. (Full names with spaces go in Display name below.)
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Display name (optional)
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="rounded-lg border border-line bg-panel px-4 py-3 text-base font-normal text-ink"
          />
        </label>
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
          <PasswordInput value={password} onChange={setPassword} minLength={6} required />
        </label>
        <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} />
        <button
          type="submit"
          disabled={submitting || !captchaToken}
          className="mt-2 rounded-full bg-brand px-6 py-3 font-bold text-brand-ink disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {status && <p className="mt-4 text-sm text-brand">{status}</p>}

      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
