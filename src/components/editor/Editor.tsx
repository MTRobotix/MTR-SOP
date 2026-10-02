"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import type { Role } from "@/lib/auth/roles";
import "./Editor.css";

const VisualEditor = dynamic(() => import("./VisualEditor"), { ssr: false, loading: () => <div className="editor-loading">Loading editor…</div> });
const SourceEditor = dynamic(() => import("./SourceEditor"), { ssr: false, loading: () => <div className="editor-loading">Loading editor…</div> });

export type Issue = { line?: number; message: string };
type Mode = "visual" | "source" | "preview";

type Props = {
  dept: string;
  deptTitle: string;
  slug: string | null;
  baseSha: string | null;
  meta: Record<string, unknown>;
  body: string;
  hasHtml: boolean;
  role: Role;
  storeMode: "local" | "github";
};

type Fields = { slug: string; title: string; summary: string; tags: string; owner: string; featured: boolean; order: string };

const str = (v: unknown) => (typeof v === "string" ? v : "");

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

// JSON strings are valid YAML scalars; the server rewrites everything into canonical form anyway.
function buildFile(f: Fields, updated: unknown, body: string): string {
  const tags = f.tags.split(",").map((t) => slugify(t.trim())).filter(Boolean);
  const lines = [
    `title: ${JSON.stringify(f.title.trim())}`,
    `summary: ${JSON.stringify(f.summary.trim())}`,
    `tags: [${tags.join(", ")}]`,
    `owner: ${JSON.stringify(f.owner.trim())}`,
    `featured: ${f.featured}`,
    `order: ${Number.parseInt(f.order, 10) || 0}`,
    `updated: ${typeof updated === "string" ? updated : new Date().toISOString().slice(0, 10)}`,
  ];
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

export function Editor(p: Props) {
  const router = useRouter();
  const isNew = p.slug === null;
  const [fields, setFields] = useState<Fields>({
    slug: p.slug ?? "",
    title: str(p.meta.title),
    summary: str(p.meta.summary),
    tags: Array.isArray(p.meta.tags) ? (p.meta.tags as string[]).join(", ") : "",
    owner: str(p.meta.owner),
    featured: p.meta.featured === true,
    order: String(p.meta.order ?? 100),
  });
  const [body, setBody] = useState(p.body);
  const [hasHtml, setHasHtml] = useState(p.hasHtml);
  // Visual mode is allowed only after it proves it reproduces the file exactly.
  const [visualCheck, setVisualCheck] = useState<"pending" | "ok" | "lossy">("pending");
  const [mode, setMode] = useState<Mode>(p.hasHtml ? "source" : "visual");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [bodyOffset, setBodyOffset] = useState(0);
  // The raw text the current issues belong to; while it differs from `raw`, a lint is pending.
  const [lintedRaw, setLintedRaw] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; conflict?: boolean; url?: string } | null>(null);
  const [preview, setPreview] = useState("");
  const dirty = useRef(false);
  // Visual editor loads its content only on mount; bump to remount after source edits.
  const [visualKey, setVisualKey] = useState(0);

  const slug = isNew ? fields.slug || slugify(fields.title) : (p.slug as string);
  const raw = useMemo(() => buildFile(fields, p.meta.updated, body), [fields, p.meta.updated, body]);

  const markDirty = () => {
    dirty.current = true;
    setResult(null);
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Live lint: same validator as save and CI.
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/lint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dept: p.dept, slug: slug || "untitled", content: raw }),
          signal: ctrl.signal,
        });
        const j = (await res.json()) as { issues: Issue[]; bodyOffset: number; hasHtml: boolean };
        setIssues(j.issues ?? []);
        setBodyOffset(j.bodyOffset ?? 0);
        setHasHtml(!!j.hasHtml);
        setLintedRaw(raw);
      } catch {
        if (ctrl.signal.aborted) return; // superseded by a newer edit
        setIssues([{ message: "Checks unavailable. Check your connection, then edit again to retry." }]);
        setLintedRaw(raw);
      }
    }, 600);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [raw, p.dept, slug]);

  useEffect(() => {
    if (mode !== "preview") return;
    const ctrl = new AbortController();
    fetch("/api/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { html: string }) => setPreview(j.html))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [mode, body]);

  const visualBlocked = hasHtml || visualCheck === "lossy";

  const onVisualReady = useCallback(
    async (visual: string) => {
      try {
        const res = await fetch("/api/roundtrip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original: body, visual }),
        });
        const j = (await res.json()) as { same?: boolean };
        if (j.same) return setVisualCheck("ok");
      } catch {
        /* treat as lossy: safer */
      }
      setVisualCheck("lossy");
      setMode("source");
    },
    // Checked against the body the visual editor was mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visualKey],
  );

  const switchMode = (m: Mode) => {
    if (m === "visual") {
      if (visualBlocked) return;
      setVisualCheck("pending");
      setVisualKey((k) => k + 1);
    }
    setMode(m);
  };

  const onBodyChange = useCallback((md: string) => {
    setBody(md);
    markDirty();
  }, []);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setFields((f) => ({ ...f, [k]: v }));
    markDirty();
  };

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dept: p.dept, slug, content: raw, baseSha: p.baseSha, message: message || (isNew ? `add ${fields.title}` : `update ${fields.title}`) }),
      });
      const j = (await res.json()) as { kind?: string; mode?: string; url?: string; error?: string; issues?: Issue[]; conflict?: boolean };
      if (!res.ok) {
        if (j.issues) setIssues(j.issues);
        setResult({ ok: false, text: j.error ?? "Save failed.", conflict: j.conflict });
        return;
      }
      dirty.current = false;
      if (j.kind === "proposed") {
        setResult({ ok: true, text: "Sent for review. An admin must approve it before it goes live.", url: j.url });
      } else if (j.mode === "github") {
        setResult({ ok: true, text: "Saved to main. Live after the site redeploys (~1–2 min)." });
      } else {
        router.push(`/d/${p.dept}/${slug}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!p.baseSha || !confirm(`Delete "${fields.title}"? This removes the file from main.`)) return;
    const res = await fetch("/api/docs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dept: p.dept, slug, baseSha: p.baseSha }) });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) return setResult({ ok: false, text: j.error ?? "Delete failed." });
    dirty.current = false;
    router.push(`/d/${p.dept}`);
    router.refresh();
  }

  const linting = lintedRaw !== raw;
  const isAdmin = p.role === "admin";
  const blocking = issues.length > 0;

  return (
    <div className="shell page editor-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/sop">SOP</Link> <span aria-hidden="true">›</span> <Link href={`/d/${p.dept}`}>{p.deptTitle}</Link>
        {!isNew && (
          <>
            <span aria-hidden="true">›</span> <Link href={`/d/${p.dept}/${slug}`}>{fields.title || slug}</Link>
          </>
        )}
      </nav>
      <div className="page-head">
        <h1>{isNew ? "New section" : `Edit: ${fields.title}`}</h1>
        {!isAdmin && <p className="hint">Your changes go to an admin for review.</p>}
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          <fieldset className="meta-grid">
            <legend className="visually-hidden">Details</legend>
            <div className="span-2">
              <label className="label" htmlFor="f-title">Title</label>
              <input id="f-title" className="input" value={fields.title} maxLength={120} onChange={(e) => set("title", e.target.value)} placeholder="Run the SensQ stack locally" />
            </div>
            {isNew && (
              <div className="span-2">
                <label className="label" htmlFor="f-slug">URL name</label>
                <input id="f-slug" className="input" value={slug} maxLength={60} onChange={(e) => set("slug", slugify(e.target.value))} />
                <p className="hint">/d/{p.dept}/{slug || "…"} — cannot change later without an admin.</p>
              </div>
            )}
            <div className="span-2">
              <label className="label" htmlFor="f-summary">Summary</label>
              <input id="f-summary" className="input" value={fields.summary} maxLength={160} onChange={(e) => set("summary", e.target.value)} placeholder="One line, max 160 characters." />
            </div>
            <div>
              <label className="label" htmlFor="f-tags">Tags</label>
              <input id="f-tags" className="input" value={fields.tags} onChange={(e) => set("tags", e.target.value)} placeholder="sensq, setup" />
            </div>
            <div>
              <label className="label" htmlFor="f-owner">Owner</label>
              <input id="f-owner" className="input" value={fields.owner} onChange={(e) => set("owner", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="f-order">Order</label>
              <input id="f-order" className="input" type="number" step={10} value={fields.order} onChange={(e) => set("order", e.target.value)} />
            </div>
            <label className="check">
              <input type="checkbox" checked={fields.featured} onChange={(e) => set("featured", e.target.checked)} /> Quick link on home (max 5 per department)
            </label>
          </fieldset>

          <div className="mode-tabs" role="tablist" aria-label="Editor mode">
            {(["visual", "source", "preview"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                className="mode-tab"
                disabled={m === "visual" && visualBlocked}
                title={m === "visual" && visualBlocked ? "Visual mode would change this section's formatting. Edit it in Markdown so nothing is lost." : undefined}
                onClick={() => switchMode(m)}
              >
                {m === "visual" ? "Visual" : m === "source" ? "Markdown / HTML" : "Preview"}
              </button>
            ))}
          </div>
          {hasHtml && mode !== "preview" && <p className="hint">Contains HTML: visual mode is off so the HTML is not lost.</p>}
          {!hasHtml && visualCheck === "lossy" && mode !== "preview" && (
            <p className="hint">Visual mode cannot reproduce this section exactly (e.g. code inside numbered steps). Edit in Markdown.</p>
          )}

          <div className="editor-surface">
            {mode === "visual" && <VisualEditor key={visualKey} initial={body} onChange={onBodyChange} onReady={onVisualReady} editable={visualCheck === "ok"} />}
            {mode === "source" && <SourceEditor value={body} onChange={onBodyChange} issues={issues} bodyOffset={bodyOffset} />}
            {mode === "preview" && <div className="prose preview" dangerouslySetInnerHTML={{ __html: preview }} />}
          </div>
        </div>

        <aside className="editor-side">
          <section className="card side-card">
            <h2 className="side-title">
              {linting ? "Checking…" : blocking ? `${issues.length} issue${issues.length === 1 ? "" : "s"}` : "No issues"}
            </h2>
            {blocking ? (
              <ul className="issues">
                {issues.map((i, n) => (
                  <li key={n}>
                    <AlertTriangle size={14} strokeWidth={1.5} aria-hidden="true" />
                    <span>
                      {i.line && i.line > bodyOffset ? <strong>Line {i.line - bodyOffset}: </strong> : null}
                      {i.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">
                <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" /> Passes the same checks as CI.
              </p>
            )}
          </section>

          <section className="card side-card">
            <label className="label" htmlFor="f-msg">What changed</label>
            <input id="f-msg" className="input" value={message} maxLength={120} onChange={(e) => setMessage(e.target.value)} placeholder={isNew ? "add section" : "fix port number in step 3"} />
            <button type="button" className="btn btn-primary save-btn" disabled={saving || blocking || linting || !slug} onClick={save}>
              {saving ? "Saving…" : isAdmin ? "Save" : "Send for review"}
            </button>
            {result && (
              <div className={`notice${result.ok ? "" : " notice-error"}`} role="status">
                {result.text}
                {result.url && (
                  <>
                    {" "}
                    <a href={result.url} target="_blank" rel="noreferrer">
                      View request
                    </a>
                  </>
                )}
                {result.conflict && (
                  <p>
                    <button type="button" className="btn btn-sm" onClick={() => location.reload()}>
                      Reload
                    </button>
                  </p>
                )}
              </div>
            )}
            <p className="hint">
              {p.storeMode === "github" ? (isAdmin ? "Saves commit to main." : "Saves open a pull request.") : "Local mode: saves write files in content/ (admin) or .drafts/ (editor)."}
            </p>
          </section>

          {isAdmin && !isNew && (
            <button type="button" className="btn btn-danger" onClick={remove}>
              <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" /> Delete section
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
