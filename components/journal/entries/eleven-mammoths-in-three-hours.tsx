import Link from "next/link";

import type { Entry } from "lib/writing";

export default function ElevenMammothsInThreeHours() {
  return (
    <>
      <p>
        I sat down on a Wednesday with one job: shrink the files until
        they could be read in a sitting. The studio has had a soft cap
        for a while &mdash; three hundred lines per behavioural code
        file, data tables exempt &mdash; and the bench had quietly
        accumulated eleven offenders, the way a workshop accumulates
        offcuts behind the lathe. None of them were broken. They were
        just too long to think in. When I open a seven-hundred-line
        file I do not read it; I grep it. When I open a two-hundred-
        line file I read it. The cap is not a style guide. It is a
        forcing function for the moment a single file stops being a
        thing and starts being a small civilisation.<sup>1</sup>
      </p>
      <p>
        The biggest offender was the{" "}
        <Link
          href="/codex/marching-cubes"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          marching-cubes
        </Link>{" "}
        maths module. Seven hundred and twenty-three lines of voxel
        plumbing, cube indexing, edge interpolation, gradient sampling,
        the famous two-hundred-and-fifty-six-entry triangle lookup
        table copied verbatim from the canonical reference. The split
        came out in three pieces: a 249-line algorithm core that walks
        the grid and stitches triangles, a 117-line samplers file for
        the density-and-gradient helpers, and a 329-line lookup-table
        file that is pure data and therefore exempt from the cap. Three
        files, three jobs, none of them over the line. The behaviour
        was identical before and after &mdash; the type-checker
        confirmed it, and the test scene rendered the same{" "}
        <Link
          href="/codex/gyroid-surfaces"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          gyroid
        </Link>{" "}
        cell to the same vertex count.<sup>2</sup>
      </p>
      <p>
        The pattern repeated, with small variations, across the other
        ten. The 552-line print-bar component became an orchestrator,
        a pure pricing pipeline, and three presentational sub-panels
        for size, paper, and quantity &mdash; the orchestrator
        holds state, the pipeline holds maths, the sub-panels hold
        markup, and none of them know more than they need to about
        the others. A 489-line capture-form became an orchestrator
        plus a side-effects file for the upload calls. A 308-line
        SHARP-video commerce capability barely needed splitting at
        all; it was the smallest offender and just wanted its
        thumbnail-generation helpers in their own room. The shape of
        the split was always the same question: what is the role this
        file is trying to play, and is it secretly playing two?
      </p>
      <p>
        I type-checked after every split and committed each round
        separately. Eleven rounds, eleven commits, three hours and a
        bit. The reason for the separate commits is not ceremony &mdash;
        it is that a refactor that ages badly should be revertible in
        one move, not in a tangle. If the print-bar split turns out
        next month to have been the wrong partition, I want to undo
        that one without dragging the marching-cubes work back into
        the lake. The cap and the commit discipline are the same
        instinct in two forms: keep the unit of change small enough
        that future-me can hold it in one hand.
      </p>
      <p>
        The result is a tree that is wider and shallower than it was on
        Tuesday night. More files, smaller files, clearer names. The
        bundle did not get bigger; the import graph did, but the import
        graph is cheap and human attention is not. Nothing on the
        front of the site looks different. The print page still
        renders, the rig simulator still walks through angle, the
        commerce strip still costs what it should. I am not going to
        pretend this is a victory anyone outside the studio will ever
        notice. It is a Wednesday-afternoon housekeeping pass that
        bought back the next six months of being able to find things.
      </p>
      <p>
        Next on the bench is filling out the capabilities registry
        &mdash; the small piece of plumbing that lets the site
        describe what each commerce capability is, what it takes in,
        what it puts out, and what it costs. Different work, same cap.
        Now I am going to make a cup of tea.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Three hundred lines is the studio&rsquo;s own house number,
          not a universal law. The figure is empirical: about as much
          code as I can hold in working memory while debugging at the
          end of a long day. Data tables, fixture files, and generated
          types are exempt &mdash; they are reference, not behaviour.
        </li>
        <li>
          The lookup table is the canonical one from the original
          marching-cubes paper (Lorensen and Cline, 1987). It is data,
          not code, and lives in a file by itself so that the
          algorithm core never has to scroll past it. The samplers
          file is the only piece that ever needs to change when the
          density function changes.
        </li>
      </ol>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "eleven-mammoths-in-three-hours",
    title: "Eleven mammoths in three hours",
    date: "2026-05-14",
    kind: "journal",
    excerpt:
      "A Wednesday refactor: eleven oversized code files split into smaller, single-purpose siblings under a 300-line cap. Same behaviour, smaller rooms.",
    Body: ElevenMammothsInThreeHours,
    related: [
      {
        href: "/codex/marching-cubes",
        label: "Marching Cubes",
        note: "The algorithm whose 723-line module was the biggest of the eleven.",
      },
      {
        href: "/codex/gyroid-surfaces",
        label: "Gyroid Surfaces",
        note: "The test scene used to confirm the marching-cubes split was behaviour-preserving.",
      },
      {
        href: "/journal/the-bench-in-https",
        label: "The Bench in HTTPS",
        note: "Another piece of quiet studio infrastructure, in the same workshop register.",
      },
    ],
  };
