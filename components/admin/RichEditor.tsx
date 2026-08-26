"use client";

import { useCallback, useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  Bold, Code, Heading2, Heading3, Image as ImageIcon, Italic, Link2, List,
  ListOrdered, Quote, Redo2, RemoveFormatting, Strikethrough, Table as TableIcon,
  Underline as UnderlineIcon, Undo2,
} from "lucide-react";
import UploadButton from "@/components/admin/UploadButton";

/**
 * The one rich-text editor, shared by the blog editor and the CMS text block.
 *
 * Shared on purpose: two editors would drift, and the blog and page bodies are
 * sanitised by the same allowlist and rendered by the same styles. What you can
 * type in one place should be exactly what you can type in the other.
 *
 * Output is HTML. It is sanitised server-side on save (lib/rich-text.ts) — this
 * component is a convenience, never the security boundary, because anyone can
 * POST to the API without going through it.
 */

/* H1 is deliberately absent: the page already supplies one (the article or
   section title) and a second competes with it for the document outline. */
const HEADINGS = [2, 3] as const;

function Btn({
  on, active, disabled, title, children,
}: {
  on: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={on}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active ?? undefined}
      className={`flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
          : "text-stone-600 hover:bg-white hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  /* window.prompt rather than a bespoke dialog. It is the admin, it is one
     field, and a modal here would be more code than the feature. */
  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Link URL — leave blank to remove", previous);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-stone-300 bg-stone-50 px-2 py-1.5 dark:border-stone-700 dark:bg-stone-800/60">
      {HEADINGS.map((level) => (
        <Btn
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          on={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          {level === 2 ? <Heading2 size={15} /> : <Heading3 size={15} />}
        </Btn>
      ))}
      <span className="mx-1 h-5 w-px bg-stone-300 dark:bg-stone-700" />

      <Btn title="Bold" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></Btn>
      <Btn title="Italic" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></Btn>
      <Btn title="Underline" active={editor.isActive("underline")} on={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} on={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></Btn>
      <Btn title="Inline code" active={editor.isActive("code")} on={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></Btn>
      <span className="mx-1 h-5 w-px bg-stone-300 dark:bg-stone-700" />

      <Btn title="Link" active={editor.isActive("link")} on={setLink}><Link2 size={14} /></Btn>
      <Btn title="Bullet list" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} on={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></Btn>
      <Btn
        title="Insert table"
        on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon size={14} />
      </Btn>
      <span className="mx-1 h-5 w-px bg-stone-300 dark:bg-stone-700" />

      {/* Reuses the same upload control as the cover picker, so images land in
          the media library rather than being pasted as data URIs. */}
      <span className="flex items-center">
        <UploadButton
          accept="image/*"
          label=""
          className="!h-8 !min-w-8 !justify-center !border-0 !bg-transparent !px-2 !py-0"
          onUploaded={(url) => editor.chain().focus().setImage({ src: url }).run()}
        />
        <ImageIcon size={14} className="pointer-events-none -ml-6 text-stone-600 dark:text-stone-300" aria-hidden />
      </span>

      <span className="mx-1 h-5 w-px bg-stone-300 dark:bg-stone-700" />
      <Btn title="Clear formatting" on={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={14} /></Btn>
      <Btn title="Undo" disabled={!editor.can().undo()} on={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></Btn>
      <Btn title="Redo" disabled={!editor.can().redo()} on={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></Btn>
    </div>
  );
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
  minHeight = 320,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const editor = useEditor({
    /* Next renders this on the server first; letting TipTap paint immediately
       produces a hydration mismatch. */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // Opening links inside the editor would navigate away mid-edit.
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "ds-prose focus:outline-none",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  /* Adopt an external change (loading a draft, an AI assist writing the body)
     without clobbering what the author is typing — setContent on every render
     would move the caret to the end on each keystroke. */
  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // Intentionally keyed on `value` only: reacting to `editor` as well would
    // re-run on every editor instance change and fight the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) {
    return (
      <div
        className="rounded-xl border border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"
        style={{ minHeight: minHeight + 44 }}
      />
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <div className="rounded-b-xl border border-stone-300 bg-white px-3.5 py-3 focus-within:border-orange-500 dark:border-stone-700 dark:bg-stone-900">
        <EditorContent editor={editor} />
        {placeholder && editor.isEmpty && (
          <p className="pointer-events-none -mt-[1.9rem] text-sm text-stone-400">{placeholder}</p>
        )}
      </div>
    </div>
  );
}
