import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TutorialDragonScaleWallRelief() {
  return (
    <>
      <p>
        Some objects ought to glitter on the wall the way a sleeping
        dragon glitters in the cave it has not left for an age &mdash;
        not by accident, but because the geometry has been arranged so
        that every facet is waiting for the lamp to pass over it. A
        belt-printed dragon-scale panel does this on purpose. It is
        not a sculpture and not quite a textile; it is a piece of
        modulated surface that catches the room&rsquo;s light and
        gives it back at a different angle. The studio has been
        printing them for five years and selling them for four, and
        this tutorial is the version of the workflow I would teach
        someone who walked into the workshop on a Saturday with their
        own printer at home and a wall in mind.
      </p>

      <p>
        The goal: a 600&nbsp;&times;&nbsp;300&nbsp;mm wall panel of
        overlapping dragon scale, printed in continuous strips on a
        belt printer or in tiled segments on a flat-bed FDM machine,
        clipped into a slim aluminium top rail, hung so it drapes
        slightly against the wall and catches a side light. The
        constraints: a single weekend of bench time including print
        time; one 1&nbsp;kg spool of matte PLA or PETG; no glue, no
        paint, no post-finish beyond a soft brush and a deburring
        tool. If you have done the workflow once already, skip the
        opener and jump to the steps. If you have not, the prose
        between the steps is where the hand-feel lives.
      </p>

      <p>
        The companion article{" "}
        <Link
          href="/articles/material-layer-mail-printing"
          className={ext}
        >
          Material-Layer Mail Printing
        </Link>{" "}
        sets out the five families of mail this tutorial draws from;
        the{" "}
        <Link
          href="/articles/belt-printed-wall-reliefs"
          className={ext}
        >
          Belt-Printed Wall Reliefs
        </Link>{" "}
        article covers the architectural register and the economics.
        Read either as background if you want context, or push on if
        you came here to print.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Materials</h2>

      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>1&nbsp;kg of matte PLA or PETG</strong> &mdash; the
          studio default is matte black PLA for indoor work, matte
          slate PETG for anywhere humid. Matte hides layer lines under
          ordinary room light and reads as textile rather than as a
          print. Avoid glossy filaments unless you want the panel to
          look like plastic; it will.
        </li>
        <li>
          <strong>A slim aluminium top rail</strong> &mdash; 600&nbsp;mm
          long, U-channel profile around 15&nbsp;&times;&nbsp;10&nbsp;mm,
          drilled for two wall anchors. Most picture-framing suppliers
          carry these; the studio buys them from a local sign-makers&rsquo;
          merchant by the metre.
        </li>
        <li>
          <strong>Two wall anchors</strong> appropriate to your wall
          &mdash; plasterboard fixings, masonry rawl plugs, or
          adhesive Command strips if the panel is light and the wall
          is borrowed.
        </li>
        <li>
          <strong>One STL of a dragon-scale module</strong> &mdash; the
          widely-shared{" "}
          <a
            href="https://www.printables.com/model/851001-dragon-scale-fabric"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ftobler Dragon Scale Fabric{arrow}
          </a>{" "}
          is the community standard and what most printers use the
          first time. The studio uses a parametric OpenSCAD version
          for commissions, but the open STL is the right place to
          start.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Tools</h2>

      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>A belt printer</strong> &mdash; a{" "}
          <a
            href="https://www.creality.com/products/creality-cr-30-3d-printer"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Creality CR-30{arrow}
          </a>{" "}
          or an{" "}
          <a
            href="https://ifactory3d.com/en/one-pro-3d-printer/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            iFactory3D One Pro{arrow}
          </a>{" "}
          is ideal; a flat-bed FDM printer (Prusa, Bambu, Creality
          Ender, anything with a 200&nbsp;mm bed) will work if you
          tile.
        </li>
        <li>
          <strong>A slicer that understands belt printers</strong>{" "}
          if you have one &mdash; BeltEngine, the CR-30 community
          Cura profile, or{" "}
          <a
            href="https://github.com/Ultimaker/CuraEngine"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            CuraEngine{arrow}
          </a>{" "}
          with a 45&deg; print profile loaded.
        </li>
        <li>
          <strong>A small deburring tool or scalpel</strong> &mdash;
          for the rare hinge that prints with a stringy artefact.
        </li>
        <li>
          <strong>A heat gun</strong> &mdash; for warming the panel
          after print so it relaxes flat before mounting.
        </li>
        <li>
          <strong>A soft-bristled brush</strong> &mdash; to brush
          loose plastic out of the hinges before mounting.
        </li>
        <li>
          <strong>A drill and a spirit level</strong> &mdash; for the
          top rail.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Time</h2>
      <p>
        About a weekend, end to end. The print itself is the long
        bit: 24&ndash;30 hours of unsupervised machine time on a
        single 600&nbsp;&times;&nbsp;300&nbsp;mm strip on the
        CR-30; longer if you tile on a flat-bed printer. Active
        bench time is maybe four hours across two evenings &mdash;
        setup, post-processing, hanging.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Difficulty</h2>
      <p>
        Intermediate. You should have printed a flexi-test print
        successfully before attempting this &mdash; if your printer
        has not been calibrated for print-in-place clearances, the
        hinges will fuse and you will spend an afternoon cracking
        scales apart with a scalpel. If you have not yet got an
        articulated test print off your bed, calibrate first and come
        back. The{" "}
        <Link
          href="/tutorials/your-first-long-exposure"
          className={ext}
        >
          first long exposure tutorial
        </Link>{" "}
        sits as a sibling beginner piece on the photography side; this
        one assumes a comparable level of comfort on the print side.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Steps</h2>

      <ol className="mt-6 list-decimal space-y-6 pl-6 text-chrome-300">
        <li>
          <strong>Calibrate the hinge clearance.</strong> Print a
          single scale module in your chosen filament before
          committing to the full panel. Pull it off the bed, flex
          every joint with a fingernail. The joints should move
          freely the moment they come loose; they should not require
          force. If they fuse, increase the gap in the STL or the
          slicer by 0.05&nbsp;mm and reprint. If they rattle, decrease
          by 0.05&nbsp;mm. Write the working number on the printer
          frame with a Sharpie; you will need it the next time the
          humidity changes.
          {/* IMAGE: a single scale module fresh off the bed, joint being flexed by a fingernail to check movement. */}
        </li>

        <li>
          <strong>Lay out the panel in the slicer.</strong> Open the
          dragon-scale STL in your slicer. For a 600&nbsp;&times;&nbsp;300&nbsp;mm
          panel you want a grid of around 30&nbsp;&times;&nbsp;15 modules,
          give or take, depending on scale size. Offset every other
          row by half a scale width &mdash; this is what gives the
          panel its characteristic feathered overlap. If the STL is a
          single tileable module, the slicer&rsquo;s grid tool will
          do this in two clicks. If it is a pre-tiled sheet, use the
          model the way it ships.
          {/* IMAGE: the slicer preview showing the offset grid of scales tiled to the panel size. */}
        </li>

        <li>
          <strong>Set the slicer for mail.</strong> Two perimeters,
          zero infill, no top or bottom layers beyond the scale&rsquo;s
          own thickness. Layer height 0.16&nbsp;mm (production) or
          0.12&nbsp;mm (samples). Print speed 60&nbsp;mm/s for PLA,
          40&nbsp;mm/s for PETG. Turn off the brim &mdash; a brim
          will fuse the bottom row of scales to each other. If your
          slicer wants a skirt, give it three loops a centimetre away
          from the part.
          {/* IMAGE: the slicer settings dialog with the relevant fields visible. */}
        </li>

        <li>
          <strong>Slice and queue the print.</strong> Belt printer
          users: confirm the slicer has oriented the part diagonally
          to match the 45&deg; print head. Flat-bed users: tile the
          panel into segments that fit your bed and queue them as a
          batch. Save the gcode to your SD card or send over network,
          but verify the first layer height by hand before you walk
          away &mdash; print-in-place mail is brutal about first-layer
          calibration.
          {/* IMAGE: the printer mid-first-layer with the belt or bed clearly visible. */}
        </li>

        <li>
          <strong>Run the print unsupervised.</strong> A belt printer
          will produce the strip continuously over 24&ndash;30 hours;
          a flat-bed will produce 200&nbsp;&times;&nbsp;200&nbsp;mm
          tiles you will need to join later. Check on the print at
          the first hour to confirm the bed adhesion is holding and
          the first three rows of scales are coming out clean. After
          that, leave the machine to it. The studio runs the CR-30
          overnight with a smoke detector immediately above it; you
          should too.
          {/* IMAGE: the belt printer mid-run, a strip of dragon scale visible coming off the back of the belt. */}
        </li>

        <li>
          <strong>Pull the panel off and brush it down.</strong>{" "}
          When the print finishes, lift the panel free of the bed
          (or, on the belt printer, watch the last metre slough off
          the conveyor on its own). Lay it flat on a clean surface.
          Brush with the soft-bristled brush to dislodge any loose
          plastic fragments from the hinges. Flex every fifth scale
          by hand to confirm the hinges have all freed cleanly. The
          panel should ripple under your hand like cloth.
          {/* IMAGE: the freshly-printed panel laid flat on the workbench with a hand resting on it, scales rippled. */}
        </li>

        <li>
          <strong>Heat-relax the panel.</strong> Run the heat gun at
          its lowest setting along the length of the panel from about
          200&nbsp;mm away. The PLA softens enough to lose any
          residual print stresses and the panel settles into a true
          flat shape. Do not overdo this &mdash; if the scales start
          to droop visibly, you are too close or too hot. The aim is
          to relax, not to deform.
          {/* IMAGE: the heat gun being run along the panel at a consistent distance, panel laid on a heat-resistant surface. */}
        </li>

        <li>
          <strong>Prepare the top rail.</strong> Cut the aluminium
          U-channel to length if it did not come pre-cut. Drill two
          fixing holes for wall anchors, spaced to match standard
          wall-stud spacing if your wall has studs, or simply to put
          the anchors well inboard of the rail ends. Deburr the cut
          edge with a file.
          {/* IMAGE: the rail laid on the workbench with anchors next to it, ready to mount. */}
        </li>

        <li>
          <strong>Mount the rail to the wall.</strong> Mark the wall
          with a spirit level. Drill, plug, screw the rail in. The
          rail&rsquo;s open channel should face downward &mdash; the
          panel&rsquo;s top edge slides up into this channel from
          below.
          {/* IMAGE: the rail mounted on the wall, spirit-level resting on its top edge. */}
        </li>

        <li>
          <strong>Hang the panel.</strong> Slide the top edge of the
          panel up into the rail&rsquo;s channel until it seats. The
          panel hangs from the rail under its own weight and drapes
          slightly against the wall. Step back, check the drape, and
          adjust the panel sideways inside the rail if it has hung
          off-centre. There is no bottom rail and no fixings beyond
          the top &mdash; the textile-mechanics of the mail keeps the
          panel flat against the wall.
          {/* IMAGE: the finished panel hung on the wall, side-lit so the scales catch the light. */}
        </li>

        <li>
          <strong>Light it from the side.</strong> A dragon-scale
          panel lit straight-on reads flat; lit from a 30&deg; angle
          it explodes. A small LED strip mounted along the top edge,
          aimed downward at a shallow angle, brings the relief out
          fully. A picture light works just as well. Switch the room
          lights on and off a few times and choose the angle the
          panel comes alive at.
          {/* IMAGE: the panel under two lighting conditions, side-by-side — flat light vs raking light. */}
        </li>
      </ol>

      <h2 className="mt-12 text-2xl text-chrome-100">Troubleshooting</h2>

      <p>
        <strong>Hinges fused.</strong> Your gap tolerance is too
        tight. Increase by 0.05&nbsp;mm in the model or slicer and
        reprint a single scale to confirm. Filament that has absorbed
        moisture from the air also fuses hinges &mdash; dry the spool
        in a filament dryer at 45&deg;C for four hours before the
        next attempt.
      </p>

      <p>
        <strong>Scales rattle and the panel feels loose.</strong>{" "}
        Your gap tolerance is too generous. Decrease by 0.05&nbsp;mm.
        The panel should ripple like cloth, not rattle like plastic.
      </p>

      <p>
        <strong>First layer lifts in the corners.</strong> The
        classic FDM problem. Clean the bed with isopropyl alcohol,
        re-level, and increase first-layer temperature by
        5&deg;C. On a belt printer, check the belt tension &mdash; a
        loose belt produces inconsistent first-layer adhesion.
      </p>

      <p>
        <strong>Stringing between scales.</strong> Increase
        retraction distance by 1&nbsp;mm and retraction speed by
        10&nbsp;mm/s. For PETG specifically, lower the print
        temperature by 5&deg;C; PETG strings worse when it runs
        hot.
      </p>

      <p>
        <strong>The panel curls when you take it off the bed.</strong>{" "}
        Residual print stresses. Heat-relax as in step 7, or print
        the next attempt with a slightly cooler bed (60&deg;C instead
        of 65&deg;C for PLA) so the panel cools more gradually.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Where this goes next</h2>

      <p>
        Once the basic dragon-scale panel is in your hand and on
        your wall, the variations open up quickly. Swap the scale
        STL for a hex-mail or 4-in-1 chain pattern and the same
        workflow produces a different textile. Print in TPU instead
        of PLA and the panel drapes like actual cloth; print in
        iridescent PETG and the relief shifts colour as you walk
        past. The studio&rsquo;s commission work runs on this exact
        loop with a parametric OpenSCAD module instead of an STL
        download, which lets the seed-noise depth modulation change
        per commission &mdash; same family, different rhythm.
      </p>

      <p>
        From here, the natural next reading is the{" "}
        <Link
          href="/articles/material-layer-mail-printing"
          className={ext}
        >
          mail-printing article
        </Link>{" "}
        for the geometry behind the other families, and the{" "}
        <Link
          href="/articles/belt-printed-wall-reliefs"
          className={ext}
        >
          belt-relief article
        </Link>{" "}
        for the architectural register and how the studio prices the
        finished panels.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "tutorial-dragon-scale-wall-relief",
  title: "Tutorial — Dragon-Scale Wall Relief",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "A weekend hands-on tutorial. Print a 600 × 300 mm panel of overlapping dragon scale on a belt printer (or tile it on a flat-bed FDM), heat-relax it, clip into a slim top rail, light it from the side. PLA or PETG, hinges pre-articulated off the bed, no glue.",
  Body: TutorialDragonScaleWallRelief,
  related: [
    {
      href: "/articles/material-layer-mail-printing",
      label: "Article — Material-Layer Mail Printing",
      note: "The geometry primer this tutorial is the hands-on companion to.",
    },
    {
      href: "/articles/belt-printed-wall-reliefs",
      label: "Belt-Printed Wall Reliefs",
      note: "The architectural register and the economics of the finished panels.",
    },
    {
      href: "/tutorials/your-first-long-exposure",
      label: "Tutorial — Your First Long-Exposure Light Painting",
      note: "A sibling beginner tutorial on the photography side of the studio.",
    },
    {
      href: "/articles/the-bench",
      label: "The Bench",
      note: "The wider studio stack the belt printer lives in.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.printables.com/model/851001-dragon-scale-fabric",
      label: "Dragon Scale Fabric (ftobler) — Printables",
      note: "The community-standard open STL this tutorial uses as its source model.",
    },
    {
      href: "https://www.creality.com/products/creality-cr-30-3d-printer",
      label: "Creality CR-30 3DPrintMill",
      note: "The belt printer the studio runs.",
    },
    {
      href: "https://ifactory3d.com/en/one-pro-3d-printer/",
      label: "iFactory3D One Pro",
      note: "The German-engineered belt printer alternative.",
    },
    {
      href: "https://all3dp.com/2/3d-printed-chainmail-best-models/",
      label: "All3DP — 3D Printed Chainmail roundup",
      note: "Community overview of chainmail and scale-mail STLs to try after this tutorial.",
    },
    {
      href: "https://github.com/Ultimaker/CuraEngine",
      label: "CuraEngine on GitHub",
      note: "Open-source slicer with 45° belt-printer profiles available from the community.",
    },
  ],
};
