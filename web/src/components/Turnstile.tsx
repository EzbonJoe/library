"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type TurnstileHandle = { reset: () => void };

// A Turnstile token is single-use and short-lived server-side -- after any
// failed submit (wrong password, not just a captcha problem), the token
// already spent on that request is dead. Retrying without getting a fresh
// one fails with Cloudflare's "timeout-or-duplicate", even with correct
// credentials the second time. Callers should call ref.reset() on any
// failed submit so the next attempt has a valid token.
const Turnstile = forwardRef<TurnstileHandle, { siteKey: string; onVerify: (token: string) => void }>(
  function Turnstile({ siteKey, onVerify }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
      },
    }));

    useEffect(() => {
      let cancelled = false;

      loadTurnstileScript().then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // The site's dark mode is a manual toggle (data-theme attribute),
        // not tied to prefers-color-scheme, so Turnstile's own "auto" theme
        // (which only follows the OS setting) can't be trusted to match --
        // read the current toggle state directly instead.
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          "expired-callback": () => onVerify(""),
          theme: isDark ? "dark" : "light",
        });
      });

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey]);

    return <div ref={containerRef} />;
  },
);

export default Turnstile;
