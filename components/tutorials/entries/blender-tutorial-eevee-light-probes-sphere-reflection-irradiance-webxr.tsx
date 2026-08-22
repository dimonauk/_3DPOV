import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeLightProbesBody() {
  return (
    <>
      <p>
        EEVEE is a rasteriser. Without real-time ray tracing, a chrome sphere
        has nothing to reflect — the reflection buffer is empty and the object
        renders as a flat, world-coloured blob. Light probes solve this by
        pre-rendering panoramic captures from probe positions and storing the
        results as cubemaps or spherical harmonics. At render time EEVEE samples
        those cached textures to approximate local global illumination at
        interactive speed. Blender 5.1 runs EEVEE Next exclusively, which
        reworked the entire probe infrastructure in Blender 4.2.
      </p>

      <p className="mt-3">
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-shadow-catcher-holdout-ar-composite"
          className={lk}
        >
          EEVEE shadow catcher tutorial
        </Link>{" "}
        showed how EEVEE Next bakes shadow information directly into the beauty
        pass alpha. Light probes are the complementary system for the{" "}
        <em>colour</em> half of the picture: they pre-compute how the
        environment looks from a given position and feed that colour into
        specular and diffuse shading at runtime. Neither system requires Cycles
        or hardware ray tracing, making them the standard path for WebXR scene
        authoring.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Sphere probe vs Irradiance Volume
      </h2>
      <p>
        EEVEE Next provides two probe types used in most scenes together.
      </p>
      <p className="mt-3">
        The <strong>Sphere probe</strong> (formerly &ldquo;Reflection Cubemap&rdquo; in EEVEE
        Legacy) captures a 360° mip-mapped cubemap centred at the probe&rsquo;s world
        position. Metallic and glossy surfaces sample this cubemap for their
        specular reflection colour. The cubemap resolution (<code
        >scene.eevee.gi_cubemap_resolution</code>) trades VRAM for fidelity:{" "}
        <code>&apos;512&apos;</code> is a practical default for scene objects in the 1–4 m
        range; push to <code>&apos;1024&apos;</code> for close-up hero shots where the
        reflection is clearly visible to camera.
      </p>
      <p className="mt-3">
        The <strong>Irradiance Volume probe</strong> (formerly &ldquo;Irradiance Volume&rdquo;,
        name unchanged in EEVEE Next) places a 3-D grid of sample nodes inside
        its bounding box. Each node captures incoming radiance from all
        directions and compresses it to L2 Spherical Harmonics — 9 coefficients
        per RGB channel, 27 floats total per node. Diffuse surfaces query the
        four nearest grid nodes and interpolate their SH coefficients to get
        directional ambient colour. This is why a blue diffuse box placed near
        an irradiance probe will colour-bleed a faint blue tint onto the floor
        beneath it: the SH at those grid nodes includes the blue energy reflected
        by the box wall. That inter-object colour bleed is not something a plain
        world shader or{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          Cycles light groups
        </Link>{" "}
        can replicate in EEVEE without probes.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        EEVEE Legacy → EEVEE Next: probe renaming
      </h2>
      <p>
        Blender 4.2 introduced EEVEE Next (on by default from 4.2; the only
        option in 5.1) and renamed the probe objects:
      </p>
      <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
        <li>
          <code>Reflection Cubemap</code> → <strong>Sphere</strong> (
          <code>type=&apos;SPHERE&apos;</code> in bpy)
        </li>
        <li>
          <code>Irradiance Volume</code> → <strong>Volume</strong> (
          <code>type=&apos;VOLUME&apos;</code>)
        </li>
        <li>
          <code>Reflection Plane</code> → <strong>Plane</strong> (
          <code>type=&apos;PLANE&apos;</code>) — for flat mirror surfaces like floors
        </li>
      </ul>
      <p className="mt-3">
        The bpy constant you pass to{" "}
        <code>bpy.ops.object.lightprobe_add(type=…)</code> is unchanged, so
        scripts written for 4.x will run on 5.1 without modification. The
        baking mechanism changed significantly: Legacy had a single{" "}
        &ldquo;Bake Indirect Lighting&rdquo; button; Next introduces a per-scene probe
        cache (stored as a <code>.probe_cache</code> folder alongside the blend)
        baked with:
      </p>
      <pre className="bg-zinc-800 text-zinc-100 text-xs rounded p-3 mt-2 overflow-x-auto">
        {`# Interactive bake (requires GPU context — not available in --background)
bpy.ops.object.lightprobe_cache_bake(subset='ALL')

# Or: Render Properties → Light Probes → Bake All Light Probes`}
      </pre>
      <p className="mt-3">
        This is the key operational difference from a{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          full-pass AOV render
        </Link>: probe baking requires a real GPU context and therefore cannot
        be triggered from <code>blender --background</code>. The blueprint.py in
        this tutorial builds and saves the scene; baking is an explicit
        interactive step described in the walkthrough below.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Probe influence, falloff, and placement strategy
      </h2>
      <p>
        The <strong>influence distance</strong> of a Sphere probe is the radius
        of the sphere (displayed as a dashed circle gizmo in the viewport) within
        which the probe&rsquo;s cubemap overrides the world background for specular
        lookups. Objects outside the influence sphere fall back to the next-nearest
        probe, or to the world background. The <strong>falloff</strong> parameter
        blends the cubemap out at the edge of the influence sphere rather than
        cutting it off hard — 0.15 is a good default; push toward 0.5 for probes
        covering large, open areas.
      </p>
      <p className="mt-3">
        For a studio product-viz scene (single hero object, ~2 m diameter), a
        single centred probe with radius 3–4 m is sufficient. For architectural
        or spatial scenes — such as those exported from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB pipeline
        </Link>{" "}
        — place one Sphere probe per room or major sub-space. The probes are
        independent; EEVEE blends between them at surface level using a
        per-pixel influence weight.
      </p>
      <p className="mt-3">
        The Irradiance Volume should encompass all geometry you want to receive
        accurate diffuse GI. Scale the object in the viewport (or via{" "}
        <code>obj.scale</code>) rather than the internal grid_resolution: scale
        changes the world-space coverage without changing bake cost; resolution
        changes the sampling density. Start with <code>4×4×2</code> for a flat
        scene (32 nodes), increase Z nodes for multi-storey interiors.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export and WebXR delivery
      </h2>
      <p>
        The glTF 2.0 specification has no standard extension for EEVEE probe
        cache data. <code>KHR_lights_punctual</code> carries punctual lights
        (point, spot, directional) only; cubemaps and SH grids have no glTF
        equivalent. When a scene exported as GLB is loaded in Three.js for
        WebXR, the material reflections depend on Three.js&rsquo;s own environment
        map — typically an HDRI baked via{" "}
        <code>THREE.PMREMGenerator</code>. The EEVEE probe bake therefore
        exists for authoring fidelity in Blender only; the GLB output from the
        blueprint carries geometry and material settings (metallic, roughness,
        base colour) but no probe cache. The{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-path-guiding-caustics-glass"
          className={lk}
        >
          Cycles path-guiding caustics tutorial
        </Link>{" "}
        shows the offline ray-traced counterpart to probe-based reflections when
        photorealism (rather than real-time speed) is the goal.
      </p>
      <p className="mt-3">
        In practice this means: use the probe rig during scene layout to
        evaluate metallic material choices at WebXR-like shading fidelity, then
        export the GLB and supply a matching HDRI to Three.js for runtime. The
        two should produce visually similar results for roughness &gt; 0.1; very
        sharp mirrors (&lt;0.05 roughness) will diverge because probe cubemaps
        have finite resolution while PMREM from a high-res HDRI is continuous.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        EEVEE raytracing vs probes
      </h2>
      <p>
        Blender 5.1 EEVEE Next supports hardware-accelerated ray tracing via{" "}
        <code>scene.eevee.use_raytracing = True</code>. When raytracing is
        active, Sphere probes are optional — EEVEE can compute real reflections
        per pixel. Probes remain useful as a fallback for surfaces outside the
        screen (off-screen geometry is not ray-traceable from any rasteriser).
        The Irradiance Volume is still necessary for diffuse indirect light even
        with raytracing active, unless you also enable{" "}
        <code>use_diffuse_gi</code>.
      </p>
      <p className="mt-3">
        The probe path (raytracing off) runs on every GPU including integrated
        Intel graphics — essential for WebXR hardware testing on mid-range
        laptops. Keep the probe rig in your production blends regardless of
        whether you author on an RTX workstation.
      </p>

      <p className="mt-4 text-sm text-zinc-400">
        Sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/eevee/light_probes/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — EEVEE Light Probes
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0) ·{" "}
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/4.2/EEVEE"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender 4.2 Release Notes — EEVEE Next
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "45 min – 1.5 hours",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: [
        "Blender 5.1 (free, blender.org)",
        "EEVEE Next (default renderer in Blender 5.1)",
        "A GPU — any modern integrated or discrete (baking requires GL context)",
      ],
      tools: [
        "blueprint.py (builds probe_scene.blend)",
        "record.py (renders 120-frame camera orbit → viewport.mp4)",
        "OBS Studio or Windows Game Bar (screen.mp4)",
      ],
    },
    steps: [
      {
        title: "Build the scene with blueprint.py",
        body: "Open a terminal, navigate to public/library/blends/rendering/eevee-light-probes-sphere-reflection-irradiance-webxr/, and run: blender --background --python blueprint.py. Blender writes probe_scene.blend containing: chrome sphere, gold ellipsoid, brushed cylinder, diffuse accent box, back wall, area lights, one Sphere probe at (0,0,1.5) with influence radius 3.5 m, one Irradiance Volume at (0,0,1.5) scaled to cover the floor area, and a camera.",
      },
      {
        title: "Open the blend and switch to Rendered view",
        body: "blender probe_scene.blend. In the viewport press Z then 8 (Rendered). You will likely see the chrome sphere as a dark blob or showing only the world teal gradient — the probe cache has not yet been baked. This is expected and is your baseline to compare against after baking.",
      },
      {
        title: "Inspect the Sphere probe",
        body: "Select refl_sphere_probe. In Properties → Object Data Properties (the green probe-sphere icon) note Influence Distance: 3.5 m and Falloff: 0.15. The dashed circle gizmo in the viewport marks the influence boundary. Drag the influence distance slider — watch the gizmo resize live. Reset to 3.5 before baking.",
      },
      {
        title: "Inspect the Irradiance Volume",
        body: "Select irradiance_vol_probe. In Object Data Properties note the 4×4×2 grid. The orange dots in the viewport are the 32 sample nodes. Their spacing determines diffuse colour bleed fidelity — too few nodes produces visible streaks at material boundaries. Scale the volume object (S) to adjust coverage; grid_resolution stays fixed unless you change it in properties.",
      },
      {
        title: "Bake all probes",
        body: "In Render Properties (camera icon), scroll to the Light Probes section. Click Bake All Light Probes. A progress indicator appears in the header. The bake renders a cubemap from the Sphere probe's position, then samples irradiance at each of the 32 Volume nodes. On a modern GPU this takes 10–40 seconds. When complete, the chrome sphere gains visible reflections of the lights and back wall; the accent box gains warm/cool colour variation from the surrounding lights.",
      },
      {
        title: "Verify probe influence boundary",
        body: "Hide the Sphere probe (H key with it selected). The chrome sphere immediately reverts to the flat world gradient — confirming that the probe, not the world, was supplying its reflections. Un-hide (Alt+H). Move the sphere probe far off to one side until chrome_sphere exits its influence radius — the sphere goes dark. Return the probe to centre.",
      },
      {
        title: "Adjust Irradiance Volume resolution",
        body: "With irradiance_vol_probe selected, change grid_resolution_z from 2 to 4 in Object Data Properties. Bake All Light Probes again. The diffuse colour bleed on the floor beneath the accent box becomes more accurate — you may see a faint blue tint spreading outward. Bake cost roughly doubles in Z (32 → 64 nodes). Set Z back to 2 for the export.",
      },
      {
        title: "F12 render a still",
        body: "Press F12 to render a 1280×720 still. The chrome sphere shows reflections of the rim light, fill light, and partially the floor geometry (all within the probe's 3.5 m radius). The gold ellipsoid shows a warmer reflection tint from its material colour modulating the cubemap sample. The brushed cylinder shows a softer, wider specular highlight from its higher roughness (0.38) blurring the cubemap.",
      },
      {
        title: "Export as GLB",
        body: "File → Export → glTF 2.0. Set the output path to probe_scene.glb in the same folder. Under Include: enable Mesh Data and Materials. Under Transform: keep +Y Up. Export. The GLB carries geometry + material PBR values only — no probe cache. In Three.js you supply a PMREM env map from a matching HDRI to replicate the reflections at runtime.",
      },
      {
        title: "Record the orbit",
        body: "In a terminal: blender --background probe_scene.blend --python record.py. This renders 120 frames (1280×720, 24 fps) of the camera orbiting the scene, then encodes viewport.mp4. Note: reflections appear in this render only if the probe cache was baked in the interactive step above; otherwise the chrome sphere will show the flat world gradient.",
      },
      {
        title: "Screen-record the probe walkthrough",
        body: "Follow SCREEN-RECORDING-NOTES.md: OBS window capture 1920×1080, 30 fps, audio off. Cover: Rendered view before bake → Sphere probe influence gizmo → Bake All Light Probes progress → chrome sphere reflection update → hide/unhide probe comparison → Irradiance Volume grid nodes → GLB export. Save as screen.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Chrome sphere shows no reflections after baking",
        cause:
          "The probe influence radius (3.5 m) is correct but the sphere probe is not within the camera frustum at bake time, or raytracing is enabled and overriding the probe path unexpectedly.",
        fix: "Confirm refl_sphere_probe is in the scene collection and not hidden (visible in viewport). In Render Properties, temporarily disable Raytracing if it was on. Re-run Bake All Light Probes.",
      },
      {
        symptom: "bpy.ops.object.lightprobe_cache_bake error in --background",
        cause:
          "The bake operator requires an OpenGL / GPU context which is not available in headless background mode. This is a hard Blender constraint, not a script bug.",
        fix: "Run the bake interactively: open the blend in a full Blender session, go to Render Properties → Light Probes → Bake All Light Probes. The bake result is saved to the .probe_cache folder and persists when you save the blend.",
      },
      {
        symptom: "Orange grid dots for the Irradiance Volume not visible",
        cause:
          "Viewport overlay 'Light Cache' is disabled, or the volume object is hidden.",
        fix: "Viewport → Overlays dropdown → enable Light Cache. Confirm the irradiance_vol_probe object is visible in the Outliner (eye icon on).",
      },
      {
        symptom: "Diffuse GI colour bleed is too strong or too faint",
        cause:
          "Irradiance Volume intensity multiplier is not at 1.0, or gi_irradiance_smoothing is too high (washing out colour contrast) or too low (visible grid seam artefacts).",
        fix: "Select the volume probe → Object Data Properties → Intensity. Set to 1.0. In EEVEE settings, gi_irradiance_smoothing at 0.1 is a balanced default; lower to 0.05 for sharper colour detail, raise to 0.3 for smoother transitions with fewer nodes.",
      },
      {
        symptom: "GLB in Three.js shows flat grey materials with no reflections",
        cause:
          "No environment map set on the Three.js scene. glTF does not carry probe data — the Three.js scene.environment is null by default.",
        fix: "Use THREE.PMREMGenerator to bake a cubemap from an HDRI and assign it to scene.environment. Match the HDRI to the EEVEE world background for visual consistency.",
      },
    ],
    finalResult:
      "probe_scene.blend with a baked Sphere Reflection probe and Irradiance Volume: the chrome sphere reflects the area lights and back wall; the gold ellipsoid and brushed cylinder show probe-driven specular gradients; the diffuse accent box shows colour bleed from the surrounding lights via the SH irradiance grid. A 120-frame camera orbit encoded as viewport.mp4 demonstrates the parallax-correct reflection updates as the camera moves. probe_scene.glb exports the geometry and PBR materials for WebXR delivery.",
  },
  {
    slug: "blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr",
    title:
      "Rendering: EEVEE Next Light Probes — Sphere Reflection Capture + Irradiance Volume for WebXR-Ready PBR Scenes (Blender 5.1)",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Add a Sphere Reflection probe and an Irradiance Volume to an EEVEE Next scene, bake the probe cache, and get chrome, gold, and brushed-metal surfaces reflecting their local environment rather than the flat world background. Includes the GLB export path and the WebXR Three.js env-map handoff where glTF probe data would otherwise be lost.",
    tags: [
      "blender",
      "eevee",
      "eevee-next",
      "light-probes",
      "reflection",
      "irradiance-volume",
      "spherical-harmonics",
      "global-illumination",
      "rendering",
      "webxr",
      "glb",
      "pbr",
      "metallic",
    ],
    Body: EeveeLightProbesBody,
  },
);
