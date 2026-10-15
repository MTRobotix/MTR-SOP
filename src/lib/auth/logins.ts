// Sign-in log (admin view at /admin/sign-ins) and the login throttle built on it.
// The throttle lives in the database, not in memory, so it holds across serverless instances.
import "server-only";
import { headers } from "next/headers";
import { query } from "../db";
import { normalizeEmail } from "./users";

export const OUTCOMES = ["success", "wrong_password", "unknown_email", "disabled", "throttled", "sign_out"] as const;
export type Outcome = (typeof OUTCOMES)[number];

/** Attempts that count against the throttle. Throttled attempts themselves do not, so a lockout ends on time. */
const FAILED: Outcome[] = ["wrong_password", "unknown_email", "disabled"];
const WINDOW = "15 minutes";
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;
const KEEP = "365 days";

export type Client = { ip: string; userAgent: string };

/** Caller's IP and browser. On Vercel the platform sets these headers; a client cannot override them. */
export async function client(): Promise<Client> {
  const h = await headers();
  const ip = (h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for") ?? "").split(",")[0].trim();
  return { ip: ip.slice(0, 64), userAgent: (h.get("user-agent") ?? "").slice(0, 300) };
}

export async function recordLogin(email: string, outcome: Outcome, c: Client, userId: number | null = null): Promise<void> {
  await query("INSERT INTO login_events (email, user_id, outcome, ip, user_agent) VALUES ($1, $2, $3, $4, $5)", [
    normalizeEmail(email).slice(0, 254),
    userId,
    outcome,
    c.ip,
    c.userAgent,
  ]);
  if (outcome === "success") await query(`DELETE FROM login_events WHERE at < NOW() - INTERVAL '${KEEP}'`);
}

/** True after 5 failed attempts for this email, or 20 from this IP, in the last 15 minutes. */
export async function isThrottled(email: string, ip: string): Promise<boolean> {
  const [row] = await query<{ by_email: number; by_ip: number }>(
    `SELECT COUNT(*) FILTER (WHERE email = $1)::int AS by_email,
            COUNT(*) FILTER (WHERE $2 <> '' AND ip = $2)::int AS by_ip
       FROM login_events
      WHERE at > NOW() - INTERVAL '${WINDOW}' AND outcome = ANY($3) AND (email = $1 OR ($2 <> '' AND ip = $2))`,
    [normalizeEmail(email), ip, FAILED],
  );
  return row.by_email >= MAX_PER_EMAIL || row.by_ip >= MAX_PER_IP;
}

export type LoginEvent = {
  id: number;
  at: string;
  email: string;
  userId: number | null;
  name: string | null;
  outcome: Outcome;
  ip: string;
  userAgent: string;
};

export type LoginFilter = { result: "all" | "success" | "failed"; email: string | null; before: number | null };

export const PAGE_SIZE = 100;

export async function listLogins(f: LoginFilter): Promise<LoginEvent[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.result === "success") where.push("e.outcome = 'success'");
  if (f.result === "failed") {
    params.push([...FAILED, "throttled"]);
    where.push(`e.outcome = ANY($${params.length})`);
  }
  if (f.email) {
    params.push(normalizeEmail(f.email));
    where.push(`e.email = $${params.length}`);
  }
  if (f.before) {
    params.push(f.before);
    where.push(`e.id < $${params.length}`);
  }
  params.push(PAGE_SIZE);
  return query<LoginEvent>(
    `SELECT e.id::int AS id, to_char(e.at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at, e.email,
            e.user_id AS "userId", u.name, e.outcome, e.ip, e.user_agent AS "userAgent"
       FROM login_events e LEFT JOIN users u ON u.id = e.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY e.id DESC
      LIMIT $${params.length}`,
    params,
  );
}

export async function loginStats(): Promise<{ signIns7d: number; failed24h: number; people7d: number }> {
  const [row] = await query<{ signIns7d: number; failed24h: number; people7d: number }>(
    `SELECT COUNT(*) FILTER (WHERE outcome = 'success' AND at > NOW() - INTERVAL '7 days')::int AS "signIns7d",
            COUNT(*) FILTER (WHERE outcome = ANY($1) AND at > NOW() - INTERVAL '24 hours')::int AS "failed24h",
            COUNT(DISTINCT user_id) FILTER (WHERE outcome = 'success' AND at > NOW() - INTERVAL '7 days')::int AS "people7d"
       FROM login_events
      WHERE at > NOW() - INTERVAL '7 days'`,
    [[...FAILED, "throttled"]],
  );
  return row;
}
