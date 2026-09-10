"use client";

import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link as LinkIcon, Unlink, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface LinkPopoverProps {
  editor: Editor | null;
  className?: string;
  children?: React.ReactNode;
}

export function LinkPopover({ editor, className, children }: LinkPopoverProps) {
  const t = useTranslations("editor");
  const tCommon = useTranslations("common");

  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [error, setError] = useState("");
  const [isEditingExistingLink, setIsEditingExistingLink] = useState(false);

  // Store the editor selection range when popover opens
  const savedRange = useRef<{ from: number; to: number } | null>(null);
  const initialTextRef = useRef<string>("");

  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (!editor) return;

      const isLinkActive = editor.isActive("link");
      setIsEditingExistingLink(isLinkActive);
      setError("");

      if (isLinkActive) {
        // Expand selection to encompass the entire link
        editor.chain().extendMarkRange("link").run();
        const { from, to } = editor.state.selection;
        const currentText = editor.state.doc.textBetween(from, to, " ");
        const attrs = editor.getAttributes("link");

        savedRange.current = { from, to };
        initialTextRef.current = currentText;
        setUrl(attrs.href || "");
        setText(currentText);
        setOpenInNewTab(attrs.target === "_blank");
      } else {
        const { from, to, empty } = editor.state.selection;
        savedRange.current = { from, to };

        if (!empty) {
          const selectedText = editor.state.doc.textBetween(from, to, " ");
          initialTextRef.current = selectedText;
          setText(selectedText);
        } else {
          initialTextRef.current = "";
          setText("");
        }

        setUrl("");
        setOpenInNewTab(false);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setError("");
    }
  };

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (editor.isFocused || isOpen) {
          e.preventDefault();
          handleOpenChange(!isOpen);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, isOpen]);

  const normalizeUrl = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor) return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError(t("urlRequired") || "Please enter a valid URL");
      return;
    }

    const finalUrl = normalizeUrl(trimmedUrl);
    const linkAttrs: {
      href: string;
      target?: string | null;
      rel?: string | null;
    } = {
      href: finalUrl,
      target: openInNewTab ? "_blank" : null,
      rel: openInNewTab ? "noopener noreferrer nofollow" : null,
    };

    const range = savedRange.current;
    const chain = editor.chain().focus();

    if (range) {
      chain.setTextSelection({ from: range.from, to: range.to });
    }

    const originalText = initialTextRef.current;
    const hasOriginalText = originalText.length > 0;
    const enteredText = text.trim();

    if (hasOriginalText) {
      if (enteredText && enteredText !== originalText) {
        chain.insertContent({
          type: "text",
          text: enteredText,
          marks: [{ type: "link", attrs: linkAttrs }],
        });
      } else {
        chain.setLink(linkAttrs);
      }
    } else {
      const displayText = enteredText || finalUrl;
      chain.insertContent({
        type: "text",
        text: displayText,
        marks: [{ type: "link", attrs: linkAttrs }],
      });
    }

    chain.run();
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor) return;

    const range = savedRange.current;
    const chain = editor.chain().focus();

    if (range) {
      chain.setTextSelection({ from: range.from, to: range.to });
    }

    chain.extendMarkRange("link").unsetLink().run();
    setIsOpen(false);
  };

  const isLinkActive = editor?.isActive("link");

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            type="button"
            variant={isLinkActive ? "default" : "ghost"}
            size="sm"
            className={className || "h-8 w-8 p-0"}
            title={isLinkActive ? t("editLink") : t("addLink")}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-4 shadow-lg border border-border"
        align="start"
        sideOffset={6}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <LinkIcon className="h-4 w-4 text-primary" />
              <span>{isEditingExistingLink ? t("editLink") : t("addLink")}</span>
            </div>
            {isEditingExistingLink && url && (
              <a
                href={normalizeUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title={t("openLink")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* URL field */}
          <div className="space-y-1.5">
            <Label htmlFor="link-url" className="text-xs font-semibold">
              {t("linkUrl")}
            </Label>
            <Input
              id="link-url"
              type="text"
              placeholder={t("linkUrlPlaceholder")}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(e);
                }
              }}
              autoFocus
              className={error ? "border-destructive text-sm" : "text-sm"}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Text field */}
          <div className="space-y-1.5">
            <Label htmlFor="link-text" className="text-xs font-semibold">
              {t("linkText")}
            </Label>
            <Input
              id="link-text"
              type="text"
              placeholder={t("linkTextPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(e);
                }
              }}
              className="text-sm"
            />
          </div>

          {/* Open in new tab switch */}
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="link-new-tab" className="text-xs cursor-pointer">
              {t("openInNewTab")}
            </Label>
            <Switch
              id="link-new-tab"
              checked={openInNewTab}
              onCheckedChange={setOpenInNewTab}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t mt-3">
            {isEditingExistingLink ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2 text-xs"
              >
                <Unlink className="h-3.5 w-3.5 mr-1" />
                {t("removeLink")}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-3 text-xs"
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" size="sm" className="h-8 px-3 text-xs">
                {isEditingExistingLink ? tCommon("save") : t("addLink")}
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
