import type { Metadata } from "next";
import Image from "next/image";
import "@/styles/legacy/contact.css";

const description = "Have a quote to share or a question for GadZeke? Get in touch — we'd love to hear from you.";

export const metadata: Metadata = {
  title: "Contact GadZeke",
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact GadZeke", description, url: "/contact" },
  twitter: { title: "Contact GadZeke", description },
};

export default function ContactPage() {
  return (
    <main>
      <h1>Contact GadZeke</h1>
      <h2>Got a quote worth sharing, a question, or just want to say hello?</h2>
      <div className="contact-container">
        <Image src="/icons/gmail-icon.svg" className="gmail-icon" alt="Gmail icon" width={50} height={50} />
        <div className="email-text">Reach out anytime at ramizeke516@gmail.com</div>
      </div>
    </main>
  );
}
