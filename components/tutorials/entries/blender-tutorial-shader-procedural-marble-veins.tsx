import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderProceduralMarbleVeinsBody() {
  return (
    <>
      <p>
        Marble forms when limestone is subjected to extreme heat and pressure
        during metamorphic events.  Calcite crystals recrystallise into an
        interlocking mosaic of near-pure white grains.  Impurities — iron
        oxides (rust-red), graphite (dark grey), serpentine (olive-green),
        pyrite (gold) — cannot fit into the calcite lattice and are pushed to
        the boundaries between growing crystals.  Under continued stress these
        impurity layers flow as thin seams, eventually freezing as veins when
        the rock cools.  That geological narrative is the blueprint for this
        shader: every node choice maps to one physical fact.  The{" "}
        <code>ShaderNodeTexWave</code> with <code>wave_type=&apos;BANDS&apos;</code>{" "}
        and <code>bands_direction=&apos;Z&apos;</code> represents the regular layering
        of a sedimentary parent rock; <code>Distortion=2.5</code> represents the
        plastic deformation that bent those layers during metamorphism.  A{" "}
        <code>ShaderNodeValToRGB</code> with <strong>CONSTANT</strong>{" "}
        interpolation converts the continuous sinusoidal wave output into a
        crisp binary mask — background is white, vein is black — because real
        marble veins have sharp mineralogical boundaries, not gradients.
        Compare the wave-plus-distortion approach used here with the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-wood-grain" className={lk}>
          wood grain shader
        </Link>
        , where wave distortion is applied as a coordinate perturbation before
        the node rather than as the node&apos;s own built-in distortion parameter.
        Both strategies bend wave outputs into irregular lines; the difference
        is where the noise is injected.
      </p>

      <p>
        The vein width is controlled by the gap between two ColorRamp stops —
        <code>VEIN_STOP_LO=0.35</code> and <code>VEIN_STOP_HI=0.42</code>.  With
        CONSTANT interpolation, the ramp outputs black only in the{" "}
        <code>[0.35, 0.42]</code> interval and white everywhere else.  The
        gap of 0.07 represents 7% of the wave period.  With{" "}
        <code>VEIN_FREQ=5</code> (five cycles per unit length), each period is
        0.2 m, so each vein is 0.014 m wide before distortion warps it.
        Narrowing the gap toward 0.02 gives the hairline veins of Statuario
        marble; widening it toward 0.25 gives the thick banding of Verde
        Alpi.  The Wave node&apos;s own <code>Detail</code> input (set to 2.0)
        adds a finer secondary undulation on top of the primary distortion,
        which is why some veins appear to branch or widen at irregular
        intervals.  This layering of distortion frequencies is the same
        principle used in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-lava-magma-flow" className={lk}>
          lava/magma flow shader
        </Link>
        , where multiple noise octaves at different scales create the feeling
        of convective cells within larger flow channels.
      </p>

      <p>
        A second <code>ShaderNodeTexNoise</code> — large scale, moderate octave
        count — drives a subtle tonal variation in the background.  Real marble
        is not a flat white: grain-size variation and micro-inclusion density
        create cloudy regions that are slightly darker or cooler.  The noise
        output feeds a second ColorRamp that maps from{" "}
        <code>CLOUD_DARK=(0.80, 0.79, 0.77)</code> to{" "}
        <code>BASE_COLOR=(0.94, 0.92, 0.90)</code>.  The cloud colour then
        feeds into slot <strong>Color2</strong> of a MixRGB node, with the
        vein mask in the Factor slot.  Because the mask outputs white for
        background (Factor=1 → Color2) and black for veins (Factor=0 →
        Color1), Color1 carries the vein colour{" "}
        <code>VEIN_COLOR=(0.05, 0.05, 0.06)</code> and Color2 carries the
        cloud-varied background.  This data-flow direction matters: swapping
        the slots would show veins everywhere except where the mask fires,
        inverting the material.
      </p>

      <p>
        The Principled BSDF v2 parameters encode the physics of polished
        stone.  <strong>Subsurface Weight=0.12</strong> and{" "}
        <strong>Subsurface Radius=(0.05, 0.04, 0.03)</strong> m give calcite
        its characteristic amber glow: red photons scatter furthest before
        being re-emitted, so slab edges warm toward amber rather than staying
        cold white.  The SSS model here is RANDOM_WALK (Blender 5.1 default
        for Principled BSDF v2), which handles thin sections correctly —
        compare with the{" "}
        <Link href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin" className={lk}>
          SSS skin shader
        </Link>
        , which uses RANDOM_WALK_SKIN for asymmetric scattering across a
        biologically meaningful profile.  <strong>Coat Weight=1.0</strong>{" "}
        and <strong>Coat Roughness=0.04</strong> create the two-layer specular
        that separates polished marble from plastic: a very tight, mirror-like
        highlight (Coat) floats above a broader diffuse halo (Base Roughness=0.08).
        The Coat IOR is inherited from the base{" "}
        <code>IOR=1.486</code> (calcite ordinary ray index), which also governs
        Fresnel strength at glancing angles — if you set{" "}
        <code>IOR=1.0</code>, the tile loses its edge sheen entirely.  The
        same IOR/Fresnel interaction is central to the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
          iridescence tutorial
        </Link>
        , where the thin-film Fresnel response produces spectral colour
        shifts.  For WebXR delivery via GLB, the clearcoat exports as{" "}
        <code>KHR_materials_clearcoat</code>, which Three.js r152+ honours in
        <code>MeshPhysicalMaterial</code>.  The SSS is baked to a texture at
        export time and cannot be previewed at real-time framerates in a browser
        — unlike the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          faceted gem WebXR pipeline
        </Link>
        , which avoids SSS entirely in favour of transmission.
      </p>

      <p>
        <strong>Blueprint artefacts:</strong>{" "}
        <code>blends/shading/shader-procedural-marble-veins/marble.blend</code>{" "}
        + <code>glbs/shading/shader-procedural-marble-veins/marble.glb</code>.
        Run <code>record.py</code> in the same session to produce the 5-second
        orbit animation: Phase 1 shows the coat specular sweeping across the
        tile surface; Phase 2 tracks the veins laterally; Phase 3 dims the key
        light so the SSS amber glow at the slab edges becomes visible.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Veins appear as dots, not lines.</strong> The Z-compression
          vector (<code>VectorMath MULTIPLY</code>, Z component = 0.45) is
          missing or set to 1.0.  At Z=1.0 the wave bands form circular blobs
          when viewed from above.  Reduce Z to 0.3–0.5 to elongate them into
          flowing lines.
        </li>
        <li>
          <strong>Coat highlight is invisible in Material Preview.</strong>{" "}
          Material Preview uses EEVEE with a studio HDRI.  Coat is only visible
          when a concentrated light source is within the specular cone.  Switch
          to Rendered (Cycles) or add a small area light near the camera.
        </li>
        <li>
          <strong>SSS edge glow missing in Cycles.</strong> Set{" "}
          <code>Subsurface Weight &gt; 0</code> and ensure the render engine is
          Cycles (not EEVEE — EEVEE computes SSS as a screen-space approximation
          that does not show at slab edges).  Increase <code>SSS_RADIUS</code>{" "}
          to 0.1+ to make the glow more visible during testing.
        </li>
        <li>
          <strong>Vein mask is soft, not sharp.</strong> Ensure{" "}
          <code>cr_vn.color_ramp.interpolation = &apos;CONSTANT&apos;</code>.  If the
          ramp reverts to LINEAR (can happen if the blend file is reloaded with
          default node settings), the veins will have gradient edges.
        </li>
        <li>
          <strong>GLB export lacks clearcoat.</strong> The Blender glTF exporter
          writes <code>KHR_materials_clearcoat</code> only when{" "}
          <code>Coat Weight &gt; 0</code> and the material uses Principled BSDF v2
          (not the legacy Principled BSDF v1 or a custom BSDF group).  Verify
          the node type is <code>ShaderNodeBsdfPrincipled</code>.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Wave Texture Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation).  Related: the Blender source
          repository at{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>{" "}
          (GPL-2+) and the{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO exporter
          </a>{" "}
          (Apache-2.0, Khronos / Blender Foundation).
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Principled BSDF v2
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation).  The two-layer specular model
          and RANDOM_WALK SSS implementation derive from Brent Burley&apos;s
          Disney BSDF paper (2012, PD reference).  Related: the{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/OpenShadingLanguage"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenShadingLanguage
          </a>{" "}
          OSL reference implementation (BSD-3-Clause, ASWF) which includes the
          canonical clearcoat and SSS closures that Blender&apos;s Cycles kernel
          adapts.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-procedural-marble-veins",
  title:
    "Shader: Procedural Marble — Wave-Distortion Vein System, Subsurface Translucency & Clearcoat Polish (Blender 5.1)",
  tags: [
    "blender",
    "shader",
    "procedural",
    "marble",
    "wave",
    "subsurface",
    "clearcoat",
    "pbr",
    "glb",
    "stone",
  ],
  category: "tutorial",
  publishedOn: "2026-06-13",
  summary:
    "No-texture marble shader for Blender 5.1. ShaderNodeTexWave BANDS with Distortion=2.5 " +
    "generates the irregular vein network; a CONSTANT ColorRamp gives hairline-sharp vein edges. " +
    "Principled BSDF v2 Subsurface Radius (0.05, 0.04, 0.03) models calcite's warm amber edge glow; " +
    "Coat Weight=1 + Coat Roughness=0.04 separates the mirror-polish sheen from the rough calcite base.",
  body: ShaderProceduralMarbleVeinsBody,
  libraryPath: "blends/shading/shader-procedural-marble-veins",
});
