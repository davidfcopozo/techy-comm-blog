"use client";

import React, { useEffect, useState } from "react";
import BlogPost from "@/components/blog-post";
import SinglePostSkeleton from "@/components/single-post-skeleton";
import useFetchPost from "@/hooks/useFetchPost";
import { useInteractions } from "@/hooks/useInteractions";
import { AuthModal } from "@/components/auth-modal";
import { PostType } from "@/typings/types";

interface PostClientViewProps {
  slug: string;
  initialPost?: PostType | null;
}

export default function PostClientView({
  slug,
  initialPost = null,
}: PostClientViewProps) {
  const { data, isFetching, isLoading } = useFetchPost(
    slug,
    initialPost ? { initialData: { data: initialPost } } : {}
  );

  const [hasInitialData, setHasInitialData] = useState<boolean>(!!initialPost);

  const postData = data?.data || initialPost;

  const {
    handleLikeClick,
    handleBookmarkClick,
    liked,
    bookmarked,
    amountOfBookmarks,
    amountOfLikes,
    isAuthModalOpen,
    authModalAction,
    closeAuthModal,
    handleAuthSuccess,
  } = useInteractions(postData);

  useEffect(() => {
    if (data?.data && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [data?.data, hasInitialData]);

  if ((isLoading || (isFetching && !hasInitialData)) && !postData) {
    return <SinglePostSkeleton />;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <BlogPost
        slug={slug}
        handleLikeClick={handleLikeClick}
        handleBookmarkClick={handleBookmarkClick}
        liked={liked}
        bookmarked={bookmarked}
        amountOfBookmarks={amountOfBookmarks}
        amountOfLikes={amountOfLikes}
        post={postData}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        action={authModalAction || "like"}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
