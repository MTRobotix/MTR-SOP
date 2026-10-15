"use client";

import { startTransition, useActionState, useState } from "react";
import { Check } from "lucide-react";
import type { ProjectOption } from "@/lib/work/hours";
import { formatHours, parseHours, projectLabel } from "@/lib/work/shared";
import { logTimeAction, type LogState } from "./actions";

type Props = { projects: ProjectOption[]; today: string; yesterday: string; initialProjectId: number | null };

const QUICK_HOURS = ["1", "2", "4", "8"];
const MAX_SHORTCUTS = 4;

/** One entry at a time: pick a project, tap the hours, log. The day defaults to today. */
export function LogForm({ projects, today, yesterday, initialProjectId }: Props) {
  const mine = projects.filter((p) => p.mine);
  const others = projects.filter((p) => !p.mine);
  const [projectId, setProjectId] = useState<string>(String(initialProjectId ?? mine[0]?.id ?? ""));
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(today);
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
  const ready = !!projectId && !!parsed && !pending;
  // Shortcuts: your projects, with the chosen one always among them.
  const shortcuts = mine.slice(0, MAX_SHORTCUTS);
  const picked = projects.find((p) => String(p.id) === projectId);
  if (picked && !shortcuts.some((p) => p.id === picked.id)) shortcuts.splice(MAX_SHORTCUTS - 1, 1, picked);

  if (projects.length === 0) {
    return <p className="empty">No ongoing projects to log hours on. An admin creates projects under Projects.</p>;
  }

  return (
    <form
      className="card log-form"
      aria-labelledby="log-title"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <h2 id="log-title" className="card-title">
        Log time
      </h2>

      <div className="log-step">
        <label className="label" htmlFor="log-project">
          1. Project
        </label>
        {shortcuts.length > 0 && (
          <div className="chips" role="group" aria-label="Your projects">
            {shortcuts.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip chip-project"
                aria-pressed={String(p.id) === projectId}
                onClick={() => setProjectId(String(p.id))}
              >
                <strong>{p.code || "—"}</strong>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
        <select className="input" id="log-project" name="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          <option value="" disabled>
            Pick a project by code or name…
          </option>
          {mine.length > 0 && (
            <optgroup label="Your projects">
              {mine.map((p) => (
                <option key={p.id} value={p.id}>
                  {projectLabel(p)}
                  {p.customer ? ` (${p.customer})` : ""}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={mine.length ? "Other projects" : "Projects"}>
            {others.map((p) => (
              <option key={p.id} value={p.id}>
                {projectLabel(p)}
                {p.customer ? ` (${p.customer})` : ""}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="log-step">
        <label className="label" htmlFor="log-hours">
          2. Hours
        </label>
        <div className="chips" role="group" aria-label="Quick hours">
          {QUICK_HOURS.map((h) => (
            <button key={h} type="button" className="chip" aria-pressed={parsed !== null && formatHours(parsed) === h} onClick={() => setHours(h)}>
              {h} h
            </button>
          ))}
        </div>
        <input
          className="input log-hours"
          id="log-hours"
          name="hours"
          inputMode="decimal"
          autoComplete="off"
          placeholder="Or type: 1.5 or 1:30"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          aria-invalid={badHours || undefined}
          aria-describedby={badHours ? "log-hours-error" : undefined}
        />
        {badHours && (
          <p id="log-hours-error" className="hint hint-error">
            Use a number of hours up to 24, like 2, 1.5 or 1:30.
          </p>
        )}
      </div>

      <div className="log-step">
        <label className="label" htmlFor="log-date">
          3. Day
        </label>
        <div className="chips" role="group" aria-label="Quick days">
          <button type="button" className="chip" aria-pressed={date === today} onClick={() => setDate(today)}>
            Today
          </button>
          <button type="button" className="chip" aria-pressed={date === yesterday} onClick={() => setDate(yesterday)}>
            Yesterday
          </button>
          <input
            className="input log-date"
            id="log-date"
            name="date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value || today)}
            required
          />
        </div>
      </div>

      <div className="log-step">
        <label className="label" htmlFor="log-note">
          Note <span className="hint">optional</span>
        </label>
        <input className="input" id="log-note" name="note" maxLength={200} placeholder="What did you work on?" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

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
        {pending ? "Logging…" : parsed ? `Log ${formatHours(parsed)} h` : "Log time"}
      </button>
    </form>
  );
}
