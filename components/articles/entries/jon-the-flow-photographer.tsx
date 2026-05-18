/**
 * DRAFT — UNREGISTERED.
 *
 * This article documents a real person who is a friend of the studio.
 * Every `[BRACKETED_PLACEHOLDER]` below must be replaced with the
 * confirmed value before this file is added to lib/articles.tsx and
 * the entry goes live.
 *
 * Things to fill in:
 *   [JON_FULL_NAME]            — full name as he wants it published
 *   [JON_PREFERRED_SHORT_NAME] — what the studio actually calls him
 *   [JON_PRONOUNS]             — e.g. "he/him"; or remove the sentence
 *   [WEBSITE_URL]              — his portfolio / studio site
 *   [INSTAGRAM_HANDLE]         — @handle (no URL needed; we build it)
 *   [OTHER_SOCIAL_HANDLE]      — if applicable; otherwise delete the line
 *   [BASED_IN]                 — city or area he works out of
 *   [AWARD_NAME]               — the specific London photography award
 *   [AWARD_YEAR]               — e.g. 2024
 *   [MOUSE_PHOTO_TITLE]        — if the winning image has a title; else delete
 *   [MOUSE_PHOTO_LOCATION]     — where the mouse was photographed (London location)
 *   [YEARS_FLOW]               — how long he's been a flow artist
 *   [YEARS_PHOTO]              — how long he's been shooting
 *   [FLOW_DISCIPLINE]          — primary discipline (poi / staff / fans / dragon staff / etc.)
 *
 * Things to remove if not applicable:
 *   - the pronouns sentence
 *   - any social handle line that doesn't apply
 *
 * Once filled in:
 *   1. Rename this file to <jon-slug>.tsx
 *   2. Update `slug:` + `Body:` + the default export to match
 *   3. Import + add to lib/articles.tsx ENTRIES array
 *   4. Push
 */

import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function JonTheFlowPhotographer() {
  return (
    <>
      <p>
        [JON_FULL_NAME] (mostly [JON_PREFERRED_SHORT_NAME] on the
        beach, [JON_PRONOUNS]) is a flow artist and a photographer.
        Both for [YEARS_FLOW] years; the two practices arrived
        together, which is rarer than it sounds. The flow artists who
        photograph the scene are almost always a flow artist first
        and a photographer later, or the other way round. Doing both
        from the start gives him an eye for the frame the rest of us
        wait for and a body that knows what we&rsquo;re doing while
        the shutter is open. He&rsquo;s a friend.
      </p>

      {/* IMAGE: a photograph BY Jon — one of his flow-arts long exposures. Caption with credit: "Photo by [JON_FULL_NAME] / [WEBSITE_URL]". */}

      <p>
        Based in [BASED_IN], working [FLOW_DISCIPLINE] as his primary
        discipline. You will see him on the{" "}
        <Link href="/articles/walls-tunnel-foreshore" className={ext}>
          OXO Bridge foreshore
        </Link>{" "}
        on a clear low tide. The frame he takes of the rest of us is
        better than the frame any of us could have taken of him; we
        return the favour by giving him something worth shooting. The
        exchange is unwritten and absolute, like the beach itself.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The mouse</h2>

      <p>
        [JON_PREFERRED_SHORT_NAME] won [AWARD_NAME] in [AWARD_YEAR] for
        an image of a mouse. [MOUSE_PHOTO_TITLE && (
          <>
            The picture has a title: <em>[MOUSE_PHOTO_TITLE]</em>.
          </>
        )] The location was [MOUSE_PHOTO_LOCATION] &mdash; the kind
        of place most photographers walk past because the light is
        wrong or the geometry is awkward or the wildlife is too
        small to be glamorous. He stopped, and he waited, and the
        photograph came out.
      </p>

      {/* IMAGE: the mouse photograph itself, with credit + the award badge alongside. Caption: "[MOUSE_PHOTO_TITLE] · [AWARD_NAME], [AWARD_YEAR] · photo by [JON_FULL_NAME]". */}

      <p>
        What the award named was patience. He photographs flow arts the
        same way. The long-exposure of a kata is not a posed shot; you
        wait for the moment the body holds line and the LEDs land
        where the eye wants them. The same hour on the beach can
        produce two hundred frames in which nothing happens and one in
        which everything does. He waits for the one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Where to find his work</h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <strong>Portfolio:</strong>{" "}
          <a
            href="[WEBSITE_URL]"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            [WEBSITE_URL]{arrow}
          </a>
        </li>
        <li>
          <strong>Instagram:</strong>{" "}
          <a
            href={"https://instagram.com/[INSTAGRAM_HANDLE]"}
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            @[INSTAGRAM_HANDLE]{arrow}
          </a>
        </li>
        <li>
          {/* Delete this line if no other social. */}
          <strong>[OTHER_SOCIAL_NAME]:</strong>{" "}
          <a
            href="[OTHER_SOCIAL_URL]"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            [OTHER_SOCIAL_HANDLE]{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Why this article exists</h2>

      <p>
        The studio uses [JON_PREFERRED_SHORT_NAME]&rsquo;s photographs
        across the site &mdash; on{" "}
        <Link href="/articles/walls-tunnel-foreshore" className={ext}>
          the walls-tunnel-foreshore article
        </Link>{" "}
        most explicitly, but anywhere a flow-arts long exposure
        appears in the archive, there&rsquo;s a strong chance he took
        it. Crediting in the caption is the minimum. Crediting in a
        whole article is the second minimum. The reading public should
        know whose eye they&rsquo;re standing in when they look at
        these images.
      </p>

      <p>
        If you are reading this because the studio sent you the link
        and you have not met him yet, find him on the beach. He&rsquo;ll
        have a camera in one hand and probably a [FLOW_DISCIPLINE] over
        his shoulder. Bring something to spin. Don&rsquo;t bring
        anything to ask him to photograph. The frame comes when it
        comes.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * DO NOT register in lib/articles.tsx until the bracketed placeholders
 * above are replaced with verified values.
 */
export const entry: Entry = {
  slug: "[JON_SLUG]",
  title: "[JON_PREFERRED_SHORT_NAME] — flow artist + photographer",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "[JON_FULL_NAME] photographs the UK flow-arts scene and is a flow artist himself. He won [AWARD_NAME] for an image of a mouse. The studio's archive is full of his work.",
  Body: JonTheFlowPhotographer,
  related: [
    {
      href: "/articles/walls-tunnel-foreshore",
      label: "Walls, Tunnel, Foreshore",
      note: "The three London hubs his lens has shaped.",
    },
    {
      href: "/journal/fire-on-the-oxo-beach",
      label: "Fire on the OXO Beach",
      note: "A session you may see him at.",
    },
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why the photographs are taken when they are.",
    },
  ],
  furtherReading: [
    {
      href: "[WEBSITE_URL]",
      label: "[JON_FULL_NAME] — portfolio",
      note: "His own site.",
    },
  ],
};
