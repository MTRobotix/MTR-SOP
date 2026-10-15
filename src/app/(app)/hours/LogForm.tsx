"use client";

import { startTransition, useActionState, useState } from "react";
import { Check } from "lucide-react";
import type { ProjectOption } from "@/lib/work/hours";
import { formatHours, parseHours, projectLabel } from "@/lib/work/shared";
import { logTimeAction, type LogState } from "./actions";

type Props = {
  projects: ProjectOption[];
  /** The day picked in the day strip. */
  date: string;
  dayLabel: string;
  /** Future days can be looked at, not logged. */
  future: boolean;
  projectId: string;
  onProject: (id: string) => void;
};

const QUICK_HOURS = ["1", "2", "4", "8"];

/** Adds one entry to the picked day. The project comes from the project panel or the select. */
export function LogForm({ projects, date, dayLabel, future, projectId, onProject }: Props) {
  const mine = projects.filter((p) => p.mine);
  const others = projects.filter((p) => !p.mine);
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [state, action, pending] = useActionState<LogState, FormData>(async (prev, form) => {
    const res = await logTimeAction(prev, form);
    if (res.ok) {
      setHours("");
      setNote("");
    }
    return res;
  }, {});

  const parsed = parseHours(hours);
  const badHours = hours.trim() !== "" && parsed === null;
  const ready = !future && !!projectId && !!parsed && !pending;
  const option = (p: ProjectOption) => (
    <option key={p.id} value={p.id}>
      {projectLabel(p)}
      {p.customer ? ` (${p.customer})` : ""}
    </option>
  );

  if (projects.length === 0) return <p className="empty">No ongoing projects to log hours on. An admin creates projects under Projects.</p>;

  return (
    <form
      className="log-form"
      aria-label={`Log time on ${dayLabel}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="date" value={date} />
      <div className="log-row">
        <div className="log-project">
          <label className="label" htmlFor="log-project">
            Project
          </label>
          <select className="input" id="log-project" name="projectId" value={projectId} onChange={(e) => onProject(e.target.value)} required>
            <option value="" disabled>
              Pick a project by code or name…
            </option>
            {mine.length > 0 && <optgroup label="Your projects">{mine.map(option)}</optgroup>}
            <optgroup label={mine.length ? "Other projects" : "Projects"}>{others.map(option)}</optgroup>
          </select>
        </div>
        <div className="log-hours-field">
          <label className="label" htmlFor="log-hours">
            Hours
          </label>
          <input
            className="input"
            id="log-hours"
            name="hours"
            inputMode="decimal"
            autoComplete="off"
            placeholder="1.5 or 1:30"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            aria-invalid={badHours || undefined}
            aria-describedby={badHours ? "log-hours-error" : undefined}
          />
        </div>
      </div>
      <div className="chips" role="group" aria-label="Quick hours">
        {QUICK_HOURS.map((h) => (
          <button key={h} type="button" className="chip" aria-pressed={parsed !== null && formatHours(parsed) === h} onClick={() => setHours(h)}>
            {h} h
          </button>
        ))}
      </div>
      {badHours && (
        <p id="log-hours-error" className="hint hint-error">
          Use a number of hours up to 24, like 2, 1.5 or 1:30.
        </p>
      )}
      <div>
        <label className="label" htmlFor="log-note">
          Note <span className="hint">optional</span>
        </label>
        <input className="input" id="log-note" name="note" maxLength={200} placeholder="What did you work on?" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {future && <p className="hint">This day is still ahead. Pick today or an earlier day to log hours.</p>}
      {state.error && (
        <p className="notice notice-error" role="alert" key={state.at}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="notice log-done" role="status" key={state.at}>
          <Check size={16} strokeWidth={1.5} aria-hidden="true" /> {state.ok}
        </p>
      )}
      <button className="btn btn-primary log-submit" type="submit" disabled={!ready}>
        {pending ? "Logging…" : parsed ? `Log ${formatHours(parsed)} h on ${dayLabel}` : `Log time on ${dayLabel}`}
      </button>
    </form>
  );
}
