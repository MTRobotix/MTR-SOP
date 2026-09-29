import Link from "next/link";

export const metadata = { title: "No access" };

export default function Forbidden() {
  return (
    <main className="shell page">
      <h1>No access</h1>
      <p style={{ marginTop: "var(--space-3)" }}>Your role cannot open this page. Ask an admin to change your role.</p>
      <p style={{ marginTop: "var(--space-5)" }}>
        <Link className="btn" href="/">Back to home</Link>
      </p>
    </main>
  );
}
