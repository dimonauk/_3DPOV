import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.SceneEEVEE</code> is the datablock that controls every
        render-quality knob for Blender&rsquo;s EEVEE Next engine — and it
        changed significantly between legacy EEVEE and the rewrite shipped in
        4.2. The first thing to know: the identifier <code>BLENDER_EEVEE</code>{" "}
        raises a <code>ValueError</code> in Blender 5.x because the legacy
        engine was removed. Every script must use{" "}
        <code>BLENDER_EEVEE_NEXT</code> explicitly. The second thing: rather
        than writing the twenty-odd quality flags scattered across five
        Properties panels by hand each time you open a file, a{" "}
        <code>make_preset()</code> / <code>apply_eevee_preset()</code> pair
        serialises those settings to JSON so a batch render CI job can verify
        — before kicking off F12 — that every asset in the pipeline uses the
        same GTAO distance, the same SSR roughness cutoff, and the same TAA
        sample count. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake"
          className={lk}
        >
          3-point light rig tutorial
        </Link>{" "}
        relies on this same engine identifier and sets{" "}
        <code>scene.eevee.use_shadows = True</code> as a prerequisite — the
        blueprint here makes that dependency explicit and configurable.
      </p>
      <p>
        EEVEE Next splits reflections into two systems depending on a
        material&rsquo;s roughness. Below{" "}
        <code>ssr_max_roughness</code> (the studio default is 0.50), the engine
        traces screen-space rays: pixels visible in the current view contribute
        to the reflection, giving physically plausible glossy highlights and
        floor mirror effects at almost no extra render cost. Above the cutoff,
        EEVEE Next falls back to baked cubemap probes from the nearest{" "}
        <code>Sphere Probe</code> or <code>Reflection Plane</code>. This
        boundary is intentionally exposed as a tunable parameter rather than a
        hidden heuristic — the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          SSR roughness gradient tutorial
        </Link>{" "}
        shows the visible seam when the cutoff sits in the wrong place. On
        hardware that supports ray tracing (NVIDIA RTX, AMD RDNA3, Apple Silicon
        with Metal RT), setting <code>use_raytracing = True</code> and{" "}
        <code>ray_tracing_method = &apos;HARDWARE&apos;</code> replaces both SSR
        and screen-space AO with full hardware rays, eliminating screen-space
        limitations like off-screen contact shadows. The preset dict exposes
        both paths — the JSON flag flips the branch at load time.
      </p>
      <p>
        Ambient occlusion in EEVEE Next is GTAO (Ground Truth Ambient
        Occlusion), a horizon-based integral that is far more physically
        accurate than the old SSAO it replaced. The two parameters that matter
        most in a WebXR asset pipeline are <code>gtao_distance</code> (the
        sphere of influence radius in metres — keep it smaller than the smallest
        inter-object gap to avoid bleeding AO across separate pieces) and{" "}
        <code>gtao_factor</code> (a post-multiply that lets you dial the contact
        shadow weight without re-baking). The calibration scene built by the
        blueprint exposes GTAO most clearly on the chalk sphere: drag the
        viewport camera to a grazing angle and watch the crease between the
        sphere base and the floor plane deepen as{" "}
        <code>gtao_distance</code> increases. The colour management context for
        interpreting those values is in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scene-color-management-agx-ocio-bake-safe"
          className={lk}
        >
          AgX colour management tutorial
        </Link>
        , and the compositor pass that archives the AO channel for non-destructive
        relight is described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-compositor-nodetree-render-passes-eevee-glb-bake"
          className={lk}
        >
          compositor render passes tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-eevee-next-shadow-ssr-ao-render-config",
  title:
    "Python bpy.types.SceneEEVEE — EEVEE Next Render Config: Shadow, SSR, GTAO & Hardware RT Preset for WebXR Bakes (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "Script the complete bpy.types.SceneEEVEE API — TAA samples, virtual shadow maps, screen-space reflections, GTAO ambient occlusion, and hardware ray-tracing switch — into a save/load JSON preset for reproducible batch WebXR bakes. Verified on a six-sphere metallic/roughness calibration grid.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-eevee-next-shadow-ssr-ao-render-config",
    time: "one focused session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable with bpy.data and bpy.types — can create objects and materials without operators",
      "Has read the 3-point light rig tutorial (understands scene.eevee.use_shadows context)",
      "Familiar with Principled BSDF roughness and metallic channels",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title:
          "Set the engine identifier — BLENDER_EEVEE_NEXT is the only valid choice in 5.x",
        body: "scene.render.engine = 'BLENDER_EEVEE_NEXT'\n\n# 'BLENDER_EEVEE' raises ValueError in 5.x — it was removed in Blender 5.0.\n# 'BLENDER_WORKBENCH' and 'CYCLES' are still valid alternate identifiers.\n\n# Confirm the active engine via the Python console:\nprint(bpy.context.scene.render.engine)   # → BLENDER_EEVEE_NEXT\n\n# Enumerate all registered engines (includes any add-on engines):\nfor engine in bpy.types.RenderEngine.__subclasses__():\n    print(engine.bl_idname, engine.bl_label)\n\n# The EEVEE settings datablock is always at scene.eevee regardless of the\n# active engine — reading it while Cycles is active is valid but has no effect\n# on the Cycles render.",
      },
      {
        title:
          "Configure TAA samples and shadows — the two base quality knobs",
        body: "e = scene.eevee\n\n# TAA (Temporal Anti-Aliasing) — EEVEE Next's primary AA method.\n# taa_render_samples: frames accumulated for the final F12 render (64 = converged).\n# taa_samples: interactive viewport accumulation (8 keeps the UI snappy).\ne.taa_render_samples = 64\ne.taa_samples        = 8\n\n# Shadows — EEVEE Next uses a virtual shadow map atlas (not per-light cube maps).\n# A single global toggle enables the system; per-light flags control participation.\ne.use_shadows = True\n\n# Per-light shadow settings:\nfor light_obj in scene.objects:\n    if light_obj.type == 'LIGHT':\n        ld = light_obj.data\n        ld.use_shadow = True\n        # SPOT and POINT: shadow_soft_size sets the apparent source radius (metres).\n        # AREA: shadow softness derives from the physical emitter dimensions (size, size_y).\n        # shadow_soft_size has no effect on AREA lights in 5.1 — silently ignored.\n        if ld.type in ('SPOT', 'POINT'):\n            ld.shadow_soft_size = 0.05  # tight penumbra for hard sci-fi shadows\n        if ld.type == 'SUN':\n            # SUN shadow softness comes from ld.angle (the angular diameter of the disc).\n            ld.angle = 0.00925  # 0.53° in radians — solar angular diameter",
      },
      {
        title:
          "Configure Screen-Space Reflections — roughness cutoff and quality",
        body: "# SSR traces rays through the colour buffer to produce reflections for\n# materials below ssr_max_roughness. Above the cutoff, EEVEE falls back to\n# the nearest cubemap probe. The boundary is visible at a glancing angle.\n\ne.use_ssr            = True\ne.ssr_max_roughness  = 0.50   # probe fallback above this roughness value\ne.ssr_quality        = 0.40   # ray-step count factor (0.4 = studio default; 1.0 = 4x slower)\ne.ssr_thickness      = 0.12   # hit-slab depth in metres\n                               # too thin: dark halo around objects\n                               # too thick: objects behind thick walls reflect\ne.ssr_border_fade    = 0.10   # normalised viewport edge band; 0.0 = hard pop\ne.ssr_firefly_fac    = 8.0    # clamp extreme-bright SSR samples (reduces fireflies)\ne.use_ssr_refraction = True   # required for Principled BSDF Transmission > 0\n\n# Roughness cutoff anatomy:\n# ssr_max_roughness = 0.0 → all reflections from probes (SSR disabled effectively)\n# ssr_max_roughness = 0.5 → mirror-to-satin uses SSR; rough diffuse uses probes\n# ssr_max_roughness = 1.0 → all roughnesses use SSR (expensive, seldom needed)\n\n# To verify in the viewport: drag ssr_max_roughness to 0.0. All floor reflections\n# on the six-sphere grid will revert to probe colour. Drag back to 0.5.",
      },
      {
        title: "Configure GTAO ambient occlusion",
        body: "# GTAO (Ground Truth Ambient Occlusion) replaced legacy SSAO in EEVEE Next.\n# It integrates an horizon-based directional occlusion integral, producing more\n# accurate contact shadows at geometry intersections.\n\ne.use_gtao      = True\ne.gtao_distance = 0.50   # radius of influence sphere (metres)\n                          # keep < smallest inter-object gap to prevent bleeding\nif hasattr(e, 'gtao_factor'):\n    e.gtao_factor = 0.75  # post-multiply: 1.0 = full AO, 0.0 = no AO\nif hasattr(e, 'gtao_quality'):\n    e.gtao_quality = 0.75  # sample density: 0.25 → 4 samples, 1.0 → 16 samples\n\n# GTAO is always additive with direct lighting — it darkens ambient-lit areas\n# without affecting direct-lit surfaces. At gtao_factor 0.75 the ground crease\n# under the chalk sphere is clearly visible; at 0.20 it reads as subtle bounce.\n#\n# AO contribution is baked into the AO pass when vl.use_pass_ao = True.\n# The compositor pipeline tutorial shows how to archive this pass to multilayer EXR.",
      },
      {
        title:
          "Hardware RT switch — screen-space vs hardware ray tracing (5.x only)",
        body: "# EEVEE Next 5.x exposes a hardware ray-tracing path behind use_raytracing.\n# When True and ray_tracing_method = 'HARDWARE', OptiX / Metal RT replaces\n# both SSR and GTAO with full hardware rays — off-screen contacts, inter-object\n# reflections, and multi-bounce AO become possible at the cost of VRAM.\n# When False, the engine falls back to the screen-space methods (SSR + GTAO).\n\nif hasattr(e, 'use_raytracing'):\n    e.use_raytracing = False          # True requires an RT-capable GPU\nif hasattr(e, 'ray_tracing_method'):\n    e.ray_tracing_method = 'SCREEN'   # 'SCREEN' (screen-space RT) or 'HARDWARE'\n\n# 'SCREEN' mode: better quality than legacy SSR+GTAO at moderate cost,\n#   still screen-limited (off-screen objects don't reflect).\n# 'HARDWARE' mode: full denoised hardware RT — requires NVIDIA RTX / AMD RDNA3.\n\n# Guard pattern matters: these properties do not exist in Blender 4.x,\n# and their values are silently ignored when the GPU cannot handle hardware RT.",
      },
      {
        title: "Build and save the JSON preset for batch pipeline use",
        body: "import json\nimport pathlib\n\ndef make_preset(**overrides):\n    defaults = dict(\n        name='holoflow_webxr_preview_v1',\n        taa_render_samples=64,\n        taa_viewport_samples=8,\n        shadows_enabled=True,\n        ssr_enabled=True,\n        ssr_max_roughness=0.50,\n        ssr_quality=0.40,\n        ssr_thickness=0.12,\n        ssr_border_fade=0.10,\n        ssr_firefly_fac=8.0,\n        ssr_refraction=True,\n        ao_enabled=True,\n        ao_distance=0.50,\n        ao_factor=0.75,\n        ao_quality=0.75,\n        use_raytracing=False,\n        ray_tracing_method='SCREEN',\n        use_motion_blur=False,\n    )\n    defaults.update(overrides)\n    return defaults\n\npreset = make_preset()   # studio defaults\npath = pathlib.Path(bpy.path.abspath('//'))\npath.mkdir(parents=True, exist_ok=True)\n(path / 'eevee_preset_holoflow_webxr_preview.json').write_text(json.dumps(preset, indent=2))\n\n# Batch verification pattern (in a headless render script):\n# for blend_file in glob('*.blend'):\n#     subprocess.run(['blender', '-b', blend_file, '--python', 'verify_eevee_preset.py'])\n# Where verify_eevee_preset.py compares scene.eevee properties against the JSON.",
      },
    ],
    finalResult:
      "A bpy.types.SceneEEVEE configuration script that applies TAA samples, shadow quality, SSR, GTAO, and the hardware RT flag from a JSON preset dict. The six-sphere calibration grid exercises all three systems simultaneously: the chrome mirror sphere shows SSR floor reflections, the chalk sphere shows GTAO contact crease, and the sun penumbra verifies shadow quality. The preset JSON is saved as a sidecar file for use in batch render CI pipelines.",
    variations: [
      "High-quality turntable preset: override taa_render_samples=256, ssr_quality=0.75, ao_quality=1.0. Use make_preset(taa_render_samples=256, ssr_quality=0.75, ao_quality=1.0) to inherit all other studio defaults. Disable motion blur — use the compositor VecBlur node instead (the compositor passes tutorial covers this).",
      "WebXR lightmap bake preset: set use_ssr=False, use_gtao=False, taa_render_samples=128. Baking irradiance to a lightmap texture requires a clean unlit diffuse pass — SSR and AO should be disabled so the baked texture does not embed view-dependent highlights. Enable them back after bake.",
      "Hardware RT upgrade: if hasattr(scene.eevee, 'use_raytracing'): scene.eevee.use_raytracing = True; scene.eevee.ray_tracing_method = 'HARDWARE'. All SSR and GTAO settings become irrelevant — the hardware path handles them internally. Useful for final hero renders that need off-screen contact shadows.",
      "Per-scene preset CI check: write a headless verification script that loads each .blend, reads the preset JSON sidecar, and asserts scene.eevee.ssr_max_roughness == preset['ssr_max_roughness']. Any mismatch fails the CI job before the render farm starts. This prevents artists from accidentally over-sampling or under-sampling specific assets.",
    ],
    troubleshooting: [
      {
        symptom:
          "ValueError: bpy.ops.render.render() failing or render output looks wrong",
        cause:
          "scene.render.engine is set to 'BLENDER_EEVEE' (the legacy identifier removed in 5.x). Blender raises ValueError: '' not found in ('BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH', 'CYCLES', ...)",
        fix: "Replace 'BLENDER_EEVEE' with 'BLENDER_EEVEE_NEXT' everywhere in the script. To catch it programmatically: assert scene.render.engine == 'BLENDER_EEVEE_NEXT', f'Wrong engine: {scene.render.engine}'.",
      },
      {
        symptom:
          "SSR floor reflections are absent even with use_ssr = True and metallic floor",
        cause:
          "ssr_max_roughness is set too low. If the floor's roughness (0.02 in the blueprint) exceeds ssr_max_roughness, EEVEE falls back to the probe and SSR is not computed for that material.",
        fix: "Ensure ssr_max_roughness > floor roughness. At the studio default 0.50, any material with roughness ≤ 0.50 uses SSR. For a mirror floor at roughness 0.02, ssr_max_roughness 0.10 is sufficient. Also verify use_ssr = True is being applied after the engine change — applying to the wrong scene object is a common copy-paste error.",
      },
      {
        symptom:
          "GTAO contact shadow visible in viewport but absent in the F12 render",
        cause:
          "use_gtao was set to True in the viewport but not on the scene object that the render engine reads. Or the AO pass was baked into a separate layer and is not composited into the beauty output.",
        fix: "Confirm bpy.context.scene.eevee.use_gtao is True (not some other scene's eevee block). Also check that no compositor Override node is bypassing the AO contribution. The compositor passes tutorial's File Output should include an 'AO' slot wired from rl.outputs['AO'].",
      },
      {
        symptom:
          "AttributeError: 'SceneEEVEE' object has no attribute 'use_raytracing'",
        cause:
          "The hardware RT properties were added in Blender 4.2 EEVEE Next and may not exist on older builds, or the property was renamed in a sub-release.",
        fix: "Wrap all hardware RT assignments in hasattr guards: if hasattr(scene.eevee, 'use_raytracing'): ... The blueprint already does this. To inspect available properties at runtime: print([p for p in dir(scene.eevee) if 'ray' in p.lower()]).",
      },
    ],
  },
  base,
);
