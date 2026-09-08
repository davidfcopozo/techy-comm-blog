import type { Metadata } from "next";
import PostClientView from "@/components/post-client-view";
import {
  getPostData,
  getPostJsonLd,
  getPostMetadata,
} from "@/lib/post-metadata";

interface BlogSlugPageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

export async function generateMetadata(
  props: BlogSlugPageProps
): Promise<Metadata> {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug.join("/"));
  const post = await getPostData(slug);

  return getPostMetadata(post, params.locale, slug);
}

export default async function BlogSlugPage(props: BlogSlugPageProps) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug.join("/"));
  const post = await getPostData(slug);

  const jsonLd = post ? getPostJsonLd(post, params.locale, slug) : null;

  return (
    <div>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PostClientView slug={slug} initialPost={post} />
    </div>
  );
}
