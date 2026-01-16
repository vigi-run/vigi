import type { BlockItem, OrganizationContext } from './types';
import { PanelTop } from 'lucide-react';

export function getHeaderBlocks(org?: OrganizationContext): BlockItem[] {
    const logoSrc = org?.logoUrl || 'https://via.placeholder.com/48x48?text=Logo';
    const companyName = org?.name || 'Company Name';

    return [
        {
            title: 'Logo + Text (Horizontal)',
            description: 'Logo and text side by side',
            searchTerms: ['logo', 'horizontal'],
            icon: <PanelTop className="w-4 h-4" />,
            command: ({ editor, range }) => {
                editor.chain().deleteRange(range).insertContent({
                    type: 'columns',
                    attrs: { gap: 8 },
                    content: [
                        {
                            type: 'column',
                            attrs: { columnId: crypto.randomUUID(), width: 'auto', verticalAlign: 'middle' },
                            content: [{ type: 'image', attrs: { src: logoSrc, width: '32', height: '32', alignment: 'left' } }],
                        },
                        {
                            type: 'column',
                            attrs: { columnId: crypto.randomUUID(), width: 'auto', verticalAlign: 'middle' },
                            content: [{ type: 'heading', attrs: { textAlign: 'right', level: 3 }, content: [{ type: 'text', marks: [{ type: 'bold' }], text: companyName }] }],
                        },
                    ],
                }).run();
            },
        },
        {
            title: 'Logo + Text (Vertical)',
            description: 'Logo centered with text below',
            searchTerms: ['logo', 'vertical', 'center'],
            icon: <PanelTop className="w-4 h-4" />,
            command: ({ editor, range }) => {
                editor.chain().deleteRange(range).insertContent([
                    { type: 'image', attrs: { src: logoSrc, width: '48', height: '48', alignment: 'center' } },
                    { type: 'spacer', attrs: { height: 8 } },
                    { type: 'heading', attrs: { textAlign: 'center', level: 2 }, content: [{ type: 'text', text: companyName }] },
                ]).run();
            },
        },
        {
            title: 'Logo + Cover Image',
            description: 'Cover image with logo and date',
            searchTerms: ['cover', 'image', 'logo'],
            icon: <PanelTop className="w-4 h-4" />,
            command: ({ editor, range }) => {
                const todayFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                editor.chain().deleteRange(range).insertContent([
                    { type: 'image', attrs: { src: 'https://via.placeholder.com/600x200?text=Cover+Image', width: 600, height: 200, alignment: 'center' } },
                    { type: 'spacer', attrs: { height: 16 } },
                    {
                        type: 'columns',
                        attrs: { gap: 8 },
                        content: [
                            { type: 'column', attrs: { columnId: crypto.randomUUID(), width: 'auto', verticalAlign: 'middle' }, content: [{ type: 'image', attrs: { src: logoSrc, width: '48', height: '48', alignment: 'left' } }] },
                            {
                                type: 'column',
                                attrs: { columnId: crypto.randomUUID(), width: 'auto', verticalAlign: 'middle' },
                                content: [{ type: 'paragraph', attrs: { textAlign: 'right' }, content: [{ type: 'text', marks: [{ type: 'bold' }], text: companyName }, { type: 'hardBreak' }, { type: 'text', text: todayFormatted }] }],
                            },
                        ],
                    },
                ]).run();
            },
        },
    ];
}

export function createHeadersSubmenu(org?: OrganizationContext): BlockItem {
    return {
        id: 'headers',
        title: 'Headers',
        description: 'Pre-designed header templates',
        searchTerms: ['header', 'headers', 'top'],
        icon: <PanelTop className="w-4 h-4" />,
        commands: getHeaderBlocks(org),
    };
}
