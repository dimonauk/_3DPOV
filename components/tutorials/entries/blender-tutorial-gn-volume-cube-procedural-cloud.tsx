import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnVolumeCubeProceduralCloudBody() {
  return (
    <>
      <p>
        The <strong>Volume Cube</strong> node in Geometry Nodes does something
        that its name under-sells: it evaluates any field tree you wire into its{" "}
        <code>Density</code> socket <em>once per voxel centre</em>.  That means
        a Noise Texture connected to Density is not applied as a post-process
        overlay — Blender samples it at every discrete voxel position in 3D
        space during the single GN evaluation pass, writing the result directly
        into the voxel grid.  The entire cloud shape is therefore determined at
        the moment the modifier runs, with no simulation, no baking, and no
        external texture files.  Compare this with the shader-only approach in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-volume-fog-column"
          className={lk}
        >
          Principled Volume fog-column tutorial
        </Link>
        , where the noise lives in the material and the volume object is just a
        plain cube — here the noise lives in the geometry itself.
      </p>

      <p>
        The node graph uses two Noise Texture passes.  Noise A runs at a low
        scale ({"`NOISE_A_SCALE = 1.4`"}) with four octaves to produce the large
        billowing lobes of a cumulus.  Noise B runs at a much higher scale
        ({"`NOISE_B_SCALE = 5.5`"}) with two octaves to add thin wisps and
        surface irregularity.  Both are sampled from the per-voxel{" "}
        <code>Position</code> field, so the noise is coherent in world-space
        regardless of voxel resolution.  Fine noise is scaled by 0.28 before
        adding — the blend weight stops the detail from fighting the overall
        shape.  The resulting combined signal is a float in roughly 0–1.1.
      </p>

      <p>
        Two Map Range nodes then sculpt that raw signal into a cloud-shaped
        density field.  The <strong>altitude gradient</strong> separates the Z
        component of the voxel position and remaps {"`[base, top] → [1.0, 0.0]`"} —
        the inverted output means density falls off sharply above the cloud top
        while remaining full-strength at the flat base.  This models the
        physical mechanism: cumulus bases form at the condensation level where
        humid air cools to dewpoint; above that the updraught expands and the
        cloud thins.  The <strong>threshold</strong> Map Range then remaps
        {"`[0.45, 1.0] → [0.0, 1.0]`"} with clamping, collapsing everything
        below 0.45 to zero — the clear blue sky between cloud cells.  Raising
        this to 0.65 produces a thin cirrus; lowering it to 0.30 packs the sky
        with cumulonimbus density.  See the field-evaluation pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-ground-cover-scatter"
          className={lk}
        >
          ground-cover scatter tutorial
        </Link>{" "}
        for how the same Position→Noise→Map Range chain drives a different domain
        (point scattering rather than voxel density).
      </p>

      <p>
        The <strong>Principled Volume</strong> material multiplies the stored
        voxel density by a constant ({"`DENSITY_MULT = 14.0`"}).  This
        two-stage system — normalised 0–1 field in the voxels, scalar multiplier
        in the shader — decouples the cloud shape from its optical thickness.
        You tune the shape in GN without touching the material, and vice versa.
        The <code>Absorption Color</code> is set to a slightly darker blue-grey
        than the scatter colour; in regions where voxels are stacked deeply, the
        absorption term darkens the interior, giving visible cloud-shadow depth.
        Anisotropy at 0.30 applies forward scattering via the Henyey-Greenstein
        phase function: when the sun is behind the cloud, the lit edges appear
        dramatically brighter than the shadow face, which is the silver-lining
        effect.
      </p>

      <p>
        <strong>GLB / WebXR export caveat.</strong>  The glTF specification has
        no volume primitive — a Blender volume object writes nothing to GLB.  The
        blueprint therefore also builds a{" "}
        <code>cumulus_cloud_iso</code> mesh by applying a{" "}
        <code>Volume to Mesh</code> modifier at a density threshold of 0.55.
        This iso-surface is a coarse triangulated hull of the cloud at that
        density contour — accurate enough for real-time WebXR as a translucent
        fog mesh, but not a substitute for the full volumetric render.  Apply a
        semi-transparent Principled BSDF with Transmission = 1.0 and a bluish
        tint to the iso mesh before export, and use Three.js{" "}
        <code>MeshPhysicalMaterial</code> with{" "}
        <code>transmission: 0.9</code> to match.  The simulation-baking workflow
        explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          reaction-diffusion Turing pattern tutorial
        </Link>{" "}
        is analogous when you need to freeze a complex GN state before export —
        apply the modifier, bake the mesh.
      </p>

      <p>
        <strong>Voxel resolution trade-offs.</strong> The blueprint defaults to
        80 × 60 × 40 = 192 000 voxels.  Memory scales linearly with voxel count;
        doubling each axis eightfolds the memory.  Render time scales with
        voxel density only where light rays pass through the cloud, so a
        high-res but sparse cloud can be cheaper than a low-res dense one.  For
        iteration, halve the resolution constants; for final plate renders, use
        160 × 120 × 80 with Cycles samples ≥ 256.  Voxel grids are also the
        right format for Blender&rsquo;s{" "}
        <code>Cycles Volume Sampling</code> settings — set{" "}
        <code>Step Rate Render</code> to 0.1–0.5 (lower = more accurate, slower)
        in the Render Properties ▸ Volume section.
      </p>

      <hr className="border-white/20 my-6" />

      <h3 className="font-bold text-lg mb-2">Outside sources</h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/volume_cube.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Volume Cube Node
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/volume_principled.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Principled Volume Shader
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev — reference for headless bpy scene construction
          patterns; related projects:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scripts/
          </a>{" "}
          (parametric mesh examples).
        </li>
      </ul>

      <h3 className="font-bold text-lg mt-6 mb-2">Troubleshooting</h3>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>Cloud is invisible in Rendered view</strong> — check that the
          render engine is Cycles, not EEVEE.  EEVEE Next supports volume
          materials but requires enabling the Volumetrics option in Render
          Properties; Cycles handles it automatically.
        </li>
        <li>
          <strong>Volume Cube output is a solid white block</strong> — the
          Density socket is receiving a value above 1.0 (unclamped add from the
          noise blend).  Enable <code>use_clamp</code> on the final add Math
          node, or add a Map Range clamping to [0, 1] before the Volume Cube.
        </li>
        <li>
          <strong>record.py cannot locate the threshold node</strong> — the
          helper searches for a Map Range node with{" "}
          <code>To Min ≈ 0.0</code>.  If you renamed or replaced that node,
          update <code>_find_threshold_node()</code> to match by label.
        </li>
        <li>
          <strong>iso mesh has holes or is inside-out</strong> — the Volume to
          Mesh modifier&rsquo;s threshold is above the actual density range.
          Lower <code>ISO_THRESHOLD</code> toward 0.35 or check that the GN
          modifier was fully applied before Volume to Mesh ran.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  title:
    "GN Volume Cube + Noise Field — Procedural Cumulus Cloud (Blender 5.1)",
  slug: "blender-tutorial-gn-volume-cube-procedural-cloud",
  date: "2026-06-12",
  tags: ["blender", "geometry-nodes", "volume", "procedural", "cycles"],
  summary:
    "Build a fully procedural cumulus cloud in Geometry Nodes by connecting a " +
    "layered Noise Texture field to the Volume Cube node's per-voxel Density " +
    "socket — no textures, no simulation, pure mathematics — then shade it " +
    "with Principled Volume and bake an iso-surface mesh for GLB / WebXR export.",
  body: GnVolumeCubeProceduralCloudBody,
});
