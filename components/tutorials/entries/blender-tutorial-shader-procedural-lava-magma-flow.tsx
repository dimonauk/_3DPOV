import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderProceduralLavaMagmaFlowBody() {
  return (
    <>
      <p>
        A convincing lava material requires two Voronoi lookups operating on the
        same animated UV stream but in opposite modes.{" "}
        <strong>DISTANCE_TO_EDGE</strong> mode returns 0 at every Voronoi cell
        boundary and rises toward 1 at each cell centre — inverted, that gives
        the crack network: bright incandescent seams, dark cooling plate
        interiors.{" "}
        <strong>F1</strong> (distance to nearest centre) gives the complementary
        silhouette: 0 at plate centres and rising toward edges.  F1 feeds the
        Displacement socket so that plate surfaces sit physically higher than
        crack grooves, matching the geology of an active pahoehoe field where
        still-molten lava drains downward and leaves a domed cooling crust above
        each drainage channel.
      </p>

      <p>
        Animation is a single{" "}
        <code>frame * 0.003</code> driver on the Mapping node&apos;s Y
        Location.  The <code>frame</code> variable is the only time value
        available inside a driver expression — do not use{" "}
        <code>bpy.context.scene.frame_current</code> there, which evaluates to
        the frame at script execution time and never updates.  At 0.003
        units/frame the surface travels one Blender unit every 333 frames
        (~14 s at 24 fps), slow enough to read as viscous but fast enough to
        be clearly alive during a 5-second preview render.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Node tree architecture
      </h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`Generated UV → Mapping (Y driver: frame×0.003)
  ├─ Voronoi DISTANCE_TO_EDGE
  │    └─ Invert (1 − dist) → Crack Ramp → Emission node (strength 6.0)
  ├─ Voronoi F1
  │    └─ Plate Colour Ramp → Principled BSDF Base Colour + Subsurface
  ├─ Mix Shader (Fac = crack_mask output)
  │    ├─ Socket 1: Principled BSDF
  │    └─ Socket 2: Emission
  └─ Voronoi F1
       └─ Invert (1 − dist) → Displacement node (scale 0.12 m) → Output`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Step-by-step</h2>

      <h3 className="font-medium mt-4 mb-1">1. Prepare the mesh</h3>
      <p>
        Add a Plane (Shift+A → Mesh → Plane), scale to 4 m.  In Edit Mode,
        select all and Subdivide with 256 cuts (or add a{" "}
        <strong>Subdivision Surface</strong> modifier set to Simple, levels 4).
        Displacement needs enough geometry to resolve — a subdivided flat quad
        gives visible crack grooves at camera distance; a 4-vertex plane gives
        only smooth bumps regardless of displacement scale.
      </p>

      <h3 className="font-medium mt-4 mb-1">2. Material Settings — the critical enum</h3>
      <p>
        Before touching nodes, open <strong>Material Properties ▸ Settings ▸
        Surface ▸ Displacement</strong> and set it to{" "}
        <strong>Displacement and Bump</strong>.  This is the step most tutorials
        skip.  The Displacement node in the shader tree is ignored entirely until
        this dropdown is switched — EEVEE Next silently renders flat geometry
        with no warning.
      </p>

      <h3 className="font-medium mt-4 mb-1">3. Crack network (DISTANCE_TO_EDGE Voronoi)</h3>
      <p>
        Add a Voronoi Texture node.  Set <strong>Feature</strong> to{" "}
        <em>Distance to Edge</em>, Scale to 5.0, Randomness to 0.75.  Wire
        its Distance output through a <strong>Math → Subtract</strong> node
        (inputs: 1.0, [Voronoi Distance]) to invert it.  The inverted value is
        now 1.0 at crack edges and 0 at plate centres.  Feed this into a
        Color Ramp: place a sharp step from black at position 0 to white at
        position ~0.12 — this controls crack width.  The ramp&apos;s Fac output
        becomes the Mix Shader factor; its Color output tints the Emission node.
      </p>

      <h3 className="font-medium mt-4 mb-1">4. Plate surface (F1 Voronoi + Principled BSDF)</h3>
      <p>
        Add a second Voronoi node, identical except Feature = <em>F1</em>.
        Wire its Distance output into another Color Ramp with three stops:
        hot orange (0.0), deep red (0.45), near-black crust (0.75).  Use{" "}
        <strong>B-Spline</strong> interpolation for a smooth thermal gradient
        rather than the hard-edged linear ramp.  Connect the ramp Color to
        Principled BSDF Base Color.  Set Roughness to 0.9 — cooled basalt is
        matte.  Add a small Subsurface Weight (~0.06) with a warm radius
        (0.8, 0.15, 0.05) to simulate heat bleeding through thin crust edges.
      </p>

      <h3 className="font-medium mt-4 mb-1">5. Emission strength and EEVEE Bloom</h3>
      <p>
        Set the Emission node Strength to 6.0.  In{" "}
        <strong>Render Properties ▸ Effects ▸ Bloom</strong>, enable Bloom with
        threshold 1.0 — values above 1.0 trigger the halation.  Without Bloom
        the cracks look like a flat orange paint layer; with it they appear
        genuinely self-luminous.  The glTF exporter automatically wraps
        Strength &gt; 1.0 in{" "}
        <code>KHR_materials_emissive_strength</code>, so the glow persists
        inside model-viewer and Three.js without any manual GLB editing.
      </p>

      <h3 className="font-medium mt-4 mb-1">6. Displacement</h3>
      <p>
        Add a Math → Subtract (1 − F1_Distance) and feed it into a{" "}
        <strong>Displacement</strong> node (Space = World, Scale = 0.12,
        Midlevel = 0).  Connect the Displacement output to the Material Output
        Displacement socket.  The inverted F1 distance is 1 at plate centres
        and 0 at crack edges — exactly the profile of a raised plate with
        sunken grooves.  Tweak Scale between 0.05 (subtle texture) and 0.25
        (dramatic geological relief).
      </p>

      <h3 className="font-medium mt-4 mb-1">7. Animated UV scroll</h3>
      <p>
        Add a Texture Coordinate node and a Mapping node.  Wire Generated →
        Mapping → both Voronoi Vector inputs.  Right-click the Mapping node&apos;s
        Y Location field, choose <strong>Add Driver</strong>.  In the driver
        expression field type <code>frame * 0.003</code>.  Press Enter and play
        back — the lava surface should scroll upward through the material.
        Both Voronoi nodes share the same Mapping output so cracks and plates
        scroll together; they never drift apart.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Surface is flat despite displacement node:</strong> check
          Material Properties ▸ Settings ▸ Surface ▸ Displacement — must be
          "Displacement and Bump", not "Bump Only".
        </li>
        <li>
          <strong>Plate centres glow, cracks are dark:</strong> the Invert node
          on the DISTANCE_TO_EDGE branch is missing or wired backwards.
          DISTANCE_TO_EDGE = 0 at edge → invert → 1 at edge = bright crack.
        </li>
        <li>
          <strong>No bloom visible:</strong> emission strength must exceed the
          Bloom threshold (default 1.0).  Strength 6.0 at threshold 1.0 gives
          strong halation.  Ensure Bloom is enabled in Render Properties.
        </li>
        <li>
          <strong>Animation does not scroll:</strong> the driver uses{" "}
          <code>frame</code> (built-in driver variable), not a Python expression
          accessing bpy.  If the driver shows a red error icon, open the Driver
          panel and confirm the expression is exactly <code>frame * 0.003</code>{" "}
          with no imports or bpy references.
        </li>
        <li>
          <strong>GLB emissive is dim in Three.js:</strong> confirm
          KHR_materials_emissive_strength is ticked in the glTF export dialogue
          (it is on by default when emission strength &gt; 1.0 in the bundled
          Blender glTF I/O add-on).
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Cross-references</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-eevee-next-volumetric-light-cone" className={lk}>
            EEVEE Next — Volumetric Light Cone + Bloom
          </Link>{" "}
          — companion guide to EEVEE Next effects including Bloom configuration.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-procedural-wood-grain" className={lk}>
            Shader — Procedural Wood Grain
          </Link>{" "}
          — similar wave-based Voronoi technique applied to an organic texture
          with anisotropic sheen.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere" className={lk}>
            GN Dual Mesh — Procedural Voronoi Cell Sphere
          </Link>{" "}
          — the geometry-nodes companion: using Voronoi cell structure to drive
          topology rather than shading.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin" className={lk}>
            Shader — Subsurface Scattering: Stylised Skin
          </Link>{" "}
          — covers Subsurface Weight and radius tuning, used here for heat-bleed
          at plate edges.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
            Shader — Principled Transmission + Iridescence
          </Link>{" "}
          — deeper reference for Principled BSDF v2 parameters touched here.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/voronoi.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Voronoi Texture Node
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — authoritative reference for
          Feature and Distance metric options including DISTANCE_TO_EDGE.
          Related: the{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/eevee/render_settings/bloom.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            EEVEE Bloom settings page
          </a>{" "}
          in the same manual.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KHR_materials_emissive_strength — Khronos glTF Extension
          </a>{" "}
          (Apache-2.0, Khronos Group) — specification for emissive values above
          1.0 in glTF 2.0.  Related sibling:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (the bundled exporter implementation).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-procedural-lava-magma-flow",
  title: "Shader — Procedural Lava / Magma Flow Material (Blender 5.1)",
  created: "2026-06-11",
  tags: [
    "blender",
    "shading",
    "voronoi",
    "eevee-next",
    "displacement",
    "emission",
    "animation",
    "gltf",
    "webxr",
  ],
  libraryPath:
    "public/library/blends/shading/shader-procedural-lava-magma-flow/",
  Body: ShaderProceduralLavaMagmaFlowBody,
});
