import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDistributePointsInVolumeCrystalGeodeBody() {
  return (
    <>
      <p>
        <strong>Distribute Points in Volume</strong> (
        <code>GeometryNodeDistributePointsInVolume</code>) scatters a point cloud
        inside a VDB fog volume using density-weighted rejection sampling.  The node
        has two modes: <code>DENSITY_RANDOM</code> (organic, irregular placement
        controlled by a density multiplier and seed) and <code>DENSITY_GRID</code>{" "}
        (a perfectly regular voxel-centre lattice, good for 3-D-print infill or LED
        arrays).  Neither mode can work directly on a mesh — the input must be a{" "}
        <em>Volume</em> geometry, which means{" "}
        <code>GeometryNodeMeshToVolume</code> is almost always the preceding node
        in the chain.
      </p>
      <p>
        This tutorial builds a noise-displaced icosphere shell, converts it to a
        solid fog volume, scatters hexagonal-bipyramid crystal inclusions throughout
        the interior, filters out instances that sit too close to the inner wall via{" "}
        <code>GeometryNodeProximity</code>, and exports the full geode — stone
        shell plus glowing cyan crystals — as a multi-material WebXR GLB.
      </p>

      <h2>Volume domain isolation: the central expert constraint</h2>
      <p>
        A Volume geometry contains <strong>no point, edge, or face domain</strong>.
        The internal representation is a VDB voxel grid: a spatial hash of active
        voxels each carrying a scalar density value, with no concept of vertices,
        connectivity, or topology.  Every field node that reads mesh structure —{" "}
        <code>Named Attribute</code>, <code>Edge Vertices</code>,{" "}
        <code>Input Normal</code>, <code>Input Index</code> — silently evaluates to
        its default value (zero) when the flowing geometry is a Volume, because there
        are no elements to index.  No error is raised; the node just returns zero for
        every evaluation.
      </p>
      <p>
        The correct pipeline is therefore a strict conversion chain:
      </p>
      <pre>{`Mesh → MeshToVolume (Volume domain)
     → DistributePointsInVolume (PointCloud domain)
     → InstanceOnPoints / attribute work (POINT domain)`}</pre>
      <p>
        Only after <code>DistributePointsInVolume</code> (or{" "}
        <code>VolumeToMesh</code>) is the geometry back in a domain where field
        nodes can read per-element data.  This is why{" "}
        <Link href="/tutorials/blender-tutorial-gn-geometry-proximity-deform" className={lk}>
          Geometry Proximity
        </Link>
        {" "}is placed <em>after</em> DistributePointsInVolume — in the point-cloud
        context — not between MeshToVolume and DistributePointsInVolume where it
        would see only the volume domain and return zero distances.
      </p>

      <h2>MeshToVolume: filling the interior</h2>
      <p>
        <code>GeometryNodeMeshToVolume</code> voxelises a closed mesh surface into a
        fog volume.  The key parameter is <code>Interior Band Width</code>: this
        controls how far inward from the surface voxels are filled with the{" "}
        <code>Density</code> value.  A band of 0.1 m on a 1.5 m sphere creates a
        thin shell of density on the inside of the wall — useful for surface-scatter
        effects.  Setting the band to 8.0 m (much larger than the sphere radius)
        fills the <em>entire</em> enclosed interior with a uniform density of 1.0.
        DistributePointsInVolume in <code>DENSITY_RANDOM</code> mode then uses that
        uniform density as a flat probability field: every voxel inside the sphere
        has equal likelihood of receiving a point.
      </p>
      <p>
        <code>Voxel Size = 0.065 m</code> on a 1.5 m sphere gives roughly
        3 × 1.5 / 0.065 ≈ 69 voxels per axis, ~22,000 active interior voxels.  With{" "}
        <code>Density = 4.5</code>, the expected output is 300–600 scattered points
        — enough crystal inclusions to look naturally dense without overwhelming the
        GLB export size.  Halve the voxel size and point count quadruples for the
        same density multiplier (volume scales cubically with resolution).
      </p>

      <h2>DENSITY_RANDOM vs DENSITY_GRID</h2>
      <p>
        <code>DENSITY_RANDOM</code> draws candidate positions uniformly across
        active voxels and accepts each with probability equal to
        density_value × Density_input.  Because our interior has uniform density
        1.0, the Density socket acts as a plain points-per-unit-volume scaler.
        The distribution is stochastically irregular — neighbouring crystals may be
        close or far apart.  The optional <em>Min Distance</em> parameter adds a
        rejection step that enforces a minimum separation at the cost of more
        candidate draws; leaving it at zero gives the fastest scatter.
      </p>
      <p>
        <code>DENSITY_GRID</code> samples every voxel centre where density exceeds
        a Threshold.  The result is a perfectly regular 3-D lattice: every crystal
        at the same spacing, aligned to the voxel grid axes.  This is exactly what
        the studio needs for 3-D-print lattice infill or a volumetric LED array, but
        reads as visually unnatural for organic crystal growth.  Switching between
        modes live in the viewport is a revealing demonstration — try it in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-volume-cube-procedural-cloud" className={lk}>
          Volume Cube tutorial
        </Link>
        {" "}context where a grid of particles creates a dramatically different cloud shape.
      </p>

      <h2>GeometryProximity as a surface-depth filter</h2>
      <p>
        After scatter, some points land very close to the inner surface of the shell.
        A crystal rooted 0.03 m from the wall but scaled to 0.12 m will clip through
        the stone.  <code>GeometryNodeProximity</code> with{" "}
        <code>target_element = &apos;FACES&apos;</code> computes the minimum distance
        from each point-cloud point to the nearest face of the shell mesh.  A
        threshold comparison (<code>distance &gt; MIN_CRYSTAL_DEPTH</code>) becomes
        the Selection input for <code>DeleteGeometry</code>, removing rim-zone points
        before they reach InstanceOnPoints.
      </p>
      <p>
        The critical layout detail: Proximity&apos;s <strong>Target</strong> input is
        wired directly from GroupInput (the shell mesh geometry, forked from the
        same output that feeds MeshToVolume), while the <em>node&apos;s evaluation
        context</em> — the domain in which Distance is evaluated per element — comes
        from the geometry flowing through DeleteGeometry at that point in the tree:
        the PointCloud from DistributePointsInVolume.  This is the same pattern as
        the{" "}
        <Link href="/tutorials/blender-tutorial-gn-geometry-proximity-deform" className={lk}>
          Proximity Deform tutorial
        </Link>
        {" "}but applied to a PointCloud domain rather than a mesh domain.  Distance
        evaluates once per <em>point</em>, not per face.
      </p>

      <h2>GLB export: RealizeInstances is mandatory</h2>
      <p>
        Blender&apos;s glTF exporter ignores PointCloud geometry and does not export
        un-realised instances.  The pipeline must end with{" "}
        <code>RealizeInstances → JoinGeometry([shell, crystals])</code> before
        GroupOutput.  <code>export_apply=True</code> bakes the GN modifier at export
        time, which triggers the full pipeline — MeshToVolume, DistributePointsInVolume,
        RealizeInstances — and writes the result as a static mesh to the GLB.  The
        exported file contains two mesh primitives (stone shell at material slot 0,
        crystals at material slot 1) referenced by a single mesh node, which Three.js
        reads correctly with <code>loader.load(&apos;crystal_geode.glb&apos;, g =&gt; g.scene)</code>.
      </p>
      <p>
        Compare with the{" "}
        <Link href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto" className={lk}>
          Realize Instances — Crystal Grotto
        </Link>
        {" "}tutorial, which scatters crystals on a <em>mesh surface</em> via
        DistributePointsOnFaces rather than inside a volume, showing the contrast
        between surface and volumetric scatter workflows.
      </p>

      <h2>Instance rotation and scale</h2>
      <p>
        <code>FunctionNodeRandomValue</code> with <code>data_type=&apos;FLOAT_VECTOR&apos;</code>
        generates a different random (x, y, z) Euler angle per point when evaluated
        in the PointCloud domain.  The range [0, 2π] on all three axes gives fully
        omnidirectional crystal orientations — realistic for a geode interior where
        nucleation sites are randomly distributed on the cavity wall.  For a more
        geologically accurate look, you could bias the Z-axis toward the shell
        outward-normal direction by reading GeometryProximity&apos;s{" "}
        <em>Position</em> output (nearest point on shell), computing a vector from
        the crystal root to that surface point, and blending it with the random
        rotation — but uniform random is the right starting point.
      </p>
      <p>
        Uniform scale (same float for X, Y, Z via <code>ShaderNodeCombineXYZ</code>)
        preserves the hexagonal-bipyramid aspect ratio baked into the crystal mesh.
        The prototype&apos;s top apex is at Z=1.0 and ring radius is 0.22 m —
        approximately 4.5× elongation — so even at the minimum scale of 0.06 m the
        crystal reads as a recognisable pointy form.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    topic: "geometry-nodes",
    slug: "blender-tutorial-gn-distribute-points-in-volume-crystal-geode",
    title:
      "GN Distribute Points in Volume — Crystalline Geode Interior: SDF Shell with Embedded Crystal Inclusions",
    date: "2026-06-27",
    goal:
      "Convert a noise-displaced icosphere shell to a VDB fog volume via MeshToVolume, scatter hexagonal-bipyramid crystal inclusions throughout the solid interior using GeometryNodeDistributePointsInVolume (DENSITY_RANDOM mode), filter rim-zone points with GeometryNodeProximity distance comparison, instance and realise the crystals, and export the multi-material geode as a WebXR GLB.",
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
      "Familiar with Geometry Nodes modifier and node-tree navigation",
      "Know the MeshToVolume node and VDB fog volume concept",
      "Understand domain context (POINT vs FACE evaluation)",
      "Comfortable with InstanceOnPoints and RealizeInstances pattern",
    ],
    steps: [
      {
        title: "Build the noise-displaced shell",
        body: "bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.5) → 320 triangular faces. bm.normal_update(). For each vertex: n_val = mathutils.noise.noise(v.co * 0.85); v.co += v.normal * n_val * 0.22. The noise.noise() function returns values in roughly [−1, +1], so displacement varies ±0.22 m around the base radius. bm.to_mesh(me). The shell is an independently usable asset; the GN modifier sits on top without destroying it.",
      },
      {
        title: "Build the crystal prototype (hexagonal bipyramid)",
        body: "verts: apex_top=(0,0,1.0), apex_bot=(0,0,−0.30), plus 6 equatorial ring verts at radius=0.22, z=0.18. faces: 6 top-cone triangles (apex_top → ring[i] → ring[i+1]), 6 bottom-cone triangles (apex_bot → ring[i+1] → ring[i], inverted winding for outward normals). me.from_pydata(verts, [], faces). Place prototype at (50,0,0) to keep it off-camera. ObjectInfo in the GN tree references it regardless of viewport position.",
      },
      {
        title: "MeshToVolume — fill the interior",
        body: "mtv.resolution_mode = 'VOXEL_SIZE'. mtv.inputs['Voxel Size'].default_value = 0.065. mtv.inputs['Density'].default_value = 1.0. mtv.inputs['Interior Band Width'].default_value = 8.0. CRITICAL: Interior Band Width must exceed the largest interior dimension of the shell (radius ≈ 1.5 m, so 8.0 m is safely larger). A small band (e.g. 0.05 m) creates only a thin density shell on the inside of the wall, so DistributePointsInVolume would scatter points in that thin skin rather than throughout the cavity.",
      },
      {
        title: "DistributePointsInVolume — scatter interior points",
        body: "dpv.mode = 'DENSITY_RANDOM'. dpv.inputs['Density'].default_value = 4.5. dpv.inputs['Seed'].default_value = 17. Wire mtv.outputs['Volume'] → dpv.inputs['Volume']. The Density socket multiplies the volume's density field (1.0 everywhere inside) to set the expected point count per unit volume. For the 1.5 m sphere (≈14 m³): expect 300–600 output points at Density=4.5 with voxel_size=0.065. Change Density live to see the count change; at Density=20 the geode fills densely with hundreds of crystals.",
      },
      {
        title: "GeometryProximity filter — exclude the rim zone",
        body: "prox.target_element = 'FACES'. Wire gi.outputs[0] (shell_geo, FORKED from the same GroupInput already wired to mtv) → prox.inputs['Target']. Wire prox.outputs['Distance'] → FunctionNodeCompare(GREATER_THAN, B=0.20).inputs['A']. Wire compare.outputs['Result'] → del_geo.inputs['Selection']. Wire dpv.outputs['Points'] → del_geo.inputs['Geometry']. DeleteGeometry keeps points where Selection=True (distance from shell > 0.20 m). Prox.Distance evaluates once per POINT of del_geo's flowing geometry (the dpv point cloud), NOT per face of the shell target — the evaluation context is always the flowing geometry, not the target.",
      },
      {
        title: "InstanceOnPoints and RealizeInstances",
        body: "rv_rot.data_type = 'FLOAT_VECTOR'; min=(0,0,0); max=(6.283,6.283,6.283); seed=42. rv_scale.data_type = 'FLOAT'; min=0.06; max=0.20; seed=7. CombineXYZ(rv_scale.Float, rv_scale.Float, rv_scale.Float) → iop.inputs['Scale']. ObjectInfo(crystal_ob, transform_space='RELATIVE').Geometry → iop.inputs['Instance']. del_geo.Geometry → iop.inputs['Points']. rv_rot.Vector → iop.inputs['Rotation']. RealizeInstances converts all instances to a single merged mesh — mandatory before JoinGeometry and before GLB export.",
      },
      {
        title: "JoinGeometry and GLB export",
        body: "join: wire gi.outputs[0] and ri.outputs['Mesh'] → join.inputs['Geometry']. Wire join.outputs['Geometry'] → go.inputs[0]. For export: bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6). export_apply=True triggers the full GN evaluation (MeshToVolume → DistributePointsInVolume → RealizeInstances) at export time. The GLB contains two mesh primitives — shell (GD_MatShell) and crystals (GD_MatCrystal) — referenced by one mesh node.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No points appear inside the shell — empty geode",
        cause:
          "Interior Band Width too small: MeshToVolume fills only a thin surface skin, not the enclosed interior. DistributePointsInVolume finds no density in the true interior and produces zero points.",
        fix: "Set Interior Band Width to a value larger than the shell radius (e.g. 8.0 m for a 1.5 m sphere). Verify in the Spreadsheet Editor: select the GN modifier object, set domain to Point — if 0 rows show, the scatter produced no points. Increase Band Width first, then increase Density multiplier.",
      },
      {
        symptom: "Crystals clip through the outer stone wall",
        cause:
          "MIN_CRYSTAL_DEPTH too small relative to SCALE_MAX. A crystal scaled to 0.20 m rooted 0.05 m from the inner surface will extend 0.15 m outward and easily penetrate the 0.22 m shell wall.",
        fix: "Increase MIN_CRYSTAL_DEPTH ≥ SCALE_MAX. At SCALE_MAX=0.20 m, set MIN_CRYSTAL_DEPTH=0.22 m for full clearance. Alternatively reduce SCALE_MAX. Verify in Edit Mode of the exported GLB: check for faces with positive Z beyond the shell radius in the XZ cross-section.",
      },
      {
        symptom: "GLB exports only the shell, no crystals visible",
        cause:
          "RealizeInstances missing from the tree, or export_apply=False. Without RealizeInstances, the instances exist only in Blender's internal representation — the exporter ignores un-realised instance geometry. export_apply=False skips the GN modifier entirely.",
        fix: "Confirm RealizeInstances is in the chain before JoinGeometry. Set export_apply=True in the gltf export call. Check the exported file size: a shell-only GLB is ~50 kB; shell + 400 crystal instances is typically 200–400 kB after Draco.",
      },
      {
        symptom: "All crystals the same size — no random scale variation",
        cause:
          "FunctionNodeRandomValue scale wired directly to InstanceOnPoints.Scale (which expects VECTOR, not FLOAT) — Blender silently uses the default value (1,1,1) instead of the random float.",
        fix: "Use ShaderNodeCombineXYZ to promote the random FLOAT to a VECTOR before wiring to iop.inputs['Scale']. Connect rv_scale.outputs[1] (the Float output for FLOAT data_type) to CombineXYZ X, Y, and Z inputs, then CombineXYZ.Vector → iop.inputs['Scale'].",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-distribute-points-in-volume-crystal-geode",
    title:
      "GN Distribute Points in Volume — Crystalline Geode Interior: SDF Shell with Embedded Crystal Inclusions",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "GeometryNodeDistributePointsInVolume scatters a point cloud inside a VDB fog volume built via MeshToVolume. Volume domains have no mesh topology — field nodes silently return zero until the geometry converts back to PointCloud or Mesh domain. This tutorial covers DENSITY_RANDOM vs DENSITY_GRID modes, surface proximity filtering via GeometryNodeProximity, and multi-material WebXR GLB export of a crystalline geode.",
    Body: GnDistributePointsInVolumeCrystalGeodeBody,
  },
);
