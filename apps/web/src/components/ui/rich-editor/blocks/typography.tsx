import type { BlockItem } from './types';
import {
    Text as TextIcon,
    Heading1,
    Heading2,
    Heading3,
    DivideIcon,
    TextQuote,
    FootprintsIcon,
    Eraser,
} from 'lucide-react';

export const text: BlockItem = {
    title: 'Text',
    description: 'Plain text paragraph',
    searchTerms: ['p', 'paragraph', 'text'],
    icon: <TextIcon className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
    },
};

export const heading1: BlockItem = {
    title: 'Heading 1',
    description: 'Large heading',
    searchTerms: ['h1', 'title', 'big', 'large'],
    icon: <Heading1 className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
};

export const heading2: BlockItem = {
    title: 'Heading 2',
    description: 'Medium heading',
    searchTerms: ['h2', 'subtitle', 'medium'],
    icon: <Heading2 className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
};

export const heading3: BlockItem = {
    title: 'Heading 3',
    description: 'Small heading',
    searchTerms: ['h3', 'subtitle', 'small'],
    icon: <Heading3 className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
};

export const hardBreak: BlockItem = {
    title: 'Hard Break',
    description: 'Line break',
    searchTerms: ['break', 'line', 'br'],
    icon: <DivideIcon className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHardBreak().run();
    },
};

export const blockquote: BlockItem = {
    title: 'Blockquote',
    description: 'Quote block',
    searchTerms: ['quote', 'blockquote'],
    icon: <TextQuote className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
};

export const footer: BlockItem = {
    title: 'Footer',
    description: 'Footer text',
    searchTerms: ['footer', 'text'],
    icon: <FootprintsIcon className="w-4 h-4" />,
    command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setFooter().run();
    },
};

export const clearLine: BlockItem = {
    title: 'Clear Line',
    description: 'Delete current block',
    searchTerms: ['clear', 'delete', 'remove'],
    icon: <Eraser className="w-4 h-4" />,
    command: ({ editor }) => {
        editor.chain().focus().selectParentNode().deleteSelection().run();
    },
};
