/**
 * Drag Handle Plugin for Tiptap
 * Based on Maily's implementation
 * 
 * This plugin provides a draggable handle that appears on the left side of blocks,
 * allowing users to reorder content by dragging.
 */

import { Plugin, PluginKey, Selection } from '@tiptap/pm/state';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Editor } from '@tiptap/core';
import tippy from 'tippy.js';
import type { Instance, Props as TippyProps } from 'tippy.js';

export const dragHandlePluginKey = new PluginKey('dragHandle');

export interface DragHandlePluginProps {
    editor: Editor;
    element: HTMLElement;
    tippyOptions?: Partial<TippyProps>;
    onNodeChange?: (data: { node: ProseMirrorNode | null; pos: number }) => void;
}

function getNodeAtCoords(coords: { x: number; y: number }, editor: Editor) {
    const elements = document.elementsFromPoint(coords.x, coords.y);
    const proseMirrorIndex = elements.findIndex((el) =>
        el.classList.contains('ProseMirror')
    );

    if (proseMirrorIndex === -1) return null;

    const filteredElements = elements.slice(0, proseMirrorIndex);
    if (filteredElements.length === 0) return null;

    const element = filteredElements[0] as HTMLElement;
    const pos = editor.view.posAtDOM(element, 0);

    if (pos < 0) return null;

    // Find the top-level block node
    const $pos = editor.state.doc.resolve(pos);
    let depth = $pos.depth;

    while (depth > 1) {
        depth--;
    }

    const nodePos = depth === 0 ? pos : $pos.before(1);
    const node = editor.state.doc.nodeAt(nodePos);

    return { element, node, pos: nodePos };
}

function getOuterElement(view: any, element: Node): HTMLElement | null {
    let current: Node | null = element;

    while (current && current.parentNode && current.parentNode !== view.dom) {
        current = current.parentNode;
    }

    return current as HTMLElement | null;
}

export function DragHandlePlugin(options: DragHandlePluginProps): Plugin {
    const { editor, element, tippyOptions, onNodeChange } = options;

    let tippyInstance: Instance | null = null;
    let currentNode: ProseMirrorNode | null = null;
    let currentPos = -1;
    let isDragging = false;
    let locked = false;

    // Container for tippy - needs pointer-events for interaction
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.pointerEvents = 'auto';

    // Setup drag events
    element.addEventListener('dragstart', (event) => {
        if (!event.dataTransfer || currentPos < 0) return;

        isDragging = true;

        const { view, state } = editor;
        const node = state.doc.nodeAt(currentPos);

        if (!node) return;

        // Create drag image
        const domNode = view.nodeDOM(currentPos) as HTMLElement;
        if (!domNode) return;

        const clone = domNode.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = '-10000px';
        clone.style.opacity = '0.5';
        document.body.appendChild(clone);

        event.dataTransfer.setDragImage(clone, 0, 0);
        event.dataTransfer.effectAllowed = 'move';

        // Select the node
        const nodeSize = node.nodeSize;
        const tr = state.tr.setSelection(
            Selection.near(state.doc.resolve(currentPos))
        );
        view.dispatch(tr);

        // Setup drag data
        view.dragging = {
            slice: state.doc.slice(currentPos, currentPos + nodeSize),
            move: true,
        };

        setTimeout(() => {
            element.style.pointerEvents = 'none';
        }, 0);

        document.addEventListener('drop', () => {
            clone.remove();
        }, { once: true });
    });

    element.addEventListener('dragend', () => {
        isDragging = false;
        element.style.pointerEvents = 'auto';
    });

    return new Plugin({
        key: dragHandlePluginKey,

        state: {
            init: () => ({ locked: false }),
            apply(tr, value) {
                const lockMeta = tr.getMeta('lockDragHandle');
                const hideMeta = tr.getMeta('hideDragHandle');

                if (lockMeta !== undefined) {
                    locked = lockMeta;
                }

                if (hideMeta && tippyInstance) {
                    tippyInstance.hide();
                    currentNode = null;
                    currentPos = -1;
                    onNodeChange?.({ node: null, pos: -1 });
                }

                return value;
            },
        },

        view(editorView) {
            element.draggable = true;
            element.style.cursor = 'grab';

            // Append container to editor parent
            const parent = editorView.dom.parentElement;
            if (parent) {
                parent.appendChild(container);
            }
            container.appendChild(element);

            // Create tippy instance
            tippyInstance = tippy(editorView.dom, {
                getReferenceClientRect: null,
                interactive: true,
                trigger: 'manual',
                placement: 'left-start',
                hideOnClick: false,
                duration: 50,
                zIndex: 50,
                offset: [0, 4], // Small offset to the left
                popperOptions: {
                    modifiers: [
                        { name: 'flip', enabled: false },
                        {
                            name: 'preventOverflow',
                            options: { mainAxis: false },
                        },
                    ],
                },
                ...tippyOptions,
                appendTo: container,
                content: element,
            });

            return {
                update() {
                    // Position updates handled in mousemove
                },
                destroy() {
                    tippyInstance?.destroy();
                    container.remove();
                },
            };
        },

        props: {
            handleDOMEvents: {
                mouseleave(_view, event) {
                    if (locked || isDragging) return false;

                    const relatedTarget = event.relatedTarget as Node;
                    if (container.contains(relatedTarget)) return false;

                    tippyInstance?.hide();
                    currentNode = null;
                    currentPos = -1;
                    onNodeChange?.({ node: null, pos: -1 });

                    return false;
                },

                mousemove(view, event) {
                    if (!element || !tippyInstance || locked || isDragging) {
                        return false;
                    }

                    const result = getNodeAtCoords(
                        { x: event.clientX, y: event.clientY },
                        editor
                    );

                    if (!result || !result.node) {
                        return false;
                    }

                    const outerElement = getOuterElement(view, result.element);
                    if (!outerElement || outerElement === view.dom) {
                        return false;
                    }

                    // Only update if node changed
                    if (result.node !== currentNode || result.pos !== currentPos) {
                        currentNode = result.node;
                        currentPos = result.pos;

                        onNodeChange?.({ node: currentNode, pos: currentPos });

                        tippyInstance.setProps({
                            getReferenceClientRect: () => outerElement.getBoundingClientRect(),
                        });

                        tippyInstance.show();
                    }

                    return false;
                },
            },
        },
    });
}
