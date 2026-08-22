"""
Holoflow Studio — Blueprint
Python bmesh.ops.find_doubles + weld_verts + recalc_face_normals + holes_fill
— Merge-by-Distance, Winding Repair & Hole Fill: Faceted Gem Pendant Integrity Pipeline
Blender 5.1  |  CC0 1.0 Universal

PURPOSE
-------
Meshes from photogrammetry, CAD translation (STEP → OBJ/FBX), and
kit-bash join operations frequently carry three defects that silently
corrupt WebXR GLBs:

  1. Seam duplicates    — twin vertices stacked within ε at join seams.
                          Draco compression does NOT merge them; the seam
                          shows as a visible crack under environment lighting.
  2. Flipped normals    — one sub-piece imported with inverted winding.
                          EEVEE backface-culling hides it in Blender; the
                          WebXR renderer makes it invisible from ALL angles.
  3. Open holes         — boundary loops where the boolean join left no cap.
                          glTF validators flag non-manifold geometry; some
                          runtimes silently discard the entire primitive.

This blueprint exposes the pure-bmesh integrity pipeline — NO bpy.ops,
NO context override, runs headless:

  bmesh.ops.find_doubles  →  bmesh.ops.weld_verts   (seam weld)
  bmesh.ops.recalc_face_normals                      (winding repair)
  bmesh.ops.holes_fill                               (hole closure)

Studio asset: a faceted teardrop gem pendant crown. The body starts broken
(duplicated equator verts, flipped pavilion-base normals, open table hole).
The pipeline delivers a watertight, outward-wound mesh ready for GLB export.

OUTSIDE SOURCES
---------------
  Blender 5.1 Python API — bmesh.ops module
    CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/api/5.1/bmesh.ops.html
    Siblings: blender/blender · blender-addons · blender-manual

  KhronosGroup/glTF 2.0 Specification (§ Meshes / Non-manifold note)
    Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc
    Siblings: glTF-Blender-IO · glTF-Sample-Models · glTF-Sample-Assets
"""

import bpy, bmesh, math
from mathutils import Vector

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
FACETS        = 12      # vertices in each horizontal ring
UPPER_LVLS    = 3       # rings crown → table rim (table left open = hole)
LOWER_LVLS    = 4       # rings pavilion → culet point
EQUATOR_R     = 0.40    # radius at widest ring (m)
WELD_DIST     = 1e-4    # merge-by-distance threshold (0.1 mm)
HOLE_SIDES    = 4       # max polygon sides for holes_fill cap faces
EXPORT_PATH   = "//hf_gem_pendant.glb"
OBJ_NAME      = "hf_gem_pendant"

# ─── SCENE SETUP ──────────────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

bm = bmesh.new()

def make_ring(z: float, r: float) -> list:
    """Return FACETS new BMVerts forming a horizontal circle at height z, radius r."""
    verts = []
    for i in range(FACETS):
        a = 2.0 * math.pi * i / FACETS
        verts.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
    return verts

# ─── UPPER CROWN (equator → table) ────────────────────────────────────────────
upper_rings = []
for lvl in range(UPPER_LVLS + 1):
    t = lvl / UPPER_LVLS
    upper_rings.append(make_ring(z=t * 0.25, r=EQUATOR_R * (1.0 - t * 0.85)))

# ─── LOWER PAVILION — duplicate the equator ring to simulate an import seam ──
# A real join operation (Object → Join in Blender, or two-piece OBJ import)
# produces an equator with 2 × FACETS vertices at the same XYZ.  find_doubles
# catches them; weld_verts eliminates the duplicate layer.
equator_dupe = [bm.verts.new(v.co.copy()) for v in upper_rings[0]]

lower_rings = [equator_dupe]
for lvl in range(1, LOWER_LVLS + 1):
    t = lvl / LOWER_LVLS
    lower_rings.append(make_ring(z=-t * 0.35, r=EQUATOR_R * (1.0 - t)))

