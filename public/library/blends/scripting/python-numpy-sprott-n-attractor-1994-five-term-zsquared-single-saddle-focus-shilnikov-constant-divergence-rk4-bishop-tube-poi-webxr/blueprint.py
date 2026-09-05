"""
Sprott N Attractor — 1994 Canonical Case N
===========================================
Technique: RK4 integration of a 5-term 3-D ODE with a single quadratic
nonlinearity (z²), converted to a Bishop-parallel-transport tube mesh
coloured by speed.  All geometry via bpy.data — no operators required.

Reference: Sprott JC (1994) "Some simple chaotic flows",
  Phys Rev E 50(2):R647.  Public-domain mathematics.
  sprott.physics.wisc.edu/chaos/

System:
    ẋ = −2y
    ẏ = x + z²
    ż = b + y − 2z

Canonical: b=1.0

Key properties
--------------
Divergence:  ∇·F = ∂(−2y)/∂x + ∂(x+z²)/∂y + ∂(b+y−2z)/∂z
           = 0 + 0 + (−2) = −2   (constant; b-independent)
Liouville:  ΣLyapunov = −2

Fixed points (ẋ=0 ↔ y=0; ẏ=0 ↔ x=−z²; ż=0 ↔ b+y−2z=0):
  y=0, z=b/2, x=−(b/2)²=−b²/4
  → P = (−b²/4, 0, b/2)
  Canonical (b=1): P = (−1/4, 0, 1/2)   ← single fixed point

Jacobian at P = (−b²/4, 0, b/2):
  J = [[ 0,  −2,   0],
       [ 1,   0,   b],    ← 2z* = 2·(b/2) = b
       [ 0,   1,  −2]]

Characteristic polynomial (b=1 canonical):
  λ³ + 2λ² + λ + 4 = 0
  λ_s  ≈ −2.31          (stable real ← 1-D stable manifold)
  λ_c  ≈ +0.155 ± 1.303i (UNSTABLE complex pair ← 2-D spiral out)
  → Shilnikov ratio |λ_s|/Re(λ_c) = 2.31/0.155 ≈ 14.9 >> 1 ✓

With only ONE fixed point, Sprott N's Shilnikov ratio of ~15 is among the
highest in the 1994 catalogue.  The unstable spiral ejects trajectories;
the global z² curvature folds them back to the stable manifold.

λ₁≈+0.076  λ₂=0  λ₃≈−2.076
D_KY = 2 + λ₁/|λ₃| = 2 + 0.076/2.076 ≈ 2.037
Lyapunov time τ = 1/λ₁ ≈ 13.2 time units
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── integration parameters ────────────────────────────────────────────────────
B_PARAM = 1.00   # constant offset in ż — canonical Sprott N (b-independent divergence)
DT      = 0.01   # RK4 step; conservative for fastest magnitude |λ_s|≈2.31 → 1/|λ_s|≈0.43
BURN_IN = 2_000  # transient steps (≈2.7 Lyapunov times at τ≈13.2)
N_STEPS = 90_000 # recording steps
THIN    = 30     # keep every 30th → 3 000 waypoints
IC      = np.array([0.1, 0.5, 0.0])  # z=0 ≠ z*=0.5 so ż=1+0.5≠0 at start

# ── tube geometry ─────────────────────────────────────────────────────────────
TUBE_SIDES = 8     # cross-section polygon count
TUBE_R     = 0.035 # cross-section radius in metres
POI_R      = 0.085 # bounding-sphere radius for WebXR poi-head export

# ── vertex-colour attribute ───────────────────────────────────────────────────
ATTR_NAME = "SprottN_Speed"    # FLOAT_COLOR, accessed by shader + GLB exporter
COBALT    = np.array([0.020, 0.102, 0.557])  # slow end
AMBER     = np.array([0.950, 0.600, 0.000])  # fast end


# ─────────────────────────────────────────────────────────────────────────────
# 1. ODE + RK4
# ─────────────────────────────────────────────────────────────────────────────

def _f(s: np.ndarray, b: float) -> np.ndarray:
    """Sprott N vector field.  s = [x, y, z].
    WHY z² in ẏ: the nonlinear coupling makes the y-direction expand for large
    |z|, creating the horseshoe-fold that sustains chaos despite the large
    negative divergence −2.  Without the z² term the system is linear and
    damps to a fixed point exponentially.
    """
    x, y, z = s
    return np.array([
        -2.0 * y,          # ẋ = −2y     (y acts as velocity; 2× faster than unit)
         x + z * z,        # ẏ = x + z²  (z²-driven positive feedback in y)
         b + y - 2.0 * z   # ż = b+y−2z  (b offsets the attracting z=b/2 plane)
    ])


def _rk4(s: np.ndarray, b: float, dt: float) -> np.ndarray:
    """Fourth-order Runge-Kutta step.
    WHY RK4 over Euler: Euler's global error is O(dt), which for this system's
    fast eigenvalue (|λ|≈2.31) would require dt<0.01 just for stability; RK4
    achieves O(dt⁴) accuracy with the same dt, meaning phase-space volume errors
    are 10⁴× smaller per step.
    """
    k1 = _f(s,            b)
    k2 = _f(s + 0.5*dt*k1, b)
    k3 = _f(s + 0.5*dt*k2, b)
    k4 = _f(s +     dt*k3, b)
    return s + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(b: float) -> np.ndarray:
    """Return (N_KEEP, 3) float32 waypoints for a given b-parameter value."""
    s = IC.copy()
    for _ in range(BURN_IN):
        s = _rk4(s, b, DT)
    pts = []
    for i in range(N_STEPS):
        s = _rk4(s, b, DT)
        if i % THIN == 0:
            pts.append(s.copy())
    return np.array(pts, dtype=np.float32)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Bishop parallel-transport frame
# ─────────────────────────────────────────────────────────────────────────────

def bishop_frames(pts: np.ndarray):
    """Compute (N, 3) tangent T, (N, 3) normal N, (N, 3) binormal B arrays.

    Bishop's 1975 frame (Am Math Monthly 82:246) avoids Frenet's singularity
    at inflection points by transporting the normal plane via parallel transport:
    each frame is rotated only by the amount needed to stay perpendicular to T,
    with no torsion twist — the result is uniquely defined even where curvature
    vanishes, making it ideal for space-filling chaotic curves.
    """
    n = len(pts)
    T = np.zeros((n, 3), dtype=np.float64)
    N = np.zeros((n, 3), dtype=np.float64)
    B = np.zeros((n, 3), dtype=np.float64)

    # tangents (central difference, forward/backward at endpoints)
    T[1:-1] = pts[2:] - pts[:-2]
    T[0]    = pts[1]  - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms[norms < 1e-12] = 1.0
    T /= norms

    # seed normal: use an axis not parallel to T[0]
    seed = np.array([0., 0., 1.])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([0., 1., 0.])
    N[0] = np.cross(T[0], seed)
    N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])

    # propagate by parallel transport
    for i in range(1, n):
        # rotate previous N so it stays perpendicular to new T
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-12:
            N[i] = N[i-1]
        else:
            cos_a = np.dot(T[i-1], T[i])
            axis /= sin_a
            # Rodrigues rotation
            N[i] = (N[i-1] * cos_a
                    + np.cross(axis, N[i-1]) * sin_a
                    + axis * np.dot(axis, N[i-1]) * (1 - cos_a))
            N[i] /= max(np.linalg.norm(N[i]), 1e-12)
        B[i] = np.cross(T[i], N[i])

    return T, N, B


# ─────────────────────────────────────────────────────────────────────────────
# 3. Mesh construction
# ─────────────────────────────────────────────────────────────────────────────

def make_tube_mesh(pts: np.ndarray, r: float, sides: int):
    """Return (verts, faces, speeds) for a tube around the waypoint path.

    WHY explicit ring-by-ring construction vs. bpy.ops.curve: operators need
    an active context and scene; bpy.data API works headlessly, is deterministic,
    and produces predictable index order needed for the shape-key foreach_set().
    """
    T, N, B = bishop_frames(pts)
    n = len(pts)
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    # vertices: ring around each waypoint
    verts = []
    for i in range(n):
        for j in range(sides):
            v = pts[i] + r * (cos_a[j] * N[i] + sin_a[j] * B[i])
            verts.append(v)

    # faces: connecting consecutive rings with quads
    faces = []
    for i in range(n - 1):
        base_cur  = i       * sides
        base_next = (i + 1) * sides
        for j in range(sides):
            j1 = (j + 1) % sides
            faces.append((base_cur + j,
                          base_cur + j1,
                          base_next + j1,
                          base_next + j))

    # per-vertex speed (magnitude of velocity field at each waypoint, broadcast)
    speeds_raw = np.linalg.norm(
        np.array([_f(pts[i], B_PARAM) for i in range(n)]), axis=1
    )  # shape (n,)
    vmin, vmax = speeds_raw.min(), speeds_raw.max()
    speeds_norm = (speeds_raw - vmin) / max(vmax - vmin, 1e-9)
    # broadcast to all vertices in ring
    speeds = np.repeat(speeds_norm, sides)  # shape (n*sides,)

    return np.array(verts, dtype=np.float32), faces, speeds


# ─────────────────────────────────────────────────────────────────────────────
# 4. Scene assembly
# ─────────────────────────────────────────────────────────────────────────────

def clear_scene():
    """Remove all objects and meshes — idempotent for re-runs."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def build_mesh_object(name: str, verts, faces, speeds):
    """Create a Blender mesh object from raw arrays; return the object."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces)
    mesh.update()

    # FLOAT_COLOR attribute — one RGBA value per vertex
    attr = mesh.color_attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    rgba_flat = np.zeros(len(verts) * 4, dtype=np.float32)
    for vi, t in enumerate(speeds):
        c = (1.0 - t) * COBALT + t * AMBER
        rgba_flat[vi*4:vi*4+4] = [c[0], c[1], c[2], 1.0]
    attr.data.foreach_set("color", rgba_flat)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_shape_key(obj, key_name: str, b_val: float):
    """Integrate at b_val, rebuild vertex positions, store as shape key.

    WHY shape keys for parameter exploration: shape keys are stored in the
    .blend and survive GLB export with export_morph=True, letting a WebXR
    runtime blend between attractor shapes at 60 fps without re-running Python.
    The vertex COUNT must be identical, so we re-run integrate() which gives
    the same topology.
    """
    mesh = obj.data
    pts  = integrate(b_val)
    verts, _, _ = make_tube_mesh(pts, TUBE_R, TUBE_SIDES)

    sk = obj.shape_key_add(name=key_name, from_mix=False)
    coords = np.zeros(len(verts) * 3, dtype=np.float32)
    for i, v in enumerate(verts):
        coords[i*3:i*3+3] = v
    sk.data.foreach_set("co", coords)
    mesh.update()


def add_material(obj):
    """Emission material driven by the SprottN_Speed vertex-colour attribute.

    WHY Emission + BaseColor from the same attribute: GLB vertex colours land
    on the Attribute node; Emission_Strength=1.8 gives a light-painting glow in
    Eevee Next without blowing out highlights; WebXR renderers that ignore emission
    still show the attribute as vertex colour on the base mesh.
    """
    mat = bpy.data.materials.new("SprottN_Mat")
    mat.use_nodes = True
    mat.blend_method = 'OPAQUE'
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = 'GEOMETRY'

    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Emission Strength"].default_value = 1.8
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])

    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.append(mat)


def add_poi_sphere(obj):
    """Add an invisible bounding sphere at origin for WebXR poi-head detection.

    The holoflow WebXR exporter's poi-head pipeline looks for a mesh whose
    bounding radius ≤ POI_R; the sphere ensures that even if the attractor
    wanders far from origin, the poi detection range is predictable.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "poi_sphere"
    sphere.display_type = 'WIRE'
    sphere.hide_render   = True
    sphere.parent        = obj


