import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnRaycastTerrainDecalScatterBody() {
  return (
    <>
      <p>
        The <strong>Raycast</strong> node in Geometry Nodes fires one ray per
        point and asks a target mesh "where exactly do you intersect this ray?"
        The answer comes back as <code>Hit Position</code>,{" "}
        <code>Hit Normal</code>, <code>Hit Distance</code>, and a boolean{" "}
        <code>Is Hit</code> flag.  Together those four outputs are enough to
        snap any set of instances flush to an arbitrary curved surface — without
        UV projection, baking, or any knowledge of the target mesh&apos;s
        topology.  Compare this with the density-weight approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-ground-cover-scatter"
          className={lk}
        >
          ground-cover scatter tutorial
        </Link>
        , where scatter density is controlled by painted vertex weights; here
        the scatter positions are fixed on a regular grid and only the Z
        coordinate is determined by the terrain.
      </p>
      <p>
        The key architectural decision is <em>coordinate space</em>.  The
        Raycast node compares source positions against a target geometry, and
        both must live in the same space.  The emitter points are expressed in
        the scatter object&apos;s local space.  The terrain mesh — a separate
        Blender object — arrives via <code>Object Info</code> with{" "}
        <code>transform_space&nbsp;=&nbsp;RELATIVE</code>, which pre-multiplies
        the terrain&apos;s world matrix by the scatter object&apos;s inverse
        world matrix, landing both in the same frame of reference.  With both
        objects at the scene origin this is the identity transform, but setting
        it correctly now means the rig stays valid if either object is later
        moved.  The same RELATIVE pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere"
          className={lk}
        >
          dual-mesh Voronoi tutorial
        </Link>{" "}
        wherever one GN tree references external objects.
      </p>
      <p>
        The displacement on the terrain is applied as a baked plain mesh before
        the Raycast runs.  Keeping the terrain as a static mesh object (not a
        GN-processed one) avoids a dependency cycle: if the terrain had its own
        GN modifier, Blender would need to evaluate the terrain GN tree while
        the scatter GN tree is asking for the terrain&apos;s geometry — a
        circular reference the dependency graph refuses to resolve.  The same
        bake-before-reference discipline is essential in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bake-node-simulation-growth"
          className={lk}
        >
          simulation bake tutorial
        </Link>
        , where downstream consumers must not re-trigger the upstream
        simulation.  The terrain&apos;s displacement uses a Clouds texture at{" "}
        <code>noise_scale&nbsp;=&nbsp;1.3</code> and{" "}
        <code>strength&nbsp;=&nbsp;0.42</code>, producing a modest 0–0.42 m
        elevation range; the ray origin is placed at{" "}
        <code>EMITTER_HEIGHT&nbsp;=&nbsp;2.0&nbsp;m</code> with a ray length of
        3.5 m, providing a 1.08 m safety margin below the deepest terrain point.
      </p>
      <p>
        After the Raycast, <code>Is&nbsp;Hit&nbsp;=&nbsp;False</code> marks
        points whose rays escaped the terrain boundary — typically the grid
        corners that extend past the terrain edge.  A{" "}
        <code>BooleanMath&nbsp;(NOT)</code> inverts the flag so that{" "}
        <code>DeleteGeometry</code>&apos;s selection deletes precisely those
        missed points.  This keeps the output clean without needing to manually
        shrink the emitter grid to stay strictly within the terrain footprint.
        The displacement adds another use for the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          adaptive subdivision displacement workflow
        </Link>
        : applying that technique to the terrain mesh before running this script
        adds micropolygon geometry at the surface, giving the Raycast more
        triangles to intersect and therefore smoother hit normals on steep
        slopes.
      </p>
      <p>
        Decal orientation comes from <code>AlignEulerToVector</code> with{" "}
        <code>axis&nbsp;=&nbsp;Z</code> and <code>Vector&nbsp;=&nbsp;Hit
        Normal</code>.  This maps each instance&apos;s local +Z axis toward the
        terrain normal at that point, so the quad lies flat on the surface
        regardless of slope.  Per-point scale variation (
        <code>SCALE_MIN&nbsp;=&nbsp;0.55</code>,{" "}
        <code>SCALE_MAX&nbsp;=&nbsp;1.50</code>) uses a separate{" "}
        <code>FunctionNodeRandomValue</code> seeded independently from the
        scatter seed so that scale and position are uncorrelated — otherwise
        dense regions also tend to be the large-decal regions, producing an
        unnatural double-clustering effect.  The technique exports cleanly to
        GLB with <code>export_apply&nbsp;=&nbsp;True</code>, which bakes the GN
        modifier before writing, meaning the GLB carries a flat list of
        positioned triangles rather than a live procedural graph — compatible
        with any glTF 2.0 loader including Three.js in a WebXR scene.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-raycast-terrain-decal-scatter",
  title:
    "GN Raycast — Terrain-Following Decal Scatter (Blender 5.1)",
  date: "2026-06-13",
  kind: "tutorial",
  excerpt:
    "Fire per-point rays downward from a grid emitter, snap each ray's hit position to an irregular terrain surface, and orient flat decal quads to the terrain normal — all in a single Geometry Nodes tree using the Raycast node.",
  Body: GnRaycastTerrainDecalScatterBody,
};

const { entry } = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-raycast-terrain-decal-scatter/",
    time: "one focused hour",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 only",
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
      "Comfortable adding and connecting nodes in the Geometry Nodes editor",
      "Understands the concept of Blender modifier stacks",
      "Familiar with bpy.ops for basic object creation (or willing to run blueprint.py as-is)",
    ],
    steps: [
      {
        title: "Create the terrain mesh",
        body: `Run blueprint.py or follow manually:

Add a Grid (28×28 subdivisions, 4 m size).  Add a Subsurf modifier (levels=1) then a Displace modifier.  In the Displace modifier create a new Clouds texture; set noise_scale=1.3 and displacement strength=0.42.  Set Texture Coordinates → Local.

Apply both modifiers (Object → Apply → All Modifiers, or Ctrl+A in the modifier stack).  Rename the object terrain_mesh.

WHY apply: the Raycast node's Target Geometry must be a static mesh.  A pending modifier stack makes the terrain's topology unstable during GN evaluation and can cause the dependency graph to refuse the cross-object reference.`,
      },
      {
        title: "Create the decal template object",
        body: `In Edit Mode on a new mesh object, create a single quad: four vertices at (±0.09, ±0.09, 0), forming a 0.18 m square.  Name the mesh DecalQuad and the object decal_template.

Set the object Hide Render flag to True (H key in the viewport, or the camera icon in the Outliner).  Assign an Emission material: colour=(0.08, 0.78, 1.0), strength=3.2.  Enable Use Backface Culling on the material so decals only show from above the terrain surface.

This object is never directly rendered — it is only referenced as an instance source inside the GN tree.`,
      },
      {
        title: "Create the scatter host and add the GN modifier",
        body: `Add an empty Mesh object (Add → Mesh → from the Python console: bpy.ops.mesh.primitive_plane_add(); then delete all verts in Edit Mode to leave an empty mesh).  Name it decal_scatter.  Place it at the scene origin with no transforms applied.

Add a Geometry Nodes modifier.  Click New to create a fresh node group named DecalScatter.  The Group Input and Group Output nodes appear automatically.  Add one Output socket: Geometry (NodeSocketGeometry).`,
      },
      {
        title: "Build the emitter: Grid → Distribute → SetPosition lift",
        body: `Inside the node group:

Add MeshGrid: Size X=4, Size Y=4, Vertices X=20, Vertices Y=20.
Connect Mesh → DistributePointsOnFaces.  Set mode=POISSON_DISK, Distance Min=0.14, Seed=7.

Add an InputPosition node and wire it through SeparateXYZ.  Feed X and Y into CombineXYZ; set Z=2.0 (the emitter height).  Connect CombineXYZ → SetPosition.Position.  Wire the distributed Points → SetPosition.Geometry.

Result: the scatter points float 2 m above the terrain in a Poisson-disk pattern, ready to fire rays downward.`,
      },
      {
        title: "Add ObjectInfo for the terrain and wire the Raycast node",
        body: `Add ObjectInfo.  In the node's Object field, pick terrain_mesh.  Set Transform Space → Relative.  This imports the terrain geometry in the scatter object's local coordinate space.

Add a CombineXYZ node; set X=0, Y=0, Z=−1.  This is the constant downward ray direction.

Add a Raycast node.  Connect:
  SetPosition.Geometry → Raycast socket[0]  (source geometry carrying the points)
  ObjectInfo.Geometry  → Raycast.Target Geometry
  CombineXYZ.Vector    → Raycast.Ray Direction
Set Raycast.Ray Length = 3.5.`,
      },
      {
        title: "Delete missed rays, snap to Hit Position, align to Hit Normal",
        body: `Add BooleanMath, operation=NOT.  Connect Raycast.Is Hit → BooleanMath input.
Add DeleteGeometry, domain=POINT, mode=ALL.  Connect:
  Raycast[0] (source geometry out) → DeleteGeometry.Geometry
  BooleanMath.Boolean → DeleteGeometry.Selection

Add SetPosition.  Connect DeleteGeometry.Geometry → SetPosition.Geometry.
Connect Raycast.Hit Position → SetPosition.Position.

Add FunctionNodeAlignEulerToVector, axis=Z, pivot_axis=AUTO.
Connect Raycast.Hit Normal → AlignEulerToVector.Vector.`,
      },
      {
        title: "Add random scale and instance the decal",
        body: `Add FunctionNodeRandomValue, data_type=FLOAT, Min=0.55, Max=1.50, Seed=19.
Add CombineXYZ; connect RandomValue.Value to X, Y, and Z inputs — this makes a uniform-scale vector from a single float.

Add ObjectInfo for decal_template, Transform Space=Relative.

Add InstanceOnPoints.  Connect:
  SetPosition.Geometry      → InstanceOnPoints.Points
  ObjectInfo(decal).Geometry → InstanceOnPoints.Instance
  AlignEulerToVector.Rotation → InstanceOnPoints.Rotation
  CombineXYZ.Vector           → InstanceOnPoints.Scale

Add RealizeInstances → GroupOutput.Geometry.`,
      },
      {
        title: "Export as GLB for WebXR",
        body: `In the script, or manually via File → Export → glTF 2.0:

  export_apply=True        bake the GN modifier before writing
  export_yup=True          +Y up for Three.js / WebXR convention
  Draco compression level 6
  Image format: WebP
  Use Selection: select decal_scatter and terrain_mesh

The GLB carries a flat indexed triangle list — no live GN graph — so it loads in any glTF 2.0 viewer.  To inspect the result in the browser, drop it into https://gltf.report (no account needed).`,
      },
    ],
    finalResult:
      "A Blender 5.1 scene with an irregular terrain mesh (28×28 grid, Clouds-noise displacement baked to plain mesh) and a Geometry Nodes decal scatter object. The GN tree fires downward rays from a 2 m-elevated Poisson-disk grid, snaps hit points to the terrain surface, orients each decal quad's +Z axis to the surface normal via AlignEulerToVector, and applies per-point random scale (0.55–1.50×) from a separately seeded RandomValue node. Decals that miss the terrain edge are deleted by BooleanMath(NOT) + DeleteGeometry. Exported as terrain_decal_scatter.glb with Draco compression and WebP textures.",
    variations: [
      "Attribute transfer from terrain to decals: the Raycast node has an Attribute input socket and a matching Attribute output. Store a custom float attribute on the terrain (e.g. 'wetness' from a vertex paint) and connect it to Raycast.Attribute. After the hit, Raycast.Attribute (output) carries the interpolated value at the hit point. Feed that into a SetNamedAttribute node on the scattered points — now each decal knows how wet its terrain patch is. Drive the decal's emission strength through a NamedAttribute field in the material to make wet-zone decals glow brighter.",
      "Slope masking: after the Raycast, compute the dot product of Hit Normal with the world-up vector (0,0,1) using VectorMath(DOT). This gives 1.0 on a flat surface and 0.0 on a vertical face. Map Range the result to 0→1 and use it as the Selection input of InstanceOnPoints — decals appear only where the terrain is flatter than a threshold angle. Useful for moss, puddles, or footprints that should not exist on cliffs.",
      "Two-pass layered decals: duplicate the GN modifier and give each pass a different decal template and a different scatter seed. Lower the Distance Min on the small-decal pass to place micro-details between the larger ones. Since both passes use the same terrain Raycast target, the two layers are surface-coherent even if the terrain is later resculpted.",
    ],
    troubleshooting: [
      {
        symptom: "All scatter points disappear after adding DeleteGeometry",
        cause:
          "The BooleanMath(NOT) is inverting Is Hit correctly, but Is Hit is all-False — meaning every ray missed the terrain. This happens when the scatter grid and terrain are in incompatible coordinate spaces.",
        fix: "Confirm Object Info's Transform Space is set to RELATIVE, not ORIGINAL. Also confirm both objects have no pending scale transforms (Ctrl+A → Apply Scale on both objects). If the terrain has its displacement modifier still un-applied, apply it now so the mesh exists in object space. Print Raycast.Hit Distance values in the Python console: bpy.data.objects['decal_scatter'].evaluated_get(bpy.context.evaluated_depsgraph_get()) — if all distances are 0.0 the rays are firing but not finding geometry.",
      },
      {
        symptom: "Decals appear flat (not tilted to terrain slope) — all normals point straight up",
        cause:
          "The AlignEulerToVector node has its axis set to X or Y instead of Z, or its Vector input is receiving the world-up vector (0,0,1) rather than Hit Normal.",
        fix: "Select the AlignEulerToVector node and confirm Axis = Z in the node properties sidebar. Trace the wire from Raycast.Hit Normal to AlignEulerToVector.Vector — make sure it is the Hit Normal output (third output socket, labelled 'Hit Normal') and not Hit Position or the unnamed first output. In the viewport, select one scatter point with its decal instance and inspect its local Z rotation in the N-panel — it should differ from 0 on a sloped surface.",
      },
      {
        symptom: "GLB export produces an empty file or missing geometry",
        cause:
          "export_apply=True evaluates the GN modifier at export time. If the terrain_mesh object is hidden (H key toggled) or excluded from the view layer, Object Info cannot resolve it during the export evaluation and the Raycast returns no hits — the scatter produces zero geometry.",
        fix: "Before exporting, ensure terrain_mesh is visible in the viewport (eye icon ON in Outliner) and not excluded from the view layer (checkbox ON). Run the export again. If the GLB is still empty, bake the GN modifier to a plain mesh first (Object → Apply → Visual Geometry to Mesh) then export the resulting mesh object directly.",
      },
    ],
  },
  base,
);

export { entry };
