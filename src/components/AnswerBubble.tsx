"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type Src = { n: number; title: string; href: string };
type State = { status: "loading" | "streaming" | "done" | "off" | "error"; text: string; sources: Src[] };

function decodeSources(h: string | null): Src[] {
  if (!h) return [];
  try {
    const bin = atob(h);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Src[];
  } catch {
    return [];
  }
}

/** Renders `code` and [n] citations as React elements — never as HTML. */
function Inline({ text, sources }: { text: string; sources: Src[] }) {
  const parts = text.split(/(`[^`]+`|\[\d+\])/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`") && p.length > 1) return <code key={i}>{p.slice(1, -1)}</code>;
        const m = /^\[(\d+)\]$/.exec(p);
        if (m) {
          const s = sources.find((x) => x.n === Number(m[1]));
          return s ? (
            <Link key={i} href={s.href} className="cite" title={s.title}>
              {m[1]}
            </Link>
          ) : null;
        }
        return <Fragment key={i}>{p.replace(/\*\*/g, "")}</Fragment>;
      })}
    </>
  );
}

export function AnswerBubble({ q }: { q: string }) {
  const [s, setS] = useState<State>({ status: "loading", text: "", sources: [] });

  useEffect(() => {
    // Keyed by q in the parent, so each question mounts fresh in the loading state.
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
          signal: ctrl.signal,
        });
        if (res.status === 503) return setS({ status: "off", text: "", sources: [] });
        if (!res.ok || !res.body) return setS({ status: "error", text: "", sources: [] });
        const sources = decodeSources(res.headers.get("X-Sources"));
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          setS({ status: "streaming", text, sources });
        }
        setS({ status: "done", text, sources });
      } catch {
        if (!ctrl.signal.aborted) setS({ status: "error", text: "", sources: [] });
      }
    })();
    return () => ctrl.abort();
  }, [q]);

  if (s.status === "off") return null;

  const lines = s.text.split("\n").filter((l) => l.trim());
  const cited = s.sources.filter((src) => s.text.includes(`[${src.n}]`));

  return (
    <section className="answer glass-panel fade-in" aria-labelledby="answer-label">
      <p className="answer-label" id="answer-label">
        <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" /> AI answer
      </p>
      <div className="answer-body" aria-live="polite" aria-busy={s.status !== "done"}>
        {s.status === "loading" && (
          <div className="answer-skeleton" aria-label="Loading answer">
            <span />
            <span />
            <span />
          </div>
        )}
        {s.status === "error" && <p>AI answer unavailable. Use the sections below.</p>}
        {lines.map((l, i) => (
          <p key={i}>
            <Inline text={l} sources={s.sources} />
          </p>
        ))}
      </div>
      {s.status === "done" && cited.length > 0 && (
        <ol className="answer-sources">
          {cited.map((src) => (
            <li key={src.n}>
              <span className="cite">{src.n}</span>
              <Link href={src.href}>{src.title}</Link>
            </li>
          ))}
        </ol>
      )}
      <p className="answer-foot">Generated from the SOP. Check the linked section before acting.</p>
    </section>
  );
}
