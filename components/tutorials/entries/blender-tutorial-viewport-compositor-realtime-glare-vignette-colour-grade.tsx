import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Viewport Compositor runs your compositor node graph directly against
        the EEVEE framebuffer in real time — bloom, colour grade, vignette, and
        barrel distortion all update as you drag sliders, move lights, or play
        back an animation, without a single F12 render. Introduced in Blender
        4.2 and refined in 5.1, it uses the same{" "}
        <code>scene.node_tree</code> as the offline Compositor but evaluates
        only GPU-compatible nodes on every viewport refresh at full interactive
        frame rate.
      </p>
      <p className="mt-3">
        EEVEE Next (4.2+) removed the old Bloom render toggle from Render
        Properties; <code>CompositorNodeGlare glare_type=&apos;BLOOM&apos;</code> is
        the canonical replacement for both viewport preview and final renders.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Viewport Compositor vs the offline Compositor
      </h2>
      <p>
        Both systems read from the same <code>scene.node_tree</code>, but they
        differ in two ways. First, the Viewport Compositor runs on every
        viewport redraw; the offline Compositor runs once after each F12 render.
        Second, the Viewport Compositor supports only a subset of nodes — those
        that can be evaluated on the GPU without access to per-pixel render
        passes (Mist, Z, Normal). Nodes that depend on those passes —
        Defocus, OIDN Denoising, Cryptomatte — are offline-only. Nodes that
        work in both: Glare, Colour Balance, RGB Curves, Hue/Saturation/Value,
        Brightness/Contrast, Lens Distortion, Ellipse Mask, Blur, Mix RGB,
        and the Composite/Viewer outputs.
      </p>
      <p className="mt-3">
        The offline Compositor pipeline for depth-of-field and fog is covered
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-mist-pass-z-depth-defocus-atmospheric"
          className={lk}
        >
          Compositor: Mist Pass + Z-Depth Defocus tutorial
        </Link>
        . This tutorial sits alongside that one as the real-time counterpart.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Enabling the Viewport Compositor
      </h2>
      <p>
        The toggle lives on the 3D View&apos;s shading settings, not on the
        scene. That means each viewport can have its own state. Three modes:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm mb-2">
        <li><code>&apos;ALWAYS&apos;</code> — active in any shading mode.</li>
        <li><code>&apos;CAMERA&apos;</code> — only when looking through the render camera.</li>
        <li><code>&apos;DISABLED&apos;</code> — compositor off.</li>
      </ul>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`# Enable the Viewport Compositor on every 3D viewport in the current screen
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type           = "RENDERED"   # needs EEVEE active
                space.shading.use_compositor = "ALWAYS"
                break`}
      </pre>
      <p>
        The compositor then fires on every redraw. Switch shading back to
        Solid and the compositor suspends; switch to RENDERED again and it
        resumes from the same node tree — no rebuild needed.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Glare node — BLOOM mode (replaces EEVEE Render Settings bloom)
      </h2>
      <p>
        The Glare node&apos;s BLOOM mode spreads photons outward from any pixel
        above the <code>threshold</code>. Scene-linear EEVEE emission surfaces
        typically sit at 1.5–8.0; a threshold of 0.8 isolates them cleanly
        while ignoring diffuse surfaces near 0.0–0.5.{" "}
        <strong>Wire Glare before Colour Balance</strong> — grading first
        compresses HDR peaks below the threshold before Glare can read them.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`scene.use_nodes = True
tree  = scene.node_tree
nodes = tree.nodes; links = tree.links
nodes.clear()

rl    = nodes.new("CompositorNodeRLayers")

glare = nodes.new("CompositorNodeGlare")
glare.glare_type = "BLOOM"    # 'BLOOM', 'SIMPLE_STAR', 'STREAKS', 'GHOSTS', 'FOG_GLOW'
glare.threshold  = 0.80       # scene-linear; lower = more surfaces bloom
glare.size       = 7          # corona radius (power-of-two steps, 1–9; 9 fills the frame)
glare.mix        = 1.0        # 0 = original only, 1 = bloom fully composited
glare.quality    = "HIGH"
links.new(rl.outputs["Image"], glare.inputs["Image"])`}
      </pre>
      <p>
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-bloom-emission-glow-cel-shade"
          className={lk}
        >
          EEVEE Next Bloom for Cel-Shade Props tutorial
        </Link>{" "}
        for a detailed breakdown of threshold, emission strength, and glTF
        export via <code>KHR_materials_emissive_strength</code>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Colour Balance — lift / gamma / gain
      </h2>
      <p>
        The ASC-CDL correction model on <code>CompositorNodeColorBalance</code>{" "}
        maps three RGBA tuples (each component <em>multiplied</em> into the
        corresponding channel) onto shadows (lift), midtones (gamma), and
        highlights (gain). Values above 1.0 push the channel warmer; below 1.0
        pushes it cooler. A common cinematographer starting point: cool
        shadows, neutral-warm midtones, blue-shifted highlights.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`cb = nodes.new("CompositorNodeColorBalance")
cb.correction_method = "LIFT_GAMMA_GAIN"
cb.lift  = (1.00, 1.00, 1.02, 1.0)   # slight blue lift in shadows
cb.gamma = (1.04, 1.01, 0.95, 1.0)   # warm red/green midtone push
cb.gain  = (0.92, 0.96, 1.08, 1.0)   # cool blue-shifted highlights
links.new(glare.outputs["Image"], cb.inputs["Image"])`}
      </pre>
      <p>
        For the full CDL + RGB Curves pipeline see the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-color-grading-rgb-curves-cdl"
          className={lk}
        >
          Compositor Colour Grading: RGB Curves &amp; CDL tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Vignette — Ellipse Mask + Multiply
      </h2>
      <p>
        There is no dedicated Vignette node. The standard approach: an Ellipse
        Mask defines the safe-area oval, a Gaussian Blur feathers its edge,
        then an Invert flips it so the oval is white and the corners are black.
        A MixRGB node set to MULTIPLY blends this mask over the graded image.
        Multiply is critical — Add-Black subtracts channels equally and causes
        hue drift in saturated colours near the corners.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`ellipse = nodes.new("CompositorNodeEllipseMask")
ellipse.width = 0.70; ellipse.height = 0.60   # <1.0 leaves dark corners

blur = nodes.new("CompositorNodeBlur")
blur.filter_type = "GAUSS"; blur.size_x = 80; blur.size_y = 80
blur.use_relative = False
links.new(ellipse.outputs["Mask"], blur.inputs["Image"])

inv = nodes.new("CompositorNodeInvert")
inv.invert_alpha = False
links.new(blur.outputs["Image"], inv.inputs["Color"])

vmix = nodes.new("CompositorNodeMixRGB")
vmix.blend_type = "MULTIPLY"
vmix.inputs["Fac"].default_value = 0.70   # 0=no vignette, 1=maximum
links.new(lens_dist.outputs["Image"], vmix.inputs["Image"])
links.new(inv.outputs["Color"],       vmix.inputs["Image_001"])`}
      </pre>
      <p>
        The cinematic post chain in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Compositor Glare, Film Grain &amp; Tonemapping tutorial
        </Link>{" "}
        uses this same vignette approach as its final stage.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Lens Distortion — barrel + chromatic aberration
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`ld = nodes.new("CompositorNodeLensdist")
ld.use_fit    = True     # rescale result to fill frame after warp
ld.use_jitter = False    # avoid sampling noise in real-time
ld.inputs["Distortion"].default_value = -0.025  # negative = barrel; keep ≤|0.04|
ld.inputs["Dispersion"].default_value =  0.006  # lateral chromatic aberration`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <strong>Compositor has no effect in viewport.</strong>{" "}
          <code>space.shading.use_compositor</code> may be <code>&apos;DISABLED&apos;</code>
          or the shading mode is not RENDERED. Check both — the Viewport
          Compositor only runs when EEVEE is the active viewport renderer.
        </li>
        <li>
          <strong>Bloom fires on diffuse surfaces, not just emissives.</strong>{" "}
          Raise <code>glare.threshold</code> above the diffuse luminance of
          your scene (typically 0.4–0.7 linear). Check the Render Result in
          the Compositor Viewer to confirm which pixels exceed the threshold.
        </li>
        <li>
          <strong>Vignette shows a hard oval edge, not a soft fade.</strong>{" "}
          Increase the Blur node&apos;s <code>size_x</code>/<code>size_y</code>.
          Blurs above 120 px on a 1280-wide output produce the smooth cinematic
          fade. Small values (&lt;20) produce a visible hard mask ring.
        </li>
        <li>
          <strong>F12 render looks different from the viewport.</strong>{" "}
          The Viewport Compositor reads the live EEVEE framebuffer (with
          temporal anti-aliasing). F12 renders with the same sample count but
          goes through a full render cycle; results should match but TAA
          jitter patterns can slightly differ on thin geometry.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/editors/3dview/viewport_compositor.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Viewport Compositor
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Documents the{" "}
          <code>use_compositor</code> toggle, supported node list, and GPU
          device selection. Related projects:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/compositing/types/filter/glare.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Compositor Glare Node
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Full parameter reference for all
          glare types including BLOOM, SIMPLE_STAR, STREAKS, and GHOSTS, plus
          the quality and mix controls. Related:{" "}
          <a
            href="https://github.com/blender/blender-addons"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender-addons
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-viewport-compositor-realtime-glare-vignette-colour-grade",
  title:
    "Viewport Compositor — Real-Time Glare, Vignette & Colour Grade in the 3D Viewport",
  description:
    "Enable the Viewport Compositor on the EEVEE 3D viewport and build a live three-stage post chain: Glare BLOOM for emission highlights, Colour Balance lift/gamma/gain, barrel Lens Distortion, and a Multiply vignette via Ellipse Mask — all updating in real time without rendering.",
  published: "2026-06-28",
  topics: [
    "blender",
    "compositor",
    "eevee",
    "rendering",
    "colour-grade",
    "viewport",
  ],
  body: Body,
});
