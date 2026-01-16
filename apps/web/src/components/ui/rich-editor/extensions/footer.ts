import { mergeAttributes, Node } from '@tiptap/core';

export interface FooterOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footer: {
      setFooter: () => ReturnType;
    };
  }
}

export const Footer = Node.create<FooterOptions>({
  name: 'footer',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      'maily-component': {
        default: 'footer',
        renderHTML: (attributes) => {
          return {
            'data-maily-component': attributes['maily-component'],
          };
        },
        parseHTML: (element) => element?.getAttribute('data-maily-component'),
      },
    };
  },

  addCommands() {
    return {
      setFooter:
        () =>
          ({ commands }) => {
            return commands.setNode(this.name);
          },
    };
  },

  parseHTML() {
    return [{ tag: 'small[data-maily-component="footer"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: 'font-size: 13px; color: #6b7280; text-align: center; margin: 8px 0;',
      }),
      0,
    ];
  },
});
