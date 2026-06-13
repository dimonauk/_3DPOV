import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeNextRayTracingSsrGlossyBody() {
  return (
    <>
      <p>
        EEVEE Next ships two complementary reflection systems that work best
        stacked rather than swapped. <strong>Screen-Space Ray Tracing</strong>{" "}
        (SSR) fires rays through the rendered colour and depth buffer to find
        reflection targets in real time — it handles dynamic geometry, reads
        live light positions, and degrades gracefully near screen boundaries.{" "}
        <strong>Sphere Probes</strong> pre-bake a cubemap of the surroundings
        and fill the gaps SSR cannot reach: off-screen geometry, roughness above
        the hard cutoff, the very first frame before SSR has accumulated
        samples. Together they approach a path-traced reflection result at
        real-time frame rates.
      </p>
      <p className="mt-3">
        The key lever is <code>ssr_max_roughness</code> — above this value
        every surface falls back to the nearest probe with no SSR contribution.
        Setting it at 0.45 catches chrome and brushed metal whilst leaving matte
        painted surfaces on the cheaper probe path. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-reflection-plane-mirror-floor"
          className={lk}
        >
          Reflection Plane Probe tutorial
        </Link>{" "}
        (perfect planar mirrors re-rendered from a mirrored camera) and{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe"
          className={lk}
        >
          Irradiance Volume + Sphere Probe baking
        </Link>{" "}
        for diffuse GI, which SSR does not affect.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        How screen-space ray marching works
      </h2>
      <p>
        For each pixel whose material roughness is ≤ <code>ssr_max_roughness</code>
        , EEVEE reflects the view ray through the surface normal and marches it
        through the depth buffer in incremental steps. When the marched ray depth
        exceeds the stored depth by less than <code>ssr_thickness</code> metres,
        a hit is registered and the colour at that screen coordinate becomes the
        reflection sample.
      </p>
      <p className="mt-3">
        The geometry exists only in screen space: any surface that has scrolled
        off-frame returns a miss. Misses fade over the{" "}
        <code>ssr_border_fade</code> normalised edge band and blend silently to
        the sphere probe value. This blend is invisible on still frames but
        reveals itself as a soft darkening near frame edges when the camera pans
        over glossy geometry.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`eevee = scene.eevee
eevee.use_ssr            = True
eevee.ssr_quality        = 0.50   # ray step count factor; 1.0 = 4× slower
eevee.ssr_max_roughness  = 0.45   # hard cutoff; above → probe fallback only
eevee.ssr_thickness      = 0.15   # hit-slab depth in metres; too thin → dark halo
eevee.ssr_border_fade    = 0.08   # normalised edge fade; 0 = hard pop at boundary
eevee.ssr_firefly_fac    = 10.0   # clamp extreme bright reflection samples`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Sphere Probe as SSR fallback
      </h2>
      <p>
        Place a single Sphere Light Probe at the centre of the scene and set its
        influence distance to cover the full scene radius. EEVEE bakes a cubemap
        the first time you enter rendered mode; subsequent frames reuse the bake
        unless you click <em>Bake Indirect Lighting</em> again. The probe is
        static by default — it does not update to moving objects mid-animation.
        For scenes with moving reflective objects add per-object sphere probe
        overrides, or accept SSR handling all dynamic surfaces and use the probe
        only for static surrounding light.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`bpy.ops.object.light_probe_add(type='SPHERE', location=(0, 0, 1.8))
probe = bpy.context.active_object
probe.data.influence_distance = 9.0   # must encompass entire scene radius

# Bake requires a running GUI context (not --background)
bpy.ops.scene.light_cache_bake(subset='ALL')`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Reading the roughness graduation
      </h2>
      <p>
        The scene places six IcoSpheres at roughness 0.0, 0.08, 0.18, 0.32,
        0.55, and 1.0 on a near-mirror floor (roughness 0.03). With{" "}
        <code>ssr_max_roughness = 0.45</code>:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>Spheres 0–3 (0.0 – 0.32): sharp to progressively blurred SSR</li>
        <li>
          Sphere 4 (0.55): SSR disabled — probe handles it at lower resolution
        </li>
        <li>Sphere 5 (1.0): probe reflection, blurred by BSDF; barely legible</li>
        <li>
          Floor (0.03): vivid SSR reflection of the whole sphere row above it
        </li>
      </ul>
      <p className="mt-3">
        The visual discontinuity between spheres 3 and 4 is the lesson: it
        reveals the exact boundary where the engine switches strategy. In a
        WebXR production scene you would keep metallic props below 0.4 roughness
        to ensure SSR covers them, or bake per-object sphere probes for satin
        surfaces that exceed the cutoff.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        IOR and conductor albedo
      </h2>
      <p>
        Pure metals set <code>Metallic = 1.0</code> in Principled BSDF v2. The{" "}
        <code>Base Color</code> becomes the conductor Fresnel tint at normal
        incidence. Platinum-grey (0.82, 0.82, 0.85) is a neutral conductor hue
        that lets roughness carry the visual story without a distracting colour
        shift across the row. The <code>IOR</code> input on a fully metallic
        material has no effect on the reflectance curve — it only governs the
        dielectric lobe, which is suppressed at metallic = 1.0. For the
        Fresnel–IOR relationship on dielectrics, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled Transmission + Iridescence tutorial
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-path-glass-fireflies"
          className={lk}
        >
          Cycles Light Path Node: Glass Without Fireflies
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        SSR vs Hardware Ray Tracing in Blender 5.1
      </h2>
      <p>
        Blender 5.1 exposes a Render Properties field called{" "}
        <em>Ray Tracing Method</em> with three values: PROBE, SCREEN, and
        HARDWARE. SCREEN is the SSR path configured by this blueprint. HARDWARE
        requires a Vulkan-capable GPU with ray-tracing cores (NVIDIA RTX / AMD
        RDNA3+) and traces rays against actual scene geometry rather than the
        depth buffer — it handles off-screen reflections and thick-geometry halos
        correctly, at the cost of driver requirements and per-frame latency. In
        the Python API this surfaces as{" "}
        <code>scene.eevee.ray_tracing_method</code>. The existing{" "}
        <code>use_ssr</code> and <code>ssr_*</code> properties remain and map to
        the SCREEN path.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/eevee/render_settings/screen_space_reflections.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — EEVEE Screen Space Reflections
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev — related: njanakiev/fractal-landscapes
          (companion procedural Python repo)
        </li>
      </ul>
    </>
  );
}

export const entry = buildInstructable(
  {
    time: "90 minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py (public/library/blends/rendering/eevee-next-ray-tracing-ssr-glossy/)",
      ],
      tools: [
        "Render Properties ▸ Screen Space Reflections panel",
        "Light Probe: Sphere Probe object (Add ▸ Light Probe ▸ Sphere)",
        "Material Properties ▸ Principled BSDF v2",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "Open Blender 5.1 Scripting workspace, open blueprint.py and run it. Six IcoSpheres appear on a polished floor. Switch to Rendered mode (Z → Rendered) to see EEVEE Next with SSR active.",
      },
      {
        title: "Inspect SSR settings in Render Properties",
        body: "Properties ▸ Render ▸ Screen Space Reflections. Confirm Quality = 0.5, Max Roughness = 0.45, Thickness = 0.15 m. Toggle the checkbox off and on — the floor reflection vanishes and returns.",
      },
      {
        title: "Drag Max Roughness across the sphere row",
        body: "Drag ssr_max_roughness from 0.45 down to 0.0. Watch SSR vanish from successively smoother spheres. Drag it up to 1.0 to extend SSR to rough surfaces. Reset to 0.45.",
      },
      {
        title: "Observe border-fade at screen edge",
        body: "Orbit camera until the rightmost sphere nearly exits the right viewport edge. The floor reflection beneath it softens — that is ssr_border_fade = 0.08 blending to the probe value.",
      },
      {
        title: "Inspect the Sphere Probe coverage",
        body: "Select sphere_probe_centre (orange gizmo). Properties ▸ Object Data ▸ Probe → Influence Distance = 9.0 m. Click 'Bake Indirect Lighting' in Render Properties to refresh the cubemap.",
      },
      {
        title: "Run record.py for the viewport animation",
        body: "Open record.py in the Scripting workspace and run it. Spheres drop one by one, their SSR floor reflections activating on landing. Output → public/library/videos/rendering/eevee-next-ray-tracing-ssr-glossy/viewport.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-eevee-next-ray-tracing-ssr-glossy",
    title:
      "EEVEE Next — Screen-Space Ray Tracing: Graduated-Roughness Metal Sphere Array (Blender 5.1)",
    date: "2026-06-13",
    kind: "tutorial",
    excerpt:
      "Configure SSR in EEVEE Next with ssr_max_roughness = 0.45 to show how screen-space ray tracing and sphere probe fallback divide responsibility across a six-sphere roughness graduation — chrome mirror to matte clay, with the engine-switch boundary visible in a single viewport frame.",
    Body: EeveeNextRayTracingSsrGlossyBody,
  },
);
