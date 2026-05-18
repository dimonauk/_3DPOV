import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheYellowBridgeTimelapse() {
  return (
    <>
      <p>
        I set a tripod up on the yellow bridge at Southbank Centre and
        ran the camera for an hour and a half.
      </p>

      {/* IMAGE: the tripod set up on the bridge, deck lights catching it, camera pointed downriver. */}

      <p>
        The bridge gives you the Thames in both directions and the
        Royal Festival Hall&rsquo;s lit underside as a yellow ceiling
        about three metres above the deck. Anything you put on a long
        exposure picks up the yellow as a baseline. The river behind
        runs the other temperature &mdash; cool grey-green &mdash; and
        the contrast between the two does the work for you. You barely
        have to compose.
      </p>

      <p>
        The frame interval was eight seconds. The shutter held two
        seconds at f/5.6, ISO 100. People walking the bridge in those
        two seconds came back as transparent: a faint pink jacket, a
        bag-strap. The handful who stopped to look at the river
        anchored as solid figures. The time-lapse, played back at
        twenty-four frames per second, runs at about a hundred-and-
        ninety-two real seconds per video second &mdash; three minutes
        and twelve a second &mdash; which makes the slow stoppers read
        as the only stable presences. Walkers become weather. Stoppers
        become characters.
      </p>

      {/* IMAGE: a single still pulled from the time-lapse — transparent figures crossing, one solid figure stopped at the rail. */}

      <p>
        The yellow ceiling does one more thing I didn&rsquo;t plan for.
        It rains light down on the deck just enough that visitors&rsquo;
        skin reads warm in a way the river beyond their shoulders never
        does. Faces glow. The Thames stays cold. Every figure on the
        bridge is lit by the building they&rsquo;re standing under;
        nothing else lights them. I will be back for this with a
        better lens.
      </p>

      <p>
        The video file is ninety minutes compressed to thirty-three
        seconds. It plays at the foot of the entry as a loop when the{" "}
        <Link
          href="/journal/the-bus-at-four"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          page-based reader
        </Link>{" "}
        lands; for now it lives on the bench. Next outing I&rsquo;ll
        try a four-hour frame and see what the sunrise does to the
        yellow.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "the-yellow-bridge-timelapse",
  title: "The Yellow Bridge Time-Lapse",
  date: "2026-05-13",
  kind: "journal",
  excerpt:
    "An hour and a half on the yellow bridge at Southbank Centre. Walkers become weather; stoppers become characters.",
  Body: TheYellowBridgeTimelapse,
  related: [
    {
      href: "/journal/the-bus-at-four",
      label: "The Bus at Four",
      note: "London at the hour the time-lapse stretched into.",
    },
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why the camera is out after dark in the first place.",
    },
    {
      href: "/journal/the-chain-at-canary-wharf",
      label: "The Chain at Canary Wharf",
      note: "Same week, different river bend, different technique.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "The studio's wider photography discipline.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Time-lapse_photography",
      label: "Time-lapse photography — Wikipedia",
      note: "The general technique. Frame interval × playback rate sets the compression ratio.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Southbank_Centre",
      label: "Southbank Centre — Wikipedia",
      note: "Background on the Royal Festival Hall the yellow ceiling belongs to.",
    },
  ],
};
