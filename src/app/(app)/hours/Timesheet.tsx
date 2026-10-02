"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CopyPlus, Plus, X } from "lucide-react";
import type { ProjectOption, SheetRow } from "@/lib/work/hours";
import {
  addDays,
  cleanName,
  formatDate,
  formatHours,
  formatWeek,
  formatWeekday,
  parseHours,
  weekDays,
  MAX_DAY_HOURS,
  MAX_ROWS_PER_WEEK,
} from "@/lib/work/shared";
import { saveTimesheet } from "./actions";

type Line = {
  key: string;
  projectId: number | null;
  customName: string | null;
  label: string;
  customer: string;
  note: string;
  /** What the person typed in each day cell, Monday first. */
  cells: string[];
};

type Props = {
  monday: string;
  thisMonday: string;
  today: string;
  initialRows: SheetRow[];
  previous: SheetRow[];
  options: ProjectOption[];
};

const keyOf = (projectId: number | null, customName: string | null) => (projectId !== null ? `p${projectId}` : `c${customName!.toLowerCase()}`);

function toLines(rows: SheetRow[]): Line[] {
  return rows.map((r) => ({
    key: keyOf(r.projectId, r.customName),
    projectId: r.projectId,
    customName: r.customName,
    label: r.label,
    customer: r.customer,
    note: r.note,
    cells: r.hours.map((h) => (h ? formatHours(h) : "")),
  }));
}

/** Comparable form of the sheet, to tell whether anything changed since the last save. */
const snapshot = (lines: Line[]) =>
  JSON.stringify(lines.map((l) => [l.key, l.note.trim(), l.cells.map((c) => parseHours(c) ?? c)]));

