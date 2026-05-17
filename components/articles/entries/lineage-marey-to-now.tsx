import Link from "next/link";

import type { Entry } from "lib/writing";

import CodexRef from "components/codex/codex-ref";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function LineageMareyToNow() {
  return (
    <>
      <p>
        The first person to draw a gesture with light was probably the
        first person who held a torch in a cave and noticed the
        afterimage. Cave painting in some sense is the long exposure
        of the gesture that drew it on the wall. We&rsquo;re going to
        skip about thirty thousand years of that and start at the
        moment somebody pointed a camera.
      </p>

      <p>
        <strong>Marey, 1882.</strong>
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          &Eacute;tienne-Jules Marey{arrow}
        </a>{" "}
        was a French physiologist who wanted to measure how birds fly
        and how horses gallop. He needed to see motion at a finer
        granularity than the eye could deliver. In 1882 he invented
        the photographic gun &mdash; a single-camera apparatus that
        exposed twelve frames per second onto a rotating glass plate
        &mdash; and later, more usefully for our purposes, the
        chronophotographic plate: a single long exposure with a
        stuttering shutter, capturing every fortieth of a second of
        motion onto one sheet.
      </p>
      <p>
        The chronophotographic plate is the direct ancestor of every
        photograph the studio has ever taken &mdash; the same{" "}
        <CodexRef slug="long-exposure-photography">
          long-exposure
        </CodexRef>{" "}
        trick, the same use of{" "}
        <CodexRef slug="persistence-of-vision">
          persistence of vision
        </CodexRef>
        . The body is decomposed into ghosted overlapping positions;
        the gesture is integrated across time onto a single surface;
        what comes out of the camera is not a snapshot but a record.
        Marey understood the physics he was inventing; he was a
        working scientist, not an artist. The art comes later.
      </p>

      <p>
        <strong>Gilbreth, 1912.</strong>
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Frank_Bunker_Gilbreth_Sr."
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Frank Bunker Gilbreth Sr{arrow}
        </a>{" "}
        was an American industrial engineer with a strange obsession:
        finding the most efficient way to do every physical task in a
        factory. To measure efficiency he taped small light bulbs to
        workers&rsquo; hands and feet, then long-exposed the workers
        doing their jobs. The resulting photographs &mdash; he called
        them <em>chronocyclegraphs</em> &mdash; are the first
        light-painted photographs of human movement intended as
        records of gesture rather than as records of motion-in-general.
      </p>
      <p>
        The chronocyclegraphs are unsettlingly beautiful. They are
        also industrial-engineering documents. Gilbreth, like Marey,
        is the line in the genealogy where the technique exists but
        the technique-as-art doesn&rsquo;t yet.
      </p>

      <p>
        <strong>Edgerton, 1930s onward.</strong>
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Harold_Eugene_Edgerton"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Harold Edgerton{arrow}
        </a>{" "}
        invented the high-speed flash. His stroboscopic photographs
        &mdash; the milk drop, the bullet through the apple &mdash;
        are technically the opposite of what the studio does (a
        short exposure of a fast event, rather than a long exposure
        of a sustained gesture). But Edgerton invented the engineering
        attitude that makes the studio possible: build the instrument
        for the photograph, don&rsquo;t expect the photograph to come
        out of an off-the-shelf camera. The Teensy rigs on the
        studio bench are Edgerton-shaped, even if the photographs
        they produce are Marey-shaped.
      </p>

      <p>
        <strong>Picasso and Mili, 1949.</strong>
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Gjon_Mili"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Gjon Mili{arrow}
        </a>
        , a student of Edgerton&rsquo;s, photographed Pablo Picasso
        drawing a centaur in mid-air with a penlight in 1949. This is
        the moment light painting becomes art rather than measurement.
        Picasso didn&rsquo;t invent the technique; Mili did the work.
        But the artist-with-a-light-pen pose &mdash; making a thing
        visible only to the camera, for an audience that will see it
        only afterwards &mdash; is the pose the studio still holds.
      </p>

      <p>
        <strong>The contemporary light-painters.</strong>
      </p>
      <p>
        From Mili to the modern flow-arts scene is sixty years of
        slow accumulation. Light-painting photography became a hobby
        rather than a discipline through the 1960s and 1970s. Cheap
        photoflood bulbs, then cheap torches, then cheap LEDs, then
        cheap addressable LEDs. The thread of the practice ran
        through wedding photographers, festival documentarians, and
        eventually the fire-spinning circles, where the technique
        finally met an audience whose movement was photographable to
        begin with.
      </p>
      <p>
        The contemporary light-painting community has a thousand
        practitioners working at all levels. A representative entry
        point is the{" "}
        <a
          href="https://lightpaintinghub.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Light Painting Hub{arrow}
        </a>
        . The studio&rsquo;s closest ancestors in that scene are the
        flow-arts practitioners who started building their own pixel
        rigs in the early 2010s &mdash; the same generation of
        builders who founded{" "}
        <a
          href="https://en.wikipedia.org/wiki/Burning_Man"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Burning Man{arrow}
        </a>
        -adjacent fire troupes and started bringing programmable
        wands and staffs to festivals.
      </p>

      <p>
        <strong>What the studio adds.</strong>
      </p>
      <p>
        Two things. The first is angular sync &mdash; the rigs lock
        their output to where the body is in the rotation rather than
        to a clock &mdash; which makes the photographs sharper than
        most of the contemporary scene&rsquo;s output. The argument
        for that move is in the article{" "}
        <Link
          href="/articles/why-i-build-my-own-rigs"
          className={ext}
        >
          Why I Build My Own Rigs
        </Link>
        .
      </p>
      <p>
        The second is the move from photograph to object. The
        photographs are finished work, editioned and signed. They are
        also source material for{" "}
        <Link href="/search" className={ext}>
          3D-printed sculptures
        </Link>{" "}
        with acrylic{" "}
        <a
          href="https://en.wikipedia.org/wiki/Light_pipe"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          waveguides{arrow}
        </a>{" "}
        grown along the trace lines of the original gesture. Nobody
        in the chronophotographic lineage has done this before, as
        far as the studio can tell. If anyone has, the studio would
        like to write to them.
      </p>

      <p>
        Everything else in this practice is borrowed. The rigs are
        Teensy + TLC5927 + Hall-effect, three components everyone in
        the LED-art community knows. The shutter mechanics are
        Marey&rsquo;s. The instrument-build attitude is Edgerton&rsquo;s.
        The artist&rsquo;s pose is Mili&rsquo;s. The body geometry is
        Māori &mdash; poi is a Māori dance form, ancient before any
        of this had cameras attached to it.
      </p>
      <p>
        Acknowledging the line back is not modesty. The line back is
        the work. Subtract any of these and the studio doesn&rsquo;t
        exist.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "lineage-marey-to-now",
    title: "The Lineage — Marey to Now",
    date: "2025-02-19",
    kind: "article",
    excerpt:
      "The genealogy of light-painted photographs: Marey's chronophotographic plate, Gilbreth's chronocyclegraphs, Edgerton's instrument-build attitude, Mili photographing Picasso, the contemporary flow-arts scene. The line back is the work.",
    Body: LineageMareyToNow,
    related: [
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The technical companion. What the studio adds to the inherited line.",
      },
      {
        href: "/articles/from-picasso-forward",
        label: "From Picasso, Forward",
        note: "The forward half of the same chronology. Where the ancestral line picks up in 1949 and walks to the present bench.",
      },
      {
        href: "/articles/kindred-practices",
        label: "Kindred Practices",
        note: "The contemporary practitioner survey. Where the line continues today.",
      },
      {
        href: "/practice",
        label: "Practice — the history of the studio's stages",
      },
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey",
        label: "Étienne-Jules Marey — Wikipedia",
        note: "Founder of chronophotography; the technical ancestor of every long-exposure light photograph.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Frank_Bunker_Gilbreth_Sr.",
        label: "Frank Bunker Gilbreth Sr — Wikipedia",
        note: "Industrial engineer whose chronocyclegraphs are the first light-painted records of human gesture.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Harold_Eugene_Edgerton",
        label: "Harold Edgerton — Wikipedia",
        note: "Inventor of high-speed flash; the instrument-build attitude underwrites everything on the studio bench.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gjon_Mili",
        label: "Gjon Mili — Wikipedia",
        note: "The 1949 Picasso light-painting photographs. The moment the technique becomes art.",
      },
      {
        href: "https://lightpaintinghub.com/",
        label: "Light Painting Hub",
        note: "Contemporary community entry point: practitioners, tutorials, gallery.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Chronophotography",
        label: "Chronophotography — Wikipedia",
        note: "Broad overview of the genre this work descends from.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Light_painting",
        label: "Light painting — Wikipedia",
        note: "Contemporary technique and major practitioners.",
      },
    ],
  };
