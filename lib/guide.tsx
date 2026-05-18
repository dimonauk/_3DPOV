/**
 * lib/guide.tsx — The Hitchhiker's Guide reader entries.
 *
 * Each entry is one "page" of the studio's in-house guide. Pattern
 * mirrors lib/articles.tsx but the body is intentionally short —
 * five to fifteen short paragraphs that fit on a single Alien-stationery
 * page. Long-form writing lives in /articles; this is the pad.
 *
 * Voice: princess teaching register. Two-clause sentences. The studio
 * narrator addresses the reader, slightly arch.
 */

import type { ReactNode } from "react";

export type GuideEntry = {
  slug: string;
  number: string; // "001", "002" — typographic
  title: string;
  gloss: string; // one-line description for the index
  body: ReactNode;
};

const ENTRIES: GuideEntry[] = [
  {
    slug: "what-this-guide-is",
    number: "001",
    title: "What this guide is",
    gloss:
      "A small, ill-tempered pad of pages for visitors who have wandered into the studio and require orientation.",
    body: (
      <>
        <p>
          This is a guide, not a manual. A manual tells you what the
          buttons do. A guide tells you which buttons are worth pressing
          and which ones will sulk for a week if you press them wrong.
        </p>
        <p>
          The studio makes things that hold light. Sometimes the light
          is photons on paper. Sometimes it is geometry that pretends to
          be photons. The boundary is thin, and the guide moves freely
          across it.
        </p>
        <p>
          Each page is fixed. There is no scroll. You arrive, you read,
          you flip. This is deliberate — the work happens at the speed
          of paper, and the reader should travel at the same pace.
        </p>
        <p>
          The pad is loosely modelled on a famous fictional one. The
          studio is in on the joke. The studio is not above the joke.
          The studio, in fact, owns several copies of the joke and
          re-reads them when the weather is bad.
        </p>
        <p>
          What follows is short. Five further pages, each on one
          subject. Read in order if you like order; read sideways if you
          do not.
        </p>
      </>
    ),
  },
  {
    slug: "poi-as-drawing-tool",
    number: "002",
    title: "On poi as drawing tool",
    gloss:
      "A pair of weighted lights on cords. A pencil that the shutter remembers and the eye, mercifully, forgets.",
    body: (
      <>
        <p>
          Poi began as Maori practice. It travelled, as practices do,
          and arrived in the studio as a drawing instrument. The cord
          is the pencil. The light is the lead. The shutter is the
          paper.
        </p>
        <p>
          To the eye, a spinning poi is a smear. To a camera held open
          for thirty seconds, it is a continuous line in space — a
          three-dimensional drawing fixed onto a two-dimensional plate.
        </p>
        <p>
          The skill is not in the spinning. The skill is in knowing
          which gesture, when smeared across thirty seconds, becomes a
          shape worth keeping. Most do not. A few do.
        </p>
        <p>
          The studio treats poi the way a printmaker treats a burin.
          The tool has rules. The tool has limits. The work is figuring
          out where those limits sit, and then standing very near them.
        </p>
      </>
    ),
  },
  {
    slug: "long-exposure-as-time-collapse",
    number: "003",
    title: "On long exposure as time-collapse",
    gloss:
      "The shutter holds a window open. The window collects every photon that wanders past. The result is a small theft from time.",
    body: (
      <>
        <p>
          A photograph is normally an instant. A long exposure is a
          thirty-second instant. This is grammatically wrong and
          physically correct, and the studio has made peace with both.
        </p>
        <p>
          Every gesture the performer makes during those thirty seconds
          is added to the same plate. The plate cannot tell the
          difference between the first second and the last. It only
          knows what was lit, and where.
        </p>
        <p>
          This produces a strange document. It is not a photograph of
          an event. It is a photograph of the shape an event leaves
          behind — a residue, a trace, the choreography minus the
          dancer.
        </p>
        <p>
          The studio finds this useful. The dancer is rarely the
          interesting part of the dance. The shape is.
        </p>
      </>
    ),
  },
  {
    slug: "on-360-capture",
    number: "004",
    title: "On 360 capture",
    gloss:
      "A camera that sees behind itself. Useful, occasionally honest, and unfailingly committed to telling you what your shoes look like from above.",
    body: (
      <>
        <p>
          A 360 camera records every direction at once. The studio uses
          one. The studio also fights with one. Both are accurate.
        </p>
        <p>
          The advantage is that the studio cannot lie about where it
          was standing. Every wall, every ceiling, every fragment of
          floor is in the file. This is honest in a way that ordinary
          photography rarely permits.
        </p>
        <p>
          The disadvantage is that the studio is, inescapably, also in
          the file. The camera does not flatter the camera operator.
          The studio has learned to crouch behind columns, hide on
          stairwells, and occasionally accept the indignity.
        </p>
        <p>
          A 360 capture is not a photograph. It is a small room, posted
          flat. The reader unfolds it back into a room by looking at it
          on a phone, or a headset, or, eventually, on a wall.
        </p>
      </>
    ),
  },
  {
    slug: "vr-as-cognitive-space",
    number: "005",
    title: "On VR as cognitive space",
    gloss:
      "Not a game. Not a film. A small, private room inside the head, rented for the afternoon, walls painted by software.",
    body: (
      <>
        <p>
          A headset is not a screen on the face. It is a room rented
          from physics — six walls, a ceiling, a floor, all painted by
          a computer that has agreed to keep painting until you take
          the headset off.
        </p>
        <p>
          The studio treats this less as entertainment and more as a
          drawing surface. The room is the page. The hands are the
          pencils. The pencils, helpfully, glow.
        </p>
        <p>
          What gets drawn inside that room is portable. It can be lit,
          rendered, printed flat, or, occasionally, fabricated as
          something the hand can hold. The headset is the first step,
          not the last.
        </p>
        <p>
          The reader who has not tried this should. The reader who has
          tried it once and was unimpressed should try it again with
          someone who knows how to teach it. The medium is shy. It
          rewards return visits.
        </p>
      </>
    ),
  },
  {
    slug: "printing-the-immaterial",
    number: "006",
    title: "On printing the immaterial",
    gloss:
      "Light has no weight. Geometry has no mass. The press, however, has both, and it is the press that gets the last word.",
    body: (
      <>
        <p>
          A light drawing weighs nothing. A 3D model weighs nothing. A
          shader is a few hundred lines of arithmetic. None of these
          things exist, in any sense that a courier would accept.
        </p>
        <p>
          And yet. Pigment is heavy. Resin is heavy. Paper has a grain.
          The press has an opinion. Somewhere between the file and the
          finished object, the immaterial has to consent to having
          weight.
        </p>
        <p>
          The studio spends most of its working hours at that
          consenting boundary. Choosing the paper. Choosing the resin.
          Arguing, gently, with the press.
        </p>
        <p>
          What comes out the other side is no longer a photograph and
          no longer a model. It is an object that remembers being made
          of light. That memory, properly handled, is the whole point
          of the practice.
        </p>
      </>
    ),
  },
];

export const guideEntries: GuideEntry[] = ENTRIES;

export function getGuideEntry(slug: string): GuideEntry | undefined {
  return guideEntries.find((e) => e.slug === slug);
}

export function getGuideNeighbours(slug: string): {
  prev: GuideEntry | undefined;
  next: GuideEntry | undefined;
} {
  const i = guideEntries.findIndex((e) => e.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: i > 0 ? guideEntries[i - 1] : undefined,
    next: i < guideEntries.length - 1 ? guideEntries[i + 1] : undefined,
  };
}
