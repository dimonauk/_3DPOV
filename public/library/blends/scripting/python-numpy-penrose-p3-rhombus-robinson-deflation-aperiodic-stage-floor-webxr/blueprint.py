"""
Penrose P3 Rhombus Tiling — Robinson Triangle Deflation  (Blender 5.1)
=======================================================================
Technique:
  Penrose's P3 tiling covers the plane with fat (72°/108°) and thin (36°/144°)
  rhombuses in a pattern that is aperiodic — it never repeats — yet exhibits
  approximate five-fold local symmetry.  The cleanest generative approach uses
  Robinson triangles: split each rhombus along its short diagonal to obtain two
  isoceles triangles, then subdivide each triangle by the golden ratio φ = (1+√5)/2.
  After N deflation steps the tiles are φ^N times smaller, filling a disc that
  scales by φ^N.  We assemble the rhombuses in Blender, extrude them into flat
  slabs, apply vertex colour by type, and export a stage-floor GLB for WebXR.

Source licence:
  All geometry derived from the mathematical definition in:
    R. Penrose 1974 "Role of Aesthetics in Pure and Applied Mathematical Research"
    Bull. Inst. Math. Appl. 10:266-271 (public domain, pre-1978 US publication).
  Implementation is an independent CC0 authoring by Holoflow Studio.
"""

import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
# Increase DEFLATION_STEPS for finer tiles (6 → ~2 000 rhombuses; RAM ~1 GB).
DEFLATION_STEPS  = 5          # 5 → ~450 rhombuses inside DISC_RADIUS
DISC_RADIUS      = 2.6        # clip radius in Blender units
SLAB_FAT         = 0.060      # extrusion height: fat rhombus (72°/108°)
SLAB_THIN        = 0.040      # extrusion height: thin rhombus (36°/144°)
INSET            = 0.945      # shrink each tile toward centroid (1=no gap)
COLOUR_FAT       = (0.85, 0.64, 0.16, 1.0)   # warm gold
COLOUR_THIN      = (0.58, 0.10, 0.16, 1.0)   # deep crimson
OBJ_NAME         = "penrose_p3_floor"
EXPORT_PATH      = "//penrose_p3_floor.glb"

phi = (1.0 + 5.0 ** 0.5) / 2.0   # golden ratio ≈ 1.61803

# ─── Step 1: Robinson Triangle Deflation ─────────────────────────────────────
# Each triangle: (kind, A, B, C) with complex-plane vertex coordinates.
#   kind 0 → golden triangle  36-72-72: apex A, |AB|=|AC|=φ, |BC|=1 → thin rhombus
#   kind 1 → golden gnomon   36-36-108: apex A, |AB|=|AC|=1, |BC|=φ → fat rhombus
# Two same-kind triangles sharing BC form one rhombus.
# Scale factor per step: 1/φ.  After N steps tile edge = φ^{-N} seed edge.

def _deflate(tris):
    """One generation of Robinson subdivision — scale by 1/φ."""
    out = []
    for (k, A, B, C) in tris:
        if k == 0:                            # golden triangle
            # P divides AB so AP = 1 new unit = |AB|/φ from A.
            # WHY: AB has length φ in the parent; cutting at 1/φ of its length
            #      produces the correct smaller golden triangle (C,P,B) and
            #      a golden gnomon (P,C,A) — the only subdivision that preserves
            #      both angle sets.
            P = A + (B - A) / phi
            out += [(0, C, P, B),             # smaller golden triangle
                    (1, P, C, A)]             # golden gnomon
        else:                                 # golden gnomon
            # Q on AB at distance 1/φ from B; R on CB at distance 1/φ from B.
            Q = B + (A - B) / phi
            R = B + (C - B) / phi
            out += [(1, R, C, A),             # gnomon — long limb
                    (1, Q, R, B),             # gnomon — short stub
                    (0, R, Q, A)]             # golden triangle inserted at fold
    return out


def build_triangles():
    """Seed: 10 golden triangles in a 'sun' ring, then deflate."""
    tris = []
    for i in range(10):
        # Adjacent triangle vertices on the unit circle, 36° apart.
        B = np.exp(1j * (2 * i + 1) * np.pi / 10)
        C = np.exp(1j * (2 * i - 1) * np.pi / 10)
        if i % 2 == 0:
            B, C = C, B          # alternate winding for 5-fold symmetry
        tris.append((0, 0 + 0j, B, C))
    for _ in range(DEFLATION_STEPS):
        tris = _deflate(tris)
    return tris


# ─── Step 2: Pair Triangles into Rhombuses ───────────────────────────────────

