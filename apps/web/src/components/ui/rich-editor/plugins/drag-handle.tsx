import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { DragHandlePlugin, dragHandlePluginKey } from './drag-handle-plugin';
import { GripVertical } from 'lucide-react';

export interface DragHandleProps {
  editor: Editor;
  className?: string;
}

export function DragHandle({ editor, className }: DragHandleProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const pluginRef = useRef<ReturnType<typeof DragHandlePlugin> | null>(null);
  const [, setCurrentNode] = useState<ProseMirrorNode | null>(null);

  useEffect(() => {
    if (!element || editor.isDestroyed) {
      return () => {
        pluginRef.current = null;
      };
    }

    if (!pluginRef.current) {
      pluginRef.current = DragHandlePlugin({
        editor,
        element,
        onNodeChange: ({ node }) => {
          setCurrentNode(node);
        },
      });

      editor.registerPlugin(pluginRef.current);
    }

    return () => {
      if (pluginRef.current) {
        editor.unregisterPlugin(dragHandlePluginKey);
        pluginRef.current = null;
      }
    };
  }, [element, editor]);

  return (
    <div
      ref={setElement}
      className={`drag-handle flex items-center justify-center w-6 h-6 rounded hover:bg-muted cursor-grab active:cursor-grabbing ${className || ''}`}
      draggable="true"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
