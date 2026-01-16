import TiptapImage from '@tiptap/extension-image';

export const Logo = TiptapImage.extend({
    name: 'logo',

    addAttributes() {
        return {
            ...this.parent?.(),
            'maily-component': {
                default: 'logo',
                renderHTML: (attributes) => ({
                    'data-maily-component': attributes['maily-component'],
                }),
                parseHTML: (element) => element.getAttribute('data-maily-component'),
            },
            size: {
                default: 'sm',
                parseHTML: (element) => element.getAttribute('data-size'),
                renderHTML: (attributes) => ({ 'data-size': attributes.size }),
            },
            alignment: {
                default: 'left',
                parseHTML: (element) => element.getAttribute('data-alignment'),
                renderHTML: (attributes) => ({ 'data-alignment': attributes.alignment }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'img[data-maily-component="logo"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        // Simplified render, real one might use ReactNodeView if interactivity needed.
        // For now, standard img tag with classes is fine.
        return ['img', HTMLAttributes];
    }
});
