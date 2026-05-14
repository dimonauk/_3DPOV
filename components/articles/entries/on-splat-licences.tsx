import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function OnSplatLicences() {
  return (
    <>
      <p>
        There are at least three different ways the studio could turn
        a photograph into a 3D Gaussian Splat today, and one of the
        ways is not allowed to make any money. This is not a complaint;
        it is the shape of the field. A short note on why the studio
        runs three separate splat pipelines in parallel, what travels
        with each, and where the outputs end up on the site.
      </p>

      <p>
        <strong>The thing being made.</strong>
      </p>
      <p>
        A 3D Gaussian Splat is, roughly, a swarm of one to two million
        small fuzzy ellipsoids in space, each one with a position, a
        size, a colour, and a transparency, arranged so that when you
        rasterise them from a camera viewpoint the image looks
        photorealistic. The technique was{" "}
        <a
          href="https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          published by an INRIA research group in 2023{arrow}
        </a>{" "}
        and went on to eat a meaningful chunk of the photogrammetry
        and neural-radiance-field worlds that had previously held the
        ground. The output file is a <code>.ply</code>, the same
        venerable point-cloud format that crystallographers and
        printer-bed scanner operators have been swapping since the
        nineties; the only difference is the per-point properties have
        grown sixty-odd fields for the splat. The viewing software is
        recent. The format is ancient. The technique sits on both.
      </p>

      <p>
        <strong>Track one: research.</strong>
      </p>
      <p>
        Apple&rsquo;s machine-learning research group published a
        single-image gaussian-splat model called{" "}
        <a
          href="https://github.com/apple/ml-sharp"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          SHARP{arrow}
        </a>{" "}
        in 2024. Show it one ordinary 2D photograph; receive an
        approximate splat of the scene the photograph was a window
        onto. The studio runs the ONNX export of this on a small box
        with an RTX 3080 Ti and gets a splat back roughly ten seconds
        later. This is fast for what it is. It is also bound by the{" "}
        <code>apple-amlr</code> licence &mdash; the Apple Machine
        Learning Research Licence, which permits academic and research
        use and forbids commercial use of the outputs. The model is
        the work of Apple&rsquo;s research lab. The studio is one
        downstream consumer among many. The licence is not negotiable
        in the small.
      </p>
      <p>
        This is not a problem. It is a description. The studio uses
        SHARP for the research track of its splat work &mdash; the
        archive of public-CCTV stills lifted from London and converted
        into the same camera-viewpoint splats; the &ldquo;what would
        this old photograph look like in three dimensions, roughly,
        for the purpose of thinking&rdquo; question; the bench
        notebook the studio keeps in public at <Link href="/research" className={ext}>/research</Link>.
        Nothing produced through this pipeline appears on a buy
        button.
      </p>

      <p>
        <strong>Track two: commerce.</strong>
      </p>
      <p>
        For splats the studio wants to sell &mdash; editioned prints
        with a 3D companion, walk-through commissions of physical
        spaces, the splat-of-a-room a buyer commissions of their own
        house &mdash; there are two well-established commercial-friendly
        paths. The first is{" "}
        <a
          href="https://www.jawset.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Jawset Postshot{arrow}
        </a>
        , a Windows-native trainer by Jascha Wetzel that produces a
        splat from a set of overlapping photographs or a short video.
        The licence is straightforward commercial software; the
        outputs are the studio&rsquo;s. The second is{" "}
        <a
          href="https://lumalabs.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Luma Labs{arrow}
        </a>
        &rsquo;s hosted gaussian-splat API, which provides
        production-grade splats in exchange for a per-job fee and
        terms that are commercial but somebody else&rsquo;s. The
        studio uses Postshot for splats that are the studio&rsquo;s
        outright and Luma for splats where the speed-to-result and
        quality earn the per-job cost.
      </p>

      <p>
        <strong>Track three: original IP.</strong>
      </p>
      <p>
        Some of the splats the studio cares about most are not derived
        from other people&rsquo;s photographs or someone else&rsquo;s
        model at all. They are captured by the studio&rsquo;s own POV
        rigs and multi-camera arrays &mdash; the rigs already
        documented in <Link href="/articles/why-i-build-my-own-rigs" className={ext}>Why I Build My Own Rigs</Link>{" "}
        and{" "}
        <Link href="/articles/the-fleet-five-airframes" className={ext}>The Fleet</Link>{" "}
        &mdash; and then synthesised into splats using the
        commercial-track trainers above. The capture is the
        studio&rsquo;s. The training run is the studio&rsquo;s. The
        output is the studio&rsquo;s. This is the longest pipeline of
        the three and the one with the cleanest provenance. It is
        also where the work the studio sells under its own name comes
        from.
      </p>

      <p>
        <strong>The licence travels with the record.</strong>
      </p>
      <p>
        Every splat the studio produces, by any of the three tracks,
        is stored as a record with the licence written into it. The
        record is the same shape that{" "}
        <Link href="/articles/provenance-as-discipline" className={ext}>
          Provenance as Discipline
        </Link>{" "}
        describes for editioned prints &mdash; a typed, validated,
        machine-readable contract that travels with the artefact
        forever. The licence field is one of four or five required
        ones. SHARP-derived records carry{" "}
        <code>research-only</code>. Postshot-derived and studio-rig
        records carry <code>commercial-ok</code>. Luma-derived records
        carry <code>third-party-commercial</code>, with the Luma terms
        attached.
      </p>
      <p>
        Downstream of the record, every commerce surface on the site
        &mdash; the print bar under each viewport, the editioned-piece
        catalogue, the splat-of-your-living-room commission form
        &mdash; runs a predicate against the record before it offers
        to take the buyer&rsquo;s money. The predicate is one boolean
        function: a record is commerce-eligible if and only if its
        licence is not <code>research-only</code>. The function is the
        only place in the code that decides what is for sale. There
        is no second route around it. The architecture honours the
        licence by making it impossible, at the level of types and
        guards, for a research-licenced splat to land under a buy
        button.
      </p>

      <p>
        <strong>Why three pipelines.</strong>
      </p>
      <p>
        The studio could pick one track and ignore the others. Each
        of the three would justify the choice. SHARP is the fastest
        and the cheapest; Postshot is the most controllable; the POV
        rigs are the most original. The three are kept in parallel
        because they answer different questions. SHARP answers{" "}
        <em>what does this photograph look like in three dimensions,
        approximately, today, for thirty seconds of compute</em>;
        Postshot answers{" "}
        <em>what is the best splat of this scene the studio can
        produce from a set of images it has on disk</em>; the POV rigs
        answer{" "}
        <em>what is the splat of a moment the studio captured itself
        from a viewpoint nobody else has</em>. Different questions,
        different timescales, different licences, different surfaces.
        Picking one would be picking which of the three questions the
        studio is allowed to ask. The studio is unwilling to pick.
      </p>

      <p>
        <strong>What this means for the reader.</strong>
      </p>
      <p>
        If a splat on the site has a price under it, it is from track
        two or track three, and the studio owns the right to sell it.
        If a splat on the site sits in <Link href="/research" className={ext}>the research notebook</Link>{" "}
        instead, it is from track one, and the studio is showing it
        because the splat is interesting, not because the splat is on
        offer. Both surfaces exist because the studio wants both kinds
        of work to be visible. The thing that decides which surface
        each one lives on is a single field on a single record. The
        record is a type. The type does the work that, in lesser
        architectures, a footnote in someone&rsquo;s terms of service
        would be expected to do alone.
      </p>
      <p>
        The studio buys the coffee.
      </p>
    </>
  );
}
