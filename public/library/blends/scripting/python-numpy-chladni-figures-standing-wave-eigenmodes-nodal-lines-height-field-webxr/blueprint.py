"""
Chladni Figures — Blender 5.1 Blueprint
=========================================
Technique
---------
Ernst Chladni (1787) bowed a metal plate strewn with sand; the grains migrated
to the nodal lines — curves where the plate has zero transverse displacement.
The spatial pattern of the displacement field is a standing-wave eigenmode.

For a FREE square plate the exact eigenmodes require Bernoulli-Euler beam
functions, but the standard engineering approximation (Waller 1961) uses a
superposition of two cosine-product terms:

    ψ⁺(m,n,x,y) = cos(mπx)·cos(nπy)  +  cos(nπx)·cos(mπy)
    ψ⁻(m,n,x,y) = cos(mπx)·cos(nπy)  −  cos(nπx)·cos(mπy)

with x,y ∈ [−1,1] and integers m,n ≥ 1, m ≠ n.  The sign of the
superposition selects between "plus" (4-fold symmetric for m≠n) and
"minus" (anti-symmetric) mode families.  Nodal lines are {ψ = 0}.

Sand collects at nodes because the plate exerts a net lateral acoustic
radiation-pressure force on grains, pushing them toward displacement minima.

Height encoding: z = |ψ(x,y)| × HEIGHT_SCALE — nodal lines become floor-level
valleys (where sand sits), antinodes become ridges.  Vertex colour encodes
phase: cyan for ψ > 0, magenta-pink for ψ < 0, blending to white at |ψ| ≈ 0
(the nodal sand colour).

Basis mode:  ψ⁺(2,3) — 12-lobe pattern with approximate D₄ symmetry.
Shape keys:  ψ⁺(1,2)  →  classic 4-lobe diagonal cross
             ψ⁻(3,4)  →  24-lobe starburst (higher-frequency mode)

Output: 256×256 quad mesh, FLOAT_COLOR vertex colours, morph targets, GLB.

Author: Holoflow Studio — CC0
Blender: 5.1
"""

import bpy
import numpy as np

# ── Parameters ─────────────────────────────────────────────────────────────────
GRID_N       = 256            # grid resolution (N×N vertices)
PLATE_HALF   = 2.0            # physical half-edge in metres → 4 m × 4 m stage
HEIGHT_SCALE = 0.35           # maximum antinode ridge height (metres)
WHITE_THRESH = 0.08           # |ψ| below this blends to nodal-sand white
OUT_PATH     = "//hf_chladni.glb"

# (m, n, sign): sign=+1 → ψ⁺; sign=−1 → ψ⁻
MODES = [
    (2, 3,  1),   # basis mesh    — 12 lobes, ≈D₄ symmetry
    (1, 2,  1),   # morph target  — 4-lobe diagonal cross (lowest-order ψ⁺)
    (3, 4, -1),   # morph target  — 24-lobe starburst (higher-order ψ⁻)
]
MODE_NAMES = ["Basis", "mode_1_2_plus", "mode_3_4_minus"]

# Studio palette: cyan (positive phase), magenta-pink (negative), white (node)
C_POS  = np.array([0.00, 0.85, 0.90, 1.0], dtype=np.float32)
C_NEG  = np.array([0.90, 0.15, 0.60, 1.0], dtype=np.float32)
C_NODE = np.array([1.00, 1.00, 1.00, 1.0], dtype=np.float32)


# ── Mode computation ────────────────────────────────────────────────────────────
def chladni_mode(m: int, n: int, sign: int) -> np.ndarray:
    """
    Compute ψ(m,n,sign) on a GRID_N × GRID_N grid over [−1,1]².

    WHY normalise by amp_max: different (m,n) pairs have different peak
    amplitudes; normalising to [−1,1] keeps HEIGHT_SCALE consistent across
    shape-key morphs so z-range is the same on every mode.
    """
    lin      = np.linspace(-1.0, 1.0, GRID_N, dtype=np.float64)
    x, y     = np.meshgrid(lin, lin)
    psi      = (np.cos(m * np.pi * x) * np.cos(n * np.pi * y)
                + sign * np.cos(n * np.pi * x) * np.cos(m * np.pi * y))
    amp_max  = np.abs(psi).max()
    if amp_max > 1e-12:
        psi /= amp_max
    return psi.astype(np.float32)


