import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInteractions } from "@/hooks/useInteractions";
import { BlogPostCardProps } from "@/typings/types";
import {
  calculateReadingTime,
  extractFirstParagraphText,
  getFullName,
  getNameInitials,
  showMonthDay,
  truncateText,
} from "@/utils/formats";
import { Bookmark, Clock, Heart, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EngagementButton } from "./engagement-button";
import { Card, CardFooter } from "./ui/card";
import { AuthModal } from "./auth-modal";
import { memo, useEffect, useState } from "react";
import { UserAvatar } from "./ui/user-avatar";
import { useLocale, useTranslations } from "next-intl";

export const BlogPostCard = memo(function BlogPostCard({
  post,
  className,
}: BlogPostCardProps) {
  const locale = useLocale();
  const t = useTranslations("blog");
  const { title, content, createdAt, coverImage, postedBy, slug } = post;
  const { username } = postedBy;
  const {
    handleLikeClick,
    handleBookmarkClick,
    liked,
    bookmarked,
    amountOfBookmarks,
    amountOfLikes,
    commentsCount,
    // Auth modal properties
    isAuthModalOpen,
    authModalAction,
    closeAuthModal,
    handleAuthSuccess,
  } = useInteractions(post);
  let description = extractFirstParagraphText(content as string);

  const safeCoverImage =
    coverImage &&
    typeof coverImage === "string" &&
    !coverImage.includes("fallback-featured-image.webp")
      ? coverImage
      : "/default-image.jpg";

  const [imgSrc, setImgSrc] = useState(safeCoverImage);

  useEffect(() => {
    setImgSrc(safeCoverImage);
  }, [safeCoverImage]);

  return (
    <Card className={`overflow-hidden border-none shadow-lg ${className}`}>
      <div className="flex flex-col md:flex-row">
        <div className="relative h-48 w-full  md:w-2/5">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
            onError={() => setImgSrc("/default-image.jpg")}
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
            <Clock className="h-3 w-3" />
            <span>
              {calculateReadingTime(content as string, locale as "en" | "es")}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <Link href={`/${username}`} className="font-semibold">
              <UserAvatar user={postedBy} size="sm" className="h-8 w-8" />
            </Link>
            <div className="text-sm">
              <Link href={`/${username}`} className="font-semibold">
                <p className="font-medium">{getFullName(postedBy)}</p>
              </Link>
              <p className="text-muted-foreground">
                {showMonthDay(createdAt!.toString(), locale as "en" | "es")}
              </p>
            </div>
          </div>

          <Link href={`/${username}/${slug}`} className="group flex-1">
            <h3 className="mb-2 text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
              {title}
            </h3>
            <p className="mb-4 line-clamp-2 text-muted-foreground">
              {truncateText(description as string, 150)}
            </p>
          </Link>

          <CardFooter className="flex justify-between p-0 pt-4">
            <div className="flex gap-2">
              <EngagementButton
                icon={Heart}
                count={amountOfLikes}
                label={t("likePost")}
                onClick={handleLikeClick}
                iconStyles={`${
                  liked
                    ? "stroke-pink-500"
                    : "stroke-gray-400 hover:stroke-pink-500"
                } !h-4 !w-4`}
                activeColor="text-pink-500"
                isActivated={liked}
                horizontalCount
              />{" "}
              <Link
                href={`/${username}/${post.slug}#comments-section`}
                passHref
              >
                <EngagementButton
                  icon={MessageSquare}
                  count={commentsCount}
                  label={t("commentPost")}
                  iconStyles="hover:stroke-amber-500 !h-4 !w-4"
                  activeColor="text-amber-500"
                  horizontalCount
                />
              </Link>
            </div>
            <EngagementButton
              icon={Bookmark}
              count={amountOfBookmarks}
              label={t("savePost")}
              onClick={handleBookmarkClick}
              iconStyles={`${
                bookmarked
                  ? "stroke-indigo-500"
                  : "stroke-gray-400 hover:stroke-indigo-500"
              } !h-4 !w-4`}
              activeColor="text-indigo-500"
              isActivated={bookmarked}
              horizontalCount
            />
          </CardFooter>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        action={authModalAction || "like"}
        onSuccess={handleAuthSuccess}
      />
    </Card>
  );
});
