import { BlockItem } from './types';
import { List, ListOrdered } from 'lucide-react';

export const bulletList: BlockItem = {
    title: 'Bullet List',
    description: 'Unordered list',
    searchTerms: ['unordered', 'bullet', 'point', 'ul'],
    icon: <List className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
};

export const orderedList: BlockItem = {
    title: 'Numbered List',
    description: 'Ordered list',
    searchTerms: ['ordered', 'numbered', 'ol'],
    icon: <ListOrdered className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
};
