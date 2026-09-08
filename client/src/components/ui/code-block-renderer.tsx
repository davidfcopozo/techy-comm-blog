"use client";

import { useEffect, useRef } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/base16/one-light.css";
// Import specific languages for better bundle size
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import csharp from "highlight.js/lib/languages/csharp";
import c from "highlight.js/lib/languages/c";
import { loadHighlightTheme } from "@/utils/highlightTheme";
import { useTheme } from "next-themes";

interface CodeBlockRendererProps {
  code: string;
  language?: string;
  className?: string;
}

const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({
  code,
  language = "plaintext",
  className = "",
}) => {
  const codeRef = useRef<HTMLElement>(null);

  const { theme } = useTheme();

  useEffect(() => {
    loadHighlightTheme(theme === "dark");
  }, [theme]);

  useEffect(() => {
    // Register languages
    hljs.registerLanguage("javascript", javascript);
    hljs.registerLanguage("typescript", typescript);
    hljs.registerLanguage("html", html);
    hljs.registerLanguage("xml", html);
    hljs.registerLanguage("css", css);
    hljs.registerLanguage("python", python);
    hljs.registerLanguage("java", java);
    hljs.registerLanguage("cpp", cpp);
    hljs.registerLanguage("c", c);
    hljs.registerLanguage("csharp", csharp);
    hljs.registerLanguage("json", json);
    hljs.registerLanguage("bash", bash);
    hljs.registerLanguage("shell", bash);
    hljs.registerLanguage("sql", sql);
    hljs.registerLanguage("php", php);
    hljs.registerLanguage("ruby", ruby);
    hljs.registerLanguage("go", go);
    hljs.registerLanguage("rust", rust);

    // Apply syntax highlighting
    if (codeRef.current) {
      // Clear any previous highlighting
      codeRef.current.removeAttribute("data-highlighted");

      if (language && language !== "plaintext" && hljs.getLanguage(language)) {
        try {
          const highlighted = hljs.highlight(code, { language }).value;
          codeRef.current.innerHTML = highlighted;
        } catch (error) {
          console.warn(
            `Failed to highlight code with language ${language}:`,
            error
          );
          codeRef.current.textContent = code;
        }
      } else {
        // Use auto-detection for unknown languages or plaintext
        try {
          const result = hljs.highlightAuto(code);
          codeRef.current.innerHTML = result.value;
        } catch (error) {
          console.warn("Failed to auto-highlight code:", error);
          codeRef.current.textContent = code;
        }
      }
    }
  }, [code, language]);

  // Map language names to display labels
  const getLanguageLabel = (lang: string): string => {
    const languageMap: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      html: "HTML",
      xml: "XML",
      css: "CSS",
      python: "Python",
      java: "Java",
      cpp: "C++",
      c: "C",
      csharp: "C#",
      json: "JSON",
      bash: "Bash",
      shell: "Shell",
      sql: "SQL",
      php: "PHP",
      ruby: "Ruby",
      go: "Go",
      rust: "Rust",
      plaintext: "Plain Text",
    };
    return languageMap[lang] || lang;
  };

  return (
    <div className={`code-block-wrapper relative ${className} max-w-full min-w-0 overflow-hidden`}>
      {language && language !== "plaintext" && (
        <div className="absolute top-2 sm:top-4 right-4 sm:right-8 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border z-10">
          {getLanguageLabel(language)}
        </div>
      )}
      <pre className="hljs overflow-x-auto p-3 sm:p-4 pt-8 sm:pt-4 rounded-lg max-w-full">
        <code
          ref={codeRef}
          className={`hljs language-${language} whitespace-pre`}
          data-language={language}
        >
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlockRenderer;
