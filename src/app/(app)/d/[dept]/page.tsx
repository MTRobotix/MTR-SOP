import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getDepartment, getDoc, listDocs } from "@/lib/content/repo";
import { outline } from "@/lib/content/sections";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import "../doc.css";

export async function generateMetadata({ params }: { params: Promise<{ dept: string }> }) {
  const d = await getDepartment((await params).dept);
  return { title: d?.meta.title ?? "Not found" };
}

export default async function DepartmentPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const d = await getDepartment(dept);
  if (!d) notFound();
  const user = await getCurrentUser();
  const docs = await Promise.all((await listDocs(dept)).map((s) => getDoc(dept, s.slug)));

  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">›</span>
          </nav>
          <h1>{d.meta.title}</h1>
          <p>{d.meta.summary}</p>
        </div>
        {user && hasRole(user.role, "admin") && (
          <Link href={`/d/${dept}/new`} className="btn btn-primary">
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" /> New section
          </Link>
        )}
      </div>

      {docs.length === 0 && <p className="notice">No sections yet.</p>}
      <ul className="doc-list">
        {docs.map(
          (doc) =>
            doc && (
              <li key={doc.slug} className="doc-item card">
                <h2>
                  <Link href={`/d/${dept}/${doc.slug}`}>{doc.meta.title}</Link>
                </h2>
                <p className="doc-item-summary">{doc.meta.summary}</p>
                <ul className="jump-list" aria-label={`Jump into ${doc.meta.title}`}>
                  {outline(doc.sections).map((s) => (
                    <li key={s.id}>
                      <Link href={`/d/${dept}/${doc.slug}#${s.id}`} className="tag jump">
                        {s.heading}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ),
        )}
      </ul>
    </div>
  );
}