culet = bm.verts.new((0.0, 0.0, -0.35))  # bottom tip

# ─── UPPER FACES (crown quads) ────────────────────────────────────────────────
for lvl in range(UPPER_LVLS):
    lo, hi = upper_rings[lvl], upper_rings[lvl + 1]
    for i in range(FACETS):
        j = (i + 1) % FACETS
        bm.faces.new([lo[i], lo[j], hi[j], hi[i]])
# NOTE: table (upper_rings[-1] ring) is left without a cap face — open hole.

# ─── LOWER FACES — ring 0 wound BACKWARDS to simulate flipped-normal import ──
# This mirrors a common failure mode: a bottom half imported from a different
# DCC tool (Maya, Cinema4D) with Z-up → Y-up confusion inverts the winding.
for lvl in range(LOWER_LVLS - 1):
    lo, hi = lower_rings[lvl], lower_rings[lvl + 1]
    for i in range(FACETS):
        j = (i + 1) % FACETS
        if lvl == 0:
            # INTENTIONALLY REVERSED — simulates the import corruption
            bm.faces.new([lo[j], lo[i], hi[i], hi[j]])
        else:
            bm.faces.new([lo[i], lo[j], hi[j], hi[i]])

# Tris to culet
for i in range(FACETS):
    j = (i + 1) % FACETS
    bm.faces.new([lower_rings[-1][i], culet, lower_rings[-1][j]])

bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.faces.ensure_lookup_table()

# ─── INTEGRITY PIPELINE ───────────────────────────────────────────────────────

# STEP 1 — find_doubles → weld_verts  (Merge by Distance)
# find_doubles returns {'targetmap': {src: tgt}} for all pairs within dist.
# It does NOT merge.  weld_verts consumes the map and collapses each pair.
# keep_verts=[] lets the operator choose (lower-index vertex wins).
ret = bmesh.ops.find_doubles(bm, verts=bm.verts[:], keep_verts=[], dist=WELD_DIST)
if ret['targetmap']:
    bmesh.ops.weld_verts(bm, targetmap=ret['targetmap'])

# After any weld, element indices are remapped — refresh lookup tables before
# accessing bm.verts[i], bm.edges[i], or bm.faces[i] by index.
bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.faces.ensure_lookup_table()

# STEP 2 — recalc_face_normals  (outward winding flood-fill)
# Computes the volume centroid and flips any face whose normal points inward.
# Call AFTER weld: a seam with duplicate verts creates an ambiguous boundary
# that derails the flood-fill, producing a patchwork of in/out normals.
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

# STEP 3 — holes_fill  (cap open boundary loops)
# Collects boundary edges (one adjacent face only) then fills each loop.
# sides=4 → cap with quads where the loop vertex count allows; falls back
# to triangles for prime-count or irregular loops.
boundary_edges = [e for e in bm.edges if e.is_boundary]
if boundary_edges:
    bmesh.ops.holes_fill(bm, edges=boundary_edges, sides=HOLE_SIDES)

bm.normal_update()
for f in bm.faces:
    f.smooth = False        # flat-faceted shading: each face keeps its own normal

# ─── MESH + MATERIAL ──────────────────────────────────────────────────────────
me = bpy.data.meshes.new(OBJ_NAME)
ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()

mat = bpy.data.materials.new("gem_crystal")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value           = (0.6, 0.85, 1.0, 1.0)
bsdf.inputs["Roughness"].default_value            = 0.05
bsdf.inputs["IOR"].default_value                  = 2.4   # diamond IOR
bsdf.inputs["Transmission Weight"].default_value  = 0.9
me.materials.append(mat)

# ─── GLB EXPORT ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath        = EXPORT_PATH,
    export_format   = 'GLB',
    use_selection   = True,
    export_apply    = True,
    export_normals  = True,
    export_yup      = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
)

print(f"[holoflow] {EXPORT_PATH}")
print(f"[holoflow] {len(me.vertices)} verts · {len(me.polygons)} faces")
