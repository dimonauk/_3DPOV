import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderVectorDisplacementBody() {
  return (
    <>
      <p>
        A normal map is a lie the shader tells the lighting model — the
        surface remains geometrically flat whilst the shading normal pretends
        otherwise.  A{" "}
        <strong>vector displacement map</strong> (VDM) is the honest version:
        a 32-bit float OpenEXR image whose RGB channels store per-texel XYZ
        offset vectors, read by Cycles at render time to tessellate and
        physically move geometry.  The silhouette of a riveted armour panel
        bows outward at the rivet; contact shadows pool correctly in the
        recesses; no geometry fakery is required.  The trade-off is render
        cost, an Experimental feature-set requirement, and an export
        dichotomy — VDMs cannot travel to WebXR or GLB, so the studio
        pipeline keeps them in the .blend library and delivers baked normal
        maps to the runtime instead.
      </p>
      <p>
        This tutorial builds a sci-fi armour breastplate panel from scratch,
        generates a baked 32-bit EXR displacement map via a Cycles
        Selected-to-Active bake, wires the{" "}
        <code>ShaderNodeVectorDisplacement</code> node in Tangent Space mode,
        and configures Adaptive Subdivision so Cycles only tessellates where
        the displacement changes fastest.  The final section shows exactly
        which material settings to switch before a GLB export so the file
        renders correctly in WebXR — without the studio render overhead.
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles Adaptive Subdivision tutorial
        </Link>
        {" "}(which uses a procedural noise source rather than a baked sculpt).
      </p>

      <h2>Why 32-bit float — not 16-bit, not PNG</h2>
      <p>
        Displacement maps contain <em>signed</em> data: negative values mean
        inward displacement.  An 8-bit PNG saturates at zero on the negative
        side — all inward detail is lost.  A 16-bit half-float covers
        ±65&thinsp;504 but its precision near zero is only ≈&nbsp;0.0006
        (one ULP at half precision).  For a 0.015&nbsp;m displacement
        amplitude spread across a 1&thinsp;K texture, each texel represents
        ≈&nbsp;14&nbsp;µm — below half-float resolution.  A 32-bit float
        provides ≈&nbsp;1.2&nbsp;×&nbsp;10<sup>−7</sup> relative precision
        across the full range, comfortably sub-micron, at ≈&nbsp;4&nbsp;MB
        per 1024² channel.  Save as <strong>OpenEXR, 32-bit float</strong>.
      </p>

      <h2>Non-Color colorspace is not optional</h2>
      <p>
        Blender applies sRGB gamma decode to every image whose colorspace is
        set to "sRGB" or "Filmic sRGB" when it feeds the shader.  A VDM is
        raw linear data — displacement magnitudes, not display colours.
        Gamma decode maps a stored value of 0.5 to ≈&nbsp;0.73 instead of
        0.5, corrupting every displacement sample.  Set the Image Texture
        node colorspace to{" "}
        <strong>Non-Color</strong> before baking and before assigning the
        EXR to the Vector Displacement node.  Forgetting this produces a
        subtly wrong displaced surface with no obvious error message — it
        just looks a bit too bright and a bit too bumpy.
      </p>

      <h2>Selected-to-Active bake: cage extrusion sizing</h2>
      <p>
        In Cycles Selected-to-Active mode, the bake fires a ray from each
        texel on the <em>active</em> (low-poly) mesh surface, offset
        outward by the cage extrusion distance, then tests intersection
        with the <em>selected</em> (high-poly) mesh.  The cage extrusion
        must exceed the maximum displacement amplitude on the high-poly:
        if a rivet protrudes 15&nbsp;mm and the cage is only 10&nbsp;mm,
        the ray starts inside the rivet and records the wrong intersection.
        The rule of thumb used here is{" "}
        <strong>cage = 110&nbsp;% of peak displacement amplitude</strong> —
        in this tutorial, 0.015&nbsp;m × 1.1 = 0.0165&nbsp;m.  Overshooting
        the cage causes bleed artefacts at UV seams (rays pierce thin
        geometry and hit the back face), so do not round up excessively.
      </p>

      <h2>Displacement node vs Vector Displacement node</h2>
      <p>
        Blender offers two displacement nodes in the shader editor:
      </p>
      <ul>
        <li>
          <code>Displacement</code> — takes a <em>scalar Height socket</em>
          and displaces along the surface normal only.  Appropriate when the
          source is a height map (single channel, e.g. baked from a noise
          texture).
        </li>
        <li>
          <code>Vector Displacement</code> — takes a <em>Vector socket</em>
          (RGB = XYZ) and displaces in an arbitrary direction.  Required for
          VDMs produced by sculpting tools that capture overhangs, side-pressed
          detail, or any displacement that is not colinear with the surface
          normal.
        </li>
      </ul>
      <p>
        Blender&apos;s own DISPLACEMENT bake type writes the height offset
        into the Red channel only (the offset is always along the normal), so
        for a pure-Blender workflow the scalar Displacement node is
        semantically equivalent.  Vector Displacement in{" "}
        <strong>Tangent Space</strong> mode is used here because it is the
        correct node for VDMs produced by external sculpting tools
        (ZBrush, Mudbox, Substance Painter) where all three channels carry
        meaningful data — adopting it now keeps the shader wiring consistent
        regardless of source.  If you need{" "}
        <em>Object Space</em> VDM (UV-independent, correct for posed
        characters), switch the Space enum from Tangent to Object.
      </p>

      <h2>Adaptive Subdivision: dicing rate and budget</h2>
      <p>
        Adaptive Subdivision in Cycles is camera-relative: the{" "}
        <code>dicing_rate</code> parameter specifies the maximum edge length
        of a micropolygon in <em>screen pixels</em>.  A dicing rate of
        1.0&nbsp;px means no micropolygon edge occupies more than 1 screen
        pixel — effectively full pixel coverage.  A rate of 4.0&nbsp;px gives
        four times fewer polygons, visible as faceted edges on the displaced
        silhouette.  The performance cost scales roughly as
        dicing_rate<sup>−2</sup>: halving the rate quadruples the tessellation
        budget.  Start at 2.0 for previews; drop to 1.0 or 0.5 for final
        renders.  Use the{" "}
        <code>use_adaptive_subdivision</code> flag on the Subdivision Surface
        modifier — the modifier must be present even though Cycles controls
        the actual tessellation.
      </p>
      <p>
        The studio displacement tutorial at{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles Adaptive Subdivision + True Displacement
        </Link>
        {" "}covers the procedural Noise → Displacement chain.  The batch
        bake pipeline documented in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Python Cycles Batch Bake — Normal, AO &amp; Emission to WebP
        </Link>
        {" "}shows how to convert the Cycles-rendered displacement into a
        WebXR-compatible normal map automatically.  For the foundational UV
        and bake workflow that underpins both, start with{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking: Normal + AO
        </Link>
        .
      </p>

      <h2>Export dichotomy: what goes in the GLB</h2>
      <p>
        Before any GLB export, perform these three steps so the file renders
        correctly in WebXR / Three.js without the VDM overhead:
      </p>
      <ol>
        <li>
          <strong>Material Settings › Surface › Displacement → Bump Only.</strong>{" "}
          This switches Cycles from geometry displacement to normal-perturbation
          mode; the glTF exporter then reads the Bump or Normal Map socket
          instead of the Displacement socket.
        </li>
        <li>
          <strong>Disable the Adaptive Subdivision modifier.</strong>{" "}
          The glTF exporter does not apply modifiers by default; leaving
          Adaptive Subdivision enabled bloats the export mesh or — worse —
          confuses the exporter.
        </li>
        <li>
          <strong>Bake a normal map from the displaced Cycles render</strong>{" "}
          and assign it to a Normal Map node in the shader.  The VDM detail
          collapses to zero in the GLB without this step.  See the{" "}
          <Link
            href="/tutorials/blender-tutorial-shader-detail-normal-rnm-overlay-hard-surface"
            className={lk}
          >
            Detail Normal (RNM) Overlay tutorial
          </Link>
          {" "}for how to layer a detail normal map on top of the baked base normal.
        </li>
      </ol>

      <h2>Blueprint walkthrough</h2>
      <p>
        <code>blueprint.py</code> runs end-to-end from an empty scene.
        <code>reset_scene()</code> sets Cycles + Experimental feature set.
        <code>build_base_panel()</code> creates the 8×5 grid with bevelled
        boundary edges and a Smart UV unwrap (66° angle limit,
        0.02 island margin).  <code>build_high_poly()</code> duplicates,
        applies SubD level 4 (16× face count), then stacks two Displacement
        modifiers — a low-frequency warp at scale 3.5 (amplitude 0.006&nbsp;m)
        for broad contour and a high-frequency noise at scale 12 (amplitude
        0.0105&nbsp;m) for surface micro-detail — before applying both to
        commit the displaced mesh.  <code>setup_low_poly_material()</code>
        creates the 32-bit float Non-Color image, adds it as an active Image
        Texture node.  <code>bake_displacement()</code> runs the Cycles bake,
        saves the EXR.  <code>build_vdm_shader()</code> wires the Vector
        Displacement node, sets <code>mat.cycles.displacement_method =
        &quot;DISPLACEMENT&quot;</code>, and adds the Adaptive Subdivision
        modifier.  The high-poly is then hidden — it is a helper mesh, not
        the deliverable.
      </p>
      <p>
        After running the blueprint, press F12 in Cycles Experimental to see
        the displaced geometry.  Adjust <code>DISPLACE_AMP</code> and
        <code>DICING_RATE</code> at the top of the script to taste.
      </p>

      <p>Outside references for this tutorial:</p>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/vector/vector_displacement.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Foundation — Vector Displacement Node Manual
          </a>{" "}
          (CC-BY-4.0, Blender Foundation) — complete parameter reference for
          Space (Tangent / Object / World), Midlevel, and Scale, with a
          diagram of how tangent-space vectors map to world geometry.
        </li>
        <li>
          <a
            href="https://github.com/AcademySoftwareFoundation/openexr"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            AcademySoftwareFoundation/openexr
          </a>{" "}
          (Apache-2.0, Academy Software Foundation) — reference implementation
          and specification for the OpenEXR 32-bit float image format used to
          store VDMs.  Related projects from the same organisation:{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/Imath"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Imath
          </a>{" "}
          (Apache-2.0, the vector/matrix maths library underlying OpenEXR) and{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/openexr-website"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            openexr-website
          </a>{" "}
          (Apache-2.0).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-vector-displacement-multires-bake-cycles",
  title:
    "Shader: Vector Displacement Map — Multires Sculpt Bake to 32-bit EXR + Cycles Adaptive Subdivision (Blender 5.1)",
  tags: [
    "blender",
    "shader",
    "displacement",
    "vector-displacement",
    "cycles",
    "adaptive-subdivision",
    "bake",
    "exr",
    "openexr",
    "hard-surface",
    "sci-fi",
    "pbr",
  ],
  category: "tutorial",
  publishedOn: "2026-07-04",
  summary:
    "A 32-bit float OpenEXR displacement map baked from a simulated multires " +
    "sculpt feeds the Cycles Vector Displacement node (Tangent Space) to " +
    "tessellate real geometry at render time. Covers cage extrusion sizing, " +
    "Non-Color colorspace requirement, Adaptive Subdivision dicing rate budget, " +
    "and the three-step export switch needed before GLB / WebXR delivery.",
  body: ShaderVectorDisplacementBody,
  libraryPath:
    "blends/shading/shader-vector-displacement-multires-bake-cycles",
});
