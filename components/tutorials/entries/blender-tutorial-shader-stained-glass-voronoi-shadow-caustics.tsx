import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderStainedGlassBody() {
  return (
    <>
      <p>
        The lead cames that hold the coloured glass pieces in a medieval
        stained-glass window run along the boundaries between the glass panes.
        Those boundaries are Voronoi cell edges: each piece of glass is cut to
        cover one Voronoi cell, and the lead follows the skeleton of the
        tessellation.  The{" "}
        <code>ShaderNodeTexVoronoi</code> node with{" "}
        <code>feature=&apos;DISTANCE_TO_EDGE&apos;</code> outputs exactly that
        metric — zero at any cell edge, rising toward the cell centroid.
        A <code>ColorRamp</code> with its left stop at position 0.0 (white)
        and its right stop at <code>LEAD_WIDTH=0.07</code> (black) remaps this
        into a sharp binary mask: white in the lead region, black in the glass
        interior.  The mask controls the factor of a{" "}
        <code>Mix Shader</code> node, which selects between a Lead BSDF and a
        Glass BSDF per surface point.  Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-voronoi-cracked-ceramic-iridescence"
          className={lk}
        >
          cracked-glaze ceramic tutorial
        </Link>
        {" "}— both use <code>DISTANCE_TO_EDGE</code>, but ceramic cracks arise
        from a 3D thermal stress field (Object-space Voronoi, seam-independent),
        whereas lead cames are a flat 2D design (UV-space Voronoi, panel-plane-locked).
        The coordinate source choice is the physical argument, not a stylistic one.
      </p>

      <p>
        The same Voronoi node that delivers the lead mask delivers the per-cell
        colour through its <strong>Color output</strong> socket — a random RGB
        hash unique to each cell.  The Distance and Color sockets are evaluated
        in the same kernel call; no second texture node is needed.  The raw hash
        clusters near grey in UV space because the cell index values are uniformly
        distributed but low-entropy as RGB.  A{" "}
        <code>HueSaturation</code> node with{" "}
        <code>Saturation=1.80</code> pushes those grey samples out to the full
        colour wheel, producing the vivid reds, blues, and ambers that
        characterise cathedral glass.  <code>Value=0.75</code> prevents any
        cell from reaching white — white glass does not read as coloured glass
        in a rendered frame.  The saturated colour then feeds the{" "}
        <code>Base Color</code> socket of the Glass BSDF.  Compare the per-cell
        colour approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere"
          className={lk}
        >
          Dual Mesh Voronoi Cell Sphere
        </Link>
        {" "}tutorial, where per-cell identity is expressed as geometry (separate
        face polygons) rather than shader data — the same mathematical structure,
        two different pipeline levels.
      </p>

      <p>
        Stained glass requires two physically distinct closure types.{" "}
        <strong>Lead</strong>: opaque, diffuse, slight metallic sheen from
        oxidation — <code>Metallic=0.30</code>, <code>Roughness=0.50</code>,
        <code>Transmission=0</code>.{" "}
        <strong>Glass</strong>: transmissive, low roughness,
        <code>IOR=1.52</code> (soda-lime float glass), <code>Transmission=0.92</code>.
        These must be blended with{" "}
        <code>Mix Shader</code>, not with a <code>Mix RGB</code> node feeding a
        single Principled BSDF.  The reason is energy conservation at the closure
        level: Principled BSDF assumes one consistent energy budget per surface
        point.  Blending Transmission from 0 (lead) to 0.92 (glass) through a
        gradient mask means pixels at the mask boundary simultaneously receive
        partial lead roughness response AND partial glass transmission — the two
        lobes are summed, violating the closure&apos;s energy contract.  Mix
        Shader avoids this: in Cycles it probabilistically selects one closure
        per ray sample; in EEVEE it weight-blends the closures correctly.  The
        same argument applies any time the materials being combined differ in
        which BSDF <em>type</em> they use, not just in their parameter values.
        For a related case where one Principled BSDF handles all variation
        (same closure type, different parameters), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          EEVEE SSR graduated-roughness sphere tutorial
        </Link>
        , which blends roughness values within a single Principled BSDF safely.
      </p>

      <p>
        True optical caustics — the bright concentration bands formed by
        Snell-law refraction focusing — require full path tracing.  EEVEE Next
        (Blender 4.2+) provides a useful approximation: setting{" "}
        <code>light.shadow_caustics = True</code> on a Sun or Spot lamp activates
        a kernel that modulates the shadow pass with the material&apos;s effective
        transmission tint, projecting coloured light patches on receiving surfaces
        below the glass.  This is not physically correct (no focus bands, no
        spectral dispersion), but it produces the warm colour pools that identify
        a cathedral nave in photographs and is cheap enough to render in real time.
        For Cycles accuracy, switch the render engine to Cycles, open{" "}
        <em>Render Properties → Light Paths → Caustics</em>, and enable{" "}
        <em>Reflective</em> and <em>Refractive</em>.  The Cycles approach
        is described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-path-glass-fireflies"
          className={lk}
        >
          Cycles Light Path node — Glass Without Fireflies
        </Link>
        {" "}tutorial, which addresses the complementary problem of controlling
        unwanted caustic light paths rather than encouraging them.
      </p>

      <p>
        The GLB export uses{" "}
        <strong>KHR_materials_transmission</strong>, the Khronos extension for
        physically based transmission in glTF 2.0.  The Blender glTF exporter
        (Apache-2.0, KhronosGroup/glTF-Blender-IO) includes this extension
        automatically when the Principled BSDF <em>Transmission Weight</em>{" "}
        socket carries a value greater than zero.  Three.js r152+ supports it
        via <code>MeshPhysicalMaterial</code> with the{" "}
        <code>GLTFLoader</code> transmission extension.  For WebXR targets
        without transmission support, a baked-texture fallback (flat RGBA atlas
        with per-cell hue, no depth transparency) is recommended — the cell
        colours survive the bake; only the refraction and depth transmission
        are lost.
      </p>

      <h3>Troubleshooting</h3>
      <ul>
        <li>
          <strong>Lead lines invisible in Material Preview:</strong>{" "}
          switch to Rendered mode.  Material Preview does not evaluate Mix Shader
          correctly in all configurations; EEVEE Rendered mode does.
        </li>
        <li>
          <strong>Shadow caustics absent on the floor:</strong>{" "}
          verify <code>light.shadow_caustics=True</code>, <code>scene.eevee.use_shadows=True</code>,
          and the glass material&apos;s <code>shadow_method=&apos;HASHED&apos;</code>.  All
          three must be set for the coloured shadow kernel to fire.
        </li>
        <li>
          <strong>All glass cells appear the same grey:</strong>{" "}
          the Voronoi Color output hash clusters near grey in UV space.  Confirm the
          HueSaturation Saturation value is ≥1.5.  If cells are still uniform, check
          that you&apos;re reading the <em>Color</em> output socket, not the{" "}
          <em>Distance</em> socket from the same Voronoi node.
        </li>
        <li>
          <strong>Floor shows a hard-edged grey shadow blob, not coloured patches:</strong>{" "}
          the glass material&apos;s <code>blend_method</code> must be{" "}
          <code>&apos;BLEND&apos;</code>, not <code>&apos;OPAQUE&apos;</code>.  The opaque
          shadow pass ignores transmission tint.
        </li>
        <li>
          <strong><code>AttributeError: &apos;Light&apos; object has no attribute
          &apos;shadow_caustics&apos;</code>:</strong>{" "}
          this attribute was introduced in Blender 4.2 (EEVEE Next).  Upgrade
          to 4.2+ or use Cycles caustics instead.
        </li>
      </ul>

      <h3>Sources &amp; Credits</h3>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/voronoi.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Voronoi Texture Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation).  Feature-mode enumeration, Distance
          and Color output contracts, dimension settings.  Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/eevee/render_settings/shadows.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            EEVEE Next Shadows
          </a>{" "}
          (same licence), documenting the shadow caustics light property.
        </li>
        <li>
          <a
            href="https://iquilezles.org/articles/voronoi/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Inigo Quilez — Voronoi Noise
          </a>{" "}
          (MIT, code samples).  First-principles derivation of F1, F2, and
          DISTANCE_TO_EDGE metrics.  Related:{" "}
          <a
            href="https://iquilezles.org/articles/smoothvoronoi/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            smooth Voronoi
          </a>{" "}
          (also MIT) — the mathematical basis of Blender&apos;s{" "}
          <code>SMOOTH_F1</code> feature mode.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup — glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group).  The Blender glTF exporter that emits
          KHR_materials_transmission when Transmission Weight &gt; 0.  Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KHR_materials_transmission specification
          </a>{" "}
          in the core glTF repository.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-stained-glass-voronoi-shadow-caustics",
  title:
    "Shader — Procedural Stained Glass: Voronoi Cell Tint + Lead Lines + EEVEE Shadow Caustics (Blender 5.1)",
  tags: [
    "blender",
    "shader",
    "voronoi",
    "stained-glass",
    "transmission",
    "eevee",
    "caustics",
    "mix-shader",
    "pbr",
    "glb",
    "khr-materials-transmission",
  ],
  category: "tutorial",
  publishedOn: "2026-06-17",
  summary:
    "A procedural stained-glass window material driven by a single Voronoi Texture node. " +
    "The Distance output provides the lead-line mask via ColorRamp threshold; the Color " +
    "output provides per-cell hue variation via HueSaturation boost. Two Principled BSDFs " +
    "— an opaque lead came and a transmissive glass pane — are blended with Mix Shader " +
    "for energy-correct closure mixing. EEVEE Next Shadow Caustics project tinted light " +
    "patches on a receiving floor without path tracing. GLB export uses KHR_materials_transmission.",
  body: ShaderStainedGlassBody,
  libraryPath: "blends/shading/shader-stained-glass-voronoi-shadow-caustics",
});
