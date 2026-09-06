import {
  isValidEmail,
  isValidUsername,
  validateImageUrl,
  slugValidator,
  sanitizeSlug,
} from "../../../src/utils/validators";

describe("validators", () => {
  describe("isValidEmail", () => {
    it("should return true for valid emails", () => {
      expect(isValidEmail("example@gmail.com")).toBe(true);
      expect(isValidEmail("example@co.uk")).toBe(true);
      expect(isValidEmail("example@co.online")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(isValidEmail("example.gmail")).toBe(false);
      expect(isValidEmail("example@gmail")).toBe(false);
      expect(isValidEmail("example@gmail.")).toBe(false);
      expect(isValidEmail("example@gmail.c")).toBe(false);
      expect(isValidEmail("@gmail.c")).toBe(false);
      expect(isValidEmail("@gmail.com")).toBe(false);
    });
  });

  describe("isValidUsername", () => {
    it("should return true for valid usernames", () => {
      expect(isValidUsername("example")).toBe(true);
      expect(isValidUsername("ex_ample")).toBe(true);
      expect(isValidUsername("ex_ample100")).toBe(true);
      expect(isValidUsername("ex_ample_100")).toBe(true);
      expect(isValidUsername("ex-ample_100")).toBe(true);
    });

    it("should return false for invalid usernames", () => {
      expect(isValidUsername("ex")).toBe(false);
      expect(isValidUsername("ex.anti")).toBe(false);
      expect(isValidUsername("ex--ample")).toBe(false);
      expect(isValidUsername("ex__ample")).toBe(false);
      expect(isValidUsername(".example")).toBe(false);
      expect(isValidUsername("-example")).toBe(false);
      expect(isValidUsername("_example")).toBe(false);
      expect(isValidUsername("example_")).toBe(false);
      expect(isValidUsername("example-")).toBe(false);
      expect(isValidUsername("example.")).toBe(false);
    });
  });

  describe("validateImageUrl", () => {
    it("should return true for valid Supabase storage URLs", () => {
      expect(
        validateImageUrl(
          "https://ufmuvbafxuxymrarxtqh.supabase.co/storage/v1/object/public/images/64d54305628f33c4eec82b49/test-123.png"
        )
      ).toBe(true);
      expect(
        validateImageUrl(
          "https://xyzabcdefg.supabase.co/storage/v1/object/public/images/user123/banner.jpg"
        )
      ).toBe(true);
    });

    it("should return true for valid Firebase storage URLs", () => {
      expect(
        validateImageUrl(
          "https://firebasestorage.googleapis.com/v0/b/personal-blog-e0f8c.appspot.com/o/images%2Ffallback-featured-image.webp?alt=media&token=44970380-079b-4d03-80e8-9b322a365e1c"
        )
      ).toBe(true);
    });

    it("should return false for invalid image URLs", () => {
      expect(validateImageUrl("https://malicious-site.com/image.png")).toBe(
        false
      );
      expect(validateImageUrl("")).toBe(false);
      expect(validateImageUrl("not-a-url")).toBe(false);
    });
  });

  describe("slugValidator", () => {
    it("should return true for valid slugs", () => {
      expect(slugValidator("example")).toBe(true);
      expect(slugValidator("example-post")).toBe(true);
      expect(slugValidator("post-123")).toBe(true);
      expect(slugValidator("123-post")).toBe(true);
      expect(
        slugValidator(
          "how-i-built-a-full-stack-developer-blog-from-scratch-architecture-stack-decisions-and-lessons-learned"
        )
      ).toBe(true);
    });

    it("should return false for invalid slugs", () => {
      expect(slugValidator("")).toBe(false);
      expect(slugValidator("-starts-with-hyphen")).toBe(false);
      expect(slugValidator("ends-with-hyphen-")).toBe(false);
      expect(slugValidator("double--hyphens")).toBe(false);
      expect(slugValidator("has spaces in slug")).toBe(false);
      expect(slugValidator("Uppercase-Slug")).toBe(false);
      expect(slugValidator("has:special!chars?")).toBe(false);
      expect(slugValidator("accented-é-slug")).toBe(false);
    });
  });

  describe("sanitizeSlug", () => {
    it("should correctly sanitize titles with colons, commas, and hyphens", () => {
      const title =
        "How I Built a Full-Stack Developer Blog from Scratch: Architecture, Stack Decisions, and Lessons Learned";
      const slug = sanitizeSlug(title);

      expect(slug).toBe(
        "how-i-built-a-full-stack-developer-blog-from-scratch-architecture-stack-decisions-and-lessons-learned"
      );
      expect(slugValidator(slug)).toBe(true);
    });

    it("should remove diacritics and accented characters", () => {
      const title = "¿Cómo crear una API REST con Node.js y Express en 2026? ¡Guía práctica!";
      const slug = sanitizeSlug(title);

      expect(slug).toBe(
        "como-crear-una-api-rest-con-node-js-y-express-en-2026-guia-practica"
      );
      expect(slugValidator(slug)).toBe(true);
    });

    it("should remove apostrophes naturally without adding extra hyphens", () => {
      const title = "What's New in TypeScript 5.5: Don't Miss It!";
      const slug = sanitizeSlug(title);

      expect(slug).toBe("whats-new-in-typescript-5-5-dont-miss-it");
      expect(slugValidator(slug)).toBe(true);
    });

    it("should handle German umlauts and eszett", () => {
      const title = "Über Café & Fußball";
      const slug = sanitizeSlug(title);

      expect(slug).toBe("uber-cafe-fussball");
      expect(slugValidator(slug)).toBe(true);
    });

    it("should trim leading and trailing hyphens and collapse multiple hyphens", () => {
      const title = "   ---   My Awesome Blog Post   ---   ";
      const slug = sanitizeSlug(title);

      expect(slug).toBe("my-awesome-blog-post");
      expect(slugValidator(slug)).toBe(true);
    });

    it("should handle symbols, slashes, hashtags, and parentheses", () => {
      const title = "CI/CD Pipeline (Docker & K8s) #1 - 100% Automated!";
      const slug = sanitizeSlug(title);

      expect(slug).toBe("ci-cd-pipeline-docker-k8s-1-100-automated");
      expect(slugValidator(slug)).toBe(true);
    });

    it("should return empty string for empty or non-string inputs", () => {
      expect(sanitizeSlug("")).toBe("");
      expect(sanitizeSlug("   ")).toBe("");
      expect(sanitizeSlug("??? !!! ###")).toBe("");
      expect(sanitizeSlug(null as any)).toBe("");
      expect(sanitizeSlug(undefined as any)).toBe("");
    });
  });
});
