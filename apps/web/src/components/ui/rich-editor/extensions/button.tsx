import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';

// React component for editing the button in the editor
const ButtonNodeView = ({ node, updateAttributes }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const { text, url, alignment, variant, borderRadius, buttonColor, textColor } = node.attrs;

    const buttonStyle: React.CSSProperties = {
        display: 'inline-block',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        textDecoration: 'none',
        textAlign: 'center' as const,
        cursor: 'pointer',
        backgroundColor: variant === 'filled' ? (buttonColor || '#0f766e') : 'transparent',
        color: variant === 'filled' ? (textColor || '#ffffff') : (buttonColor || '#0f766e'),
        border: variant === 'outline' ? `2px solid ${buttonColor || '#0f766e'}` : 'none',
        borderRadius: borderRadius === 'round' ? '9999px' : borderRadius === 'smooth' ? '6px' : '0px',
    };

    const wrapperStyle: React.CSSProperties = {
        textAlign: alignment as any,
        margin: '16px 0',
    };

    if (isEditing) {
        return (
            <NodeViewWrapper style={wrapperStyle}>
                <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => updateAttributes({ text: e.target.value })}
                            placeholder="Button text"
                            className="flex-1 px-2 py-1 text-sm border rounded"
                        />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => updateAttributes({ url: e.target.value })}
                            placeholder="URL"
                            className="flex-1 px-2 py-1 text-sm border rounded"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <select
                            value={alignment}
                            onChange={(e) => updateAttributes({ alignment: e.target.value })}
                            className="px-2 py-1 text-sm border rounded"
                        >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                        <select
                            value={variant}
                            onChange={(e) => updateAttributes({ variant: e.target.value })}
                            className="px-2 py-1 text-sm border rounded"
                        >
                            <option value="filled">Filled</option>
                            <option value="outline">Outline</option>
                        </select>
                        <input
                            type="color"
                            value={buttonColor || '#0f766e'}
                            onChange={(e) => updateAttributes({ buttonColor: e.target.value })}
                            className="w-8 h-8 border rounded cursor-pointer"
                            title="Button color"
                        />
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper style={wrapperStyle}>
            <a
                href={url}
                style={buttonStyle}
                onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                }}
                title="Click to edit button"
            >
                {text}
            </a>
        </NodeViewWrapper>
    );
};

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        button: {
            setButton: () => ReturnType;
        };
    }
}

export const Button = Node.create({
    name: 'button',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            text: { default: 'Click me' },
            url: { default: '#' },
            alignment: { default: 'center' },
            variant: { default: 'filled' },
            borderRadius: { default: 'smooth' },
            buttonColor: { default: '#0f766e' },
            textColor: { default: '#ffffff' },
        };
    },

    addCommands() {
        return {
            setButton:
                () =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { text: 'Click me', url: '#' },
                        });
                    },
        };
    },

    parseHTML() {
        return [{
            tag: 'div[data-type="button"]',
            getAttrs: (element) => {
                if (typeof element === 'string') return false;
                const el = element as HTMLElement;
                return {
                    text: el.getAttribute('data-text') || 'Click me',
                    url: el.getAttribute('data-url') || '#',
                    alignment: el.getAttribute('data-alignment') || 'center',
                    variant: el.getAttribute('data-variant') || 'filled',
                    borderRadius: el.getAttribute('data-border-radius') || 'smooth',
                    buttonColor: el.getAttribute('data-button-color') || '#0f766e',
                    textColor: el.getAttribute('data-text-color') || '#ffffff',
                };
            },
        }];
    },

    renderHTML({ HTMLAttributes }) {
        const { text, url, alignment, variant, borderRadius, buttonColor, textColor } = HTMLAttributes;

        const buttonStyle = `
            display: inline-block;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
            cursor: pointer;
            background-color: ${variant === 'filled' ? (buttonColor || '#0f766e') : 'transparent'};
            color: ${variant === 'filled' ? (textColor || '#ffffff') : (buttonColor || '#0f766e')};
            border: ${variant === 'outline' ? `2px solid ${buttonColor || '#0f766e'}` : 'none'};
            border-radius: ${borderRadius === 'round' ? '9999px' : borderRadius === 'smooth' ? '6px' : '0px'};
        `.replace(/\s+/g, ' ').trim();

        const wrapperStyle = `text-align: ${alignment}; margin: 16px 0;`;

        return [
            'div',
            mergeAttributes({ 'data-type': 'button', style: wrapperStyle }),
            ['a', { href: url, style: buttonStyle, target: '_blank' }, text]
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ButtonNodeView);
    },
});
