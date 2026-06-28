import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every UV coordinate in Blender lives on a{" "}
        <strong>loop</strong>, not a vertex. A loop is a face&apos;s corner —
        the coupling between a specific vertex and a specific face. Two adjacent
        faces can share the same vertex but carry independent UV coordinates at
        that vertex, which is exactly what a UV seam is. The{" "}
        <code>bm.loops.layers.uv</code> layer collection is the API through
        which Python reads and writes those per-loop values. Accessing UVs via{" "}
        <code>bm.verts.layers</code> or via <code>mesh.uv_layers</code>{" "}
        directly is not wrong, but the bmesh route is the only one that lets you
        read and write in the same transaction without toggling Edit Mode.
      </p>

      <p>
        The core technique here is{" "}
        <strong>per-face planar projection</strong>. For each face, we build a
        local coordinate frame from the face normal — two vectors{" "}
        <code>local_x</code> and <code>local_y</code> that lie in the face
        plane — then project each loop&apos;s vertex position onto that plane
        via dot products. The resulting 2D coordinates are normalised to a 0-1
        square preserving aspect ratio, then written to{" "}
        <code>loop[uv_layer].uv</code>. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised"
          className={lk}
        >
          Smart UV Project operator
        </Link>
        , which groups nearby coplanar faces into shared islands: that grouping
        is correct for smooth-shaded objects where adjacent faces should share
        UV space, but for Holoflow&apos;s faceted cel-shaded assets it introduces
        seams exactly where the flat-shade normal split happens. The per-face
        approach guarantees each face is a self-contained island.
      </p>

      <p>
        The cross-product order for the local frame matters:{" "}
        <code>world_up × normal</code> gives the tangent vector (
        <code>local_x</code>), and <code>normal × local_x</code> gives the
        bitangent (<code>local_y</code>). Both are perpendicular to the normal
        and to each other — an orthonormal basis for the face plane. The
        fallback when <code>normal ≈ (0, 0, 1)</code> switches{" "}
        <code>world_up</code> to <code>(1, 0, 0)</code> to avoid a zero-length
        cross product. The resulting UVs may be rotated differently per face —
        that is acceptable for a flat-colour cel shader, and Pack Islands will
        arrange them efficiently regardless of individual rotation. The bmesh
        foundations in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          bmesh dodecahedron tutorial
        </Link>{" "}
        cover <code>bm.from_mesh</code>, <code>bm.to_mesh</code>, and the
        lookup-table requirement that applies here too.
      </p>

      <p>
        After per-face projection, all islands overlap at the 0-1 square —
        every island occupies exactly that square. The{" "}
        <code>bpy.ops.uv.pack_islands</code> operator bins them into a single
        atlas with no overlaps. The operator requires an{" "}
        <code>IMAGE_EDITOR</code> area in its poll context; the blueprint
        handles this by scanning <code>bpy.context.screen.areas</code> for an
        existing UV Editor, or temporarily converting a Properties area if none
        is open. After packing, verify the result with{" "}
        <code>print_uv_sample</code> — every loop UV should be in the [0, 1]
        range. The atlas produced here feeds directly into the pipeline shown in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter tutorial
        </Link>
        : the glTF exporter writes each UV layer as a <code>TEXCOORD</code>{" "}
        accessor, and Three.js maps it to the first UV channel automatically.
      </p>

      <p>
        For characters and props that require multiple UV channels — a
        lightmap UV2 alongside the albedo UV0 — the same pattern applies:
        create a second UV layer with a different name, repeat the projection
        and packing step, then pass both layers through{" "}
        <code>export_extra_texcoords=True</code> in the GLB exporter. The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-udim-multitile-vrm-character"
          className={lk}
        >
          UDIM Multitile tutorial
        </Link>{" "}
        covers the VRM-specific case where the UV layout spans across multiple
        1×1 UDIM tiles. Outside references:{" "}
        <a
          href="https://docs.blender.org/api/current/bmesh.types.html#bmesh.types.BMLayerCollection"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bmesh.types.BMLayerCollection — Blender Python API
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation; sibling:{" "}
        <a
          href="https://docs.blender.org/api/current/bmesh.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bmesh module reference
        </a>
        ) and the{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/geometries/CylinderGeometry.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Three.js CylinderGeometry UV generation
        </a>{" "}
        (MIT, Ricardo Cabello et al.; siblings:{" "}
        <a
          href="https://github.com/pmndrs/react-three-fiber"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          @react-three/fiber
        </a>
        ,{" "}
        <a
          href="https://github.com/pmndrs/drei"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          @react-three/drei
        </a>
        ) — the UV generation logic in CylinderGeometry is the canonical
        reference implementation for understanding how a runtime maps faces to
        UV space, which is what this tutorial inverts: we go mesh → UV rather
        than UV → mesh.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bmesh-uv-map-read-write-atlas-pack",
  title:
    "Python — bmesh UV Map: Per-Face Planar Projection & Atlas Pack (Blender 5.1)",
  date: "2026-06-28",
  kind: "tutorial",
  excerpt:
    "Read and write per-loop UV coordinates via bm.loops.layers.uv, build a " +
    "local coordinate frame from each face normal, project vertices into face " +
    "space to create one clean UV island per face, then pack all islands into " +
    "an atlas — the correct UV strategy for Holoflow's faceted cel-shaded WebXR meshes.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-bmesh-uv-map-read-write-atlas-pack/",
    time: "one focused hour",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Understands bmesh basics: bm.from_mesh, bm.to_mesh, BMFace, BMLoop",
      "Comfortable with mathutils.Vector — dot products and cross products",
      "Has run at least one bpy.ops UV projection (Smart UV Project or Unwrap)",
    ],
    steps: [
      {
        title: "Understand loops vs vertices in UV space",
        body: `In a bmesh, UV data lives on loops (bm.loops.layers.uv), not on vertices
(bm.verts.layers).  A loop is the coupling of one vertex to one face.  A
vertex shared by four faces has four loops, each of which can carry an
independent UV coordinate.

    # Inspect the layer stack
    bm = bmesh.new()
    bm.from_mesh(mesh)

    print(dir(bm.loops.layers))   # → uv, color, ...
    print(bm.loops.layers.uv[:])  # list of UV layer objects

    # Access the first (or create)
    uv_layer = bm.loops.layers.uv.verify()   # idempotent — always safe

verify() returns the first existing UV layer; if there are none, it creates one
named "UVMap".  Use .get("MyLayerName") if you need a specific named layer, and
.new("MyLayerName") to add a second channel (e.g. for lightmap UV2).`,
      },
      {
        title: "Read UV coordinates from all loops",
        body: `Reading is straightforward once you have the layer reference:

    for face in bm.faces:
        for loop in face.loops:
            uv = loop[uv_layer].uv   # mathutils.Vector(2)
            print(f"  {uv.x:.4f}  {uv.y:.4f}")

loop[uv_layer].uv returns a Vector(2) copy — mutating it in-place does NOT
update the mesh.  You must assign back:

    # Wrong — mutates the local copy only
    loop[uv_layer].uv.x = 0.5

    # Correct — assign a new Vector
    loop[uv_layer].uv = Vector((0.5, loop[uv_layer].uv.y))

After all assignments call bm.to_mesh(mesh) and mesh.update() to flush changes
back to Blender's internal data block.`,
      },
      {
        title: "Build the local coordinate frame for per-face projection",
        body: `Each face needs its own 2D coordinate system.  We derive it from face.normal:

    normal   = face.normal.copy()     # unit vector perpendicular to the face

    # Choose a world "up" not parallel to normal
    world_up = Vector((0.0, 0.0, 1.0))
    if abs(normal.dot(world_up)) > 0.999:   # near-parallel: switch up axis
        world_up = Vector((1.0, 0.0, 0.0))

    # Cross products produce two basis vectors lying IN the face plane
    local_x = world_up.cross(normal).normalized()   # tangent
    local_y  = normal.cross(local_x).normalized()    # bitangent

local_x and local_y are orthonormal and perpendicular to normal.  Projecting a
3D displacement vector v onto this basis gives 2D coordinates:

    u = v.dot(local_x)
    v = v.dot(local_y)

The dot product extracts the component of v along each axis — a pure geometric
projection with no trigonometry required.`,
      },
      {
        title: "Write per-face UVs — the full projection function",
        body: `With the local frame in hand, project every loop of the face:

    center = face.calc_center_median()

    raw = []
    for loop in face.loops:
        delta = loop.vert.co - center        # displacement from centroid
        raw.append(Vector((
            delta.dot(local_x),
            delta.dot(local_y),
        )))

    # Normalise to [0, 1] preserving aspect ratio
    min_u  = min(p.x for p in raw)
    max_u  = max(p.x for p in raw)
    min_v  = min(p.y for p in raw)
    max_v  = max(p.y for p in raw)
    scale  = max(max_u - min_u, max_v - min_v) or 1.0   # guard division by zero

    for loop, p in zip(face.loops, raw):
        loop[uv_layer].uv = Vector((
            (p.x - min_u) / scale,
            (p.y - min_v) / scale,
        ))

Using max(width, height) as the uniform scale preserves the face's true aspect
ratio: a long thin face becomes a long thin UV island, not a distorted square.
All faces share the same 0-1 square at this point — they stack.  Pack Islands
separates them in the next step.`,
      },
      {
        title: "Pack all islands into a single atlas",
        body: `After per-face projection every island occupies [0,1]² and they all overlap.
bpy.ops.uv.pack_islands redistributes them with no overlaps.

The operator needs an IMAGE_EDITOR area in its poll context.  Find one or
borrow a Properties area for the duration:

    def pack_islands(obj, margin=0.005):
        for area in bpy.context.screen.areas:
            if area.type == 'IMAGE_EDITOR':
                region = next(r for r in area.regions if r.type == 'WINDOW')
                with bpy.context.temp_override(area=area, region=region):
                    bpy.ops.object.mode_set(mode='EDIT')
                    bpy.ops.mesh.select_all(action='SELECT')
                    bpy.ops.uv.select_all(action='SELECT')
                    bpy.ops.uv.pack_islands(margin=margin, rotate=True, scale=True)
                    bpy.ops.object.mode_set(mode='OBJECT')
                return

        # No UV Editor open — temporarily convert another area
        area = bpy.context.screen.areas[0]
        old  = area.type
        area.type = 'IMAGE_EDITOR'
        try:
            region = next(r for r in area.regions if r.type == 'WINDOW')
            with bpy.context.temp_override(area=area, region=region):
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')
                bpy.ops.uv.select_all(action='SELECT')
                bpy.ops.uv.pack_islands(margin=margin, rotate=True, scale=True)
                bpy.ops.object.mode_set(mode='OBJECT')
        finally:
            area.type = old

margin=0.005 gives a half-texel gutter at 2K resolution — enough to prevent
bilinear filter bleed between adjacent islands without wasting atlas space.`,
      },
      {
        title: "Verify and export",
        body: `After packing, every loop UV should be inside [0, 1]:

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    uv_layer = bm.loops.layers.uv.get("UVMap")

    out_of_range = [
        (f.index, loop.index, loop[uv_layer].uv)
        for f in bm.faces
        for loop in f.loops
        if not (0.0 <= loop[uv_layer].uv.x <= 1.0 and 0.0 <= loop[uv_layer].uv.y <= 1.0)
    ]
    bm.free()

    if out_of_range:
        print(f"WARNING: {len(out_of_range)} loops outside 0-1 range")
    else:
        print("All UV coordinates in range — atlas clean.")

For GLB export the UV layer named "UVMap" becomes TEXCOORD_0 automatically.
A second layer named "UVMap.001" becomes TEXCOORD_1 (lightmap channel).`,
      },
    ],
    troubleshooting: [
      {
        symptom:
          "UVs assigned in Python show as stacked at the origin in the UV Editor",
        cause:
          "bm.to_mesh(mesh) was called but mesh.update() was not — Blender's display layer is stale.",
        fix: "Always call both: bm.to_mesh(obj.data) then obj.data.update(). The mesh.update() call flushes the internal dirty flag that triggers re-evaluation of the UV display data.",
      },
      {
        symptom:
          "AttributeError: 'BMLayerCollection' object has no attribute 'uv'",
        cause:
          "Accessing bm.verts.layers.uv instead of bm.loops.layers.uv. UV data is per-loop, not per-vertex.",
        fix: "Change to bm.loops.layers.uv.verify() and iterate face loops (for face in bm.faces: for loop in face.loops:) rather than iterating vertices.",
      },
      {
        symptom: "pack_islands operator raises RuntimeError: Operator bpy.ops.uv.pack_islands.poll() failed",
        cause:
          "No IMAGE_EDITOR area was found in bpy.context.screen.areas, and the area-hijack fallback failed to locate a region of type WINDOW.",
        fix: "Manually split the Blender window and set one panel to UV Editor before running the script, or use the area-conversion pattern: set area.type='IMAGE_EDITOR', call the operator inside temp_override, then restore area.type in a finally block.",
      },
      {
        symptom: "All UV islands are squares even when faces are rectangular triangles",
        cause:
          "Using separate scale factors for U and V (range_u and range_v independently) rather than a single uniform scale = max(range_u, range_v).",
        fix: "Replace the two-axis normalisation with scale = max(max_u - min_u, max_v - min_v). Dividing both U and V by the same value preserves the face's true aspect ratio.",
      },
    ],
  },
  base,
);
