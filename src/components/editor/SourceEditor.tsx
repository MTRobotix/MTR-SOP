"use client";

import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Bold, Code, Heading2, Italic, Link2, List, ListOrdered, SquareCode, Table, MessageSquareWarning, ChevronRightSquare } from "lucide-react";
import type { Issue } from "./Editor";

type Props = { value: string; onChange: (v: string) => void; issues: Issue[]; bodyOffset: number };

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

const theme = EditorView.theme({
  "&": { fontSize: "var(--text-sm)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" },
  ".cm-content": { fontFamily: "var(--font-mono)", padding: "var(--space-4) 0" },
  ".cm-gutters": { backgroundColor: "var(--color-bg-soft)", color: "var(--color-text-faint)", border: "none" },
  ".cm-activeLine": { backgroundColor: "var(--color-hover)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--color-hover)" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "var(--color-text)" },
});

/** Wrap the selection, or insert a line prefix / block. */
function apply(view: EditorView | undefined, kind: "wrap" | "prefix" | "block", a: string, b = a) {
  if (!view) return;
  const { from, to } = view.state.selection.main;
  const sel = view.state.sliceDoc(from, to);
  if (kind === "wrap") {
    view.dispatch({ changes: { from, to, insert: `${a}${sel || "text"}${b}` }, selection: { anchor: from + a.length, head: from + a.length + (sel || "text").length } });
  } else if (kind === "prefix") {
    const line = view.state.doc.lineAt(from);
    view.dispatch({ changes: { from: line.from, insert: a } });
  } else {
    const line = view.state.doc.lineAt(from);
    const insert = `${line.text ? "\n\n" : ""}${a}\n`;
    view.dispatch({ changes: { from: line.to, insert }, selection: { anchor: line.to + insert.length } });
  }
  view.focus();
}

export default function SourceEditor({ value, onChange, issues, bodyOffset }: Props) {
  const ref = useRef<ReactCodeMirrorRef>(null);
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark", () => false);
  const extensions = useMemo(
    () => [markdown({ base: markdownLanguage, codeLanguages: languages }), EditorView.lineWrapping, lintGutter(), theme],
    [],
  );

  // Push server lint results into the editor as inline diagnostics.
  useEffect(() => {
    const view = ref.current?.view;
    if (!view) return;
    const doc = view.state.doc;
    const diags: Diagnostic[] = issues.map((i) => {
      const n = i.line && i.line > bodyOffset ? Math.min(i.line - bodyOffset, doc.lines) : 1;
      const line = doc.line(Math.max(1, n));
      return { from: line.from, to: line.to, severity: "error", message: i.message };
    });
    view.dispatch(setDiagnostics(view.state, diags));
  }, [issues, bodyOffset, value]);

  const v = () => ref.current?.view;
  const i = { size: 16, strokeWidth: 1.5 };
  return (
    <div className="source">
      <div className="toolbar" role="toolbar" aria-label="Markdown helpers">
        <button type="button" className="tb-btn" title="Heading 2" aria-label="Heading 2" onClick={() => apply(v(), "prefix", "## ")}><Heading2 {...i} /></button>
        <button type="button" className="tb-btn" title="Bold" aria-label="Bold" onClick={() => apply(v(), "wrap", "**")}><Bold {...i} /></button>
        <button type="button" className="tb-btn" title="Italic" aria-label="Italic" onClick={() => apply(v(), "wrap", "_")}><Italic {...i} /></button>
        <button type="button" className="tb-btn" title="Inline code" aria-label="Inline code" onClick={() => apply(v(), "wrap", "`")}><Code {...i} /></button>
        <button type="button" className="tb-btn" title="Link" aria-label="Link" onClick={() => apply(v(), "wrap", "[", "](/d/dept/slug#heading)")}><Link2 {...i} /></button>
        <span className="tb-sep" />
        <button type="button" className="tb-btn" title="Bulleted list" aria-label="Bulleted list" onClick={() => apply(v(), "prefix", "- ")}><List {...i} /></button>
        <button type="button" className="tb-btn" title="Numbered step" aria-label="Numbered step" onClick={() => apply(v(), "prefix", "1. ")}><ListOrdered {...i} /></button>
        <button type="button" className="tb-btn" title="Code block" aria-label="Code block" onClick={() => apply(v(), "block", "```bash\ncommand\n```")}><SquareCode {...i} /></button>
        <button type="button" className="tb-btn" title="Table" aria-label="Table" onClick={() => apply(v(), "block", "| Column | Column |\n| - | - |\n| Value | Value |")}><Table {...i} /></button>
        <span className="tb-sep" />
        <button type="button" className="tb-btn tb-text" title="Warning callout" onClick={() => apply(v(), "block", "> [!WARNING]\n> What can go wrong.")}><MessageSquareWarning {...i} /> Warning</button>
        <button type="button" className="tb-btn tb-text" title="TODO callout" onClick={() => apply(v(), "block", "> [!TODO]\n> What is missing and who fills it.")}>TODO</button>
        <button type="button" className="tb-btn tb-text" title="Collapsible (HTML)" onClick={() => apply(v(), "block", "<details>\n<summary>Title</summary>\n\nHidden content.\n\n</details>")}><ChevronRightSquare {...i} /> Details</button>
      </div>
      <CodeMirror
        ref={ref}
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={dark ? "dark" : "light"}
        basicSetup={{ foldGutter: false, highlightActiveLine: true }}
        minHeight="28rem"
        aria-label="Markdown source"
      />
    </div>
  );
}
