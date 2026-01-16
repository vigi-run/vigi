import { BubbleMenu } from "@tiptap/react/menus";
import type { BubbleMenuProps } from "@tiptap/react/menus";
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Link,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Editor } from "@tiptap/core";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

interface EditorBubbleMenuProps extends Omit<BubbleMenuProps, "children"> {
    editor: Editor;
}

export function EditorBubbleMenu({ editor, ...props }: EditorBubbleMenuProps) {
    const [isLinkOpen, setIsLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");

    if (!editor) {
        return null;
    }

    const setLink = () => {
        if (linkUrl) {
            editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
        setIsLinkOpen(false);
        setLinkUrl("");
    };

    const openLinkInput = () => {
        const previousUrl = editor.getAttributes("link").href;
        setLinkUrl(previousUrl || "");
        setIsLinkOpen(true);
    };

    return (
        <BubbleMenu
            editor={editor}

            className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
            {...props}
        >
            {isLinkOpen ? (
                <div className="flex items-center gap-1 p-1">
                    <Input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-8 w-40 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") setLink();
                            if (e.key === "Escape") setIsLinkOpen(false);
                        }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={setLink}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsLinkOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <>
                    <Button
                        size="icon"
                        variant={editor.isActive("bold") ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={editor.isActive("italic") ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={editor.isActive("strike") ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={editor.isActive("code") ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    >
                        <Code className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button
                        size="icon"
                        variant={editor.isActive("link") ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={openLinkInput}
                    >
                        <Link className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button
                        size="icon"
                        variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                </>
            )}
        </BubbleMenu>
    );
}
