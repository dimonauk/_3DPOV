import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WallsTunnelForeshore() {
  return (
    <>
      <p>
        UK circus skills don&rsquo;t come out of circus schools, mostly.
        They come out of three or four scrappy places where anyone can
        turn up and start practising and nobody asks for credentials.
        The schools come later, after the practice has already grown
        teeth. This is a look at the three London hubs that have been
        most load-bearing for the current generation: the Hive, Leake
        Street, and the Thames foreshore by the OXO Tower.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The Hive</h2>
      <p>
        A community space &mdash; informal hours, open floor, low cost
        or free at the door &mdash; that turned into the indoor
        practice hall for the London flow-arts and aerial scene.
        Sessions run weekly. Mats on the floor, rigging points
        overhead, hoops and silks in a rack, juggling clubs in
        another. Nobody is performing for anybody. The lighting is
        practical: bright enough to see what you&rsquo;re doing,
        nothing tuned for an audience.
      </p>

      <p>
        What the Hive provides that nothing else does is a flat indoor
        floor in winter. A lot of UK practice is technically possible
        outdoors and practically impossible &mdash; cold hands drop
        rigs, wet grass eats fire, dark fields end early. The Hive
        keeps the kata alive between November and March. By March
        every regular has put in three or four months of indoor drill
        and is ready for the foreshore again.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Leake Street</h2>
      <p>
        Three hundred metres of legal-graffiti tunnel under the
        Waterloo rail approach.{" "}
        <a
          href="https://en.wikipedia.org/wiki/Leake_Street"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Public history{arrow}
        </a>{" "}
        on the tunnel is mostly graffiti-side &mdash; Banksy&rsquo;s
        2008 festival was the spark &mdash; but the corollary nobody
        wrote up is that the tunnel works as a 24-hour practice
        chamber. Concrete floor. Painted walls so vivid the LEDs read
        as a separate plane. Acoustics tight enough the chain-tick of
        a spin becomes a click track.
      </p>
      <p>
        At three in the morning on a weeknight the tunnel is empty.
        You can run a kata for half an hour without anybody noticing.
        The same paint-saturated walls that make a Banksy photograph
        impossible to mistake for any other location make a long-
        exposure poi photograph impossible to mistake for any other
        photographer&rsquo;s. The tunnel signatures the work.{" "}
        <Link href="/journal/leake-street" className={ext}>
          A specific session
        </Link>{" "}
        is documented in the journal.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The OXO Bridge foreshore</h2>
      <p>
        The Thames foreshore between Blackfriars and the OXO Tower is
        beach for about three hours either side of low tide. On a low
        spring tide there&rsquo;s a clear hundred-and-fifty-metre run
        of wet sand and pebble. The river is the audience. The OXO
        Tower is the eyemark. The Thames Path railing above is the
        gallery.
      </p>
      <p>
        Fire poi found this beach in the early 2010s and never left.
        On a clear Saturday at the right tide you might see four
        spinners working twenty metres apart. The etiquette is
        unwritten and absolute: you do not come onto the beach without
        a rig of your own, and you do not interrupt anybody else&rsquo;s
        line. Casual photographers shoot from the railing.{" "}
        <Link href="/journal/fire-on-the-oxo-beach" className={ext}>
          A specific session
        </Link>{" "}
        from this beach is in the journal.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">How the informal feeds the formal</h2>
      <p>
        The UK has good circus schools.{" "}
        <a
          href="https://en.wikipedia.org/wiki/National_Centre_for_Circus_Arts"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          The National Centre for Circus Arts at Hoxton{arrow}
        </a>{" "}
        runs a BA and an MA. Circomedia in Bristol runs an HE programme.
        Both are excellent. Both pull most of their applicants from
        people who already had a practice before they applied. The
        practice came from the hubs.
      </p>
      <p>
        Nobody arrives at NCCA having never spun a rig and decides to
        become a flow artist. The decision is always already made on
        a foreshore or a tunnel floor or under the Hive&rsquo;s
        rigging points, with two or three years of self-taught
        drilling behind it. The school then takes the practice and
        gives it stage discipline, choreography vocabulary, partner
        work, the things you can&rsquo;t teach yourself. The
        informal-formal pipeline is one-way and the informal end is
        the wider one.
      </p>

      <p>
        The same shape holds for the photography that documents this
        scene. The photographers who cover UK flow arts are, almost
        without exception, flow artists themselves. They learned to
        shoot{" "}
        <Link href="/journal/why-night" className={ext}>
          at night
        </Link>
        , long-exposure, by chasing their own spin first and other
        people&rsquo;s second. There is no separation between subject
        and documenter. The body that knows the kata knows what frame
        to wait for.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Why this matters</h2>
      <p>
        The legible institutions get the credit and the funding. The
        Hive does not get reviewed in the Guardian. Leake Street is
        an unmonitored tunnel. The foreshore is tide-dependent and
        ungated. If the institutions disappeared tomorrow the
        practice would continue; if the three hubs above closed
        tomorrow there would not be a generation of UK circus
        practitioners ten years from now. Where the work actually
        comes from is worth keeping in mind when somebody asks where
        UK circus comes from.
      </p>

      <p>
        Cousin reading: the{" "}
        <Link href="/articles/kindred-practices" className={ext}>
          kindred practices
        </Link>{" "}
        piece on the cross-pollination between disciplines that
        meet at these hubs. The studio&rsquo;s{" "}
        <Link href="/practice" className={ext}>
          practice page
        </Link>{" "}
        documents how one person&rsquo;s practice has navigated this
        pipeline over twelve years.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "walls-tunnel-foreshore",
  title: "Walls, Tunnel, Foreshore",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "The three informal London hubs that feed UK circus skills: the Hive, Leake Street, and the OXO Bridge foreshore. The institutions get the credit; the hubs do the load-bearing.",
  Body: WallsTunnelForeshore,
  related: [
    {
      href: "/journal/leake-street",
      label: "Leake Street",
      note: "A specific tunnel session.",
    },
    {
      href: "/journal/fire-on-the-oxo-beach",
      label: "Fire on the OXO Beach",
      note: "A specific foreshore session.",
    },
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why all three hubs work after dark.",
    },
    {
      href: "/articles/kindred-practices",
      label: "Kindred Practices",
      note: "The cross-pollination between flow disciplines.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "Twelve years through the pipeline.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Leake_Street",
      label: "Leake Street — Wikipedia",
      note: "Background on the tunnel, including the 2008 Banksy festival.",
    },
    {
      href: "https://en.wikipedia.org/wiki/National_Centre_for_Circus_Arts",
      label: "National Centre for Circus Arts — Wikipedia",
      note: "The institutional end of the pipeline; Hoxton.",
    },
    {
      href: "https://www.circomedia.com/",
      label: "Circomedia — Bristol",
      note: "The other major UK higher-education circus programme.",
    },
  ],
};
