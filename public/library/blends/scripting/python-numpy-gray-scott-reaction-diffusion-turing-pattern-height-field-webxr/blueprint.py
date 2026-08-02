"""
Gray-Scott Reaction-Diffusion — Turing Pattern Height-Field
Blender 5.1  |  bpy + numpy  |  CC0

Two chemical species U ("activator substrate") and V ("self-catalyst"):

    ∂U/∂t = Du·∇²U  − U·V²  + f·(1 − U)
    ∂V/∂t = Dv·∇²V  + U·V²  − (f + k)·V

The U·V² cross-term drives autocatalytic growth: a small V seed converts
nearby U into more V; diffusion carries U in from the boundary.  Because
Dv < Du the activator (V) diffuses slower than the substrate (U) that
feeds it — the Turing instability condition — so spatial patterns
spontaneously break translational symmetry.

Pearson (1993) mapped the (f, k) parameter plane and named 12 regimes.
Three are built in here:
  alpha  f=0.035 k=0.060  isolated spots
  beta   f=0.035 k=0.065  stripe / labyrinth
  gamma  f=0.040 k=0.060  maze / reticulate

We discretise on a 64×64 periodic grid with a 5-point Laplacian,
run 6000 explicit-Euler steps, then displace a 64×64 Blender plane
by V, assign vertex colours from the same field, and export GLB.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ──────────────────────────────────────────────────────────────
# CONSTANTS — change these at the top, not buried in code
# ──────────────────────────────────────────────────────────────
GRID_N        = 64      # grid resolution == mesh vertex density
STEPS         = 6000    # explicit-Euler integration steps
DT            = 1.0     # Δt  (stability: DT·Du/dx² < 0.5, dx=1 here → ok)
DU            = 0.210   # U diffusion coefficient
DV            = 0.105   # V diffusion coefficient (< DU → Turing instability)
FEED          = 0.035   # f — substrate feed rate (alpha / spot regime)
KILL          = 0.060   # k — V kill rate
SEED_RADIUS   = 3       # initial V-seed half-width in grid cells
MESH_SIZE     = 5.0     # world units, XY extent of the output plane
HEIGHT_SCALE  = 0.80    # Z amplitude of the V-field height displacement
EXPORT_PATH   = "//hf_gray_scott.glb"
OBJ_NAME      = "hf_gray_scott"


# ──────────────────────────────────────────────────────────────
# SIMULATION
# ──────────────────────────────────────────────────────────────

def _laplacian(field: np.ndarray) -> np.ndarray:
    """5-point finite-difference Laplacian on a periodic 2-D grid.

    ∇²f[i,j] ≈ f[i+1,j] + f[i−1,j] + f[i,j+1] + f[i,j−1] − 4·f[i,j]

    np.roll gives periodic (toroidal) boundary conditions — the field
    wraps so no spurious Dirichlet zeros appear at the mesh edge.
    """
    return (
        np.roll(field, +1, axis=0) +
        np.roll(field, -1, axis=0) +
        np.roll(field, +1, axis=1) +
        np.roll(field, -1, axis=1) -
        4.0 * field
    )


def gray_scott_simulation(
    n: int = GRID_N,
    steps: int = STEPS,
    dt: float = DT,
    Du: float = DU,
    Dv: float = DV,
    f: float = FEED,
    k: float = KILL,
    seed_r: int = SEED_RADIUS,
) -> tuple[np.ndarray, np.ndarray]:
    """Integrate the Gray-Scott PDE, return (U, V) grids at steady state.

    Explicit Euler is first-order but stable for these parameter ranges
    when DT·Du ≤ 0.5 (dt=1, Du=0.21 → 0.21 << 0.5).  A higher-order
    (RK4) integrator would let you take larger DT but is ~4× slower per
    step — not worth it for exploratory generation work.

    The seed is a small square of V=0.25 + 0.05·noise near grid centre,
    plus random sparse perturbations elsewhere.  Without noise the system
    converges to a uniform non-patterned state (the homogeneous fixed
    point is stable without an asymmetric trigger).
    """
    rng = np.random.default_rng(42)

    # homogeneous steady state: U=1, V=0
    U = np.ones((n, n), dtype=np.float64)
    V = np.zeros((n, n), dtype=np.float64)

    # localised seed — breaks symmetry so pattern nucleates from centre
    cx, cy = n // 2, n // 2
    U[cx-seed_r:cx+seed_r, cy-seed_r:cy+seed_r] = 0.50
    V[cx-seed_r:cx+seed_r, cy-seed_r:cy+seed_r] = 0.25

    # sparse random perturbations across grid prevent single-nucleus bias
    pts = rng.integers(0, n, size=(n // 4, 2))
    V[pts[:, 0], pts[:, 1]] += rng.uniform(0.01, 0.05, size=n // 4)
    U = np.clip(U, 0, 1)
    V = np.clip(V, 0, 1)

    for _ in range(steps):
        lap_U = _laplacian(U)
        lap_V = _laplacian(V)
        uvv = U * V * V          # the autocatalytic U·V² term
        U += dt * (Du * lap_U - uvv + f * (1.0 - U))
        V += dt * (Dv * lap_V + uvv - (f + k) * V)
        # clip keeps concentrations in [0,1] — floating-point drift can
        # produce tiny negatives that cascade without this guard
        np.clip(U, 0.0, 1.0, out=U)
        np.clip(V, 0.0, 1.0, out=V)

    return U, V


# ──────────────────────────────────────────────────────────────
# MESH CONSTRUCTION
# ──────────────────────────────────────────────────────────────

def build_heightfield_mesh(V_field: np.ndarray) -> bpy.types.Object:
    """Create a GRID_N × GRID_N quad plane displaced by V_field in Z.

    Why not use a displacement modifier?  Direct vertex assignment avoids
    a live modifier stack and produces a static GLB with no modifier
    bake step — simpler for WebXR consumption.  The topology is a regular
    grid of quads identical to what you get from Add → Mesh → Grid.
    """
    n = V_field.shape[0]
    step = MESH_SIZE / (n - 1)

    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()

    verts = []
    for i in range(n):
        row = []
        for j in range(n):
            x = j * step - MESH_SIZE / 2
            y = i * step - MESH_SIZE / 2
            z = float(V_field[i, j]) * HEIGHT_SCALE
            row.append(bm.verts.new(Vector((x, y, z))))
        verts.append(row)

    for i in range(n - 1):
        for j in range(n - 1):
            bm.faces.new([verts[i][j], verts[i][j+1],
                          verts[i+1][j+1], verts[i+1][j]])

    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    return obj


def assign_vertex_colours(obj: bpy.types.Object,
                          V_field: np.ndarray,
                          U_field: np.ndarray) -> None:
    """Write per-vertex colour attribute from the field values.

    Colour mapping:
      R ← V (activator concentration — high = warm amber)
      G ← 1 − V (inverse → deep blue-green valleys)
      B ← U · V (co-localisation — bright where both species meet)

    This is not artistically arbitrary: the UV co-localisation channel
    (B) lights up the reaction front where U·V² is maximised — the
    mathematically interesting region of the pattern.
    """
    me = obj.data
    n = V_field.shape[0]

    col_attr = me.color_attributes.new(
        name="Col", type="BYTE_COLOR", domain="POINT"
    )

    for i in range(n):
        for j in range(n):
            vi = i * n + j
            v_val = float(V_field[i, j])
            u_val = float(U_field[i, j])
            col_attr.data[vi].color = (
                v_val,
                1.0 - v_val,
                u_val * v_val,
                1.0,
            )


def assign_flat_material(obj: bpy.types.Object) -> None:
    """Flat-shading + vertex-colour material — fits studio cel-shade style."""
    mat = bpy.data.materials.new(name="GrayScottMat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    vc   = tree.nodes.new("ShaderNodeVertexColor")
    bsdf = tree.nodes.new("ShaderNodeBsdfDiffuse")
    out  = tree.nodes.new("ShaderNodeOutputMaterial")

    vc.layer_name = "Col"
    tree.links.new(vc.outputs["Color"], bsdf.inputs["Color"])
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.append(mat)
    # flat (face-angle) shading — no per-vertex normal interpolation
    for poly in obj.data.polygons:
        poly.use_smooth = False


# ──────────────────────────────────────────────────────────────
# EXPORT
# ──────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    """Apply transforms, export Draco-compressed GLB with vertex colours."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # apply all transforms — +Y up convention handled by glTF exporter axis flag
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
        export_yup=True,
    )
    print(f"[gray_scott] exported → {EXPORT_PATH}")


# ──────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────

def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("[gray_scott] simulating … (6000 steps, ~10 s on modern CPU)")
    U, V = gray_scott_simulation()

    print("[gray_scott] building height-field mesh …")
    obj = build_heightfield_mesh(V)
    assign_vertex_colours(obj, V, U)
    assign_flat_material(obj)

    # bevel edges slightly so flat-shaded facets read clearly in WebXR
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    export_glb(obj)
    print("[gray_scott] done.")


if __name__ == "__main__":
    main()
