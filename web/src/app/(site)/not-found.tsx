import Link from "next/link";
import "@/styles/legacy/legal.css";

export default function NotFound() {
  return (
    <main className="legal-main" style={{ textAlign: "center" }}>
      <h1 className="page-title">404</h1>
      <p className="legal-updated">This page couldn&apos;t be found.</p>
      <p>The quote or page you&apos;re looking for may have moved, or the link might be out of date.</p>
      <p>
        <Link href="/">Go back home</Link> or <Link href="/books">browse all books</Link>.
      </p>
    </main>
  );
}
