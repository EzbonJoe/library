"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isFeedbackEligible, markFeedbackDismissed, markFeedbackSubmitted, recordVisit } from "@/lib/feedback";

// Waits well past initial load before even considering the prompt -- this
// is a "how's it going so far" check-in, not something that should compete
// with the page's own content for attention on arrival.
const SHOW_DELAY_MS = 20000;

export default function FeedbackPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    recordVisit();
    if (!isFeedbackEligible()) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    markFeedbackDismissed();
    setVisible(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating === 0) return;

    if (honeypot.trim() !== "") {
      // Same bot-trap convention as SubscribeForm -- pretend success rather
      // than let a scraper learn the submission was rejected.
      markFeedbackSubmitted();
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("feedback").insert({ rating, message: message.trim() || null, page_path: pathname });
    setSubmitting(false);

    markFeedbackSubmitted();
    setSubmitted(true);
    setTimeout(() => setVisible(false), 2500);
  }

  if (!visible) return null;

  return (
    <div className="feedback-prompt" role="dialog" aria-label="Share your feedback">
      <button type="button" className="feedback-prompt-close" aria-label="Dismiss" onClick={handleDismiss}>
        ×
      </button>

      {submitted ? (
        <p className="feedback-prompt-thanks">Thanks for the feedback — it genuinely helps. 🙏</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="feedback-prompt-title">How&apos;s your experience with GadZeke so far?</p>
          <div className="feedback-prompt-stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`feedback-prompt-star ${rating >= value ? "is-filled" : ""}`}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="feedback-prompt-textarea"
            placeholder="Anything we could do better? (optional)"
            value={message}
            maxLength={2000}
            onChange={(event) => setMessage(event.target.value)}
          />
          <input
            type="text"
            name="website"
            className="feedback-prompt-honeypot"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
          <div className="feedback-prompt-actions">
            <button type="button" className="feedback-prompt-later" onClick={handleDismiss}>
              Not now
            </button>
            <button type="submit" className="feedback-prompt-submit" disabled={rating === 0 || submitting}>
              {submitting ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
