"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { SimpleCodeBlockButton } from "@/components/ui/simple-code-block-button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LinkPopover } from "./link-popover";

interface CommentEditorToolbarProps {
  editor: Editor;
}

export default function CommentEditorToolbar({
  editor,
}: CommentEditorToolbarProps) {
  const t = useTranslations("comments.toolbar");

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleBlockquote = () =>
    editor?.chain().focus().toggleBlockquote().run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  return (
    <div className="border-b border-muted-foreground/20">
      <div className="flex flex-wrap items-center gap-1 p-2">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={toggleBold}
          className="h-8 w-8 p-0"
          title={t("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={toggleItalic}
          className="h-8 w-8 p-0"
          title={t("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          size="sm"
          onClick={toggleUnderline}
          className="h-8 w-8 p-0"
          title={t("underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={toggleStrike}
          className="h-8 w-8 p-0"
          title={t("strikethrough")}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-muted-foreground/20 mx-1" />
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={toggleBlockquote}
          className="h-8 px-2"
          title={t("quote")}
        >
          <Quote className="h-4 w-4" />{" "}
        </Button>{" "}
        <Button
          type="button"
          variant={editor.isActive("code") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleCode().run()}
          className="h-8 px-2"
          title={t("inlineCode")}
        >
          &lt;/&gt;
        </Button>
        <SimpleCodeBlockButton editor={editor} />
        <div className="w-px h-6 bg-muted-foreground/20 mx-1" />
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={toggleBulletList}
          className="h-8 px-2"
          title={t("bulletList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={toggleOrderedList}
          className="h-8 px-2"
          title={t("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-muted-foreground/20 mx-1" />
        <LinkPopover editor={editor} className="h-8 px-2" />
      </div>
    </div>
  );
}
