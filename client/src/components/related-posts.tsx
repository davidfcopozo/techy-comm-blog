"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryType, PostType } from "@/typings/types";
import useFetchRequest from "@/hooks/useFetchRequest";
import {
  calculateReadingTime,
  extractFirstParagraphText,
  getFullName,
  showMonthDay,
  truncateText,
} from "@/utils/formats";
import { Clock, BookOpen, Sparkles, Compass } from "lucide-react";
import { UserAvatar } from "./ui/user-avatar";
import { useLocale, useTranslations } from "next-intl";

interface RelatedPostsProps {
  currentPost: PostType;
  limit?: number;
  className?: string;
}

export default function RelatedPosts({
  currentPost,
  limit = 3,
  className = "",
}: RelatedPostsProps) {
  const locale = useLocale();
  const t = useTranslations("blog");

  const { data: postsData, isFetching } = useFetchRequest(
    ["posts"],
    "/api/posts",
    {
      staleTime: 60000,
      refetchOnMount: false,
    }
  );

  const { displayedPosts, isDirectMatch } = useMemo(() => {
    if (!postsData?.data || !Array.isArray(postsData.data) || !currentPost) {
      return { displayedPosts: [], isDirectMatch: false };
    }

    const currentId = currentPost._id?.toString();
    const currentSlug = currentPost.slug;

    // Extract current post categories (could be string IDs or CategoryType objects)
    const currentCategoryIdentifiers = new Set<string>();
    if (Array.isArray(currentPost.categories)) {
      currentPost.categories.forEach((cat: any) => {
        if (typeof cat === "string") {
          currentCategoryIdentifiers.add(cat);
        } else if (cat && typeof cat === "object") {
          if (cat._id) currentCategoryIdentifiers.add(cat._id.toString());
          if (cat.slug) currentCategoryIdentifiers.add(cat.slug);
          if (cat.name) currentCategoryIdentifiers.add(cat.name.toLowerCase());
        }
      });
    }

    // Extract current post tags
    const currentTags = new Set(
      (currentPost.tags || []).map((tag) => tag.toLowerCase())
    );

    // Candidates excluding current post
    const candidates = postsData.data.filter((p: PostType) => {
      const pId = p._id?.toString();
      return pId !== currentId && p.slug !== currentSlug;
    });

    // Score candidates based on shared categories & tags
    const scoredCandidates: { post: PostType; score: number }[] = candidates.map(
      (p: PostType) => {
        let score = 0;

        // Check category matches
        if (Array.isArray(p.categories)) {
          p.categories.forEach((cat: any) => {
            if (typeof cat === "string" && currentCategoryIdentifiers.has(cat)) {
              score += 3;
            } else if (cat && typeof cat === "object") {
              if (cat._id && currentCategoryIdentifiers.has(cat._id.toString())) score += 3;
              if (cat.slug && currentCategoryIdentifiers.has(cat.slug)) score += 3;
              if (cat.name && currentCategoryIdentifiers.has(cat.name.toLowerCase())) score += 3;
            }
          });
        }

        // Check tag matches
        if (Array.isArray(p.tags)) {
          p.tags.forEach((tag: string) => {
            if (currentTags.has(tag.toLowerCase())) {
              score += 2;
            }
          });
        }

        return { post: p, score };
      }
    );

    // Split into strictly related (score > 0) and fallback posts
    const relatedMatches = scoredCandidates
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post);

    const hasRelatedMatches = relatedMatches.length > 0;

    let finalSelection: PostType[] = [];

    if (hasRelatedMatches) {
      finalSelection = relatedMatches.slice(0, limit);

      // If we don't have enough related posts to fill limit, append fallback posts
      if (finalSelection.length < limit) {
        const selectedIds = new Set(finalSelection.map((p) => p._id?.toString()));
        const remainingFallback = candidates.filter(
          (p: PostType) => !selectedIds.has(p._id?.toString())
        );
        finalSelection = [...finalSelection, ...remainingFallback.slice(0, limit - finalSelection.length)];
      }
    } else {
      // No related posts found, fallback to showing other latest posts
      finalSelection = candidates
        .sort((a: PostType, b: PostType) => {
          const dateA = new Date(String(a.createdAt ?? 0)).getTime();
          const dateB = new Date(String(b.createdAt ?? 0)).getTime();
          return dateB - dateA;
        })
        .slice(0, limit);
    }

    return {
      displayedPosts: finalSelection,
      isDirectMatch: hasRelatedMatches,
    };
  }, [postsData, currentPost, limit]);

  if (isFetching && displayedPosts.length === 0) {
    return (
      <section className={`w-full py-8 my-8 border-t border-border/60 ${className}`}>
        <div className="flex items-center gap-2 mb-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-4 h-64 animate-pulse flex flex-col gap-4"
            >
              <div className="w-full h-32 bg-muted rounded-lg" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayedPosts.length === 0) {
    return null;
  }

  return (
    <section className={`w-full py-8 my-8 border-t border-border/60 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            {isDirectMatch ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <Compass className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isDirectMatch
                ? (t as any)("relatedPostsTitle") || "Related Articles"
                : (t as any)("recommendedPostsTitle") || "Explore Other Articles"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isDirectMatch
                ? (t as any)("relatedPostsSubtitle") ||
                  "Handpicked articles matching topics in this post"
                : (t as any)("morePostsSubtitle") ||
                  "Check out other popular articles from our blog"}
            </p>
          </div>
        </div>

        <span className="self-start sm:self-center text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
          {isDirectMatch ? "Topic Matches" : "Recommended"}
        </span>
      </div>

      {/* Related Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedPosts.map((post: PostType) => {
          const { title, content, createdAt, coverImage, postedBy, slug } = post;
          const authorName = postedBy ? getFullName(postedBy) : "Author";
          const username = postedBy?.username || "";
          const description = extractFirstParagraphText(content as string);

          const safeCoverImage =
            coverImage &&
            typeof coverImage === "string" &&
            !coverImage.includes("fallback-featured-image.webp")
              ? coverImage
              : "/default-image.jpg";

          // Extract first category name if available
          let categoryName = "";
          if (Array.isArray(post.categories) && post.categories.length > 0) {
            const firstCat = post.categories[0] as any;
            categoryName = typeof firstCat === "string" ? firstCat : firstCat?.name || "";
          }

          return (
            <article
              key={post._id?.toString() || slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Image Container */}
              <Link href={`/${username}/${slug}`} className="relative h-44 w-full overflow-hidden block">
                <Image
                  src={safeCoverImage}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {categoryName && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-background/90 text-foreground backdrop-blur-md shadow-sm">
                    {categoryName}
                  </span>
                )}

                <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[11px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <Clock className="w-3 h-3" />
                  <span>
                    {calculateReadingTime(content as string, locale as "en" | "es")}
                  </span>
                </div>
              </Link>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <Link href={`/${username}/${slug}`} className="group-hover:text-primary transition-colors">
                  <h3 className="text-base font-bold line-clamp-2 leading-snug mb-2 text-foreground">
                    {title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {truncateText(description as string, 110)}
                </p>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground mt-auto">
                  <Link href={`/${username}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <UserAvatar user={postedBy} size="sm" className="h-6 w-6" />
                    <span className="font-medium truncate max-w-[110px] sm:max-w-[130px]">
                      {authorName}
                    </span>
                  </Link>
                  <time dateTime={createdAt?.toString() || ""}>
                    {showMonthDay(createdAt!.toString(), locale as "en" | "es")}
                  </time>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
