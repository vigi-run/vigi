import type { BlockGroupItem, OrganizationContext } from './types';
import { text, heading1, heading2, heading3, hardBreak, blockquote, footer, clearLine } from './typography';
import { bulletList, orderedList } from './lists';
import { columns, spacer, divider } from './layout';
import { image, logo } from './images';
import { button } from './buttons';
import { createHeadersSubmenu } from './headers';
import { createFootersSubmenu } from './footers';

export function getDefaultSlashCommands(org?: OrganizationContext): BlockGroupItem[] {
    return [
        {
            title: 'Blocks',
            commands: [
                text,
                heading1,
                heading2,
                heading3,
                bulletList,
                orderedList,
                image,
                logo,
                columns,
                divider,
                spacer,
                button,
                hardBreak,
                blockquote,
                footer,
                clearLine,
            ],
        },
        {
            title: 'Components',
            commands: [
                createHeadersSubmenu(org),
                createFootersSubmenu(org),
            ],
        },
    ];
}
