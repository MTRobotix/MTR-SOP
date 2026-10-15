"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Entry } from "@/lib/work/hours";
import { formatHours, parseHours } from "@/lib/work/shared";
import { ConfirmButton } from "../projects/ConfirmButton";
import { deleteEntryAction, updateEntryAction, type LogState } from "./actions";

/** One logged entry. Edit opens in place: hours and note, nothing else. */
export function EntryItem({ e }: { e: Entry }) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(formatHours(e.hours));
  const [state, action, pending] = useActionState<LogState, FormData>(async (prev, form) => {
    const res = await updateEntryAction(prev, form);
    if (res.ok) setEditing(false);
    return res;
  }, {});
  const name = e.projectId ? (
    <Link href={`/projects/${e.projectId}`}>{e.label}</Link>
  ) : (
    <>
      {e.label} <span className="tag">no project</span>
    </>
  );

  if (editing) {
    const bad = parseHours(hours) === null || parseHours(hours) === 0;
    return (
      <li className="entry entry-editing">
        <form
          className="entry-edit"
          onSubmit={(ev) => {
            ev.preventDefault();
            const data = new FormData(ev.currentTarget);
            startTransition(() => action(data));
          }}
        >
          <input type="hidden" name="rowId" value={e.rowId} />
          <input type="hidden" name="date" value={e.date} />
          <p className="entry-title">
            {e.code && <span className="entry-code">{e.code}</span>} {e.label}
          </p>
          <div className="entry-edit-fields">
            <div>
              <label className="label" htmlFor={`h-${e.rowId}-${e.date}`}>
                Hours
              </label>
              <input
                className="input"
                id={`h-${e.rowId}-${e.date}`}
                name="hours"
                inputMode="decimal"
                value={hours}
                onChange={(ev) => setHours(ev.target.value)}
                aria-invalid={bad || undefined}
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor={`n-${e.rowId}-${e.date}`}>
                Note
              </label>
              <input className="input" id={`n-${e.rowId}-${e.date}`} name="note" maxLength={200} defaultValue={e.note} />
            </div>
          </div>
          {state.error && (
            <p className="notice notice-error" role="alert">
              {state.error}
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={bad || pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button className="btn" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="entry">
      <div className="entry-main">
        <p className="entry-title">
          {e.code && <span className="entry-code">{e.code}</span>} {name}
        </p>
        {e.note && <p className="entry-note">{e.note}</p>}
      </div>
      <span className="entry-hours">{formatHours(e.hours)} h</span>
      <div className="entry-actions">
        <button className="btn btn-icon" type="button" aria-label={`Edit ${formatHours(e.hours)} h on ${e.label}`} onClick={() => setEditing(true)}>
          <Pencil size={16} strokeWidth={1.5} />
        </button>
        <form action={deleteEntryAction}>
          <input type="hidden" name="rowId" value={e.rowId} />
          <input type="hidden" name="date" value={e.date} />
          <ConfirmButton className="btn btn-icon" aria-label={`Delete ${formatHours(e.hours)} h on ${e.label}`} message={`Delete ${formatHours(e.hours)} h on ${e.label}?`}>
            <Trash2 size={16} strokeWidth={1.5} />
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
