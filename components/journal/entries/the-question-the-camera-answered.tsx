import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheQuestionTheCameraAnswered() {
  return (
    <>
      <p>
        For most of the first decade,{" "}
        <a
          href="https://en.wikipedia.org/wiki/Poi_(performance_art)"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          poi<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        was a dance. The body learned to draw planes in the dark. There
        was no record of those planes &mdash; the gestures happened, the
        gestures dissolved, the next gesture began. Like any movement
        discipline. The work was in the body.
      </p>
      <p>
        The camera changed the practice without me noticing it had
        changed. Someone pointed a lens at a kata one night around 2015
        and held the shutter open. Fifteen seconds. What came out of the
        camera was not a photograph of me. It was a photograph of the
        kata &mdash; the path the body had drawn, held in light against
        the dark. The body was a blur where it was. The trace was sharp
        where the weight had been.
      </p>
      <p>
        That photograph answered a question I did not know I was asking.
        Did the gesture exist? It existed. It had a shape. The shape
        could be looked at.
      </p>
      <p>
        The next ten years were spent making the trace hold better. Fire
        was bright but messy. LED wands were cleaner but smaller. Pixel
        poi let me write images, but the commercial rigs drifted. The{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          persistence-of-vision arrays the studio builds
        </Link>{" "}
        now hold the trace to the pixel: a photograph that is sharp
        where the rig was, blurred where the body was, and faithful to
        the image programmed into the rig before the kata began.
      </p>
      <p>
        The{" "}
        <Link
          href="/search"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          objects
        </Link>{" "}
        came after the{" "}
        <Link
          href="/photographs"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          photographs
        </Link>
        . A trace is a record. An object is a record made physical.
        Cast the photograph back into three dimensions, give it a body
        to live in, run a waveguide along the trace lines, light the
        waveguide. The gesture that was drawn in a field at midnight
        glows again from inside a sculpture on a shelf, twenty miles
        and several months later.
      </p>
      <p>
        <Link
          href="/about"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Twelve years of poi
        </Link>{" "}
        underwrites all of it. The maths of cross-follow, antispin,
        weaves &mdash; none of that comes from the rig. The rig is just
        precise enough to keep up with the body. The body was always
        the source.
      </p>
      <p>
        The camera answered: yes, the gesture exists. The studio
        answers: here is the shape it left.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-question-the-camera-answered",
    title: "The Question the Camera Answered",
    date: "2025-11-14",
    kind: "journal",
    excerpt:
      "Twelve years in. On how a long exposure made the gesture visible to everyone — and what the studio became next.",
    Body: TheQuestionTheCameraAnswered,
    related: [
      {
        href: "/about",
        label: "About — the practice, the method, the studio",
      },
      {
        href: "/journal/the-night-the-camera-was-right",
        label: "The Night the Camera Was Right",
        note: "The hinge night this piece reflects on.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The technical companion to this piece.",
      },
      {
        href: "/photographs",
        label: "Photographs — light, written in the air",
        note: "What the camera has been answering with.",
      },
    ],
    furtherReading: [
      {
        href: "https://www.homeofpoi.com/lessons_all/",
        label: "Home of Poi — full lesson archive",
        note: "Free tutorials for every fundamental poi move, organised by level. Where most of the studio's first decade began.",
      },
      {
        href: "https://drex.poi.me/",
        label: "Drex Files — poi tutorial site",
        note: "Long-running reference site for cross-follow, antispin, weaves, and the maths behind each.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Long-exposure_photography",
        label: "Long-exposure photography — Wikipedia",
        note: "The technical foundation for everything visible in the studio's photographs.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Poi_(performance_art)",
        label: "Poi (performance art) — Wikipedia",
        note: "Cultural and historical background on poi, including its Māori origin.",
      },
    ],
  };
