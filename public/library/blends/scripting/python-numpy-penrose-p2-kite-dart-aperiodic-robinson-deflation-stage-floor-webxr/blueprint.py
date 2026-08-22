"""
Penrose P2 Kite-Dart Tiling — Robinson Triangle Deflation  (Blender 5.1)
=========================================================================
Technique: the P2 tiling is Penrose's original (1974) aperiodic pair — a
KITE (convex, angles 72-72-72-144°) and a DART (non-convex, angles
36-72-36-216°).  Both tiles have sides in the golden ratio φ = (1+√5)/2.
The same Robinson triangle deflation used for P3 rhombuses generates P2
when triangles are re-paired via apex-matching rather than base-matching:

  Two golden triangles  (36-72-72, type 0) sharing a φ-edge apex-first  → KITE
  Two golden gnomons   (36-36-108, type 1) sharing a 1-edge apex-first  → DART

WHY different pairing: in P3 a rhombus is two same-type triangles joined at
their base; in P2 a kite is two type-0 triangles joined at the kite's axis
(the shared φ-edge from the common 36° apex to the common base vertex), and
a dart is two type-1 gnomons joined at the dart's axis (the shared 1-edge
from the common 108° apex to the common base vertex).  Swapping the pairing
rule is sufficient to convert the whole algorithm from P3 to P2.

Sources
-------
Penrose R (1974) Role of Aesthetics in Pure and Applied Mathematical Research.
  Bull. Inst. Math. Appl. 10:266–271. Public domain (pre-1978 US publication).
NumPy Developers. NumPy 1.26 User Guide. BSD-3-Clause. https://numpy.org/
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
DEFLATION_STEPS = 5           # 5 → ~380 tiles inside DISC_RADIUS; 6 → ~1 500
DISC_RADIUS     = 2.5         # clip radius (Blender units ≈ metres)
SLAB_KITE       = 0.055       # kite extrusion height (m)
SLAB_DART       = 0.035       # dart extrusion height (m) — slightly recessed
INSET           = 0.940       # shrink each tile toward centroid (1 = no gap)
COLOUR_KITE     = (0.86, 0.64, 0.12, 1.0)   # warm amber-gold
COLOUR_DART     = (0.55, 0.08, 0.14, 1.0)   # deep crimson
OBJ_NAME        = "penrose_p2_floor"
EXPORT_PATH     = "//penrose_p2_floor.glb"

phi = (1.0 + 5.0 ** 0.5) / 2.0          # golden ratio ≈ 1.61803

# ─── Step 1: Robinson Triangle Deflation ─────────────────────────────────────
# Triangle representation: (kind, A, B, C) with complex-plane vertex coords.
#   kind 0 → golden triangle  36-72-72: apex A, |AB|=|AC|=φ, |BC|=1
#   kind 1 → golden gnomon   36-36-108: apex A, |AB|=|AC|=1, |BC|=φ
# Deflation rules are IDENTICAL to P3; only the downstream pairing differs.
# Scale factor per step: 1/φ.

def _deflate(tris):
    """One Robinson deflation — tiles shrink by 1/φ."""
    out = []
    for (k, A, B, C) in tris:
        if k == 0:                           # golden triangle
            P = A + (B - A) / phi            # divides AB at distance 1 from A
            out += [(0, C, P, B),            # smaller golden triangle
                    (1, P, C, A)]            # golden gnomon
        else:                                # golden gnomon
            Q = B + (A - B) / phi            # divides BA at distance 1/φ from B
            R = B + (C - B) / phi            # divides BC at distance 1/φ from B
            out += [(1, R, C, A),            # gnomon — long limb
                    (1, Q, R, B),            # gnomon — short stub
                    (0, R, Q, A)]            # golden triangle inserted at fold
    return out


def build_triangles():
    """Sun seed: 10 golden triangles in a star, then deflate."""
    tris = []
    for i in range(10):
        B = np.exp(1j * (2 * i + 1) * np.pi / 10)
        C = np.exp(1j * (2 * i - 1) * np.pi / 10)
        if i % 2 == 0:
            B, C = C, B                      # alternate winding → 5-fold symmetry
        tris.append((0, 0 + 0j, B, C))
    for _ in range(DEFLATION_STEPS):
        tris = _deflate(tris)
    return tris


# ─── Step 2: Pair Triangles into Kites and Darts ─────────────────────────────
# P2 pairing rule: use ORDERED (apex, other) edge keys so only triangles
# sharing the same apex vertex at the same endpoint match each other.

def _rkey(z):
    """Stable rounding key for a complex vertex coordinate."""
    return (round(z.real, 7), round(z.imag, 7))


def pair_tiles(tris):
    """
    Match same-type triangles at their apex-to-base edges → kites and darts.

    For type-0 (golden triangle, apex A, long sides AB and AC):
      Two type-0 triangles sharing edge A→B (apex A at the same vertex) form a
      KITE.  The kite quadrilateral is (C₁, A, C₂, B):
        vertex A  → 36°+36° = 72°  (kite head / convex tip)
        vertex B  → 72°+72° = 144° (kite tail / wide base)
        vertices C₁, C₂ → 72° each (kite wings).

    For type-1 (golden gnomon, apex A, short sides AB and AC):
      Two type-1 triangles sharing edge A→B (apex A at same vertex) form a
      DART.  The dart quadrilateral is (C₁, A, C₂, B):
        vertex A  → 108°+108° = 216° (dart concave tail, reflex)
        vertex B  → 36°+36°  = 72°  (dart head / beak)
        vertices C₁, C₂ → 36° each (dart wings).

    WHY ordered key: using (apex_key, other_key) instead of frozenset ensures
    we only pair triangles where BOTH have their apex at the same endpoint —
    the geometric criterion for a valid kite or dart half.
    """
    n = len(tris)
    used = [False] * n

    kite_shelf = {}   # ordered edge (apex, other) → (idx, remaining_vertex)
    dart_shelf = {}

    for i, (k, A, B, C) in enumerate(tris):
        ak = _rkey(A)                        # apex key
        if k == 0:
            kite_shelf.setdefault((_rkey(A), _rkey(B)), []).append((i, C))
            kite_shelf.setdefault((_rkey(A), _rkey(C)), []).append((i, B))
        else:
            dart_shelf.setdefault((_rkey(A), _rkey(B)), []).append((i, C))
            dart_shelf.setdefault((_rkey(A), _rkey(C)), []).append((i, B))

    kites = []
    darts = []

    def _consume(shelf, out, label):
        for key, entries in shelf.items():
            paired = [e for e in entries if not used[e[0]]]
            if len(paired) < 2:
                continue
            i1, other1 = paired[0]
            i2, other2 = paired[1]
            if used[i1] or used[i2]:
                continue
            # apex = tris[i1][1], shared_base = complex vertex at key[1]
            apex     = tris[i1][1]
            base_key = key[1]
            # reconstruct base vertex from the shelf key (roundtrip-safe)
            base_v   = complex(base_key[0], base_key[1])
            out.append((label, other1, apex, other2, base_v))
            used[i1] = True
            used[i2] = True

    _consume(kite_shelf, kites, 'kite')
    _consume(dart_shelf, darts, 'dart')
    return kites, darts


# ─── Step 3: Blender Mesh ────────────────────────────────────────────────────

def _c2v(z, z_coord=0.0):
    return Vector((float(z.real), float(z.imag), z_coord))


def _inset_quad(pts):
    """Shrink four Vector points toward their centroid by INSET."""
    cx = sum(p.x for p in pts) / 4
    cy = sum(p.y for p in pts) / 4
    return [Vector((cx + INSET * (p.x - cx),
                    cy + INSET * (p.y - cy),
                    p.z)) for p in pts]


def build_mesh(kites, darts):
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    col_layer = bm.loops.layers.color.new("TileType")

    def _add_quad(v0, v1, v2, v3, h, colour):
        centroid = (v0 + v1 + v2 + v3) / 4
        if abs(centroid) > DISC_RADIUS:
            return
        bot_raw = [_c2v(v0), _c2v(v1), _c2v(v2), _c2v(v3)]
        bot = _inset_quad(bot_raw)
        top = [Vector((p.x, p.y, h)) for p in bot]
        bv_b = [bm.verts.new(v) for v in bot]
        bv_t = [bm.verts.new(v) for v in top]
        for face_verts in [
            bv_t,                                          # top face
            list(reversed(bv_b)),                          # bottom face (flipped)
        ]:
            f = bm.faces.new(face_verts)
            for loop in f.loops:
                loop[col_layer] = colour
        n = 4
        for i in range(n):                                 # four side faces
            j = (i + 1) % n
            f = bm.faces.new([bv_b[i], bv_b[j], bv_t[j], bv_t[i]])
            for loop in f.loops:
                loop[col_layer] = colour

    # Kite vertices order: (wing₁, head, wing₂, tail) → correct winding
    for (_, w1, head, w2, tail) in kites:
        _add_quad(w1, head, w2, tail, SLAB_KITE, COLOUR_KITE)

    # Dart vertices order: (wing₁, concave_tail, wing₂, head) — note reflex at tail
    # Dart is non-convex; build it via the same quad but colour distinguishes it
    for (_, w1, ctail, w2, head) in darts:
        _add_quad(w1, ctail, w2, head, SLAB_DART, COLOUR_DART)

    bm.to_mesh(me)
    bm.free()
    me.update()
    return me


def setup_object(me):
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    mat = bpy.data.materials.new("PenroseP2Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "TileType"
    attr.location = (-400, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.55
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.location = (-100, 0)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.append(mat)

    # Tag for holoflow exporter
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"

    return obj


def export_glb(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_colors=True,
    )
    print(f"Exported → {EXPORT_PATH}")


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Clean scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    tris          = build_triangles()
    kites, darts  = pair_tiles(tris)
    print(f"Tiles: {len(kites)} kites  {len(darts)} darts  "
          f"(ratio kite/dart = {len(kites)/(len(darts)+1e-9):.3f}, "
          f"expected ≈ φ = {phi:.3f})")

    me  = build_mesh(kites, darts)
    obj = setup_object(me)
    export_glb(obj)
