"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="login-form">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="hint">No account? Ask an MTR admin.</p>
    </form>
  );
}
