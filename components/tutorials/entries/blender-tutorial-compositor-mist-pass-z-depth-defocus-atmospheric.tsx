import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender offers two depth buffers from every render and they serve
        different roles in the Compositor. The <strong>Z pass</strong> contains
        raw floating-point distances from the camera, measured in world units,
        ranging from 0 at the lens to effectively infinity at the sky. The{" "}
        <strong>Mist pass</strong> is a pre-normalised version of the same
        information: 0 means &quot;at the mist start distance&quot; and 1 means
        &quot;at or beyond the mist depth&quot;. World Properties controls the
        ramp. Neither pass produces a visual effect by itself — they are data
        channels that feed downstream Compositor nodes to generate depth of
        field and atmospheric haze.
      </p>
      <p className="mt-3">
        The technique here chains both together. The Compositor{" "}
        <strong>Defocus</strong> node reads the Z pass to produce lens-accurate
        bokeh, blurring near and far objects according to their actual distance
        from the focus plane. The blurred result then feeds a{" "}
        <strong>Mix</strong> node whose factor socket is wired to the Mist pass,
        so that blurred geometry at depth gradually dissolves into a fog colour.
        Near-field objects are crisp and clearly-coloured. Mid-field geometry
        sits in focus at full contrast. Far-field objects are blurred and fog-
        tinted simultaneously — which is exactly how haze behaves in nature.
      </p>
      <p className="mt-3">
        Contrast this with render-side camera DOF (covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          Cycles DOF, Motion Blur &amp; Bokeh tutorial
        </Link>
        ): camera DOF runs inside the renderer and requires more samples to
        converge cleanly. Compositor-side Defocus is deterministic — it runs one
        convolution pass on the already-rendered image and is therefore instant
        to adjust without re-rendering. The trade-off is that foreground objects
        that overlap the background can show a fringing artefact at their silhouette
        edge, because the Z pass has no sub-pixel information. For stylised and
        environment work the artefact is rarely visible; for extreme close-ups
        use camera-side DOF instead.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Setting up the Mist pass
      </h2>
      <p>
        The Mist pass parameters live in <strong>World Properties → Mist
        Pass</strong>, not in Render Properties. You must also enable the pass
        per View Layer.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`# Enable Mist and Z passes on the active View Layer
view_layer = bpy.context.view_layer
view_layer.use_pass_mist = True   # normalised 0..1 depth ramp
view_layer.use_pass_z    = True   # raw depth in world units

# Configure the mist ramp in World Properties
mist = bpy.context.scene.world.mist_settings
mist.use_mist  = True
mist.start     = 1.0         # world units before mist begins
mist.depth     = 8.0         # range over which mist reaches 1.0
mist.falloff   = "QUADRATIC" # options: LINEAR / QUADRATIC / INVERSE_QUADRATIC`}
      </pre>
      <p>
        The <code>falloff</code> controls the curvature of the depth ramp.{" "}
        <code>QUADRATIC</code> produces a slow build then fast finish — matching
        how real atmospheric scattering accumulates non-linearly. <code>LINEAR</code>{" "}
        gives even fade; <code>INVERSE_QUADRATIC</code> front-loads the haze and
        is useful for smoky indoor environments where visibility drops off fast.
      </p>
      <p className="mt-3">
        Crucially, the Mist pass values are computed by the renderer at bake time
        and stored in the multilayer EXR. Adjusting <code>mist.depth</code> after
        a render requires a re-render to update the Mist pass data. The Z pass,
        however, can be re-mapped in the Compositor with a Map Value node without
        re-rendering, giving it more flexibility for post adjustment.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Defocus node — matching camera parameters
      </h2>
      <p>
        The Compositor&apos;s Defocus node has one critical setting:{" "}
        <code>use_zbuffer</code>. When <code>True</code>, it expects the Z pass
        in world units and reads the active camera&apos;s{" "}
        <code>dof.focus_distance</code> directly. When <code>False</code>, it
        expects a normalised 0..1 depth map that you supply manually — useful
        if you want to use the Mist pass instead of the raw Z pass as the blur
        driver. Default is <code>True</code>.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`scene.use_nodes = True
tree  = scene.node_tree
nodes = tree.nodes
links = tree.links

rl = nodes.new("CompositorNodeRLayers")

defocus = nodes.new("CompositorNodeDefocus")
defocus.use_zbuffer = True   # expects Z pass in world units
defocus.f_stop      = 2.8    # must match camera dof.aperture_fstop
defocus.blur_max    = 24     # pixel cap; prevents infinite blur at z=0
defocus.quality     = "HIGH"
defocus.bokeh       = "LENS" # disc (fastest) or LENS (cinematic scatter)
defocus.scene       = scene  # links the node to the active camera's DOF data

# Wire Z pass → Defocus Z input, beauty → Defocus Image input
links.new(rl.outputs["Image"], defocus.inputs["Image"])
links.new(rl.outputs["Depth"], defocus.inputs["Z"])

# Camera must have DOF enabled with the same f_stop
cam = scene.camera
cam.data.dof.use_dof        = True
cam.data.dof.focus_distance = 5.0   # world units to the focus plane
cam.data.dof.aperture_fstop = 2.8   # same value as defocus.f_stop above`}
      </pre>
      <p>
        The <code>blur_max</code> parameter is the single most important
        safeguard. Without it, geometry at depth 0 (the camera origin) or at
        infinity (sky) produces a blur radius of ∞, causing the entire frame to
        become one blurred pixel. A value of 16–24 pixels for 1280×720 output is
        enough to show strong DOF without destroying fine detail in the frame.
      </p>
      <p className="mt-3">
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN Denoise &amp; Cycles Passes tutorial
        </Link>{" "}
        for the broader multi-pass compositing pipeline that this Defocus step
        slots into after the denoise stage.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Atmospheric fog mix
      </h2>
      <p>
        Once you have the defocused image, adding atmospheric haze is a single
        Mix node with the Mist pass as the factor:
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`# Fog colour node (matches the World background at the horizon)
fog_node = nodes.new("CompositorNodeRGB")
fog_node.outputs[0].default_value = (0.55, 0.62, 0.72, 1.0)  # cool blue-grey

# Mix node: Image = defocused beauty, Image_001 = fog colour, Fac = Mist pass
fog_mix = nodes.new("CompositorNodeMixRGB")
fog_mix.blend_type = "MIX"
fog_mix.use_clamp  = False  # allow HDR values through for later tonemapping

links.new(defocus.outputs["Image"],      fog_mix.inputs["Image"])
links.new(fog_node.outputs["RGBA"],      fog_mix.inputs["Image_001"])
links.new(rl.outputs["Mist"],            fog_mix.inputs["Fac"])

comp = nodes.new("CompositorNodeComposite")
links.new(fog_mix.outputs["Image"], comp.inputs["Image"])`}
      </pre>
      <p>
        Match the <code>fog_node</code> colour to the World background colour.
        When the sky is visible in the render, it will already be that colour,
        so distant geometry dissolving towards the same value looks seamless.
        If the sky is a different colour (overcast white vs. clear blue), adjust
        the fog colour to the horizon tint rather than the zenith.
      </p>
      <p className="mt-3">
        For a richer effect, replace the flat RGB node with a Gradient Texture
        node read from a screen-space height coordinate — or just use the Blender
        sky shader&apos;s horizon colour directly (you can sample it with a
        Camera Input node piped through a separate render pass). The simple flat
        fog colour is sufficient for environment previews.
      </p>
      <p className="mt-3">
        The colour grading approach for this stack is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-color-grading-rgb-curves-cdl"
          className={lk}
        >
          Compositor Colour Grading: RGB Curves &amp; CDL tutorial
        </Link>
        . Insert an RGB Curves node between the Fog Mix output and the Composite
        node to lift shadows and grade the haze colour without touching the
        materials.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why this is not the same as EEVEE volumetrics
      </h2>
      <p>
        EEVEE Next volumetric light and fog (covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-volumetric-light-cone"
          className={lk}
        >
          EEVEE Next Volumetric Light Cone tutorial
        </Link>
        ) produces physically-accurate scattering: light sources create visible
        god rays, light scatters off fog particles, and the colour varies with
        the angle between the camera and the light. Mist-pass fog does none of
        that — it is a flat depth-ramp to a solid colour. The advantages are:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>Zero render cost (the Mist pass is free in Cycles).</li>
        <li>
          The fog depth and colour can be changed after rendering, without a
          re-render, by adjusting the Mix node in the Compositor.
        </li>
        <li>
          It works identically in EEVEE and Cycles renders — the Mist pass is
          engine-agnostic.
        </li>
        <li>
          The visual result reads convincingly at small screen sizes and for
          environment mood shots where the subtlety of physical scattering would
          not be visible anyway.
        </li>
      </ul>
      <p className="mt-3">
        For WebXR environment scenes where you are generating preview images
        rather than real-time renders, mist-pass fog is the correct tool. For
        interactive runtime fog in Three.js use{" "}
        <code>THREE.FogExp2</code> on the scene, matching the depth at which the
        Blender Mist pass reaches 0.5 to the Three.js fog density.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Inspecting Z and Mist passes in the Compositor
      </h2>
      <p>
        Connect a <strong>Viewer</strong> node and Shift-click any socket to
        route it to the Viewer. The Z pass will look mostly black (most values
        are very small in camera-space), so add a Map Value node between the Z
        output and the Viewer with an <code>offset</code> of 0 and a{" "}
        <code>size</code> of <code>1/max_expected_depth</code>. For a scene where
        the far orb is at 9 world units, <code>size = 0.11</code> maps 9 units
        to approximately 1.0 in the Viewer (white = far).
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`# Quick Z-to-grey mapping for Viewer inspection
map_val = nodes.new("CompositorNodeMapValue")
map_val.offset = [0.0]
map_val.size   = [0.11]    # 1/9 world units
map_val.use_min = True
map_val.min     = [0.0]
map_val.use_max = True
map_val.max     = [1.0]

viewer = nodes.new("CompositorNodeViewer")
links.new(rl.outputs["Depth"],       map_val.inputs["Value"])
links.new(map_val.outputs["Value"],  viewer.inputs["Image"])`}
      </pre>
      <p>
        The Mist pass needs no remapping — it is already 0..1 and displays as
        a clean greyscale gradient directly on the Viewer.
      </p>
      <p className="mt-3">
        This inspection workflow is the same multi-pass debugging technique used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Compositor Glare, Film Grain &amp; Tonemapping tutorial
        </Link>
        , where the Viewer node is used to monitor individual passes before
        compositing them together.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Animating focus distance
      </h2>
      <p>
        Because the Defocus node reads <code>cam.data.dof.focus_distance</code>
        live, you can keyframe the focus distance on the camera and the Compositor
        will produce a rack-focus animation automatically on the next render:
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`cam = scene.camera

# Frame 1: focus on near orb (2.5 world units)
cam.data.dof.focus_distance = 2.5
cam.data.dof.keyframe_insert("focus_distance", frame=1)

# Frame 60: rack-focus to far orb (9.0 world units)
cam.data.dof.focus_distance = 9.0
cam.data.dof.keyframe_insert("focus_distance", frame=60)`}
      </pre>
      <p>
        A smooth ease-in on the <code>focus_distance</code> F-Curve (Bezier
        handles) produces the cinematic rack-focus feel. The Mist pass stays
        fixed across frames since it is geometry-bound, not camera-bound, so
        the fog remains consistent while the DOF shifts.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <strong>Defocus node produces a uniformly blurred frame.</strong>{" "}
          The Z pass is not wired to the Z input — only the Image is connected.
          Check that the Depth socket on the Render Layers node is linked to
          the Z input on the Defocus node, not the Image input.
        </li>
        <li>
          <strong>No blur at all.</strong> <code>use_zbuffer</code> is True but
          the camera&apos;s <code>dof.use_dof</code> is False. The Defocus node
          requires camera DOF to be enabled for its Z-buffer path to activate.
        </li>
        <li>
          <strong>Mist pass is a solid white frame.</strong>{" "}
          <code>mist.use_mist</code> was not set to True, or <code>mist.depth</code>{" "}
          is too small (all scene objects are beyond the mist depth and therefore
          at 1.0). Increase <code>mist.depth</code> or reduce <code>mist.start</code>.
        </li>
        <li>
          <strong>Silhouette fringing on near objects.</strong> This is the
          inherent limitation of compositor-side Defocus — the Z pass has no
          sub-pixel coverage information. Reduce <code>blur_max</code> to a
          smaller value, or enable the camera&apos;s own optical DOF in Cycles
          for the final render and skip the Compositor Defocus for that stage.
        </li>
        <li>
          <strong>Fog colour does not match the background sky.</strong> The
          World background colour and the <code>fog_node</code> RGBA are set
          independently. Read the background colour from
          <code>world.node_tree.nodes[&quot;Background&quot;].inputs[&quot;Color&quot;].default_value</code>{" "}
          and copy it into the fog node.
        </li>
        <li>
          <strong>Result looks identical in EEVEE and Cycles.</strong> The Mist
          pass is renderer-agnostic. The Defocus node operates on the final
          beauty pass regardless of renderer. Both should look identical by
          design.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/layers/passes.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Render Passes (Mist Pass)
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Authoritative reference for all
          standard passes including Mist, Z, Combined, and auxiliary data passes.
          Related projects:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>{" "}
          (source) and{" "}
          <a
            href="https://github.com/blender/blender-addons"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender-addons
          </a>{" "}
          (official add-ons including the EXR multi-layer pass exporter).
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/compositing/types/filter/defocus.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Compositor Defocus Node
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Full parameter reference for the
          Defocus node including bokeh modes, Z-buffer usage, and the
          gamma-correction flag. Related upstream:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.CompositorNodeDefocus.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.CompositorNodeDefocus API
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — the Python property names used in
          the blueprint differ slightly from the UI labels documented in the
          manual.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-compositor-mist-pass-z-depth-defocus-atmospheric",
  title:
    "Compositor: Mist Pass + Z-Depth Defocus — Atmospheric Depth of Field",
  description:
    "Chain the Z pass into a Compositor Defocus node for lens-accurate bokeh, then wire the Mist pass as a fog factor to dissolve distant geometry into a haze colour — all in post, without re-rendering.",
  published: "2026-06-28",
  topics: ["blender", "compositor", "rendering", "depth-of-field", "atmosphere"],
  body: Body,
});
