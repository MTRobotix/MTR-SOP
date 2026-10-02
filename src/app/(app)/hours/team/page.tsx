import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { customNames, report } from "@/lib/work/hours";
import { listActivePeople, listProjects } from "@/lib/work/projects";
import { filterQuery, parseReportFilter, type FilterParams } from "@/lib/work/filters";
import { formatDate, formatHours } from "@/lib/work/shared";
import { promote } from "./actions";
import "@/components/work/work.css";
import "../hours.css";

export const metadata = { title: "Team hours" };

/** Most entries shown on the page; the CSV has all of them. */
const SHOW = 300;

type Sum = { key: string; label: string; sub?: string; hours: number; href: string };

function sumBy<T>(items: T[], key: (x: T) => string, make: (x: T) => Omit<Sum, "hours">, hours: (x: T) => number): Sum[] {
  const map = new Map<string, Sum>();
  for (const x of items) {
    const k = key(x);
    const s = map.get(k) ?? { ...make(x), hours: 0 };
    s.hours += hours(x);
    map.set(k, s);
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours || a.label.localeCompare(b.label));
}

export default async function TeamHoursPage({ searchParams }: { searchParams: Promise<FilterParams & { done?: string; error?: string }> }) {
  await requireUser("admin");
  const params = await searchParams;
  const f = parseReportFilter(params);
  const [entries, people, projects, custom] = await Promise.all([report(f), listActivePeople(), listProjects(), customNames()]);
  const qs = filterQuery(f);
  const total = entries.reduce((s, e) => s + e.hours, 0);
  const year = f.to.slice(0, 4);
  const link = (patch: Partial<Record<"user" | "project", string>>) => {
    const q = new URLSearchParams(qs);
    for (const [k, v] of Object.entries(patch)) q.set(k, v!);
    return `/hours/team?${q}`;
  };

  const byPerson = sumBy(
    entries,
    (e) => String(e.userId),
    (e) => ({ key: String(e.userId), label: e.person, href: link({ user: String(e.userId) }) }),
    (e) => e.hours,
  );
  const byProject = sumBy(
    entries,
    (e) => (e.projectId !== null ? `p${e.projectId}` : `c${e.project.toLowerCase()}`),
    (e) => ({
      key: e.projectId !== null ? `p${e.projectId}` : `c${e.project}`,
      label: e.project,
      sub: e.projectId === null ? "custom" : e.customer,
      href: e.projectId !== null ? link({ project: String(e.projectId) }) : link({ project: "custom" }),
    }),
    (e) => e.hours,
  );

  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/hours">Hours</Link> <span aria-hidden="true">›</span>
          </nav>
          <h1>Team hours</h1>
          <p>Everyone&apos;s logged hours. Filter, then download the entries as CSV.</p>
        </div>
        <a className="btn" href={`/api/hours/export?${qs}`} download>
          <Download size={16} strokeWidth={1.5} aria-hidden="true" /> Download CSV
        </a>
      </div>

      {params.done && (
        <p className="notice" role="status" style={{ marginBottom: "var(--space-5)" }}>
          {params.done}
        </p>
      )}
      {params.error && (
        <p className="notice notice-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
          {params.error}
        </p>
      )}

      <form className="card report-filters" method="get" action="/hours/team">
        <div>
          <label className="label" htmlFor="f-from">
            From
          </label>
          <input className="input" id="f-from" name="from" type="date" defaultValue={f.from} required />
        </div>
        <div>
          <label className="label" htmlFor="f-to">
            To
          </label>
          <input className="input" id="f-to" name="to" type="date" defaultValue={f.to} required />
        </div>
        <div>
          <label className="label" htmlFor="f-user">
            Person
          </label>
          <select className="input" id="f-user" name="user" defaultValue={f.userId ?? ""}>
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-project">
            Project
          </label>
          <select className="input" id="f-project" name="project" defaultValue={f.project ?? ""}>
            <option value="">All projects</option>
            <option value="custom">Typed names only</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">
            Apply
          </button>
          <Link className="btn" href="/hours/team">
            Reset
          </Link>
        </div>
      </form>

      <ul className="stat-row" aria-label="Totals for the filter">
        <li className="stat card">
          <span className="stat-label">Hours</span>
          <span className="stat-value">{formatHours(total)}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">People</span>
          <span className="stat-value">{byPerson.length}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">Projects and names</span>
          <span className="stat-value">{byProject.length}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">Days</span>
          <span className="stat-value">{new Set(entries.map((e) => e.date)).size}</span>
        </li>
      </ul>

      {entries.length === 0 ? (
        <p className="empty" style={{ marginBottom: "var(--space-6)" }}>
          No hours logged between {formatDate(f.from)} and {formatDate(f.to)} for this filter.
        </p>
      ) : (
        <>
          <div className="report-grid">
            <section className="card report-section" aria-labelledby="by-person">
              <h2 id="by-person">By person</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col" className="num">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byPerson.map((s) => (
                    <tr key={s.key}>
                      <td>
                        <Link href={s.href}>{s.label}</Link>
                      </td>
                      <td className="num">{formatHours(s.hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card report-section" aria-labelledby="by-project">
              <h2 id="by-project">By project</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col" className="num">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byProject.map((s) => (
                    <tr key={s.key}>
                      <td>
                        <Link href={s.href}>{s.label}</Link>
                        {s.sub && <span className="tag">{s.sub}</span>}
                      </td>
                      <td className="num">{formatHours(s.hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section className="report-entries" aria-labelledby="entries">
            <h2 id="entries">Entries</h2>
            <div className="table-wrap card">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Person</th>
                    <th scope="col">Project</th>
                    <th scope="col" className="num">
                      Hours
                    </th>
                    <th scope="col">Week note</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, SHOW).map((e) => (
                    <tr key={`${e.date}-${e.userId}-${e.projectId ?? e.project}`}>
                      <td className="nowrap">{formatDate(e.date, year)}</td>
                      <td>{e.person}</td>
                      <td>
                        {e.project}
                        {e.projectId === null && <span className="tag">custom</span>}
                      </td>
                      <td className="num">{formatHours(e.hours)}</td>
                      <td className="hint">{e.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {entries.length > SHOW && (
              <p className="hint" style={{ marginTop: "var(--space-2)" }}>
                Showing the first {SHOW} of {entries.length} entries. Download the CSV for all of them.
              </p>
            )}
          </section>
        </>
      )}

      <section className="custom-names" aria-labelledby="custom">
        <h2 id="custom">Typed names</h2>
        <p className="hint">
          Work people logged under a name that is not a project, all time. Turn a name into a project: its hours move there and the people who logged
          it become contributors.
        </p>
        {custom.length === 0 ? (
          <p className="empty">No typed names. Everyone logged hours on projects.</p>
        ) : (
          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Logged by</th>
                  <th scope="col" className="num">
                    Hours
                  </th>
                  <th scope="col">Turn into a project</th>
                </tr>
              </thead>
              <tbody>
                {custom.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{c.people}</td>
                    <td className="num">{formatHours(c.hours)}</td>
                    <td>
                      <form action={promote} className="promote-form">
                        <input type="hidden" name="name" value={c.name} />
                        <input type="hidden" name="back" value={qs} />
                        <select className="input" name="target" defaultValue="new" aria-label={`Project for ${c.name}`}>
                          <option value="new">New project “{c.name}”</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              Move to {p.name}
                            </option>
                          ))}
                        </select>
                        <button className="btn" type="submit">
                          Apply
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
