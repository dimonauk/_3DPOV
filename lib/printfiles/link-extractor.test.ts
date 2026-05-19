/**
 * lib/printfiles/link-extractor.test.ts
 *
 * Covers extractLinks' parsing of common email-body shapes:
 *   - plain-text Drive / Dropbox / OneDrive / WeTransfer / direct
 *   - HTML body with <a href=...>
 *   - mixed signature URLs (don't extract irrelevant direct links
 *     to artist sites etc.)
 *   - duplicate dedupe
 *   - trailing punctuation strip
 *   - Drive's `/file/d/<id>/...` → direct-download conversion
 *   - Dropbox dl=0 → dl=1 conversion
 *   - OneDrive ?download=1 append
 */

import { describe, expect, it } from "vitest";

import { extractLinks } from "./link-extractor";

describe("extractLinks", () => {
  describe("plain-text bodies", () => {
    it("extracts a Google Drive link + converts to direct URL", () => {
      const body = "Hi, my STL is here: https://drive.google.com/file/d/1abcDEF_xyz/view";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("google-drive");
      expect(links[0]!.directUrl).toBe(
        "https://drive.google.com/uc?export=download&id=1abcDEF_xyz",
      );
    });

    it("extracts a Dropbox link + forces dl=1", () => {
      const body = "Here: https://www.dropbox.com/s/abc123/model.stl?dl=0";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("dropbox");
      expect(links[0]!.directUrl).toContain("dl=1");
      expect(links[0]!.directUrl).not.toContain("dl=0");
    });

    it("extracts a Dropbox scl/fi link", () => {
      const body = "https://www.dropbox.com/scl/fi/abcdef/model.stl?rlkey=xyz";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("dropbox");
      expect(links[0]!.directUrl).toContain("dl=1");
    });

    it("extracts a OneDrive link + adds download=1", () => {
      const body = "https://1drv.ms/u/c/abc123";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("onedrive");
      expect(links[0]!.directUrl).toContain("download=1");
    });

    it("identifies WeTransfer but doesn't produce a direct URL", () => {
      const body = "https://wetransfer.com/downloads/abc123def456";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("wetransfer");
      expect(links[0]!.directUrl).toBeNull();
    });

    it("extracts a direct link with an accepted extension", () => {
      const body = "https://cdn.example.com/files/model.stl";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("direct");
      expect(links[0]!.hasAcceptedExtension).toBe(true);
    });

    it("skips direct links without an accepted extension", () => {
      const body =
        "Visit my portfolio: https://www.dimona.studio/about\nSee you soon!";
      const links = extractLinks(body);
      expect(links).toHaveLength(0);
    });
  });

  describe("HTML bodies", () => {
    it("unwraps an <a href> link", () => {
      const html =
        '<p>Hi, my STL: <a href="https://drive.google.com/file/d/zzz/view">click here</a></p>';
      const links = extractLinks(html);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("google-drive");
    });

    it("decodes HTML entities in URLs", () => {
      const html =
        'https://drive.google.com/uc?id=abc&amp;export=download';
      const links = extractLinks(html);
      expect(links).toHaveLength(1);
      expect(links[0]!.rawUrl).toContain("&export=download");
    });
  });

  describe("edge cases", () => {
    it("dedupes identical URLs", () => {
      const body =
        "https://drive.google.com/file/d/abc/view\n\nhttps://drive.google.com/file/d/abc/view";
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
    });

    it("strips trailing punctuation", () => {
      const body =
        "Try https://drive.google.com/file/d/abc/view, or message me.";
      const links = extractLinks(body);
      expect(links[0]!.rawUrl).toBe("https://drive.google.com/file/d/abc/view");
    });

    it("preserves URL order from the body", () => {
      const body = `First: https://drive.google.com/file/d/first/view
Second: https://www.dropbox.com/s/second/x.stl?dl=0`;
      const links = extractLinks(body);
      expect(links[0]!.provider).toBe("google-drive");
      expect(links[1]!.provider).toBe("dropbox");
    });

    it("ignores a signature-style portfolio link alongside a real file link", () => {
      const body = `
        Here's my file: https://drive.google.com/file/d/abc/view

        --
        Bob Smith
        https://bobsmithart.com
      `;
      const links = extractLinks(body);
      expect(links).toHaveLength(1);
      expect(links[0]!.provider).toBe("google-drive");
    });

    it("returns empty array on a body with no URLs", () => {
      expect(extractLinks("just some text, nothing to fetch")).toEqual([]);
    });

    it("handles malformed URLs gracefully (ignores them)", () => {
      const body = "https:// drive google com/file/d/abc";
      // The space makes the URL invalid; should not throw.
      const links = extractLinks(body);
      expect(Array.isArray(links)).toBe(true);
    });

    it("returns a filename guess from the URL path", () => {
      const body = "https://cdn.example.com/uploads/sculpture-v2.stl";
      const links = extractLinks(body);
      expect(links[0]!.inferredFilename).toBe("sculpture-v2.stl");
    });

    it("percent-decodes the filename", () => {
      const body = "https://cdn.example.com/my%20model.stl";
      const links = extractLinks(body);
      expect(links[0]!.inferredFilename).toBe("my model.stl");
    });
  });
});
