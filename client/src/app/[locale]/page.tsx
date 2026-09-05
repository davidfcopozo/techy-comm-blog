"use client";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import useFetchRequest from "@/hooks/useFetchRequest";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PostSkeletonCard } from "@/components/post-skeleton";
import { useToast } from "@/components/ui/use-toast";
import { CategoryType, PostType } from "@/typings/types";
import CategoriesSkeleton from "@/components/categories-skeleton";
import SearchResults from "@/components/search-results";
import { BlogPostCard } from "@/components/blog-post-card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("blog");
  const tToasts = useTranslations("toasts");
  const tFooter = useTranslations("footer");
  const { toast } = useToast();
  const {
    data: posts,
    error,
    isFetching,
  } = useFetchRequest(["posts"], `/api/posts`);
  const {
    data: categories,
    error: categoriesError,
    isFetching: isCategoriesFetching,
  } = useFetchRequest(["categories"], `/api/categories`);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: tToasts("error"),
        description: error.message || tToasts("fetchPostsError"),
      });
    }
    if (categoriesError) {
      toast({
        variant: "destructive",
        title: tToasts("error"),
        description: categoriesError.message || tToasts("fetchCategoriesError"),
      });
    }
  }, [error, categoriesError, toast, tToasts]);

  const filteredPosts = useMemo(() => {
    if (!posts?.data || !Array.isArray(posts.data)) {
      return [];
    }
    return posts?.data
      ?.filter((post: PostType) =>
        post?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 2);
  }, [posts, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!categories?.data || !Array.isArray(categories.data)) {
      return [];
    }
    return categories?.data
      ?.toSorted(
        (a: CategoryType, b: CategoryType) =>
          (b.usageCount as number) - (a.usageCount as number)
      )
      .slice(0, 5);
  }, [categories]);

  const handleLinkClick = useCallback((slug: string) => {
    setSearchQuery("");
    setIsFocused(false);
  }, []);

  const blogCards = useMemo(() => {
    if (Array.isArray(posts?.data))
      return posts?.data
        ?.toSorted(
          (a: PostType, b: PostType) =>
            new Date(String(b.createdAt ?? new Date())).getTime() -
            new Date(String(a.createdAt ?? new Date())).getTime()
        )
        .map((post: PostType, index: { toString: () => any }) => {
          return (
            <BlogPostCard
              key={post?._id.toString() + index.toString()}
              post={post}
              className={index === 0 ? "mt-8" : ""}
            />
          );
        });
  }, [posts]);

  return (
    <div className="container p-2 mx-auto max-w-100">
      <div className="flex flex-col lg:flex-row gap-6 p-2 sm:p-4">
        <main className="py-6 lg:py-12 w-full lg:w-4/5">
          {isFetching ? (
            <div className=" gap-8 md:grid-cols-2 lg:grid-cols-1">
              <PostSkeletonCard className="mt-8" />
              <PostSkeletonCard />
              <PostSkeletonCard />
            </div>
          ) : blogCards && blogCards.length > 0 ? (
            blogCards
          ) : (
            <div className="flex flex-col items-center justify-center py-24 sm:py-32 px-6 text-center rounded-xl border border-dashed bg-muted/20 mt-8 min-h-[420px]">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3">
                {t("noPostsFound")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                {t("noPostsDescription")}
              </p>
              <Button asChild size="lg">
                <Link href="/new">
                  <FileText className="w-4 h-4 mr-2" />
                  {t("newPost")}
                </Link>
              </Button>
            </div>
          )}
        </main>

        <aside className="hidden lg:inline py-6 lg:py-12 lg:w-1/5 px-2 lg:border-l-2 lg:border-secondary">
          <div className="lg:sticky lg:top-16 p-4 bg-background rounded-xl w-full ">
            <div>
              <div className="flex ml-auto flex-col gap-8">
                <form className="flex-1 sm:flex-start">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 ml-2 h-5 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={t("searchPlaceholder")}
                      className="rounded-full pl-10 w-full sm:w-[300px] md:w-[100%]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                    <div className="absolute mt-4 bg-background rounded-md shadow-sm w-full">
                      <SearchResults
                        filteredPosts={filteredPosts}
                        isFocused={isFocused}
                        searchQuery={searchQuery}
                        onLinkClick={handleLinkClick}
                      />
                    </div>
                  </div>
                </form>
                <div className="flex ml-2 flex-col">
                  <p className="text-sm text-foreground font-semibold mb-4">
                    {t("categoriesTitle")}
                  </p>
                  <div className="flex flex-wrap gap-3 text-middle font-semibold text-background">
                    {isCategoriesFetching ? (
                      <CategoriesSkeleton />
                    ) : (
                      filteredCategories?.map((category: CategoryType) => (
                        <Link
                          key={`${category._id}`}
                          href={`/category/${category.slug}`}
                          className="bg-card-foreground py-[0.2em] text-sm rounded-xl justify-center px-3 transition-all duration-300 hover:scale-105"
                          prefetch={false}
                        >
                          <p>{category.name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 xl:gap-4 mt-7 ml-2 text-muted-foreground text-xs">
                <Link href="/#">{tFooter("home")}</Link>
                <Link href="/#">{tFooter("terms")}</Link>
                <Link href="/#">{tFooter("about")}</Link>
                <Link href="/#">{tFooter("privacy")}</Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
