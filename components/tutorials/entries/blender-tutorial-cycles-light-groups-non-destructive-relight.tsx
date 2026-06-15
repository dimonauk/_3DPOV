import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CyclesLightGroupsBody() {
  return (
    <>
      <p>
        Cycles Light Groups are a Blender 4.0+ feature that partitions a scene&rsquo;s
        lights into named colour channels. Every group renders concurrently during the
        same pass, and the resulting EXR embeds one full-HDR layer per group. The
        Compositor then mixes those layers with per-group Gamma or Hue-Saturation nodes —
        relighting the entire scene without spending a single additional sample.
      </p>
      <p className="mt-3">
        The EXR workflow here extends the{" "}
        <Link href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr" className={lk}>
          Cryptomatte + multilayer EXR tutorial
        </Link>{" "}
        (per-object masking in the same file format) and pairs with{" "}
        <Link href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes" className={lk}>
          OIDN denoising across Cycles render passes
        </Link>
        . Note: Light Groups are{" "}
        <strong>Cycles-only</strong> — see the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy" className={lk}>
          EEVEE Next SSR tutorial
        </Link>{" "}
        for the rasterisation counterpart where this technique does not apply. The gem
        material here uses the same sapphire-IOR Principled BSDF as the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
          iridescent transmission tutorial
        </Link>
        , and the post-processing node graph extends the colour science from{" "}
        <Link href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping" className={lk}>
          the cinematic compositing pipeline
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why Light Groups? — the re-render cost argument
      </h2>
      <p>
        Re-rendering is correct when light <em>position</em> or <em>shadow shape</em> must
        change — those are geometry-dependent and cannot be composed away. Light Groups are
        correct when only <em>intensity</em>, <em>hue</em>, or <em>relative balance</em>{" "}
        changes. A single 512-sample render at 1280&times;720 costs roughly 40&thinsp;s on
        a modern CPU. Twelve lighting variants delivered via compositor mixing still cost
        40&thinsp;s — not 480&thinsp;s. For a studio that iterates rapidly on mood and
        atmosphere before locking a shot, that ratio compounds quickly.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Data model — where Light Groups live
      </h2>
      <p>
        Light Groups belong to the <strong>View Layer</strong>, not the Scene. Each view
        layer tracks its own partition independently, so a multi-layer project can give each
        layer a completely different lighting rig without duplicating light objects. The
        assignment on the light side lives on the <strong>Object</strong> data-block
        (<code>obj.lightgroup</code>), not on the Light data-block — this is intentional
        and occasionally surprising.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Add a light group to the active view layer
view_layer = bpy.context.view_layer
lg      = view_layer.lightgroups.add()
lg.name = "neon_left"   # name must match obj.lightgroup exactly

# Create the light and assign it to the group
ldata         = bpy.data.lights.new("Light_neon_left", "AREA")
ldata.energy  = 90.0
ldata.color   = (0.12, 0.38, 1.00)   # cool blue, linear sRGB

lobj          = bpy.data.objects.new("Light_neon_left", ldata)
lobj.lightgroup = "neon_left"         # THIS goes on the Object, not ldata

bpy.context.collection.objects.link(lobj)`}</pre>
      <p className="mt-3 text-sm">
        A mistyped <code>lightgroup</code> string silently excludes the light from all
        groups. It still contributes to the <em>Combined</em> pass, so the final image
        looks correct — the mistake only reveals itself when you inspect the per-group
        EXR layer and find it solid black.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Denoiser interaction — why it must be off
      </h2>
      <p>
        Blender&rsquo;s integrated OIDN and OptiX denoisers merge all light contributions
        back into a single accumulated colour <em>before</em> the per-group decomposition
        step. Enabling the denoiser therefore collapses your carefully isolated groups into
        one inseparable pass. The workaround is to leave <code>scene.cycles.use_denoising
        = False</code> for the main render and then connect a{" "}
        <strong>Denoise compositor node</strong> to each group output individually — that
        node accepts the <em>Albedo</em> and <em>Normal</em> passes from the RLayers node
        and applies OIDN in compositing space, after the group isolation has already
        happened.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# In the compositor — per-group denoising approach:
#
# RLayers.neon_left ──────────────────────────────┐
# RLayers.Denoising Normal ──► [Denoise node] ────►  [Gamma: neon_left] ──►
# RLayers.Denoising Albedo ──┘
#
# Repeat for each group. This preserves group isolation while removing Cycles
# fireflies from each channel independently before the additive mix.
#
# Enable the Albedo and Normal denoising passes in View Layer Properties:
bpy.context.view_layer.cycles.denoising_store_passes   = True
bpy.context.view_layer.cycles.use_pass_denoising_normal = True
bpy.context.view_layer.cycles.use_pass_denoising_albedo = True`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Compositor mixing — additive is the correct operator
      </h2>
      <p>
        Light group passes are HDR linear light contributions. They must be combined with
        additive addition — <em>not</em> Screen, Overlay, or Multiply. Those blend modes
        introduce non-linear cross-channel behaviour that distorts highlights and makes the
        composite differ from a single full-scene render. The Mix (ADD) node with factor
        1.0 is mathematically equivalent to summing the two linear HDR buffers.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Compositor tree — three groups → additive chain → Composite
#
# [RLayers]
#   └─ "neon_left"  → [Gamma: fac=1.0] ─┐
#   └─ "neon_right" → [Gamma: fac=1.0] ─┼──► [Mix ADD] ──► [Mix ADD] ──► [Composite]
#   └─ "ceiling"    → [Gamma: fac=1.0] ──────────────────────────────┘
#
# Setting any Gamma input to 0.0 mutes that group completely.
# Setting it above 1.0 overbightens — useful for testing exposure ceilings.
# To remap colour, insert a Hue-Saturation node between Gamma and Mix:
#   [Gamma] → [Hue-Sat] → [Mix ADD]

mix1 = tree.nodes.new("CompositorNodeMixRGB")
mix1.blend_type = "ADD"
mix1.inputs[0].default_value = 1.0   # factor=1: full contribution from both inputs`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        EXR socket names in Blender 5.1
      </h2>
      <p>
        The output socket names on the Render Layers compositor node match the light group
        names exactly. The sockets are dynamically generated: they do not appear in the
        compositor until the first render triggers a view layer update. On the first run
        of <code>blueprint.py</code>, the <code>if gname in rl.outputs</code> guard
        prevents a <code>KeyError</code>; after pressing F12, re-open the compositor and
        the sockets are present for manual wiring.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# After F12, the RLayers node has:
#   "Image"       → Combined (all lights summed, including ungrouped lights)
#   "neon_left"   → blue area light contribution only
#   "neon_right"  → pink area light contribution only
#   "ceiling"     → white overhead contribution only
#
# Any light with obj.lightgroup = "" (empty) contributes ONLY to "Image",
# not to any group layer — useful for "always-on" bounce cards you don't
# want to relight but also don't want missing from the combined pass.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>A group&rsquo;s EXR layer is solid black.</strong> Check{" "}
          <code>obj.lightgroup</code> on the light object. Mismatched case or a trailing
          space is the most common cause. The group name is case-sensitive.
        </li>
        <li>
          <strong>No light group sockets appear on the Render Layers node.</strong>{" "}
          The compositor hasn&rsquo;t refreshed yet. Press F12 to render once, then return
          to the compositor. The sockets appear automatically.
        </li>
        <li>
          <strong>Render engine warning: &ldquo;Light Groups not supported.&rdquo;</strong>{" "}
          Switch from EEVEE to Cycles in Render Properties. Light Groups are a path-tracing
          feature only.
        </li>
        <li>
          <strong>Denoiser makes all group layers identical.</strong> The denoiser is merging
          contributions before decomposition. Set{" "}
          <code>scene.cycles.use_denoising = False</code> and apply denoising per-group in
          the compositor using the Denoise node.
        </li>
        <li>
          <strong>Group layers don&rsquo;t add up to the Combined pass.</strong> Lights with
          empty <code>lightgroup</code> contribute only to Combined. Assign every light to a
          group if you want the sum of all group layers to equal Combined.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/cycles/render_settings/light_groups.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Cycles Light Groups
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Panel location, per-light
          assignment workflow, compositor integration, EXR layer naming. Related:{" "}
          <a
            href="https://www.blender.org/download/releases/4-0/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender 4.0 release notes
          </a>{" "}
          where Light Groups were introduced.
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.ViewLayerLightgroup.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Python API &mdash; ViewLayerLightgroup
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Foundation. <code>name</code>,{" "}
          <code>use_custom_lightgroup</code> properties; collection access via{" "}
          <code>ViewLayer.lightgroups</code>. Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.Object.html#bpy.types.Object.lightgroup"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Object.lightgroup
          </a>{" "}
          (the per-object assignment field).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/rendering/cycles-light-groups-non-destructive-relight",
    time: "thirty minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor (run blueprint.py)",
        "View Layer Properties → Light Groups panel",
        "Light Properties → Light Group field (per light object)",
        "Render Properties → Engine: Cycles, Samples",
        "Compositing workspace — Render Layers node, Gamma node, Mix (ADD) node",
        "Image Editor — Render Result (inspect per-group EXR layers)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. The scene builds: faceted gem on octagonal pedestal, three area lights, Cycles at 64 samples.",
      },
      {
        title: "Inspect the Light Groups panel",
        body: "View Layer Properties (scene-layer icon) → Light Groups section. Three groups are listed: neon_left, neon_right, ceiling. Each Light object's Properties → Object Properties → Light Group field shows the assignment.",
      },
      {
        title: "Confirm light assignments",
        body: "Select Light_neon_left in the Outliner. Object Properties → Light Group field reads 'neon_left'. Repeat for the other two. An empty field here means the light contributes only to the Combined pass.",
      },
      {
        title: "Press F12 to render",
        body: "Cycles renders at 64 samples (≈ 5–15 s on CPU). The Render Result window shows the combined image. The EXR is saved to output/relight_scene0001.exr.",
      },
      {
        title: "Open the compositor and inspect sockets",
        body: "Switch to the Compositing workspace. The Render Layers node now has output sockets: Image, neon_left, neon_right, ceiling. These appeared after the first render. The Gain nodes are wired to each group output.",
      },
      {
        title: "Relight without re-rendering",
        body: "Set the Gamma input on Gain: neon_left from 1.0 to 0.0. The blue light disappears from the composite preview instantly — no re-render. Drag it back. Set Gain: neon_right Gamma to 2.0 — the pink overbightens. This is the non-destructive relight.",
      },
      {
        title: "Add a Hue-Saturation node to recolour",
        body: "Add a Hue-Saturation node (Shift+A → Colour → Hue Saturation Value) between Gain: neon_left and the first Mix ADD node. Rotate the Hue slider — the blue neon becomes purple, then green, without touching the scene or re-rendering.",
      },
      {
        title: "Run record.py",
        body: "Scripting workspace → open record.py → Run Script. Renders a 120-frame viewport animation: ceiling fades in F1–30, blue neon builds F30–60, pink builds F60–90, gem rotates 360° F90–120. Output: public/library/videos/rendering/cycles-light-groups-non-destructive-relight/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "A group's EXR layer is solid black",
        cause:
          "The light object's lightgroup field doesn't match the group name exactly — case-sensitive, no trailing spaces.",
        fix: "Select the light → Object Properties → Light Group field. Confirm it matches the View Layer group name character-for-character. Re-render.",
      },
      {
        symptom: "No group sockets on the Render Layers node",
        cause:
          "The compositor refreshes its socket list on the first render, not at scene setup time.",
        fix: "Press F12 to render once (even at 1 sample). Return to the compositor. The group sockets now appear on the RLayers node.",
      },
      {
        symptom: "Group layers don't sum to the Combined pass",
        cause:
          "One or more lights have an empty lightgroup field and contribute only to Combined.",
        fix: "Assign every light to a named group if you want complete group-layer decomposition. Lights with empty lightgroup are always in Combined only.",
      },
      {
        symptom: "Denoiser makes all group layers look identical",
        cause:
          "The integrated Cycles denoiser merges contributions before per-group decomposition.",
        fix: "Set scene.cycles.use_denoising = False. Apply the Denoise compositor node to each group output individually, feeding it the RLayers Albedo and Normal denoising passes.",
      },
    ],
    finalResult:
      "A Cycles scene with three named light groups (neon_left cool-blue, neon_right warm-pink, ceiling neutral-white), a 64-sample render producing a multilayer EXR with one HDR layer per group, and a compositor tree with per-group Gamma controls that delivers twelve lighting variants — all without re-rendering. A 120-frame viewport animation shows the timed lighting reveal and gem rotation.",
  },
  {
    slug: "blender-tutorial-cycles-light-groups-non-destructive-relight",
    title:
      "Cycles Light Groups — Non-Destructive Studio Relighting (Blender 5.1)",
    date: "2026-06-15",
    kind: "tutorial",
    excerpt:
      "Blender 5.1's Cycles Light Groups render each named light partition as a separate HDR EXR layer. Assign three area lights (cool blue, warm pink, neutral white) to named groups, render once, then relight the entire scene via compositor Gamma nodes — zero re-renders needed for intensity, hue, or balance changes.",
    Body: CyclesLightGroupsBody,
  },
);
