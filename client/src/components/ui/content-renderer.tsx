"use client";

import React from "react";
import DOMPurify from "dompurify";
import CodeBlockRenderer from "./code-block-renderer";
import { sanitizeContent } from "@/utils/sanitize-content";

interface ContentRendererProps {
  content: string;
  className?: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  className = "",
}) => {
  const renderContent = () => {
    if (typeof window === "undefined") {
      // Server-side rendering fallback - use our sanitization function
      return (
        <div
          className={`blog-content ${className} max-w-full min-w-0 break-words [overflow-wrap:anywhere]`}
          dangerouslySetInnerHTML={{
            __html: sanitizeContent(content),
          }}
        />
      );
    } // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizeContent(content);

    // Find all pre > code elements (code blocks)
    const codeBlocks = tempDiv.querySelectorAll("pre code");
    const codeBlockData: Array<{
      element: Element;
      code: string;
      language: string;
      placeholder: string;
    }> = [];

    // Extract code block data and replace with placeholders
    codeBlocks.forEach((codeElement, index) => {
      const preElement = codeElement.parentElement;
      if (preElement && preElement.tagName === "PRE") {
        const code = codeElement.textContent || "";
        const language =
          codeElement.getAttribute("data-language") ||
          codeElement.className.match(/language-(\w+)/)?.[1] ||
          preElement.getAttribute("data-language") ||
          "plaintext";

        const placeholder = `__CODE_BLOCK_${index}__`;

        codeBlockData.push({
          element: preElement,
          code,
          language,
          placeholder,
        });

        // Replace the pre element with a placeholder
        const placeholderElement = document.createElement("div");
        placeholderElement.textContent = placeholder;
        preElement.replaceWith(placeholderElement);
      }
    });

    // Get the sanitized HTML without code blocks
    let cleanHTML = tempDiv.innerHTML;

    // Split the HTML by placeholders and reconstruct with React components
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    codeBlockData.forEach(({ placeholder, code, language }, index) => {
      const placeholderIndex = cleanHTML.indexOf(placeholder, lastIndex);

      if (placeholderIndex !== -1) {
        // Add HTML content before the placeholder
        if (placeholderIndex > lastIndex) {
          const htmlPart = cleanHTML.substring(lastIndex, placeholderIndex);
          if (htmlPart.trim()) {
            parts.push(
              <div
                key={`html-${index}`}
                dangerouslySetInnerHTML={{ __html: htmlPart }}
              />
            );
          }
        }

        // Add the code block component
        parts.push(
          <CodeBlockRenderer
            key={`code-${index}`}
            code={code}
            language={language}
            className="my-4"
          />
        );

        lastIndex = placeholderIndex + placeholder.length;
      }
    });

    // Add any remaining HTML content
    if (lastIndex < cleanHTML.length) {
      const htmlPart = cleanHTML.substring(lastIndex);
      if (htmlPart.trim()) {
        parts.push(
          <div
            key="html-final"
            dangerouslySetInnerHTML={{ __html: htmlPart }}
          />
        );
      }
    } // If no code blocks were found, render the content normally
    if (parts.length === 0) {
      return (
        <div
          className={`blog-content ${className} max-w-full min-w-0 break-words [overflow-wrap:anywhere]`}
          dangerouslySetInnerHTML={{
            __html: sanitizeContent(content),
          }}
        />
      );
    }

    return (
      <div
        className={`blog-content ${className} max-w-full min-w-0 break-words [overflow-wrap:anywhere]`}
      >
        {parts}
      </div>
    );
  };

  return renderContent();
};

export default ContentRenderer;
