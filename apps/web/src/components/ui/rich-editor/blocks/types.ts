import type { Editor, Range } from '@tiptap/core';
import type { ReactNode } from 'react';

export interface CommandProps {
    editor: Editor;
    range: Range;
}

/**
 * BlockItem can be either:
 * 1. A command item with a command function
 * 2. A submenu item with id and nested commands (for headers., footers. etc)
 */
export type BlockItem = {
    title: string;
    description?: string;
    searchTerms: string[];
    icon?: ReactNode;
} & (
        | {
            command: (props: CommandProps) => void;
            id?: never;
            commands?: never;
        }
        | {
            /**
             * ID for slash command query navigation
             * e.g. "headers" allows typing "/headers." to see sub-items
             */
            id: string;
            command?: never;
            commands: BlockItem[];
        }
    );

/**
 * BlockGroupItem is a group of commands with a section title
 */
export interface BlockGroupItem {
    title: string;
    commands: BlockItem[];
}

/**
 * OrganizationContext for template customization
 */
export interface OrganizationContext {
    name: string;
    logoUrl?: string;
}