# ── Height field mesh builder ───────────────────────────────────────────────────
def build_height_field(name: str, psi: np.ndarray) -> bpy.types.Object:
    """Build the base quad mesh from the basis mode ψ."""
    xs   = np.linspace(-PLATE_HALF, PLATE_HALF, GRID_N, dtype=np.float32)
    ys   = np.linspace(-PLATE_HALF, PLATE_HALF, GRID_N, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)
    # WHY abs: ridge height represents AMPLITUDE; negative phase → same height
    Z    = np.abs(psi) * HEIGHT_SCALE

    verts = np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=1)

    # Row-major quad faces — vertex (row i, col j) → flat index i*GRID_N+j
    r, c   = np.mgrid[0:GRID_N - 1, 0:GRID_N - 1]
    i00    = (r * GRID_N + c).ravel()
    faces  = np.stack([i00, i00 + 1, i00 + GRID_N + 1, i00 + GRID_N], axis=1)

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()

    _assign_vertex_colours(mesh, psi)

    obj = bpy.data.objects.new(name, mesh)
    obj["holoflow:facet"] = True
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _assign_vertex_colours(mesh: bpy.types.Mesh, psi: np.ndarray) -> None:
    """
    Smoothstep blend from C_NODE at the nodal line to C_POS / C_NEG at antinodes.

    WHY smoothstep: a hard threshold produces jaggy colour edges at the nodal
    line.  Smoothstep(|ψ| / WHITE_THRESH) gives a C¹ transition so the white
    sand-line feathers naturally into the coloured lobes.
    """
    # WHY FLOAT_COLOR not BYTE_COLOR: preserves HDR range; glTF exporter reads
    # it as COLOR_0 at full float precision, avoiding sRGB double-conversion.
    attr     = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    n_v      = GRID_N * GRID_N
    rgba     = np.empty((n_v, 4), dtype=np.float32)

    psi_flat = psi.ravel()
    abs_flat = np.abs(psi_flat)

    # Smoothstep t ∈ [0,1]: 0 at node, 1 at antinode
    t        = np.clip(abs_flat / WHITE_THRESH, 0.0, 1.0)
    t        = t * t * (3.0 - 2.0 * t)

    pos_mask = psi_flat >= 0.0
    t_p      = t[ pos_mask, None]
    t_n      = t[~pos_mask, None]

    rgba[ pos_mask] = (1.0 - t_p) * C_NODE + t_p * C_POS
    rgba[~pos_mask] = (1.0 - t_n) * C_NODE + t_n * C_NEG

    attr.data.foreach_set("color", rgba.ravel())


# ── Material — unlit emission so vertex colour reads cleanly ──────────────────
def make_emission_material(name: str) -> bpy.types.Material:
    mat           = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt            = mat.node_tree
    nt.nodes.clear()
    attr               = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    emit  = nt.nodes.new("ShaderNodeEmission")
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"],    emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    m0, n0, s0 = MODES[0]
    print(f"[chladni] basis mode ψ({'+'if s0>0 else '-'})({m0},{n0}) …")
    psi_basis = chladni_mode(m0, n0, s0)

    obj  = build_height_field("chladni_plate", psi_basis)
    mesh = obj.data
    obj.shape_key_add(name="Basis", from_mix=False)

    for (m, n, s), key_name in zip(MODES[1:], MODE_NAMES[1:]):
        print(f"[chladni] morph mode ψ({'+'if s>0 else '-'})({m},{n}) → {key_name} …")
        psi_alt = chladni_mode(m, n, s)
        sk      = obj.shape_key_add(name=key_name, from_mix=False)
        alt_z   = (np.abs(psi_alt) * HEIGHT_SCALE).ravel()
        for i, kd in enumerate(sk.data):
            kd.co.z = float(alt_z[i])

    mat = make_emission_material("chladni_plate_mat")
    mesh.materials.append(mat)

    bpy.ops.object.camera_add(location=(0.0, -4.2, 6.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (0.70, 0.0, 0.0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="SUN", location=(2.0, -3.0, 7.0))
    sun             = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = 0.18

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(OUT_PATH),
        export_format                        = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
        export_morph                         = True,
        export_colors                        = True,
        export_apply                         = False,
        export_yup                           = True,
    )
    print(f"[chladni] ✓ exported {OUT_PATH}")


main()
