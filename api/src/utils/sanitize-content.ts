import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const dompurifyConfig = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "i",
    "em",
    "strong",
    "u",
    "ul",
    "ol",
    "li",
    "p",
    "br",
    "span",
    "blockquote",
    "code",
    "pre",
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "s", // Allow strikethrough
    "del", // Allow deleted text
    "div", // Allow div for YouTube videos
    "iframe", // Allow iframe for YouTube videos
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
  ],
  ALLOWED_ATTR: [
    "href",
    "target",
    "alt",
    "title",
    "src",
    "class",
    "data-language",
    "data-youtube-video", // Allow YouTube video data attribute
    "data-keep-ratio", // Allow image ratio data attribute
    "data-src", // TipTap YouTube extension uses this
    "data-start", // YouTube start time
    "data-end", // YouTube end time
    "data-aspect-ratio", // YouTube aspect ratio
    "spellcheck",
    "width",
    "height",
    "frameborder",
    "allowfullscreen",
    "allow",
    "style", // Allow style for width/height of videos
    "loading", // For iframe loading attribute
    "referrerpolicy", // For iframe security
    "contenteditable", // Allow contenteditable for Tiptap
    "draggable", // Allow draggable for Tiptap
    "autoplay", // YouTube iframe attributes
    "disablekbcontrols", // YouTube iframe attributes
    "enableiframeapi", // YouTube iframe attributes
    "endtime", // YouTube iframe attributes
    "ivloadpolicy", // YouTube iframe attributes
    "loop", // YouTube iframe attributes
    "modestbranding", // YouTube iframe attributes
    "origin", // YouTube iframe attributes
    "playlist", // YouTube iframe attributes
    "rel", // YouTube iframe attributes
    "start", // YouTube iframe attributes
  ],
  ALLOW_DATA_ATTR: true, // Allow data-* attributes for video embeds
  FORBID_TAGS: ["script", "object", "embed", "style"], // Remove script and other dangerous tags
  FORBID_ATTR: ["on*"], // Remove all event handlers (onclick, onload, etc.)
  ADD_ATTR: ["rel"], // Add rel attribute for links
  RETURN_DOM: false, // Return HTML string
  RETURN_DOM_FRAGMENT: false, // Return string, not fragment
  KEEP_CONTENT: true, // Preserve inner content
  // Custom URL filter for enhanced security
  HOOKS: {
    afterSanitizeAttributes: function (node: any) {
      // Security: Only allow YouTube iframe sources
      if (node.tagName && node.tagName === "IFRAME") {
        const src = node.getAttribute("src");
        if (src) {
          // Only allow YouTube and YouTube-nocookie domains
          const youtubeRegex =
            /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)[a-zA-Z0-9_-]+(\?[a-zA-Z0-9_&=%-]*)?$/;
          if (!youtubeRegex.test(src)) {
            // Remove the iframe if it's not a valid YouTube URL
            node.remove();
            return;
          }

          // Ensure YouTube URLs are secure (HTTPS only)
          if (!src.startsWith("https://")) {
            node.remove();
            return;
          }

          // Set security attributes for YouTube iframes
          node.setAttribute("frameborder", "0");
          node.setAttribute("allowfullscreen", "true");
          node.setAttribute(
            "referrerpolicy",
            "strict-origin-when-cross-origin"
          );

          // Remove any potentially dangerous attributes
          const dangerousAttrs = ["onload", "onerror", "onmessage", "srcdoc"];
          dangerousAttrs.forEach((attr: string) => {
            if (node.hasAttribute(attr)) {
              node.removeAttribute(attr);
            }
          });
        } else {
          // Remove iframe without src
          node.remove();
        }
      }

      // Security: Validate all src attributes (for images and other elements)
      if (node.hasAttribute && node.hasAttribute("src")) {
        const src = node.getAttribute("src");
        if (src && node.tagName !== "IFRAME") {
          // For non-iframe elements, only allow HTTPS URLs or data URLs for images
          if (node.tagName === "IMG") {
            const validImageSrc = /^(https:\/\/|data:image\/)/i.test(src);
            if (!validImageSrc) {
              node.removeAttribute("src");
            }
          }
        }
      }

      // Security: Remove any remaining dangerous attributes
      const allDangerousAttrs = [
        "onclick",
        "onmouseover",
        "onmouseout",
        "onload",
        "onerror",
        "onfocus",
        "onblur",
        "onsubmit",
        "onreset",
        "onchange",
        "onselect",
        "onkeydown",
        "onkeyup",
        "onkeypress",
        "onmessage",
        "srcdoc",
      ];

      allDangerousAttrs.forEach((attr: string) => {
        if (node.hasAttribute && node.hasAttribute(attr)) {
          node.removeAttribute(attr);
        }
      });
    },
  },
};

// Strict YouTube URL validation
const isValidYouTubeUrl = (url: string): boolean => {
  // Decode HTML entities that might be present after DOMPurify processing
  const decodedUrl = url
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  // More permissive regex that allows legitimate YouTube parameters
  const youtubeRegex =
    /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)[a-zA-Z0-9_-]+(\?[a-zA-Z0-9_&=%-.:\/]*)?$/;

  if (!youtubeRegex.test(decodedUrl)) {
    return false;
  }

  // Check for suspicious patterns in parameters
  const suspiciousPatterns = [
    /[?&]origin=[^&]*\.(?!youtube\.com|youtube-nocookie\.com)[a-z]{2,}/i, // origin with non-YouTube domain
    /[?&]callback=[^&]*[()]/i, // callback with function calls
    /[?&][^=]+=[^&]*javascript:/i, // any parameter with javascript:
    /[?&][^=]+=[^&]*data:/i, // any parameter with data:
    /[?&][^=]+=[^&]*<script/i, // any parameter with script tags
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(decodedUrl));
};

// Post-sanitization security check to remove non-YouTube iframes
const removeNonYouTubeIframes = (html: string): string => {
  // Parse the HTML to check for iframes
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const iframes = doc.querySelectorAll("iframe");

  iframes.forEach((iframe) => {
    const src = iframe.getAttribute("src");
    if (!src || !isValidYouTubeUrl(src)) {
      // Remove the entire iframe element
      iframe.remove();
    } else {
      // Ensure YouTube iframes have proper security attributes
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

      // Remove any dangerous attributes
      const dangerousAttrs = [
        "onload",
        "onerror",
        "onmessage",
        "srcdoc",
        "onclick",
        "onmouseover",
      ];
      dangerousAttrs.forEach((attr) => {
        if (iframe.hasAttribute(attr)) {
          iframe.removeAttribute(attr);
        }
      });
    }
  });

  return doc.body.innerHTML;
};

export const sanitizeContent = (dirtyHtml: string) => {
  // First pass: DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(dirtyHtml, dompurifyConfig);

  // Ensure we have a string (DOMPurify can return string, HTMLElement, or DocumentFragment)
  const sanitizedString =
    typeof sanitized === "string" ? sanitized : String(sanitized);

  // Second pass: Remove non-YouTube iframes
  const secureHtml = removeNonYouTubeIframes(sanitizedString);

  return secureHtml;
};
