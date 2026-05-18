import clsx from "clsx";
import DOMPurify from "isomorphic-dompurify";

/**
 * Renders trusted-but-not-fully-trusted HTML (typically Shopify product
 * descriptions edited in the admin) into a styled prose container.
 *
 * The HTML is sanitised through DOMPurify before it reaches React's
 * `dangerouslySetInnerHTML`, so a compromised Shopify admin (stored XSS
 * via `descriptionHtml`) cannot land script tags, event handlers, or
 * javascript: URLs in the page. Allowed tags cover the formatting set
 * Shopify's rich-text editor actually emits — anything outside that is
 * stripped silently.
 */
const Prose = ({ html, className }: { html: string; className?: string }) => {
  const safe = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // Belt-and-braces: no inline event handlers, no javascript: URLs.
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  });
  return (
    <div
      className={clsx(
        "prose mx-auto max-w-6xl text-base leading-7 text-black prose-headings:mt-8 prose-headings:font-semibold prose-headings:tracking-wide prose-headings:text-black prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg prose-a:text-black prose-a:underline prose-a:hover:text-neutral-300 prose-strong:text-black prose-ol:mt-8 prose-ol:list-decimal prose-ol:pl-6 prose-ul:mt-8 prose-ul:list-disc prose-ul:pl-6 dark:text-white dark:prose-headings:text-white dark:prose-a:text-white dark:prose-strong:text-white",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
};

export default Prose;
