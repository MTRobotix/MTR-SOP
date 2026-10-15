"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Entry, ProjectOption } from "@/lib/work/hours";
import { addDays, formatDate, formatHours, formatWeek, formatWeekday, weekDays } from "@/lib/work/shared";
import { LogForm } from "./LogForm";
import { EntryItem } from "./EntryItem";

type Props = {
  monday: string;
  thisMonday: string;
  today: string;
  entries: Entry[];
  projects: ProjectOption[];
  initialDay: string;
  initialProjectId: number | null;
};

const sum = (list: { hours: number }[]) => list.reduce((s, e) => s + e.hours, 0);

/**
 * The timecard: week strip of days on top (pick a day), project panel on the left (pick a project),
 * the picked day in the middle (its entries and the log form), and the week grid underneath.
 */
export function Timecard({ monday, thisMonday, today, entries, projects, initialDay, initialProjectId }: Props) {
  const days = useMemo(() => weekDays(monday), [monday]);
  const year = today.slice(0, 4);
  const [day, setDay] = useState(initialDay);
  const mine = projects.filter((p) => p.mine);
  const [projectId, setProjectId] = useState(String(initialProjectId ?? mine[0]?.id ?? ""));
  const [search, setSearch] = useState("");

  const byDay = useMemo(() => new Map(days.map((d) => [d, entries.filter((e) => e.date === d)])), [days, entries]);
  const weekByProject = useMemo(() => {
    const m = new Map<number, number>();
    for (const e of entries) if (e.projectId) m.set(e.projectId, (m.get(e.projectId) ?? 0) + e.hours);
    return m;
  }, [entries]);
  const total = sum(entries);
  const dayEntries = byDay.get(day) ?? [];
  const dayLabel = day === today ? "today" : `${formatWeekday(day)} ${formatDate(day, year)}`;
  const isThisWeek = monday === thisMonday;

  const q = search.trim().toLowerCase();
  const shown = projects.filter((p) => !q || `${p.code} ${p.name} ${p.customer}`.toLowerCase().includes(q));
  // Week grid rows: every project (or old typed name) with hours this week, in first-logged order.
  const rows = useMemo(() => {
    const out: { key: string; code: string; label: string; projectId: number | null; hours: number[] }[] = [];
    for (const e of entries) {
      const key = e.projectId ? `p${e.projectId}` : `c${e.label}`;
      let row = out.find((r) => r.key === key);
      if (!row) out.push((row = { key, code: e.code, label: e.label, projectId: e.projectId, hours: Array(7).fill(0) }));
      row.hours[days.indexOf(e.date)] += e.hours;
    }
    return out;
  }, [entries, days]);

  return (
    <div className="timecard">
      {/* Week bar and day strip (the Dayforce-style panel of the week). */}
      <section className="card week-bar" aria-label="Week">
        <div className="week-bar-head">
          <nav className="week-nav" aria-label="Change week">
            <Link className="btn btn-icon" href={`/hours?week=${addDays(monday, -7)}`} aria-label="Previous week">
              <ChevronLeft size={18} strokeWidth={1.5} />
            </Link>
            <span className="week-range">{formatWeek(monday)}</span>
            {isThisWeek ? (
              <span className="btn btn-icon is-disabled" aria-hidden="true">
                <ChevronRight size={18} strokeWidth={1.5} />
              </span>
            ) : (
              <Link className="btn btn-icon" href={`/hours?week=${addDays(monday, 7)}`} aria-label="Next week">
                <ChevronRight size={18} strokeWidth={1.5} />
              </Link>
            )}
            {!isThisWeek && (
              <Link className="btn btn-sm" href="/hours">
                This week
              </Link>
            )}
          </nav>
          <p className="week-total">
            Week <strong>{formatHours(total)}</strong> h
          </p>
        </div>
        <ol className="day-strip">
          {days.map((d) => {
            const h = sum(byDay.get(d) ?? []);
            return (
              <li key={d}>
                <button
                  type="button"
                  className={`day-tile${d === today ? " is-today" : ""}${d > today ? " is-future" : ""}`}
                  aria-pressed={d === day}
                  aria-label={`${formatWeekday(d)} ${formatDate(d, year)}: ${formatHours(h)} hours${d === today ? ", today" : ""}`}
                  onClick={() => setDay(d)}
                >
                  <span className="day-name">{formatWeekday(d)}</span>
                  <span className="day-date">{Number(d.slice(8))}</span>
                  <span className="day-hours">{h ? `${formatHours(h)} h` : "–"}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="timecard-body">
        {/* Project panel (SAP-style list of assignments). */}
        <section className="card project-panel" aria-labelledby="pp-title">
          <h2 id="pp-title" className="card-title">
            Projects
          </h2>
          <div className="pp-search">
            <Search size={16} strokeWidth={1.5} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="pp-q">
              Find a project
            </label>
            <input className="input" id="pp-q" type="search" placeholder="Code or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {shown.length === 0 ? (
            <p className="hint">No project matches “{search}”.</p>
          ) : (
            <ul className="pp-list">
              {shown.map((p, i) => (
                <li key={p.id}>
                  {(i === 0 || shown[i - 1].mine !== p.mine) && <p className="pp-group">{p.mine ? "Your projects" : "Other projects"}</p>}
                  <button type="button" className="pp-item" aria-pressed={String(p.id) === projectId} onClick={() => setProjectId(String(p.id))}>
                    <span className="pp-main">
                      <span className="pp-code">{p.code || "—"}</span>
                      <span className="pp-name">{p.name}</span>
                      {p.customer && <span className="pp-customer">{p.customer}</span>}
                    </span>
                    <span className="pp-hours">{weekByProject.get(p.id) ? `${formatHours(weekByProject.get(p.id)!)} h` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* The picked day: what is logged, and the form to add one more entry. */}
        <section className="card day-panel" aria-labelledby="dp-title">
          <div className="day-panel-head">
            <h2 id="dp-title" className="card-title">
              {day === today ? "Today" : formatWeekday(day)} · {formatDate(day, year)}
            </h2>
            <span className="day-panel-total">{formatHours(sum(dayEntries))} h</span>
          </div>
          {dayEntries.length === 0 ? (
            <p className="hint">Nothing logged on this day.</p>
          ) : (
            <ul className="entries">
              {dayEntries.map((e) => (
                <EntryItem key={`${e.rowId}-${e.date}`} e={e} />
              ))}
            </ul>
          )}
          <LogForm key={day} projects={projects} date={day} dayLabel={dayLabel} future={day > today} projectId={projectId} onProject={setProjectId} />
        </section>
      </div>

      {/* Week grid (SAP CATS-style): projects by day, read only. Click a day column to open it. */}
      <section className="card week-grid" aria-labelledby="wg-title">
        <h2 id="wg-title" className="card-title">
          Week overview
        </h2>
        {rows.length === 0 ? (
          <p className="hint">Nothing logged this week yet.</p>
        ) : (
          <div className="wg-scroll">
            <table className="wg-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  {days.map((d) => (
                    <th key={d} scope="col" className={`num${d === day ? " is-picked" : ""}`}>
                      <button type="button" className="wg-day" onClick={() => setDay(d)} aria-label={`Open ${formatWeekday(d)} ${formatDate(d, year)}`}>
                        {formatWeekday(d)} {Number(d.slice(8))}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="num">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">
                      {r.code && <span className="pp-code">{r.code}</span>} {r.label}
                    </th>
                    {r.hours.map((h, i) => (
                      <td key={days[i]} className={`num${days[i] === day ? " is-picked" : ""}${h ? "" : " is-zero"}`}>
                        {h ? formatHours(h) : "–"}
                      </td>
                    ))}
                    <td className="num">
                      <strong>{formatHours(sum(r.hours.map((hours) => ({ hours }))))}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Day total</th>
                  {days.map((d) => (
                    <td key={d} className={`num${d === day ? " is-picked" : ""}${sum(byDay.get(d) ?? []) ? "" : " is-zero"}`}>
                      {sum(byDay.get(d) ?? []) ? formatHours(sum(byDay.get(d) ?? [])) : "–"}
                    </td>
                  ))}
                  <td className="num">
                    <strong>{formatHours(total)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
