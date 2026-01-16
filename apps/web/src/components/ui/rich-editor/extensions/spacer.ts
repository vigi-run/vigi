import { mergeAttributes, Node } from '@tiptap/core';

export interface SpacerOptions {
    height: number;
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        spacer: {
            setSpacer: (options: { height: number }) => ReturnType;
        };
    }
}

export const Spacer = Node.create<SpacerOptions>({
    name: 'spacer',
    group: 'block',
    draggable: true,

    addAttributes() {
        return {
            height: {
                default: 8,
                parseHTML: (element) => Number(element.getAttribute('data-height')),
                renderHTML: (attributes) => {
                    return {
                        'data-height': attributes.height,
                    };
                },
            },
        };
    },

    addCommands() {
        return {
            setSpacer:
                (options) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: {
                                height: options.height,
                            },
                        });
                    },
        };
    },

    renderHTML({ HTMLAttributes, node }) {
        const { height } = node.attrs as SpacerOptions;

        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: 'spacer',
                contenteditable: false,
                style: `height: ${height}px; width: 100%;`,
            }),
        ];
    },

    parseHTML() {
        return [{ tag: `div[data-type="${this.name}"]` }];
    },
});
