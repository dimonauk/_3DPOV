"""
Arnold Tongue / Sine Circle Map — Mode-Locking Basin Relief
===========================================================
Blender 5.1 | Holoflow Studio | Licence: CC0

The *sine circle map* is the canonical one-dimensional discrete map that
connects uniform rotation to nonlinear mode-locking:

    θ_{n+1} = (θ_n + Ω − (K / 2π) · sin(2π θ_n)) mod 1

  Ω ∈ [0, 1)  — bare (uncoupled) rotation frequency
  K ∈ [0, 4]  — nonlinearity / coupling strength

The long-time *winding number* W = lim_{n→∞} Σ δ_n / n measures the
average rotation per step.  When W = p/q (rational), the orbit is
*mode-locked*: every q steps it completes exactly p full rotations.
These rational locking regions form tongue-shaped zones in (Ω, K)
parameter space — wider at larger K.  At K = 1 the tongues tile the
unit square with measure 1, and W(Ω) becomes the devil's staircase.

This blueprint:
  1. Vectorises N_ITER iterations over a GRID_RES² grid using numpy.
  2. Estimates W and classifies each cell into a Farey orbit p/q (q ≤ MAX_Q).
  3. Builds a subdivided plane mesh via bmesh (direct API, no bpy.ops grid).
  4. Displaces vertex Z by mode-lock depth (tongue interior → raised plateau).
  5. Colours vertices by winding-number hue via FLOAT_COLOR attribute (5.x API).
  6. Attaches a Principled BSDF + VertexColor node tree.
  7. Exports Draco-6 / WebP GLB ready for WebXR.

Run:  blender --python blueprint.py --background
Or:   paste into Blender's Text Editor and press Run Script.
"""

import math
import bpy
import bmesh
import numpy as np
from mathutils import Color

# ── Parameters ──────────────────────────────────────────────────────────────
GRID_RES        = 180   # vertices per axis; 180² = 32 400 verts, ~9 MB mesh
N_TRANSIENT     = 400   # iterations discarded (let orbit settle onto attractor)
N_ITER          = 1200  # iterations measured for winding number estimate
K_MAX           = 1.15  # K range; tongues already fill unit square at K = 1
OMEGA_MIN       = 0.0
OMEGA_MAX       = 1.0
LOCK_EPSILON    = 0.012 # |W − p/q| < ε  → classify as mode-locked
MAX_Q           = 8     # highest Farey denominator considered
MESH_SIZE       = 2.0   # total XY side length (m) — fits standard WebXR stage
DISPLACEMENT_Z  = 0.22  # max height of locked tongue plateaux (m)
OUT_GLB         = "//hf_arnold_tongue.glb"


# ── Farey table ──────────────────────────────────────────────────────────────
def _farey_table(max_q: int):
    seen: set = set()
    table = []
    for q in range(1, max_q + 1):
        for p in range(0, q + 1):
            r = p / q
            if r not in seen:
                seen.add(r)
                table.append((p, q, r))
    table.sort(key=lambda x: x[2])
    return table

FAREY   = _farey_table(MAX_Q)
RATLS   = np.array([r for _, _, r in FAREY], dtype=np.float64)   # (N_rats,)


# ── Winding number field ─────────────────────────────────────────────────────
def compute_fields():
    """Return (nearest_idx, locked, lock_depth) arrays shaped (RES*RES,)."""
    omega  = np.linspace(OMEGA_MIN, OMEGA_MAX, GRID_RES, dtype=np.float64)
    k_vals = np.linspace(0.0, K_MAX, GRID_RES, dtype=np.float64)
    # indexing='ij' → OO[i,j] = omega[i], KK[i,j] = k_vals[j]
    OO, KK = np.meshgrid(omega, k_vals, indexing='ij')           # (RES, RES)
    inv2pi  = 0.5 / math.pi

    theta = np.zeros_like(OO)

    # Transient: use modular arithmetic to keep theta ∈ [0,1)
    for _ in range(N_TRANSIENT):
        theta = (theta + OO - KK * inv2pi * np.sin(2.0 * math.pi * theta)) % 1.0

    # Measurement: accumulate raw delta (no mod) for accurate winding count
    cumulative = np.zeros_like(OO)
    for _ in range(N_ITER):
        delta     = OO - KK * inv2pi * np.sin(2.0 * math.pi * theta)
        theta     = (theta + delta) % 1.0
        cumulative += delta

    W_flat = (cumulative / N_ITER).ravel()                        # (RES²,)

    # Vectorised nearest-rational search: broadcast diff over FAREY table
    diff        = np.abs(W_flat[:, None] - RATLS[None, :])        # (N, N_rats)
    nearest_idx = diff.argmin(axis=1)
    nearest_dist= diff[np.arange(len(W_flat)), nearest_idx]

    locked      = nearest_dist < LOCK_EPSILON
    # lock_depth: 1 at tongue centre, 0 at LOCK_EPSILON boundary
    lock_depth  = np.clip(1.0 - nearest_dist / LOCK_EPSILON, 0.0, 1.0)

    frac = locked.mean()
    print(f"[arnold] Mode-locked fraction: {frac:.2%}  (expect ~60 % at K≈1)")
    return nearest_idx, locked, lock_depth


