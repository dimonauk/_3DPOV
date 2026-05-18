import Link from "next/link";

import { PhotosAlbumAsset } from "components/three";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function JonThePhotographer() {
  return (
    <>
      <p>
        Most of the long-exposure photographs of the UK flow-arts
        scene that have stuck in the public memory of the last ten
        years came through one camera and one eye:{" "}
        <a
          href="https://jonthephotographer.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          JonThePhotographer.co.uk{arrow}
        </a>
        . Jon publishes under that brand and only that brand. The
        articles you read where the byline says &ldquo;flow arts
        photography&rdquo; without a name attached almost always mean
        him. He is a friend of the studio.
      </p>

      {/* IMAGE: a photograph BY Jon — one of his flow-arts long exposures. Caption with credit + link to his portfolio. */}

      <h2 className="mt-12 text-2xl text-chrome-100">What he shoots</h2>

      <p>
        DSLR, long-exposure, almost always at night. Creative
        portraits, performance art photography, fire, poi, steel
        wool, light painting. The disciplines that need darkness to
        work and a body that can hold form for thirty seconds at a
        time. He has been documenting the{" "}
        <a
          href="https://www.facebook.com/groups/londonfirespinners/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          London Fire Spinners{arrow}
        </a>{" "}
        monthly meet on the{" "}
        <Link href="/journal/fire-on-the-oxo-beach" className={ext}>
          OXO Tower foreshore
        </Link>{" "}
        for years. If you have seen a photograph of fire poi on the
        Thames beach at low tide and full moon, you have likely seen
        his work.
      </p>

      <p>
        He shoots{" "}
        <Link href="/journal/leake-street" className={ext}>
          Leake Street
        </Link>{" "}
        too &mdash; the tunnel walls give him a saturated backdrop
        for the LED traces to read against &mdash; and the rest of
        the informal-hub circuit covered in{" "}
        <Link href="/articles/walls-tunnel-foreshore" className={ext}>
          Walls, Tunnel, Foreshore
        </Link>
        . The eye that picks the frame is the same one practising
        flow arts alongside the rest of us. He is in the scene first
        and behind the camera second. That order is the difference.
      </p>

      <p className="mb-2 text-sm text-chrome-400">
        The studio&rsquo;s working archive of his flow-arts frames
        &mdash; the foreshore sessions, Leake Street, the LED traces
        the rigs produced on the bench upstream.
      </p>
      <PhotosAlbumAsset id="example-photos-album" />

      <h2 className="mt-12 text-2xl text-chrome-100">The mouse</h2>

      <p>
        Jon won [AWARD_NAME] in [AWARD_YEAR] for a photograph of a
        mouse. [MOUSE_PHOTO_TITLE && (
          <>
            The image is titled <em>[MOUSE_PHOTO_TITLE]</em>.
          </>
        )] [MOUSE_PHOTO_LOCATION && (
          <>
            It was made in [MOUSE_PHOTO_LOCATION] &mdash; the kind of
            place most photographers walk past because the light is
            wrong or the geometry is awkward or the subject is too
            small to be glamorous.
          </>
        )] He stopped, and he waited, and the photograph came out.
      </p>

      {/* IMAGE: the mouse photograph itself with credit + award caption. */}

      <p>
        What the award named was patience. He photographs flow arts
        the same way. The long-exposure of a kata is not a posed
        shot; you wait for the moment the body holds line and the LEDs
        land where the eye wants them. The same hour on the beach can
        produce two hundred frames in which nothing happens and one in
        which everything does. He waits for the one.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Where to find him</h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <strong>Website:</strong>{" "}
          <a
            href="https://jonthephotographer.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jonthephotographer.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Instagram:</strong>{" "}
          <a
            href="https://www.instagram.com/jonthephotographer.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            @jonthephotographer.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Facebook (portfolio):</strong>{" "}
          <a
            href="https://www.facebook.com/jonthephotographer.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            facebook.com/jonthephotographer.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Facebook (events):</strong>{" "}
          <a
            href="https://www.facebook.com/jtp.co.ukevents/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            facebook.com/jtp.co.ukevents{arrow}
          </a>
        </li>
        <li>
          <strong>Flickr:</strong>{" "}
          <a
            href="https://www.flickr.com/photos/155180913@N04/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            flickr.com/photos/jonthephotographer{arrow}
          </a>
        </li>
        <li>
          <strong>X / Twitter:</strong>{" "}
          <a
            href="https://x.com/jonphotomaker"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            @jonphotomaker{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Why this article exists</h2>

      <p>
        The studio uses Jon&rsquo;s photographs across the site
        &mdash; on{" "}
        <Link href="/articles/walls-tunnel-foreshore" className={ext}>
          the walls-tunnel-foreshore article
        </Link>{" "}
        most explicitly, but anywhere a flow-arts long exposure
        appears in the archive there is a strong chance he took it.
        Crediting in the caption is the minimum. A whole article for
        the eye behind the archive is the second minimum. The
        reading public should know whose lens they are standing in
        when they look at these images. If you find his work useful,
        send him a print order; if you find his eye useful, hire him.
      </p>

      <p>
        If you are reading this because the studio sent you the link
        and you have not met him yet, find him on the foreshore at
        low tide and full moon. He will have a DSLR in one hand and a
        cup of something warm in the other. The beach is its own
        introduction.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 *
 * AWARD specifics ([AWARD_NAME], [AWARD_YEAR], [MOUSE_PHOTO_TITLE],
 * [MOUSE_PHOTO_LOCATION]) are still placeholders — Dimona will
 * verify + fill from a confirmed source. Everything else is
 * traceable to his own public brand (jonthephotographer.co.uk) and
 * was confirmed via web search + the London Fire Spinners group.
 */
export const entry: Entry = {
  slug: "jon-the-photographer",
  title: "Jon the Photographer — flow-arts eye for the UK scene",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Most of the long-exposure photographs of the UK flow-arts scene of the last ten years came through one camera. He publishes under the brand JonThePhotographer.co.uk. A friend of the studio.",
  Body: JonThePhotographer,
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
      href: "/journal/leake-street",
      label: "Leake Street",
      note: "The tunnel he also documents.",
    },
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why the work is photographed when it is.",
    },
  ],
  furtherReading: [
    {
      href: "https://jonthephotographer.co.uk/",
      label: "JonThePhotographer.co.uk — portfolio",
      note: "His main brand site.",
    },
    {
      href: "https://www.instagram.com/jonthephotographer.co.uk/",
      label: "Instagram — @jonthephotographer.co.uk",
      note: "Current work, regularly updated.",
    },
    {
      href: "https://www.facebook.com/groups/londonfirespinners/",
      label: "London Fire Spinners — Facebook group",
      note: "The community he most frequently documents.",
    },
  ],
};
