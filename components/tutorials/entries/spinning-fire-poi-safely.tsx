import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function SpinningFirePoiSafely() {
  return (
    <>
      <p>
        Fire poi photograph well. They also burn well. The first
        photograph you take with fire poi will be the most thrilling
        one you ever take with anything, because it is genuinely
        slightly on fire, and the slight-on-fire is part of the
        composition. The second photograph you take with fire poi
        could be your last one ever, depending on how the first
        photograph went.
      </p>
      <p>
        This is not a "get started" tutorial. It is a "do this only
        after the boring stuff" tutorial. Read it whole before you
        light anything.
      </p>

      <p>
        <strong>The boring stuff.</strong>
      </p>
      <p>
        Before fire enters the picture, the body needs the kata. A{" "}
        <Link
          href="/tutorials/your-first-long-exposure"
          className={ext}
        >
          long-exposure first photograph
        </Link>{" "}
        with a torch is appropriate practice; spinning sock poi (a
        sock with a tennis ball in it, a foot of string between the
        ball and the handle) for a few hundred hours is more
        appropriate. You should be able to do a three-beat weave from
        a cold start without dropping. You should be able to spin
        eyes-closed for a minute without trouble. You should be able
        to walk-and-spin without stepping on yourself. If you are not
        there yet, fire will be ready when you are ready.
      </p>

      <p>
        <strong>The kit.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          A <strong>fire poi set</strong> with proper Kevlar wicks on
          steel chain. Buy from a flow-arts retailer that lists
          weight and wick size; cheap eBay sets are not worth your
          eyebrows.
        </li>
        <li>
          <strong>Paraffin lamp oil</strong> for the wicks &mdash; not
          petrol, not white spirit, not anything else. The fuel
          choice matters; flash points and soot output vary
          considerably. The{" "}
          <a
            href="https://en.wikipedia.org/wiki/Fire_performance"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            fire-performance overview{arrow}
          </a>{" "}
          covers the fuel options if you want to read past my
          opinion.
        </li>
        <li>
          A <strong>fuel dump</strong> &mdash; a metal jug with a lid,
          a sealable fuel container, and a fuel-soaked area separate
          from the spin area.
        </li>
        <li>
          A <strong>safety blanket</strong> made for fire work
          (Nomex is the standard). Damp cotton towels are an
          inadequate second-best; they will not put out a sustained
          burn. The safety blanket is for the worst case, which is
          rare and not impossible.
        </li>
        <li>
          <strong>Cotton or wool clothing</strong>. Not synthetics.
          Polyester melts to the skin under heat; cotton scorches but
          comes off. Tie long hair back, all of it.
        </li>
        <li>
          A <strong>safety</strong> &mdash; a second human, sober,
          paying attention, holding the blanket, between you and the
          equipment cache and the fuel dump. The safety is not
          optional. If you can&rsquo;t find a safety, do not light.
        </li>
        <li>
          Water for the wicks afterwards, in a jug separate from the
          fuel jug, labelled clearly. Wicks die quietly in the wrong
          jug.
        </li>
      </ul>

      <p>
        <strong>The site.</strong>
      </p>
      <p>
        Outdoors. Bare earth, gravel, concrete, or sand. Not grass
        (you will catch it). Not wet grass (you will slip and fall
        into the wicks). Not a beach where the wind comes off the
        sea every six minutes (you will lose the kata). Generous
        clearance: at least twice your wingspan in every direction,
        from anything flammable. Permission, if the site requires
        it. Don&rsquo;t do this in a public park without checking;
        the fire brigade has bigger problems than getting called to
        a circle of flow artists, but they will get called.
      </p>

      <p>
        <strong>The light.</strong>
      </p>
      <p>
        Fire poi photograph beautifully against deep dusk &mdash; not
        full dark, not full light. About forty minutes after sunset,
        the sky still holds the deepest blue, the silhouette of the
        landscape is intact, and the fire arcs read in the
        photograph without nuclear-summit blowout. Long exposures of
        twenty to thirty seconds at f/8 ISO 200 are the studio&rsquo;s
        starting point. The fuller technical background is in the{" "}
        <Link
          href="/tutorials/your-first-long-exposure"
          className={ext}
        >
          beginner tutorial
        </Link>
        .
      </p>

      <p>
        <strong>The light-up.</strong>
      </p>
      <p>
        Pour the fuel into the fuel dump, not directly onto the wicks
        from a bottle. Submerge the wicks fully for thirty seconds,
        then lift, then spin off the excess in the dump (squeezing
        with gloves is faster but you have to know what you&rsquo;re
        doing). The wicks should be saturated but not dripping. A
        dripping wick is a dripping fire in three seconds. Walk to
        your spin area with the wicks still unlit. Light them from a
        torch lighter on a long handle &mdash; not a Zippo, not a
        match. Light the one furthest from your body first. Confirm
        both are burning steady before you start the kata.
      </p>

      <p>
        <strong>The kata.</strong>
      </p>
      <p>
        Spin what you have practised. This is not the night to try a
        new move. Build heat through familiar shapes for the first
        thirty seconds before opening up; the wicks need to warm to
        full output, and your body needs to find its centre. Keep
        the kata in the plane you&rsquo;re practised in. If the wind
        moves, stop, walk to the dump, wait. Do not chase a moved
        kata with fire on the ends.
      </p>

      <p>
        <strong>The end.</strong>
      </p>
      <p>
        When the wicks dim &mdash; not when the flame is gone, but
        when the flame begins to flicker yellow rather than orange
        &mdash; bring the kata to its closing shape, slow, controlled,
        then stop and put the wicks in the water jug. The hiss is
        ugly but appropriate. Cap the fuel dump. Step away. Cool
        down, hydrate, check your skin. Note in the field record
        what fuel you used, how long the burn was, what the wind
        was doing, and what photographs survived. Future-you will
        thank you for the notes.
      </p>

      <p>
        I have been spinning fire for ten years and have not been
        burned past the surface skin once. The reason for that is
        not luck; it is the boring stuff above, run through every
        time without skipping any step. Do the boring stuff. The
        beautiful stuff happens on top of it.
      </p>
    </>
  );
}
