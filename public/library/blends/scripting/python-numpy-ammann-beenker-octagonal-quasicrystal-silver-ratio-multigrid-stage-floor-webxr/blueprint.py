"""
Ammann-Beenker Octagonal Quasicrystal — De Bruijn Multigrid Dual (Blender 5.1)
================================================================================
Technique:
  The Ammann-Beenker tiling covers the plane aperiodically with two tiles —
  a unit square and a 45°/135° rhombus — under 8-fold (D₄) local symmetry.
  We use de Bruijn's multigrid-dual method: four families of parallel lines at
  angles 0°, 45°, 90°, 135° form a grid; each intersection of families j and k
  maps to one tile.  Tiles whose families are 90° apart are squares; 45° apart
  are rhombi.  The base vertex of each tile is computed from the de Bruijn
  "index formula" P = mⱼ·eⱼ + mₖ·eₖ + Σ_{l≠j,k} nₗ·eₗ, where nₗ is the
  ceiling of the intersection's projection onto family l, minus the grid offset.

Silver ratio: λ = 1 + √2 ≈ 2.414 is the inflation factor (as golden ratio φ
  is to Penrose P3).  Adjacent Ammann-Beenker vertices lie in the quasilattice
  Z[exp(iπ/4)] restricted to an octagonal acceptance window in "internal space."

Source licence:
  Mathematical construction from:
    Beenker FPM (1982) "Algebraic theory of non-periodic tilings by two simple
    building blocks: a square and a rhombus." TU Eindhoven EUT Report 82-WSK-04.
    (Public domain mathematical facts; independent CC0 implementation.)
    de Bruijn NG (1981) "Algebraic theory of Penrose's non-periodic tilings,"
    Indag. Math. 43: 39-66.  (Public domain method, extended here to 4 grids.)
  Holoflow Studio independent implementation released CC0.
"""

import bpy, bmesh, math
import numpy as np
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
N            = 8        # grid lines per family: range -N … +N
DISC_RADIUS  = 3.5      # clip tiles by centroid distance (Blender units)
SLAB_SQ      = 0.07     # extrusion height: square tiles
SLAB_RH      = 0.04     # extrusion height: rhombus tiles
INSET        = 0.935    # shrink each tile toward centroid (gap = 1 − INSET)
COL_SQUARE   = (0.18, 0.45, 0.82, 1.0)   # cobalt blue
COL_RHOMBUS  = (0.88, 0.56, 0.08, 1.0)   # amber-gold
OBJ_NAME     = "ammann_beenker_floor"
EXPORT_PATH  = "//ammann_beenker_floor.glb"

# ─── Quasilattice Basis ───────────────────────────────────────────────────────
# E[k] = exp(i·π·k/4) for k=0…3: four unit vectors at 0°,45°,90°,135°.
# GAMMA=0.5 for all families: uniform offset placing the origin at the centre
# of a tile face (not on any grid line), guaranteeing general position — no
# three lines ever meet at one point, which is the prerequisite for the dual
# construction to produce strict quadrilateral tiles.
GAMMA = 0.5
E = np.exp(1j * np.array([k * np.pi / 4.0 for k in range(4)]))

# ─── Step 1: De Bruijn Multigrid Dual ─────────────────────────────────────────

def _intersect(j, mj, k, mk):
    """Solve for z ∈ C at crossing of family-j line mj and family-k line mk.
    Line l at index m satisfies:  Re(z · conj(E[l])) = m + GAMMA.
    Returns None when lines are parallel (|j-k|=4, impossible in our 0..3 range).
    """
    cj = math.cos(j * math.pi / 4)
    sj = math.sin(j * math.pi / 4)
    ck = math.cos(k * math.pi / 4)
    sk = math.sin(k * math.pi / 4)
    det = cj * sk - sj * ck          # sin of angle between directions
    if abs(det) < 1e-9:
        return None
    rj = mj + GAMMA
    rk = mk + GAMMA
    x = (rj * sk - rk * sj) / det
    y = (cj * rk - ck * rj) / det
    return complex(x, y)


