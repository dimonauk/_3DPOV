import Link from "next/link";

import type { Entry } from "lib/writing";

export default function WhyNight() {
  return (
    <>
      <p>
        The honest answer is technical and the honest answer is also
        personal. Both are true at the same time.
      </p>

      {/* IMAGE: a poi rig mid-arc, single long-exposure, ribbon of light against full black background. portrait or landscape, hero-eligible. */}

      <p>
        The technical answer is that a poi photograph is a long
        exposure. The shutter is open for between fifteen and forty-
        five seconds, depending on the kata and the rig. During those
        seconds the LEDs on the rig are the only light source the
        camera sees. If there is any ambient light at all &mdash;
        streetlamps, a porch bulb, sunset bleeding through cloud
        &mdash; that light wins. The poi trace becomes a faint scribble
        in a photograph of the kerb. The exposure has to be made in
        the dark, or the dark has to be made by closing the aperture
        down so far the LEDs themselves go dim. Either way: night, or
        nothing.
      </p>

      <p>
        At f/8, ISO 200, twenty-five seconds &mdash; the numbers from
        a typical kata frame in{" "}
        <Link
          href="/journal/the-night-the-camera-was-right"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          the night the camera was right
        </Link>{" "}
        &mdash; the LEDs read as light and almost everything else reads
        as black. The body is a blur the eye reads as not there. You
        can count strands in a cord by the ridges where the weight
        moved fastest.
      </p>

      {/* IMAGE: detail crop of a poi photograph — the strand-counting close-up. the kind of image that proves the technique. */}

      <p>
        The personal answer is that I drilled poi at night for twelve
        years before I was making photographs of it. The practice was
        already nocturnal. Dark parks, dark beaches, dark balconies,
        an unlit field behind the studio in Salford. The body learned
        the kata in the version of the world that night gives. By the
        time the camera arrived, the dark was already the room the
        practice happened in. The photograph just made the room visible.
      </p>

      <p>
        Night also has a different relationship with the body. Cold
        air holds line. Slow breath stays slow. A four-petal flower
        you can muscle through in a lit-up rehearsal room is a
        completely different shape on a pitch-black field at one in
        the morning, where the only feedback is the heft of the cord
        and the position of the LEDs you can&rsquo;t actually focus on
        without dropping them. The photographs are made of that
        difference. Lit-up rehearsals do not produce the same line.
      </p>

      {/* IMAGE: a wider establishing shot — a dark field with a faint figure mid-kata, LEDs as the only colour in the frame. atmospheric. */}

      <p>
        Practically, this means most of the studio&rsquo;s shooting
        sessions are between midnight and four. By four the body is
        tired enough that the line softens and the shutter starts
        catching shake. By midnight the city is quiet enough that the
        traffic noise stops being a metronome the kata has to fight.
        The window is short. It explains{" "}
        <Link
          href="/journal/the-bus-at-four"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          the bus at four
        </Link>{" "}
        and most of the rest of the journal.
      </p>

      <p>
        The boring summary, for people who skimmed: night is the
        canvas long-exposure painting requires, and night is the room
        the practice was already in. The two conditions arrived
        together. I have never tried to work in daylight; I do not
        expect to.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "why-night",
  title: "Why Night",
  date: "2026-05-17",
  kind: "journal",
  excerpt:
    "Why every poi photograph the studio has ever made is made between midnight and four. The technical answer and the personal answer arrive together.",
  Body: WhyNight,
  related: [
    {
      href: "/journal/the-bus-at-four",
      label: "The Bus at Four",
      note: "The London at the same hour the studio is shooting in.",
    },
    {
      href: "/journal/the-night-the-camera-was-right",
      label: "The Night the Camera Was Right",
      note: "The first night the practice became visible in a photograph.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "Twelve years of poi, all of it after dark.",
    },
    {
      href: "/aerial",
      label: "Aerial",
      note: "The drone fleet, also flown at night for the same reason.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Long-exposure_photography",
      label: "Long-exposure photography — Wikipedia",
      note: "The general technique. Why the shutter stays open.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Light_painting",
      label: "Light painting — Wikipedia",
      note: "The discipline this work sits inside.",
    },
  ],
};
