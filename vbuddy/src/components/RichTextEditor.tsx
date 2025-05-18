"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="border-b border-gray-300 p-2 flex gap-2">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${
            editor?.isActive("bold") ? "bg-gray-200" : ""
          }`}
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${
            editor?.isActive("italic") ? "bg-gray-200" : ""
          }`}
          type="button"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${
            editor?.isActive("bulletList") ? "bg-gray-200" : ""
          }`}
          type="button"
        >
          • List
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-1 rounded ${
            editor?.isActive("orderedList") ? "bg-gray-200" : ""
          }`}
          type="button"
        >
          1. List
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
};

export default RichTextEditor;
