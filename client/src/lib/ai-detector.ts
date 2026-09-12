export interface AiBotInfo {
  isAi: boolean;
  botName: string;
  category: "search_engine" | "crawler" | "agent" | "unknown";
}

const AI_USER_AGENTS: { pattern: RegExp; name: string; category: AiBotInfo["category"] }[] = [
  { pattern: /GPTBot/i, name: "OpenAI GPTBot (Crawler)", category: "crawler" },
  { pattern: /ChatGPT-User/i, name: "ChatGPT (User Query)", category: "agent" },
  { pattern: /OAI-SearchBot/i, name: "OpenAI SearchBot", category: "search_engine" },
  { pattern: /ClaudeBot|Claude-Web|anthropic-ai/i, name: "Anthropic ClaudeBot", category: "crawler" },
  { pattern: /PerplexityBot|Perplexity-User/i, name: "Perplexity AI", category: "search_engine" },
  { pattern: /Google-Extended|GoogleOther/i, name: "Google Gemini / Vertex AI", category: "crawler" },
  { pattern: /DeepSeekBot|DeepSeek/i, name: "DeepSeek AI Bot", category: "crawler" },
  { pattern: /Bytespider/i, name: "ByteDance Bytespider AI", category: "crawler" },
  { pattern: /Meta-ExternalAgent/i, name: "Meta Llama Agent", category: "agent" },
  { pattern: /Applebot-Extended/i, name: "Apple Intelligence Bot", category: "crawler" },
  { pattern: /Amazonbot/i, name: "Amazon AI Bot", category: "crawler" },
  { pattern: /Cohere-ai/i, name: "Cohere AI Bot", category: "crawler" },
  { pattern: /CCBot/i, name: "Common Crawl (AI RAG Dataset)", category: "crawler" },
  { pattern: /Diffbot/i, name: "Diffbot AI Extractor", category: "crawler" },
  { pattern: /Cursor|Antigravity|LangChain|LlamaIndex/i, name: "Developer AI Agent / Framework", category: "agent" },
];

export function detectAiBot(userAgent: string | null | undefined): AiBotInfo {
  if (!userAgent) {
    return { isAi: false, botName: "Unknown Client", category: "unknown" };
  }

  for (const bot of AI_USER_AGENTS) {
    if (bot.pattern.test(userAgent)) {
      return {
        isAi: true,
        botName: bot.name,
        category: bot.category,
      };
    }
  }

  return { isAi: false, botName: "Human / General Browser", category: "unknown" };
}
