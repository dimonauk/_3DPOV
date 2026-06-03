import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnPointsToVolumeOrganicCoralBody() {
  return (
    <>
      <p>
        <strong>Points to Volume</strong> splats a Gaussian density kernel
        around every point in a cloud and accumulates the result into an OpenVDB
        sparse voxel grid. <strong>Volume to Mesh</strong> then runs marching
        cubes on that grid at a chosen isosurface threshold, producing a mesh
        that has never been hand-modelled. Where two kernels overlap, their
        densities add: the isosurface fuses adjacent blobs into branch-like
        protrusions. Use icosphere vertices as seeds and you get 42 organic
        coral branches growing from a shared dense core — no metaballs, no
        sculpting, no boolean union.
      </p>

      <h2>The volume pipeline is a closed type boundary</h2>
      <p>
        Blender&rsquo;s GN system enforces a hard type boundary between mesh,
        curve, point cloud, and volume geometry. A Volume socket will not
        connect to a Mesh input, and vice versa. The only legal pipeline shape
        is:
      </p>
      <pre>{`Mesh  ──►  MeshToPoints  ──►  PointsToVolume  ──►  VolumeToMesh  ──►  Mesh`}</pre>
      <p>
        This is fundamentally different from the modifier stack in Blender 3.x,
        where the Volume modifier operated on a separate object type. In 5.1 the
        entire chain lives in a single GN modifier on an ordinary mesh object —
        the base mesh is irrelevant and is completely replaced by the GN output.
      </p>
      <p>
        Compare this with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-sphere"
          className={lk}
        >
          Dual Mesh
        </Link>
        , which also produces organic-looking topology from a regular seed
        mesh, but operates entirely within the mesh domain and cannot fuse
        overlapping shapes the way Gaussian kernel accumulation can.
      </p>

      <h2>Voxel Size, Radius, and the 3× rule</h2>
      <p>
        Two parameters govern the volume quality, and they must be chosen
        together:
      </p>
      <ul>
        <li>
          <strong>Voxel Size</strong> (Points to Volume, resolution_mode=
          <code>VOXEL_SIZE</code>) — world-space edge length of each VDB voxel.
          Halving it quadruples the voxel count and roughly doubles memory.
        </li>
        <li>
          <strong>Radius</strong> (Points to Volume) — Gaussian kernel
          half-width per point. The kernel must span at least three voxels in
          every direction or the marching cubes grid is too coarse to reproduce
          the kernel shape; the isosurface shows staircase artefacts instead of
          smooth surfaces.
        </li>
      </ul>
      <p>
        The safe minimum is <code>Radius ≥ Voxel Size × 3</code>. In the
        blueprint: <code>VOXEL_SIZE=0.06 m</code>,{" "}
        <code>POINT_RADIUS=0.32 m</code> (5.3×) — well above the threshold.
        Reducing voxel size improves quality; reducing it below the{" "}
        <code>Radius / 3</code> floor while leaving Radius unchanged silently
        degrades the result.
      </p>

      <h2>Threshold controls what survives</h2>
      <p>
        The density at the midpoint between two neighbouring kernels depends on
        their separation distance <em>d</em> and radius <em>r</em>:
      </p>
      <pre>{`ρ_midpoint ≈ 2 × exp(−d² / (2r²))`}</pre>
      <p>
        At icosphere subdivision 1, adjacent vertex separation is ≈ 0.6 m.
        With <code>r = 0.32</code>: midpoint density ≈ 1.08. Setting{" "}
        <code>THRESHOLD = 0.08</code> catches the full fused region all the way
        out to the outermost tips. Raising THRESHOLD toward 1.0 erodes the tips
        first (lowest density), then the branches, then the core. This is the
        animation in <code>record.py</code>: sweeping THRESHOLD from 1.20 to
        0.08 shows the coral emerging from a single dense core as progressively
        lower-density regions cross the isosurface.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat Zone crystal cluster
        </Link>{" "}
        tutorial covers a related &ldquo;growth from a seed&rdquo; visual —
        but via procedural extrusion rather than density accumulation. The two
        approaches produce completely different topology and are useful for
        different downstream purposes (the crystal cluster has clean quads;
        the coral blob has arbitrary marching-cubes triangles).
      </p>

      <h2>Adaptivity and the faceted aesthetic</h2>
      <p>
        The Adaptivity socket on Volume to Mesh drives a post-pass mesh
        decimation on the marching-cubes output. At 0, every voxel face is
        represented; at 0.45 the decimator removes triangles that lie on
        approximately planar regions, leaving visible facet boundaries where
        surface curvature exceeds the tolerance. At 1.0 you get a chunky
        voxelised look. The studio&rsquo;s preferred range is 0.35–0.55: enough
        simplification to show clear facets without losing the organic
        silhouette.
      </p>
      <p>
        Pair this with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity deformation
        </Link>{" "}
        to add a secondary displacement pass after the Volume to Mesh step —
        chain a SetPosition node with a proximity-driven offset to exaggerate
        protruding tips while compressing recessed areas.
      </p>

      <h2>No UVs — world-space shading is the solution</h2>
      <p>
        Marching cubes generates topologically arbitrary triangles with no UV
        seam placement logic. The resulting mesh has no UV coordinates. The
        blueprint&rsquo;s <code>coral_mat</code> material sidesteps this by
        using <code>ShaderNodeNewGeometry.Position</code> as the texture
        coordinate — the world-space vertex position drives a Noise Texture,
        which feeds a teal-to-coral-pink ColorRamp into the Principled BSDF.
        The pattern is continuous across the entire surface with no seams.
      </p>
      <p>
        If you need baked texture maps (for a game engine or WebXR asset that
        cannot run procedural shaders), the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking — Normal and AO
        </Link>{" "}
        tutorial covers the workflow for baking world-space procedural shaders
        onto a cage UV map after the fact.
      </p>

      <h2>GLB export notes</h2>
      <p>
        <code>export_apply=True</code> is mandatory — WebXR runtimes and
        Three.js do not evaluate GN modifiers. The coral GLB is a flat mesh with
        no custom attributes; no <code>export_attributes</code> flag is needed.
        Draco compression (Level 6) reduces file size significantly on the
        high-triangle marching-cubes output. The{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF-Blender-IO exporter
        </a>{" "}
        (Apache-2.0, Khronos Group) handles both the Draco pass and the Workbench
        material bake automatically.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-points-to-volume-organic-coral",
  title:
    "GN Points to Volume + Volume to Mesh — Procedural Organic Coral Blob (Blender 5.1)",
  date: "2026-06-03",
  kind: "tutorial",
  excerpt:
    "Points to Volume splats Gaussian density kernels from a point cloud into an OpenVDB grid; Volume to Mesh extracts a marching-cubes isosurface from that grid. Seed from an icosphere's 42 vertices and the overlapping kernels fuse into coral-branch protrusions — an organic blob with no sculpting. Covers the voxel-size/radius 3× rule, threshold as an erosion parameter, Adaptivity for faceted look, and world-space procedural shading on a UV-free marching-cubes mesh.",
  Body: GnPointsToVolumeOrganicCoralBody,
};

export const entry = buildInstructable(
  {
    goal: "Build a GN modifier on a plane object whose tree contains: MeshIcoSphere(subdiv=1) → MeshToPoints(VERTICES) → PointsToVolume(VOXEL_SIZE, voxelSize=0.06, radius=0.32) → VolumeToMesh(GRID, threshold=0.08, adaptivity=0.45) → SetShadeSmooth(False). Expose Threshold and Adaptivity as group input sockets. Add a world-space Noise-driven teal-to-coral-pink material. Export a Draco-compressed GLB.",
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-points-to-volume-organic-coral",
    time: "1–2 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed",
      "Geometry Nodes modifier basics",
      "Understanding of GN socket types (Geometry, Float, Boolean)",
      "Python scripting access (Scripting workspace or terminal)",
    ],
    steps: [
      {
        title: "Create the base object",
        body: "File → New → General. Delete the default cube. Shift+A → Mesh → Plane. Scale it to 0.001 in the N-panel (it will be replaced by GN output). Rename the object to 'coral_blob'. Add a new Geometry Nodes modifier named 'OrganicCoral'. Click New.",
      },
      {
        title: "Add group input sockets",
        body: "In the GN editor: open the Modifier panel side-bar (N → Group). Add two Float sockets: 'Threshold' (default 0.08, min 0.001, max 2.0) and 'Adaptivity' (default 0.45, min 0, max 1). These become the live parameter sliders in the Properties panel.",
      },
      {
        title: "Build the icosphere seed",
        body: "Shift+A → Mesh → Ico Sphere node (GeometryNodeMeshIcoSphere). Set Radius=1.0, Subdivisions=1. This creates 42 vertices inside the GN tree — no external mesh dependency. Use Subdivisions=0 for 12 fat blobs, Subdivisions=2 for 162 fine tips.",
      },
      {
        title: "Convert vertices to a point cloud",
        body: "Shift+A → Point → Mesh to Points (GeometryNodeMeshToPoints). Set mode to Vertices. Connect IcoSphere.Mesh → MeshToPoints.Mesh. Each of the 42 icosphere vertices becomes one point carrying its vertex position. The mode=Faces or Edges options would place kernels at face centroids or edge midpoints — different silhouettes.",
      },
      {
        title: "Points to Volume — Gaussian splat into OpenVDB",
        body: "Shift+A → Volume → Points to Volume. Set Resolution Mode to Voxel Size. Set Voxel Size=0.06, Density=1.0, Radius=0.32. Connect MeshToPoints.Points → PointsToVolume.Points. Critical: Radius must be ≥ Voxel Size × 3 (here 0.32 / 0.06 = 5.3) or marching-cubes shows staircase artefacts. This node produces a Volume geometry — no mesh nodes can operate on its output.",
      },
      {
        title: "Volume to Mesh — marching-cubes isosurface extraction",
        body: "Shift+A → Volume → Volume to Mesh. Set Resolution Mode to Grid (inherits incoming VDB resolution — no resampling). Connect GroupInput.Threshold → VolumeToMesh.Threshold. Connect GroupInput.Adaptivity → VolumeToMesh.Adaptivity. Connect PointsToVolume.Volume → VolumeToMesh.Volume. Drag Threshold in the panel from 1.2 down to 0.08: the blob emerges as lower-density regions cross the isosurface.",
      },
      {
        title: "Flat shading and material",
        body: "Add Set Shade Smooth: domain=FACE, Shade Smooth=False. Connect VolumeToMesh.Mesh → SetShadeSmooth. Connect SetShadeSmooth.Geometry → GroupOutput. Create material 'coral_mat': ShaderNodeNewGeometry.Position → ShaderNodeTexNoise (Scale=2.4, Detail=3.0) → ColorRamp (teal at 0, coral-pink at 1) → Principled BSDF Base Color. No UV unwrap needed.",
      },
      {
        title: "Save .blend and export GLB",
        body: "File → Save As → organic_coral.blend. To export: select coral_blob, apply the modifier (Ctrl+A in modifier panel or via bpy.ops.object.modifier_apply). File → Export → glTF 2.0: enable Apply Modifiers, Draco Compression Level 6, format=GLB. Save to public/library/glbs/geometry-nodes/gn-points-to-volume-organic-coral/organic_coral.glb.",
      },
    ],
    finalResult:
      "A .blend with a plane object under the OrganicCoral GN modifier: IcoSphere(42 vertices) → MeshToPoints → PointsToVolume(0.06 voxels, 0.32 kernel) → VolumeToMesh(GRID, Threshold=0.08, Adaptivity=0.45) → SetShadeSmooth(False). Dragging Threshold from 0.08 to 1.20 erodes the coral from tips inward. A Draco-compressed GLB with the faceted organic blob and world-space noise colour.",
    variations: [
      "Change ICO_SUBDIVISIONS from 1 to 0: 12 kernels produce 12 distinct fat blobs at subdivision spacing — looks like a molecular model or soap-bubble cluster. Each blob is separated enough that it remains discrete rather than fused.",
      "Replace MeshToPoints(mode=VERTICES) with Distribute Points on Faces (on the icosphere): set Density=8.0 to scatter ~320 points. The denser, randomly placed kernels fuse into a smoother organic blob without the star-like branch symmetry.",
      "After VolumeToMesh, add a Geometry Proximity node targeting a second object to deform the coral surface: tip vertices that are nearest the target bulge outward, creating a directional growth effect — as covered in the Geometry Proximity Deformation tutorial.",
    ],
    troubleshooting: [
      {
        symptom: "No mesh appears in the viewport — GN output is empty",
        cause:
          "Threshold is set above the peak density of the volume. At the icosphere's core, maximum density is roughly 42 × exp(0) = 42.0; at the outermost tip of a single kernel, density ≈ 1.0. A Threshold above 1.0 will erase all single-kernel protrusions. A Threshold above ~10 will erase the fused core.",
        fix: "Drag Threshold down from its current value to 0.08. If still no mesh, confirm PointsToVolume.Radius >= VolumeToMesh... check both are connected: Volume socket (orange) to Volume socket (orange).",
      },
      {
        symptom: "Surface shows heavy staircase / voxel-brick artefacts",
        cause:
          "POINT_RADIUS is less than VOXEL_SIZE × 3. When the Gaussian kernel spans fewer than 3 voxels, the marching-cubes grid cannot resolve the kernel shape and approximates it with axis-aligned steps.",
        fix: "Increase POINT_RADIUS or decrease VOXEL_SIZE until Radius / VoxelSize ≥ 3. At default (0.32 / 0.06 = 5.3) the surface is smooth. For finer voxels (0.03) use Radius ≥ 0.09.",
      },
      {
        symptom: "GLB file is enormous — megabytes larger than expected",
        cause:
          "Adaptivity=0 on Volume to Mesh produces one triangle per voxel face on the isosurface — the full unoptimised marching-cubes mesh. For VOXEL_SIZE=0.06 on a 2 m diameter blob, that can be 40,000+ triangles before Draco.",
        fix: "Raise Adaptivity to 0.4–0.5 to merge coplanar triangles. This typically reduces triangle count by 60–75% with minimal visible impact on organic shapes.",
      },
    ],
  },
  base,
);
