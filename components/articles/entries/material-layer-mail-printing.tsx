import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function MaterialLayerMailPrinting() {
  return (
    <>
      <p>
        I print mail. Not chain mail you forge link by link with two
        pairs of pliers and a winter; mail the printer vomits out one
        layer at a time, joints pre-assembled, off the bed already
        articulated. You pull a metre of dragon scale off the belt at
        midnight and it drapes over your forearm like it always knew
        how to. The joints were never separate. The slicer never knew
        they were joints. The printer just put plastic in the
        right places for the right number of layers and walked away,
        and what came out is a piece of textile-mechanical fabric that
        moves like cloth and rings like a wind chime when you shake it.
      </p>

      <p>
        That is what this piece is about. The discipline goes by a
        handful of names &mdash; print-in-place mail, material-layer
        articulation, 3D-printed scale-mail, dragon-mail, flexi-print
        fabric &mdash; and the studio has done all of it. The article
        below is the field guide I wish I had owned when the{" "}
        <a
          href="https://www.creality.com/products/creality-cr-30-3d-printer"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          CR-30{arrow}
        </a>{" "}
        first arrived in the corner of the workshop with no
        instructions and a roll of belt that smelt of factory grease.
        Five years on, the printer has paid for itself many times over
        in{" "}
        <Link href="/articles/belt-printed-wall-reliefs" className={ext}>
          wall-relief commissions
        </Link>{" "}
        alone, and the bench has settled into a small grammar of
        patterns I trust enough to put a name on.
      </p>

      <p>
        <strong>What material-layer mail printing is, in one sentence.</strong>{" "}
        You design a flat sheet whose geometry already encodes the
        joints &mdash; pockets, hinges, interlocking links, overlapping
        scales &mdash; and the printer lays it down one layer at a
        time, with the joint clearances baked into the model. When the
        bed cools and you peel the part off, the joints are already
        there. Nothing is assembled. Nothing is glued. The mesh comes
        off articulated.
      </p>

      <p>
        The mathematical heart of the trick is gap tolerance. At a
        0.16&nbsp;mm layer height on a 0.4&nbsp;mm nozzle, a hinge gap
        of 0.32&nbsp;mm reliably produces a joint that moves freely
        the moment you flex it. Tighter than that and the joint fuses;
        looser and the part rattles. The sweet spot is a single layer
        line of clearance, oversized by half. Different printers,
        different filaments, different humidity will shift the number
        by 0.05&nbsp;mm in either direction. Calibrate once with a
        flexi-test print and write the number on the side of the
        machine. I did. It is still there.
      </p>

      <p>
        <strong>The five families.</strong> The discipline sorts into
        five geometries, and most of what the studio prints lives in
        one of them.
      </p>

      <p>
        <em>Square scale-mail.</em> The simplest. Squares of plate,
        each with a small hole at top and bottom, linked by a printed
        clip that slides through both holes and locks. Reads as armour
        when printed in slate PETG, as upholstery when printed in
        matte PLA the colour of bone. The square geometry gives you a
        90&deg; weave, which is structurally honest but visually
        boring; the pattern wants depth modulation or a Voronoi
        perturbation to keep the eye moving across it.
      </p>

      <p>
        <em>Hex scale-mail.</em> The studio&rsquo;s signature pattern,
        the one most of the wall-relief commissions get specified in.
        Hexagonal plates, three-way symmetry, six neighbours per
        plate. Reads as honeycomb under raking light and as feathered
        scale at midday. The hex weave is the densest of the five
        &mdash; you can hide a kilogram of filament in a square metre
        of it &mdash; and it drapes more softly than the square weave
        because each plate has more degrees of rotational freedom.
      </p>

      <p>
        <em>Chain-mail / European 4-in-1.</em> Interlocked oval links,
        printed in place. The classic medieval pattern, four links
        through every one, alternating direction. The studio uses this
        for wearables because it has the right ring-sound when it
        moves; tap a 4-in-1 panel and it answers like a metal coif.
        Printed in PETG it can take a few drops, which the rigid
        plates of scale-mail cannot. The geometry is fiddly to model
        cleanly &mdash; the link cross-sections want to be true ovals
        rather than rounded rectangles, or the printer skips a corner
        and the link rattles &mdash; but it is the family that most
        rewards the patience.
      </p>

      <p>
        <em>Dragon-mail.</em> Overlapping rounded teardrops, offset
        row to row, each scale hinged through a pocket in the row
        above. Visually the showiest of the five. The belt sloughs
        these out at any length you can hand-feed filament to. A
        bracelet is twenty minutes; a 1.6&nbsp;metre Game-of-Thrones
        wall hanging is two days. Print in iridescent PETG and the
        relief catches the light differently at every angle &mdash;
        it is the closest the printer comes to making something that
        looks alive. The studio&rsquo;s most-asked-for commission and
        the one I had to engineer a custom hanging rail for because
        nothing on the shelf would let a textile that heavy drape
        without sagging.
      </p>

      <p>
        <em>Origami crease patterns.</em> The compliant-mechanism end
        of the discipline. Instead of plates linked by joints, you
        print a single flat sheet with thinned-down crease lines
        engineered to fold along specific axes. Miura folds for
        deployable panels; Kresling cylinders for bistable structures;
        waterbomb tessellations for spherical shells you can flatten
        for transport. The science is well-mapped &mdash; Bristol has
        a serious{" "}
        <a
          href="http://www.markschenk.com/research/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          origami-engineering research line{arrow}
        </a>{" "}
        on it &mdash; and the studio uses it for spatial dividers and
        lampshades. Print flat, score with heat, fold once, lock the
        pattern; the piece holds.
      </p>

      <p>
        <strong>Why the belt printer matters.</strong> A flat-bed FDM
        printer caps your panel at the size of the bed, which on most
        consumer machines is 250&nbsp;mm by 250&nbsp;mm. That gives
        you a coaster of mail, or a placemat at best. The CR-30 in
        the corner is angled at 45&deg; and the bed is a conveyor
        belt; as each layer finishes, the belt advances a tooth, and
        the part begins to slide diagonally out of the print volume.
        The Z dimension is, in the marketing slogan, infinite &mdash;
        what it means in practice is that you can print 2&nbsp;metres
        of mail in one continuous strip overnight. The longest single
        run on my machine was 2.4&nbsp;metres of hex scale, and the
        only reason it stopped was that the spool ran out.
      </p>

      <p>
        The diagonal layer line is the second gift. On a flat-bed
        printer, the layer lines stack vertically and your hinge
        joints have to be designed around the gravity axis. On the
        belt, the layer lines run at 45&deg;, which means the hinge
        clearances are gravity-neutral &mdash; the joints come off
        the bed with no support material, no failed bridges, no
        stringing across the gap. The CR-30 prints chain-mail at its
        native angle and the joints just work. It is the cleanest
        argument for the belt format I can give.
      </p>

      <p>
        <strong>Honest kit.</strong> The studio runs the{" "}
        <a
          href="https://www.creality.com/products/creality-cr-30-3d-printer"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Creality CR-30{arrow}
        </a>{" "}
        for the long mail strips. The{" "}
        <a
          href="https://ifactory3d.com/en/one-pro-3d-printer/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          iFactory3D One Pro{arrow}
        </a>{" "}
        is the German-engineered cousin and the machine I would buy
        if I were starting over today; it has a better-tuned belt
        tensioner and the firmware does not lie about the build
        volume the way the CR-30&rsquo;s does. Filament defaults are
        matte PLA for indoor wall work, PETG for anything wearable or
        wet, TPU for the rare commission that has to drape like
        actual cloth. PLA at 200&deg;C, PETG at 235&deg;C, TPU at
        225&deg;C with the retraction turned off. Infill is irrelevant
        for mail &mdash; each plate is two perimeters deep and the
        infill never fires &mdash; which means the print times stay
        sane and the spool stretches. Layer height 0.16&nbsp;mm for
        production, 0.12&nbsp;mm for a sample to show a client.
      </p>

      <p>
        <strong>The three workflows.</strong> The studio has three
        named outputs from this line, and the rest of the work is
        variations on them.
      </p>

      <p>
        <em>Hex-scale wall art.</em> The signature commission. A wall,
        a length, a colour, a seed for the depth-modulation noise
        field. The OpenSCAD file generates an STL, the belt printer
        runs unsupervised for thirty hours, and the result is a
        continuous strip of textured hex relief that clips into a slim
        aluminium top rail. The{" "}
        <Link
          href="/articles/belt-printed-wall-reliefs"
          className={ext}
        >
          belt-relief article
        </Link>{" "}
        covers the economics; this article covers the geometry.
      </p>

      <p>
        <em>Dragon-scale bracelet wearables.</em> Twenty-minute prints,
        sized to the wrist, in PETG so they survive being put on and
        taken off without snapping a hinge. The geometry is the same
        family as the wall pieces, scaled down and reshaped into a
        closed loop. The studio sells these alongside the{" "}
        <Link
          href="/articles/jewellery-the-same-trace-wearable"
          className={ext}
        >
          waveguide pendant line
        </Link>{" "}
        as the entry-level wearable. They are also the easiest thing
        for someone with a small FDM printer at home to try, which is
        why the{" "}
        <Link
          href="/tutorials/tutorial-dragon-scale-wall-relief"
          className={ext}
        >
          companion tutorial
        </Link>{" "}
        scales the same workflow up to a wall panel.
      </p>

      <p>
        <em>Origami-fold spatial dividers.</em> Print a flat panel of
        crease-engineered PETG, score it with a heat gun along the
        fold lines, collapse the Miura pattern into a free-standing
        screen. The screen lives by my desk; it folds flat to the wall
        when I am photographing and unfolds to break the room when I
        am working. The crease pattern is a 12&times;8 Miura tile and
        the panel weighs less than a kilogram. The same trick scales
        to a lampshade if you embed an LED at the apex.
      </p>

      <p>
        <strong>Where this sits in the studio.</strong> The mail line
        is the parametric, scalable cousin of the{" "}
        <Link
          href="/articles/why-i-build-my-own-rigs"
          className={ext}
        >
          rig-building practice
        </Link>{" "}
        and the{" "}
        <Link href="/articles/the-bench" className={ext}>
          bench
        </Link>{" "}
        it sits on. The figurative work &mdash; the photograph-to-
        object pipeline taught in the{" "}
        <Link
          href="/tutorials/from-photograph-to-object"
          className={ext}
        >
          tutorial
        </Link>
        , the resin sculptures that come out the other end of the{" "}
        <Link
          href="/articles/nine-seconds-prompt-to-printable"
          className={ext}
        >
          nine-seconds pipeline
        </Link>{" "}
        &mdash; is the part of the practice that pays attention to
        gesture and trace. The mail line is the part that pays
        attention to rule and repetition. Two registers, one workshop,
        same person. The belt printer pays the rent so the resin
        printer can do the slower thing. That is how most of the
        studios I respect actually work; this one is no exception.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "material-layer-mail-printing",
  title: "Material-Layer Mail Printing — Scales, Chain, Dragon, Origami",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "The discipline of printing articulated meshes one layer at a time so the joints come off the bed pre-assembled. Five families — square scale, hex scale, European 4-in-1 chain, dragon-mail, origami crease patterns. The CR-30 in the corner, the belt at 45 degrees, two metres of fabric per overnight run.",
  Body: MaterialLayerMailPrinting,
  related: [
    {
      href: "/articles/belt-printed-wall-reliefs",
      label: "Belt-Printed Wall Reliefs",
      note: "The architectural-finish line this article is the geometry primer for.",
    },
    {
      href: "/articles/nine-seconds-prompt-to-printable",
      label: "Nine Seconds from Prompt to Printable",
      note: "The image-to-STL pipeline that feeds the belt-printer slicer.",
    },
    {
      href: "/articles/why-i-build-my-own-rigs",
      label: "Why I Build My Own Rigs",
      note: "The same hands-on-the-bench register, on the rig side.",
    },
    {
      href: "/tutorials/from-photograph-to-object",
      label: "Tutorial — From Photograph to 3D Object",
      note: "The figurative cousin to this parametric line.",
    },
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Tutorial — Dragon-Scale Wall Relief",
      note: "Hands-on workflow for the hex-and-dragon pattern at panel scale.",
    },
    {
      href: "/articles/the-bench",
      label: "The Bench",
      note: "Where the belt printer sits in the larger studio stack.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.creality.com/products/creality-cr-30-3d-printer",
      label: "Creality CR-30 3DPrintMill — official product page",
      note: "The studio's belt printer. 200 × 170 mm XY, infinite Z, 45° belt.",
    },
    {
      href: "https://ifactory3d.com/en/one-pro-3d-printer/",
      label: "iFactory3D One Pro — official product page",
      note: "The German-engineered belt printer the studio would buy today if starting over.",
    },
    {
      href: "https://www.printables.com/model/851001-dragon-scale-fabric",
      label: "Dragon Scale Fabric (ftobler) — Printables",
      note: "The widely-printed open dragon-scale STL the community has standardised on.",
    },
    {
      href: "https://all3dp.com/2/3d-printed-chainmail-best-models/",
      label: "All3DP — 3D Printed Chainmail roundup",
      note: "Useful overview of community chainmail and scale-mail STLs.",
    },
    {
      href: "http://www.markschenk.com/research/",
      label: "Mark Schenk — origami engineering research",
      note: "Bristol-based engineering research on folded shell structures and rigid origami.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Miura_fold",
      label: "Miura fold — Wikipedia",
      note: "The crease pattern the studio uses for spatial dividers and lampshades.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
      label: "Persistence of vision — Wikipedia",
      note: "Sibling principle from the POV-rig side of the studio; included as a cross-discipline reference.",
    },
  ],
};
