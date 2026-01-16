import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { SlashCommand, getSlashCommandSuggestion } from './slash-command';
import { EditorBubbleMenu } from './bubble-menu';
import { DragHandle } from './plugins/drag-handle';
import { useEffect, useMemo } from 'react';

import Image from '@tiptap/extension-image';
import { Spacer } from "./extensions/spacer";
import { Footer } from "./extensions/footer";
import { Columns, Column } from "./extensions/columns";
import { Logo } from "./extensions/logo";
import { Button } from "./extensions/button";

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    organization?: {
        name: string;
        logoUrl?: string;
    };
}

export function RichEditor({ value, onChange, placeholder, organization }: RichEditorProps) {
    const suggestion = useMemo(() => getSlashCommandSuggestion(organization), [organization]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
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
                types: ['heading', 'paragraph', 'footer', 'button'],
            }),
            Image,
            Spacer,
            Footer,
            Columns,
            Column,
            Logo,
            Button,
            SlashCommand.configure({
                suggestion,
            }),
        ],
        editorProps: {
            attributes: {
                class: 'min-h-[300px] w-full max-w-none prose prose-sm dark:prose-invert focus:outline-none p-4 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:leading-10 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-9 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-10',
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
            <DragHandle editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
