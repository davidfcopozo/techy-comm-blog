"use client";
import { BlogPostCard } from "@/components/blog-post-card";
import { PostSkeletonCard } from "@/components/post-skeleton";
import useFetchRequest from "@/hooks/useFetchRequest";
import { CategoryType, PostType } from "@/typings/types";
import { convertSlugToName } from "@/utils/formats";
import { useCallback, useEffect, useMemo, useState, use } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import SearchResults from "@/components/search-results";
import CategoriesSkeleton from "@/components/categories-skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Category(props: {
  params: Promise<{ category: string }>;
}) {
  const params = use(props.params);
  const cat = decodeURI(params.category);
  const t = useTranslations("blog");
  const { toast } = useToast();

  const categoryToDisplay = convertSlugToName(cat);
  const {
    data: posts,
    error,
    isFetching,
  } = useFetchRequest(["posts"], `/api/posts/category/${cat}`);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const blogPosts: PostType[] = useMemo(() => {
    if (!posts?.data || !Array.isArray(posts.data)) {
      return [];
    }

    return posts?.data;
  }, [posts]);
  const {
    data: categories,
    error: categoriesError,
    isFetching: isCategoriesFetching,
  } = useFetchRequest(["categories"], `/api/categories`);

  const handleLinkClick = useCallback((slug: string) => {
    setSearchQuery("");
    setIsFocused(false);
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
    }
  }, [error, toast]);

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

  return (
    <div className="container p-2 mx-auto min-h-[calc(100vh-7rem)]">
      <div className="flex flex-col lg:flex-row gap-6 p-2 sm:p-4 lg:divide-x-2 lg:divide-secondary min-h-[calc(110vh)]">
        <main className="py-6 lg:py-12 w-full lg:w-4/5 ">
          <h1 className="text-3xl font-bold mb-8 pt-6">{`Latest ${categoryToDisplay} Blog Posts`}</h1>
          {isFetching ? (
            <div className="gap-8 md:grid-cols-2 lg:grid-cols-1">
              <PostSkeletonCard className="mt-8" />
              <PostSkeletonCard />
              <PostSkeletonCard />
            </div>
          ) : blogPosts && blogPosts.length > 0 ? (
            blogPosts.map((post, index) => (
              <BlogPostCard
                key={post._id.toString()}
                post={post}
                className={index === 0 ? "mt-8" : ""}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed bg-muted/20 mt-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("noPostsFound")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {t("noPostsCategoryDescription")}
              </p>
              <Button asChild variant="outline">
                <Link href="/">
                  {t("browseAllPosts")}
                </Link>
              </Button>
            </div>
          )}
        </main>

        <aside className="hidden lg:inline py-6 lg:py-12 lg:w-2/5 px-2">
          <div className="lg:sticky lg:top-16 p-4 bg-background rounded-xl w-full">
            <div>
              <div className="flex ml-auto flex-col gap-8">
                <form className="flex-1 sm:flex-start">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 ml-2 h-5 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search posts..."
                      className="rounded-full pl-10 w-full sm:w-[300px] md:w-[200px] lg:w-[300px]"
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
                    What do you want to read about?
                  </p>
                  <div className="flex flex-wrap gap-3 text-middle font-semibold text-background">
                    {isCategoriesFetching ? (
                      <CategoriesSkeleton />
                    ) : (
                      filteredCategories?.map((category: CategoryType) => (
                        <Link
                          key={`${category._id}`}
                          href={`/category/${category.slug}`}
                          className="bg-card-foreground py-[0.1em] rounded-xl justify-center px-3 transition-all duration-300 hover:scale-105"
                          prefetch={false}
                        >
                          <p>{category.name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-6 mt-7 ml-2 text-muted-foreground text-xs">
                <Link href="/#">Home</Link>
                <Link href="/#">Terms</Link>
                <Link href="/#">About</Link>
                <Link href="/#">Privacy</Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
