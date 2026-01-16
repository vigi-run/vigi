import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SimpleEditor({ value, onChange, placeholder }: SimpleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      // Check if content is actually different to avoid cursor jumps or loops
      // Simple check: strip tags? Or just trust Tiptap?
      // Tiptap's setContent replaces everything. 
      // Only update if value is DRASTICALLY different (like initial load)
      // Or if editor is empty.
      if (editor.getText() === "" && value !== "<p></p>") {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <div className="border-b bg-muted/30 p-1 flex items-center gap-1">
        <Button
          variant={editor.isActive('bold') ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button
          variant={editor.isActive('bulletList') ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="p-0" />
    </div>
  );
}
