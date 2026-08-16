"""
blueprint.py — Wulff Crystal: Equilibrium Morphology via Halfspace Intersection
================================================================================
Blender 5.1  |  Python 3.11  |  deps: numpy, scipy

G. Wulff (1901) proved that the crystal minimising surface-energy integral
∫ γ(n̂) dA at fixed volume is the convex body:

    W = ∩_{n̂} { x ∈ ℝ³ : n̂·x ≤ γ(n̂) }

For a cubic crystal with Oh symmetry (48 operations) the independent face
families are {100} (6 halfspaces), {110} (12) and {111} (8).  Varying their
ratio d₁₁₁/d₁₀₀ drives a morphological phase transition:

    d₁₁₁/d₁₀₀ > √3   ≈ 1.732  →  pure cube            (only {100} faces)
    d₁₁₁/d₁₀₀ = 2/√3 ≈ 1.155  →  cuboctahedron        ({100} + {111})
    d₁₁₁/d₁₀₀ < 1/√3 ≈ 0.577  →  pure octahedron      (only {111} faces)

WHY icosphere projection instead of HalfspaceIntersection vertices directly?
Blender shape keys require identical vertex count and topology.  The Wulff
polytope has different vertex counts at each morphology (cube=8, truncated-
cube=24, cuboctahedron=12, …), so direct poly-conversion would break shape
keys.  Projecting a fixed icosphere radially onto the Wulff surface is exact
(all points lie on planar crystal faces) and preserves topology.

Wulff radius:  r(u) = min_{i : n̂ᵢ·u > 0}  dᵢ / (n̂ᵢ·u)

The projected face-vertices are coplanar per crystal face → flat shading gives
the gem-facet look without needing Smooth by Angle across shape keys.
"""
import bpy
import bmesh
import numpy as np
import mathutils

# ── PARAMETERS ────────────────────────────────────────────────────────────
BLEND_NAME  = "hf_wulff_crystal"
EXPORT_GLB  = True     # set False for quick geometry inspection
SCALE       = 0.080    # metres — poi head ≈ ø 0.16 m
ISO_LEVEL   = 2        # icosphere subdivisions → 162 verts (level-3 = 642)

# (shape-key name, d_100, d_110, d_111)  — face half-widths = γ/λ
# d_110 = 9.90 keeps {110} faces absent (outside shape) for all five keys,
# giving the clean two-family cube↔octahedron morphology diagram.
SHAPE_KEYS = [
    ("cube",          1.000, 9.90, 1.900),  # d₁₁₁ > √3 → pure cube
    ("trunc_cube",    1.000, 9.90, 1.350),  # 2/√3 < d₁₁₁ < √3 → bevel corners
    ("cuboctahedron", 1.000, 9.90, 1.155),  # d₁₁₁ = 2/√3 → equal {100}/{111}
    ("trunc_octa",    1.000, 9.90, 0.800),  # 1/√3 < d₁₁₁ < 2/√3 → dominant {111}
    ("octahedron",    1.000, 9.90, 0.577),  # d₁₁₁ ≈ 1/√3 → pure octahedron
]

# ── OH-SYMMETRY FACE NORMALS ──────────────────────────────────────────────
def _cubic_normals() -> np.ndarray:
    """{100} (6) + {110} (12) + {111} (8) = 26 unit normals for Oh symmetry."""
    n100 = np.array([
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [ 0,-1, 0],
        [0, 0, 1], [ 0, 0,-1]], dtype=float)

    n110 = np.array([
        [ 1, 1, 0], [ 1,-1, 0], [-1, 1, 0], [-1,-1, 0],
        [ 1, 0, 1], [ 1, 0,-1], [-1, 0, 1], [-1, 0,-1],
        [ 0, 1, 1], [ 0, 1,-1], [ 0,-1, 1], [ 0,-1,-1]], dtype=float)
    n110 /= np.sqrt(2)

    n111 = np.array([
        [ 1, 1, 1], [ 1, 1,-1], [ 1,-1, 1], [ 1,-1,-1],
        [-1, 1, 1], [-1, 1,-1], [-1,-1, 1], [-1,-1,-1]], dtype=float)
    n111 /= np.sqrt(3)

    return np.vstack([n100, n110, n111])   # (26, 3)


_NORMALS = _cubic_normals()   # precomputed once; shape (26, 3)


