"use client";
import React, { FC, useEffect, useState } from "react";
import { Input } from "./ui/input";
import CoverImage from "./cover-image";
import { useBlogEditor } from "@/hooks/useBlogEditor";
import Categories from "./categories";
import Tags from "./tags";
import dynamic from "next/dynamic";
import { BlogEditorProps } from "@/typings/interfaces";
import { NewPostHeader } from "./new-post-header";
import { Skeleton } from "./ui/skeleton";
import { loadHighlightTheme } from "@/utils/highlightTheme";
import { useTheme } from "next-themes";
import { useToast } from "./ui/use-toast";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const TiptapBlogEditor = dynamic(() => import("./tiptap-blog-editor"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] border border-muted-foreground/20 rounded-md">
      <div className="p-4 border-b border-muted-foreground/20">
        <div className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
      <div className="p-6">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  ),
});

const BlogEditor: FC<BlogEditorProps> = ({
  initialPost = null,
  slug = null,
  isPostLoading = false,
}) => {
  const t = useTranslations("editor");
  const router = useRouter();
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const {
    temporaryCoverImage,
    postData,
    currentStatus,
    setCurrentStatus,
    updatePostState,
    handleSubmit,
    handleContentChange,
    handleImageUpload,
    handleCoverImagePick,
    hasUnsavedChanges,
    isSaving,
    saveError,
  } = useBlogEditor({ initialPost, slug });

  const { theme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    loadHighlightTheme(theme === "dark");
  }, [theme]);
  const handleSave = (status: "draft" | "published" | "unpublished") => {
    handleSubmit(status);
  };
  const handlePreview = async () => {
    if (slug) {
      if (hasUnsavedChanges()) {
        try {
          await handleSubmit(currentStatus, { isPreview: true });
        } catch (error) {
          toast({
            variant: "destructive",
            title: t("saveFailed"),
            description: t("failedToSaveChanges"),
          });
        }
      } else {
        router.push(`/preview/${slug}`);
      }
    } else if (hasPreviewableContent()) {
      // If no slug but has content, save as draft first then preview
      try {
        await handleSubmit("draft", { isPreview: true });
        toast({
          title: t("savingDraft"),
          description: t("savingDraftDescription"),
        });
      } catch (error) {
        console.error("Failed to save draft for preview:", error);
        toast({
          variant: "destructive",
          title: t("saveFailed"),
          description: t("failedToSaveChanges"),
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: t("contentRequired"),
        description: t("contentRequiredDescription"),
      });
    }
  };

  const { title, content, coverImage, tags, categories } = postData;

  useEffect(() => {
    if (initialPost) {
      updatePostState("title", initialPost.title || "");
      updatePostState("content", initialPost.content || "");
      updatePostState("coverImage", initialPost.coverImage || null);
      updatePostState("categories", initialPost.categories || []);
      updatePostState("tags", initialPost.tags || []);
      if (initialPost.status) {
        setCurrentStatus(initialPost.status);
      }
    }
  }, [initialPost, updatePostState, setCurrentStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEditorLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []); // Check if there's enough content to show preview - requires both title and content
  const hasPreviewableContent = (): boolean => {
    const hasValidTitle = title && title.trim().length > 0;
    const hasValidContent = content && !isContentEmpty(content);

    return Boolean(hasValidTitle && hasValidContent);
  };

  // Helper function to check if content is effectively empty
  const isContentEmpty = (content: string): boolean => {
    if (!content) return true;
    const cleanContent = content
      .replace(/<p><\/p>/g, "")
      .replace(/<p><br><\/p>/g, "")
      .replace(/<p><br\/><\/p>/g, "")
      .replace(/<br>/g, "")
      .replace(/<br\/>/g, "")
      .replace(/&nbsp;/g, "")
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .trim();
    return cleanContent.length === 0;
  };

  const hasRealChanges = (): boolean => {
    const originalHasUnsavedChanges = hasUnsavedChanges();

    if (!originalHasUnsavedChanges) return false;

    if (!initialPost) {
      const hasRealTitle = title && title.trim().length > 0;
      const hasRealContent = content && !isContentEmpty(content);
      const hasRealCategories = categories.length > 0;
      const hasRealTags = tags.length > 0;

      return hasRealTitle || hasRealContent || hasRealCategories || hasRealTags;
    }

    return originalHasUnsavedChanges;
  };

  // Navigation guard for unsaved changes
  const {
    navigateWithGuard,
    isDialogOpen,
    isSaving: isNavigationSaving,
    handleSave: handleNavigationSave,
    handleDiscard,
    handleDialogClose,
  } = useNavigationGuard({
    hasUnsavedChanges: hasRealChanges(),
    onSave: async () => {
      // Save as draft when user wants to navigate away
      await handleSubmit(currentStatus === "published" ? "published" : "draft");
    },
    message:
      "You have unsaved changes to your blog post. Are you sure you want to leave?",
  });

  return (
    <div className="outer-container">
      {" "}
      <NewPostHeader
        onSave={handleSave}
        currentStatus={currentStatus}
        hasChanges={hasRealChanges()}
        isSaving={isSaving}
        slug={slug || undefined}
        onPreview={handlePreview}
        hasContent={hasPreviewableContent()}
        onBack={() => navigateWithGuard("/dashboard")}
      />
      <main>
        <div className="flex-column md:flex">
          {" "}
          <div
            className={`mb-20 ${!isPostLoading && "p-4"} xs:mb-4 md:w-3/4  `}
          >
            <div>
              {isEditorLoaded && !isPostLoading ? (
                <div className="mb-4">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => updatePostState("title", e.target.value)}
                    placeholder={t("enterBlogTitle")}
                  />
                </div>
              ) : (
                <div className="border p-2 rounded-md mb-4 w-full">
                  <Skeleton className="h-6 w-3/4" />
                </div>
              )}{" "}
              <div className="mb-4">
                <TiptapBlogEditor
                  value={content || (initialPost?.content as string)}
                  onChange={handleContentChange}
                  handleImageUpload={handleImageUpload}
                  onEditorReady={() => setIsEditorLoaded(true)}
                />
              </div>
            </div>
          </div>
          <div className="[&>*:nth-child(even)]:my-8 md:w-1/4 p-4">
            <CoverImage
              imageUrl={coverImage}
              temporaryCoverImage={temporaryCoverImage}
              onUpload={handleCoverImagePick}
            />
            <Categories
              categories={categories}
              setCategories={(value) =>
                updatePostState(
                  "categories",
                  typeof value === "function" ? value(categories) : value
                )
              }
            />
            <Tags
              tags={tags}
              setTags={(value: string[] | ((prevTags: string[]) => string[])) =>
                updatePostState(
                  "tags",
                  typeof value === "function" ? value(tags) : value
                )
              }
            />
          </div>
        </div>{" "}
      </main>
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleNavigationSave}
        onDiscard={handleDiscard}
        title={t("unsavedBlogChanges")}
        description={
          initialPost
            ? t("unsavedChangesDescription")
            : t("newPostDraftDescription")
        }
        saveButtonText={initialPost ? t("saveChanges") : t("saveAseDraft")}
        discardButtonText={t("discardChanges")}
        isSaving={isNavigationSaving}
      />
    </div>
  );
};

export default BlogEditor;