export function Timesheet({ monday, thisMonday, today, initialRows, previous, options }: Props) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => toLines(initialRows));
  const [saved, setSaved] = useState(() => snapshot(toLines(initialRows)));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pick, setPick] = useState("");
  const [customName, setCustomName] = useState("");
  const [pending, startTransition] = useTransition();

  const days = weekDays(monday);
  const year = days[6].slice(0, 4);
  const dirty = snapshot(lines) !== saved;

  const parsed = useMemo(() => lines.map((l) => l.cells.map(parseHours)), [lines]);
  const invalid = parsed.some((row) => row.some((h) => h === null));
  const rowTotals = parsed.map((row) => row.reduce<number>((s, h) => s + (h ?? 0), 0));
  const dayTotals = days.map((_, i) => parsed.reduce((s, row) => s + (row[i] ?? 0), 0));
  const weekTotal = dayTotals.reduce((s, h) => s + h, 0);
  const overDay = dayTotals.findIndex((h) => h > MAX_DAY_HOURS);

  // Warn before leaving with unsaved hours: closing the tab, or following any link in the app.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (!window.confirm("Leave without saving? Your changes to this week are lost.")) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const goToWeek = (target: string) => {
    if (dirty && !window.confirm("Leave without saving? Your changes to this week are lost.")) return;
    router.push(target === thisMonday ? "/hours" : `/hours?week=${target}`);
  };

  const update = (key: string, change: (l: Line) => Line) => {
    setMessage(null);
    setLines((ls) => ls.map((l) => (l.key === key ? change(l) : l)));
  };

  const taken = new Set(lines.map((l) => l.key));
  const mine = options.filter((o) => o.mine);
  const others = options.filter((o) => !o.mine);
  const missingFromLastWeek = previous.filter((r) => !taken.has(keyOf(r.projectId, r.customName)));

  const addLine = (line: Omit<Line, "key" | "cells">) => {
    const key = keyOf(line.projectId, line.customName);
    if (taken.has(key)) return setMessage({ ok: false, text: `${line.label} is already on this week.` });
    if (lines.length >= MAX_ROWS_PER_WEEK) return setMessage({ ok: false, text: `A week holds at most ${MAX_ROWS_PER_WEEK} rows.` });
    setMessage(null);
    setLines((ls) => [...ls, { ...line, key, cells: Array(7).fill("") }]);
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pick === "custom") {
      const name = cleanName(customName);
      if (!name) return setMessage({ ok: false, text: "Type a name for the work." });
      // A typed name that matches a project in the list is that project.
      const match = options.find((o) => o.name.toLowerCase() === name.toLowerCase());
      if (match) addLine({ projectId: match.id, customName: null, label: match.name, customer: match.customer, note: "" });
      else addLine({ projectId: null, customName: name, label: name, customer: "", note: "" });
      setCustomName("");
    } else if (pick) {
      const o = options.find((x) => `p${x.id}` === pick);
      if (o) addLine({ projectId: o.id, customName: null, label: o.name, customer: o.customer, note: "" });
    }
    setPick("");
  };

  const addLastWeek = () => {
    setMessage(null);
    setLines((ls) => [...ls, ...toLines(missingFromLastWeek)].slice(0, MAX_ROWS_PER_WEEK));
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || overDay >= 0) return;
    const rows = lines.map((l, i) => ({ projectId: l.projectId, customName: l.customName, note: l.note, hours: parsed[i].map((h) => h ?? 0) }));
    startTransition(async () => {
      try {
        const res = await saveTimesheet(monday, rows);
        if (res.error || !res.rows) return setMessage({ ok: false, text: res.error ?? "Save failed. Try again." });
        const fresh = toLines(res.rows);
        setLines(fresh);
        setSaved(snapshot(fresh));
        setMessage({ ok: true, text: `Saved ${formatHours(weekTotal)} h for ${formatWeek(monday)}.` });
      } catch {
        setMessage({ ok: false, text: "Save failed: no connection to the server. Try again." });
      }
    });
  };

  return (
    <div className="sheet">
      <div className="sheet-bar">
        <div className="sheet-nav" role="group" aria-label="Week">
          <button type="button" className="btn btn-icon" aria-label="Previous week" onClick={() => goToWeek(addDays(monday, -7))}>
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button type="button" className="btn" disabled={monday === thisMonday} onClick={() => goToWeek(thisMonday)}>
            This week
          </button>
          <button type="button" className="btn btn-icon" aria-label="Next week" onClick={() => goToWeek(addDays(monday, 7))}>
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
          <p className="sheet-week">{formatWeek(monday)}</p>
        </div>
        <p className="sheet-total">
          <span className="num">{formatHours(weekTotal)}</span> h this week
        </p>
      </div>

      <form id="sheet-form" onSubmit={onSave}>
        {lines.length === 0 ? (
          <p className="empty">No projects on this week yet. Add one below.</p>
        ) : (
          <div className="table-wrap sheet-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th scope="col" className="sheet-project">
                    Project
                  </th>
                  {days.map((d) => (
                    <th key={d} scope="col" className={`sheet-day${d === today ? " is-today" : ""}`}>
                      <span>{d === today ? "Today" : formatWeekday(d)}</span>
                      <span className="sheet-date">{formatDate(d, year)}</span>
                    </th>
                  ))}
                  <th scope="col" className="num">
                    Total
                  </th>
                  <th scope="col">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, r) => (
                  <tr key={l.key}>
                    <th scope="row" className="sheet-project">
                      <div className="sheet-project-inner">
                        <span className="sheet-name">
                          {l.label}
                          {l.projectId === null && <span className="tag">custom</span>}
                        </span>
                        {l.customer && <span className="hint">{l.customer}</span>}
                        <input
                          className="input sheet-note"
                          value={l.note}
                          maxLength={200}
                          placeholder="Note (optional)"
                          aria-label={`Note for ${l.label}`}
                          onChange={(e) => update(l.key, (x) => ({ ...x, note: e.target.value }))}
                        />
                      </div>
                    </th>
                    {days.map((d, i) => (
                      <td key={d} className={d === today ? "is-today" : undefined}>
                        <input
                          className="sheet-cell"
                          inputMode="decimal"
                          autoComplete="off"
                          value={l.cells[i]}
                          aria-label={`${l.label}, ${formatWeekday(d)} ${formatDate(d, year)}, hours`}
                          aria-invalid={parsed[r][i] === null || undefined}
                          onChange={(e) => update(l.key, (x) => ({ ...x, cells: x.cells.map((c, j) => (j === i ? e.target.value : c)) }))}
                          onBlur={() => {
                            // Tidy "1,5" and "1:30" into "1.5" once the cell is left.
                            const h = parseHours(l.cells[i]);
                            if (h !== null) update(l.key, (x) => ({ ...x, cells: x.cells.map((c, j) => (j === i ? (h ? formatHours(h) : "") : c)) }));
                          }}
                        />
                      </td>
                    ))}
                    <td className="num">{formatHours(rowTotals[r])}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-icon sheet-remove"
                        aria-label={`Remove ${l.label}`}
                        onClick={() => {
                          setMessage(null);
                          setLines((ls) => ls.filter((x) => x.key !== l.key));
                        }}
                      >
                        <X size={16} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="sheet-project">
                    Day total
                  </th>
                  {dayTotals.map((h, i) => (
                    <td key={days[i]} className={`num${days[i] === today ? " is-today" : ""}${h > MAX_DAY_HOURS ? " is-over" : ""}${h === 0 ? " is-zero" : ""}`}>
                      {formatHours(h)}
                    </td>
                  ))}
                  <td className="num">
                    <strong>{formatHours(weekTotal)}</strong>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </form>

      <form className="sheet-add" onSubmit={onAdd}>
        <div className="sheet-add-field">
          <label className="label" htmlFor="sheet-pick">
            Add a row
          </label>
          <select id="sheet-pick" className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Pick a project…</option>
            {mine.length > 0 && (
              <optgroup label="Your projects">
                {mine.map((o) => (
                  <option key={o.id} value={`p${o.id}`} disabled={taken.has(`p${o.id}`)}>
                    {o.name}
                    {o.customer ? ` · ${o.customer}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
            {others.length > 0 && (
              <optgroup label={mine.length ? "Other projects" : "Projects"}>
                {others.map((o) => (
                  <option key={o.id} value={`p${o.id}`} disabled={taken.has(`p${o.id}`)}>
                    {o.name}
                    {o.customer ? ` · ${o.customer}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
            <option value="custom">Not in the list — type a name</option>
          </select>
          {options.length === 0 && <p className="hint">No projects yet. Admins add them under Projects; until then, type a name.</p>}
        </div>
        {pick === "custom" && (
          <div className="sheet-add-field">
            <label className="label" htmlFor="sheet-custom">
              Name of the work
            </label>
            <input
              id="sheet-custom"
              className="input"
              value={customName}
              maxLength={80}
              autoFocus
              placeholder="e.g. Trade show prep"
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
        )}
        <div className="form-actions">
          <button type="submit" className="btn" disabled={!pick}>
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" /> Add row
          </button>
          {missingFromLastWeek.length > 0 && (
            <button type="button" className="btn" onClick={addLastWeek}>
              <CopyPlus size={16} strokeWidth={1.5} aria-hidden="true" /> Add last week&apos;s {missingFromLastWeek.length === 1 ? "project" : `${missingFromLastWeek.length} projects`}
            </button>
          )}
        </div>
      </form>

      <div className="sheet-save">
        {invalid && (
          <p className="notice notice-error" role="alert">
            Some cells are not hours. Use numbers like 1.5 or 1:30, from 0 to {MAX_DAY_HOURS}.
          </p>
        )}
        {overDay >= 0 && (
          <p className="notice notice-error" role="alert">
            {formatWeekday(days[overDay])} {formatDate(days[overDay], year)} adds up to {formatHours(dayTotals[overDay])} h. One day holds at most {MAX_DAY_HOURS} h.
          </p>
        )}
        {message && (
          <p className={`notice${message.ok ? "" : " notice-error"}`} role={message.ok ? "status" : "alert"}>
            {message.text}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" form="sheet-form" className="btn btn-primary" disabled={pending || !dirty || invalid || overDay >= 0}>
            {pending ? "Saving…" : "Save week"}
          </button>
          {dirty && !pending && <span className="hint">Unsaved changes</span>}
        </div>
      </div>
    </div>
  );
}
