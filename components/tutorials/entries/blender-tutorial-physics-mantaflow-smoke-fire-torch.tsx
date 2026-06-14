import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PhysicsMantaflowSmokeFireTorchBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Mantaflow gas solver is a purely Eulerian algorithm &mdash;
        no FLIP particles, only a staggered MAC (Marker-and-Cell) grid.  Each
        timestep runs five coupled passes: velocity advection via the MacCormack
        scheme (second-order, low numerical diffusion), vorticity confinement
        (injects rotational momentum to compensate the dissipation that still
        occurs), pressure projection (PCG iterative solve enforcing ∇·u&nbsp;=&nbsp;0
        for incompressibility), buoyancy forcing (Boussinesq approximation:
        upward body force proportional to temperature deviation from ambient),
        and finally a combustion reaction step (fuel field decreases by{" "}
        <code>burning_rate</code> per substep, releasing heat and generating smoke
        proportional to <code>flame_smoke</code>).  This is the same pressure-projection
        core as the FLIP liquid solver &mdash; compare it with the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break"
          className={lk}
        >
          FLIP dam-break tutorial
        </Link>
        &nbsp;&mdash; but FLIP adds particles to preserve rotational detail over
        large displacements, whereas gas uses vorticity confinement directly on
        the grid because smoke moves slowly enough that a grid-only scheme stays
        stable.
      </p>

      <p>
        The domain object must have <code>domain_type&nbsp;=&nbsp;&apos;GAS&apos;</code>.
        Setting <code>use_adaptive_domain&nbsp;=&nbsp;True</code> tells Mantaflow
        to only allocate voxels inside the bounding box of active gas each frame.
        Without it, an 80³ grid is always fully allocated even when the flame
        occupies 15% of the cube &mdash; a 6.5× overhead in memory and bake time.
        The <code>adapt_threshold&nbsp;=&nbsp;0.01</code> marks a voxel as active when
        its density field exceeds 0.01 kg/m³; <code>adapt_margin&nbsp;=&nbsp;4</code>{" "}
        adds four buffer voxels around the active region so the solver has a valid
        velocity neighbourhood at every active cell.  Contrast adaptive domain with
        the fixed-grid bake used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-volume-cube-procedural-cloud"
          className={lk}
        >
          GN Volume Cube procedural cloud
        </Link>
        : the cloud is a static procedural field with no runtime adaptivity, whereas
        the Mantaflow grid changes shape every frame as the flame rises.
      </p>

      <p>
        <strong>Vorticity confinement</strong> is the most important gas-specific
        parameter.  The MacCormack advection scheme is second-order accurate in
        space but still dissipates angular momentum &mdash; at{" "}
        <code>vorticity&nbsp;=&nbsp;0</code>, the flame rises in a perfectly laminar
        column that looks nothing like fire.  Vorticity confinement computes
        ω&nbsp;=&nbsp;∇&nbsp;&times;&nbsp;u (the curl of the velocity field), then
        injects a force anti-parallel to ∇|ω| that re-energises collapsing vortex
        tubes.  At <code>vorticity&nbsp;=&nbsp;0.25</code>, realistic coiling appears;
        above 1.0, the simulation becomes chaotically turbulent.  The additional{" "}
        <code>flame_vorticity&nbsp;=&nbsp;0.4</code> applies extra confinement only at
        the flame front, where the thermal expansion boundary layer is thinnest and
        dissipation is highest.  Even with confinement, a grid solver can&rsquo;t
        reproduce the sharp Kelvin&ndash;Helmholtz instabilities of real fire, so the{" "}
        <strong>Turbulence force field</strong> (<code>strength&nbsp;=&nbsp;5.0</code>,{" "}
        <code>noise&nbsp;=&nbsp;2.0</code>) stochastically perturbs the velocity field
        to produce lateral flicker.  This is purely artistic augmentation, not a
        physical combustion model &mdash; the same role a noise force plays in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-volumetric-light-cone"
          className={lk}
        >
          EEVEE volumetric light-cone tutorial
        </Link>
        &rsquo;s dust particles.
      </p>

      <p>
        The <strong>flow emitter</strong> uses <code>flow_type&nbsp;=&nbsp;&apos;FIRE&apos;</code>{" "}
        and <code>flow_behavior&nbsp;=&nbsp;&apos;INFLOW&apos;</code>.  FIRE type emits
        fuel rather than smoke directly; the domain&rsquo;s combustion physics
        converts fuel → heat + smoke each substep.  INFLOW injects continuously
        every frame &mdash; compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break"
          className={lk}
        >
          dam-break&rsquo;s GEOMETRY behavior
        </Link>
        , which seeds liquid once at initialisation and then lets gravity do the work.
        <code>fuel_amount&nbsp;=&nbsp;0.55</code> produces a medium torch flame; scale
        to 0.15 for a candle, 1.2 for a bonfire.  <code>temperature&nbsp;=&nbsp;1.0</code>{" "}
        sets the initial buoyancy impulse of the injected gas &mdash; cooler injection
        produces a sluggish smouldering column, hotter injection rockets upward and
        widens the base.  <code>surface_distance&nbsp;=&nbsp;1.5</code> injects fuel
        within 1.5 voxels of the emitter surface, giving a thick shell of fuel that
        avoids the hollow-sphere artefact that appears at distance&nbsp;0.
      </p>

      <p>
        The <strong>volume material</strong> uses three Mantaflow output attributes:
        <code>&quot;density&quot;</code> (smoke absorption, driven into the Density socket),
        <code>&quot;flame&quot;</code> (combustion intensity, drives emission strength), and
        <code>&quot;heat&quot;</code> (normalised temperature 0–1, drives a colour ramp from
        dark crimson through orange to near-white).  The Principled Volume shader
        handles both smoke scatter/absorption and fire emission in a single node,
        which keeps the material graph below ten nodes and performs well in EEVEE.
        An alternative approach is to connect <code>&quot;heat&quot;</code> &times;&nbsp;6000 K
        to the <code>Temperature</code> socket and set <code>Blackbody Intensity&nbsp;=&nbsp;1.5</code>:
        this derives fire colour from Planck&rsquo;s law automatically (1600 K = dull red,
        3000 K = orange, 6000 K = near-white), but the manual colour ramp gives more
        artistic control over the tonal separation between the flame core and the cool
        outer edge.  Compare the three-attribute structure with the single-density
        Principled Volume setup in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-volume-fog-column"
          className={lk}
        >
          procedural fog column tutorial
        </Link>
        : fog has no combustion and no emission, so it only needs the density field.
      </p>

      <p>
        EEVEE Next is the correct renderer for this simulation.  Ray-marching an 80³
        volume in EEVEE at 128 steps takes roughly 150–400 ms per frame on a mid-range
        GPU; Cycles must integrate hundreds of volume-scatter events per pixel sample,
        typically 10–30× slower for equivalent smoke visual quality.  Set{" "}
        <code>volumetric_tile_size&nbsp;=&nbsp;&apos;2&apos;</code> for the highest ray-march
        density (2 pixel tiles rather than the default 8&nbsp;px), and{" "}
        <code>volumetric_samples&nbsp;=&nbsp;128</code> to reduce banding in thick smoke.
        <code>use_volumetric_lights&nbsp;=&nbsp;True</code> allows the warm Point Light to
        scatter inside the smoke column, producing a halo of orange light around the
        lower flame &mdash; the same volumetric light-scatter mechanism explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe"
          className={lk}
        >
          irradiance volume and sphere probe tutorial
        </Link>
        .
      </p>

      <p>
        For WebXR deployment: Mantaflow has no real-time runtime; you export a baked
        flipbook of volume textures (File → Export → Volume Cache) as a sequence of
        OpenVDB files, then use the Three.js (MIT){" "}
        <code>VolumeRenderShader1</code> utility from the addons folder, or a
        sprite-sheet flipbook of pre-rendered frames mapped onto a billboard quad.
        A 24-frame loop at 128³ voxels is ≈ 12 MB as OpenVDB; the flipbook is a
        single 4096&nbsp;&times;&nbsp;4096 WebP at ~600 KB.  Choose based on whether you need
        parallax-correct 3-D volume (OpenVDB path, requires WebGPU compute) or a
        lightweight atmospheric hint (billboard, any WebGL context).  See the{" "}
        <Link href="/atelier" className={lk}>
          Atelier viewer
        </Link>{" "}
        for spatial assets in the studio&rsquo;s live WebXR context.
      </p>

      <p>Outside references for this tutorial:</p>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/fluid/type/domain/gas.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Fluid Domain Gas Settings
          </a>{" "}
          (CC-BY-SA&nbsp;4.0, Blender Foundation) &mdash; authoritative parameter
          reference: domain type, adaptive domain thresholds, vorticity confinement
          range, burning rate, flame smoke ratio, and noise detail settings.
          Sibling pages:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/physics/fluid/type/flow.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Flow settings
          </a>{" "}
          (INFLOW vs OUTFLOW vs GEOMETRY behavior, fuel_amount, temperature) and{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/physics/fluid/type/effector.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Effector settings
          </a>{" "}
          (collision SDF, guide velocity) complement this page for complete rig
          understanding.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) &mdash; open collection of bpy scripting recipes
          covering mesh generation, particle systems, and headless rendering patterns.
          Related projects in the same GitHub organisation:{" "}
          <a
            href="https://github.com/njanakiev/fractal-landscapes"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            fractal-landscapes
          </a>{" "}
          (MIT) for procedural terrain generation via Blender scripting, and{" "}
          <a
            href="https://github.com/njanakiev/blender-slides"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-slides
          </a>{" "}
          (MIT) for scripted presentation rendering &mdash; both demonstrate the
          same headless bpy.ops workflow used in{" "}
          <code>blueprint.py</code> and <code>record.py</code>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-physics-mantaflow-smoke-fire-torch",
  title:
    "Physics: Mantaflow Gaseous Simulation — Smoke & Fire Torch Flame (Blender 5.1)",
  tags: [
    "blender", "physics", "fluid", "mantaflow", "gas",
    "smoke", "fire", "combustion", "vorticity", "buoyancy",
    "turbulence", "volume", "eevee", "principled-volume", "simulation",
  ],
  category: "tutorial",
  publishedOn: "2026-06-14",
  summary:
    "Eulerian gas simulation in Blender 5.1 via Mantaflow.  A FIRE-type INFLOW " +
    "emitter continuously injects fuel into an adaptive GAS domain; combustion " +
    "converts fuel to heat and soot smoke; buoyancy drives the column upward; " +
    "vorticity confinement prevents the laminar-pillar look; a Turbulence force " +
    "field adds lateral flicker.  Expert coverage of MacCormack advection, " +
    "Boussinesq buoyancy, adaptive domain threshold, burning_rate vs flame_smoke " +
    "ratio, and the three-attribute Principled Volume material (density / flame / " +
    "heat).  Rendered in EEVEE Next at 128 volumetric steps — 10–30× faster than " +
    "Cycles for equivalent smoke quality.",
  body: PhysicsMantaflowSmokeFireTorchBody,
  libraryPath: "blends/physics/physics-mantaflow-smoke-fire-torch",
});
