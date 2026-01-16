import { mergeAttributes, Node } from '@tiptap/core';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_COLUMNS_GAP = 8;
export const DEFAULT_COLUMN_WIDTH = 'auto';
export const DEFAULT_COLUMN_VERTICAL_ALIGN = 'top';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: () => ReturnType;
    };
    column: {
      updateColumn: (attrs: any) => ReturnType;
    }
  }
}

export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      columnId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-column-id') || uuidv4(),
        renderHTML: (attributes) => {
          return { 'data-column-id': attributes.columnId || uuidv4() };
        },
      },
      width: {
        default: DEFAULT_COLUMN_WIDTH,
        parseHTML: (element) => element.style.width.replace(/['"]+/g, '') || DEFAULT_COLUMN_WIDTH,
        renderHTML: (attributes) => {
          if (!attributes.width || attributes.width === DEFAULT_COLUMN_WIDTH) {
            return {};
          }
          return { style: `width: ${attributes.width};` }; // Simplified width handling
        },
      },
      verticalAlign: {
        default: DEFAULT_COLUMN_VERTICAL_ALIGN,
        parseHTML: (element) => element.style.verticalAlign || DEFAULT_COLUMN_VERTICAL_ALIGN,
        renderHTML: (attributes) => {
          if (attributes.verticalAlign && attributes.verticalAlign !== DEFAULT_COLUMN_VERTICAL_ALIGN) {
            return { style: `vertical-align: ${attributes.verticalAlign};` };
          }
          return {};
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const { width, verticalAlign } = node.attrs;
    let style = 'min-width: 0; flex: 1;';
    if (width && width !== 'auto') {
      style += ` width: ${width};`;
    }
    if (verticalAlign && verticalAlign !== 'top') {
      style += ` vertical-align: ${verticalAlign};`;
    }
    return ['td', mergeAttributes(HTMLAttributes, { 'data-type': 'column', style }), 0];
  },

  parseHTML() {
    return [{ tag: 'td[data-type="column"]' }, { tag: 'div[data-type="column"]' }];
  },
});

export const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      gap: {
        default: DEFAULT_COLUMNS_GAP,
        parseHTML: (element) => Number(element.getAttribute('data-gap')) || DEFAULT_COLUMNS_GAP,
        renderHTML: (attributes) => ({ 'data-gap': attributes.gap }),
      },
    };
  },

  addCommands() {
    return {
      setColumns:
        () =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: {},
              content: [
                { type: 'column', attrs: { columnId: uuidv4() }, content: [{ type: 'paragraph' }] },
                { type: 'column', attrs: { columnId: uuidv4() }, content: [{ type: 'paragraph' }] },
              ],
            });
          },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const gap = node.attrs.gap || DEFAULT_COLUMNS_GAP;
    const style = `display: table; width: 100%; table-layout: fixed; border-spacing: ${gap}px 0;`;
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns', style }), 0];
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },
});
