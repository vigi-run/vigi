import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Type,
    Minus,
    Quote,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";

const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex(
                    (selectedIndex + props.items.length - 1) % props.items.length
                );
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="z-50 min-w-[300px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <div className="overflow-hidden p-1 text-foreground">
                {props.items.length ? (
                    props.items.map((item: any, index: number) => (
                        <Button
                            key={index}
                            variant="ghost"
                            className={`flex w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-sm outline-none ${(index === selectedIndex) ? "bg-accent text-accent-foreground" : ""}`}
                            onClick={() => selectItem(index)}
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                                <item.icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">{item.title}</span>
                            </div>
                        </Button>
                    ))
                ) : (
                    <div className="p-2 text-sm text-muted-foreground">No result</div>
                )}
            </div>
        </div>
    );
});

CommandList.displayName = "CommandList";

const renderItems = () => {
    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            const getReferenceClientRect = props.clientRect;

            popup = tippy("body", {
                getReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            });
        },
        onUpdate: (props: any) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup?.[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown: (props: any) => {
            if (props.event.key === "Escape") {
                popup?.[0].hide();
                return true;
            }
            return (component?.ref as any)?.onKeyDown(props);
        },
        onExit: () => {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "Heading 1",
            icon: Heading1,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 1 })
                    .run();
            },
        },
        {
            title: "Heading 2",
            icon: Heading2,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 2 })
                    .run();
            },
        },
        {
            title: "Heading 3",
            icon: Heading3,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 3 })
                    .run();
            },
        },
        {
            title: "Text",
            icon: Type,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setParagraph().run();
            },
        },
        {
            title: "Bullet List",
            icon: List,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: "Ordered List",
            icon: ListOrdered,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: "Quote",
            icon: Quote,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: "Divider",
            icon: Minus,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
    ].filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
    );
};

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
}).configure({
    suggestion: {
        items: getSuggestionItems,
        render: renderItems,
    },
});