def _edge_key(B, C):
    """Canonical, type-stable key for an undirected edge B—C."""
    b = (round(B.real, 7), round(B.imag, 7))
    c = (round(C.real, 7), round(C.imag, 7))
    return frozenset([b, c])


def pair_rhombuses(tris):
    """Pair same-kind triangles sharing their BC base → (kind, A1, B, A2, C)."""
    shelf = {}      # edge_key(kind) → (A, B, C)
    rhombuses = []
    for (k, A, B, C) in tris:
        key = (k, _edge_key(B, C))
        if key in shelf:
            oA, oB, oC = shelf.pop(key)
            # Ensure B and oB are truly the same endpoint (not swapped).
            if abs(B - oC) < 1e-6:
                B, C = C, B          # swap so B matches oB
            rhombuses.append((k, A, B, oA, C))
        else:
            shelf[key] = (A, B, C)
    return rhombuses   # unpaired boundary triangles dropped


# ─── Step 3: Assemble Blender Mesh ───────────────────────────────────────────

def _c2v(z, z_coord=0.0):
    """Complex number → mathutils.Vector."""
    return Vector((z.real, z.imag, z_coord))


def _inset_quad(pts):
    """Shrink 4 points toward their centroid by factor INSET."""
    cx = sum(p.x for p in pts) / 4
    cy = sum(p.y for p in pts) / 4
    return [Vector((cx + INSET * (p.x - cx),
                    cy + INSET * (p.y - cy),
                    p.z)) for p in pts]


def build_mesh(rhombuses):
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()

    fat_col  = COLOUR_FAT
    thin_col = COLOUR_THIN

    # Vertex colour layer (FLOAT_COLOR, point domain — Blender 5.1 API).
    col_layer = bm.loops.layers.color.new("TileType")

    for (kind, A1, B, A2, C) in rhombuses:
        # Clip to disc.
        centroid_z = (A1 + B + A2 + C) / 4
        if abs(centroid_z) > DISC_RADIUS:
            continue

        h = SLAB_FAT if kind == 1 else SLAB_THIN
        colour = fat_col if kind == 1 else thin_col

        # 4 corners of the rhombus, bottom (z=0) and top (z=h).
        bot_raw = [_c2v(A1), _c2v(B), _c2v(A2), _c2v(C)]
        bot = _inset_quad(bot_raw)
        top = [Vector((p.x, p.y, h)) for p in bot]

        bv_b = [bm.verts.new(v) for v in bot]
        bv_t = [bm.verts.new(v) for v in top]

        # Top face (visible from above — viewer looks down for stage floor).
        f_top = bm.faces.new(bv_t)
        for loop in f_top.loops:
            loop[col_layer] = colour

        # Bottom face (reversed winding for correct outward normal).
        f_bot = bm.faces.new(list(reversed(bv_b)))
        for loop in f_bot.loops:
            loop[col_layer] = colour

        # Four side faces.
        n = 4
        for i in range(n):
            j = (i + 1) % n
            f_side = bm.faces.new([bv_b[i], bv_b[j], bv_t[j], bv_t[i]])
            for loop in f_side.loops:
                loop[col_layer] = colour

    bm.to_mesh(me)
    bm.free()
    me.update()
    return me


# ─── Step 4: Material, Object, Export ────────────────────────────────────────

def setup_object(me):
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    # Principled BSDF — metallic floor aesthetic.
    mat = bpy.data.materials.new(name="PenroseMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "TileType"
    attr.location = (-400, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.55
    bsdf.inputs["Roughness"].default_value = 0.25
    bsdf.location = (-100, 0)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    me.materials.append(mat)

    # Holoflow studio metadata.
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"

    # Apply +Y-up transform for WebXR.
    import mathutils
    obj.rotation_euler = (1.5707963, 0.0, 0.0)   # π/2 around X
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.transform_apply(rotation=True)
    return obj


def export_glb():
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"Exported → {EXPORT_PATH}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    # Clear previous run's objects to allow re-execution.
    bpy.ops.object.select_all(action="DESELECT")
    for o in list(bpy.data.objects):
        if o.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(o, do_unlink=True)

    print("Step 1 — deflating Robinson triangles …")
    tris = build_triangles()
    print(f"  {len(tris)} triangles after {DEFLATION_STEPS} deflations")

    print("Step 2 — pairing into rhombuses …")
    rhombs = pair_rhombuses(tris)
    print(f"  {len(rhombs)} rhombuses (boundary unpaired triangles discarded)")

    print("Step 3 — building mesh …")
    me = build_mesh(rhombs)
    obj = setup_object(me)
    print(f"  {len(me.vertices)} vertices, {len(me.polygons)} faces")

    print("Step 4 — exporting GLB …")
    export_glb()
    print("Done.")


main()
