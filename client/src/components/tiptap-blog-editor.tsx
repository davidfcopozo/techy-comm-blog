"use client";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Heading from "@tiptap/extension-heading";
import Youtube from "@tiptap/extension-youtube";
import { ResizableImage } from "tiptap-extension-resizable-image";
import { languageDetectionPlugin } from "@/components/extensions/language-detection-plugin";

import { Card } from "@/components/ui/card";
import BlogEditorToolbar from "./blog-editor-toolbar";
import { EditorProps } from "@/typings/interfaces";
import { useEffect, useState } from "react";
import "@/styles/tiptap.css";

// Import configurations from utils
import {
  createConfiguredLowlight,
  tiptapEditorConfig,
  extensionConfigs,
  defaultImageSettings,
  defaultTableSettings,
  validateImageFile,
  validateYouTubeUrl,
} from "@/utils/blog-editor";

// Import image management
import { useImageManager } from "@/hooks/useImageManager";
import { ImageUploadModal } from "./image-upload-modal";
import { VideoInsertModal } from "./video-insert-modal";
import { useTranslations } from "next-intl";

// Create lowlight instance
const lowlight = createConfiguredLowlight();

// Language Detection Extension
const LanguageDetection = Extension.create({
  name: "languageDetection",

  addProseMirrorPlugins() {
    return [languageDetectionPlugin];
  },
});

interface TiptapBlogEditorProps extends EditorProps {
  className?: string;
}

export default function TiptapBlogEditor({
  value,
  onChange,
  handleImageUpload,
  onEditorReady,
  className = "",
}: TiptapBlogEditorProps) {
  const t = useTranslations("editor");
  // Image gallery integration
  const {
    uploadImage,
    userImages,
    isLoadingImages,
    deleteImage,
    updateImageMetadata,
  } = useImageManager();
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure(extensionConfigs.starterKit),
      Heading.configure({
        ...extensionConfigs.heading,
        levels: [...extensionConfigs.heading.levels],
      }),
      CodeBlockLowlight.configure({
        lowlight,
        ...extensionConfigs.codeBlockLowlight,
      }),
      LanguageDetection,
      Underline,
      Link.configure(extensionConfigs.link),
      TextStyle,
      Color,
      Highlight.configure(extensionConfigs.highlight),
      ResizableImage.configure(extensionConfigs.resizableImage),
      Table.configure(extensionConfigs.table),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure(extensionConfigs.textAlign),
      FontFamily,
      Youtube.configure(extensionConfigs.youtube),
      Placeholder.configure({
        placeholder: t("placeholderBlogPost"),
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate: () => {
      onEditorReady?.();
    },
    editorProps: tiptapEditorConfig.editorProps,
    immediatelyRender: tiptapEditorConfig.immediatelyRender,
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Enhanced image insertion with gallery support
  const addImage = async () => {
    setIsImageGalleryOpen(true);
  };

  // Handle image selection from gallery
  const handleImageSelect = (url: string) => {
    if (editor) {
      editor
        ?.chain()
        .focus()
        .setResizableImage({
          src: url,
          alt: "",
          title: "",
          width: defaultImageSettings.width,
          height: defaultImageSettings.height,
          "data-keep-ratio": defaultImageSettings.keepRatio,
        })
        .run();
    }
    setIsImageGalleryOpen(false);
  };

  // Handle direct image upload
  const handleDirectImageUpload = async (file: File) => {
    if (
      validateImageFile(file, {
        invalidType: t("invalidImageFileType"),
        sizeExceeded: t("imageSizeExceeded"),
      })
    ) {
      try {
        // Use the passed handleImageUpload function or fallback to uploadImage
        const url = handleImageUpload
          ? await handleImageUpload(file)
          : await uploadImage(file);
        return url;
      } catch (error) {
        console.error("Failed to upload image:", error);
        throw error;
      }
    }
    throw new Error("Invalid image file");
  };

  const addVideo = () => {
    setIsVideoModalOpen(true);
  };
  const handleVideoInsert = (url: string) => {
    if (editor && validateYouTubeUrl(url)) {
      // The YouTube extension expects the URL as a string parameter
      editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    } else {
      console.error("Invalid YouTube URL:", url);
    }
    setIsVideoModalOpen(false);
  };

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({
        rows: defaultTableSettings.rows,
        cols: defaultTableSettings.cols,
        withHeaderRow: defaultTableSettings.withHeaderRow,
      })
      .run();
  };

  if (!editor) {
    return (
      <Card className={`w-full ${className} border-muted-foreground/20`}>
        <div className="p-6">
          <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
            {t("loadingEditor")}
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className={`w-full ${className} overflow-auto `}>
      {/* Toolbar */}
      <BlogEditorToolbar
        editor={editor}
        onAddImage={addImage}
        onAddVideo={addVideo}
        onInsertTable={insertTable}
      />
      {/* Editor Content */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="bg-background text-foreground [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-6"
        />
      </div>{" "}
      {/* Image Gallery Modal */}
      <ImageUploadModal
        isImageUploadModalOpen={isImageGalleryOpen}
        openImageUploadModal={() => setIsImageGalleryOpen(!isImageGalleryOpen)}
        onInsertImage={handleImageSelect}
        handleImageUpload={handleDirectImageUpload}
        images={userImages}
        onDeleteImage={deleteImage}
        onUpdate={updateImageMetadata}
        isLoadingImages={isLoadingImages}
        buttonText={t("insertImage")}
      />
      {/* Video Insert Modal */}
      <VideoInsertModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onInsertVideo={handleVideoInsert}
      />
    </Card>
  );
}
