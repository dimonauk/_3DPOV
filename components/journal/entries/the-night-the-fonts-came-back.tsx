import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheNightTheFontsCameBack() {
  return (
    <>
      <p>
        The studio reads in Cormorant Garamond, in body, the way the
        studio has read in Cormorant Garamond for about a year. Last
        night the site was reading in Times New Roman, and I had not
        noticed for the better part of a day. Times New Roman is the
        browser&rsquo;s serif fallback &mdash; the font that turns up
        when the page has asked for a real serif and the real serif
        has not arrived. On the developer&rsquo;s machine, with the
        dev server running, everything looked correct. In production,
        on the deployed build, the headings and the body were both
        falling back. The bench computer was lying to me by
        agreement.<sup>1</sup>
      </p>
      <p>
        The cause was a single line in <code>next.config.ts</code>. A
        few days ago I had switched on{" "}
        <code>experimental.inlineCss: true</code> on a Next.js 15.6
        canary, the way one does when one reads a release note that
        says &ldquo;ship critical CSS inline, save a round-trip.&rdquo;
        The flag does what it says &mdash; it inlines the page&rsquo;s
        CSS into the HTML so the browser does not have to fetch a
        separate stylesheet to start painting. What it also does, on
        this particular canary, is emit the <code>@font-face</code>{" "}
        URLs that <code>next/font</code> generates without the{" "}
        <code>/_next/static/</code> prefix in front of them. The
        browser dutifully requested{" "}
        <code>/media/&lt;hash&gt;.woff2</code>, the server replied
        with a four-hundred-and-four, and the page rendered in
        whatever serif the browser had on the shelf.<sup>2</sup>
      </p>
      <p>
        The reason this took most of a day to find is the reason this
        class of bug is irritating to a person who works alone. The
        dev server in Next.js does not inline CSS the same way the
        production build does &mdash; it serves a separate stylesheet,
        the font URLs are written normally, the woff2 files load, the
        page renders in Cormorant. On the developer&rsquo;s machine,
        with the dev server, the regression is invisible. The first
        time you see it is the first time you load the deployed page,
        and even then it is quiet &mdash; the headings still appear,
        the body text is still readable, the rig-simulator demo on{" "}
        <Link
          href="/atelier/rig-simulator"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          /atelier/rig-simulator
        </Link>{" "}
        still walks through angle, the photographs still hang on the
        wall. Everything works. It just works in Times New Roman.
      </p>
      <p>
        The fix was the same line I had added a few days earlier, with
        the value flipped. Turn off <code>inlineCss</code>, push,
        wait for the deploy, refresh. Cormorant Garamond came back at
        about half past eleven last night, and the small chrome
        accents on the headings stopped collapsing onto the wrong
        baseline. The diff was one word. The bug report would have
        been a single screenshot of two paragraphs of text rendered
        in two slightly different serifs, and the only honest caption
        for the screenshot is &ldquo;the right one is the one on the
        right.&rdquo;
      </p>
      <p>
        Two things from this. The first is that experimental flags on
        a canary version of a framework are a perfectly reasonable
        thing to try and a less reasonable thing to leave on without
        checking the production HTML. The studio&rsquo;s habit from
        now on is the same habit as for{" "}
        <Link
          href="/atelier/rig-simulator"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          three.js
        </Link>{" "}
        and the SSR-safe-imports pattern: if a flag changes what the
        server emits, view-source the deployed page before walking
        away from it. The second is that the failure was silent
        because the fallback was reasonable. If the missing font had
        rendered as a row of tofu rectangles I would have caught it
        in twenty seconds. Because Times New Roman is a fine serif
        for plain prose, the page kept working and I kept not
        looking.<sup>3</sup>
      </p>
      <p>
        The page now renders in Cormorant Garamond again, which the
        studio prefers. Now I am going to read the canary&rsquo;s
        change log properly before I switch the next flag on.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The site&rsquo;s body face is Cormorant Garamond, served
          locally via <code>next/font</code> from a small set of woff2
          files. The studio used to load it from Google Fonts; it now
          ships from <code>/public</code> through the framework&rsquo;s
          self-hosting helper, which is also what produces the
          hashed <code>/media/&lt;hash&gt;.woff2</code> URLs at build
          time.
        </li>
        <li>
          The exact misbehaviour was that the inlined{" "}
          <code>@font-face</code> blocks lost their leading{" "}
          <code>/_next/static</code> path segment. The hashed
          filenames were correct; the prefix was missing. Other
          assets emitted by the same build &mdash; images under{" "}
          <code>/public</code>, scripts under{" "}
          <code>/_next/static/chunks</code> &mdash; were unaffected.
        </li>
        <li>
          The studio&rsquo;s SSR-safe pattern for three.js, by way of
          contrast, was the result of a noisier failure: the page
          crashed on the server with a stack trace, which is the kind
          of bug a workshop notices the first time. Silent fallbacks
          are the kind a workshop only notices when it next looks at
          its own home page.
        </li>
      </ol>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-night-the-fonts-came-back",
    title: "The night the fonts came back",
    date: "2026-05-14",
    kind: "journal",
    excerpt:
      "A Next.js 15.6 canary regression silently dropped the /_next/static prefix from inlined @font-face URLs. The page kept working in Times New Roman. The fix was one flag.",
    Body: TheNightTheFontsCameBack,
    related: [
      {
        href: "/atelier/rig-simulator",
        label: "Rig Simulator",
        note: "The SSR-safe three.js pattern this entry contrasts with — a noisier, easier-to-catch failure mode.",
      },
      {
        href: "/journal/the-bench-in-https",
        label: "The Bench in HTTPS",
        note: "An adjacent piece of studio plumbing in the same workshop register.",
      },
    ],
    furtherReading: [
      {
        href: "https://nextjs.org/docs/app/api-reference/components/font",
        label: "next/font — official documentation",
        note: "The self-hosting font helper that produces the hashed /_next/static/media URLs at build time.",
      },
      {
        href: "https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss",
        label: "experimental.inlineCss — Next.js config reference",
        note: "The flag whose canary behaviour caused the regression.",
      },
    ],
  };
