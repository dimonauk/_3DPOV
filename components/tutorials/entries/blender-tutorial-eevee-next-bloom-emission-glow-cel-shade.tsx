import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeNextBloomEmissionGlowCelShadeBody() {
  return (
    <>
      <p>
        In Blender 4.2 the old <strong>Bloom</strong> checkbox disappeared from
        Render Properties. EEVEE Next routes bloom through the{" "}
        <strong>Compositor</strong> instead — a Glare node set to{" "}
        <em>BLOOM</em> mode. This is not a regression; it is a precision
        upgrade. The old toggle bloomed every bright pixel uniformly and gave
        you no threshold control. The Glare node lets you set a luminance
        cutoff so that only emission faces — power cores, neon trim, VRM eye
        gleam — glow while cel-shade body flats stay clean.
      </p>
      <p className="mt-3">
        The <strong>Viewport Compositor</strong> (N panel → View → Compositor →
        Always) makes the bloom visible live in the 3D viewport at render-preview
        shading without pressing F12 at all. This means you can drag the
        threshold slider in the Compositor workspace and see the glow intensity
        change on the prop in real time — the exact feedback loop you need for
        stylised shading work.
      </p>
      <p className="mt-3">
        Compare this with the cel-shade base covered in the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE Toon Cel Shader tutorial
        </Link>{" "}
        and the broader Glare node usage in{" "}
        <Link href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping" className={lk}>
          Compositor Glare, Film Grain & Tonemapping
        </Link>
        . For the reflection side of EEVEE Next see{" "}
        <Link href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy" className={lk}>
          Screen-Space Ray Tracing: Graduated-Roughness Sphere Array
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why the Compositor, not a render toggle?
      </h2>
      <p>
        The old EEVEE bloom was applied after tone-mapping in a fixed post
        pipeline — you had no handle on it from the Compositor. Bloom via Glare
        runs <em>before</em> the Composite output node, so you can mix it with
        colour-grading passes, mask it with a Render Layer alpha, or scale its
        intensity with a driver without touching the material. That last trick
        matters here: the core emission strength is driven by a custom property
        so the glow pulses through a 60-frame cycle. The Glare node sees the
        changing brightness on each rendered frame and blooms accordingly — no
        separate bloom animation is needed.
      </p>
      <p className="mt-3">
        The threshold of <code>0.75</code> sits just above the luminance of the
        cel-shade body flat (≈ 0.7 in linear space at the chosen navy colour and
        point-light level). The trim faces at emission strength 1.5 and the core
        at 4.0–8.0 are well above threshold. Body never blooms. Trim blooms
        softly. Core blooms hard. A single threshold value divides three zones
        without any masking.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Setting up the Compositor chain
      </h2>
      <p>
        Enable compositing:{" "}
        <code>scene.use_nodes = True</code>. The default tree has a Render
        Layers node and a Composite node already wired. You add a Glare node
        between them:
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`scene.use_nodes = True
tree = scene.node_tree

rl    = tree.nodes["Render Layers"]
comp  = tree.nodes["Composite"]
glare = tree.nodes.new("CompositorNodeGlare")

glare.glare_type = "BLOOM"   # not SIMPLE, not GHOSTS — BLOOM mode
glare.quality    = "HIGH"
glare.threshold  = 0.75
glare.size       = 8         # 1–9, controls corona spread
glare.mix        = 0.80      # 0 = subtle tint, 1 = full additive

tree.links.new(rl.outputs["Image"],    glare.inputs["Image"])
tree.links.new(glare.outputs["Image"], comp.inputs["Image"])`}
      </pre>
      <p>
        The <code>mix</code> value at 0.80 is the ratio at which the bloomed
        signal is composited over the original. At 1.0 the glow is fully
        additive and bright emission will clip to pure white. At 0.5 it feels
        more like a subtle haze. For cel-shade the sweet spot is 0.7–0.85:
        bright enough to read at small screen sizes, not so bright that fine
        trim lines dissolve into a blobs.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Driving bloom intensity from a custom property
      </h2>
      <p>
        Rather than keyframe the Glare node parameters (which are not directly
        driveable), we animate the emission strength on the core material. The
        Glare node reacts automatically because a brighter emission pixel exceeds
        threshold by a larger margin and spreads further.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`# Add a custom property to the mesh data-block
prop.data["pulse"] = 0.0

# Animate it — cosine ease 0→1 over 60 frames
for frame in range(1, 61):
    t = (frame - 1) / 59.0
    prop.data["pulse"] = 0.5 - 0.5 * math.cos(math.pi * t)
    prop.data.keyframe_insert(data_path='["pulse"]', frame=frame)

# Driver on core emission strength
emit_input = mat_core.node_tree.nodes["Emission"].inputs["Strength"]
drv = emit_input.driver_add("default_value").driver
drv.type = "SCRIPTED"
var = drv.variables.new()
var.name      = "pulse"
var.type      = "SINGLE_PROP"
var.targets[0].id_type   = "MESH"
var.targets[0].id        = prop.data
var.targets[0].data_path = '["pulse"]'
drv.expression = "4.0 + pulse * 4.0"   # 4→8 over the animation`}
      </pre>
      <p>
        This pattern is explored in detail in the{" "}
        <Link href="/tutorials/blender-tutorial-animation-drivers-parametric-shader" className={lk}>
          Animation Drivers: Parametric Shader tutorial
        </Link>
        . Here we reuse it to decouple the animation curve (on the mesh
        property) from the material (the driver consumer) so either side can
        be changed independently.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Viewport Compositor — live bloom without F12
      </h2>
      <p>
        In a headed Blender session, open the N panel in the 3D viewport (
        <code>N</code> key), select the <strong>View</strong> tab, and set{" "}
        <strong>Compositor</strong> to <em>Always</em>. Switch viewport shading
        to <strong>Rendered</strong> (<code>Z</code> → 4). The Glare node runs
        on every viewport redraw. You will see the core glow pulse in real time
        as you scrub the timeline.
      </p>
      <p className="mt-3">
        This is set programmatically per{" "}
        <code>SpaceView3D</code> in a headed context:{" "}
        <code>bpy.context.space_data.shading.use_compositor = &apos;ALWAYS&apos;</code>.
        The blueprint saves the .blend with this setting active so it persists
        when Dimona opens the file.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Material construction — three zones, one threshold
      </h2>
      <p>
        The prop has three material slots assigned by Z-height of each face
        centre:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>
          <strong>mat_body</strong> — pure Diffuse BSDF, deep navy. Luminance ≈
          0.08 in linear. Always below threshold; never blooms.
        </li>
        <li>
          <strong>mat_trim</strong> — Emission node mixed with Diffuse via Light
          Path Is Camera Ray. Emission strength 1.5, cyan. Luminance after
          EEVEE evaluation ≈ 1.35. Blooms softly.
        </li>
        <li>
          <strong>mat_core</strong> — same pattern, amber, strength 4–8. Blooms
          strongly; corona radiates into the surrounding trim band.
        </li>
      </ul>
      <p className="mt-3">
        The Light Path trick — mixing Emission into the shader only when the
        ray is a camera ray — means the emission drives bloom but does not
        illuminate nearby surfaces (which would look wrong on a cel-shaded
        prop). Point lights handle diffuse fill separately.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export and WebXR runtime bloom
      </h2>
      <p>
        Bloom is a render-time effect; it does not bake into the GLB. What
        exports is the emission colour and strength via the{" "}
        <code>KHR_materials_emissive_strength</code> glTF extension (values
        above 1.0). In Three.js, add{" "}
        <code>UnrealBloomPass</code> to your <code>EffectComposer</code> and
        set its <code>threshold</code> to match the Blender Glare threshold
        (0.75). Three.js bloom then responds to the same emission factors that
        drove bloom in Blender, keeping the look consistent across render and
        runtime.
      </p>
      <p className="mt-3">
        The GLB export flag{" "}
        <code>export_gltf_extensions = True</code> is required for
        KHR_materials_emissive_strength to be written. Without it, emission
        values above 1.0 are silently clamped. See the Khronos spec at{" "}
        <a
          href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KHR_materials_emissive_strength
        </a>{" "}
        (CC-BY-4.0, Khronos Group). Related: glTF-Blender-IO at{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/KhronosGroup/glTF-Blender-IO
        </a>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <strong>No bloom visible in viewport.</strong> Check that the
          Compositor is set to <em>Always</em> in the N-panel View tab and that
          shading mode is Rendered.
        </li>
        <li>
          <strong>Bloom covers the whole mesh.</strong> Threshold is too low.
          Raise it until body flats no longer glow — target just above the body
          luminance (use the Viewer node + histogram in the Compositor to
          measure it).
        </li>
        <li>
          <strong>Pulsing driver not animating.</strong> Check the driver
          expression — custom-property paths need double-bracket notation:{" "}
          <code>data_path = &apos;[&quot;pulse&quot;]&apos;</code>. Verify the
          mesh data-block (not the object) holds the property.
        </li>
        <li>
          <strong>GLB emission clamped to white in Three.js.</strong> Confirm
          <code>export_gltf_extensions = True</code> was set, then inspect the
          exported GLB JSON for the{" "}
          <code>KHR_materials_emissive_strength</code> extension block. Three.js
          r150+ supports it natively.
        </li>
        <li>
          <strong>F12 render looks different from viewport.</strong> The
          Viewport Compositor uses a lower-quality approximation. For final
          renders, increase Glare quality to <em>HIGH</em> and render via F12
          or the record.py script.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/compositing/types/filter/glare.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Compositor Glare Node
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Authoritative reference for all
          Glare modes including BLOOM. Related:{" "}
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
            href="https://docs.blender.org/manual/en/5.1/render/eevee/render_settings/performance.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — EEVEE Next Viewport Compositor
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Documents the{" "}
          <em>use_compositor</em> SpaceView3D flag and its quality trade-offs
          vs a full render.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KHR_materials_emissive_strength (Khronos Group)
          </a>{" "}
          (CC-BY-4.0). Specification for emission values &gt; 1.0 in glTF.
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
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
        title: "Run blueprint.py in the Scripting workspace",
        body: "Open Blender 5.1. Scripting workspace → Open blueprint.py → Run Script. A faceted gem prop appears: dark navy body, cyan trim band, amber core cluster.",
      },
      {
        title: "Open the Compositor workspace",
        body: "Switch to the Compositor workspace (top header). Tick 'Use Nodes'. Verify the chain: Render Layers → Glare (BLOOM, threshold 0.75, size 8, mix 0.80) → Composite + Viewer.",
      },
      {
        title: "Enable the Viewport Compositor",
        body: "In the 3D Viewport press N → View tab → Compositor → Always. Switch shading to Rendered (Z → 4). Cyan trim and amber core now glow in the viewport without pressing F12.",
      },
      {
        title: "Adjust bloom threshold live",
        body: "In the Compositor workspace, select the Glare node. Drag Threshold from 0.75 down to 0.40: the body flats start to bloom. Back to 0.75: body clean, emission zones glow. This is the calibration step for every cel-shade prop.",
      },
      {
        title: "Play the pulse animation",
        body: "Back in 3D Viewport (Rendered, Compositor Always). Press Space. The core pulses amber from emission 4.0 → 8.0 via the 'pulse' custom property driver. Bloom corona grows and shrinks with the emission strength. Watch for 2 loops.",
      },
      {
        title: "Inspect the driver",
        body: "Select the prop → Properties → Object Data → Custom Properties: 'pulse' 0–1. Right-click → Edit Driver. Expression: 4.0 + pulse * 4.0. Targets the mesh data-block custom property via SINGLE_PROP variable.",
      },
      {
        title: "Check GLB emission extension",
        body: "Open a terminal. Run: python -c \"import json,zipfile; z=zipfile.ZipFile('power_core_prop.glb'); data=json.loads(z.read('model.gltf')); print([m.get('extensions') for m in data['materials']])\". Confirm KHR_materials_emissive_strength is present with strength > 1.0.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Scripting workspace → Open record.py → Run Script. Renders 60 frames of the pulsing prop at 1280×720 with compositor bloom active, encodes to public/library/videos/rendering/eevee-next-bloom-emission-glow-cel-shade/viewport.mp4 via ffmpeg.",
      },
      {
        title: "Record screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Three takes: bloom off/on comparison; pulse playback; Compositor node walkthrough. Save to public/library/videos/rendering/eevee-next-bloom-emission-glow-cel-shade/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-eevee-next-bloom-emission-glow-cel-shade",
    title:
      "EEVEE Next — Bloom via Compositor: Emission Threshold Glow for Cel-Shade Props (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "EEVEE Next removed the Bloom render toggle — bloom now lives in the Compositor as a Glare node (BLOOM mode). Set threshold 0.75 above cel-body luminance so only emission faces glow; enable the Viewport Compositor for live bloom feedback; drive core emission 4→8 with a custom property to pulse the glow; export emission strength via KHR_materials_emissive_strength for Three.js WebXR runtime bloom.",
    Body: EeveeNextBloomEmissionGlowCelShadeBody,
  },
);
