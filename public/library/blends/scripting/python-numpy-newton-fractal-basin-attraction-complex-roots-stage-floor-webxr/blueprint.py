"""
Newton Fractal Basin of Attraction — Blender 5.1 Blueprint
===========================================================
Technique
---------
Newton's method applied to p(z) = z^n − 1 in the complex plane.
The map N(z) = z − p(z)/p'(z) simplifies to:

    N(z) = ((n−1)·z^n + 1) / (n·z^(n−1))

For n=5 (5th roots of unity), the plane is divided into 5 basins — each
pixel coloured by which root z₀ converges to.  The basin boundary is the
Julia set of N, a true fractal (Hausdorff dimension > 1).  Slow convergence
near that boundary is encoded as height: ridges mark the fractal frontier
where the iteration is most undecided.

Output: 256×256 height-field quad mesh, vertex colours (FLOAT_COLOR),
shape keys for n=3 / n=5 / n=7, unlit emission material, GLB Draco-6.

Studio conventions: +Y up at export, apply transforms, snake_case root name,
holoflow:facet flag, WebP textures, Draco level 6.

Author: Holoflow Studio — CC0
Blender: 5.1
"""

import bpy
import bmesh
import numpy as np

# ── Parameters ─────────────────────────────────────────────────────────────────
GRID_N      = 256           # grid resolution (NxN vertices)
EXTENT      = 2.2           # complex-plane half-width sampled
MAX_ITER    = 100           # Newton iteration cap
EPS_CONV    = 1e-8          # convergence threshold (|z − root| < EPS)
EPS_DENOM   = 1e-12         # guard against division by near-zero derivative
DEGREES     = [3, 5, 7]     # polynomial degrees: n=5 is the basis mesh
FLOOR_HALF  = 2.0           # physical half-edge in metres (4 m × 4 m floor)
HEIGHT_SCALE = 0.40         # max ridge height in metres
OUT_PATH    = "//hf_newton_basin.glb"

# Basin palette — 7 hues cover up to z^7−1, studio cyan-magenta system
PALETTE = np.array([
    [0.00, 0.85, 0.90, 1.0],   # 0: cyan
    [0.90, 0.15, 0.60, 1.0],   # 1: magenta-pink
    [0.95, 0.68, 0.00, 1.0],   # 2: amber
    [0.30, 0.90, 0.30, 1.0],   # 3: lime
    [0.50, 0.18, 0.95, 1.0],   # 4: violet
    [1.00, 0.40, 0.10, 1.0],   # 5: orange
    [0.10, 0.60, 1.00, 1.0],   # 6: sky-blue
], dtype=np.float32)