def scale_to_unit(obj):
    """Centre and scale attractor to fit within a 1-m cube (+Y up for WebXR)."""
    mesh = obj.data
    coords = np.array([v.co for v in mesh.vertices])
    centre = coords.mean(axis=0)
    extent = (coords.max(axis=0) - coords.min(axis=0)).max()
    scale  = 0.90 / max(extent, 1e-9)   # 90 % of unit cube, leaving margin

    for v in mesh.vertices:
        v.co = (Vector(v.co) - Vector(centre)) * scale

    # propagate scale to all shape keys
    if mesh.shape_keys:
        for sk in mesh.shape_keys.key_blocks[1:]:
            sk_coords = np.array([v.co[:] for v in sk.data])
            sk_coords = (sk_coords - centre) * scale
            flat = sk_coords.flatten().astype(np.float32)
            sk.data.foreach_set("co", flat)
    mesh.update()


# ─────────────────────────────────────────────────────────────────────────────
# 5. Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    clear_scene()

    # --- Basis (canonical b=1.0) ---
    pts  = integrate(B_PARAM)
    verts, faces, speeds = make_tube_mesh(pts, TUBE_R, TUBE_SIDES)

    obj = build_mesh_object("hf_sprott_n_poi", verts, faces, speeds)

    # Basis shape key (Blender requirement: index 0 is the reference)
    obj.shape_key_add(name="Basis", from_mix=False)

    # --- Variant shape keys (b-parameter survey) ---
    # WHY b=0.7: z*=0.35, smaller offset shifts P closer to origin,
    # orbit is more compact and the spiral-eject distance is shorter.
    add_shape_key(obj, "SK_LowB",  b_val=0.70)

    # WHY b=1.5: z*=0.75, larger offset stretches the orbit in z,
    # the Shilnikov ratio changes because 2z*=1.5 raises the Jacobian coupling.
    add_shape_key(obj, "SK_HighB", b_val=1.50)

    # WHY b=2.0: z*=1.0, x*=−1.0; the linear term (2-b)λ in char poly is 0,
    # so the cubic has no λ¹ term — eigenvalue structure shifts significantly,
    # sometimes producing a topologically distinct attractor ribbon.
    add_shape_key(obj, "SK_WideB", b_val=2.00)

    scale_to_unit(obj)
    add_material(obj)
    add_poi_sphere(obj)

    # holoflow:facet flag for WebXR exporter
    obj["holoflow:facet"] = True

    print(f"[SprottN] Done. Vertices={len(obj.data.vertices)}, "
          f"Faces={len(obj.data.polygons)}, "
          f"ShapeKeys={[sk.name for sk in obj.data.shape_keys.key_blocks]}")


if __name__ == "__main__":
    main()
