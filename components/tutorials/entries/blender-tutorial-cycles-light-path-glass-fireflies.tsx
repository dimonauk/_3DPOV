import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CyclesLightPathGlassFirefliesBody() {
  return (
    <>
      <p>
        A firefly is a single pixel that glows twenty times brighter than its
        neighbours.  It is physically valid — some ray paths genuinely carry
        enormous energy — but it is statistically catastrophic, because it
        takes roughly one million samples to average that outlier down to an
        invisible contribution.  Glass objects produce fireflies more than
        almost any other material, because a path that enters glass, bends,
        reflects internally, exits, and then strikes a diffuse surface has
        multiplied together the transmission BSDF, the internal reflection
        BSDF, and the transmission BSDF again — each less than one, but their
        product amplifies variance exponentially on the rare paths that
        converge near the caustic focal point.  Blender&apos;s Cycles has
        four separate controls for this problem, and most artists find them
        buried in properties panels and never touch them.  The
        sharpest tool among them is the{" "}
        <strong>Light Path node</strong> in the shader editor, which exposes
        ray type as a field you can route like any other BSDF input.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Light Path node — a ray-tracing lens
      </h2>
      <p>
        Every path in Cycles carries a label describing what kind of ray it is
        at that bounce.  The Light Path node reads those labels as Boolean or
        integer outputs you can feed into Mix Shaders, Math nodes, or any
        socket that accepts a float.  The outputs you will use most often:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <code>Is Camera Ray</code> — the path started at the camera (first
          bounce).  Useful for hiding objects from the camera while keeping
          them in reflections (e.g., environment cards).
        </li>
        <li>
          <code>Is Shadow Ray</code> — the path is evaluating whether a
          surface point is occluded from a light source.  This is the key
          output for the firefly fix.
        </li>
        <li>
          <code>Is Diffuse Ray</code> — the path scattered diffusely on a
          previous bounce.  Use this to make a material invisible in indirect
          diffuse (useful for glass that would otherwise contribute colour to
          nearby surfaces twice).
        </li>
        <li>
          <code>Is Reflection Ray</code> and{" "}
          <code>Is Transmission Ray</code> — specular reflection vs
          refraction.  Separate glass lobe for each: e.g., tinted transmission
          but clear reflection.
        </li>
        <li>
          <code>Ray Depth</code> (integer) — total bounces so far.  Clamp an
          expensive SSS material to depth&nbsp;0 only (camera rays) to avoid
          paying the SSS cost on shadow and bounce paths.
        </li>
        <li>
          <code>Transmission Depth</code> — refractive bounces so far.
          Fade a tint to zero after two glass crossings to avoid unrealistic
          colour stacking through nested glass objects.
        </li>
      </ul>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`lpath = nt.nodes.new("ShaderNodeLightPath")
# Outputs (all FLOAT, Boolean outputs are 0.0 / 1.0):
#   lpath.outputs["Is Camera Ray"]
#   lpath.outputs["Is Shadow Ray"]      ← the firefly fix
#   lpath.outputs["Is Diffuse Ray"]
#   lpath.outputs["Is Glossy Ray"]
#   lpath.outputs["Is Reflection Ray"]
#   lpath.outputs["Is Transmission Ray"]
#   lpath.outputs["Is Volume Scatter Ray"]
#   lpath.outputs["Is Singular Ray"]    ← Dirac-delta BSDF (ideal mirror)
#   lpath.outputs["Ray Depth"]          ← INT total bounces
#   lpath.outputs["Diffuse Depth"]
#   lpath.outputs["Glossy Depth"]
#   lpath.outputs["Transparent Depth"]  ← alpha shadow bounces (NOT glass)
#   lpath.outputs["Transmission Depth"] ← refractive glass bounces
#   lpath.outputs["Volume Depth"]
#   lpath.outputs["Total Depth"]        ← Ray Depth + Transparent Depth`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Is Shadow Ray switch
      </h2>
      <p>
        The fix is a single Mix Shader node whose Factor socket receives the
        &ldquo;Is Shadow Ray&rdquo; output:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# Principled BSDF — full transmission glass
pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
pbsdf.inputs["IOR"].default_value                 = 1.517   # BK7 glass
pbsdf.inputs["Transmission Weight"].default_value = 1.0
pbsdf.inputs["Roughness"].default_value           = 0.0

# Transparent BSDF — acts like air (no refraction, no Fresnel)
transp = nt.nodes.new("ShaderNodeBsdfTransparent")
transp.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)

# Light Path + Mix
lpath = nt.nodes.new("ShaderNodeLightPath")
mix   = nt.nodes.new("ShaderNodeMixShader")

# Factor = 0 for camera / reflection / transmission rays → Principled glass
# Factor = 1 for shadow rays → Transparent (no caustic variance)
nt.links.new(lpath.outputs["Is Shadow Ray"], mix.inputs["Fac"])
nt.links.new(pbsdf.outputs["BSDF"],          mix.inputs[1])
nt.links.new(transp.outputs["BSDF"],         mix.inputs[2])`}</pre>
      <p className="mt-3">
        What this does in practice: when Cycles fires a shadow ray at the glass
        prism to determine whether a floor point is in shadow, the glass
        behaves as if it were not there — the shadow ray passes straight
        through.  The floor receives full illumination under the prism and
        casts a soft, hazy shadow rather than a sharp caustic concentration.
        From the camera, nothing changes: the prism still refracts, still
        shows Fresnel glints at its edges, still has the correct IOR-shaped
        distortion of the background.  The two ray types — shadow and
        camera — simply never execute the same BSDF branch.
      </p>
      <p className="mt-2">
        The tradeoff is realism.  A real glass object does cast a caustic.
        The Is Shadow Ray trick produces a plausible result that reads as
        glass without requiring tens of thousands of samples.  For
        architectural visualisation or product photography where caustic
        accuracy matters, use{" "}
        <code>scene.cycles.caustics_refractive = True</code> and raise{" "}
        <code>samples</code> to 1024+.  For game assets, WebXR, and studio
        library pieces where the output is a GLB (no Cycles at runtime), the
        trick is free — the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
          Principled BSDF Transmission
        </Link>{" "}
        parameters export faithfully via{" "}
        <code>KHR_materials_transmission</code> regardless of what the Light
        Path node does in the shader editor.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Bounce budget — transmission vs transparent
      </h2>
      <p>
        Cycles tracks two separate depth counters for glass-like paths, and
        they are not interchangeable:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <code>transmission_bounces</code> — counts refractive crossings
          through closed surfaces (each enter/exit pair is two bounces).
          Four nested glass objects need at least eight transmission bounces.
          The default in Blender is 12, which is generous for most scenes.
        </li>
        <li>
          <code>transparent_max_bounces</code> — counts alpha-shadow accumulation.
          Alpha transparency (e.g., a leaf texture) is a different code path
          from glass refraction.  Transparent BSDF uses this counter, not
          <code>transmission_bounces</code>.  This matters because the
          Is Shadow Ray trick routes shadow rays through Transparent BSDF,
          so if you have many overlapping glass objects (all using the trick),
          the transparent bounce counter limits how many of them a shadow
          ray can pass.  Keep it at 16 or above.
        </li>
      </ul>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`scene.cycles.max_bounces             = 12  # total path length ceiling
scene.cycles.transmission_bounces    = 8   # refractive glass crossings
scene.cycles.transparent_max_bounces = 16  # alpha / Transparent BSDF
scene.cycles.diffuse_bounces         = 4
scene.cycles.glossy_bounces          = 4`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Clamp — the statistical safety net
      </h2>
      <p>
        Even with the Is Shadow Ray trick, some variance remains from
        glossy-to-transmission paths.  The clamp settings cap the per-sample
        radiance contribution before it enters the running mean:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`scene.cycles.use_clamp_direct   = True
scene.cycles.clamp_direct       = 8.0   # direct illumination ceiling
scene.cycles.use_clamp_indirect = True
scene.cycles.clamp_indirect     = 4.0   # indirect bounce ceiling`}</pre>
      <p className="mt-3">
        A value of 8.0 for direct means any sample whose direct-light
        contribution exceeds 8.0 is clipped to 8.0.  This violates energy
        conservation, but the error is localised to high-variance paths that
        would require enormous sample counts to converge anyway.  The
        perceptual impact is negligible in most scenes — the clipped energy
        was on paths the eye couldn&apos;t statistically separate from noise
        at reasonable sample counts.  Raise the ceiling if you are rendering
        HDR light sources or chrome next to very bright emitters where clipping
        would flatten the specular peaks.  The{" "}
        <Link href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr" className={lk}>
          Compositor Nodes tutorial
        </Link>{" "}
        covers using Cryptomatte to isolate the glass object and apply a
        separate Glare node — an alternative to clamp that adds bloom without
        destroying energy information.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Per-object ray visibility
      </h2>
      <p>
        Sometimes the shader-level approach is not granular enough.  Blender
        exposes per-object visibility toggles for each ray type via
        <code>object.visible_*</code> properties.  These complement the Light
        Path node by hiding objects entirely from specific ray passes:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`prism.visible_camera         = True   # seen by camera rays
prism.visible_shadow         = False  # casts no shadow at all
prism.visible_diffuse        = True   # contributes to indirect diffuse
prism.visible_glossy         = True   # appears in specular reflections
prism.visible_transmission   = True   # appears behind other glass
prism.visible_volume_scatter = True   # visible in volumetric media`}</pre>
      <p className="mt-3">
        Setting <code>visible_shadow = False</code> is a nuclear option — the
        glass casts no shadow at all.  The Is Shadow Ray mix trick is more
        surgical: the glass still causes a soft diffused shadow (via the
        Transparent BSDF), just not a sharp caustic.  Use{" "}
        <code>visible_shadow = False</code> only when the glass is decorative
        and its shadow would never be noticed (small gems embedded in a
        character mesh, for example, where the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE toon shader
        </Link>{" "}
        is used instead of Cycles).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Shadow catcher floor and GLB export
      </h2>
      <p>
        The blueprint places a flat plane beneath the prism and marks it{" "}
        <code>is_shadow_catcher = True</code>.  In Cycles Rendered mode, the
        shadow catcher receives shadows and reflections from objects in the
        scene, but its own material is replaced with a fully transparent fill
        when the image is composited — you see only the shadow, not the grey
        plane.  This is the standard technique for placing CG objects on
        real-world footage or transparent-background product shots.
      </p>
      <p className="mt-2">
        For GLB export, the shadow-catcher flag is stripped — glTF 2.0 has no
        concept of a shadow catcher.  The floor exports as an ordinary plane.
        The{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          texture baking tutorial
        </Link>{" "}
        covers baking the shadow as a diffuse texture onto the floor plane,
        which can then be exported as a KHR_materials_unlit shadow-decal mesh
        — a practical workaround for WebXR scenes in the{" "}
        <Link href="/atelier" className={lk}>
          Atelier viewer
        </Link>
        .
      </p>
      <p className="mt-2">
        The glass material itself exports cleanly:{" "}
        <code>Transmission Weight = 1.0</code> and{" "}
        <code>IOR = 1.517</code> map directly to the{" "}
        <code>KHR_materials_transmission</code> extension, which Three.js
        r155+ renders with physically-based transmission.  The Light Path node
        is Cycles-only and is silently discarded by the exporter.  WebXR
        renderers have no caustic problem because they use rasterisation, not
        path tracing, so no firefly suppression is needed at runtime.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-cycles-light-path-glass-fireflies",
  title: "Cycles — Light Path Node: Glass Without Fireflies",
  date: "2026-06-11",
  kind: "tutorial",
  excerpt:
    "Cycles path tracing: the Light Path node outputs explained (Is Shadow Ray, Is Camera Ray, Transmission Depth), the Is Shadow Ray mix trick to suppress refractive caustic fireflies, bounce budget settings, clamp_direct/indirect, per-object ray visibility, and KHR_materials_transmission GLB export. Blender 5.1.",
  Body: CyclesLightPathGlassFirefliesBody,
};

