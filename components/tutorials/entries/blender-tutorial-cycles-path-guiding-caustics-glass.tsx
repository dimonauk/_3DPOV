import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CausticsBody() {
  return (
    <>
      <p>
        Standard Monte Carlo path tracing is a brilliant algorithm with one
        cruel weakness: caustics. A caustic is the bright pattern formed when a
        transparent or highly reflective surface focuses light — the swimming
        oval of light at the bottom of a glass of water, the sharp focus ring
        under a crystal ball, the glittering scatter on a pool floor. Path
        tracing finds these patterns by chance: a ray must leave the camera,
        bounce off the floor, scatter through the glass geometry, and
        accidentally arrive at the light source. The geometric probability of
        that specific path is vanishingly small — often less than one in ten
        thousand per pixel — so thousands of samples produce nothing but noise.
      </p>
      <p>
        Blender 4.0 introduced two complementary tools to fix this. The first,{" "}
        <strong>Path Guiding</strong>, builds a spatial radiance cache during
        the first pass of a render and biases all subsequent paths toward
        directions that were actually bright in earlier passes. The second,{" "}
        <strong>Shadow Caustics</strong> (per-light), adds an algebraically
        guaranteed bidirectional path that passes through refractive geometry
        for that specific light — bypassing the rarity problem entirely. Used
        together they make caustics tractable in a production sample budget
        (512–2048 spp). Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN Denoising tutorial
        </Link>{" "}
        for the post-process step that cleans up the residual noise floor once
        the caustic pattern has converged.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Why glass spheres focus light: the thick-lens paraxial approximation
      </h3>
      <p>
        A glass sphere is optically a thick biconvex lens with both radii equal
        to the sphere radius r and a thickness equal to 2r (the diameter). For a
        sphere of radius r and refractive index n, the paraxial rear focal length
        measured from the exit surface is:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`f  =  r · n / ( 2 · (n − 1) )

For r = 0.4 m, n = 1.52 (lead crystal):
f  =  0.4 × 1.52 / (2 × 0.52)  =  0.608 / 1.04  ≈  0.585 m

Paraxial focus is 0.585 m behind the rear surface of the sphere,
or 0.585 + 0.4 = 0.985 m below the sphere centre.

Sphere centre z = 0.84 m → focus z = 0.84 − 0.985 = −0.145 m

The floor is at z = 0.  The paraxial focus is 0.145 m BELOW the floor,
meaning real rays are pre-convergent when they hit the floor: a bright
elliptical smear rather than a geometric point.`}</pre>
      <p>
        This is the physically correct result for a crystal ball of typical
        display proportions: a large bright oval rather than a pinpoint. The
        tighter the spot beam and the lower the floor relative to the sphere, the
        more concentrated the oval becomes. The image produced by the blueprint
        shows this smear clearly against the warm concrete floor.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Path Guiding — the 5D radiance cache
      </h3>
      <p>
        Path guiding represents the scene&apos;s lighting as a 5-dimensional
        distribution: position (x, y, z) × hemisphere direction (θ, φ). During
        the first{" "}
        <code>guiding_training_samples</code> passes, every traced path deposits
        energy into the cache cells it passes through. In subsequent passes, the
        hemisphere sampler draws directions from this cache rather than uniformly
        — high-energy directions are sampled proportionally more often. For a
        caustic scene, after ~128 training samples the cache has &quot;seen&quot;
        the bright refracted oval and starts routing paths toward it
        preferentially.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Render Properties → Sampling → Path Guiding
scene.cycles.use_guiding             = True
scene.cycles.guiding_training_samples = 128

# WHY 128 training samples:
# Too few (< 32): the guide is underfit — too noisy to bias correctly.
# Too many (> 256): wastes useful budget on unguided passes.
# 128 is the Blender default; increase to 256 on scenes with many
# independent lighting situations (multiple glass objects in different
# areas of the frame).`}</pre>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Shadow Caustics — the algebraic shortcut
      </h3>
      <p>
        Path guiding improves convergence but does not change the fundamental
        sampling problem: the caustically-lit pixel still needs the rare path to
        be found at least once before the guide can reinforce it. Shadow caustics
        solves the cold-start problem. For each light with{" "}
        <code>use_caustics = True</code>, Cycles adds a dedicated
        bidirectional shadow ray that is <em>required</em> to exit through a
        refractive/reflective surface — it cannot terminate at a diffuse surface
        between the light and the floor. This guarantees caustic energy on every
        sample from frame one, eliminating the long &quot;warm-up&quot; period
        where the caustic is invisible.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Light Properties → Shadow → Shadow Caustics
spot_light = bpy.data.lights["spot_caustic"]
spot_light.cycles.use_caustics = True   # CyclesLightSettings — Blender 4.0+

# Scene-level caustic modes
scene.cycles.caustics_refractive = True   # glass, water, transparent surfaces
scene.cycles.caustics_reflective = False  # shiny metal bowls, concave mirrors
                                           # (disable if not in scene — expensive)

# Shadow caustics applies ONLY to Cycles renderer.
# EEVEE Next has no equivalent; use a Screen Space Reflection plane as a proxy.`}</pre>
      <p>
        Shadow caustics has a render-time cost proportional to the complexity of
        the refractive geometry. For a single clean sphere it is negligible. For
        a complex cut-gem with 200+ faces it can double render time. If render
        time is a concern, disable reflective caustics and reduce spot blend to
        keep the scene geometrically simple. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled Transmission + Iridescence shader
        </Link>{" "}
        for a pure shader-graph approach to glass that renders correctly in EEVEE
        without any caustic cost.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Glass material: why zero roughness matters
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`bsdf.inputs["Transmission Weight"].default_value = 1.0
bsdf.inputs["IOR"].default_value                 = 1.52
bsdf.inputs["Roughness"].default_value           = 0.0

# Roughness and caustic sharpness:
# 0.000 → razor-sharp caustic boundary, glittery highlight at exit face
# 0.005 → slightly softened, realistic high-quality optical glass
# 0.020 → noticeably blurred caustic; "frosted" appearance
# 0.050 → caustic dissolves into a diffuse bright patch
# > 0.10 → caustic invisible; material reads as satin/frosted

# For demonstration clarity, 0.0 is correct.
# For a realistic display-case crystal ball in production, 0.004–0.008.`}</pre>
      <p>
        The IOR of 1.52 is standard soda-lime glass (windows, cheap glassware).
        Leaded crystal (chandeliers, cut-glass) sits at 1.62–1.68; this produces
        a brighter, more tightly focused caustic with a slight prismatic colour
        fringe at the edges. Borosilicate (lab glass, Pyrex) is 1.47 — noticeably
        dimmer caustic, closer to a bright smear than a focused ellipse at this
        geometry scale.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Denoising strategy for caustic renders
      </h3>
      <p>
        Caustics converge more slowly than diffuse lighting — a 1024-sample
        render will still have visible noise in the caustic core. OIDN
        (Intel Open Image Denoise) handles this well because the caustic&apos;s
        high-frequency brightness is spatially consistent once enough samples
        have converged. The key is to include albedo and normal auxiliary passes,
        which prevents OIDN from smearing the caustic boundary with the
        surrounding concrete.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`scene.cycles.use_denoising = True
scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
# "RGB_ALBEDO_NORMAL" → full quality OIDN; preserves caustic boundary sharpness
# "RGB_ALBEDO"        → medium quality; may soften caustic slightly
# "RGB"               → low quality; caustic blurs into floor at high noise levels

# For interactive preview denoising (Render → Progressive Refine):
# Denoise each pass only after 128 samples to avoid OIDN smearing the
# not-yet-converged caustic core.`}</pre>
      <p>
        A complementary technique is enabling{" "}
        <strong>Render Passes → Diffuse Indirect</strong> and compositing the
        denoised diffuse-indirect pass back over the beauty render — this
        isolates the caustic channel for targeted denoising strength. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          Shader AOV Custom Render Passes tutorial
        </Link>{" "}
        for the multi-pass compositor workflow.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Failure modes</h3>
      <p>
        <strong>No caustic visible at 256+ samples</strong> — most likely
        Shadow Caustics is off on the light. Check{" "}
        <em>Properties → Object Data → Shadow → Shadow Caustics</em>. Also
        verify <code>scene.cycles.caustics_refractive = True</code> (scene-level
        toggle is a second gate — both must be on).
      </p>
      <p>
        <strong>Caustic appears but is very noisy / speckled</strong> — path
        guiding is off, or{" "}
        <code>guiding_training_samples</code> is too low. Set it to 128–256 and
        re-render from frame 1. If still speckled at 512 samples, check that the
        glass object has no inverted normals (Overlay → Face Orientation — all
        faces should be blue outward).
      </p>
      <p>
        <strong>Caustic is present but grey / desaturated</strong> — the glass
        material&apos;s Base Color is a dark or grey tint. Glass absorbs some
        light; a perfectly white base (1, 1, 1) gives a colourless caustic. Set
        Base Color to a very pale tint (0.94, 0.97, 1.0) for slight blue cast,
        or set it to a gem colour to tint the caustic.
      </p>
      <p>
        <strong>Render is extremely slow (GPU)</strong> — complex caustics with
        Shadow Caustics enabled on multiple lights can overwhelm GPU memory.
        Reduce samples to 512 and use OIDN at full quality. Alternatively, enable{" "}
        <em>Render Properties → Performance → Tiles → Auto Tile Size</em> (or
        set manually to 256 px for GPU). See the{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          Cycles render settings overview
        </Link>{" "}
        for performance tuning. The{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          Light Groups tutorial
        </Link>{" "}
        shows how to isolate the caustic contribution as a separate render layer
        for post-process grading.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-cycles-path-guiding-caustics-glass",
  title:
    "Cycles Path Guiding + Shadow Caustics — Physically Accurate Glass Caustics (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Enable Cycles path guiding and per-light shadow caustics to render a physically accurate refractive caustic ellipse through a glass sphere at 1024 samples. Covers the 5D radiance cache, the thick-lens focal geometry for a crystal ball, Principled BSDF transmission setup (IOR 1.52, roughness 0.0), OIDN full-quality denoising for caustic noise, and the Python API for all three toggles (use_guiding, guiding_training_samples, light.cycles.use_caustics).",
  Body: CausticsBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Cycles basics: render engine selection, sample count, camera setup. The Cycles DOF + Motion Blur tutorial covers core render settings; this tutorial extends it with path-guiding and caustic-specific settings.",
      "Principled BSDF shader: the Shader Transmission + Iridescence tutorial covers the Transmission Weight and IOR inputs in detail; those concepts are assumed here.",
      "Blender 5.1 installed. Path guiding and shadow caustics require Blender 4.0+. OIDN denoising requires 3.5+.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Path guiding (scene.cycles.use_guiding) and shadow caustics (light.data.cycles.use_caustics) require Blender 4.0+. The Principled BSDF Transmission Weight socket replaces the older Transmission scalar in Blender 4.0 — use 'Transmission Weight' not 'Transmission' in 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand path guiding vs standard Monte Carlo for caustics",
        body:
          "Standard path tracing (no guiding):\n  Each pixel fires N rays uniformly into the hemisphere.\n  A caustic ray must thread: camera → floor → glass exit → glass entry → light.\n  Probability of finding this path by chance: P ≈ solid_angle(light) / 4π ≈ ~10⁻⁴\n  At 1024 spp, only ~0.1 successful caustic paths per pixel → extreme noise.\n\nPath guiding:\n  First 128 spp: rays sample uniformly, building a 5D radiance cache.\n  The cache stores observed energy per (position, direction) bin.\n  Passes 129–1024: hemisphere samples are drawn proportionally from cache.\n  If the caustic was found even once, the cache points future paths toward it.\n  Result: the caustic ellipse appears cleanly at ~256 spp instead of ~4096 spp.\n\nShadow caustics (per-light):\n  An additional bidirectional path tracer runs alongside the forward paths.\n  It specifically constructs paths that MUST pass through refractive geometry.\n  Algebraically guaranteed to produce caustic energy on frame 1.\n  Solves the cold-start: caustic is visible from sample 1, not sample 128.\n\nBoth features together:\n  Shadow caustics seeds the caustic energy from frame 1.\n  Path guiding amplifies it as the cache fills in.\n  OIDN cleans the residual noise floor at the end.\n  Net result: clean caustic at 512–1024 spp where unguided needs 8000+.",
      },
      {
        title: "Create the scene: floor, pedestal, glass sphere, spot light",
        body:
          "  bpy.ops.wm.read_factory_settings(use_empty=True)\n  scene = bpy.context.scene\n  scene.render.engine = 'CYCLES'\n\n  # Floor\n  bpy.ops.mesh.primitive_plane_add(size=5.0)\n  floor = bpy.context.active_object;  floor.name = 'floor'\n\n  # Pedestal\n  bpy.ops.mesh.primitive_cube_add(size=1.0)\n  ped = bpy.context.active_object\n  ped.scale = (0.55, 0.55, 0.22)   # 0.44 m tall\n  bpy.ops.object.transform_apply(scale=True)\n  ped.location.z = 0.22\n\n  # Glass sphere (64 segments for a smooth silhouette)\n  bpy.ops.mesh.primitive_uv_sphere_add(radius=0.40, segments=64, ring_count=32)\n  sphere = bpy.context.active_object\n  sphere.name = 'glass_sphere'\n  sphere.location.z = 0.84   # pedestal top (0.44) + radius (0.40)\n  bpy.ops.object.shade_smooth()\n\n  # Spot light — 45° off vertical, pointing at sphere centre\n  import mathutils\n  spot_data = bpy.data.lights.new('spot_caustic', 'SPOT')\n  spot_data.energy      = 1400.0   # watts — bright enough to drive visible caustic\n  spot_data.spot_size   = math.radians(50)   # 25° half-angle\n  spot_data.spot_blend  = 0.12\n  spot_data.shadow_soft_size = 0.04  # near-point source\n  spot_obj = bpy.data.objects.new('spot_caustic', spot_data)\n  scene.collection.objects.link(spot_obj)\n  spot_obj.location = (1.80, -1.40, 4.50)\n  spot_dir = mathutils.Vector((0, 0, 0.84)) - mathutils.Vector(spot_obj.location)\n  spot_obj.rotation_euler = spot_dir.to_track_quat('-Z', 'Y').to_euler()",
      },
      {
        title: "Enable Shadow Caustics on the spot light",
        body:
          "  # CyclesLightSettings — accessible on any Blender Light data block\n  spot_data.cycles.use_caustics = True\n\n  # Verify in the UI:\n  # Select the spot light → Properties panel (right side) →\n  #   Object Data Properties (green light icon) → Shadow → Shadow Caustics: ON\n\n  # This flag tells Cycles to generate additional bidirectional shadow paths\n  # that are CONSTRAINED to pass through refractive/reflective objects.\n  # It applies only to this light — you can have some lights cast caustics\n  # and others not, useful for hero lights vs. fill lights.\n\n  # Common mistake: enabling it on a SUN or AREA light with a huge area.\n  # Both work but AREA lights with large size produce soft caustics.\n  # For a sharp focal ellipse, use a SPOT with spot_blend < 0.15\n  # and shadow_soft_size < 0.05.",
      },
      {
        title: "Enable Path Guiding and scene-wide caustic modes",
        body:
          "  # Render Properties → Sampling → Path Guiding\n  scene.cycles.use_guiding             = True\n  scene.cycles.guiding_training_samples = 128\n\n  # Render Properties → Light Paths → Caustics\n  scene.cycles.caustics_refractive = True   # enable refraction caustics\n  scene.cycles.caustics_reflective = False  # off — no concave mirrors here\n\n  # Sample count — caustics need more samples than diffuse scenes\n  scene.cycles.samples    = 1024\n  scene.cycles.use_denoising = True\n  scene.cycles.denoising_input_passes = 'RGB_ALBEDO_NORMAL'\n\n  # Note: caustics_refractive is a second gate — if this is False,\n  # shadow caustics on the light has no effect.  Both must be True.\n  # This design allows scene-level caustic budget control: disable the\n  # scene toggle to quickly compare caustic vs. no-caustic render time.",
      },
      {
        title: "Build the glass material (Principled BSDF)",
        body:
          "  mat = bpy.data.materials.new('glass_crystal')\n  mat.use_nodes = True\n  nt = mat.node_tree\n  nt.nodes.clear()\n\n  bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')\n  out  = nt.nodes.new('ShaderNodeOutputMaterial')\n\n  bsdf.inputs['Base Color'].default_value          = (0.94, 0.97, 1.00, 1.0)\n  bsdf.inputs['Roughness'].default_value           = 0.0\n  bsdf.inputs['IOR'].default_value                 = 1.52\n  bsdf.inputs['Transmission Weight'].default_value = 1.0\n\n  # IMPORTANT: In Blender 5.1 the input is 'Transmission Weight' NOT 'Transmission'.\n  # The old 'Transmission' scalar was renamed in 4.0 to 'Transmission Weight'\n  # as part of the Principled BSDF v2 redesign.  Using the old name silently\n  # falls back to 0.0 (opaque glass) without any error — the most common gotcha.\n\n  mat.blend_method  = 'HASHED'   # correct alpha sorting for glass\n  mat.shadow_method = 'HASHED'   # caustics require correct shadow transparency\n  nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])\n  sphere.data.materials.append(mat)\n\n  # WHY shadow_method='HASHED' not 'NONE':\n  # 'NONE' makes the glass cast no shadow at all — correct for EEVEE\n  # where you do not want a black oval beneath the glass.\n  # But for Cycles shadow caustics, the shadow ray must pass THROUGH\n  # the glass to build the caustic path.  HASHED preserves this.\n  # If the floor beneath the sphere shows a solid black oval, the\n  # shadow_method on the glass material has been set to NONE.",
      },
      {
        title: "Render and assess the caustic",
        body:
          "  bpy.ops.render.render(write_still=True)\n\n  # What to look for in the render:\n  # 1. A bright warm ellipse on the floor offset from the sphere's geometric shadow.\n  #    This is the refracted focal smear — physically correct for the scene geometry.\n  # 2. The ellipse should have a bright core and softly feathered edges.\n  # 3. The glass sphere itself shows a faint internal caustic ribbon where the\n  #    refracted beam bounces inside the glass.\n\n  # Convergence timeline with path guiding + shadow caustics:\n  # Sample 1    : bright oval visible already (shadow caustics seeded it)\n  # Sample 32   : shape of the oval clearly defined\n  # Sample 128  : path guide trained; sample efficiency improves\n  # Sample 256  : oval has smooth brightness gradient, minimal speckle\n  # Sample 1024 : OIDN-ready; denoised result looks production clean\n\n  # Without path guiding and shadow caustics (same settings, flags off):\n  # Sample 64   : floor is essentially uniformly grey — no caustic\n  # Sample 256  : faint bright region barely visible\n  # Sample 2048 : shape discernible but still speckled\n  # Sample 8192 : comparable quality to 1024 with guiding+caustics on",
      },
    ],
  },
  base,
);
