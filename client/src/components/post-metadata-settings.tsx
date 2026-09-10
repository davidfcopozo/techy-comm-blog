"use client";
import React, { FC, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useTranslations } from "next-intl";

interface PostMetadataSettingsProps {
  slug: string;
  onSlugChange: (slug: string) => void;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
}

export const sanitizeSlugInput = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
};

const PostMetadataSettings: FC<PostMetadataSettingsProps> = ({
  slug,
  onSlugChange,
  excerpt,
  onExcerptChange,
}) => {
  const t = useTranslations("editor");

  const handleSlugInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSlugInput(e.target.value);
    onSlugChange(sanitized);
  };

  const handleExcerptInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onExcerptChange(e.target.value);
  };

  const excerptLength = excerpt.length;
  const isLengthWarning = excerptLength > 160;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("postMetadata")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slug Field */}
        <div className="space-y-2">
          <Label htmlFor="post-slug" className="text-sm font-medium">
            {t("slug")}
          </Label>
          <Input
            id="post-slug"
            value={slug}
            onChange={handleSlugInputChange}
            placeholder={t("slugPlaceholder")}
            className="font-mono text-xs"
          />
          <div className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>{t("slugHelp")}</span>
            {slug && (
              <span className="font-mono text-[11px] truncate text-primary/80">
                {t("urlPreview")} /{slug}
              </span>
            )}
          </div>
        </div>

        {/* Excerpt Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="post-excerpt" className="text-sm font-medium">
              {t("excerpt")}
            </Label>
            <span
              className={`text-xs ${
                isLengthWarning ? "text-amber-500 font-medium" : "text-muted-foreground"
              }`}
            >
              {excerptLength}/160
            </span>
          </div>
          <Textarea
            id="post-excerpt"
            value={excerpt}
            onChange={handleExcerptInputChange}
            placeholder={t("excerptPlaceholder")}
            rows={3}
            className="text-xs resize-y"
          />
          <p className="text-xs text-muted-foreground">{t("excerptHelp")}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostMetadataSettings;
