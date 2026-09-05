"use client";
import React, { use, useEffect, useState } from "react";
import BlogPost from "@/components/blog-post";
import SinglePostSkeleton from "@/components/single-post-skeleton";
import { useInteractions } from "@/hooks/useInteractions";
import { AuthModal } from "@/components/auth-modal";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import usePreviewPost from "@/hooks/usePreviewPost";
import Link from "next/link";

const PreviewPage = (props: { params: Promise<{ slug: string }> }) => {
  const params = use(props.params);
  const slug = decodeURI(params.slug);

  const { data, error, isLoading, isFetching } = usePreviewPost(slug);
  const [hasInitialData, setHasInitialData] = useState(false);

  const {
    handleLikeClick,
    handleBookmarkClick,
    liked,
    bookmarked,
    amountOfBookmarks,
    amountOfLikes,
    // Auth modal properties
    isAuthModalOpen,
    authModalAction,
    closeAuthModal,
    handleAuthSuccess,
  } = useInteractions(data?.data);

  useEffect(() => {
    if (data?.data && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [data?.data, hasInitialData]);

  if (isLoading || (isFetching && !hasInitialData)) {
    return <SinglePostSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-background mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message ||
                "Failed to load preview. You may not have permission to view this post."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const post = data?.data;

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-background mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Post not found or you don&apos;t have permission to preview this
              post.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="fixed top-16 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm text-amber-900 px-4 py-2 text-sm font-medium border-b border-amber-600">
        <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2">
              👁️ <strong>Preview Mode</strong> - This is how your {post.status}{" "}
              post will appear to readers
            </span>
            <span className="text-xs bg-amber-600/20 px-2 py-1 rounded-full">
              Status: {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/edit-post/${slug}`}
              className="inline-flex items-center gap-1 text-xs bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 px-2.5 py-1 rounded-md transition-colors font-semibold"
            >
              ← Edit post
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 px-2.5 py-1 rounded-md transition-colors font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
      <div className="pt-12">
        <BlogPost
          slug={slug}
          handleLikeClick={handleLikeClick}
          handleBookmarkClick={handleBookmarkClick}
          liked={liked}
          bookmarked={bookmarked}
          amountOfBookmarks={amountOfBookmarks}
          amountOfLikes={amountOfLikes}
          post={post}
          isPreview={true}
        />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        action={authModalAction || "like"}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default PreviewPage;
