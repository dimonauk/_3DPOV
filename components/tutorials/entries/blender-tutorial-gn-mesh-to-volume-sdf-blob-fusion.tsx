import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every mesh in Blender can be treated as a shell enclosing a volume of
        space. The <strong>Mesh to Volume</strong> Geometry Nodes node makes
        this literal: it voxelises the mesh into an OpenVDB{" "}
        <em>signed-distance-field</em> (SDF) grid — a 3-D lattice where each
        cell stores the signed distance to the nearest surface triangle.
        Positive values lie outside the mesh; negative values inside; zero
        values sit exactly on the surface. The <strong>Volume to Mesh</strong>{" "}
        node then runs marching cubes on that grid and extracts a new mesh at
        whatever isosurface level you specify. Setting the threshold above zero
        inflates the surface outward by that distance, and when two nearby
        meshes are inflated they merge — a smooth, topologically clean
        volumetric union that no Boolean modifier can match for robustness on
        messy geometry. The{" "}
        <Link
          href="/tutorials/blender-tutorial-metaball-organic-blob-creature-glb"
          className={lk}
        >
          Metaball Organic Blob tutorial
        </Link>{" "}
        covers Blender&apos;s scalar-field approach to blob merging; this
        tutorial covers the SDF voxelisation route and explains when each is
        the right tool.
      </p>

      <p>
        The Geometry Nodes tree built here has a single architectural
        throughline: everything flows from mesh geometry into a volume and back
        out as a new mesh. The emitter is an icosphere; UV sphere instances are
        scattered over its surface via{" "}
        <strong>Distribute Points on Faces</strong> in Poisson-disc mode (which
        enforces a minimum inter-point spacing — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces tutorial
        </Link>{" "}
        for the distinction between Poisson-disc and random density modes).
        After <strong>Instance on Points</strong> places the spheres,{" "}
        <strong>Realise Instances</strong> collapses them into a single mesh
        datablock. The voxeliser receives this combined mesh; because all
        sphere triangles contribute to the SDF simultaneously, the resulting
        volume&apos;s zero-crossing is exactly the Boolean union of all the
        spheres — and raising the threshold above zero inflates that union
        surface uniformly.
      </p>

      <p>
        The two critical parameters are <code>Exterior Band Width</code> and{" "}
        <code>Interior Band Width</code> on the Mesh to Volume node, and{" "}
        <code>Threshold</code> on Volume to Mesh. The band widths control how
        far the SDF extends away from the mesh surface in each direction.{" "}
        <em>
          The Exterior Band Width must be at least as large as the Threshold
          value
        </em>
        , or Volume to Mesh will clip the isosurface at the band boundary
        rather than extracting a smooth shell. Interior Band Width controls how
        deep the SDF penetrates into the mesh interior — too narrow and thin
        features (like a spike or fin) will be hollow rather than solid.
        Blender uses{" "}
        <a
          href="https://github.com/AcademySoftwareFoundation/openvdb"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenVDB (Apache-2.0, Academy Software Foundation)
        </a>{" "}
        as the internal volume representation. The narrow-band SDF format
        stores values only within the band, keeping memory proportional to
        surface area rather than volume — a 1 m³ sphere at 3 cm voxel
        resolution uses roughly the same RAM as that sphere scaled to 2 m³
        because only the thin shell of voxels near the surface is allocated.
      </p>

      <p>
        Voxel size is the primary quality knob. At{" "}
        <code>Voxel Size = 0.10</code> the resulting mesh looks like a blocky
        voxel sculpture; at <code>0.035</code> it is visually smooth; below{" "}
        <code>0.015</code> evaluation time grows steeply (the voxel count
        scales as the cube of the inverse voxel size). For real-time WebXR use
        the mesh is exported as a Draco-compressed GLB — see the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline
        </Link>{" "}
        for how the loader handles Draco decompression at runtime. The
        marching-cubes mesh produced by Volume to Mesh is inherently manifold
        (water-tight) and well-suited to 3-D printing without further repair,
        unlike the overlapping-sphere geometry fed in. This makes the
        Mesh→Volume→Mesh round-trip a practical boolean-and-clean workflow:
        perform a Boolean union in geometry space, run the round-trip, get a
        clean water-tight output. For a related GN node producing volumes
        procedurally without a mesh input, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-volume-cube-procedural-cloud"
          className={lk}
        >
          Volume Cube procedural cloud tutorial
        </Link>
        .
      </p>

      <p>
        The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_to_volume.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual: Mesh to Volume
        </a>{" "}
        (CC BY-SA 4.0, Blender Foundation) documents the node&apos;s full
        socket list. One important omission in the manual: the{" "}
        <code>Fill Volume</code> boolean input, when enabled, writes the
        density value throughout the interior rather than only at the surface
        band. For SDF isosurface extraction this makes no difference (the
        marching-cubes threshold ignores interior density), but it matters for
        Cycles volumetric rendering where you want the interior to scatter
        light. In this tutorial Fill Volume is left False because we only need
        a surface mesh output. For instances used in large environment scatter
        pipelines the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          Realise Instances crystal grotto tutorial
        </Link>{" "}
        covers the performance implications of realising many instances before a
        node that cannot operate on unresolved instance geometry.
      </p>
    </>
  );
}

