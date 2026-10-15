import Link from "next/link";
import { CircleAlert, LogIn, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listLogins, loginStats, PAGE_SIZE, type LoginEvent, type LoginFilter, type Outcome } from "@/lib/auth/logins";
import { LocalTime } from "./LocalTime";
import "@/components/work/work.css";
import "../admin.css";

export const metadata = { title: "Sign-ins" };

type Search = { result?: string; email?: string; before?: string };

const RESULTS = [
  { id: "all", label: "All" },
  { id: "success", label: "Signed in" },
  { id: "failed", label: "Failed" },
] as const;

const WORDS: Record<Outcome, string> = {
  success: "Signed in",
  sign_out: "Signed out",
  wrong_password: "Wrong password",
  unknown_email: "No such account",
  disabled: "Account disabled",
  throttled: "Blocked: too many attempts",
};

function parse(s: Search): LoginFilter {
  const result = s.result === "success" || s.result === "failed" ? s.result : "all";
  const before = Number(s.before);
  return { result, email: s.email?.trim() || null, before: Number.isInteger(before) && before > 0 ? before : null };
}

function href(f: LoginFilter, change: Partial<LoginFilter>): string {
  const n = { ...f, before: null, ...change };
  const q = new URLSearchParams();
  if (n.result !== "all") q.set("result", n.result);
  if (n.email) q.set("email", n.email);
  if (n.before) q.set("before", String(n.before));
  const s = q.toString();
  return s ? `/admin/sign-ins?${s}` : "/admin/sign-ins";
}

/** "Chrome on Windows" from a user-agent string. Good enough to tell devices apart, not a fingerprint. */
function device(ua: string): string {
  if (!ua) return "Unknown";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "other OS";
  return `${browser} on ${os}`;
}

function Result({ e }: { e: LoginEvent }) {
  if (e.outcome === "success")
    return (
      <span className="flag">
        <LogIn size={16} strokeWidth={1.5} aria-hidden="true" /> {WORDS.success}
      </span>
    );
  if (e.outcome === "sign_out")
    return (
      <span className="flag muted">
        <LogOut size={16} strokeWidth={1.5} aria-hidden="true" /> {WORDS.sign_out}
      </span>
    );
  return (
    <span className="flag flag-danger">
      <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" /> {WORDS[e.outcome]}
    </span>
  );
}

export default async function SignInsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser("admin");
  const f = parse(await searchParams);
  const [events, stats] = await Promise.all([listLogins(f), loginStats()]);
  const older = events.length === PAGE_SIZE ? events[events.length - 1].id : null;

  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <h1>Sign-ins</h1>
          <p>Every sign-in attempt and sign-out: which account, when, from which IP and device. Kept for 12 months. Times are in your time zone.</p>
        </div>
      </div>

      <ul className="stat-row">
        <li className="stat card">
          <span className="stat-label">Sign-ins, last 7 days</span>
          <span className="stat-value num">{stats.signIns7d}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">People, last 7 days</span>
          <span className="stat-value num">{stats.people7d}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">Failed, last 24 hours</span>
          <span className="stat-value num">{stats.failed24h}</span>
        </li>
      </ul>

      <nav aria-label="Filter by result" className="signins-filters">
        <ul className="pills">
          {RESULTS.map((r) => (
            <li key={r.id}>
              <Link href={href(f, { result: r.id })} aria-current={f.result === r.id ? "page" : undefined}>
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
        {f.email && (
          <p className="hint">
            Account <strong>{f.email}</strong> · <Link href={href(f, { email: null })}>Show all accounts</Link>
          </p>
        )}
      </nav>

      {events.length === 0 ? (
        <p className="empty">{f.before ? "No older sign-ins." : "No sign-ins match this filter."}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Account</th>
                <th>Result</th>
                <th>IP</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="signins-time">
                    <LocalTime iso={e.at} />
                  </td>
                  <td>
                    {e.name && <>{e.name}<br /></>}
                    <Link href={href(f, { email: e.email })} className={e.name ? "hint" : undefined} title="Show this account only">
                      {e.email}
                    </Link>
                  </td>
                  <td>
                    <Result e={e} />
                  </td>
                  <td>
                    <code>{e.ip || "–"}</code>
                  </td>
                  <td title={e.userAgent}>{device(e.userAgent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {older && (
        <p className="signins-more">
          <Link className="btn btn-sm" href={href(f, { before: older })}>
            Show older
          </Link>
        </p>
      )}
    </div>
  );
}
