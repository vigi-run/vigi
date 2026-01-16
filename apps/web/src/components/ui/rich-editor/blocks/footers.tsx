import type { BlockItem, OrganizationContext } from './types';
import { PanelBottom, Copyright, LayoutTemplate } from 'lucide-react';

export function getFooterBlocks(org?: OrganizationContext): BlockItem[] {
    const logoSrc = org?.logoUrl || 'https://via.placeholder.com/32x32?text=Logo';
    const companyName = org?.name || 'Company Name';
    const currentYear = new Date().getFullYear();

    return [
        {
            title: 'Copyright Footer',
            description: 'Simple copyright text',
            searchTerms: ['copyright', 'simple'],
            icon: <Copyright className="w-4 h-4" />,
            command: ({ editor, range }) => {
                editor.chain().deleteRange(range).insertContent([
                    { type: 'horizontalRule' },
                    { type: 'spacer', attrs: { height: 16 } },
                    { type: 'footer', content: [{ type: 'text', text: `© ${currentYear} ${companyName}. All rights reserved.` }] },
                ]).run();
            },
        },
        {
            title: 'Feedback Footer',
            description: 'With feedback call to action',
            searchTerms: ['feedback', 'cta', 'community'],
            icon: <PanelBottom className="w-4 h-4" />,
            command: ({ editor, range }) => {
                editor.chain().deleteRange(range).insertContent([
                    { type: 'image', attrs: { src: logoSrc, width: '42', height: '42', alignment: 'left' } },
                    { type: 'spacer', attrs: { height: 16 } },
                    { type: 'footer', content: [{ type: 'text', text: 'Enjoyed this update?' }, { type: 'hardBreak' }, { type: 'text', text: 'We\'d love your feedback - simply reply to this email!' }] },
                ]).run();
            },
        },
        {
            title: 'Company Signature',
            description: 'Full footer with links and social',
            searchTerms: ['signature', 'company', 'links'],
            icon: <LayoutTemplate className="w-4 h-4" />,
            command: ({ editor, range }) => {
                editor.chain().deleteRange(range).insertContent([
                    { type: 'horizontalRule' },
                    { type: 'spacer', attrs: { height: 16 } },
                    { type: 'image', attrs: { src: logoSrc, width: '48', height: '48', alignment: 'center' } },
                    { type: 'spacer', attrs: { height: 8 } },
                    { type: 'heading', attrs: { textAlign: 'center', level: 3 }, content: [{ type: 'text', text: companyName }] },
                    { type: 'spacer', attrs: { height: 4 } },
                    { type: 'footer', content: [{ type: 'text', text: '123 Business St, City, Country' }] },
                    { type: 'footer', content: [{ type: 'text', text: 'Unsubscribe | Privacy Policy | Contact' }] },
                ]).run();
            },
        },
    ];
}

export function createFootersSubmenu(org?: OrganizationContext): BlockItem {
    return {
        id: 'footers',
        title: 'Footers',
        description: 'Pre-designed footer templates',
        searchTerms: ['footer', 'footers', 'bottom'],
        icon: <PanelBottom className="w-4 h-4" />,
        commands: getFooterBlocks(org),
    };
}
