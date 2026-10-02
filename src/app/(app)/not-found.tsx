import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell page">
      <h1>Not found</h1>
      <p style={{ marginTop: "var(--space-3)" }}>This page does not exist or was moved.</p>
      <p style={{ marginTop: "var(--space-5)" }}>
        <Link className="btn" href="/">Back to home</Link>
      </p>
    </div>
  );
}
