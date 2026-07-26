import Link from "next/link";
import SubscribeForm from "./SubscribeForm";
import Tooltip from "./Tooltip";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-subscribe">
        <p className="footer-subscribe-text">Get a quote in your inbox — no spam, just the good lines.</p>
        <SubscribeForm />
      </div>
      <p className="footer-curator">Hand-picked by Rami Zeke, one book at a time — not AI-generated.</p>
      <p>&copy; 2026 GadZeke — quotes are excerpted from their original books for personal inspiration and commentary.</p>
      <div className="footer-social">
        <Tooltip label="GadZeke on YouTube">
          <a href="https://www.youtube.com/@RamiZeke" target="_blank" rel="noopener" aria-label="GadZeke on YouTube">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M23.5 6.2c-.3-1.1-1.1-1.9-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5c-1.1.3-1.9 1.1-2.2 2.2C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1.1 1.1 1.9 2.2 2.2 1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5c1.1-.3 1.9-1.1 2.2-2.2.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
            </svg>
          </a>
        </Tooltip>
        <Tooltip label="GadZeke on Instagram">
          <a href="https://instagram.com/gadzeke" target="_blank" rel="noopener" aria-label="GadZeke on Instagram">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4.5" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
        </Tooltip>
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
