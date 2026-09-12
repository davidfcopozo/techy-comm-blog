import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { detectAiBot } from "@/lib/ai-detector";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const botInfo = detectAiBot(userAgent);

  // Log AI Request for tracking analytics
  console.log(`[AI Tracker] /llms-full.txt request | Bot: ${botInfo.botName} | AI: ${botInfo.isAi} | IP: ${ip} | UA: ${userAgent}`);

  const publicFilePath = path.join(process.cwd(), "public", "llms-full.txt");
  let baseContent = "";

  try {
    if (fs.existsSync(publicFilePath)) {
      baseContent = fs.readFileSync(publicFilePath, "utf8");
    }
  } catch (error) {
    console.error("Error reading public/llms-full.txt file:", error);
  }

  if (!baseContent) {
    baseContent = `# TechyComm Blog - Full Technical Manifest\n\n> Complete technical documentation for AI consumption.\n`;
  }

  // Append UTM parameters for AI citation tracking
  let processedContent = baseContent.replace(
    /https:\/\/techycomm\.dev\/blog\/([a-zA-Z0-9_-]+)/g,
    "https://techycomm.dev/blog/$1?utm_source=ai_llm&utm_medium=citation&utm_campaign=llms_full_txt"
  );

  // Attempt to dynamically fetch published posts full content from backend API
  let dynamicPostsContent = "";
  const backendApi = process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT || "http://localhost:8000/api/v1";

  try {
    const res = await fetch(`${backendApi}/posts?status=published&limit=50`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data) ? data : data?.data || data?.posts || [];

      if (posts.length > 0) {
        dynamicPostsContent = "\n\n---\n\n# Published Articles Full Text\n\n";
        posts.forEach((post: { title?: string; slug?: string; content?: string; createdAt?: string; tags?: string[] }) => {
          if (post.slug && post.title) {
            const tags = Array.isArray(post.tags) ? post.tags.join(", ") : "";
            dynamicPostsContent += `## Article: ${post.title}\n`;
            dynamicPostsContent += `- **Canonical URL**: https://techycomm.dev/blog/${post.slug}?utm_source=ai_llm&utm_medium=citation&utm_campaign=llms_full_txt\n`;
            if (tags) dynamicPostsContent += `- **Tags**: ${tags}\n`;
            if (post.createdAt) dynamicPostsContent += `- **Published**: ${new Date(post.createdAt).toISOString()}\n`;
            dynamicPostsContent += `\n### Content:\n\n${post.content || "No content available."}\n\n---\n\n`;
          }
        });
      }
    }
  } catch {
    // Fallback gracefully if API is offline
  }

  const fullResponseBody = processedContent + dynamicPostsContent;

  return new NextResponse(fullResponseBody, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "X-AI-Detected-Bot": botInfo.botName,
    },
  });
}

