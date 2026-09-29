import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getDepartment, getDoc } from "@/lib/content/repo";
import { outline } from "@/lib/content/sections";
import { renderMarkdown } from "@/lib/content/render";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import "../../doc.css";

type P = { params: Promise<{ dept: string; slug: string }> };

export async function generateMetadata({ params }: P) {
  const { dept, slug } = await params;
  const doc = await getDoc(dept, slug);
  return { title: doc?.meta.title ?? "Not found" };
}

export default async function DocPage({ params }: P) {
  const { dept, slug } = await params;
  const [d, doc, user] = await Promise.all([getDepartment(dept), getDoc(dept, slug), getCurrentUser()]);
  if (!d || !doc) notFound();
  const html = await renderMarkdown(doc.body);
  const toc = outline(doc.sections);

  return (
    <div className="shell page">
      <div className="doc-layout">
        <article className="doc">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">›</span> <Link href={`/d/${dept}`}>{d.meta.title}</Link>
          </nav>
          <div className="doc-head">
            <h1>{doc.meta.title}</h1>
            {user && hasRole(user.role, "editor") && (
              <Link href={`/d/${dept}/${slug}/edit`} className="btn">
                <Pencil size={16} strokeWidth={1.5} aria-hidden="true" /> Edit
              </Link>
            )}
          </div>
          <p className="doc-summary">{doc.meta.summary}</p>
          <p className="doc-meta">
            Owner: {doc.meta.owner} · Updated {doc.meta.updated}
            {doc.meta.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </p>
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
        {toc.length > 1 && (
          <aside className="toc" aria-label="On this page">
            <p className="toc-title">On this page</p>
            <ul>
              {toc.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.heading}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
