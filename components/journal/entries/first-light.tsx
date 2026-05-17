import Link from "next/link";

import type { Entry } from "lib/writing";

export default function FirstLight() {
  return (
    <>
      <p>
        The{" "}
        <Link
          href="/aerial"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          drone fleet
        </Link>{" "}
        has been operational for months &mdash; photography work,
        mostly. Tonight was something else. The first airframe came
        out of the workshop with a programmable LED array bolted to
        its underside. A short strip, addressable, running a test
        pattern designed to look like a horizontal line when the
        drone is in motion.
      </p>
      <p>
        We did not go far. A patch of unlit ground a few minutes&rsquo;
        walk from the bench, the sky overcast, no moon. The camera on a
        tripod, shutter open for thirty seconds at a time. Three flights,
        each a different pattern, each carrying a different colour
        profile.
      </p>
      <p>
        What worked: the LEDs are bright enough. Even at the apertures
        the Mavic glass wants for a sharp horizon, the test pattern
        punched through at altitude. The line stayed a line &mdash; the
        rotor wash did not visibly disturb the array.
      </p>
      <p>
        What didn&rsquo;t: the synchronisation between the drone&rsquo;s
        flight path and the LED frame timing. On the body, with a{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          swung rig
        </Link>
        , the sync is mechanical &mdash; the Hall sensor reads the
        rotation, the frames clock against it. In the air, the rig moves
        but does not rotate. The first sync logic was timing-based, and
        at the speeds the airframe flies, the frames drifted within a
        single exposure. The trace bent where it should have been
        straight.
      </p>
      <p>
        Tomorrow: rewrite the frame clock against GPS velocity. The
        pattern can correct for the airframe&rsquo;s own motion in real
        time. Until then, the photographs from tonight stay on the
        bench.
      </p>
      <p>
        The platform is flying. The image data is in the air. The
        technique is not consistent yet. It will be.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "first-light",
    title: "First Light",
    date: "2026-04-22",
    kind: "journal",
    excerpt:
      "First flight of the LED-modified airframes. The platform is flying; the technique is not consistent yet.",
    Body: FirstLight,
    related: [
      {
        href: "/journal/on-the-apparatus",
        label: "On the Apparatus",
        note: "The spec sheet for the kit in the air.",
      },
      {
        href: "/aerial",
        label: "Aerial — the fleet, the FPV pipeline",
        note: "The full drone fleet and how it is flown.",
      },
      {
        href: "/practice",
        label: "Practice — Stage V, drones modified",
        note: "Where this work sits in the studio's history.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
        label: "Persistence of vision — Wikipedia",
        note: "The optical effect every POV display depends on. Start here for the underlying principle.",
      },
      {
        href: "https://en.wikipedia.org/wiki/DJI_Mavic",
        label: "DJI Mavic — Wikipedia",
        note: "Background on the Mavic 2 Pro airframe and the Hasselblad L1D-20c imaging system.",
      },
      {
        href: "https://en.wikipedia.org/wiki/First-person_view_(radio_control)",
        label: "First-person view (RC) — Wikipedia",
        note: "Overview of the FPV control discipline the studio's flights run on.",
      },
    ],
  };
