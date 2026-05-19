import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheBusAtFour() {
  return (
    <>
      <p>
        I do not sleep well in spring. Last weekend, somewhere past
        three, I gave up and started walking.
      </p>

      {/* IMAGE: an empty London street at 3am, kerbside, the orange-pink of streetlights on damp pavement. landscape, hero-eligible. */}

      <p>
        London at three in the morning is not the London anyone tells
        you about. The streets are not the cinema version with a single
        figure staggering against the camera. They are quieter than
        that. There is almost no-one. The buses still run, half-full at
        most, the night drivers know the routes by heart and take them
        slowly. I walked from Bermondsey toward the river and saw four
        people in forty minutes &mdash; a delivery rider stopped at a
        coffee van by the bridge, the woman running the coffee van, a
        man on the pavement with a small dog at one of the lights at
        Tower, and the driver of an empty 343 who waved as he went
        past. Everyone nodded. No-one spoke.
      </p>

      {/* IMAGE: the Thames looking east from the south bank, water dark, sky still pre-dawn dark with only the first hint of paling at the horizon. */}

      <p>
        I have a complicated relationship with feeling safe in cities.
        The version of London that the day gives you is not the version
        it gives you at four. At four it is gentle. The river is the
        only thing in motion. The pavements have width to them they do
        not have during the rush. I walked along the south bank from
        Tower toward Borough, then back again, then sat at a stop for
        the first eastbound bus.
      </p>

      <p>
        The top deck of the first bus of the day is one of the best
        rooms in the city. You go up the stairs and there is no-one,
        the seats are warm from the heater under them, and you have a
        row of windows three metres long pointed at whatever direction
        the bus is going. You can sit in the very front and pretend you
        are driving. I am thirty-something and I still do this.
      </p>

      {/* IMAGE: top deck of a night bus, empty seats, the particular yellow interior light London buses have. shot from the front-row seat looking down the aisle. */}

      <p>
        The sun came up over the Lea. I was somewhere between Wapping
        and Limehouse, I think &mdash; the bus does not always tell
        you, and at four-thirty in the morning the geography of east
        London resolves more as light against silhouette than as named
        places. The sky went from black-blue to a particular mauve I
        have only seen at this hour: a mauve that has been told off,
        not quite pink, not quite cold. It landed first on the river,
        then on a row of cranes, then on the side of the bus itself.
      </p>

      {/* IMAGE: dawn light through the bus window — pale-pink sky behind silhouetted cranes / buildings / something east London. landscape. */}

      <p>
        By the time we reached wherever I was going, it was day. I
        walked home in daylight, past people opening shops. The shift
        from being the only person out to being one of thousands took
        perhaps twenty minutes. I do not know what to do with the fact
        that the same city is two different places depending on the
        hour. I do know I want more of the four-in-the-morning one. It
        is the version of London I trust.
      </p>

      {/* IMAGE (optional): the sunrise itself landing on something specific — colour on cranes, a riverside building lit pink from the side. */}

      <p>
        The other useful thing the four-in-the-morning city does is
        remind me{" "}
        <Link
          href="/journal/why-night"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          why I shoot at night
        </Link>{" "}
        in the first place. The poi photographs come out of a long
        exposure that needs darkness to work; the city at this hour is
        the same darkness, scaled up, with people in it. I sometimes
        think the practice taught me what to look for after the sun
        goes down. Sometimes I think it&rsquo;s the other way round.
      </p>

      <p>Then I slept.</p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "the-bus-at-four",
  title: "The Bus at Four",
  date: "2026-05-18",
  kind: "journal",
  excerpt:
    "London at three in the morning is not the London anyone tells you about. The top deck of the first bus of the day is one of the best rooms in the city.",
  Body: TheBusAtFour,
  related: [
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why all the photography work happens after dark.",
    },
    {
      href: "/journal/the-night-the-camera-was-right",
      label: "The Night the Camera Was Right",
      note: "The night the practice became a record-making discipline.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "The poi work the photographs are made of.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Night_photography",
      label: "Night photography — Wikipedia",
      note: "The general technique. Long exposures, slow shutters, patient cameras.",
    },
    {
      href: "https://tfl.gov.uk/modes/buses/24-hour-buses",
      label: "24-hour buses — Transport for London",
      note: "The network of routes that run through the night. The 343 is one of them.",
    },
  ],
};
