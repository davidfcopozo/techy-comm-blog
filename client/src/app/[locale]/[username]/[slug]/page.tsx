import type { Metadata } from "next";
import PostClientView from "@/components/post-client-view";
import {
  getPostData,
  getPostJsonLd,
  getPostMetadata,
} from "@/lib/post-metadata";

interface BlogPostPageProps {
  params: Promise<{
    locale: string;
    username: string;
    slug: string;
  }>;
}

export async function generateMetadata(
  props: BlogPostPageProps
): Promise<Metadata> {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const post = await getPostData(slug);

  return getPostMetadata(post, params.locale, slug);
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const post = await getPostData(slug);

  const jsonLd = post ? getPostJsonLd(post, params.locale, slug) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PostClientView slug={slug} initialPost={post} />
    </>
  );
}
