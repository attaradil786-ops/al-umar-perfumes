'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({
  content,
  onChange,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none p-4 min-h-[220px] focus:outline-none bg-white text-[#121212]',
      },
    },
  });

  // Sync content when policy switch occurs
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="p-4 border border-[#E8DCC8] rounded-xl bg-white text-xs text-[#7A5B37] animate-pulse">
        Initializing Rich Text Editor...
      </div>
    );
  }

  return (
    <div className="border border-[#E8DCC8] rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#1E6B5C]">
      {/* Tiptap Toolbar */}
      <div className="bg-[#FFF8EC]/80 border-b border-[#E8DCC8] p-2 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 rounded font-bold transition ${
            editor.isActive('bold')
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 rounded italic transition ${
            editor.isActive('italic')
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2.5 py-1 rounded line-through transition ${
            editor.isActive('strike')
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
          title="Strikethrough"
        >
          S
        </button>

        <span className="w-px h-4 bg-[#E8DCC8] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2.5 py-1 rounded font-bold text-xs transition ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 rounded font-bold text-xs transition ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 rounded font-bold text-xs transition ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
        >
          H3
        </button>

        <span className="w-px h-4 bg-[#E8DCC8] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2.5 py-1 rounded transition ${
            editor.isActive('bulletList')
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2.5 py-1 rounded transition ${
            editor.isActive('orderedList')
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2.5 py-1 rounded transition ${
            editor.isActive('blockquote')
              ? 'bg-[#1E6B5C] text-white'
              : 'hover:bg-[#E8DCC8]/60 text-[#553E23]'
          }`}
          title="Blockquote"
        >
          &ldquo; Quote
        </button>

        <span className="w-px h-4 bg-[#E8DCC8] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 py-1 rounded hover:bg-[#E8DCC8]/60 text-[#553E23] disabled:opacity-30"
          title="Undo"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 py-1 rounded hover:bg-[#E8DCC8]/60 text-[#553E23] disabled:opacity-30"
          title="Redo"
        >
          ↻
        </button>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  );
}
