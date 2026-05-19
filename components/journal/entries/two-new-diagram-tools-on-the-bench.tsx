import Link from "next/link";

import { MermaidBlock } from "components/diagrams/MermaidBlock";
import { RoughFigure } from "components/diagrams/RoughFigure";
import { MeshProseLayer } from "components/type3d/MeshProseLayer";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

export default function TwoNewDiagramToolsOnTheBench() {
  return (
    <>
      {/* Showcase for the body-text mesh system. The HTML still
          renders for a11y/SEO; the mesh paints on top when the
          shared scene is available. See docs/MESH-PROSE.md. */}
      <MeshProseLayer font="sans" material="matte">
        <p>
          Bench acquired two new things this afternoon: Mermaid (the
          text-to-diagram parser the engineering crowd uses for arch
          diagrams) and Rough.js (the library that draws hand-drawn-
          looking shapes into an SVG). Both got wired into the site
          as client components so any article or journal entry can
          drop a diagram inline. The IKEA-style flat-line SVGs the
          tutorial section uses are still the right call for
          assembly figures, but neither of those new tools is a
          replacement &mdash; they cover the bits IKEA-flat
          doesn&rsquo;t reach.
        </p>
      </MeshProseLayer>

      <p>
        Mermaid is for arch diagrams and flowcharts where the shape
        of the system is the thing worth showing &mdash; the
        capture-to-render loop, the order of operations in a build,
        which component talks to which other component. Source is a
        plain string, which means the diagram lives in the same file
        as the prose and travels with it under version control. No
        fiddling with a separate vector file when the architecture
        changes.
      </p>

      <MermaidBlock
        label="Fig. M1"
        caption="The studio's capture-to-publish loop, top level. Mermaid source lives in the journal entry."
        chart={`graph LR
  Camera[Camera bench] --> Buffer[Local buffer]
  Rig[POV rig] --> Buffer
  Buffer --> Inference[Inference / SHARP]
  Inference --> Splat[.ply splat]
  Splat --> Viewer[Splat viewer / web]
  Splat --> Archive[Research archive]
  Buffer --> Photo[Long-exposure keeper]
  Photo --> Gallery[Photo gallery]`}
      />

      <p>
        Rough.js is for sketches. Where Mermaid is the architect,
        Rough is the back-of-a-napkin. It takes a list of typed
        primitives (rectangles, circles, lines, paths) and draws
        them in a hand-sketched style, so the figure reads as
        provisional &mdash; an idea being thought out, not a
        specification being handed down. Useful for journal entries
        where the prose is still working things through, and for the
        opening pages of articles where you want the reader in a
        looser frame of mind before the precise diagrams arrive.
      </p>

      <RoughFigure
        width={360}
        height={200}
        maxWidth="420px"
        label="Fig. R1"
        caption="A rough sketch of the bench &mdash; printer, camera, two screens. Done in Rough.js."
        shapes={[
          { kind: "rectangle", x: 20, y: 30, w: 100, h: 60 },
          { kind: "text", x: 36, y: 66, content: "PRINTER" },
          { kind: "rectangle", x: 150, y: 30, w: 90, h: 60 },
          { kind: "text", x: 168, y: 66, content: "SCREEN" },
          { kind: "rectangle", x: 260, y: 30, w: 90, h: 60 },
          { kind: "text", x: 278, y: 66, content: "SCREEN" },
          { kind: "circle", cx: 70, cy: 140, diameter: 50 },
          { kind: "text", x: 56, y: 146, content: "CAMERA" },
          {
            kind: "line",
            x1: 70,
            y1: 116,
            x2: 70,
            y2: 92,
            options: { strokeLineDash: [4, 4] },
          },
          {
            kind: "line",
            x1: 195,
            y1: 92,
            x2: 195,
            y2: 130,
            options: { strokeLineDash: [4, 4] },
          },
          {
            kind: "path",
            d: "M120 160 Q200 180 280 160",
            options: { strokeLineDash: [4, 4] },
          },
          { kind: "text", x: 180, y: 188, content: "wires" },
        ]}
      />

      <p>
        Both tools dynamic-import their library on mount so pages
        that don&rsquo;t use them don&rsquo;t pay the bundle weight.
        Mermaid is the heavier of the two by an order of magnitude
        (parser graph plus DOM-dependent renderer); Rough.js is
        small enough that the lazy-import is a stylistic choice
        rather than a budget call. The components both live in{" "}
        <code>components/diagrams/</code> and take a small caption +
        label pair so they render as proper figures inside the
        prose, not as floating untitled blobs.
      </p>

      <p>
        Worth saying what the studio is <em>not</em> using either
        tool for. IKEA-style flat-line SVGs stay the right answer
        for tutorial assembly figures &mdash; the{" "}
        <Link
          href="/tutorials/tutorial-dragon-scale-wall-relief"
          className={ext}
        >
          dragon-scale wall-relief tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/first-poi-painting-frame-end-to-end"
          className={ext}
        >
          POI first-frame demo
        </Link>{" "}
        both lean on those for the procedure illustrations. Mermaid
        and Rough are for the higher-altitude pieces: arch diagrams
        in articles, sketchy bench-layout figures in journal entries
        like this one, the things that want to read as either
        precise (Mermaid) or provisional (Rough) rather than as a
        step-by-step.
      </p>

      <p>
        Now I&rsquo;m going to go and stick a Mermaid diagram into
        the splat-pipeline article and a Rough sketch into the bench
        journal entry.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "two-new-diagram-tools-on-the-bench",
  title: "Two new diagram tools on the bench",
  date: "2026-05-19",
  kind: "journal",
  excerpt:
    "Mermaid for arch diagrams, Rough.js for back-of-napkin sketches. Both lazy-loaded, both wired as client components, both leaving the IKEA-style assembly figures alone where those still do the job better.",
  Body: TwoNewDiagramToolsOnTheBench,
  related: [
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Tutorial — Dragon-Scale Wall Relief",
      note: "Where the IKEA-style flat-line SVGs still earn their place.",
    },
    {
      href: "/tutorials/first-poi-painting-frame-end-to-end",
      label: "Tutorial — Your first POI-painting frame",
      note: "The demo tutorial that exercises the Aura Test Chamber renderer end to end.",
    },
    {
      href: "/journal/the-bench-in-https",
      label: "Journal — The bench in HTTPS",
      note: "The bigger bench picture this entry's sketch fits into.",
    },
  ],
  furtherReading: [
    {
      href: "https://mermaid.js.org/",
      label: "Mermaid — text-to-diagram parser",
      note: "Official site. Chart-type reference and the live playground.",
    },
    {
      href: "https://roughjs.com/",
      label: "Rough.js — hand-drawn graphics",
      note: "Official site. API reference and gallery of sketchy examples.",
    },
  ],
};
