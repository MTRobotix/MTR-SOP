"use client";

import { useActionState } from "react";
import { changePassword, type PwState } from "./actions";
import { MIN_PASSWORD } from "@/lib/auth/roles";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePassword, {});
  return (
    <form action={action} className="card account-form">
      <div>
        <label className="label" htmlFor="pw-current">Current password</label>
        <input className="input" id="pw-current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <label className="label" htmlFor="pw-next">New password</label>
        <input className="input" id="pw-next" name="next" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
        <p className="hint">At least {MIN_PASSWORD} characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="pw-confirm">Repeat new password</label>
        <input className="input" id="pw-confirm" name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
      </div>
      {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
      {state.ok && <p className="notice" role="status">{state.ok}</p>}
      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
      </div>
    </form>
  );
}