export const entry = buildInstructable(
  {
    time: "one session (1–1.5 hours)",
    difficulty: "advanced",
    blenderVersion: "5.1",
    libraryPath: "public/library/blends/rendering/cycles-light-path-glass-fireflies/",
    cost: "free — Blender 5.1, Cycles (CPU or GPU)",
    prerequisites: [
      "Comfortable opening the Shader Editor and connecting nodes",
      "Know what a BSDF is and why Roughness matters",
      "Familiar with Cycles vs EEVEE render engine selection",
    ],
    supplies: {
      materials: [
        "Blender 5.1 (Cycles renderer — any build, CPU or GPU)",
        "blueprint.py from public/library/blends/rendering/cycles-light-path-glass-fireflies/",
      ],
      tools: [
        "Shader Editor",
        "Properties › Render › Sampling › Light Paths",
        "Properties › Object Properties › Visibility",
        "3D Viewport › Rendered shading mode (Z → Rendered)",
        "Scripting workspace",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and inspect the scene",
        body: `Open Blender 5.1. Switch to the Scripting workspace.
Open blueprint.py and click Run Script.

The script creates:
  • crystal_prism — an octagonal glass prism, 0.40 m radius × 1.10 m tall, with a 35 mm bevel on the top and bottom edge rings.
  • floor — a shadow-catcher plane beneath the prism.
  • sun — a Sun lamp at 38° elevation, 0.5° angular diameter (near-point source).

Switch to the Layout workspace. Press Z → Rendered to enter Cycles Rendered mode.
The viewport begins progressive sampling. At ~16 samples you will see the glass refracting the background. At this sample count you may see faint fireflies on the floor — bright speckled pixels near the prism base.

These are caustic paths: light entered the glass, bent, reflected internally, and emerged concentrated onto a small floor area.`,
      },
      {
        title: "Open the Shader Editor and locate the Light Path node",
        body: `Select the crystal_prism object (left-click). Switch an editor area to the Shader Editor (Shift+F3 or the header dropdown).

You will see the material node tree: a ShaderNodeLightPath on the left, a ShaderNodeBsdfPrincipled above and a ShaderNodeBsdfTransparent below, a Mix Shader in the middle, and a Material Output on the right.

Trace the connection: Light Path → "Is Shadow Ray" output → Mix Shader → Factor socket.
The Mix Shader: Factor=0 → Shader[1] (Principled glass). Factor=1 → Shader[2] (Transparent).

To see the unmitigated firefly problem:
  1. Drag the "Is Shadow Ray" link off the Mix Shader Factor socket (Alt+click the link, or drag from Factor).
  2. Plug a Shader → Material Output directly, or set Mix Shader Factor manually to 0 (all Principled).
  3. Let Cycles accumulate for 30–60 seconds.

Observe the bright speckles on the floor. Reconnect "Is Shadow Ray" → Mix Factor. Within a few seconds of fresh sampling, the floor clears.`,
      },
      {
        title: "Understand the Light Path outputs",
        body: `With no socket selected, hover over each output of the Light Path node in the Shader Editor. The tooltip shows the output name. The full set in Blender 5.1:

Boolean (0.0 / 1.0) outputs:
  Is Camera Ray          — first bounce from camera
  Is Shadow Ray          — evaluating shadow/occlusion
  Is Diffuse Ray         — previous bounce was diffuse scatter
  Is Glossy Ray          — previous bounce was specular
  Is Reflection Ray      — specular reflection bounce
  Is Transmission Ray    — refractive (glass) bounce
  Is Volume Scatter Ray  — bounced inside a volume
  Is Singular Ray        — Dirac-delta BSDF (ideal mirror or ideal dielectric)

Integer outputs:
  Ray Depth          — total bounces since camera
  Diffuse Depth      — diffuse bounces so far
  Glossy Depth       — specular bounces so far
  Transparent Depth  — alpha/Transparent BSDF bounces (NOT glass)
  Transmission Depth — refractive glass bounces
  Volume Depth       — volume scatter bounces
  Total Depth        — Ray Depth + Transparent Depth

The critical distinction: Transmission Depth counts glass-crossing bounces.
Transparent Depth counts alpha-transparency bounces (shadow-ray pass-throughs via Transparent BSDF). Because the Is Shadow Ray trick routes shadow rays through Transparent BSDF, both counters matter for a scene with many overlapping glass objects.`,
      },
      {
        title: "Examine the Cycles Light Paths panel",
        body: `Open Properties (right side panel by default) → Render Properties (camera icon) → Sampling → Light Paths.

You will see the bounce sliders matching the blueprint constants:
  Max Bounces: 12
  Diffuse: 4
  Glossy: 4
  Transmission: 8   ← refractive glass crossings
  Volume: 2
  Transparent: 16   ← alpha / Transparent BSDF ceiling

Below that, the Clamping section:
  Direct Light: 8.0   ← cap on direct illumination per sample
  Indirect Light: 4.0 ← cap on indirect bounce radiance per sample

Try raising Direct Light to 100 (effectively disabled). Note that caustic-like bright speckles return even with the Is Shadow Ray switch active — these come from glossy-to-transmission paths that the trick does not intercept. Lower it back to 8 and the speckles vanish within a few samples.

The clamping is a fallback: it does not solve the root problem, but it clips the statistical outliers that the shader trick did not catch.`,
      },
      {
        title: "Per-object ray visibility",
        body: `Select crystal_prism. Open Properties → Object Properties (orange square icon) → Visibility panel.

You will see toggles for each ray type:
  Camera, Shadow, Diffuse, Glossy, Transmission, Volume Scatter.

Uncheck Shadow. The prism now casts no shadow at all — the floor is fully lit.
This is the most aggressive option: the glass object is completely invisible to shadow rays.
Re-enable Shadow.

The difference between unchecked Shadow and the Is Shadow Ray trick:
  • Unchecked Shadow: zero shadow contribution from this object.
  • Is Shadow Ray trick: the object casts a soft, blurred shadow (Transparent BSDF produces a diffused penumbra) without the caustic spike.

For decorative gems embedded in a character mesh, unchecked Shadow is usually acceptable. For a glass prism as the hero prop, the Is Shadow Ray trick produces a more convincing result.`,
      },
      {
        title: "Export the GLB and check KHR_materials_transmission",
        body: `In the Scripting workspace, locate the bpy.ops.export_scene.gltf() call at the bottom of blueprint.py. This has already run and written crystal_prism.glb next to the script.

Open the glTF Validator (online at https://gltf.github.io/glTF-Sample-Viewer/ or via the Blender glTF-Blender-IO addon's built-in validator) and inspect the material JSON. You should see:

{
  "extensions": {
    "KHR_materials_transmission": {
      "transmissionFactor": 1.0
    }
  },
  "ior": 1.517,
  "roughnessFactor": 0.0,
  "baseColorFactor": [0.82, 0.93, 1.00, 1.0]
}

The Light Path node does not appear in the GLB — it is Cycles-only metadata. The WebXR runtime (Three.js r155+, Babylon.js 6+) receives only the Principled BSDF parameters and renders transmission via KHR_materials_transmission without any firefly concern: rasterised transmission has no caustic variance.`,
      },
    ],
    finalResult:
      "An octagonal glass crystal prism rendered clean at 128 Cycles samples using the Is Shadow Ray mix trick, with production bounce budget and firefly clamps configured. The material exports as KHR_materials_transmission in the GLB for WebXR delivery.",
    variations: [
      "Dispersion / chromatic aberration: add three separate Refraction BSDF nodes (IOR = 1.510, 1.517, 1.524 for R, G, B) and mix them with a Wavelength node mapped through a ColorRamp. Connect only the R channel of the Wavelength output to the IOR shift. The Is Shadow Ray trick still applies to the combined output Mix Shader. Note: this is a Cycles-only artistic approximation of dispersion; the GLB will export only the base IOR value.",
      "Nested glass: for a glass bowl containing glass marbles, each marble needs its own glass material with the Is Shadow Ray trick. The Transparent BSDF's Transparent Depth counter accumulates across all overlapping glass objects in a shadow ray's path — set transparent_max_bounces to at least 2× the maximum nesting depth.",
      "Frosted glass: set Roughness = 0.04–0.08 in the Principled BSDF. This widens the transmission lobe (satin-scatter diffusion) and is especially effective for studio lamp globes and bathroom glass. The Is Shadow Ray trick is even more important with rough glass because the widened lobe increases variance per path.",
    ],
    troubleshooting: [
      {
        symptom: "Fireflies are still visible after connecting Is Shadow Ray",
        cause:
          "Clamp Direct or Clamp Indirect are set to 0 (disabled), or the values are very high. The Is Shadow Ray trick removes most caustic variance but not all — clamp provides the fallback.",
        fix: "In Properties › Render › Sampling › Clamping, set Direct Light to 8.0 and Indirect Light to 4.0. If speckles persist, lower Direct Light to 4.0. Confirm scene.cycles.caustics_refractive = False and scene.cycles.caustics_reflective = False in the script.",
      },
      {
        symptom: "Glass appears black in EEVEE Rendered viewport",
        cause:
          "Transmission in EEVEE Next requires the material's Blend Mode to be set to something other than Opaque, and Screen Space Reflections / Refraction may need enabling.",
        fix: "With the glass material selected, in Material Properties › Settings › Blend Mode, set to Alpha Blend or Additive. In Render Properties › Screen Space Reflections, enable Refraction. Note: the blueprint targets Cycles; EEVEE is used only for record.py previews.",
      },
      {
        symptom: "GLB shows transmissionFactor: 0 in the validator",
        cause:
          "The Principled BSDF 'Transmission Weight' socket was left at 0.0, or the material was built in EEVEE mode where the Transmission socket may behave differently.",
        fix: "In the Shader Editor, select the Principled BSDF and confirm Transmission Weight = 1.0 in the node's socket panel (N key with node selected). Re-export. Verify export_apply=True in the gltf() call.",
      },
    ],
  },
  base,
);

export { entry };
