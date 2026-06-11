import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderPrincipledVolumeFogColumnBody() {
  return (
    <>
      <p>
        Blender&apos;s <strong>Principled Volume</strong> shader unifies
        scattering, absorption, and emission in a single node — the volumetric
        analogue of Principled BSDF for surfaces.  The technique here creates a
        procedural atmospheric fog column: a tall cube mesh acting as the
        volume domain, a Noise Texture driving non-uniform density, and a
        narrow Spot Light overhead producing god-ray beams through
        Henyey-Greenstein forward scatter.  Understanding why Anisotropy and
        Density are physically distinct from opacity is the core lesson.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Physics in two minutes</h2>
      <p>
        Volume rendering solves the <em>radiative transfer equation</em>, which
        tracks how light is extinguished (absorbed or scattered out of the ray)
        and added back (scattered in from other directions, emitted).  Blender
        maps its parameters directly to this equation:
      </p>
      <ul className="list-disc list-inside space-y-1 mt-2">
        <li>
          <strong>Density</strong> = σ_s, the scattering coefficient in m⁻¹.
          At Density = 0.15 the mean free path is ~6.7 m, so the volume is
          translucent at arm&apos;s length and fully opaque at 10 m depth.
          This is <em>not</em> an opacity slider — it scales both scatter and
          absorption simultaneously.
        </li>
        <li>
          <strong>Anisotropy</strong> = the Henyey-Greenstein g parameter.
          g = 0 → light scatters equally in all directions (uniform haze).
          g = 0.5 → 50% more energy scatters forward than backward →
          god-ray beams appear when the light is roughly behind the fog
          relative to the camera.  g = −0.5 → back-scatter dominant →
          halos around back-lit particles.
        </li>
        <li>
          <strong>Absorption Color</strong> = per-channel absorption albedo.
          Full white = no absorption (pure fog scatter).  Tint toward amber to
          absorb short wavelengths — the look of warm dust or wildfire smoke.
        </li>
        <li>
          <strong>Scatter Color</strong> = the colour of each scatter event.
          Cold blue-grey (0.65, 0.80, 1.00) gives daylight mountain fog.
          Creamy yellow gives old-building interior haze.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Node tree</h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`TexCoord (Object) → Noise Texture
                         Scale   1.8
                         Detail  6.0
                         Roughness 0.65
                         Distortion 0.30
                       ↓ Fac
                     ColorRamp (Linear)
                       stop 0: pos 0.30 → black   ← air-gap low cut
                       stop 1: pos 1.00 → white
                       ↓ Color
               Principled Volume
                 Density      [ColorRamp output]
                 Anisotropy   0.50
                 Scatter Color (0.65, 0.80, 1.00)
                 Absorption Color (1.00, 0.90, 0.75)
                 Emission Strength 0.0
                       ↓ Volume
               Material Output → Volume socket`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Step-by-step</h2>

      <h3 className="font-medium mt-4 mb-1">1. Volume domain mesh</h3>
      <p>
        Add a Cube (Shift+A → Mesh → Cube).  Scale it to 1.2 × 1.2 × 4.0 m
        (a tall column).  Apply transforms.  The mesh <strong>must be
        closed and convex</strong> — Blender&apos;s volume shader evaluates only
        inside the mesh interior.  Any hole or concave notch clips the density
        field at that surface.  A simple box is the safest choice; a cylinder
        works equally well.
      </p>
      <p>
        Lift the cube so its base sits at Z = 0 (location Z = 2.0 m for a
        4 m tall domain).  Add a ground plane (size 10 m), enable
        <strong> Object Properties → Visibility → Shadow Catcher</strong> so
        the floor receives volumetric shadows without needing its own material.
      </p>

      <h3 className="font-medium mt-4 mb-1">2. Spot Light for god-ray geometry</h3>
      <p>
        Add a Spot Light at (0, 0, 5.5) pointing straight down.  Set:
      </p>
      <ul className="list-disc list-inside space-y-1 mt-1">
        <li>Energy 1 200 W — needs to punch through the fog column.</li>
        <li>Spot Size ~20° (0.35 rad) — narrow beam for tight rays.</li>
        <li>Spot Blend 0.15 — soft penumbra avoids a hard cut-off ring.</li>
        <li>Shadow Soft Size 0.04 m — near-point source → sharp volumetric beams.</li>
        <li>
          <strong>Cast Shadow must be enabled</strong> — this is the most common
          omission that makes god rays invisible in EEVEE Next.
        </li>
      </ul>
      <p>
        Area Lights do <em>not</em> cast volumetric shadows in EEVEE Next 5.1.
        Point and Spot are the only types that integrate with the volumetric
        shadow map system.
      </p>

      <h3 className="font-medium mt-4 mb-1">3. Principled Volume material</h3>
      <p>
        Select the domain cube, open Material Properties, click New.  Open
        the Shader Editor.  Delete the default Principled BSDF + Material Output.
        Add: Texture Coordinate → Noise Texture → ColorRamp → Principled
        Volume → Material Output.  Wire: TexCoord Object → Noise Vector,
        Noise Fac → ColorRamp Fac, ColorRamp Color → Principled Volume Density,
        Principled Volume Volume → Material Output Volume.
      </p>
      <p>
        <strong>WHY Object texture coordinates instead of Generated?</strong>{" "}
        Generated coords are normalised to the mesh&apos;s bounding box — rescaling
        the domain silently rescales the noise pattern, so a 4 m domain and a
        0.4 m domain produce identical-looking noise at different real-world
        densities.  Object coords are fixed in world space at 1 unit = 1 metre,
        making VOLUME_DENSITY physically meaningful regardless of domain size.
      </p>

      <h3 className="font-medium mt-4 mb-1">4. Noise Texture — density field</h3>
      <p>
        Set Noise Scale 1.8, Detail 6, Roughness 0.65, Distortion 0.30.
        Distortion applies domain warping (a secondary noise offsets the sample
        position), which breaks the hexagonal bias of Perlin noise and gives a
        more organic wisp structure.  Without Distortion at this scale, the
        noise shows visible diagonal banding.
      </p>
      <p>
        In the ColorRamp, drag the left stop from position 0.0 to 0.30 and set
        it to black.  Noise Fac has a roughly Gaussian distribution centred at
        0.5 — without a low cut, the quietest 30% of the volume still has faint
        density and the &quot;clear air&quot; effect between wisps is lost.  The cut at
        0.30 forces those values to zero, producing visible air gaps.
      </p>

      <h3 className="font-medium mt-4 mb-1">5. EEVEE Next volumetric settings</h3>
      <p>
        Open Render Properties → Volumetrics.  Set:
      </p>
      <ul className="list-disc list-inside space-y-1 mt-1">
        <li>Tile Size: <strong>2</strong> — 2 × 2 pixel tiles, highest resolution.
            Default is 8 (8 × 8 tiles), which is 16× coarser.  Go to 4 for a
            speed/quality trade-off.</li>
        <li>Samples: <strong>128</strong> — ray-march steps per tile per light.
            64 is acceptable for previewing; 256 for final capture.</li>
        <li>Sample Distribution: 0.8 — biases steps toward the near plane where
            detail matters most.</li>
        <li><strong>Volumetric Shadows: On</strong> — without this, the Spot
            Light illuminates the volume uniformly with no beam shadow.</li>
      </ul>

      <h3 className="font-medium mt-4 mb-1">6. Anisotropy — turning god rays on and off</h3>
      <p>
        In the Principled Volume node, start with Anisotropy = 0.  The volume
        should glow softly and evenly — scattered light goes in all directions.
        Raise Anisotropy to 0.5.  With the Spot Light overhead and camera at an
        angle, distinct directional beams should now appear.  This is the
        Henyey-Greenstein forward-scatter peak: energy preferentially scatters
        along the original light direction, so only camera positions that see
        scattered forward-direction light receive the beam.  At g = 0.9, the
        scatter is almost a searchlight — hyper-directional, unrealistic for fog
        but useful for stylised laser-haze effects.
      </p>

      <h3 className="font-medium mt-4 mb-1">7. GLB export note</h3>
      <p>
        glTF 2.0 does not have a volume extension in mainline Blender export.
        Khronos publishes{" "}
        <code>KHR_materials_volume</code> (Apache-2.0) for surface-level
        transmission thickness — not a true voxel domain.  For WebXR delivery,
        tag the domain cube with a custom property (the blueprint does this
        automatically) and replace it in Three.js with a ray-marched fog
        ShaderMaterial or a particle sprite haze system.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Volume is completely black / invisible:</strong>{" "}
          Check Render Properties → Volumetrics → Volumetric Shadows is ON.
          Check the Spot Light → Shadow is enabled.  Check the Spot energy is
          at least 800 W.
        </li>
        <li>
          <strong>God rays visible from one angle only:</strong>{" "}
          Correct — this is the physics.  Forward-scatter (g &gt; 0) only creates
          beams when the camera looks roughly toward the light source through the
          fog.  Orbit the camera or lower Anisotropy for a more omnidirectional look.
        </li>
        <li>
          <strong>Render is very slow:</strong>{" "}
          Lower Tile Size from 2 to 4 or 8.  Lower Samples from 128 to 32 for
          draft renders.  Volumetric Shadows adds a per-light shadow-map pass —
          disable it if you only need ambient haze without directed beams.
        </li>
        <li>
          <strong>Noise shows diagonal banding:</strong>{" "}
          Add Distortion ≥ 0.25 to the Noise Texture, or increase Detail to 8
          to add finer octaves that break up the pattern.
        </li>
        <li>
          <strong>Volume clips at the cube edges (hard rectangular silhouette):</strong>{" "}
          Expected — volume is only evaluated inside the mesh.  Add a Density
          falloff by feeding a Gradient Texture from the centre outward into a
          Multiply node on the density chain.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Cross-references</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-eevee-next-volumetric-light-cone" className={lk}>
            EEVEE Next — Volumetric Light Cone + Bloom
          </Link>{" "}
          — companion guide: EEVEE Next light effects including Bloom thresholds
          and the volumetric start / end range settings.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-points-to-volume-organic-coral" className={lk}>
            GN Points to Volume — Organic Coral Blob
          </Link>{" "}
          — the geometry-nodes route to volume domains: scattering points into a
          voxel field via the Points to Volume node, then meshing with Volume to Mesh.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-procedural-lava-magma-flow" className={lk}>
            Shader — Procedural Lava / Magma Flow
          </Link>{" "}
          — the Emission side of volumetric-like effects: using Emission node on
          a surface with EEVEE Bloom to fake volumetric fire glow without a
          domain mesh.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin" className={lk}>
            Shader — Subsurface Scattering: Stylised Skin
          </Link>{" "}
          — surface-level scattering via Principled BSDF Subsurface; complements
          the volume-level Principled Volume scattering covered here.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
            Shader — Principled Transmission + Iridescence
          </Link>{" "}
          — how transmission (IOR, thin-film, roughness) differs from volumetric
          density; together these cover the full light-matter interaction surface.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/volume_principled.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Principled Volume Shader
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — authoritative parameter
          reference including the Density, Anisotropy, Scatter Color, and
          Absorption Color inputs.  Related page in the same manual:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/eevee/render_settings/volumetrics.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            EEVEE Volumetrics settings
          </a>{" "}
          (Tile Size, Samples, Volumetric Shadows).
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KHR_materials_volume — Khronos glTF 2.0 Extension
          </a>{" "}
          (Apache-2.0, Khronos Group) — specification for surface-based
          transmission thickness and absorption in glTF; explains why
          Principled Volume does not map cleanly to this extension and what
          the proxy-mesh + custom shader approach is needed for WebXR.
          Related sibling:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0) — the bundled exporter that handles KHR_materials_volume
          for surface transmission but not voxel domains.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    libraryPath: "public/library/blends/shading/shader-principled-volume-fog-column/",
    blenderVersion: "5.1",
    difficulty: "intermediate",
    time: "one focused session",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-principled-volume-fog-column",
    title:
      "Shader — Principled Volume: Procedural Fog Column (Blender 5.1)",
    date: "2026-06-11",
    kind: "tutorial",
    excerpt:
      "Build a non-uniform atmospheric fog column in Blender 5.1 using the " +
      "Principled Volume shader, Noise Texture density field, and EEVEE Next " +
      "volumetric god-ray shadows via Henyey-Greenstein forward scatter.",
    summary:
      "Principled Volume shader driven by a Noise Texture density field creates " +
      "a procedural atmospheric fog column.  A narrow Spot Light with " +
      "Volumetric Shadows enabled produces god-ray beams controlled by " +
      "Henyey-Greenstein Anisotropy.  Covers the physics of σ_s vs opacity, " +
      "Object vs Generated texture coordinates for stable density, EEVEE Next " +
      "tile-size and sample settings, and the GLB export limitation that " +
      "requires a proxy-mesh approach for WebXR delivery.",
    tags: [
      "blender",
      "shading",
      "volume",
      "principled-volume",
      "eevee-next",
      "fog",
      "atmosphere",
      "god-rays",
      "henyey-greenstein",
      "noise-texture",
      "gltf",
      "webxr",
    ],
    Body: ShaderPrincipledVolumeFogColumnBody,
  },
);
