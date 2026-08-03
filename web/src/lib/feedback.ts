// Local, no-account signal for when to offer the feedback prompt -- mirrors
// the localStorage conventions in bookBookmarks.ts/recentlyViewed.ts. A
// visitor is only asked once they've shown some return engagement (not on
// their very first page load), and never again once they've submitted, or
// for 30 days after dismissing.
const SUBMITTED_KEY = "gadzeke-feedback-submitted";
const DISMISSED_AT_KEY = "gadzeke-feedback-dismissed-at";
const VISIT_COUNT_KEY = "gadzeke-feedback-visit-count";
const SESSION_COUNTED_KEY = "gadzeke-feedback-session-counted";

const VISIT_THRESHOLD = 3;
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

// sessionStorage flag so a single browsing session (many page loads) only
// bumps the persistent counter once, not once per page navigated to.
export function recordVisit() {
  if (sessionStorage.getItem(SESSION_COUNTED_KEY)) return;
  sessionStorage.setItem(SESSION_COUNTED_KEY, "true");
  const count = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? "0") + 1;
  localStorage.setItem(VISIT_COUNT_KEY, String(count));
}

export function isFeedbackEligible(): boolean {
  if (localStorage.getItem(SUBMITTED_KEY)) return false;

  const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) ?? "0");
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return false;

  const visits = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? "0");
  return visits >= VISIT_THRESHOLD;
}

export function markFeedbackSubmitted() {
  localStorage.setItem(SUBMITTED_KEY, "true");
}

export function markFeedbackDismissed() {
  localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
}