# ── WULFF RADIUS ──────────────────────────────────────────────────────────
def wulff_radius(dirs: np.ndarray, d100: float, d110: float, d111: float) -> np.ndarray:
    """
    For each unit direction u in dirs (N×3), compute the Wulff-surface radius.

    r(u) = min_{i : n̂ᵢ·u > 0}  dᵢ / (n̂ᵢ·u)

    Derivation: the Wulff body boundary point in direction u satisfies
    n̂ⱼ·(r·u) = dⱼ for the *tightest* active halfspace j; all others give
    n̂ᵢ·(r·u) ≤ dᵢ (inside).  Taking the minimum over forward-facing faces
    (n̂ᵢ·u > 0) therefore locates the exact boundary.  Back-facing normals
    (n̂ᵢ·u ≤ 0) cannot intersect the ray in the positive-r direction.
    """
    # Broadcast: dots[i, j] = n̂ᵢ · uⱼ,  shape (26, N)
    d_vec = np.concatenate([
        np.full(6,  d100),
        np.full(12, d110),
        np.full(8,  d111),
    ])                                            # (26,)

    dots     = _NORMALS @ dirs.T                 # (26, N)
    safe     = np.where(dots > 1e-9, dots, np.inf)   # mask back-facing
    return np.min(d_vec[:, None] / safe, axis=0)      # (N,) — Wulff radii


# ── MESH BUILD ─────────────────────────────────────────────────────────────
def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.name = "HF_Wulff_Crystal"
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 1.0

    # ── unit icosphere as projection template ────────────────────────────
    bm_tmp = bmesh.new()
    bmesh.ops.create_icosphere(bm_tmp, subdivisions=ISO_LEVEL, radius=1.0)
    raw_co  = np.array([v.co[:] for v in bm_tmp.verts])         # (V, 3)
    fi_list = [[v.index for v in f.verts] for f in bm_tmp.faces] # face indices
    bm_tmp.free()
    # unit directions (radius = 1 for icosphere, so co == dirs here)
    dirs = raw_co / np.linalg.norm(raw_co, axis=1, keepdims=True)

    # ── base mesh: cube morphology (shape key 0) ─────────────────────────
    _, d100_0, d110_0, d111_0 = SHAPE_KEYS[0]
    r0  = wulff_radius(dirs, d100_0, d110_0, d111_0)
    co0 = dirs * r0[:, None] * SCALE              # (V, 3) in metres

    me = bpy.data.meshes.new(BLEND_NAME)
    ob = bpy.data.objects.new(BLEND_NAME, me)
    sc.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    bm = bmesh.new()
    bverts = [bm.verts.new(c) for c in co0]
    bm.verts.ensure_lookup_table()
    for fi in fi_list:
        try:
            bm.faces.new([bverts[i] for i in fi])
        except ValueError:
            pass
    bm.to_mesh(me)
    bm.free()

    # Flat shading: each iso-triangle gets its own constant normal.
    # Triangles on the SAME crystal face are coplanar → same flat normal →
    # looks like one facet.  Adjacent faces have different normals → sharp
    # silhouette.  No modifier needed; shape keys stay unlocked.
    for poly in me.polygons:
        poly.use_smooth = False

    # ── shape keys ────────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)
    for sk_name, d100, d110, d111 in SHAPE_KEYS:
        sk = ob.shape_key_add(name=sk_name, from_mix=False)
        r  = wulff_radius(dirs, d100, d110, d111)
        co = dirs * r[:, None] * SCALE
        for i, c in enumerate(co):
            sk.data[i].co = c.tolist()

    # ── gem material: Principled BSDF, diamond IOR, transmission ─────────
    mat = bpy.data.materials.new("Wulff_Crystal_Gem")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    pb  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    # Diamond: IOR = 2.42, high transmission, clearcoat for facet highlights
    pb.inputs["Base Color"].default_value          = (0.88, 0.94, 1.00, 1.0)
    pb.inputs["Roughness"].default_value           = 0.025
    pb.inputs["IOR"].default_value                 = 2.42
    pb.inputs["Transmission Weight"].default_value = 0.90
    pb.inputs["Coat Weight"].default_value         = 1.0
    pb.inputs["Coat Roughness"].default_value      = 0.0
    nt.links.new(pb.outputs["BSDF"], out.inputs["Surface"])
    ob.data.materials.append(mat)

    # ── Holoflow export metadata ──────────────────────────────────────────
    ob["holoflow:facet"]    = True
    ob["holoflow:category"] = "poi-head"
    ob.name = "wulff_crystal_poi"   # snake_case root name (studio convention)
    # +Y up: icosphere is already Y-up; no additional rotation needed

    # ── save .blend ───────────────────────────────────────────────────────
    import os
    here       = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
    blend_path = os.path.join(here, f"{BLEND_NAME}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[Wulff] .blend saved → {blend_path}")

    # ── GLB export ────────────────────────────────────────────────────────
    if EXPORT_GLB:
        glb = os.path.normpath(os.path.join(
            here,
            "../../../../glbs/scripting/"
            "python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr/"
            f"{BLEND_NAME}.glb",
        ))
        os.makedirs(os.path.dirname(glb), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=glb,
            use_selection=True,
            export_apply=True,
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_image_format="WEBP",
            export_morph=True,          # shape keys → morph targets
            export_morph_normal=False,  # normals recalculated from flat faces
        )
        print(f"[Wulff] GLB → {glb}")


if __name__ == "__main__":
    build()
