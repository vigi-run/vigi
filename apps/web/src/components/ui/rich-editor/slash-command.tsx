import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, Fragment } from "react";
import type { KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import type { BlockGroupItem, BlockItem, OrganizationContext } from './blocks/types';
import { getDefaultSlashCommands } from './blocks';

interface CommandListProps {
    items: BlockGroupItem[];
    command: (item: BlockItem) => void;
    query: string;
    organization?: OrganizationContext;
}

/**
 * Filter commands based on search query
 */
function filterCommands(groups: BlockGroupItem[], query: string): BlockGroupItem[] {
    if (!query) return groups;

    const lowerQuery = query.toLowerCase();

    // Check if we're navigating into a submenu (e.g., "headers.")
    const dotIndex = query.indexOf('.');
    if (dotIndex > 0) {
        const submenuId = query.slice(0, dotIndex).toLowerCase();
        const subQuery = query.slice(dotIndex + 1).toLowerCase();

        // Find the submenu item
        for (const group of groups) {
            for (const cmd of group.commands) {
                if ('id' in cmd && cmd.id?.toLowerCase() === submenuId) {
                    // Return filtered sub-commands
                    const filteredCommands = (cmd.commands || []).filter(subCmd =>
                        subCmd.title.toLowerCase().includes(subQuery) ||
                        subCmd.searchTerms?.some(term => term.toLowerCase().includes(subQuery))
                    );
                    return [{
                        title: cmd.title,
                        commands: filteredCommands,
                    }];
                }
            }
        }
    }

    // Regular search
    return groups.map(group => ({
        title: group.title,
        commands: group.commands.filter(cmd =>
            cmd.title.toLowerCase().includes(lowerQuery) ||
            cmd.searchTerms?.some(term => term.toLowerCase().includes(lowerQuery))
        ),
    })).filter(group => group.commands.length > 0);
}

const CommandList = forwardRef<unknown, CommandListProps>((props, ref) => {
    const { items: groups, command } = props;

    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectItem = useCallback((groupIndex: number, commandIndex: number) => {
        const item = groups[groupIndex]?.commands[commandIndex];
        if (!item) return;
        command(item);
    }, [groups, command]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (['ArrowUp', 'ArrowDown', 'Enter', 'ArrowRight'].includes(event.key)) {
                let newGroupIndex = selectedGroupIndex;
                let newCommandIndex = selectedCommandIndex;

                switch (event.key) {
                    case 'ArrowRight': {
                        // Enter submenu if it's a submenu item
                        const currentItem = groups[selectedGroupIndex]?.commands[selectedCommandIndex];
                        if (currentItem && 'id' in currentItem && currentItem.commands) {
                            selectItem(selectedGroupIndex, selectedCommandIndex);
                            return true;
                        }
                        return false;
                    }
                    case 'Enter':
                        if (!groups.length) return false;
                        selectItem(selectedGroupIndex, selectedCommandIndex);
                        return true;
                    case 'ArrowUp':
                        if (!groups.length) return false;
                        newCommandIndex = selectedCommandIndex - 1;
                        if (newCommandIndex < 0) {
                            newGroupIndex = selectedGroupIndex - 1;
                            if (newGroupIndex < 0) newGroupIndex = groups.length - 1;
                            newCommandIndex = (groups[newGroupIndex]?.commands.length || 1) - 1;
                        }
                        setSelectedGroupIndex(newGroupIndex);
                        setSelectedCommandIndex(newCommandIndex);
                        return true;
                    case 'ArrowDown':
                        if (!groups.length) return false;
                        newCommandIndex = selectedCommandIndex + 1;
                        if (newCommandIndex >= (groups[selectedGroupIndex]?.commands.length || 0)) {
                            newCommandIndex = 0;
                            newGroupIndex = selectedGroupIndex + 1;
                            if (newGroupIndex >= groups.length) newGroupIndex = 0;
                        }
                        setSelectedGroupIndex(newGroupIndex);
                        setSelectedCommandIndex(newCommandIndex);
                        return true;
                }
            }
            return false;
        },
    }));

    useEffect(() => {
        setSelectedGroupIndex(0);
        setSelectedCommandIndex(0);
    }, [groups]);

    if (!groups || groups.length === 0) return null;

    return (
        <div className="z-50 w-72 overflow-hidden rounded-md border bg-popover shadow-md">
            <div
                ref={containerRef}
                className="max-h-[350px] overflow-y-auto"
            >
                {groups.map((group, groupIndex) => (
                    <Fragment key={groupIndex}>
                        <div className="border-b bg-muted/50 px-2 py-1.5 text-xs font-medium uppercase text-muted-foreground">
                            {group.title}
                        </div>
                        <div className="p-1 space-y-0.5">
                            {group.commands.map((item, commandIndex) => {
                                const isSelected = groupIndex === selectedGroupIndex && commandIndex === selectedCommandIndex;
                                const isSubmenu = 'id' in item && item.commands;

                                return (
                                    <button
                                        key={commandIndex}
                                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none ${isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                                        onClick={() => selectItem(groupIndex, commandIndex)}
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{item.title}</span>
                                            {item.description && (
                                                <span className="text-xs text-muted-foreground">{item.description}</span>
                                            )}
                                        </div>
                                        {isSubmenu && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Fragment>
                ))}
            </div>
            <div className="border-t px-3 py-2">
                <p className="text-xs text-muted-foreground">
                    <kbd className="rounded border px-1.5 py-0.5 font-mono">↑↓</kbd> navigate
                    <span className="mx-1">·</span>
                    <kbd className="rounded border px-1.5 py-0.5 font-mono">Enter</kbd> select
                    <span className="mx-1">·</span>
                    <kbd className="rounded border px-1.5 py-0.5 font-mono">→</kbd> expand
                </p>
            </div>
        </div>
    );
});

CommandList.displayName = 'CommandList';

export function getSlashCommandSuggestion(organization?: OrganizationContext) {
    const groups = getDefaultSlashCommands(organization);

    return {
        items: ({ query }: { query: string }) => filterCommands(groups, query),

        render: () => {
            let component: ReactRenderer<any>;
            let popup: any[] | null = null;

            return {
                onStart: (props: any) => {
                    component = new ReactRenderer(CommandList, {
                        props: { ...props, organization },
                        editor: props.editor,
                    });

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },

                onUpdate: (props: any) => {
                    const currentPopup = popup?.[0];
                    if (!currentPopup || currentPopup?.state?.isDestroyed) return;

                    component?.updateProps({ ...props, organization });
                    currentPopup.setProps({
                        getReferenceClientRect: props.clientRect,
                    });
                },

                onKeyDown: (props: any) => {
                    if (props.event.key === 'Escape') {
                        const currentPopup = popup?.[0];
                        if (!currentPopup?.state?.isDestroyed) {
                            currentPopup?.destroy();
                        }
                        component?.destroy();
                        return true;
                    }
                    return component?.ref?.onKeyDown(props);
                },

                onExit: () => {
                    const currentPopup = popup?.[0];
                    if (currentPopup && !currentPopup.state.isDestroyed) {
                        currentPopup.destroy();
                    }
                    component?.destroy();
                },
            };
        },
    };
}

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    const item = props as BlockItem;

                    // If it's a submenu, insert the query to navigate into it
                    if ('id' in item && item.commands) {
                        editor.chain().focus().deleteRange(range).insertContent(`/${item.id}.`).run();
                        return;
                    }

                    // Execute the command
                    if ('command' in item && item.command) {
                        item.command({ editor, range });
                    }
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
});
