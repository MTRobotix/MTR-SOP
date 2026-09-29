import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { store } from "@/lib/store";
import { diffLines } from "@/lib/diff/lines";
import { decide } from "../actions";
import "../../admin.css";

export const metadata = { title: "Review edit" };

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireUser("admin");
  const { id } = await params;
  const { error } = await searchParams;
  const p = await store().getProposal(id);
  if (!p) notFound();
  const lines = diffLines(p.current ?? "", p.content);
  const added = lines.filter((l) => l.kind === "add").length;
  const removed = lines.filter((l) => l.kind === "del").length;

  return (
    <div className="shell page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin/reviews">Review edits</Link> <span aria-hidden="true">›</span>
      </nav>
      <div className="page-head">
        <div>
          <h1>{p.summary}</h1>
          <p>
            <code>content/{p.dept}/{p.slug}.md</code> · {p.author} · {p.current === null ? "new file" : `+${added} −${removed} lines`}
            {p.url && (
              <>
                {" · "}
                <a href={p.url} target="_blank" rel="noreferrer">Pull request</a>
              </>
            )}
          </p>
        </div>
        <div className="review-actions">
          <form action={decide}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="op" value="reject" />
            <button className="btn btn-danger" type="submit">Reject</button>
          </form>
          <form action={decide}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="op" value="approve" />
            <button className="btn btn-primary" type="submit">Approve and publish</button>
          </form>
        </div>
      </div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <pre className="diff" aria-label="Changes">
        {lines.map((l, i) => (
          <span key={i} className={`diff-${l.kind}`}>
            {l.kind === "add" ? "+ " : l.kind === "del" ? "− " : "  "}
            {l.text}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}
