import type { BlockItem } from './types';
import { MousePointer } from 'lucide-react';

export const button: BlockItem = {
    title: 'Button',
    description: 'Call to action button',
    searchTerms: ['button', 'cta', 'link', 'btn'],
    icon: <MousePointer className="w-4 h-4" />,
    command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setButton().run();
    },
};
