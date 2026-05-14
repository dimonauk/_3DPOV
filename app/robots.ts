import { baseUrl } from "lib/utils";

/**
 * Pre-launch: disallow all crawlers. Belt-and-braces with the
 * `robots: { index: false, follow: false }` in app/layout.tsx so
 * even if a crawler ignores robots.txt the per-page meta tag still
 * tells them not to index.
 *
 * Lift this — change to `{ userAgent: "*" }` with no disallow — when
 * the studio is ready for public discovery.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
