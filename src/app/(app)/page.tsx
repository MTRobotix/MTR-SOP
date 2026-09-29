import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listDepartments, listDocs } from "@/lib/content/repo";
import { search } from "@/lib/search";
import { SearchBox } from "@/components/SearchBox";
import { AnswerBubble } from "@/components/AnswerBubble";
import "./home.css";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 200);
  const hits = query ? await search(query) : [];
  const depts = await Promise.all(
    (await listDepartments()).map(async (d) => {
      const docs = await listDocs(d.id);
      return { ...d, featured: docs.filter((x) => x.meta.featured), count: docs.length };
    }),
  );

  return (
    <div className="shell page home">
      <section className="home-hero">
        <h1>Standard operating procedures</h1>
        <p className="home-lead">Search a task, or open a department.</p>
        <SearchBox key={query} initial={query} />
      </section>

      {query && (
        <section className="home-results" aria-label="Search results">
          <AnswerBubble key={query} q={query} />
          <h2 className="section-title">
            {hits.length ? `${hits.length} section${hits.length === 1 ? "" : "s"} for “${query}”` : `No sections match “${query}”`}
          </h2>
          <ul className="results">
            {hits.map((h) => (
              <li key={h.id} className="result">
                <Link href={h.href} className="result-link">
                  <span className="result-path">
                    {h.deptTitle} › {h.docTitle}
                  </span>
                  <span className="result-title">{h.heading}</span>
                  <span className="result-snippet">{h.snippet}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="dept-title">
        <h2 className="section-title" id="dept-title">
          Departments
        </h2>
        <div className="dept-grid">
          {depts.map((d) => (
            <article key={d.id} className="dept-card card">
              <h3>
                <Link href={`/d/${d.id}`}>{d.meta.title}</Link>
              </h3>
              <p className="dept-summary">{d.meta.summary}</p>
              {d.featured.length > 0 && (
                <ul className="dept-featured" aria-label={`${d.meta.title} quick links`}>
                  {d.featured.map((doc) => (
                    <li key={doc.slug}>
                      <Link href={`/d/${d.id}/${doc.slug}`}>{doc.meta.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/d/${d.id}`} className="dept-all">
                All {d.count} section{d.count === 1 ? "" : "s"} <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
