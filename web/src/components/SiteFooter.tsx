import Link from "next/link";
import SubscribeForm from "./SubscribeForm";
import Tooltip from "./Tooltip";

type SiteFooterProps = {
  curatorText?: string;
  copyrightText?: string;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
};

export default function SiteFooter({
  curatorText = "Hand-picked by Rami Zeke, one book at a time — not AI-generated.",
  copyrightText = "© 2026 GadZeke — quotes are excerpted from their original books for personal inspiration and commentary.",
  youtubeUrl = "https://www.youtube.com/@RamiZeke",
  instagramUrl = "https://instagram.com/gadzeke",
  twitterUrl = null,
  facebookUrl = null,
}: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-subscribe">
        <p className="footer-subscribe-text">Get a quote in your inbox — no spam, just the good lines.</p>
        <SubscribeForm />
      </div>
      <p className="footer-curator">{curatorText}</p>
      <p>{copyrightText}</p>
      <div className="footer-social">
        {youtubeUrl && (
          <Tooltip label="GadZeke on YouTube">
            <a href={youtubeUrl} target="_blank" rel="noopener" aria-label="GadZeke on YouTube">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2c-.3-1.1-1.1-1.9-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5c-1.1.3-1.9 1.1-2.2 2.2C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1.1 1.1 1.9 2.2 2.2 1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5c1.1-.3 1.9-1.1 2.2-2.2.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
              </svg>
            </a>
          </Tooltip>
        )}
        {instagramUrl && (
          <Tooltip label="GadZeke on Instagram">
            <a href={instagramUrl} target="_blank" rel="noopener" aria-label="GadZeke on Instagram">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
          </Tooltip>
        )}
        {twitterUrl && (
          <Tooltip label="GadZeke on X">
            <a href={twitterUrl} target="_blank" rel="noopener" aria-label="GadZeke on X">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.2l-5.6-7.3L4 22H1l8.1-9.3L0.9 2h7.4l5.1 6.7L18.9 2zm-1.3 18h2L6.5 4h-2l13.1 16z" />
              </svg>
            </a>
          </Tooltip>
        )}
        {facebookUrl && (
          <Tooltip label="GadZeke on Facebook">
            <a href={facebookUrl} target="_blank" rel="noopener" aria-label="GadZeke on Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
              </svg>
            </a>
          </Tooltip>
        )}
      </div>
      <div className="footer-links">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
      </div>
    </footer>
  );
}
