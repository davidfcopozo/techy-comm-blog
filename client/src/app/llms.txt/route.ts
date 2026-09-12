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
  console.log(`[AI Tracker] /llms.txt request | Bot: ${botInfo.botName} | AI: ${botInfo.isAi} | IP: ${ip} | UA: ${userAgent}`);

  const publicFilePath = path.join(process.cwd(), "public", "llms.txt");
  let baseContent = "";

  try {
    if (fs.existsSync(publicFilePath)) {
      baseContent = fs.readFileSync(publicFilePath, "utf8");
    }
  } catch (error) {
    console.error("Error reading public/llms.txt file:", error);
  }

  if (!baseContent) {
    baseContent = `# TechyComm Blog\n\n> TechyComm Blog is a full-stack web development publication by David Francisco.\n`;
  }

  // Append UTM parameters for AI citation tracking
  let processedContent = baseContent.replace(
    /https:\/\/techycomm\.dev\/blog\/([a-zA-Z0-9_-]+)/g,
    "https://techycomm.dev/blog/$1?utm_source=ai_llm&utm_medium=citation&utm_campaign=llms_txt"
  );

  // Attempt to dynamically fetch published posts from API
  let dynamicPostsMarkdown = "";
  const backendApi = process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT || "http://localhost:8000/api/v1";

  try {
    const res = await fetch(`${backendApi}/posts?status=published&limit=20`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data) ? data : data?.data || data?.posts || [];

      if (posts.length > 0) {
        dynamicPostsMarkdown = "\n\n## Published Articles & Guides\n\n";
        posts.forEach((post: { title?: string; slug?: string; excerpt?: string }) => {
          if (post.slug && post.title) {
            const desc = post.excerpt ? `: ${post.excerpt}` : "";
            dynamicPostsMarkdown += `- [${post.title}](https://techycomm.dev/blog/${post.slug}?utm_source=ai_llm&utm_medium=citation&utm_campaign=llms_txt)${desc}\n`;
          }
        });
      }
    }
  } catch {
    // Graceful fallback if backend is unreachable during build or SSR
  }

  const fullResponseBody = processedContent + dynamicPostsMarkdown;

  return new NextResponse(fullResponseBody, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "X-AI-Detected-Bot": botInfo.botName,
    },
  });
}