const base = {
  date: "2026-06-20",
  slug: "blender-tutorial-gn-mesh-to-volume-sdf-blob-fusion",
  title:
    "GN Mesh to Volume → Volume to Mesh: Organic SDF Blob Fusion (Blender 5.1)",
  description:
    "Scatter UV sphere instances, realise them into one mesh, voxelise to an OpenVDB SDF via Mesh to Volume, then extract a smooth blob via Volume to Mesh at a positive threshold. The threshold value controls the fusion radius — spheres within 2× threshold of each other grow together into a clean, manifold, water-tight mesh ready for WebXR or 3-D print.",
  tags: [
    "blender",
    "geometry-nodes",
    "mesh-to-volume",
    "volume-to-mesh",
    "sdf",
    "openvdb",
    "voxel",
    "blob",
    "organic",
    "procedural",
    "webxr",
    "glb",
  ],
  body: Body,
  externalLinks: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_to_volume.html",
      label:
        "Blender Manual: Mesh to Volume (CC BY-SA 4.0 — Blender Foundation)",
      note: "Official node documentation. Documents Density, Voxel Size, Interior Band Width, Exterior Band Width, and Fill Volume sockets. Related project: projects.blender.org/blender/blender-manual.",
    },
    {
      href: "https://github.com/AcademySoftwareFoundation/openvdb",
      label: "OpenVDB (Apache-2.0 — Academy Software Foundation)",
      note: "The open-source C++ library and VDB file format Blender uses internally for all volume objects. Understanding the narrow-band SDF storage model explains why band width parameters exist and why memory cost scales with surface area rather than volume. Related projects: openvdb_houdini bindings, OpenVDB AX expression language.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable with the Geometry Nodes editor and modifier stack.",
      "Completed the GN Distribute Points on Faces tutorial, or familiar with point scatter nodes.",
      "Blender 5.1 installed — Volume nodes are only stable from 4.0 onward.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Volume evaluation is CPU-only in Blender 5.1 — a Voxel Size of 0.035 m on a 28-sphere cluster takes ~5 seconds to evaluate on an 8-core CPU.",
      },
    ],
    steps: [
      {
        title: "Understand the SDF voxelisation pipeline",
        body: 'Mesh to Volume converts geometry into a narrow-band signed-distance-field stored on a 3-D voxel grid. Each voxel records the signed distance to the nearest triangle: negative inside the mesh, positive outside, zero exactly on the surface.\n\nThe key mental model: you are not storing the mesh itself, nor a solid fill — you are storing a distance function sampled at regular intervals. This is why the node has "Band Width" parameters rather than a simple on/off solid fill. The narrow-band approach allocates memory only within a thin shell around the surface, which is why a complex high-poly mesh and a simple sphere at the same voxel resolution use comparable RAM if their surface areas are similar.\n\nVolume to Mesh then runs marching cubes: it visits every voxel, checks the eight corner values, and emits triangles at the isosurface level you specify (the Threshold). At Threshold = 0 the extracted mesh is (approximately) the original mesh, re-triangulated uniformly by marching cubes. At Threshold > 0 the extracted mesh is an outward shell offset by that distance in metres.',
      },
      {
        title: "Set up the emitter icosphere and point scatter",
        body: 'Create an empty mesh object (a tiny plane) as the GN carrier. Add a Geometry Nodes modifier, create a new tree.\n\nIn the tree:\n  1. GeometryNodeMeshIcoSphere — Radius = 1.0, Subdivisions = 2 (gives 80 faces, enough scatter area)\n  2. GeometryNodeDistributePointsOnFaces — Mode = POISSON, Distance Min = 0.51 (= SPHERE_RADIUS × 1.6). POISSON mode enforces a minimum distance between scattered points. This prevents two sphere instances being placed so close that their combined geometry is already self-intersecting before voxelisation, which would produce an inside-out cavity in the SDF.\n  3. Wire: IcoSphere.Mesh → DistributePoints.Mesh\n\nExpose two Group Input sockets: Point Count (INT, drives Density Max) and Seed (INT). This makes the scatter tunable from the modifier panel.',
      },
      {
        title: "Place UV sphere instances and realise them",
        body: 'Add two more nodes:\n  4. GeometryNodeMeshUVSphere — Segments = 16, Rings = 12. UV sphere rather than IcoSphere for the instances because its triangulation is more uniform at low segment counts, which produces a cleaner SDF narrow-band.\n  5. GeometryNodeInstanceOnPoints — wire DistributePoints.Points → Points input, UVSphere.Mesh → Instance input, expose Sphere Radius as a Group Input → Scale socket.\n\nThe Scale socket on Instance on Points accepts a per-instance or uniform float. A uniform Group Input value scales every instance identically — useful for the parameter panel.\n\n  6. GeometryNodeRealizeInstances — wire InstanceOnPoints.Instances → Geometry.\n\nWHY realise before Mesh to Volume: the MeshToVolume node requires real mesh geometry (actual triangles with positions). Instance geometry has no triangles until realised — it stores only transforms referencing a shared datablock. If you wire instances directly into Mesh to Volume, Blender will evaluate an empty mesh because no triangles exist in the instance domain. Realise Instances collapses all instance transforms into actual vertex positions before the SDF computation.',
      },
      {
        title: "Connect Mesh to Volume and tune band widths",
        body: 'Add GeometryNodeMeshToVolume. Wire RealizeInstances.Geometry → Mesh input.\n\nSocket values:\n  Density = 1.0 (irrelevant for SDF isosurface extraction; matters only for Cycles volumetric rendering)\n  Voxel Size = expose as Group Input FLOAT, default 0.035\n  Interior Band Width = 0.18 (≈ half sphere radius; keeps the interior filled so thin poles do not become hollow)\n  Exterior Band Width = 0.18 (must be >= Threshold or the isosurface clips at the band edge)\n\nRule of thumb: set both band widths to THRESHOLD + 0.05. This gives a 5 cm margin between the band boundary and the isosurface, ensuring the marching-cubes extraction never hits the edge of the allocated voxel band.',
      },
      {
        title: "Connect Volume to Mesh and control blob fusion via Threshold",
        body: 'Add GeometryNodeVolumeToMesh. Wire MeshToVolume.Volume → Volume input.\n\nSocket values:\n  Voxel Size = same Group Input as above (the output mesh resolution matches the volume resolution)\n  Threshold = expose as Group Input FLOAT, default 0.09\n  Adaptivity = 0.0 (dense uniform triangulation for GLB/3-D print; raise to 0.3 for viewport performance without needing export quality)\n\nThe blob fusion logic:\n  - Two spheres at distance d apart: they fuse when Threshold > d/2.\n  - For SPHERE_RADIUS = 0.32 m spheres with Poisson Distance Min = 0.51 m, the gap between surfaces is 0.51 - 2×0.32 = -0.13 m. A negative gap means the spheres already overlap after realise — they fuse at any positive threshold.\n  - For non-overlapping spheres set Distance Min > 2×SPHERE_RADIUS (e.g. 0.70) and then increase Threshold until fusion appears.\n\nSet GeometryNodeSetShadeSmooth after VolumeToMesh (Shade Smooth = True) and GeometryNodeSetMaterial to assign the organic teal material.',
      },
      {
        title: "Export GLB and verify manifold geometry",
        body: 'With the carrier object selected:\n\n  bpy.ops.export_scene.gltf(\n      filepath="blob_fusion.glb",\n      export_format="GLB",\n      use_selection=True,\n      export_apply=True,   # evaluates the GN modifier\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n  )\n\nVerify in the 3-D Viewport: Tab → Edit Mode → Select All → Mesh → Clean Up → Select Non-Manifold. For a correct VolumeToMesh output this should select zero edges — the marching-cubes mesh is always manifold by construction. Compare this to the input Realise Instances mesh: Select Non-Manifold there will highlight every sphere intersection edge, confirming that the SDF round-trip cleaned up the geometry.',
      },
    ],
    finalResult:
      "A GLB containing a smooth organic blob cluster — teal Principled BSDF with subsurface scattering — Draco-compressed at level 6. The source .blend retains the live GN modifier with Threshold, Voxel Size, Sphere Radius, and Point Count exposed as modifier panel sliders. Dragging Threshold from 0 to 0.15 shows the live blob fusion in the viewport.",
    variations: [
      "Shell offset for 3-D printing: set Threshold = 0.003 (3 mm) to produce a uniform 3 mm outward shell from any input mesh. This compensates for FDM shrinkage and produces a uniformly offset exterior surface without the artefacts that an offset modifier creates at sharp corners.\n\nThe SDF offset is geometrically exact (it respects the distance field, not just the vertex normals), so convex and concave regions both offset correctly — unlike a Shrink/Fatten operation which moves vertices along their local normals and produces pinching at concavities.",
      "Voronoi blob: replace the Scatter + UV Sphere chain with a GN tree that distributes points on a plane and instances convex hulls (from a Convex Hull node on random point sets). Each irregular polytope instance gets voxelised into the shared SDF, fusing into an irregular organic form rather than a sphere cluster.",
      "Animated blob split / merge: keyframe Threshold from 0.12 to 0.0 over 60 frames. At 0.12 the blob is fully fused; at 0.0 the individual spheres are separated. Because the GN tree re-evaluates every frame, the split is smooth and continuous — no gap frames or topological discontinuities.",
    ],
    troubleshooting: [
      {
        symptom:
          "Volume to Mesh produces a flat or empty mesh despite visible blob in viewport",
        cause:
          "export_apply=False omitted, so the GLB exporter received the unmodified carrier plane (a 1 mm quad) rather than the GN-evaluated blob geometry.",
        fix: "Add export_apply=True to the bpy.ops.export_scene.gltf() call. Confirm the GLB has geometry in glTF Viewer before further processing.",
      },
      {
        symptom: "Blob has hard flat cuts / clipping faces near the edges",
        cause:
          "Exterior Band Width is smaller than Threshold. The SDF only extends 'Exterior Band Width' metres from the mesh surface; if Threshold > Exterior Band Width the isosurface hits the edge of the allocated band and gets clipped flat.",
        fix: "Set Exterior Band Width to Threshold + 0.05 (a 5 cm margin). Update Interior Band Width similarly if the blob has hollow interior regions.",
      },
      {
        symptom:
          "Mesh to Volume evaluation takes 30+ seconds for 28 spheres at 0.035 voxel size",
        cause:
          "Voxel count scales as O(1/v³). At 0.035 m voxels for a 2 m bounding box: (2/0.035)³ ≈ 373,000 voxels. The narrow-band allocates only a fraction of this, but 28 realised spheres have significant total surface area.",
        fix: "Work at 0.08 m voxels during sculpt/tweak sessions; reduce to 0.035 m only for the final GLB export run. The blueprint.py VOXEL_SIZE constant at the top of the file is the single place to change this.",
      },
      {
        symptom: "Instances not realised — Mesh to Volume receives empty geometry",
        cause:
          "GeometryNodeRealizeInstances was omitted or wired after Mesh to Volume. Mesh to Volume cannot process unresolved instance geometry.",
        fix: "Confirm the node order: InstanceOnPoints → RealizeInstances → MeshToVolume. Realise Instances must come immediately before Mesh to Volume.",
      },
    ],
  },
  base,
);
