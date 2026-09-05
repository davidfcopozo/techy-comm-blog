"use client";
import React, { use, useEffect } from "react";
import BlogEditor from "@/components/blog-editor";
import useFetchPost from "@/hooks/useFetchPost";
import { loadHighlightTheme } from "@/utils/highlightTheme";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const EditPostPage = (props: { params: Promise<{ slug: string }> }) => {
  const params = use(props.params);
  const slug = decodeURI(params.slug);
  const { data, isPending, error } = useFetchPost(slug);

  const { theme } = useTheme();

  useEffect(() => {
    loadHighlightTheme(theme === "dark");
  }, [theme]);

  if (isPending) {
    return (
      <div className="pt-24 bg-background min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      </div>
    );
  }

  const post = data?.data;

  if (!post) {
    return (
      <div className="pt-24 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message ||
                "Post not found or you don't have permission to edit this post."}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 bg-background min-h-screen">
      <div className="bg-background">
        <BlogEditor
          key={post._id || slug}
          initialPost={post}
          slug={slug}
          isPostLoading={false}
        />
      </div>
    </div>
  );
};

export default EditPostPage;
