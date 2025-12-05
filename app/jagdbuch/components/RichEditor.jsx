"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => editor.chain().focus().toggleBold().run()}>
          Fett
        </button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}>
          Kursiv
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
        >
          Liste
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          Überschrift
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
        >
          Zitat
        </button>
      </div>

      {/* Editor Box */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 10,
          padding: 12,
          background: "white",
          minHeight: 220,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
