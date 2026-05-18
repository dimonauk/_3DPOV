import Link from "next/link";

import type { Entry } from "lib/writing";

export default function FireOnTheOxoBeach() {
  return (
    <>
      <p>
        The Thames foreshore below the OXO Tower is a beach for about
        three hours either side of low tide. The rest of the time it
        is river. I have been going there with fire poi when the tides
        and the weather and the practice all line up.
      </p>

      {/* IMAGE: the OXO Tower seen from the foreshore at low tide, brick stacks against a wet-pebble beach. landscape, hero-eligible. */}

      <p>
        Fire poi is a different discipline from LED poi. The weight is
        the same; everything else is not. The flame is open. The fuel
        is paraffin you&rsquo;ve soaked the wicks in for a few minutes
        before lighting. The sound of the spin is different &mdash; the
        flame draws a soft whoosh at the bottom of each arc, not the
        chain-tick of an LED rig. The body works harder because the
        kata has to stay tight enough to keep the wicks burning
        through the rotation; loose form starves the flame. There is
        no firmware to debug.
      </p>

      <p>
        The river is the audience. It does not move much in the
        foreshore window &mdash; the current is a half-knot pull at
        most &mdash; but it shifts colour as the city behind you
        decides what light to give it. The flames pick up that colour
        as a halo. A streetlamp going amber above puts an amber halo
        on the side of each spin facing the bank. The opposite side,
        facing the river, stays pure orange. The photograph reads as
        two flames per arc.
      </p>

      {/* IMAGE: fire poi mid-arc on the foreshore, the river behind, the dual-halo effect visible — amber on the city side, orange on the water side. */}

      <p>
        The crowd matters and I had not expected to write that. There
        is a small population of fire dancers who use this beach
        regularly. On a clear Saturday at low tide there might be
        three of us spinning at twenty metres apart, lit by each
        other. The Thames Path railing above is full of people
        watching. Nobody comes down to the beach unless they brought
        wicks. The etiquette is unwritten and absolute.
      </p>

      <p>
        I was burned twice on the second session and not once on the
        fourth. The body learns fire. The thing that took me the
        longest was the trust: trust that the wick fuel-rate is
        steady, trust that the flame stays away from the cord, trust
        that the body knows how far the rig extends. Trust takes
        sessions. Not lectures.
      </p>

      {/* IMAGE: a wider shot — multiple dancers spread along the foreshore, the OXO Tower picked out against a still-dark sky, halos of flame at three distances. */}

      <p>
        The photographs from these sessions are different from the LED
        photographs. The trace is heavier &mdash; flame is volumetric,
        not a point source, so the line is a ribbon instead of a wire.
        Detail is softer. The colour cannot be set in firmware. What
        you get is what the paraffin gave you that night.
      </p>

      <p>
        Companion pieces:{" "}
        <Link
          href="/journal/the-chain-at-canary-wharf"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          the chain at Canary Wharf
        </Link>{" "}
        and{" "}
        <Link
          href="/journal/leake-street"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Leake Street
        </Link>{" "}
        &mdash; both LED, both walled in by glass or paint. The OXO
        beach is the opposite of those. Open sky, open flame, the
        river underneath.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "fire-on-the-oxo-beach",
  title: "Fire on the OXO Beach",
  date: "2026-05-10",
  kind: "journal",
  excerpt:
    "Fire poi on the Thames foreshore below the OXO Tower. The river is the audience; the wicks are open flame; the firmware doesn't apply.",
  Body: FireOnTheOxoBeach,
  related: [
    {
      href: "/journal/the-chain-at-canary-wharf",
      label: "The Chain at Canary Wharf",
      note: "LED chain instead of fire wicks; same body, different rig.",
    },
    {
      href: "/journal/leake-street",
      label: "Leake Street",
      note: "Indoor counterpart — sealed-air practice instead of open sky.",
    },
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why fire poi, like everything else, runs after dark.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "Twelve years of poi, four years of fire inside that.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Fire_performance",
      label: "Fire performance — Wikipedia",
      note: "Background on the discipline and its safety conventions.",
    },
    {
      href: "https://en.wikipedia.org/wiki/OXO_Tower",
      label: "OXO Tower — Wikipedia",
      note: "Background on the building above the foreshore.",
    },
  ],
};
