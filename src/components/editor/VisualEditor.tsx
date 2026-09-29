"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table,
  Undo2,
} from "lucide-react";

type Props = {
  initial: string;
  onChange: (markdown: string) => void;
  /** Called once with the untouched Markdown output, so the parent can verify a lossless round trip. */
  onReady: (markdown: string) => void;
  editable: boolean;
};

function Btn({ label, active, onClick, children, disabled }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" className="tb-btn" aria-label={label} title={label} aria-pressed={active} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();
  const i = { size: 16, strokeWidth: 1.5 };
  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <Btn label="Heading 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 {...i} /></Btn>
      <Btn label="Heading 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 {...i} /></Btn>
      <Btn label="Heading 4" active={s.h4} onClick={() => c().toggleHeading({ level: 4 }).run()}><Heading4 {...i} /></Btn>
      <span className="tb-sep" />
      <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}><Bold {...i} /></Btn>
      <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic {...i} /></Btn>
      <Btn label="Strikethrough" active={s.strike} onClick={() => c().toggleStrike().run()}><Strikethrough {...i} /></Btn>
      <Btn label="Inline code" active={s.code} onClick={() => c().toggleCode().run()}><Code {...i} /></Btn>
      <Btn
        label="Link"
        active={s.link}
        onClick={() => {
          if (s.link) return c().unsetLink().run();
          const url = prompt("Link URL (internal: /d/<dept>/<slug>#<heading>)");
          if (url) c().setLink({ href: url }).run();
        }}
      >
        <Link2 {...i} />
      </Btn>
      <span className="tb-sep" />
      <Btn label="Bulleted list" active={s.bullet} onClick={() => c().toggleBulletList().run()}><List {...i} /></Btn>
      <Btn label="Numbered steps" active={s.ordered} onClick={() => c().toggleOrderedList().run()}><ListOrdered {...i} /></Btn>
      <Btn label="Quote / callout" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote {...i} /></Btn>
      <Btn label="Code block" active={s.codeBlock} onClick={() => c().toggleCodeBlock().run()}><SquareCode {...i} /></Btn>
      <Btn label="Table" onClick={() => c().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}><Table {...i} /></Btn>
      <Btn label="Divider" onClick={() => c().setHorizontalRule().run()}><Minus {...i} /></Btn>
      <span className="tb-sep" />
      <Btn label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}><Undo2 {...i} /></Btn>
      <Btn label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}><Redo2 {...i} /></Btn>
    </div>
  );
}

export default function VisualEditor({ initial, onChange, onReady, editable }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        underline: false, // not Markdown
        link: { openOnClick: false, autolink: true },
      }),
      TableKit,
      Markdown,
    ],
    content: initial,
    contentType: "markdown",
    editable,
    onCreate: ({ editor: e }) => onReady(e.getMarkdown()),
    editorProps: { attributes: { class: "prose visual-surface", "aria-label": "Section content", role: "textbox", "aria-multiline": "true" } },
    // Immediate, not debounced: a Save click right after typing must include the last keystroke.
    onUpdate: ({ editor: e }) => onChange(e.getMarkdown()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return <div className="editor-loading">Loading editor…</div>;
  return (
    <div className="visual">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
