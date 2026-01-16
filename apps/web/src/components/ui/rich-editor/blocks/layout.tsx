import type { BlockItem } from './types';
import { Columns, MoveVertical, Minus } from 'lucide-react';

export const columns: BlockItem = {
    title: 'Columns',
    description: 'Multi-column layout',
    searchTerms: ['layout', 'columns', 'col'],
    icon: <Columns className="w-4 h-4" />,
    command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setColumns().run();
    },
};

export const spacer: BlockItem = {
    title: 'Spacer',
    description: 'Vertical space',
    searchTerms: ['space', 'gap', 'spacer'],
    icon: <MoveVertical className="w-4 h-4" />,
    command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setSpacer({ height: 20 }).run();
    },
};

export const divider: BlockItem = {
    title: 'Divider',
    description: 'Horizontal line',
    searchTerms: ['divider', 'line', 'hr'],
    icon: <Minus className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
};
