import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnGp3NoiseStrokeWaveBody() {
  return (
    <>
      <p>
        Blender 5.1 promotes Grease Pencil 3 (GP3) to a first-class geometry
        type inside the Geometry Nodes stack. Strokes are exposed as a
        curve-like domain: each stroke is a spline, each point on that spline
        carries position, radius, and opacity — all writable through the same{" "}
        <code>SetPosition</code>, <code>SetRadius</code>, and{" "}
        <code>StoreNamedAttribute</code> nodes that drive mesh and curve trees.
        This means the entire procedural toolkit — noise fields, simulation
        zones, field-at-index lookups — can now operate on hand-drawn ink
        without converting strokes to mesh first. Compare this with the
        Modifier approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline"
          className={lk}
        >
          GP3 Line Art Toon Outline tutorial
        </Link>
        , where the <em>Line Art</em> modifier generates strokes from mesh
        silhouettes — powerful, but opaque. GN gives you explicit per-point
        control over every coordinate in every stroke.
      </p>

      <p className="mt-3">
        This tutorial builds a noise-wave displacement effect: three concentric
        closed-circle strokes are created programmatically in{" "}
        <code>blueprint.py</code>, then a GN modifier reads each point&apos;s
        world position, feeds it into a 3-D Noise Texture whose lookup
        coordinate is offset by Scene Time, and writes the displaced Y
        position back via <code>SetPosition</code>. No simulation cache, no
        bake — the wave re-evaluates per frame on the CPU in under a
        millisecond for a 184-point stroke set. The pattern is identical in
        principle to the mesh noise displacement in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          GN Set Position — Noise Displacement tutorial
        </Link>
        ; the GP3 version simply operates on the POINT domain of a curve-like
        geometry rather than on mesh vertices.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The GP3 domain model inside GN
      </h2>
      <p className="mt-2">
        When a Geometry Nodes modifier is added to a GP3 object, the tree
        receives a <em>GreasePencil geometry</em>. Internally Blender exposes
        this through three domains:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>POINT</strong> — individual stroke samples. This is where
          Position, Radius, and Opacity live. <code>SetPosition</code> with an
          Offset field on the POINT domain displaces each sample independently.
        </li>
        <li>
          <strong>CURVE</strong> — individual strokes (splines). Fields
          evaluated here are uniform across a whole stroke:{" "}
          <code>SplineLength</code>, <code>CurveIndex</code>,{" "}
          <code>IsCyclic</code>.
        </li>
        <li>
          <strong>LAYER</strong> — GP3 layers. Read via{" "}
          <code>InputGreasePencilLayerName</code> or{" "}
          <code>InputGreasePencilLayerIndex</code> — useful for per-layer
          colour or opacity overrides without touching the material stack.
        </li>
      </ul>
      <p className="mt-2">
        Standard curve-compatible nodes ({" "}
        <code>SplineParameter</code>, <code>CurveLength</code>,{" "}
        <code>CurveParameter</code>) are available on GP3 data. This is the
        same internal path as regular curve GN, which is why the learning
        transfers directly — the difference is that the geometry comes from
        drawn strokes rather than a Bezier object.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Time-offset noise — why it creates a travelling wave
      </h2>
      <p className="mt-2">
        A 3-D Noise Texture is a static field: sample it at the same position
        on every frame and you get the same value. To animate it, you shift the
        sampling coordinate. In this tree the Scene Time{" "}
        <code>Seconds</code> output is packed into the X component of a vector
        (via <code>CombineXYZ</code>), which is then added to each point&apos;s
        world position before the noise lookup:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-3 text-xs">
        {`sample_coord = position + vec(Seconds, 0, 0)
noise_fac    = Noise3D(sample_coord, scale=3.5)
displacement = (noise_fac - 0.5) * strength  # centre around 0`}
      </pre>
      <p className="mt-2">
        Subtracting 0.5 is critical: raw Noise Fac lives in [0, 1]. Without
        centring, every point would be displaced in the same direction
        (positive Y only), which reads as a bulge rather than a wave. The
        centred value in [−0.5, 0.5] oscillates above and below the original
        stroke position, giving the bilateral ripple.
      </p>
      <p className="mt-2">
        As <code>Seconds</code> increases, the noise cross-section slides along
        X. Points that were on a noise ridge slide toward a valley and vice
        versa — the waveform appears to travel sideways through the rings. The
        rate is exactly one Blender-unit per second, which at the default
        scale of 3.5 gives a comfortable visual tempo. Halve the scale and the
        wave slows visually (broader hills, same physical drift). Compare the
        wave-reveal approach here — re-evaluating a sliding field — with the
        Simulation Zone strategy in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          GN Simulation Zone — Wave Reveal tutorial
        </Link>
        , where state is written once per frame and frozen into vertex
        attributes. Use the field approach (this tutorial) when you want a
        loopable, cache-free animation; use the simulation approach when you
        need irreversible state (activation timestamps, reaction-diffusion
        concentrations).
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Blueprint — programmatic stroke creation
      </h2>
      <p className="mt-2">
        GP3 stroke data is created with <code>frame.drawing.add_strokes(n)</code>,
        which allocates <em>n</em> new stroke records and returns references to
        them. Each stroke exposes a <code>points</code> collection after{" "}
        <code>s.resize(count)</code> sets its point count. The position, radius,
        and opacity of each point are then written directly — no operator
        context required:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-3 text-xs">
        {`frame.drawing.add_strokes(1)
s = frame.drawing.strokes[-1]
s.use_cyclic = True          # close the ring
s.material_index = 0
s.resize(n_pts)
for i in range(n_pts):
    angle = 2.0 * math.pi * i / n_pts
    s.points[i].position = (cos(angle)*R, sin(angle)*R, 0.0)
    s.points[i].radius   = 0.025
    s.points[i].opacity  = 1.0`}
      </pre>
      <p className="mt-2">
        The GN modifier is then applied via <code>obj.modifiers.new(...,
        &ldquo;NODES&rdquo;)</code> exactly as for a mesh object. Group input
        socket values are set through the modifier&apos;s identifier-keyed
        dict:{" "}
        <code>mod[sid(&ldquo;Noise Scale&rdquo;)] = 3.5</code>. For more on
        this identifier pattern see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gp3-frame-by-frame-cel-animation"
          className={lk}
        >
          GP3 Frame-by-Frame Cel Animation tutorial
        </Link>
        , which covers the GP3 layer/frame/drawing data model in depth.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Render considerations for GP3
      </h2>
      <p className="mt-2">
        GP3 strokes render correctly in EEVEE Next and Cycles. The{" "}
        <code>scene.render.film_transparent = True</code> flag gives a
        transparent background, making the navy rings compositable over any
        surface — useful for WebXR overlay graphics where the stroke would sit
        on top of 3-D scene geometry. GP3 data does not export as GLB (strokes
        have no mesh equivalent); for WebXR use, bake the animation to a PNG
        sequence or video texture and apply it to a plane with alpha-blend
        material. The GN displacement bakes at render time, so each PNG frame
        contains the correct wave position without any pre-bake step.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Strokes don&apos;t appear in GN Spreadsheet:</strong> confirm
          the modifier type is <em>Nodes</em> (not a GP2-era modifier). In 5.1,
          check that the object data type is <code>GreasePencil</code> (v3),
          not the legacy <code>GPencil</code> block. Legacy GP2 objects do not
          accept GN modifiers.
        </li>
        <li>
          <strong>No wave visible at frame 1:</strong> at <code>Seconds=0</code>{" "}
          the noise offset is zero — the wave hasn&apos;t swept yet, but noise
          evaluated at the raw positions is still non-zero unless{" "}
          <code>Noise Scale</code> is very low. Scrub to frame 12 to see clear
          displacement.
        </li>
        <li>
          <strong>Displacement flickers between frames:</strong> the Noise
          Texture default seed is 0; changing it to 1+ and re-evaluating won&apos;t
          flicker. Flickering usually means the <code>Vector</code> socket on
          the Noise node is disconnected — check the link from{" "}
          <code>VectorMath ADD</code>.
        </li>
        <li>
          <strong>
            <code>add_strokes</code> not found:
          </strong>{" "}
          this API exists on{" "}
          <code>bpy.types.GreasePencilDrawing</code> (GP3 only). If Blender
          reports AttributeError, the <code>.blend</code> may contain a legacy
          GP2 block. Delete it and rebuild with <code>blueprint.py</code> which
          explicitly allocates from <code>bpy.data.grease_pencils_v3</code>.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">External references</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          Blender Manual: Grease Pencil Modifiers — CC-BY-SA-4.0, Blender
          Foundation.{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/grease_pencil/modifiers/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org/manual/en/5.1/grease_pencil/modifiers
          </a>
          . Sibling:{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/grease_pencil/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            GP3 overview
          </a>
          .
        </li>
        <li>
          njanakiev/blender-scripting — MIT, Nicolas Janakiev.{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>
          . Sibling:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
    {
      steps: [
        {
          title: "Run blueprint.py",
          body: "Open Blender 5.1 → Scripting workspace → open blueprint.py → Run Script. Three navy concentric ring strokes appear in the viewport with a WaveDisplace GN modifier already active.",
        },
        {
          title: "Open the GN editor and trace the tree",
          body: "Select wave_rings → open Geometry Nodes editor. Walk left to right: Scene Time → CombineXYZ (packs seconds into X) → VectorMath ADD (shifts position by time) → Noise Texture (noise_dimensions='3D', scale=3.5) → Math SUBTRACT 0.5 (centres Fac around 0) → Math MULTIPLY (applies strength 0.12) → CombineXYZ (packs into Y only) → SetPosition → Output.",
        },
        {
          title: "Check the POINT domain in Spreadsheet",
          body: "Open Spreadsheet editor. Set geometry block to wave_rings + modifier stack. Domain = POINT: confirm 184 rows (40+64+80). Check Position and note the Y values are non-zero even at frame 1 — noise at raw positions without time offset is already non-zero.",
        },
        {
          title: "Play the timeline",
          body: "Press Space. Watch the rings undulate as Scene Time.Seconds advances. The displacement cross-section sweeps along X at 1 unit/second — strokes on the inner ring appear to ripple faster because their circumference-to-radius ratio gives higher angular frequency at the same point count.",
        },
        {
          title: "Tune Noise Scale live",
          body: "In Properties → Modifier → WaveDisplace, drag Noise Scale 1.0 → 8.0. At 1.0: one broad continental swell. At 8.0: tight rapid chatter. For a calm ripple-pool aesthetic, 3.0–4.0 is the sweet range. Scale does not change wave speed — only spatial frequency.",
        },
        {
          title: "Tune Noise Strength",
          body: "Drag Noise Strength 0.0 → 0.30. At 0.0 the strokes are perfect circles. At 0.30 the rings look storm-blown. 0.08–0.15 matches the aesthetic of ink on wet paper. Reset to 0.12 to match the blueprint default.",
        },
        {
          title: "Add a second displacement on Z",
          body: "In the GN tree, duplicate the CombineXYZ displacement node, set a second noise (different Seed=1) and wire its scaled output to the Z input. Now the strokes wobble in 3-D, lifting off the XY plane into a gentle helical undulation. This adds depth for a perspective camera angle.",
        },
        {
          title: "Run record.py for viewport.mp4",
          body: "Open record.py → Run Script. Renders 60 PNG frames to videos/grease-pencil/gn-gp3-noise-stroke-wave/frames/. Then run: ffmpeg -r 24 -i 'frames/frame_%04d.png' -c:v libx264 -pix_fmt yuv420p viewport.mp4.",
        },
        {
          title: "Record screen.mp4",
          body: "Follow SCREEN-RECORDING-NOTES.md. Essential takes: (1) Spreadsheet POINT domain walkthrough, (2) node tree left-to-right narration, (3) Noise Scale drag 1→8, (4) Noise Strength drag 0→0.30, (5) timeline playback 60-frame loop. Save to videos/grease-pencil/gn-gp3-noise-stroke-wave/screen.mp4.",
        },
      ],
    },
    {
      slug: "blender-tutorial-gn-gp3-noise-stroke-wave",
      title:
        "GN for Grease Pencil 3 — Noise-Wave Stroke Displacement Modifier (Blender 5.1)",
      date: "2026-06-28",
      kind: "tutorial",
      excerpt:
        "Apply a Geometry Nodes modifier to a GP3 object to displace ink stroke points procedurally: a 3-D Noise Texture offset by Scene Time creates a travelling wave through concentric ring strokes. Covers the GP3 POINT/CURVE/LAYER domain model inside GN, the time-offset sampling trick, blueprint programmatic stroke creation with add_strokes(), and the centring-noise pattern for bilateral ripple animation.",
      Body: GnGp3NoiseStrokeWaveBody,
    },
  );
