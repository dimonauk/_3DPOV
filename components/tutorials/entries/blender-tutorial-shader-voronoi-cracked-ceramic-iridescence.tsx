import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderVoronoiCrackedCeramicBody() {
  return (
    <>
      <p>
        Every crack in a crackle-glaze ceramic is a Voronoi cell boundary.
        The glaze — already rigid below its glass-transition temperature —
        cools faster than the clay body and cannot accommodate the differential
        thermal contraction, so it fractures along the shortest paths between
        internal stress-concentration points.  Those points are spatially
        random, and the nearest-neighbour diagram of random points <em>is</em>{" "}
        the Voronoi tessellation.  The{" "}
        <code>ShaderNodeTexVoronoi</code> with{" "}
        <code>feature=&apos;DISTANCE_TO_EDGE&apos;</code> outputs exactly this
        metric: zero at any cell boundary, rising to a local maximum at the
        cell&apos;s interior centroid.  Inverting this through a{" "}
        <code>ColorRamp</code> gives bright crack lines over a dark glaze
        ground.  The same physical principle appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere"
          className={lk}
        >
          Dual Mesh Voronoi Cell Sphere
        </Link>{" "}
        geometry-nodes tutorial, where the Voronoi tessellation is expressed
        as geometry rather than shader data; comparing the two reveals how
        the same mathematical structure manifests at different levels of the
        pipeline.
      </p>

      <p>
        The crack width is controlled entirely by{" "}
        <code>CRACK_STOP=0.12</code> — the position of the ColorRamp&apos;s
        right-hand stop.  Because the Voronoi Distance output is roughly
        proportional to the inter-cell spacing, this 0.12 value represents
        12% of the average cell radius being designated &ldquo;crack zone.&rdquo;
        Pulling the stop toward 0.02 produces the hairline crazing of Yixing
        stoneware; pushing it toward 0.35 produces the bold crackle of Song-dynasty
        Guan ware.  The{" "}
        <code>CRACK_SCALE=8.0</code> parameter scales the Voronoi space —
        higher values subdivide the surface into more, smaller cells and
        therefore produce a denser crack network.  Critically, the texture
        coordinate feeds from <code>TexCoord → Object</code> rather than
        <code>UV</code>.  Object-space coordinates are continuous across seams
        and poles; UV-space coordinates introduce discontinuities wherever the
        UV islands meet, which would produce spurious linear artefacts in the
        crack pattern at those boundaries — a failure mode common when Voronoi
        is naïvely driven by UV output.  For a case where UV-space Voronoi is
        intentionally exploited for panel boundaries, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-face-group-boundaries-panel-grooves"
          className={lk}
        >
          Face Group Boundaries — Panel Grooves
        </Link>{" "}
        tutorial.
      </p>

      <p>
        The crack mask drives three independent channels of the Principled
        BSDF&nbsp;v2.  First, <strong>Base Colour</strong>: the glaze ground
        is celadon green (<code>GLAZE_COLOR=(0.20, 0.48, 0.40)</code> — iron
        reduced in a reduction firing at 1260°C) whilst the exposed clay body
        inside the crack is warm buff (<code>CRACK_COLOR=(0.72, 0.68, 0.60)</code>).
        The <code>MixRGB</code> factor is the crack mask directly, so the
        clay colour appears wherever the Distance output is near zero.
        Second, <strong>Roughness</strong>: the intact glaze has roughness 0.04
        (mirror-polished), whilst the crack interior has{" "}
        <code>CRACK_ROUGH=0.65</code> because the freshly exposed clay surface
        is micro-fragmented and scatters light diffusely.  A{" "}
        <code>MapRange</code> node linearly interpolates between the two values
        using the same crack mask — this is preferred over a second MixRGB
        because MapRange is explicit about its min/max contract and avoids the
        colour-space confusion that can arise when MixRGB is used to blend
        scalar values.  Third, <strong>Coat Weight</strong>: the clearcoat only
        exists on intact glaze.  The inverted mask drives a MapRange from
        <code>COAT_WEIGHT=0.85</code> (intact glaze) to <code>0.0</code>
        (inside crack).  Coat Roughness is set to 0.03 — the specular response
        of fire-polished soda-lime glass — and the IOR of the BSDF is set to
        1.50 for the same reason.  Subsurface Weight 0.18 with{" "}
        <code>BODY_SSS_RADIUS=(0.06, 0.04, 0.03)</code> lets light that
        penetrates a crack re-emerge through the surrounding translucent clay,
        producing the amber glow at crack edges that is the visual signature of
        celadon.  Compare the SSS approach here with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-marble-veins"
          className={lk}
        >
          marble vein shader
        </Link>
        , which uses a nearly identical Subsurface Radius vector for the same
        physical reason: both materials are lightly translucent stone-like
        structures that warm incident light passing through them.
      </p>

      <p>
        The soap-film iridescence variant replaces the ceramic physics with
        thin-film optics.  Soap films are water membranes stabilised by
        surfactants; their thickness is non-uniform because gravity and
        evaporation drain liquid from the film differentially.  When the film
        thickness is comparable to visible wavelengths (400–700 nm), the
        reflected waves from the top and bottom interfaces interfere.  Blender
        cannot directly compute thin-film interference, but Voronoi{" "}
        <code>F1</code> distance — the scalar distance from each surface point
        to its nearest cell centre — provides a smooth, spatially varying proxy
        for film thickness.  A <code>Multiply</code> node scales the raw F1
        distance by <code>SOAP_SPIN_AMP=0.45</code> turns, which drives the
        Hue input of a{" "}
        <code>HueSaturation</code> node.  0.45 turns corresponds to sweeping
        across most of the visible spectrum once per cell — matching the
        behaviour of a soap bubble where the film transitions from violet (thin)
        through green (medium) to red (thick) across a single dome.  A{" "}
        <code>Fresnel</code> node with <code>IOR=1.40</code> gates the
        iridescent colour so it only appears at grazing angles.  This is the
        same physical constraint that governs real soap films: at normal
        incidence the reflectance is &lt;0.5%, too dim to see the colour shift
        against transmitted light; at grazing incidence reflectance rises
        toward 4–5%, making the spectral tinting visible.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel"
          className={lk}
        >
          holographic panel shader
        </Link>{" "}
        uses the same Fresnel-gating architecture for a different material
        class — comparing them makes the pattern explicit.
      </p>

      <p>
        The soap bowl also sets <code>Transmission Weight=0.70</code> and{" "}
        <code>Alpha=0.30</code> with <code>blend_method=&apos;BLEND&apos;</code>{" "}
        in EEVEE.  Soap films are nearly fully transparent at normal incidence —
        the reflection coefficient is ~0.3%.  The Alpha value reflects the
        EEVEE compositing weight, not physical accuracy; for Cycles, the
        Transmission input handles the transparency correctly via glass BSDF
        behaviour within the Principled closure.  If the soap bowl appears
        fully black in EEVEE, check that Backface Culling is off in Material
        Properties — transparent two-sided materials require it.  For Cycles
        this check is unnecessary because the renderer handles double-sided
        normals automatically.
      </p>

      <h3>Troubleshooting</h3>
      <ul>
        <li>
          <strong>Crack pattern shows linear streaks near UV seams:</strong>{" "}
          switch the Texture Coordinate socket from <em>UV</em> to{" "}
          <em>Object</em>.
        </li>
        <li>
          <strong>Cracks too faint / too wide after Scale change:</strong>{" "}
          preview the raw Voronoi Distance output in a Viewer (or Emission)
          node before adjusting CRACK_STOP.  Distance output range shifts with
          Scale.
        </li>
        <li>
          <strong>Clearcoat invisible in Material Preview:</strong>{" "}
          EEVEE&apos;s Material Preview does not always compute Coat. Use
          Rendered mode with EEVEE or switch to Cycles preview.
        </li>
        <li>
          <strong>Soap film colour cycle wrong direction:</strong>{" "}
          negate the Multiply output (or subtract from 1.0) before the
          HueSaturation Hue input to reverse the hue sweep direction.
        </li>
      </ul>

      <h3>Sources & Credits</h3>
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
          (CC-BY-SA 4.0, Blender Foundation). The feature-mode enumeration and
          distance-metric table come directly from this reference.  Related:
          the manual&apos;s{" "}
          <em>Texture Nodes</em> index, which documents all procedural texture
          nodes and their output contracts.
        </li>
        <li>
          <a
            href="https://iquilezles.org/articles/voronoi/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Inigo Quilez — Voronoi Noise (mathematical derivation)
          </a>{" "}
          (MIT, code samples).  IQ&apos;s derivation of smooth Voronoi, F1/F2
          distance, and the DISTANCE_TO_EDGE metric from first principles.
          Related: his{" "}
          <a
            href="https://iquilezles.org/articles/smoothvoronoi/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            smooth Voronoi article
          </a>{" "}
          (also MIT), which is the mathematical basis for Blender&apos;s{" "}
          SMOOTH_F1 feature mode.
        </li>
        <li>
          <a
            href="https://github.com/AcademySoftwareFoundation/OpenShadingLanguage"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenShadingLanguage — stdosl.h
          </a>{" "}
          (BSD-3-Clause, Academy Software Foundation).  The canonical Fresnel
          and dielectric-transmission closure implementations that Blender&apos;s
          Cycles kernel adapts for the Principled BSDF.  Related: the ASWF&apos;s{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/MaterialX"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            MaterialX
          </a>{" "}
          standard (Apache-2.0), which formalises the thin-film BSDF layer
          that a future Blender release is expected to adopt.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-voronoi-cracked-ceramic-iridescence",
  title:
    "Shader: Voronoi DISTANCE_TO_EDGE — Cracked-Glaze Ceramic & Soap-Film Iridescence (Blender 5.1)",
  tags: [
    "blender",
    "shader",
    "voronoi",
    "procedural",
    "ceramic",
    "crackle",
    "iridescence",
    "fresnel",
    "pbr",
    "glb",
  ],
  category: "tutorial",
  publishedOn: "2026-06-17",
  summary:
    "Two procedural shaders built on the Voronoi Texture node. " +
    "DISTANCE_TO_EDGE mode extracts cell-boundary crack geometry for a " +
    "crackle-glaze celadon ceramic; crack width is controlled by a " +
    "ColorRamp stop, roughness and clearcoat invert together at boundaries. " +
    "A second variant uses F1 distance as a thin-film thickness proxy, " +
    "driving a HueSaturation hue-rotation gated by Fresnel for soap-film iridescence.",
  body: ShaderVoronoiCrackedCeramicBody,
  libraryPath: "blends/shading/shader-voronoi-cracked-ceramic-iridescence",
});
