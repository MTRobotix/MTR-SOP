import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { store } from "@/lib/store";
import "../admin.css";

export const metadata = { title: "Review edits" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await requireUser("admin");
  const { done } = await searchParams;
  const proposals = await store().listProposals();
  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <h1>Review edits</h1>
          <p>Edits from editors. Approve to publish to main, or reject.</p>
        </div>
      </div>
      {done && <p className="notice" role="status">{done}</p>}
      {proposals.length === 0 ? (
        <p className="notice">No edits waiting for review.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Change</th><th>Section</th><th>Author</th><th>Sent</th></tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/reviews/${p.id}`}>{p.summary}</Link></td>
                  <td><code>{p.dept}/{p.slug}</code></td>
                  <td>{p.author}</td>
                  <td>{p.createdAt.slice(0, 16).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
