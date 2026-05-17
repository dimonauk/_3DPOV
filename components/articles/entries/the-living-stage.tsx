import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheLivingStage() {
  return (
    <>
      <p>
        The sculpture side of the bench produces objects. Twenty-five
        candidates per generation, scored 1 to 5, the population
        converging across twenty or thirty turns toward forms the
        studio wants to print. That part is{" "}
        <Link href="/articles/how-the-studio-breeds-sculptures" className={ext}>
          written up elsewhere
        </Link>
        . The question this piece is about sits underneath all of it:
        if the engine can breed a shape, can the same engine breed a
        performance? Can the data that drives the resin printer also
        choreograph the body that fed the data in?
      </p>
      <p>
        The answer the studio has been working toward is yes, with a
        specific shape, and the name for that shape is Laban.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Gesture as vocabulary
      </h2>
      <p>
        Rudolf Laban spent the 1920s asking what the elements of human
        movement actually are. Not what they look like &mdash;
        movement-as-visible-shape is the easy bit &mdash; but what
        they <em>mean</em> to the body that makes them and the body
        that watches. His system, refined across the century into{" "}
        <a
          href="https://en.wikipedia.org/wiki/Laban_movement_analysis"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Laban Movement Analysis{arrow}
        </a>
        , divides every possible gesture into four interlocking
        components: Body (what moves and how it connects), Effort
        (the quality, the intention), Shape (how the form changes
        through space), and Space (where in the room and the
        kinesphere it goes).
      </p>
      <p>
        For the studio the load-bearing part is Effort. Effort is
        what the audience feels when they cannot name what they are
        seeing. It runs on four sub-spectra: Weight (strong to
        light), Space (direct to indirect), Time (sudden to
        sustained), Flow (free to bound). A full-arm poi circle at
        Weight=0.9 commands a room. The same circle at Weight=0.1
        beckons. Same path. Same hand. Different message. The
        difference is encoded nowhere on the trajectory and entirely
        in the body that drew it.
      </p>
      <p>
        That is the bit that makes Laban computationally interesting.
        Each Effort axis is a number between zero and one. So is
        every parameter on the studio&rsquo;s sculpture genome.
        Suddenly the body and the resin object are described in the
        same alphabet.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The stage as a field
      </h2>
      <p>
        Where a body is on stage is not neutral. Edward Hall
        formalised this in 1966 as proxemics: distance is meaning.
        Intimate distance (under 45 cm) overrides every other signal
        the performer is putting out. Personal distance (45 cm to
        1.2 m) is the territory where a sustained gaze reads as
        specifically aimed at one human face. Social distance (1.2
        to 3.6 m) is where movement quality has to do the work that
        proximity used to. Public distance (beyond 3.6 m) is the
        zone of architectural statement &mdash; full body line,
        scale, the choreographic equivalent of speaking up.
      </p>
      <p>
        For a solo performer with poi, there is no other dancer to
        carry relationship. The audience IS the relationship. Every
        spatial decision is a sentence about how the body wants to
        be with the room. Downstage centre is the highest-power zone
        in Western theatre &mdash; the &ldquo;I am here&rdquo;
        statement, the position the audience&rsquo;s eye snaps to
        involuntarily. Diagonal travel paths cross the power axis
        and carry the most kinetic charge. Upstage retreat after a
        downstage climax reads as mystery; the audience leans in
        because the distance asks them to.
      </p>
      <p>
        The studio&rsquo;s solo work has been doing this
        instinctively for twelve years. Naming it on a grid is the
        new bit. Once the grid is named, the engine can plan
        against it.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Song as dramatic architecture
      </h2>
      <p>
        A song is not background music. It is a pre-built dramatic
        script with tension, release, contrast and climax already
        wired in. Every section &mdash; intro, verse, pre-chorus,
        chorus, breakdown, bridge, outro &mdash; has an emotional
        function and a specific kinetic demand. The studio reads a
        song&rsquo;s structure first and uses it as the scaffold the
        rest of the choreography hangs off.
      </p>
      <p>
        The intro is the spatial claim &mdash; sustained, bound,
        upstage to downstage across sixteen bars, the body
        announcing where the room ends and the work begins. Verses
        explore: full stage width, indirect effort space,
        conversational quality, individual audience contact made
        but not yet sustained. The pre-chorus tightens &mdash; flow
        shifts from free toward bound, withholding what the chorus
        is about to release. The chorus is the gift: fully free
        flow, full extension, maximum poi reach, multiple audience
        sections feeling included at once. The breakdown empties
        the room. Stillness or near-stillness, in a completely
        different stage zone from the chorus that preceded it; the
        contrast is everything. The bridge surprises &mdash; level
        change, direction change, plane change; one strong choice,
        not many. The outro resolves to a final image that earns
        whatever it earns.
      </p>
      <p>
        This is not the studio inventing dramatic structure. This
        is dramatic structure being honest about itself. Every
        live performance the studio has ever given was already
        following these patterns by instinct. The system is just
        the part that writes them down so a generational engine can
        breed against them.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The flirt &mdash; Effort as a four-beat
      </h2>
      <p>
        The most specific thing Laban gives the studio is the
        sequence by which an audience member is made to feel
        personally seen. Four beats, in order:
      </p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Direct space toward them.</strong> Focused gaze,
          aimed movement. The room sharpens around one face.
        </li>
        <li>
          <strong>Transition to Indirect.</strong> The moment of
          maybe. The body becomes peripheral, scanning, ambiguous.
        </li>
        <li>
          <strong>Brief Free flow toward them.</strong> A small open
          gesture &mdash; a hand extension, a poi opening, an
          uncurled arm. The gift offered.
        </li>
        <li>
          <strong>Bound withdrawal.</strong> The gift withheld. The
          body recovers, the poi closes, the gaze breaks. The
          audience member is left holding the offer in the air.
        </li>
      </ol>
      <p>
        This is the structure of seduction at any scale. It maps
        onto poi naturally: direct circle into wandering spiral
        into open hand-extension into poi withdrawal behind the
        body. A four-bar phrase, two seconds at performance tempo,
        repeated across a five-minute set in slightly different
        keys. The system can generate the phrase, evolve it for
        feel, and schedule it against the song structure so the
        intimate moments land where the song is asking for them.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The genome, extended
      </h2>
      <p>
        The sculpture genome was twenty-eight parameters describing
        a single object. The choreography genome describes a whole
        three- to five-minute performance, with spatial and
        audience-address information baked in at every event. It
        has three nested levels: performance (the arc shape, the
        climax timing, the flirt intensity, the stage coverage
        bitmask), phrase (a four-to-thirty-two-bar movement chunk:
        gesture type, effort profile, stage zone, travel path,
        audience target, duration), and gesture (a single poi
        movement: pattern, plane, speed, extension, body rotation,
        level, plus the twenty-eight sculpture parameters for the
        physical form that gesture <em>would produce</em> if it
        were captured and sent through the printer).
      </p>
      <p>
        That last bit is what closes the loop. A choreography gene
        is not just movement instructions. It is also the recipe
        for the sculpture that movement would carve out of resin.
        Every performance the engine generates is implicitly a
        family of sculptures. Every sculpture the engine generates
        is implicitly a gesture. The two halves describe each other.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the system hears
      </h2>
      <p>
        Before any choreography is generated, the song gets
        analysed. Offline, in Python,{" "}
        <a
          href="https://librosa.org/doc/latest/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          librosa{arrow}
        </a>{" "}
        does the work: beat tracking to millisecond precision,
        onset detection for every drum hit and melodic accent,
        spectral analysis splitting bass energy from treble,
        section segmentation via chroma features to identify verse
        and chorus boundaries, a lightweight valence model
        estimating emotional weight. The output is a song map: BPM,
        beat times, onset times, an energy curve, a weight curve
        (bass-heavy moments drive grounded movement; treble-heavy
        moments drive light aerial movement), and the section
        boundaries the choreography will pivot on.
      </p>
      <p>
        The map becomes the temporal scaffold. Onsets become
        candidate accent points &mdash; the system picks about a
        third of them; more is exhausting, fewer is underwhelming.
        Section boundaries become transition moments; the body has
        to be in a different zone by the start of the new section.
        The energy curve maps to movement scale. The spectral
        balance maps to Laban Weight. Chorus identification sets
        the energetic ceiling for the whole performance.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Evolving complete dances
      </h2>
      <p>
        The same evolutionary architecture used for sculptures
        applies. Twenty-five performance genomes per generation,
        rendered as floor plan SVGs and kinetic arc charts and
        Laban timelines for review, scored on five axes &mdash;
        spatial variety, audience coverage, kinetic arc shape,
        flirt effectiveness, overall feel &mdash; selected, bred,
        mutated, repeated across generations. The fitness function
        is human. I score them; the engine carries the breadth.
        The aesthetic comes from twelve years of doing the work;
        the machine carries the combinatorics. It is the same
        two-handed pattern that{" "}
        <Link href="/articles/the-familiar" className={ext}>
          runs the rest of the studio
        </Link>
        .
      </p>
      <p>
        What it unlocks is preparation that scales. A live show
        rehearsal cycle used to be hours of trial-and-error with
        the music looping in the background and the body taking
        notes on what felt right. The system does not replace any
        of that &mdash; the body still has to do the body part
        &mdash; but it does mean the studio can spend a Tuesday
        evening evolving thirty generations of candidate
        performances against a specific track, find three or four
        whose arc shape genuinely surprises, and walk into the
        rehearsal already knowing which sections to test. The
        engine carries the combinatorics so the body can spend
        its energy on the part only the body can do.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why this matters for the work
      </h2>
      <p>
        The whole architecture rests on one quiet claim: the data
        is not generic. The gesture library is built from this
        specific body, on this specific bench, across the years of
        practice the studio is named after. A choreography evolved
        from that library cannot accidentally produce a movement
        that is not the studio&rsquo;s. The provenance is the
        artistic value. The same way the waveguide objects are
        sculpted by a captured movement on a captured day, the
        performances evolved from this engine are sculpted by a
        captured body across twelve years. The body is the corpus.
        The corpus is the data.
      </p>
      <p>
        Layer four of{" "}
        <Link href="/articles/art-as-door-five-layers" className={ext}>
          the five-layer architecture
        </Link>{" "}
        was the system, named in brief. This piece is what it
        means when the system is the choreography as well as the
        sculpture. The body in space, the song in time, the
        audience in the room, the engine in the loop. Same
        practice, scaled along the missing axis. The studio has
        been preparing for this for twelve years without knowing
        it had a name.
      </p>
      <p>
        Now it has one.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-living-stage",
    title: "The Living Stage",
    date: "2025-09-12",
    kind: "article",
    excerpt:
      "Laban Movement Analysis as gesture vocabulary. Hall's proxemics as spatial grammar. Song structure as dramatic scaffold. How the studio's evolution engine extends from breeding sculptures to breeding complete performances — body in space, song in time, audience in the room.",
    Body: TheLivingStage,
    related: [
      {
        href: "/visualiser/laban-dial",
        label: "Visualiser — Laban Effort dial",
        note: "Interactive — drag the four sliders, find the eight Basic Efforts at the corners of the cube. The kinematic layer of this piece, made playable.",
      },
      {
        href: "/articles/vr-as-psychological-system",
        label: "VR as a Psychological System",
        note: "The cognitive-systems companion. Both pieces treat the body as the load-bearing data source.",
      },
      {
        href: "/articles/why-i-build-my-own-rigs",
        label: "Why I Build My Own Rigs",
        note: "The instrument side of the same body. The bench tradition the gesture library is captured on.",
      },
      {
        href: "/practice",
        label: "Practice — body discipline",
        note: "The twelve-year arc the gesture vocabulary is built from.",
      },
      {
        href: "/journal/year-one-fire",
        label: "Journal — Year One, fire",
        note: "Where the gesture library begins in honest order.",
      },
      {
        href: "/the-loop",
        label: "The Loop — body in space, position one",
        note: "Where this article sits in the studio's overall architecture.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The same evolution engine, applied to objects rather than performances. The sister piece.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Laban_movement_analysis",
        label: "Laban Movement Analysis — Wikipedia",
        note: "The full vocabulary: Body, Effort, Shape, Space. The system the choreography genome rests on.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Rudolf_von_Laban",
        label: "Rudolf Laban — Wikipedia",
        note: "Biography of the dance theorist whose 1920s work is the load-bearing reference of this piece.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Effort_(Laban)",
        label: "Effort (Laban) — Wikipedia",
        note: "The four sub-spectra (Weight, Space, Time, Flow) that the studio uses as gene axes for movement quality.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Proxemics",
        label: "Proxemics — Wikipedia",
        note: "Edward Hall's 1966 framework for the spatial dimension of human communication. Intimate, personal, social, public.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Kinesphere",
        label: "Kinesphere — Wikipedia",
        note: "Laban's term for the personal space within reach of the body. The unit of measurement for movement extension.",
      },
      {
        href: "https://librosa.org/doc/latest/index.html",
        label: "librosa — Python audio analysis library",
        note: "The offline tool the studio uses to extract song structure: beat tracking, onset detection, section segmentation.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Edward_T._Hall",
        label: "Edward T. Hall — Wikipedia",
        note: "Cultural anthropologist who formalised proxemics. The Hidden Dimension (1966) is the seminal text.",
      },
      {
        href: "https://google.github.io/aichoreographer/",
        label: "Google AIST++ dataset — AI Choreographer project",
        note: "1,408 3D dance sequences across 10 genres, music-conditioned. The reference dataset for music-to-movement research.",
      },
    ],
  };
