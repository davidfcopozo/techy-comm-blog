import {
  isValidEmail,
  isValidUsername,
  validateImageUrl,
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
});
