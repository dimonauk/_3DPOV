import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = (
  <span className="ml-0.5 text-chrome-500">&nearr;</span>
);

export default function SockPoiToThreeBeatWeave() {
  return (
    <>
      <p>
        Most poi tutorials start with a chain. The chain is a
        mistake. The chain teaches your hand to grip when it should
        be loose, and your shoulder to muscle when it should be
        listening. You will be on a chain soon enough; for the first
        hundred hours you want a sock with a tennis ball in it and
        a sense of humour.
      </p>
      <p>
        I started poi twelve years ago in a back garden in Salford
        with a pair of socks and a copy of Home of Poi's forward
        spin diagram. By the end of the third evening I had a
        three-beat weave at half speed. By the end of the second
        month I had it at full speed with my eyes closed. The
        rungs of this tutorial are the rungs I climbed; the
        timings are honest.
      </p>

      <p>
        <strong>What you are making.</strong> Not a skill, not a
        kata yet &mdash; a body that knows how a tethered weight
        wants to move when you stop fighting it. By the end of
        this rung you will hold a three-beat weave continuously
        for sixty seconds at moderate speed, with your eyes
        closed, in either direction.
      </p>

      <p>
        <strong>The kit.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          Two long socks &mdash; tube socks, walking socks, hiking
          socks. The longer the better. The studio's first pair
          were welly socks pinched from a drawer.
        </li>
        <li>
          Two tennis balls (or two oranges, or two beanbags of
          comparable weight). 50&ndash;70g per head is the sweet
          spot. Heavier teaches faster; lighter forgives more.
        </li>
        <li>
          A room with a 2.5m ceiling minimum. A garden is better.
          A long corridor is fine. The thing you must NOT have
          is anything fragile within a 1.2m radius.
        </li>
        <li>
          A pair of trainers and clothes you don't mind sweating
          in. Poi is a workout disguised as a meditation.
        </li>
      </ul>
      <p>
        Drop the ball into the toe, knot the sock above the ball,
        and you have a poi. Total cost: zero, if you have socks.
      </p>

      <p>
        <strong>The forward spin.</strong>
      </p>
      <p>
        Stand with feet shoulder-width apart. Hold one poi by the
        knot, arm relaxed at your side. Lift the hand to hip
        height, palm facing the wall in front of you. Now circle
        the hand forward and down &mdash; not the whole arm, just
        the wrist tracing a small circle the size of a side plate.
        The poi will follow, lazily at first, then with intent.
      </p>
      <p>
        That is a forward spin. Hold it for thirty seconds. The
        wrist is the engine; the arm is the suspension; the
        shoulder is the chassis. Keep the shoulder relaxed. If
        your shoulder hurts after one minute, you are gripping
        too hard.
      </p>
      <p>
        Now do the other hand. The other hand will be
        embarrassing. The other hand always is. This is normal.
        Give it the same thirty seconds. Then both hands together
        &mdash; both forward, both spinning in time. This is
        called <em>same-time same-direction</em>, and it is the
        first rung any poi teacher will check.
      </p>

      <p>
        <strong>Split time and the wall plane.</strong>
      </p>
      <p>
        Bring both hands together at the bottom of their orbits,
        then split: when the right poi is at the top, the left
        poi is at the bottom. This is{" "}
        <em>split-time same-direction</em>. The poi heads pass
        each other in front of your body twice per cycle. They
        will hit each other for the first three or four minutes.
        That is also normal. The geometry of avoidance is what
        your body is learning.
      </p>
      <p>
        The plane of the spin should stay parallel to the wall in
        front of you &mdash; the <em>wall plane</em>. Poi that
        spin in a flat plane don't tangle; poi that drift into a
        cone do. If you find your poi cone-ing, slow down, relax
        the wrist, and let the weight pull the cord taut. The
        cord wants to be taut; the cord will teach you.
      </p>

      <p>
        <strong>The three-beat weave.</strong>
      </p>
      <p>
        Once you can hold split-time same-direction for thirty
        unbroken seconds, the three-beat weave is the next move.
        The weave has three beats per side: <em>over, under,
        over</em> on the right; then <em>over, under, over</em> on
        the left; then back to the right. The hand crosses the
        body's centre line; the poi follow.
      </p>
      <p>
        I am not going to write a paragraph about exactly when
        each hand crosses the other; that path leads to confusion.
        Watch the canonical{" "}
        <a
          href="https://www.homeofpoi.com/lessons/teach/3-Beat-Weave"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Home of Poi diagram{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://www.youtube.com/@DrexFactor"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          a DrexFactor tutorial{arrow}
        </a>{" "}
        on the same move. The diagram tells your eye; the video
        tells your body. Watch both, then close the screen and
        try it.
      </p>
      <p>
        You will get it wrong for an hour. You will get it wrong
        for two hours. Then, between one rep and the next, the
        muscle will remember and the rep will be right. This is
        the moment poi people refer to as &ldquo;getting the
        weave&rdquo;. It is the first big aha of poi. Mine landed
        in a garden in early August twelve years ago and I
        remember the cricket noise.
      </p>

      <p>
        <strong>Eyes closed.</strong>
      </p>
      <p>
        Once the weave is working open-eyed at moderate speed, do
        it eyes closed. Just for ten seconds at first; the brain
        panics; the panic eases. You are practising
        proprioception &mdash; the body's sense of where its parts
        are without sight. This is the muscle the studio's rigs
        and the studio's photographs both rest on.
      </p>
      <p>
        Eyes closed reveals what eyes open conceals: which side is
        weaker, which beat is rushed, where the cord is going
        slack. Listen with the wrists. The wrists know.
      </p>

      <p>
        <strong>The plane visualiser.</strong>
      </p>
      <p>
        The studio is building{" "}
        <Link href="/atelier/poi-geometry" className={ext}>
          /atelier/poi-geometry
        </Link>{" "}
        &mdash; a live 3D scene where two glowing points orbit a
        hand position. The reader can scrub the phase, the plane,
        and the beat count; the geometry of the three-beat weave
        emerges as a real curve in space, not a sequence of
        instructions. Until that ships, the{" "}
        <Link href="/visualiser/laban-dial" className={ext}>
          Laban dial visualiser
        </Link>{" "}
        is the closest tool the studio has. Look at it before
        and after your sessions; the notation will start to
        match the feeling.
      </p>

      <p>
        <strong>Common faults, recognised in under a second.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Cord goes slack.</strong> You are decelerating
          at the top. Push the wrist through the top instead of
          easing.
        </li>
        <li>
          <strong>Poi clip each other.</strong> Your plane is
          drifting forward. Imagine the wall plane as a flat
          pane of glass and keep both spins flush against it.
        </li>
        <li>
          <strong>Shoulder hurts.</strong> Wrong shoulder.
          Engage from the wrist, not from the deltoid.
        </li>
        <li>
          <strong>One hand keeps stalling.</strong> Spend a
          dedicated five minutes per session on your weaker
          hand alone. Asymmetry is the great enemy.
        </li>
      </ul>

      <p>
        <strong>The thousand-hour question.</strong>
      </p>
      <p>
        Poi people sometimes talk about a thousand-hour mark
        where everything you've been doing becomes something else
        &mdash; flow rather than figures, breath rather than
        beats. I'm twelve years in and the mark keeps moving. The
        useful thing to know is that the first hundred hours are
        the hardest by a long stretch. After that, the practice
        accumulates on itself.
      </p>

      <p>
        <strong>Without scrolling back:</strong> what is the wall
        plane, and which fault is the first sign you've left it?
      </p>

      <p>
        <strong>What next.</strong> The Laban notation rung will
        give you a written language for the moves you can now do
        with your hands. Read the studio's article on{" "}
        <Link href="/articles/choreographing-with-laban" className={ext}>
          choreographing with Laban
        </Link>{" "}
        before you move on; it answers the question this rung
        leaves you holding: <em>once the weave is a habit, how
        do you turn three minutes of solid weave into a piece
        with shape?</em>
      </p>
      <p>
        Pick a week. Two sessions of forty-five minutes each,
        three days apart. Set the implementation intention now.
        The body learns on the rest day; the rest day is the
        practice.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "sock-poi-to-three-beat-weave",
  title: "Sock Poi to Three-Beat Weave",
  date: "2026-05-26",
  kind: "tutorial",
  excerpt:
    "The first thousand hours of poi practice, condensed: holding the cord, the forward spin, the three-beat weave from cold, eyes closed.",
  Body: SockPoiToThreeBeatWeave,
  related: [
    {
      href: "/atelier/poi-geometry",
      label: "Atelier — Poi Geometry (in preparation)",
      note: "Live 3D scene of two glowing points orbiting a hand. Scrub the phase, plane, and beat count.",
    },
    {
      href: "/visualiser/laban-dial",
      label: "Visualiser — Laban Dial",
      note: "Movement notation as an interactive dial. The closest written language for what your hands are learning.",
    },
    {
      href: "/articles/choreographing-with-laban",
      label: "Article — Choreographing with Laban",
      note: "Once the weave is a habit, the article answers what to do with it.",
    },
    {
      href: "/tutorials/spinning-fire-poi-safely",
      label: "Tutorial — Spinning Fire Poi Safely",
      note: "The upper rung. Do not skip ahead; the body needs the kata before fire.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.homeofpoi.com/tutorials/",
      label: "Home of Poi tutorials",
      note: "The canonical free resource. Twenty years of poi pedagogy in one site.",
    },
    {
      href: "https://www.homeofpoi.com/lessons/teach/3-Beat-Weave",
      label: "Home of Poi — Three-beat weave",
      note: "The diagram that opens the geometry up.",
    },
    {
      href: "https://www.youtube.com/@DrexFactor",
      label: "DrexFactor — YouTube",
      note: "Pedagogical brilliance, clarity of breakdown, generous voice.",
    },
    {
      href: "https://poiwisdom.com/",
      label: "Poi Wisdom",
      note: "Community + tutorial archive. Slower-paced than HOP, more philosophical.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Poi_(performance_art)",
      label: "Poi (performance art) — Wikipedia",
      note: "The cultural lineage, written carefully. Useful before you teach the form to anyone else.",
    },
  ],
};
