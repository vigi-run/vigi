import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { SlashCommand } from './slash-command';
import { EditorBubbleMenu } from './bubble-menu';
import { useEffect } from 'react';

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Type \'/\' for commands...',
                emptyNodeClass: 'first:before:text-gray-400 first:before:float-left first:before:content-[attr(data-placeholder)] first:before:pointer-events-none',
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline cursor-pointer',
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            SlashCommand,
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'min-h-[300px] w-full max-w-none prose prose-sm dark:prose-invert focus:outline-none p-4',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update content if value changes externally (e.g. loaded from API)
    useEffect(() => {
        if (editor && value && editor.getHTML() !== value) {
            // Only update if editor is empty or content is drastically different to avoid loops
            if (editor.getText() === "" && value !== "<p></p>") {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="relative w-full border rounded-md bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
            <EditorBubbleMenu editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
