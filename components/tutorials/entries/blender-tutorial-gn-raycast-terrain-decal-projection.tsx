import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnRaycastTerrainDecalProjectionBody() {
  return (
    <>
      <p>
        <strong>Raycast</strong> (<code>GeometryNodeRaycast</code>) fires a
        directed ray from each source point and tests intersection against a
        target geometry, returning the hit position, the face normal at the
        hit point, and a boolean that tells you whether the ray reached the
        surface at all within the specified length.  It is the correct node
        any time you need a <em>directional</em> query — snapping geometry to
        the ground beneath it, checking line-of-sight between two objects, or
        projecting a decal stamp downward onto uneven terrain.
      </p>
      <p>
        This tutorial projects a 15 &times; 15 grid of hexagonal stamps
        downward onto a sine-wave terrain, using Hit Position to snap each
        stamp to the surface,{" "}
        <code>AlignEulerToVector</code> to orient its Z axis along the hit
        face normal, and a slope-cosine gate to delete stamps on cliff faces
        too steep to hold a decal.  The result exports as a WebXR-ready GLB
        with a <code>stamp_col</code> vertex-colour attribute (green = flat,
        amber = moderate, red = near-threshold slope).
      </p>

      <h2>Raycast vs Sample Nearest Surface</h2>
      <p>
        Both nodes read from a target geometry at a query position, but they
        answer different questions:
      </p>
      <pre>{`Raycast              — fires along a direction; returns the FIRST intersection
                        within Ray Length; correct for "snap to ground", LOS
Sample Nearest Surface — omnidirectional; returns the CLOSEST point on any face;
                        correct for "stick to shape", attribute transfer`}</pre>
      <p>
        A common confusion: if the stamp grid and terrain share the same
        origin, the nearest surface point to any grid point is almost always
        on the <em>underside</em> of the terrain (the closest face) rather
        than the top.  Raycast with direction <code>(0, 0, -1)</code>
        {" "}correctly hits the <em>top</em> face.
      </p>

      <h2>Pipeline overview</h2>
      <pre>{`MeshGrid(15×15, 7 m)
  → SetPosition(offset Z = +5 m)       ← raise grid to fire height
  → [geometry chain]

ObjectInfo(RC_Terrain, ORIGINAL) → Target Geometry

Raycast(
  Target = ObjectInfo.Geometry,
  Ray Direction = (0, 0, -1),           ← straight down
  Ray Length = 20 m                     ← enough to clear tallest bump
) →
  Is Hit   → BoolNot → DeleteGeometry  ← remove off-edge candidates
  Hit Position → SetPosition.Position  ← snap survivors to terrain
  Hit Normal → VectorMath DOT_PRODUCT(Z_UP) → slope_cos
             → AlignEulerToVector(Z)   ← orient hex to face normal

slope_cos < 0.35 → DeleteGeometry      ← remove cliff stamps
slope_cos → MapRange → Scale on InstanceOnPoints
          → ColorRamp → StoreNamedAttribute("stamp_col")

MeshCylinder(6 sides, R=0.20 m) → InstanceOnPoints → RealizeInstances`}</pre>

      <h2>The Source Position implicit wiring</h2>
      <p>
        Raycast&rsquo;s <strong>Source Position</strong> socket is a field
        input.  When left unconnected it defaults to{" "}
        <code>InputPosition</code> — the current position of each element in
        the geometry flowing through the modifier.  That is almost always what
        you want.  The only case where you need to wire it explicitly is when
        the ray origin should be somewhere <em>other</em> than each point
        (e.g. ray from a fixed camera position to every mesh face), which
        requires feeding a named attribute or maths result into that socket.
      </p>
      <p>
        In this tree, the grid points are raised to Z = 5 m by{" "}
        <code>SetPosition</code> before reaching Raycast.  Because Raycast
        evaluates Source Position as a field <em>in the context of the
        geometry flowing through the modifier</em>, it reads the already-raised
        positions without any extra wiring.
      </p>

      <h2>Hit Normal and AlignEulerToVector</h2>
      <p>
        The Hit Normal from Raycast is the face normal at the struck point —
        un-averaged, matching the flat-shaded face orientation.  Feeding it
        into{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
          className={lk}
        >
          smooth-shaded meshes
        </Link>
        {" "}(via Smooth by Angle) would give interpolated normals; for a
        terrain made of flat triangles the raw face normal is exactly what
        you want because it represents the actual tilt of the surface patch.
      </p>
      <p>
        <code>FunctionNodeAlignEulerToVector</code> rotates a base Euler so
        that the chosen local axis points along the supplied vector.  With
        <code>axis = 'Z'</code> and no base rotation, the stamp&rsquo;s local
        +Z stands perpendicular to the struck terrain face — so the hex lies
        flat on the slope regardless of which direction that slope faces.
      </p>

      <h2>Slope gating and the cosine threshold</h2>
      <p>
        The slope cosine is <code>dot(hit_normal, (0,&thinsp;0,&thinsp;1))</code>{" "}
        — it equals 1.0 on a perfectly flat surface and 0.0 on a vertical
        cliff.  The threshold of 0.35 corresponds to approximately 70°, which
        is the steepest angle a hex decal can plausibly sit without looking
        absurd.  Below 0.35, a{" "}
        <code>FunctionNodeCompare (LESS_THAN)</code> returns True and{" "}
        <code>DeleteGeometry</code> removes the point.
      </p>
      <p>
        The same mapped slope value drives the XY scale of the stamp (via
        MapRange → CombineXYZ → InstanceOnPoints.Scale): near-flat stamps
        are full size; stamps near the threshold shrink.  This creates a
        natural visual gradient at the treeline where terrain transitions
        from plateau to hillside.
      </p>

      <h2>Hit Index and attribute transfer</h2>
      <p>
        Raycast also outputs <strong>Hit Index</strong> — the face index on
        the target mesh where the ray landed.  You can feed this into{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-field-at-index-edge-tangent-flow-map"
          className={lk}
        >
          Field at Index
        </Link>
        {" "}to read any named attribute stored on the terrain&rsquo;s faces —
        terrain type, biome colour, wetness — and transfer it to each stamp.
        This is the canonical GN pattern for decal-inherits-surface-attribute:
        Raycast gives the face index; Field at Index reads the face data at
        that index; StoreNamedAttribute writes it onto the stamp point.
      </p>
      <p>
        See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces
        </Link>
        {" "}tutorial — scattering is a natural predecessor: Distribute Points
        on Faces produces an initial scatter on a reference mesh, then Raycast
        can re-project that scatter onto a <em>different</em> target surface.
      </p>

      <h2>Exporting the stamp_col attribute</h2>
      <p>
        The <code>stamp_col</code> attribute is stored as{" "}
        <code>FLOAT_COLOR</code> on the <code>POINT</code> domain.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute → material bridge
        </Link>
        {" "}pattern applies here: the RC_StampMat material reads it via a
        ShaderNodeAttribute node (<code>attribute_type = 'GEOMETRY'</code>,{" "}
        <code>attribute_name = &quot;stamp_col&quot;</code>) and routes it to
        the Principled BSDF Base Colour input.  When exported with
        <code>export_attributes=True, export_colors=True</code>, it lands in
        the GLB as the <code>COLOR_0</code> accessor and reads in Three.js via{" "}
        <code>MeshBasicMaterial({`{ vertexColors: true }`})</code>.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>All stamps at origin (Z = 0)</strong> — SetPosition is
          wired to the <em>wrong</em> Offset socket instead of Position.
          Offset <em>adds</em> to the current position; Position{" "}
          <em>replaces</em> it.  For hit snapping, wire Hit Position to{" "}
          <strong>Position</strong>, not Offset.
        </li>
        <li>
          <strong>Stamps rotated randomly (not terrain-following)</strong> —
          AlignEulerToVector is using <code>axis = 'X'</code> or{" "}
          <code>'Y'</code> instead of <code>'Z'</code>.  The stamp&rsquo;s
          local Z must align to the face normal for it to lie flat on the slope.
        </li>
        <li>
          <strong>All candidates survive even on steep cliff walls</strong> —
          the FunctionNodeCompare data_type is set to <code>VECTOR</code>
          instead of <code>FLOAT</code>.  The dot product from
          ShaderNodeVectorMath(DOT_PRODUCT) outputs a Float; ensure
          <code>data_type = &apos;FLOAT&apos;</code> on Compare.
        </li>
        <li>
          <strong>stamp_col missing in Three.js</strong> — export called
          without <code>export_attributes=True</code> and{" "}
          <code>export_colors=True</code>.  Both flags are required.
        </li>
        <li>
          <strong>Raycast sees no hits (Is Hit always False)</strong> — the
          terrain and stamp object may share the same GN modifier rather than
          being separate objects.  Raycast requires a distinct{" "}
          <em>object</em> as its Target Geometry source (ObjectInfo).  Keep
          RC_Terrain as a plain mesh object; RC_Stamps carries the GN modifier.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/raycast.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Blender Manual — Raycast node
          </a>
          {" "}· CC-BY-SA 4.0 · Blender Foundation
        </li>
        <li>
          <a
            href="https://github.com/polygonrunway/blender-geometry-nodes"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            polygonrunway/blender-geometry-nodes-tutorials
          </a>
          {" "}· MIT · Polygon Runway.  Related:{" "}
          <a
            href="https://github.com/polygonrunway/blender-node-groups"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            blender-node-groups
          </a>
          {" "}(reusable GN presets, same licence).
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            KhronosGroup/glTF-Blender-IO
          </a>
          {" "}· Apache-2.0 · Khronos Group — the glTF exporter that powers
          the Blender GLB pipeline and propagates vertex attributes to the
          exported file.
        </li>
      </ul>
    </>
  );
}

const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-raycast-terrain-decal-projection",
    difficulty: "intermediate",
    time: "one sitting (45–60 minutes)",
    goal:
      "Project a grid of hexagonal stamp decals downward onto irregular terrain using Raycast, orient each stamp to the terrain face normal, gate steep slopes, and export a WebXR GLB with slope-coded vertex colour.",
    steps: [
      {
        title: "Create the terrain",
        body: "bmesh.ops.create_grid(x_segments=12, y_segments=12, size=4.0) → a 13×13 vertex flat grid. Loop over bm.verts and displace Z with three overlapping sine waves: z = 0.45*sin(x*0.9)*cos(y*0.7) + 0.28*sin(x*1.8)*sin(y*2.1) + 0.12*cos(x*3.5)*sin(y*3.0), multiplied by DISPLACE_SCALE=0.80. bm.to_mesh(me), link to scene as RC_Terrain. No modifier stack — Raycast needs a plain evaluated mesh.",
      },
      {
        title: "Stamp object and GN modifier",
        body: "Create an empty mesh RC_Stamps. Add a Nodes modifier (type='NODES'). Build HS_RC_TerrainDecal node group (GeometryNodeTree). All geometry emerges from the GN tree; the base mesh stays empty. Add materials now so the GN tree can reference stamp_ob.data.materials[0] for the attribute-driven material.",
      },
      {
        title: "Grid and raise",
        body: "GeometryNodeMeshGrid(Size X/Y=7.0, Vertices X/Y=15) → 225 candidate points in the XY plane at Z=0. GeometryNodeSetPosition(Offset=CombineXYZ(0, 0, GRID_HEIGHT=5.0)) raises all points to the fire height. No link to Source Position on Raycast — it defaults to InputPosition (already raised).",
      },
      {
        title: "Raycast and delete misses",
        body: "GeometryNodeObjectInfo(RC_Terrain, ORIGINAL) → Target Geometry. GeometryNodeRaycast(Target=ObjectInfo.Geometry, Ray Direction=CombineXYZ(0,0,-1), Ray Length=20.0). FunctionNodeBooleanMath(NOT, Is Hit) → GeometryNodeDeleteGeometry(domain=POINT, mode=ALL). This removes candidates that fired off the terrain edge.",
      },
      {
        title: "Snap to terrain surface",
        body: "GeometryNodeSetPosition(Position=ray.Hit_Position). Unlike the raise step, wire Hit Position to the Position socket (not Offset) — Position replaces the coordinate entirely; Offset adds to it. After this step, every surviving point sits at the exact terrain surface.",
      },
      {
        title: "Slope filter and scale",
        body: "ShaderNodeVectorMath(DOT_PRODUCT, hit_normal, CombineXYZ(0,0,1)) → slope_cos (1.0=flat, 0.0=vertical). FunctionNodeCompare(FLOAT, LESS_THAN, B=0.35) → GeometryNodeDeleteGeometry(steep). ShaderNodeMapRange(slope_cos, [0.35,1.0]→[0.40,1.00]) → CombineXYZ(X=t, Y=t, Z=1.0) → InstanceOnPoints.Scale. Leaving Z=1.0 prevents scaling the hex depth.",
      },
      {
        title: "Colour ramp and attribute store",
        body: "ShaderNodeValToRGB: element 0 position=0.0 red (0.82,0.08,0.05), element 1 position=1.0 green (0.05,0.75,0.15), new element at 0.5 amber (0.95,0.58,0.05). Feed MapRange.Result to Fac. GeometryNodeStoreNamedAttribute(Name='stamp_col', data_type=FLOAT_COLOR, domain=POINT) feeds the colour into the GLB COLOR_0 accessor.",
      },
      {
        title: "Orient and instance hex stamps",
        body: "FunctionNodeAlignEulerToVector(axis='Z', Factor=1.0, Vector=ray.Hit_Normal) → Rotation. GeometryNodeMeshCylinder(vertices=6, fill_type=NGON, Radius=0.20, Depth=0.05) → Instance. GeometryNodeInstanceOnPoints(Points=geometry, Instance=hex, Rotation=align.Rotation, Scale=cscale.Vector). GeometryNodeRealizeInstances → GroupOutput. RealizeInstances is mandatory before GLB export.",
      },
      {
        title: "Save and export GLB",
        body: "bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND). bpy.ops.export_scene.gltf(export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP', export_yup=True, export_attributes=True, export_colors=True). export_apply=True is required — without it the GN modifier is not evaluated and the GLB contains an empty mesh.",
      },
    ],
    troubleshooting: [
      {
        symptom: "All stamps sit at Z=0 instead of on the terrain",
        cause:
          "Hit Position wired to Offset instead of Position on the snap SetPosition node",
        fix: "Wire ray.Hit_Position to SetPosition.Position (not Offset). Position replaces the coordinate; Offset adds to the current position — at Z=5 the Offset path would leave stamps 5 m above the hit point.",
      },
      {
        symptom: "Stamps ignore terrain slope — all stand perfectly vertical",
        cause:
          "AlignEulerToVector axis is 'X' or 'Y' instead of 'Z'",
        fix: "Set align.axis = 'Z'. The stamp mesh is authored with +Z up; aligning +Z to Hit Normal makes it lie flat on the slope.",
      },
      {
        symptom: "All candidates survive — steep cliff stamps present",
        cause:
          "FunctionNodeCompare data_type is VECTOR instead of FLOAT",
        fix: "cmp.data_type = 'FLOAT'. VectorMath DOT_PRODUCT emits its result from the Value output (Float socket); Compare expects a Float input when data_type is FLOAT.",
      },
      {
        symptom: "Raycast returns Is Hit = False for everything",
        cause:
          "RC_Terrain and RC_Stamps share the same object — Raycast cannot intersect the object it is running on",
        fix: "Ensure RC_Terrain is a separate mesh object with no GN modifier. RC_Stamps carries the GN modifier and references RC_Terrain via ObjectInfo.",
      },
      {
        symptom: "stamp_col absent from Three.js geometry attributes",
        cause:
          "GLB exported without export_attributes=True or export_colors=True",
        fix: "Add both flags. Inspect the result with THREE.GLTFLoader — look for geometry.attributes.color in the console.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-raycast-terrain-decal-projection",
    title:
      "GN Raycast — Terrain Decal Projection: Surface-Following Stamps with Normal Alignment (Blender 5.1)",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Use GeometryNodeRaycast to fire downward rays from a flat stamp grid onto an irregular sine-wave terrain, snap each hit to the surface via Hit Position, orient it with AlignEulerToVector on the Hit Normal, gate steep slopes with a cosine threshold, and export a colour-coded WebXR GLB. Contrasts Raycast with Sample Nearest Surface and explains the implicit Source Position field.",
    Body: GnRaycastTerrainDecalProjectionBody,
  },
);

export { entry };
