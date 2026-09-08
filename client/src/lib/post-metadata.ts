import { cache } from "react";
import type { Metadata } from "next";
import { PostType } from "@/typings/types";

/**
 * Strips HTML tags and markdown formatting to produce a clean textual excerpt.
 */
export function stripHtmlAndMarkdown(content: string, maxLength = 160): string {
  if (!content) return "";

  const cleanText = content
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // Remove Markdown images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // Extract text from Markdown links
    .replace(/[#*`_~>]/g, "") // Remove Markdown formatting symbols
    .replace(/\s+/g, " ") // Collapse consecutive whitespaces
    .trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // Truncate at nearest word boundary within maxLength
  const truncated = cleanText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * Returns the sanitized base URL for generating absolute links.
 */
export function getBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_FRONTEND_API_ENDPOINT ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  return envUrl.replace(/\/$/, "");
}

/**
 * Server-side deduplicated post fetcher using React cache().
 */
export const getPostData = cache(async (slug: string): Promise<PostType | null> => {
  if (!slug) return null;

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT || "http://localhost:8000/api/v1";
    const res = await fetch(`${backendUrl}/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return (data?.data as PostType) || null;
  } catch (error) {
    console.error(`Error fetching post [${slug}] for metadata:`, error);
    return null;
  }
});

/**
 * Generates dynamic Next.js Metadata for a blog post.
 */
export function getPostMetadata(
  post: PostType | null,
  locale = "en",
  slug = ""
): Metadata {
  const baseUrl = getBaseUrl();

  if (!post) {
    return {
      title: "Post Not Found | TechyComm",
      description: "The requested blog post could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const title = `${post.title} | TechyComm`;
  const description =
    stripHtmlAndMarkdown(post.content || "", 160) || "One post at a time";

  const authorName =
    [post.postedBy?.firstName, post.postedBy?.lastName]
      .filter(Boolean)
      .join(" ") ||
    (post.postedBy?.username as string) ||
    "TechyComm Author";

  const username = (post.postedBy?.username as string) || "";
  const postSlug = post.slug || slug;
  const canonicalUrl = username
    ? `${baseUrl}/${locale}/${username}/${postSlug}`
    : `${baseUrl}/${locale}/blog/${postSlug}`;

  const safeCoverImage =
    post.coverImage &&
    typeof post.coverImage === "string" &&
    !post.coverImage.includes("fallback-featured-image.webp")
      ? post.coverImage.startsWith("http")
        ? post.coverImage
        : `${baseUrl}${post.coverImage}`
      : `${baseUrl}/default-image.jpg`;

  const tags = post.tags && post.tags.length > 0 ? post.tags : [];
  const categoryNames = post.categories?.map((c) => String(c.name)) || [];
  const keywords = Array.from(new Set([...tags, ...categoryNames]));

  const publishedTime = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : undefined;
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishedTime;

  return {
    title,
    description,
    keywords,
    authors: [
      {
        name: authorName,
        url: username ? `${baseUrl}/${locale}/${username}` : undefined,
      },
    ],
    creator: authorName,
    publisher: "TechyComm",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: username
          ? `${baseUrl}/en/${username}/${postSlug}`
          : `${baseUrl}/en/blog/${postSlug}`,
        es: username
          ? `${baseUrl}/es/${username}/${postSlug}`
          : `${baseUrl}/es/blog/${postSlug}`,
      },
    },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      siteName: "TechyComm",
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [authorName],
      tags: keywords,
      images: [
        {
          url: safeCoverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [safeCoverImage],
      creator: post.postedBy?.socialMediaProfiles?.x
        ? `@${post.postedBy.socialMediaProfiles.x.replace(/^@/, "")}`
        : undefined,
    },
  };
}

/**
 * Builds Schema.org BlogPosting JSON-LD object for rich snippets and search engines.
 */
export function getPostJsonLd(post: PostType, locale = "en", slug = "") {
  const baseUrl = getBaseUrl();
  const username = (post.postedBy?.username as string) || "";
  const postSlug = post.slug || slug;

  const postUrl = username
    ? `${baseUrl}/${locale}/${username}/${postSlug}`
    : `${baseUrl}/${locale}/blog/${postSlug}`;

  const authorUrl = username ? `${baseUrl}/${locale}/${username}` : baseUrl;
  const authorName =
    [post.postedBy?.firstName, post.postedBy?.lastName]
      .filter(Boolean)
      .join(" ") ||
    (post.postedBy?.username as string) ||
    "TechyComm Author";

  const description =
    stripHtmlAndMarkdown(post.content || "", 160) || "One post at a time";

  const safeCoverImage =
    post.coverImage &&
    typeof post.coverImage === "string" &&
    !post.coverImage.includes("fallback-featured-image.webp")
      ? post.coverImage.startsWith("http")
        ? post.coverImage
        : `${baseUrl}${post.coverImage}`
      : `${baseUrl}/default-image.jpg`;

  const publishedTime = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : undefined;
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishedTime;

  const tags = post.tags && post.tags.length > 0 ? post.tags : [];
  const categoryNames = post.categories?.map((c) => String(c.name)) || [];
  const keywords = Array.from(new Set([...tags, ...categoryNames])).join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    image: [safeCoverImage],
    datePublished: publishedTime,
    dateModified: modifiedTime,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
      ...(post.postedBy?.avatar
        ? {
            image: (post.postedBy.avatar as string).startsWith("http")
              ? post.postedBy.avatar
              : `${baseUrl}${post.postedBy.avatar}`,
          }
        : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "TechyComm",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icon0.svg`,
      },
    },
    keywords: keywords || undefined,
  };
}
