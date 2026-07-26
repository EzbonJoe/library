"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (honeypot.trim() !== "") {
      // A real visitor never sees or fills this field — only a bot filling
      // every input blindly would. Pretend success without submitting
      // anything, so it doesn't learn the submission was rejected.
      setEmail("");
      setHoneypot("");
      setIsError(false);
      setStatus("You're on the list — thank you!");
      return;
    }

    setStatus("Subscribing...");
    setIsError(false);

    const supabase = createClient();
    const { error } = await supabase.from("subscribers").insert({ email: email.trim() });

    if (error) {
      setIsError(true);
      setStatus(
        error.code === "23505" ? "You're already subscribed!" : "Something went wrong. Please try again.",
      );
      return;
    }

    setEmail("");
    setStatus("You're on the list — thank you!");
  }

  return (
    <>
      <form className="js-subscribe-form footer-subscribe-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="js-subscribe-email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="text"
          name="website"
          className="js-subscribe-honeypot"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
        <button type="submit">Subscribe</button>
      </form>
      <p className={`js-subscribe-status footer-subscribe-status ${isError ? "is-error" : ""}`}>{status}</p>
    </>
  );
}
