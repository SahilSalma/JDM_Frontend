'use client';

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Quote,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type your message content here...',
  minHeight = '180px',
}: RichTextEditorProps) {
  const lastExternalValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'focus:outline-none px-3 py-2 text-sm text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastExternalValue.current = html;
      onChange(html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml && value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex size-7 items-center justify-center rounded text-xs transition-colors ${
        isActive
          ? 'bg-[#DC2626]/20 text-[#DC2626]'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );

  if (!editor) return null;

  return (
    <>
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap { min-height: ${minHeight}; }
        .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
        .tiptap h2 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0; }
        .tiptap p { margin: 0.25rem 0; }
        .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.25rem 0; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.25rem 0; }
        .tiptap li { margin: 0.125rem 0; }
        .tiptap blockquote {
          border-left: 3px solid #DC2626;
          margin: 0.5rem 0;
          padding-left: 1rem;
          color: #6b7280;
          font-style: italic;
        }
        .tiptap a { color: #DC2626; text-decoration: underline; }
      `}</style>
      <div className="overflow-hidden rounded-lg border border-border bg-muted focus-within:border-[#DC2626] transition-colors">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5">
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="size-3.5" />
        </ToolButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="size-3.5" />
        </ToolButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="size-3.5" />
        </ToolButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Insert Link"
        >
          <LinkIcon className="size-3.5" />
        </ToolButton>
      </div>
      <EditorContent editor={editor} />
    </div>
    </>
  );
}