def generate_tiles():
    """Return list of (verts[4], is_square) for all tiles inside DISC_RADIUS.

    WHY this formula works (de Bruijn 1981):
      Each connected region of the multigrid gets integer coordinates (n₀…n₃),
      where nₗ = ceil( Re(z·conj(E[l])) − GAMMA ) for a test point z in that
      region.  At the intersection of families j and k, four regions meet; they
      share the same nₗ for l ∉ {j,k} (because no family-l line crosses through
      this intersection — general position).  The tiling vertex for region
      (n₀…n₃) sits at Σₗ nₗ·E[l].  The tile's four vertices are then:
        P, P+E[j], P+E[j]+E[k], P+E[k]    (P = Σₗ nₗ·E[l] with n_j=m_j, n_k=m_k)
      giving unit-length sides along E[j] and E[k] — correctly a square (90°)
      or rhombus (45°) depending on which pair of families crossed.
    """
    tiles = []
    rng = range(-N, N + 1)
    for j in range(4):
        for k in range(j + 1, 4):
            # Tile type depends on the angle between the two families.
            # |k−j| mod 4 == 2  →  families are perpendicular  →  SQUARE.
            # |k−j| mod 4 == 1  →  families are at 45°          →  RHOMBUS.
            is_sq = ((k - j) % 4 == 2)
            for mj in rng:
                for mk in rng:
                    z = _intersect(j, mj, k, mk)
                    if z is None:
                        continue
                    # Quick rejection: if the intersection itself is far out,
                    # the tile centroid (at most ~1.4 units away) can't be in disc.
                    if abs(z) > DISC_RADIUS + 2.0:
                        continue
                    # Compute base vertex P.
                    P = mj * E[j] + mk * E[k]
                    for l in range(4):
                        if l == j or l == k:
                            continue
                        proj = (z * E[l].conjugate()).real
                        # Subtract 1e-9 so numerically near-integer proj rounds
                        # correctly (general position guarantees no exact integers).
                        nl = math.ceil(proj - GAMMA - 1e-9)
                        P += nl * E[l]
                    # Tile centroid for disc test.
                    centroid = P + 0.5 * (E[j] + E[k])
                    if abs(centroid) > DISC_RADIUS:
                        continue
                    # CCW vertex order (verified: Im(conj(E[j])·E[k]) > 0 ∀ j<k).
                    verts = [P, P + E[j], P + E[j] + E[k], P + E[k]]
                    tiles.append((verts, is_sq))
    return tiles


# ─── Step 2: Inset Helper ─────────────────────────────────────────────────────

def _inset(verts):
    """Scale tile vertices toward centroid by INSET, returning Vector list."""
    cx = sum(v.real for v in verts) / 4
    cy = sum(v.imag for v in verts) / 4
    out = []
    for v in verts:
        x = cx + INSET * (v.real - cx)
        y = cy + INSET * (v.imag - cy)
        out.append(Vector((x, y, 0.0)))
    return out


# ─── Step 3: Build Blender Mesh ──────────────────────────────────────────────

def build_mesh(tiles):
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    col_layer = bm.loops.layers.color.new("TileType")

    sq_col  = COL_SQUARE
    rh_col  = COL_RHOMBUS

    for (verts, is_sq) in tiles:
        h   = SLAB_SQ if is_sq else SLAB_RH
        col = sq_col  if is_sq else rh_col

        bot = _inset(verts)                              # z=0 bottom
        top = [Vector((p.x, p.y, h)) for p in bot]      # z=h  top

        bv_b = [bm.verts.new(v) for v in bot]
        bv_t = [bm.verts.new(v) for v in top]

        # Top face (visible from above — viewer looks down at stage floor).
        f_top = bm.faces.new(bv_t)
        for loop in f_top.loops:
            loop[col_layer] = col

        # Bottom face (reversed winding for correct outward normals downward).
        f_bot = bm.faces.new(list(reversed(bv_b)))
        for loop in f_bot.loops:
            loop[col_layer] = col

        # Four side faces.
        n = 4
        for i in range(n):
            j = (i + 1) % n
            f_s = bm.faces.new([bv_b[i], bv_b[j], bv_t[j], bv_t[i]])
            for loop in f_s.loops:
                loop[col_layer] = col

    bm.to_mesh(me)
    bm.free()
    me.update()
    return me


# ─── Step 4: Material, Object, Export ────────────────────────────────────────

def setup_object(me):
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    mat = bpy.data.materials.new(name="ABMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "TileType"
    attr.location = (-400, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value   = 0.60
    bsdf.inputs["Roughness"].default_value  = 0.22
    bsdf.location = (-100, 0)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    me.materials.append(mat)

    # Holoflow studio metadata.
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"

    # Apply +Y-up rotation for WebXR export (Blender Z-up → GLTF Y-up).
    import mathutils
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
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
    bpy.ops.object.select_all(action="DESELECT")
    for o in list(bpy.data.objects):
        if o.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(o, do_unlink=True)

    print("Step 1 — generating tiles via de Bruijn multigrid dual …")
    tiles = generate_tiles()
    sq  = sum(1 for _, s in tiles if s)
    rh  = sum(1 for _, s in tiles if not s)
    print(f"  {len(tiles)} tiles: {sq} squares + {rh} rhombi")
    print(f"  sq/rh ratio ≈ {sq/max(rh,1):.3f}  (theory: 1/(1+√2) ≈ 0.414)")

    print("Step 2 — building mesh …")
    me  = build_mesh(tiles)
    obj = setup_object(me)
    print(f"  {len(me.vertices)} verts, {len(me.polygons)} faces")

    print("Step 3 — exporting GLB …")
    export_glb()
    print("Done.")


main()
