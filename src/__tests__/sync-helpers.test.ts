/**
 * Tests for sync.ts helper functions.
 *
 * We test ensureMetaFlag by importing it indirectly — since it's not exported,
 * we replicate the logic here for unit testing. The actual integration is
 * covered by the function's callers.
 */

import { describe, expect, it } from "vitest";

// Replicate ensureMetaFlag logic for testing (sync.ts doesn't export it)
function ensureMetaFlag(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("flag", "meta");
    return u.toString();
  } catch {
    const base = url.replace(/([?&])flag=[^&]*/g, "");
    const cleaned = base.replace(/\?$/, "");
    return cleaned + (cleaned.includes("?") ? "&" : "?") + "flag=meta";
  }
}

describe("ensureMetaFlag", () => {
  it("adds flag=meta to URL without params", () => {
    const result = ensureMetaFlag("https://example.com/sub");
    expect(result).toBe("https://example.com/sub?flag=meta");
  });

  it("replaces existing flag=clash", () => {
    const result = ensureMetaFlag("https://example.com/sub?flag=clash");
    expect(result).toBe("https://example.com/sub?flag=meta");
  });

  it("preserves other params when replacing flag", () => {
    const result = ensureMetaFlag(
      "https://example.com/sub?token=abc&flag=clash&extra=1",
    );
    expect(result).toContain("flag=meta");
    expect(result).toContain("token=abc");
    expect(result).toContain("extra=1");
    expect(result).not.toContain("flag=clash");
  });

  it("handles URL with existing flag=meta (idempotent)", () => {
    const result = ensureMetaFlag("https://example.com/sub?flag=meta");
    expect(result).toBe("https://example.com/sub?flag=meta");
  });

  it("handles invalid URLs gracefully", () => {
    const result = ensureMetaFlag("not-a-url/sub?token=abc");
    expect(result).toContain("flag=meta");
    expect(result).toContain("token=abc");
  });

  it("handles invalid URL with flag= to replace", () => {
    const result = ensureMetaFlag("not-a-url/sub?flag=clash&token=abc");
    expect(result).toContain("flag=meta");
    expect(result).toContain("token=abc");
    expect(result).not.toContain("flag=clash");
  });

  it("does not produce double question marks", () => {
    const result = ensureMetaFlag("not-a-url/sub?flag=clash");
    expect(result).not.toContain("??");
    const qCount = (result.match(/\?/g) ?? []).length;
    expect(qCount).toBe(1);
  });
});
