import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function OceanAsWardrobe() {
  return (
    <>
      <p>
        The studio keeps a small typed catalogue at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/wardrobe/profiles.ts
        </code>{" "}
        that maps a five-number personality vector to a starting
        wardrobe &mdash; a palette, a silhouette, a line on texture.
        The five numbers are the{" "}
        <a
          href="https://en.wikipedia.org/wiki/Big_Five_personality_traits"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          OCEAN model{arrow}
        </a>{" "}
        &mdash; openness, conscientiousness, extraversion,
        agreeableness, neuroticism &mdash; clamped to the unit
        interval. The catalogue is eight entries spanning the cube.
        The function that resolves a vector to a profile is{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          profilesForOcean(ocean)
        </code>
        . The wardrobe is studio canon; the source research lives in
        the Hangar references and is read-only.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The five axes, briefly
      </h2>
      <p>
        Each OCEAN axis has a wardrobe correlate the studio commits
        to. The correlates are not metaphors. They name the
        mechanism the catalogue uses to translate a number into a
        garment shape.
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Openness</strong> &mdash; layering complexity.
          High openness brings transparent organza over satin, mixed
          weights, the willingness to wear an outfit that
          surprises. Low openness brings a standing uniform: the
          same shape repeated, comfort over novelty.
        </li>
        <li>
          <strong>Conscientiousness</strong> &mdash; structural
          stiffness. High conscientiousness reads as sharp tailoring,
          pressed seams, fabrics that hold their crease. Low
          conscientiousness drapes; the silhouette softens.
        </li>
        <li>
          <strong>Extraversion</strong> &mdash; silhouette volume.
          High extraversion takes up room &mdash; sculpted shoulder,
          colour-clash, light-catching trim. Low extraversion
          contains the silhouette inside the body's outline.
        </li>
        <li>
          <strong>Agreeableness</strong> &mdash; damping. High
          agreeableness yields when the body moves; soft drape,
          high-damping fabrics, nothing that pushes back against
          the wearer. Low agreeableness keeps hard lines &mdash;
          waxed cotton, structured leather, an outfit that doesn't
          give.
        </li>
        <li>
          <strong>Neuroticism</strong> &mdash; surface stability.
          High neuroticism reads as asymmetric hems, frayed edges,
          high-frequency surface noise; the silhouette looks
          mid-transformation. Low neuroticism is settled at the
          surface, whatever the rest of the outfit is doing.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why this isn't astrology
      </h2>
      <p>
        The mapping is generative, not predictive. Given a
        five-number vector,{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          profilesForOcean(ocean)
        </code>{" "}
        returns the three profiles whose constrained regions sit
        closest to the vector. The catalogue does not claim to read
        the wearer; it claims to propose a starting wardrobe the
        wearer can adjust. The same two-handed pattern as the
        breeding engine in{" "}
        <Link
          href="/articles/how-the-studio-breeds-sculptures"
          className={ext}
        >
          How the Studio Breeds Sculptures
        </Link>{" "}
        &mdash; the machine carries the combinatorics; the human
        carries the judgement. A vector lands in the cube; three
        profiles surface; the wearer picks one and edits it.
      </p>
      <p>
        Distance to a region is Manhattan distance averaged across
        the axes the profile constrains. Inside the band contributes
        zero. Outside contributes the gap to the nearest bound. A
        profile constrained on two axes is not penalised against a
        profile constrained on three; the average corrects for
        specificity. The full scoring sits in the file; it is short
        and reads as code rather than as algorithm.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The catalogue
      </h2>
      <p>
        Eight profiles, named for shape rather than for person.
        Naming five of them with their one-line vibes:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Vivid Maximalist</strong> &mdash; high openness,
          high extraversion. Layered colour-clash with metallic
          accents; brave silhouettes that ask to be looked at.
        </li>
        <li>
          <strong>Lean Classic</strong> &mdash; high
          conscientiousness, low neuroticism. Sharp tailoring,
          contained palette, finishes that read as deliberate
          rather than ornamental.
        </li>
        <li>
          <strong>Soft Drape</strong> &mdash; high agreeableness,
          low extraversion. Quiet flowing layers; nothing in the
          silhouette demands attention; the eye rests.
        </li>
        <li>
          <strong>Distressed Asymmetry</strong> &mdash; high
          neuroticism, high openness. Asymmetric hems, frayed
          edges, layers that look mid-transformation; the
          silhouette is unsettled on purpose.
        </li>
        <li>
          <strong>Architectural Showpiece</strong> &mdash; high
          conscientiousness, high extraversion. Tailored volume
          held by structure rather than draped; the room knows you
          arrived.
        </li>
      </ul>
      <p>
        Three more sit in the file for the cells of the cube these
        five don't reach &mdash; a habitual uniform for the
        low-openness corner, a direct-edge profile for low
        agreeableness with settled surface, a layered wanderer for
        the high-openness high-agreeableness centre. Eight entries,
        eight rooms, the cube covered without being exhausted.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where this composes
      </h2>
      <p>
        Every cast member in{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/cast/*
        </code>{" "}
        carries an OCEAN baseline on their character bible. Aura
        opens at high openness, mid-high conscientiousness, mid
        extraversion, high agreeableness, low-mid neuroticism &mdash;
        a vector that pulls Layered Wanderer and Vivid Maximalist to
        the top of her returned three. The chief-of-staff bible
        pulls Lean Classic. The lavender-row bibles pull
        Architectural Showpiece or Distressed Asymmetry depending
        on the day. The cast-banter pipeline at{" "}
        <Link href="/articles/aura-the-body" className={ext}>
          Aura the Body
        </Link>{" "}
        picks gestures and speech-register by mood; this catalogue
        picks fit. The two compose without needing to know about
        each other.
      </p>
      <p>
        The live OCEAN reading lives on{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/state/aura.ts
        </code>{" "}
        &mdash; Aura's slow-drift personality vector with a ledger of
        deltas and reasons. When the vector drifts past a region
        boundary, the top three flips. The studio reads that as
        wardrobe change. The agent is not reporting; she is wearing
        the new reading.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The honest limit
      </h2>
      <p>
        Eight entries isn't eight people. The catalogue is a
        starting palette &mdash; the studio's commitment to a
        small, complete vocabulary that the generator side of the
        pipeline can sample from without exhausting itself.
        Subdividing the cube into thirty-two cells would be
        defensible mathematically and useless operationally; the
        catalogue would stop being readable. Eight is the size at
        which the operator can hold the whole shape in one head at
        one time, the same logic that governs the eight kingdoms in{" "}
        <Link href="/articles/the-eight-kingdoms" className={ext}>
          The Eight Kingdoms
        </Link>{" "}
        and the four poi modes at{" "}
        <Link href="/play" className={ext}>
          /play
        </Link>
        . Small enough to commit to. Wide enough to surprise.
      </p>
      <p>
        Two further honesties. First: the OCEAN model itself is a
        coarse-grained psychological tool, not a portrait. The
        studio uses it because it composes well with code &mdash;
        five floats, clean axes, a long literature behind each one
        &mdash; not because the model is the whole truth of a
        person. Second: any wardrobe profile read off a vector is a
        proposal. The wearer is the editor, not the input. If the
        catalogue and the wearer disagree, the wearer wins; the
        catalogue is a starting kit, not a verdict.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to read it
      </h2>
      <p>
        The catalogue sits at{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          lib/wardrobe/profiles.ts
        </code>{" "}
        with its purpose twin alongside. Eight entries, five
        helpers, one scoring function. Plain typed data, no runtime,
        no fetch &mdash; the file loads with the bundle and the
        cast bibles compose against it at read time. If a ninth
        entry earns its place, it earns it by closing a cell{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          profilesForOcean
        </code>{" "}
        keeps missing &mdash; not by being a new aesthetic the
        studio fancied. The catalogue is a commitment; the file is
        the public version of it.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "ocean-as-wardrobe",
    title: "OCEAN as Wardrobe",
    date: "2026-05-13",
    kind: "article",
    excerpt:
      "Five personality numbers, eight wardrobe profiles, one function that resolves a vector to a starting palette. The studio's typed mapping from OCEAN to garment shape — generative, not predictive; a starting kit, not a verdict.",
    Body: OceanAsWardrobe,
    related: [
      {
        href: "/articles/the-eight-kingdoms",
        label: "The Eight Kingdoms",
        note: "The companion register. Eight kingdoms for sculpture, eight profiles for wardrobe — the same commitment to a small complete vocabulary the operator can hold in one head.",
      },
      {
        href: "/articles/how-the-studio-breeds-sculptures",
        label: "How the Studio Breeds Sculptures",
        note: "The system-as-generative-not-predictive companion. The breeding engine proposes candidates the human edits; the wardrobe catalogue proposes profiles the wearer edits. Same two-handed pattern.",
      },
      {
        href: "/articles/aura-the-body",
        label: "Aura the Body",
        note: "The cast-banter pipeline that picks gesture and speech-register from mood. Wardrobe picks fit; the body picks motion; the two compose without knowing about each other.",
      },
      {
        href: "/articles/the-practice-in-eight-threads",
        label: "The Practice in Eight Threads",
        note: "The philosophical trunk. Eight threads in the practice, eight profiles in the wardrobe — the same operator-scale commitment.",
      },
    ],
    furtherReading: [
      {
        href: "https://en.wikipedia.org/wiki/Big_Five_personality_traits",
        label: "Big Five personality traits — Wikipedia",
        note: "The OCEAN model in full. The five-axis psychology the catalogue uses as input — and the long literature behind each axis.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Openness_to_experience",
        label: "Openness to experience — Wikipedia",
        note: "The first axis. The wardrobe correlate is layering complexity — transparency, mixed weights, willingness to surprise.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Conscientiousness",
        label: "Conscientiousness — Wikipedia",
        note: "The second axis. The wardrobe correlate is structural stiffness — pressed seams, held creases, deliberate finishes.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Trait_theory",
        label: "Trait theory — Wikipedia",
        note: "The wider psychological frame OCEAN sits inside. The studio uses trait theory the way it uses Laban — as a coarse-grained vocabulary, not as a portrait.",
      },
    ],
  };