# ── Newton iteration — vectorised ─────────────────────────────────────────────
def newton_basin(degree: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Vectorised Newton's method for p(z) = z^degree − 1.

    Returns
    -------
    basin_idx : (GRID_N, GRID_N) int32   which root [0..degree-1]; -1 = no conv
    speed_map : (GRID_N, GRID_N) float32  1 − iter/MAX_ITER → high = slow conv
    """
    lin       = np.linspace(-EXTENT, EXTENT, GRID_N, dtype=np.float64)
    Re, Im    = np.meshgrid(lin, lin)
    z         = Re + 1j * Im                         # complex seed grid

    # Exact roots of unity: e^(2πi·k/n), k = 0..n-1
    roots  = np.exp(2j * np.pi * np.arange(degree) / degree)

    basin  = np.full((GRID_N, GRID_N), -1, dtype=np.int32)
    icount = np.zeros((GRID_N, GRID_N), dtype=np.int32)
    active = np.ones((GRID_N, GRID_N), dtype=bool)

    for k in range(MAX_ITER):
        if not active.any():
            break

        # WHY this form: ((n-1)z^n + 1)/(n·z^(n-1)) avoids catastrophic
        # cancellation at z ≈ root because numerator → 0 at the same rate
        # as the denominator — both are O(z−root) near convergence.
        zn   = np.where(active, z ** degree,           1.0)
        zn1  = np.where(active, z ** (degree - 1),     1.0)
        denom = degree * zn1
        safe  = active & (np.abs(denom) > EPS_DENOM)
        z[safe] -= (zn[safe] - 1.0) / denom[safe]

        # Check each root for convergence
        for r, root in enumerate(roots):
            hit           = active & (np.abs(z - root) < EPS_CONV)
            basin[hit]    = r
            icount[hit]   = k + 1
            active[hit]   = False

    # Height encoding: boundary pixels converge slowly (high icount) → tall ridge
    # Points that never converged stay at zero height.
    speed_map = np.where(
        basin >= 0,
        (1.0 - icount.astype(np.float32) / MAX_ITER),   # slow → near 1
        0.0,
    ).astype(np.float32)
    return basin, speed_map


# ── Mesh builder ───────────────────────────────────────────────────────────────
def build_height_field(name: str, degree: int) -> tuple[bpy.types.Object, np.ndarray]:
    """
    Create a GRID_N × GRID_N quad mesh with vertex colours for `degree`.
    Returns (object, speed_map) so callers can add shape keys from other degrees.
    """
    basin, speed = newton_basin(degree)

    xs = np.linspace(-FLOOR_HALF, FLOOR_HALF, GRID_N, dtype=np.float32)
    ys = np.linspace(-FLOOR_HALF, FLOOR_HALF, GRID_N, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)
    Z    = speed * HEIGHT_SCALE

    verts = np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=1)

    # Row-major quad faces: (i,j) → (i,j+1) → (i+1,j+1) → (i+1,j)
    r, c   = np.mgrid[0:GRID_N-1, 0:GRID_N-1]
    i00    = (r * GRID_N + c).ravel()
    faces  = np.stack([i00, i00 + 1, i00 + GRID_N + 1, i00 + GRID_N], axis=1)

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()

    # Vertex colour (FLOAT_COLOR = linear, Blender 3.5+)
    # WHY FLOAT_COLOR not BYTE_COLOR: preserves HDR range and avoids sRGB
    # double-conversion when the glTF exporter reads back the attribute.
    attr      = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    rgba      = np.ones((GRID_N * GRID_N, 4), dtype=np.float32)
    for idx in range(degree):
        mask          = basin.ravel() == idx
        rgba[mask, :] = PALETTE[idx % len(PALETTE)]
    attr.data.foreach_set("color", rgba.ravel())

    obj = bpy.data.objects.new(name, mesh)
    obj["holoflow:facet"] = True
    bpy.context.scene.collection.objects.link(obj)
    return obj, speed


# ── Material — unlit emission so vertex colour reads cleanly ──────────────────
def make_emission_material(name: str) -> bpy.types.Material:
    mat      = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt       = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    emit  = nt.nodes.new("ShaderNodeEmission")
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    # Clean slate
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("[newton] computing degree-5 basis basin …")
    obj, speed_5 = build_height_field("newton_basin", degree=5)
    mesh         = obj.data

    # Shape key basis (must be added before morph targets)
    obj.shape_key_add(name="Basis", from_mix=False)

    # Morph targets for alternative polynomial degrees
    for deg, key_name in [(3, "roots_3"), (7, "roots_7")]:
        print(f"[newton] computing degree-{deg} shape key …")
        _, speed_alt = newton_basin(deg)
        sk           = obj.shape_key_add(name=key_name, from_mix=False)
        alt_z        = (speed_alt * HEIGHT_SCALE).ravel()
        # Only Z changes — basin topology is fixed on the basis colour
        for i, kd in enumerate(sk.data):
            kd.co.z = float(alt_z[i])

    mat = make_emission_material("newton_basin_mat")
    mesh.materials.append(mat)

    # Camera
    bpy.ops.object.camera_add(location=(0.0, -5.5, 4.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.05, 0.0, 0.0)
    bpy.context.scene.camera = cam

    # Sun lamp
    bpy.ops.object.light_add(type="SUN", location=(3.0, -3.0, 6.0))
    sun             = bpy.context.active_object
    sun.data.energy = 3.5
    sun.data.angle  = 0.18

    # Apply transforms, select only the floor mesh
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # GLB export
    bpy.ops.export_scene.gltf(
        filepath        = bpy.path.abspath(OUT_PATH),
        export_format   = "GLB",
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_image_format = "WEBP",
        export_morph    = True,
        export_colors   = True,
        export_apply    = False,
        export_yup      = True,
    )
    print(f"[newton] ✓ exported {OUT_PATH}")


main()
