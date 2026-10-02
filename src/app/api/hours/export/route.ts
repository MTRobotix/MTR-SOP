import { getCurrentUser } from "@/lib/auth/session";
import { report } from "@/lib/work/hours";
import { parseReportFilter } from "@/lib/work/filters";

// Spreadsheet apps run cells that start with these characters as formulas.
const csvCell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "Admins only." }, { status: 403 });
  const f = parseReportFilter(Object.fromEntries(new URL(req.url).searchParams));
  const rows = await report(f);
  const lines = [
    ["Date", "Person", "Email", "Project", "Customer", "Custom name", "Hours", "Week note"],
    ...rows.map((r) => [r.date, r.person, r.email, r.project, r.customer, r.projectId === null ? "yes" : "no", r.hours, r.note]),
  ];
  const body = lines.map((l) => l.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mtr-hours-${f.from}-to-${f.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
