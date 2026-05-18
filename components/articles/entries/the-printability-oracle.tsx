import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

export default function ThePrintabilityOracle() {
  return (
    <>
      <p>
        Every Monday morning the bench rejects sixty per cent of last
        week&rsquo;s candidates. The{" "}
        <Link href="/articles/how-the-studio-breeds-sculptures" className={ext}>
          evolution engine
        </Link>{" "}
        runs all weekend &mdash; twenty-five candidates a generation,
        twenty or thirty generations a session &mdash; and on Monday a
        validator I call the Oracle reads each survivor for whether it
        will actually print. Most of them won&rsquo;t. The ones that
        look the best on the screen tend to be the ones the Oracle
        kills hardest. This is an essay about why the killing has to
        happen.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">What the Oracle checks</h2>
      <p>
        The Oracle runs a fixed list of geometric tests against the
        candidate mesh before the genome is allowed near a slicer.
        Each test has a threshold; each threshold is a hard line.
        There is no warning tier and no &ldquo;close enough&rdquo;
        bucket. A candidate either passes every check or it doesn&rsquo;t
        leave the queue.
      </p>
      <p>
        <strong>Manifold integrity.</strong> Every edge in the mesh
        must be shared by exactly two faces. Boundary edges (one face)
        and singular edges (three or more faces) both fail. Most
        slicers will simply refuse a non-manifold input; the ones that
        accept it tend to interpret the unclosed shells as filled
        solids and the print comes off the bed as a brick. The check
        runs a bmesh sweep against{" "}
        <code className="text-pink-200">edge.is_manifold</code>; zero
        non-manifold edges is the only passing answer.
      </p>
      <p>
        <strong>Minimum wall thickness.</strong> 0.8mm for SLA resin,
        1.0mm for DLP, 1.6mm for FDM on a 0.4mm nozzle. The Oracle
        measures this by ray-casting inward from every face and
        recording the shortest hit. Anything below the floor fails.
        Resin walls below 0.8mm will cure under their own weight but
        snap on cleanup; FDM walls below two perimeter widths will
        print as a hollow shell that pops in the hand.
      </p>
      <p>
        <strong>Maximum overhang angle.</strong> 50&deg; from vertical
        is the bench limit for unsupported resin and 45&deg; for FDM.
        Past that the candidate needs supports, which means the
        Oracle either generates them or rejects the piece. Supports
        leave nubs; nubs leave scars; scars on a presentation piece
        mean a re-print.
      </p>
      <p>
        <strong>Drainage on hollow prints.</strong> Any internal cavity
        gets at least one drain hole of three millimetres minimum
        diameter, ideally two on opposite faces. Resin trapped inside a
        hollow cavity cures into a sealed weight that warps the shell
        as it shrinks. The Oracle traces the genome for enclosed voids
        and either drills the drain or fails the candidate.
      </p>
      <p>
        <strong>Self-intersection.</strong> The breeder&rsquo;s Boolean
        unions occasionally produce faces that pass through each
        other. The slicer reads the intersection as a phase boundary
        and either crashes or produces a chunk of geometry that
        wasn&rsquo;t in the design. The Oracle runs a bmesh
        intersection scan and rejects on any hit.
      </p>
      <p>
        <strong>Thin features.</strong> Single-voxel spikes, hair-thin
        bridges, anything narrower than the printer&rsquo;s lateral
        resolution. These are geometrically real and printer-invisible.
        They show up beautifully in the WebGL preview and disappear
        from the cured part.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">What gets rejected and why</h2>
      <p>
        The most common rejection is the single-vertex spike. A
        genome that scores high on noise amplitude can grow a spike
        that&rsquo;s geometrically real &mdash; the vertex exists, the
        adjacent faces exist, the normals are consistent &mdash; but
        the spike is half the width of a printer pixel. The Oracle
        catches it by checking each vertex&rsquo;s neighbourhood
        against the printer&rsquo;s lateral resolution. The screen
        shows a delicate filigree; the cured print shows a smooth
        bulge where the spike used to be. Every spike that fails this
        check would have come off the platen as a lie.
      </p>
      <p>
        The second is the undrainable cavity. The Turing
        reaction-diffusion family is particularly bad for this. A
        well-converged Turing genome looks like a coral; the
        cross-section reveals pockets the resin can&rsquo;t escape
        from. The Oracle floods the bounding box from the outside and
        tags any region the flood doesn&rsquo;t reach. A candidate
        with more than five per cent unreachable volume fails. The
        rejection rate on Turing genomes runs around forty per cent
        for this reason alone, and the bench has lost some genuinely
        beautiful candidates this way. None of them would have
        survived the wash station.
      </p>
      <p>
        The third is the overhang-cluster. Whispering-gallery-mode
        rings tend to produce stacked horizontal discs connected by
        thin vertical struts. The discs themselves are fine; the
        underside of each disc is a flat overhang at ninety degrees
        from vertical, which is forty past the bench limit. Without
        supports the discs curl on the way up. With supports the
        underside is a forest of scars. The Oracle rejects the genome
        and the breeder mutates the strut geometry on the next pass
        &mdash; usually within two generations the family has learned
        to taper its discs.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The cost of skipping the oracle</h2>
      <p>
        Early in the breeder&rsquo;s development I skipped this step.
        The genome scored high, the render was gorgeous, I sent the
        STL to the printer and went to bed. Eight hours later the
        bench had a hundred millilitres of half-cured resin pooled in
        a closed cavity, a print that had delaminated halfway up, and
        a vat that needed full strain and clean because cured shards
        had floated free of the FEP film and were now riding the
        z-axis on the next print I&rsquo;d queued behind it.
      </p>
      <p>
        The numbers add up fast. A failed SLA print on the Saturn 4
        Ultra is about three hours of cure time, eighty millilitres of
        resin at roughly eighty pence a millilitre, an hour of
        cleanup, and a half-day vat decontamination if the failure
        shed particles. Call it sixty pounds and a working morning,
        per failed print. The breeder produces twenty-five candidates a
        generation. If even ten per cent of unvalidated genomes fail
        on the printer &mdash; and the rate without the Oracle was
        closer to forty &mdash; the bench eats a week of working time
        every time the breeder finishes a session. The Oracle pays
        for itself before the first print of a Monday.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Why we&rsquo;d rather kill a beauty</h2>
      <p>
        Here is the rule the bench holds: a beautiful candidate that
        fails the Oracle is killed, not patched. Patching a failed
        genome &mdash; thickening a wall, drilling a drain after the
        fact, smoothing a spike &mdash; produces a print that exists
        but lies about what the breeder made. The lineage record in
        the database then describes a thing that didn&rsquo;t print
        and a print that wasn&rsquo;t bred. Editioned work depends on
        the lineage being honest. The piece on the shelf has to be
        the thing the genome describes.
      </p>
      <p>
        There is also the long tail to think about. The Etsy review
        that never came back, two years after a sale, because the
        piece cracked on a coffee table six months in. The collector
        who emails to ask why the underside of their pendant has gone
        slightly milky &mdash; uncured resin sweating out of a cavity
        that should have had a drain. The shame of having shipped a
        beautiful thing that wasn&rsquo;t actually a thing. Better to
        lose the candidate at the Oracle than to lose the collector
        in the third year.
      </p>

      <p>
        The Oracle is non-negotiable. Every genome goes through it;
        no genome bypasses it. The cousin reading is{" "}
        <Link href="/articles/the-sieve-and-the-oracle" className={ext}>
          the Sieve and the Oracle
        </Link>{" "}
        on the print side &mdash; the mechanical and considered
        gates an edition crosses on its way off the bench. The
        upstream piece is{" "}
        <Link href="/articles/how-the-studio-breeds-sculptures" className={ext}>
          how the studio breeds sculptures
        </Link>
        , where the genomes the Oracle filters come from. The Oracle
        sits between them and refuses to be moved.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "the-printability-oracle",
  title: "The Printability Oracle — Why Beautiful Designs Fail at the Slicer",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Every Monday the bench rejects sixty per cent of last week's candidates. The Oracle is the validator that sits between the evolution engine and the printer, killing beautiful genomes for non-manifold edges, thin walls, undrainable cavities, and single-voxel spikes. An essay on why that killing is non-negotiable.",
  Body: ThePrintabilityOracle,
  related: [
    {
      href: "/articles/how-the-studio-breeds-sculptures",
      label: "How the Studio Breeds Sculptures",
      note: "Upstream of the Oracle — where the genomes come from.",
    },
    {
      href: "/articles/the-sieve-and-the-oracle",
      label: "The Sieve and the Oracle",
      note: "The print-side cousin: two gates an edition crosses on the way off the bench.",
    },
    {
      href: "/articles/nine-seconds-prompt-to-printable",
      label: "Nine Seconds, Prompt to Printable",
      note: "The wider pipeline this validation step sits inside.",
    },
    {
      href: "/articles/the-bench",
      label: "The Bench",
      note: "The working surface the Oracle runs against.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Manifold",
      label: "Manifold — Wikipedia",
      note: "The mathematical definition the manifold-integrity check rests on.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/addons/mesh/3d_print_toolbox.html",
      label: "Blender 3D Print Toolbox — manual",
      note: "The reference implementation of the checks the Oracle automates.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Stereolithography",
      label: "Stereolithography — Wikipedia",
      note: "Background on SLA resin printing and why the wall-thickness floors are where they are.",
    },
  ],
};
