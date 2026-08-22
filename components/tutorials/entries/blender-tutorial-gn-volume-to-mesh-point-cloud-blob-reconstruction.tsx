import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnVolumeToMeshBlobReconstructionBody() {
  return (
    <>
      <p>
        The <code>Volume to Mesh</code> node runs a Marching Cubes iso-surface
        extraction on a fog volume&rsquo;s scalar density field. Supply it with a
        volume produced by <code>Points to Volume</code> and you get a smooth,
        manifold triangle mesh that automatically merges nearby input points into
        a single organic blob — the same implicit-surface mathematics that powers
        metaballs, but living entirely inside the Geometry Nodes stack where every
        downstream operation (attribute writing, material index, triangulation, GLB
        export) can operate on it non-destructively.
      </p>

      <h2>Marching Cubes inside Blender GN</h2>
      <p>
        Marching Cubes (Lorensen &amp; Cline, SIGGRAPH 1987) divides space into a
        regular voxel grid, evaluates the target density at each cell corner, and
        emits a triangulated patch depending on which corners are above or below
        the iso-threshold. The output is always a manifold mesh — no duplicate
        vertices, no open edges — which is why it fits naturally as a GN node that
        feeds further GN operations rather than a terminal render-only primitive.
      </p>
      <p>
        In Blender 5.1, <code>GeometryNodeVolumeToMesh</code> exposes two
        controls that govern the trade-off between reconstruction fidelity and
        polygon count: <strong>Threshold</strong> (the density iso-level) and{" "}
        <strong>Adaptivity</strong> (post-extraction decimation). Both deserve
        deliberate values rather than defaults.
      </p>

      <h2>Threshold — the iso-surface level</h2>
      <p>
        <code>Points to Volume</code> places a Gaussian falloff density sphere of
        the given Radius around each input point. Overlapping falloffs sum — a pair
        of points spaced less than ~2× Radius apart will have a shared density peak
        above 1.0. Threshold determines which density contour becomes the mesh
        surface:
      </p>
      <ul>
        <li>
          <strong>Threshold &lt; 0.5</strong>: The iso-surface expands outward
          past the half-maximum of each Gaussian. Points farther apart start to
          bridge; the blob fattens and merges more aggressively.
        </li>
        <li>
          <strong>Threshold ≈ 0.5</strong>: Surface sits at approximately the
          half-maximum point of each Gaussian — a reasonable default that balances
          blob radius and separation.
        </li>
        <li>
          <strong>Threshold &gt; 0.8</strong>: Only the peak-density voxels are
          enclosed. Points that were borderline-merging now appear as separate
          spheres; the overall blob shrinks and may disintegrate into individual
          bumps.
        </li>
      </ul>
      <p>
        The interaction with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-volume-organic-coral"
          className={lk}
        >
          Points to Volume radius
        </Link>{" "}
        is multiplicative: doubling Point Radius and halving Threshold produces a
        larger mesh with the same topology. For a clean parameter space, keep
        Threshold fixed at 0.45 and vary Radius to control blob size; only adjust
        Threshold to change the merging aggressiveness.
      </p>

      <h2>Voxel resolution: Amount vs Size</h2>
      <p>
        Both <code>Points to Volume</code> and <code>Volume to Mesh</code> support
        two resolution modes. <strong>VOXEL_AMOUNT</strong> assigns N cells to the
        longest bounding-box axis and scales other axes proportionally — resolution
        tracks object scale automatically. <strong>VOXEL_SIZE</strong> gives a
        fixed world-space cell dimension regardless of scale.
      </p>
      <p>
        For authoring: use VOXEL_AMOUNT (predictable output at any scale, safe to
        resize the sphere host object). For a WebXR export pass: switch to
        VOXEL_SIZE and set a value that caps triangle density — a 0.08 u cell on a
        2 u radius blob gives roughly 2 500 triangles before Adaptivity. Set both
        nodes to the same mode; mismatching them produces subtle reconstruction
        errors where the volume voxel grid and the extraction grid don&apos;t align.
      </p>

      <h2>Adaptivity — the hidden decimation pass</h2>
      <p>
        Marching Cubes output is regular but dense: every voxel face boundary that
        crosses the iso-surface contributes triangles, even on perfectly flat
        regions. Adaptivity (0–1) runs a post-extraction mesh decimation:
        near-coplanar triangles merge into fewer, larger ones. The practical range
        for organic shapes is 0.04–0.12 — enough to halve the polygon count vs
        Adaptivity = 0 while keeping the lumpy ridges and concavities that make the
        blob read as organic.
      </p>
      <p>
        Setting Adaptivity above 0.3 on a blob with fine surface noise causes
        visible faceting at the transition between merged-flat and detail regions.
        If you need fewer polygons without the faceting, reduce VOXEL_AMOUNT
        instead — coarser grid, fewer triangles, still smooth because each
        Marching Cubes patch spans a larger voxel.
      </p>

      <h2>GN pipeline vs Metaballs</h2>
      <p>
        Blender&rsquo;s legacy{" "}
        <Link
          href="/tutorials/blender-tutorial-metaball-organic-blob-creature-glb"
          className={lk}
        >
          Metaball objects
        </Link>{" "}
        produce the same blobby implicit surface but via a separate evaluation
        system. Metaballs cannot receive stored GN attributes, cannot be piped into
        downstream GN nodes, and cannot be triangulated or UV-unwrapped within the
        same modifier stack. The Points → Volume → Mesh pipeline gives full GN
        composability: the reconstructed mesh exits <code>Volume to Mesh</code> as
        ordinary geometry and flows into any subsequent GN node — UV unwrap, Store
        Named Attribute for{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          material tagging
        </Link>
        , Merge by Distance to weld near-duplicate verts, or Triangulate for
        GLB export.
      </p>
      <p>
        The inverse pipeline — starting from a volume rather than a point cloud —
        is covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-to-volume-sdf-blob-fusion"
          className={lk}
        >
          GN Mesh to Volume — SDF Blob Fusion
        </Link>
        , which converts mesh geometry into a signed distance field and fuses
        overlapping shapes before extracting the iso-surface.
      </p>

      <h2>WebXR export</h2>
      <p>
        The Marching Cubes output is an all-triangle mesh with smooth normals after
        Set Shade Smooth. This requires no post-processing for GLTF export —
        triangles are already present (no quad conversion step), and smooth normals
        bake into GLB vertex data. At VOXEL_AMOUNT = 72 and Adaptivity = 0.06 the
        blob produces roughly 4 000–6 000 triangles depending on noise configuration.
        For a WebXR hero prop this is acceptable; for background scatter instances,
        drop to VOXEL_AMOUNT = 32 and Adaptivity = 0.15 for ~800 triangles.
      </p>
      <p>
        If the reconstructed surface is to receive a UV-mapped texture (rather than
        a procedural shader), add a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          GN UV Unwrap + Pack Islands
        </Link>{" "}
        node after Volume to Mesh before the Group Output. The Marching Cubes mesh
        has no seam bias — you will need a Smart UV Project equivalent, which the
        GN UV Unwrap node provides directly.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/volume_to_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Volume to Mesh Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for
          Threshold, Adaptivity, and the VOXEL_AMOUNT vs VOXEL_SIZE distinction.
          Sibling pages:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/points_to_volume.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Points to Volume
          </a>{" "}
          (Gaussian density field construction, Radius behaviour) and{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/volume_cube.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Volume Cube
          </a>{" "}
          (procedural fog volumes without a point-cloud source).
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Marching_cubes"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Marching Cubes — Wikipedia
          </a>{" "}
          · CC-BY-SA 3.0 · Wikipedia contributors. Covers the Lorensen &amp; Cline
          algorithm (SIGGRAPH 1987), the 256 case table, ambiguity resolution, and
          the Marching Tetrahedra variant. Explains WHY the output is always a
          manifold mesh and why the triangle count scales with voxel count, not
          feature count. Sister articles:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Implicit_surface"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Implicit surface
          </a>{" "}
          (the mathematical class that metaballs and SDF blobs belong to) and{" "}
          <a
            href="https://en.wikipedia.org/wiki/Signed_distance_function"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Signed distance function
          </a>{" "}
          (the SDF representation used by Blender&apos;s Mesh to Volume and by
          many game-engine collision shape generators).
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/MarchingCubes.js"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            THREE.MarchingCubes — three.js
          </a>{" "}
          · MIT · Ricardo Cabello (mrdoob) and three.js contributors. A runtime
          JavaScript Marching Cubes implementation used to generate metaball-like
          implicit surfaces dynamically in WebXR — useful when the blob must deform
          or grow at runtime without re-exporting a GLB. The class exposes{" "}
          <code>addBall(x, y, z, strength, subtract)</code> for metaball placement
          and <code>render(delta)</code> for time-based animation. Sibling packages:{" "}
          <a
            href="https://github.com/pmndrs/react-three-fiber"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            @react-three/fiber
          </a>{" "}
          (MIT · Poimandres) and{" "}
          <a
            href="https://github.com/pmndrs/drei"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            drei
          </a>{" "}
          (MIT), which wrap MarchingCubes in a declarative React component for
          in-scene WebXR use.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-volume-to-mesh-point-cloud-blob-reconstruction",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use Blender 5.1 Geometry Nodes to convert a noise-displaced point cloud into a fog volume with Points to Volume, then extract a smooth manifold triangle mesh with Volume to Mesh (Marching Cubes) — the full implicit-surface reconstruction pipeline in a single non-destructive GN modifier.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable adding and wiring GN nodes in the geometry node editor",
      "Understand Points to Volume basics — see /tutorials/blender-tutorial-gn-points-to-volume-organic-coral",
      "Know Blender GLB export with Apply Modifiers enabled",
    ],
    steps: [
      {
        title: "Create sphere host and add a Geometry Nodes modifier",
        body: "Add a UV Sphere (Shift+A → Mesh → UV Sphere, Segments 32, Rings 16, Radius 1.5). In Properties → Modifier, Add Modifier → Geometry Nodes → New. Rename the object 'blob_source'. The GN tree will replace the sphere geometry entirely; the sphere is only needed as a face surface for point distribution.",
      },
      {
        title: "Distribute points randomly on the sphere surface",
        body: "In the GN editor: Add → Point → Distribute Points on Faces. Set Mode to Random, Count to 280. Wire Group Input.Geometry → Distribute.Mesh. The node outputs a Points geometry of 280 scattered positions on the sphere's surface.",
      },
      {
        title: "Displace points with a 3D noise texture",
        body: "Add → Geometry → Input → Position. Add → Texture → Noise Texture (set Dimensions to 3D), Scale 3.2, Detail 6, Roughness 0.55. Add → Utilities → Vector → Vector Math (SUBTRACT), set the second input to (0.5, 0.5, 0.5) to centre the 0–1 noise output around zero. Add another Vector Math (SCALE), set Scale to 0.35. Wire: Position → Noise.Vector → Subtract.A → Scale.Vector. Add → Geometry → Write → Set Position; wire Distribute.Points → SetPosition.Geometry and Scale.Vector → SetPosition.Offset.",
      },
      {
        title: "Convert displaced points to a fog volume",
        body: "Add → Point → Points to Volume. Set Resolution Mode to Voxel Amount, Voxel Amount to 72, Radius to 0.42, Density to 1.0. Wire SetPosition.Geometry → PointsToVolume.Points. The volume voxel grid now contains summed Gaussian density contributions from each input point — overlapping spheres merge into peaks above 1.0.",
      },
      {
        title: "Extract the iso-surface with Volume to Mesh",
        body: "Add → Volume → Volume to Mesh. Set Resolution Mode to Voxel Amount, Voxel Amount to 72. Set Threshold to 0.45 — this is the density contour that becomes the triangle mesh. Set Adaptivity to 0.06 for a small polygon-count reduction on flat regions. Wire PointsToVolume.Volume → VolumeToMesh.Volume.",
      },
      {
        title: "Set Shade Smooth and wire to output",
        body: "Add → Geometry → Write → Set Shade Smooth. Leave Domain at Face and enable Shade Smooth (True). Wire VolumeToMesh.Mesh → SetShadeSmooth.Geometry → Group Output.Geometry. The reconstructed blob is now visible in the viewport as a smooth organic surface.",
      },
      {
        title: "Tune Threshold and export GLB",
        body: "Select the VolumeToMesh node. Reduce Threshold from 0.45 to 0.2 — watch farther-apart points bridge into one mass. Raise it to 0.7 — the surface splits into tight individual bumps. Return to 0.45 for the organic middle. File → Export → glTF 2.0, Apply Modifiers enabled, Draco level 6, Image Format WebP.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No mesh visible after Volume to Mesh — viewport shows nothing",
        cause:
          "Threshold is too high relative to Density × point overlap; no voxels reach the iso-level",
        fix: "Reduce Threshold to 0.2 first, verify a mesh appears, then gradually raise. Also confirm PointsToVolume.Density = 1.0 and Radius > 0.15 u.",
      },
      {
        symptom: "Blob looks perfectly round — no organic surface variation",
        cause:
          "Set Position noise offset is not wired correctly, or NOISE_STRENGTH is too low",
        fix: "Confirm Scale.Vector → SetPosition.Offset is wired. Check that the second Subtract input is (0.5, 0.5, 0.5) — without centering, the noise only pushes in one direction, creating a one-sided lump instead of outward variations.",
      },
      {
        symptom:
          "Memory spike or Blender becomes unresponsive when running blueprint.py",
        cause: "VOXEL_AMOUNT of 72 may be too high for available RAM at large sphere scale",
        fix: "Drop VOXEL_AMOUNT to 48. At radius 1.5 u the blob still shows ~3 000 triangles at 48 voxels. Increase back to 72 only on systems with ≥ 16 GB RAM.",
      },
      {
        symptom: "Reconstructed mesh has visible angular facets despite Set Shade Smooth",
        cause:
          "Adaptivity is too high — above 0.3 Marching Cubes output develops planar patches that shade smooth cannot round",
        fix: "Return Adaptivity to 0.05–0.08 range. If fewer polygons are needed, reduce VOXEL_AMOUNT instead of raising Adaptivity.",
      },
      {
        symptom: "GLB is empty or shows a stub mesh in Three.js",
        cause:
          "Modifier was not applied during export; GN tree was not evaluated",
        fix: "Enable 'Apply Modifiers' in the glTF export dialogue (export_apply=True in bpy.ops.export_scene.gltf). Volume-to-Mesh GN output requires modifier evaluation at export time.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-volume-to-mesh-point-cloud-blob-reconstruction",
    title:
      "GN Volume to Mesh — Marching-Cubes Blob Reconstruction: Point Cloud → SDF Volume → Manifold Mesh for WebXR",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Volume to Mesh runs Marching Cubes on a fog volume's density field to extract a smooth manifold triangle mesh. Pipe in Points to Volume and you get an implicit-surface blob system — blobby metaball-like merging — that lives entirely inside the GN stack. This tutorial walks the full Mesh → Points → Volume → Mesh reconstruction pipeline in Blender 5.1, with expert depth on Threshold (iso-level), Adaptivity (post-MC decimation), voxel resolution modes, and GLB export for WebXR.",
    Body: GnVolumeToMeshBlobReconstructionBody,
  },
);
