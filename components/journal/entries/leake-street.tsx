import Link from "next/link";

import type { Entry } from "lib/writing";

export default function LeakeStreet() {
  return (
    <>
      <p>
        Leake Street is a three-hundred-metre tunnel under the Waterloo
        rail approach. The walls are legal graffiti, repainted weekly.
        At two in the morning on a Tuesday it is empty, the air thick
        with aerosol, the acoustics tight enough that a single tap
        echoes for three seconds. I went down with the LED poi and a
        camera on a small tripod.
      </p>

      {/* IMAGE: the tunnel mouth at street level, the painted walls disappearing into the dark vanishing point. */}

      <p>
        The tunnel changes what the LEDs read against. Out in a field
        the trace is light against pure black. In Leake Street the
        trace is light against light &mdash; against the saturated
        pinks, blues, fluorescent oranges that whichever crew was
        through that week left up. The exposure has to negotiate
        with the wall. I closed the aperture down to f/11 and brought
        ISO to 100 to give the LEDs a chance to still read as the
        brightest object in the frame.
      </p>

      <p>
        It worked at the third try. The pink ring of a horizontal spin
        hovered against a wall of mostly-yellow tags and read as a
        separate plane. The eye sees it as in front of the paint, even
        though both are the same flat photograph. Long exposure does
        that &mdash; the LEDs move during the shutter and the painted
        wall doesn&rsquo;t, so the wall is sharp and the LEDs are
        smooth, and the brain reads sharpness as background. The
        practice gets to be the foreground without me having to
        compose for it.
      </p>

      {/* IMAGE: a successful frame — the LED ring against the saturated graffiti wall, the figure barely there. */}

      <p>
        The acoustics are the other thing. The chain on a spin is not
        silent &mdash; the LED tether ticks against itself at the
        bottom of each rotation &mdash; and in the tunnel that tick is
        a metronome at exactly the rate of the spin. You can drill the
        kata against the sound of your own kata. I had not had this
        before. Out on a field the tick disperses into nothing; here it
        was a click track. The body locked to it within thirty seconds.
      </p>

      <p>
        I will be going back. The walls turn over every week so the
        photograph is always against a different surface; the
        practice stays the same.
      </p>

      <p>
        Cousin pieces:{" "}
        <Link
          href="/journal/the-chain-at-canary-wharf"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          The Chain at Canary Wharf
        </Link>{" "}
        (same chain, different walls);{" "}
        <Link
          href="/journal/why-night"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          Why Night
        </Link>{" "}
        (the technical reason the tunnel works at this hour).
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "leake-street",
  title: "Leake Street",
  date: "2026-05-12",
  kind: "journal",
  excerpt:
    "Three hundred metres of legal graffiti under Waterloo, at two in the morning. The chain's tick became a click track the body could drill against.",
  Body: LeakeStreet,
  related: [
    {
      href: "/journal/the-chain-at-canary-wharf",
      label: "The Chain at Canary Wharf",
      note: "Same chain, plaza instead of tunnel.",
    },
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why the tunnel is empty at the hour the practice needs it.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "The poi work the photograph is made of.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Leake_Street",
      label: "Leake Street — Wikipedia",
      note: "Background on the legal-graffiti tunnel under Waterloo Station.",
    },
  ],
};
