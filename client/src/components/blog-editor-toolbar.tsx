"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { CodeBlockButton } from "@/components/ui/code-block-button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LinkPopover } from "./link-popover";

interface BlogEditorToolbarProps {
  editor: Editor;
  onAddImage?: () => void;
  onAddVideo?: () => void;
  onSetLink?: () => void;
  onInsertTable?: () => void;
}

export default function BlogEditorToolbar({
  editor,
  onAddImage,
  onAddVideo,
  onSetLink,
  onInsertTable,
}: BlogEditorToolbarProps) {
  const t = useTranslations("editor");
  return (
    <div className="border-b border-muted-foreground/20 p-3">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title={t("undo")}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title={t("redo")}
        >
          <Redo className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-muted-foreground/20 mx-2" />
        {/* Headings */}
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className="h-8 w-8 p-0"
          title={t("heading1")}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className="h-8 w-8 p-0"
          title={t("heading2")}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className="h-8 w-8 p-0"
          title={t("heading3")}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-muted-foreground/20 mx-2" />
        {/* Text formatting */}
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          title={t("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          title={t("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
          title={t("underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
          title={t("strikethrough")}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-muted-foreground/20 mx-2" />
        {/* Alignment */}
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8 p-0"
          title={t("alignLeft")}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8 p-0"
          title={t("alignCenter")}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="h-8 w-8 p-0"
          title={t("alignRight")}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className="h-8 w-8 p-0"
          title={t("justify")}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-muted-foreground/20 mx-2" />
        {/* Lists and blocks */}
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
          title={t("bulletList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
          title={t("numberedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>{" "}
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8 p-0"
          title={t("quote")}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <CodeBlockButton editor={editor} />
        <div className="w-px h-6 bg-muted-foreground/20 mx-2" />
        {/* Media and links */}
        {onSetLink ? (
          <Button
            type="button"
            variant={editor.isActive("link") ? "default" : "ghost"}
            size="sm"
            onClick={onSetLink}
            className="h-8 w-8 p-0"
            title={t("addLink")}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        ) : (
          <LinkPopover editor={editor} />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddImage}
          className="h-8 w-8 p-0"
          title={t("addImage")}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddVideo}
          className="h-8 w-8 p-0"
          title={t("addVideo")}
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onInsertTable}
          className="h-8 w-8 p-0"
          title={t("insertTable")}
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