# ── Hue mapping ──────────────────────────────────────────────────────────────
def _hue(farey_idx: int) -> float:
    """Map Farey table index → perceptually distinct hue in [0,1)."""
    p, q, _ = FAREY[farey_idx]
    # Spread hues so that denominators q = 1…8 each own a distinct band
    base   = ((q - 1) / MAX_Q)
    offset = (p / max(q, 1)) / (MAX_Q * 2)
    return (base + offset) % 1.0


# ── Mesh ─────────────────────────────────────────────────────────────────────
def build_mesh(nearest_idx, locked, lock_depth):
    for ob in list(bpy.data.objects):
        if ob.name.startswith("hf_arnold"):
            bpy.data.objects.remove(ob, do_unlink=True)

    bm   = bmesh.new()
    half = MESH_SIZE * 0.5
    step = MESH_SIZE / (GRID_RES - 1)

    # Build vertex grid: X = Ω axis, Y = K axis
    vert_grid = []
    for i in range(GRID_RES):                    # Ω
        row = []
        for j in range(GRID_RES):               # K
            fi   = i * GRID_RES + j             # flat index (matches compute_fields)
            z    = lock_depth[fi] * DISPLACEMENT_Z
            v    = bm.verts.new((-half + i * step, -half + j * step, z))
            row.append(v)
        vert_grid.append(row)

    bm.verts.ensure_lookup_table()

    for i in range(GRID_RES - 1):
        for j in range(GRID_RES - 1):
            bm.faces.new([
                vert_grid[i][j],
                vert_grid[i + 1][j],
                vert_grid[i + 1][j + 1],
                vert_grid[i][j + 1],
            ])

    mesh = bpy.data.meshes.new("arnold_tongue_mesh")
    bm.to_mesh(mesh)
    bm.free()
    mesh.calc_normals_split()

    # FLOAT_COLOR per-point attribute — Blender 4.x / 5.x API
    col_attr = mesh.color_attributes.new(name="Col", type='FLOAT_COLOR', domain='POINT')

    for fi in range(GRID_RES * GRID_RES):
        # Vertex created at row i, col j → mesh index = i * GRID_RES + j = fi
        hue = _hue(int(nearest_idx[fi]))
        sat = 0.82 if locked[fi] else 0.14
        val = 0.97 if locked[fi] else 0.40
        c   = Color()
        c.hsv = (hue, sat, val)
        col_attr.data[fi].color = (c.r, c.g, c.b, 1.0)

    # Material: VertexColor → Principled BSDF
    mat   = bpy.data.materials.new("arnold_tongue_mat")
    mat.use_nodes = True
    nt    = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vcol  = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "Col"
    bsdf.inputs["Roughness"].default_value = 0.52
    bsdf.inputs["Metallic"].default_value  = 0.05
    nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    mesh.materials.append(mat)

    obj = bpy.data.objects.new("hf_arnold_tongue", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


# ── Export ───────────────────────────────────────────────────────────────────
def export_glb():
    bpy.ops.object.select_all(action='DESELECT')
    bpy.data.objects["hf_arnold_tongue"].select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT_GLB),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        use_selection=True,
        export_apply=True,
        export_colors=True,
    )
    print(f"[arnold] Exported → {OUT_GLB}")


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("[arnold] Computing winding number field …")
    nearest_idx, locked, lock_depth = compute_fields()

    print("[arnold] Building mesh …")
    build_mesh(nearest_idx, locked, lock_depth)

    print("[arnold] Exporting GLB …")
    export_glb()
    print("[arnold] Done.")
