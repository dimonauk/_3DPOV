import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function DragonScaleBody() {
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
        tool. The Test Chamber sheet below has the materials, the
        tools, the slicer setup, and the step-by-step. The prose here
        is where the hand-feel lives.
      </p>

      <p>
        The companion article{" "}
        <Link href="/articles/material-layer-mail-printing" className={ext}>
          Material-Layer Mail Printing
        </Link>{" "}
        sets out the five families of mail this tutorial draws from;
        the{" "}
        <Link href="/articles/belt-printed-wall-reliefs" className={ext}>
          Belt-Printed Wall Reliefs
        </Link>{" "}
        article covers the architectural register and the economics.
        Read either as background if you want context, or push on if
        you came here to print.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "tutorial-dragon-scale-wall-relief",
  title: "Tutorial — Dragon-Scale Wall Relief",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "A weekend hands-on tutorial. Print a 600 × 300 mm panel of overlapping dragon scale on a belt printer (or tile it on a flat-bed FDM), heat-relax it, clip into a slim top rail, light it from the side. PLA or PETG, hinges pre-articulated off the bed, no glue.",
  Body: DragonScaleBody,
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

export const entry: Entry = buildInstructable(
  {
    time: "a weekend — 24-30 h of unsupervised print, ~4 h of active bench time",
    difficulty: "intermediate",
    cost: "£20-£35 of matte PLA or PETG + ~£10 of aluminium rail + anchors",
    prerequisites: [
      "Printed at least one print-in-place flexi successfully — articulated joints free of the bed without snapping.",
      "Comfortable with your slicer's first-layer calibration. Print-in-place mail is unforgiving about first-layer thickness.",
      "A spirit level and a drill, and a wall you're allowed to put two anchors in.",
    ],
    supplies: {
      materials: [
        {
          name: "Matte PLA or PETG filament",
          quantity: "1 kg spool",
          note: "Matte black PLA for indoor work; matte slate PETG for anywhere humid. Avoid glossy filaments unless you want the panel to read as plastic — it will.",
          suppliers: [
            {
              name: "Polymaker PolyTerra Matte PLA",
              url: "https://uk.polymaker.com/products/polyterra-pla",
              sku: "PA04001",
              price: "~£20 / kg",
            },
            {
              name: "Prusament PETG Matte",
              url: "https://prusament.com/petg/",
              price: "~£28 / kg",
            },
            {
              name: "Filamentive rPLA Matte (recycled)",
              url: "https://www.filamentive.com/product/recycled-pla-1-75mm/",
              price: "~£24 / kg",
            },
          ],
        },
        {
          name: "Aluminium U-channel top rail",
          quantity: "600 mm, ~15 × 10 mm cross-section",
          note: "Most picture-framing suppliers carry these. The studio buys by the metre from a local sign-makers' merchant.",
          suppliers: [
            {
              name: "The Aluminium Warehouse — U-channel",
              url: "https://www.aluminiumwarehouse.co.uk/aluminium-channel",
              price: "~£6 / m",
            },
            {
              name: "Metals4U — extruded U-channel",
              url: "https://www.metals4u.co.uk/Stock_Aluminium/Channel/",
              price: "~£7 / m",
            },
          ],
        },
        {
          name: "Two wall anchors",
          quantity: "2×",
          note: "Plasterboard fixings, masonry rawl plugs, or Command strips for borrowed walls.",
        },
        {
          name: "One STL of a dragon-scale module",
          note: "The community-standard ftobler model is what most printers use first time.",
          suppliers: [
            {
              name: "ftobler Dragon Scale Fabric — Printables",
              url: "https://www.printables.com/model/851001-dragon-scale-fabric",
              price: "free",
            },
            {
              name: "Make-it-yourself parametric (OpenSCAD)",
              url: "https://openscad.org/",
              price: "free",
            },
          ],
        },
      ],
      tools: [
        {
          name: "A belt printer (ideal) or a flat-bed FDM (works, with tiling)",
          note: "A belt printer prints the panel as one continuous strip overnight. Any 200 mm bed FDM will tile.",
          suppliers: [
            {
              name: "Creality CR-30 3DPrintMill",
              url: "https://www.creality.com/products/creality-cr-30-3d-printer",
              sku: "CR-30",
              price: "~£999",
            },
            {
              name: "iFactory3D One Pro",
              url: "https://ifactory3d.com/en/one-pro-3d-printer/",
              price: "~€2,499",
            },
            {
              name: "Prusa MK4S (flat-bed fallback)",
              url: "https://www.prusa3d.com/category/original-prusa-mk4/",
              price: "~£899 kit",
            },
          ],
        },
        {
          name: "A small deburring tool or scalpel",
          note: "For the rare hinge that prints with a stringy artefact.",
        },
        {
          name: "A heat gun",
          note: "Lowest setting only. Used to relax residual print stress out of the panel before mounting.",
        },
        {
          name: "A soft-bristled brush",
          note: "Brush loose plastic out of the hinges before mounting.",
        },
        {
          name: "A drill and a spirit level",
          note: "For the top rail.",
        },
      ],
      provisions: [
        {
          name: "A filament dryer",
          isOptional: true,
          note: "If the spool has been on the shelf for months, dry it at 45 °C for four hours. Wet filament fuses hinges.",
        },
        {
          name: "A smoke detector mounted directly above the printer",
          isOptional: true,
          note: "The studio's house rule for any overnight FDM run. Not optional, in spirit — but listed here because most rooms already have one.",
        },
      ],
    },
    software: [
      {
        name: "BeltEngine (for belt printers)",
        url: "https://github.com/Annex-Engineering/Annex-Engineering_User_Mods/wiki/BeltEngine",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Community 45° slicer post-processor for belt printers. The CR-30 community Cura profile bundles this.",
      },
      {
        name: "PrusaSlicer (for flat-bed tiling)",
        version: "≥ 2.7",
        url: "https://www.prusa3d.com/page/prusaslicer_424/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The fallback for non-belt printers. Tile the panel into 200 × 200 mm sections, queue as a batch.",
      },
      {
        name: "OpenSCAD",
        version: "any current build",
        url: "https://openscad.org/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Optional. If you want the parametric workflow the studio uses for commissions — change seed-noise depth per panel.",
      },
    ],
    steps: [
      {
        title: "Calibrate the hinge clearance",
        body: "Print a single scale module in your chosen filament before committing to the full panel. Pull it off the bed, flex every joint with a fingernail. The joints should move freely the moment they come loose; they should not require force.\n\nIf they fuse, increase the gap in the STL or the slicer by 0.05 mm and reprint. If they rattle, decrease by 0.05 mm. Write the working number on the printer frame with a Sharpie; you will need it the next time the humidity changes.",
        figures: [
          {
            src: "/diagrams/dragon-scale-wall-relief/figure-01-hinge-flex.svg",
            alt: "A single dragon-scale module being flex-tested by a fingernail on the hinge.",
            label: "Fig. 01",
            caption: "One scale, fresh off the bed, hinge flex-tested.",
            maxWidth: "260px",
          },
        ],
      },
      {
        title: "Lay out the panel in the slicer",
        body: "Open the dragon-scale STL in your slicer. For a 600 × 300 mm panel you want a grid of around 30 × 15 modules, give or take, depending on scale size. Offset every other row by half a scale width — this is what gives the panel its characteristic feathered overlap.\n\nIf the STL is a single tileable module, the slicer's grid tool will do this in two clicks. If it is a pre-tiled sheet, use the model the way it ships.",
        figures: [
          {
            src: "/diagrams/dragon-scale-wall-relief/figure-02-offset-grid.svg",
            alt: "Top-down slicer view of dragon scales laid out as an offset grid.",
            label: "Fig. 02",
            caption: "Every second row shifted by half a scale. That's the look.",
            maxWidth: "320px",
          },
        ],
      },
      {
        title: "Set the slicer for mail",
        body: "Two perimeters, zero infill, no top or bottom layers beyond the scale's own thickness. Layer height 0.16 mm (production) or 0.12 mm (samples). Print speed 60 mm/s for PLA, 40 mm/s for PETG.\n\nTurn off the brim — a brim will fuse the bottom row of scales to each other. If your slicer wants a skirt, give it three loops a centimetre away from the part.",
      },
      {
        title: "Slice and queue the print",
        body: "Belt printer users: confirm the slicer has oriented the part diagonally to match the 45° print head. Flat-bed users: tile the panel into segments that fit your bed and queue them as a batch.\n\nSave the gcode to your SD card or send over network, but verify the first layer height by hand before you walk away — print-in-place mail is brutal about first-layer calibration.",
      },
      {
        title: "Run the print unsupervised",
        body: "A belt printer will produce the strip continuously over 24-30 hours; a flat-bed will produce 200 × 200 mm tiles you will need to join later. Check on the print at the first hour to confirm the bed adhesion is holding and the first three rows of scales are coming out clean.\n\nAfter that, leave the machine to it. The studio runs the CR-30 overnight with a smoke detector immediately above it; you should too.",
        figures: [
          {
            src: "/diagrams/dragon-scale-wall-relief/figure-03-belt-print.svg",
            alt: "Side view of a belt printer with a continuous strip of dragon scale coming off the back of the belt.",
            label: "Fig. 03",
            caption: "Belt printer in profile. The strip slides off the back of the belt and into the tray.",
            maxWidth: "320px",
          },
        ],
      },
      {
        title: "Pull the panel off and brush it down",
        body: "When the print finishes, lift the panel free of the bed (or, on the belt printer, watch the last metre slough off the conveyor on its own). Lay it flat on a clean surface.\n\nBrush with the soft-bristled brush to dislodge any loose plastic fragments from the hinges. Flex every fifth scale by hand to confirm the hinges have all freed cleanly. The panel should ripple under your hand like cloth.",
      },
      {
        title: "Heat-relax the panel",
        body: "Run the heat gun at its lowest setting along the length of the panel from about 200 mm away. The PLA softens enough to lose any residual print stresses and the panel settles into a true flat shape.\n\nDo not overdo this — if the scales start to droop visibly, you are too close or too hot. The aim is to relax, not to deform.",
      },
      {
        title: "Prepare and mount the top rail",
        body: "Cut the aluminium U-channel to length if it did not come pre-cut. Drill two fixing holes for wall anchors, spaced to match standard wall-stud spacing if your wall has studs, or simply to put the anchors well inboard of the rail ends. Deburr the cut edge with a file.\n\nMark the wall with a spirit level. Drill, plug, screw the rail in. The rail's open channel should face downward — the panel's top edge slides up into this channel from below.",
        figures: [
          {
            src: "/diagrams/dragon-scale-wall-relief/figure-04-rail-mount.svg",
            alt: "U-channel aluminium rail mounted to a wall, dragon-scale panel sliding up into the open channel.",
            label: "Fig. 04",
            caption: "U-channel mounted, channel facing down, panel slides up into it.",
            maxWidth: "280px",
          },
        ],
      },
      {
        title: "Hang the panel and light it",
        body: "Slide the top edge of the panel up into the rail's channel until it seats. The panel hangs from the rail under its own weight and drapes slightly against the wall. Step back, check the drape, and adjust the panel sideways inside the rail if it has hung off-centre. There is no bottom rail and no fixings beyond the top — the textile-mechanics of the mail keeps the panel flat against the wall.\n\nA dragon-scale panel lit straight-on reads flat; lit from a 30° angle it explodes. A small LED strip mounted along the top edge, aimed downward at a shallow angle, brings the relief out fully. A picture light works just as well. Switch the room lights on and off a few times and choose the angle the panel comes alive at.",
      },
    ],
    finalResult:
      "A 600 × 300 mm panel of overlapping dragon scale hung from a single aluminium top rail, drape resting against the wall, every facet catching a 30° side-light. Glitters like the dragon's hoard at rest; reads as textile from across the room, as machine-cut precision from arm's length. The first one is proof the loop works; the next is the one you commission for somebody else's wall.",
    variations: [
      "Swap the scale STL for a hex-mail or 4-in-1 chain pattern. Same workflow, different textile.",
      "Print in TPU instead of PLA — the panel drapes like actual cloth and can be folded for storage.",
      "Print in iridescent PETG so the relief shifts colour as the viewer walks past.",
      "Drive the parametric OpenSCAD version with a seed-noise depth modulation per commission — same family, different rhythm.",
    ],
    troubleshooting: [
      {
        symptom: "Hinges fused",
        cause:
          "Gap tolerance too tight, or filament has absorbed moisture from the air.",
        fix: "Increase gap by 0.05 mm in the model or slicer and reprint a single scale to confirm. Dry the spool in a filament dryer at 45 °C for four hours before the next attempt.",
      },
      {
        symptom: "Scales rattle and the panel feels loose",
        cause: "Gap tolerance too generous.",
        fix: "Decrease gap by 0.05 mm. The panel should ripple like cloth, not rattle like plastic.",
      },
      {
        symptom: "First layer lifts in the corners",
        cause:
          "Bed adhesion failing — the classic FDM problem. On a belt printer, also check belt tension.",
        fix: "Clean the bed with isopropyl alcohol, re-level, and increase first-layer temperature by 5 °C. Belt printers: tension the belt as well.",
      },
      {
        symptom: "Stringing between scales",
        cause:
          "Retraction too short or, for PETG specifically, the hot end is running too hot.",
        fix: "Increase retraction distance by 1 mm and retraction speed by 10 mm/s. For PETG, lower the print temperature by 5 °C.",
      },
      {
        symptom: "Panel curls when you take it off the bed",
        cause: "Residual print stresses.",
        fix: "Heat-relax as in step 7, or print the next attempt with a slightly cooler bed (60 °C instead of 65 °C for PLA) so the panel cools more gradually.",
      },
    ],
  },
  base,
);
