import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <code>OceanModifier</code> implements Tessendorf&apos;s
        inverse-FFT pipeline: hundreds of wave sinusoids are drawn from a
        power spectrum, summed in frequency space, and transformed back each
        frame — producing a physically plausible heightfield in milliseconds.
        A Gerstner term then shifts vertices horizontally, causing crests to
        steepen without extra geometry.
      </p>

      <h2>GENERATE vs DISPLACE mode</h2>
      <p>
        <code>mod.geometry_mode</code> controls whether the modifier
        replaces the base mesh topology or displaces existing vertices.
      </p>
      <ul>
        <li>
          <strong>GENERATE</strong> — discards source mesh topology and
          builds a fully subdivided ocean grid from scratch. The base object
          is just a container; resolution comes from{" "}
          <code>mod.resolution</code>. Starting from a bare plane is fine.
        </li>
        <li>
          <strong>DISPLACE</strong> — moves existing vertices. Needed when
          your mesh has specific topology (e.g. a terrain blended at a
          coastline); the source mesh must have enough vertices to resolve
          wave detail at the chosen wave scale.
        </li>
      </ul>

      <h2>Spectrum types</h2>
      <p>
        Four spectra are available. <strong>JONSWAP</strong> (Joint North Sea
        Wave Project) models a fetch-limited sea: wave energy concentrates
        around <code>wave_direction</code> and the peak sharpens — use it
        whenever wave direction matters. <strong>PHILLIPS</strong> is an
        omnidirectional deep-ocean model; energy spreads uniformly and
        produces rounder, softer swells.{" "}
        <strong>UNIFIED_DIRECTIONAL</strong> spreads energy evenly over the
        full directional range, good for stylised multi-directional chop.{" "}
        <strong>TEXTURES</strong> bypasses the FFT entirely, deriving the
        heightfield from a procedural texture — cheap but non-deterministic
        across sessions, so avoid it for scripted exports.
      </p>

      <h2>Beaufort scale and wind velocity</h2>
      <p>
        <code>mod.wind_velocity</code> is in metres per second. Reference
        Beaufort values: Bf 1 (ripples) ≈ 1.5 m/s; Bf 3 (scattered
        whitecaps) ≈ 4.5 m/s; Bf 5 (universal whitecaps) ≈ 8–9 m/s; Bf 7
        (heaping seas, streaky foam) ≈ 14–16 m/s; Bf 10 (storm, dense foam)
        ≈ 25–28 m/s. Setting <code>wind_velocity=8.0</code> paired with{" "}
        <code>wave_alignment=0.75</code> gives a lively sea with a clear
        dominant direction and secondary cross-sea chop.
      </p>

      <h2>Choppiness — the Gerstner term</h2>
      <p>
        Pure sinusoidal waves are symmetric: flat troughs, rounded crests.
        Real waves are asymmetric — crests narrow and sharp, troughs wide
        and flat.
        <code>mod.choppiness</code> adds a horizontal displacement
        proportional to the wave&apos;s gradient: vertices migrate toward
        the crest, compressing the surface there. At{" "}
        <code>choppiness=0</code> the wave is sinusoidal; at{" "}
        <code>1.0</code> crests visibly peak; above{" "}
        <code>1.5</code> the surface folds — realistic for storm seas but
        causes self-intersection when subdivision is coarse. Keep to 0.6–0.9
        for a stylised seascape.
      </p>

      <h2>Foam as a colour attribute</h2>
      <p>
        When <code>mod.use_foam = True</code>, the modifier writes a colour
        attribute named <code>mod.foam_layer_name</code> (here{" "}
        <code>&quot;foam&quot;</code>). Values run 0.0 (clear) → 1.0
        (whitecap); the attribute updates every frame alongside the
        heightfield — no separate bake required.
      </p>
      <p>
        In the Shader Editor use a <strong>Named Attribute</strong> node (Blender
        4+/5.x) set to <code>foam</code>; connect its <em>Fac</em> output to
        the Factor socket of a Mix Colour node blending ocean blue and
        off-white foam. In Python:{" "}
        <code>ShaderNodeAttribute</code> with{" "}
        <code>attribute_type = &apos;GEOMETRY&apos;</code>. Tune{" "}
        <code>mod.foam_coverage</code> to restrict foam to only the steepest
        crests (low value) or spread it broadly (high value).
      </p>

      <h2>Driver pattern for time animation</h2>
      <p>
        <code>mod.time</code> advances the simulation. A scripted driver
        avoids any simulation cache:
      </p>
      <pre>{`driver = mod.driver_add("time").driver
driver.type       = 'SCRIPTED'
driver.expression = "frame / 24.0"`}</pre>
      <p>
        The FFT recalculates the surface each frame from the same seed and
        spectrum. The animation is deterministic and loopable. Change{" "}
        <code>random_seed</code> for a different but equally reproducible
        ocean.
      </p>

      <h2>GLB export strategy</h2>
      <p>
        For WebXR a static mesh snapshot keeps file sizes small; the
        Three.js Water shader can supply live ripple independently. Set the
        frame, then export with <code>export_apply=True</code> — this runs
        depsgraph evaluation, collapsing the modifier at that frame without
        touching the .blend stack:
      </p>
      <pre>{`bpy.context.scene.frame_set(EXPORT_FRAME)
bpy.ops.export_scene.gltf(
    filepath     = bpy.path.abspath("//hf_ocean_seascape.glb"),
    use_selection = True,  export_format = 'GLB',
    export_yup = True,     export_apply  = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
)`}</pre>

      <h2>Studio links</h2>
      <ul>
        <li>
          <Link href="/docs/INSTALL-SCAN-BLENDER" className={lk}>
            Holoflow WebXR Exporter — install &amp; scan docs
          </Link>{" "}
          — +Y up, Draco L6, <code>holoflow:facet</code> flag conventions
          used in this blueprint.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr"
            className={lk}
          >
            DisplaceModifier + bpy.data.textures — procedural terrain
          </Link>{" "}
          — companion height-field study; same GLB export pattern, texture-
          driven displacement instead of FFT.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm"
            className={lk}
          >
            VertexWeightProximityModifier — physics modifier stack ordering
          </Link>{" "}
          — shows how Modify-category modifiers feed data into Physics-category
          modifiers; same stack-order discipline applies here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-points-to-volume-organic-coral"
            className={lk}
          >
            GN: Points to Volume — organic cloud from point density
          </Link>{" "}
          — volume approach to ocean surface details (bubbles, spray particles).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>
            Tessendorf, Jerry. &ldquo;Simulating Ocean Water&rdquo; (2001,
            updated 2004)
          </strong>{" "}
          — SIGGRAPH Course Notes; the mathematical foundation Blender&apos;s
          OceanModifier implements: Phillips/JONSWAP spectra, FFT heightfield,
          Gerstner choppiness term.{" "}
          <a
            href="https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            people.computing.clemson.edu
          </a>{" "}
          (academic public domain). Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/physics/ocean.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual: Ocean Modifier
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.OceanModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.OceanModifier API
          </a>
          .
        </li>
        <li>
          <strong>three.js Water</strong> (MIT, mrdoob &amp; three.js
          contributors){" "}
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Water.js"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/mrdoob/three.js
          </a>
          . The runtime WebXR counterpart — a Fresnel-shaded ocean surface
          that pairs with a static Blender GLB backdrop. Related:{" "}
          <a
            href="https://github.com/pmndrs/react-three-fiber"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            react-three-fiber
          </a>
          ,{" "}
          <a
            href="https://github.com/pmndrs/drei"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            @react-three/drei
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr",
  title:
    "Python bpy.types.OceanModifier — Beaufort Scale FFT Wave Spectrum, Foam Attribute & Animated Seascape GLB for WebXR (Blender 5.1)",
  description:
    "Configure Blender's FFT ocean simulation — pick a wave spectrum, set wind velocity on the Beaufort scale, enable foam attributes, drive time with a frame driver — then bake a static seascape GLB for WebXR.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "modifier",
    "ocean",
    "physics",
    "animation",
    "webxr",
    "glb",
    "foam",
  ],
  libraryPath:
    "blends/scripting/python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr",
  Body,
  keyInsights: [
    "GENERATE mode creates the ocean grid from scratch — base plane topology is irrelevant; DISPLACE mode moves existing vertices",
    "JONSWAP spectrum models fetch-limited seas (wind direction matters, peaks sharpen); PHILLIPS models omnidirectional deep-ocean swells",
    "Choppiness adds horizontal Gerstner displacement: at 0 the surface is sinusoidal; at ≥1 wave crests steepen asymmetrically",
    "Foam is a per-vertex colour attribute (0=clear, 1=whitecap) updated alongside the heightfield — read via Named Attribute node in the Shader Editor",
    "Driver expression `frame / 24.0` on mod.time gives deterministic loopable animation with no simulation cache",
    "export_apply=True in the GLTF exporter evaluates the modifier stack at the current frame without permanently applying it to the .blend",
  ],
});
