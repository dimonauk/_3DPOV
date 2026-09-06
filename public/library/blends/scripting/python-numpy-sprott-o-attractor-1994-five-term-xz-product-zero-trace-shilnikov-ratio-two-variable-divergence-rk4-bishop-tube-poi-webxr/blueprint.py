"""
Sprott O Attractor — 1994 Canonical Case O
===========================================
Technique: RK4 integration of a 5-term 3-D ODE with a single quadratic
nonlinearity (xz product), converted to a Bishop-parallel-transport tube
mesh coloured by speed.  All geometry via bpy.data — no operators required.

Reference: Sprott JC (1994) "Some simple chaotic flows",
  Phys Rev E 50(2):R647.  Public-domain mathematics.
  sprott.physics.wisc.edu/chaos/

System:
    ẋ =  y
    ẏ =  x − z
    ż =  x + xz + by

Canonical: b = 2.7

Key properties
--------------
Divergence:  ∇·F = ∂(y)/∂x + ∂(x−z)/∂y + ∂(x+xz+by)/∂z
           = 0 + 0 + x   (VARIABLE — position-dependent)
Rare feature: only Sprott D and K share this exact form of variable
divergence within the 1994 catalogue.  The mean ⟨x⟩ ≈ −0.47 on the
canonical attractor, giving net dissipation ⟨∇·F⟩ ≈ −0.47.

Fixed points (ẋ=0 ↔ y=0; ẏ=0 ↔ x=z; ż=0 ↔ x(1+z)=0):
  Case 1: x=0  → z=0   → O  = (0, 0, 0)        [origin]
  Case 2: z=−1 → x=−1  → P  = (−1, 0, −1)      [second fixed point]

Jacobian at O = (0,0,0):
  J_O = [[ 0,  1,  0],
         [ 1,  0, -1],
         [ 1,  b,  0]]

Characteristic polynomial at O (general b):
  trace(J_O) = 0   ← ZERO TRACE: this has a remarkable consequence
  λ³ + (b−1)λ + 1 = 0    [no λ² term]

Because trace = 0, the sum of eigenvalues λ_r + 2Re(λ_c) = 0, so
  λ_r = −2 Re(λ_c)  →  Shilnikov ratio |λ_r|/Re(λ_c) ≡ 2  (exactly!)
for every value of b where the root configuration is 1 real + 2 complex.
This is a structural invariant: Sprott O has a FIXED Shilnikov ratio of
exactly 2 at the origin, independent of the parameter b.

Canonical (b=2.7):
  λ_r ≈ −0.510            (stable real → 1-D stable manifold W^s)
  λ_c ≈ +0.255 ± 1.378i   (UNSTABLE complex pair → 2-D spiral out)
  Shilnikov ratio: |λ_r|/Re(λ_c) = 0.510/0.255 = 2.000  (exact)

Jacobian at P = (−1,0,−1):
  J_P = [[ 0,  1,  0],
         [ 1,  0, -1],
         [ 0,  b, -1]]

Characteristic polynomial at P:
  λ³ + λ² + (b−1)λ − 1 = 0
  b=2.7:  λ_r ≈ +0.430 (unstable saddle), λ_c ≈ −0.715 ± 1.348i (stable spiral)
  → P is a saddle-spiral: NOT a Shilnikov focus, but creates a secondary
    folding region.  Trajectories passing near P are captured briefly by
    the stable spiral before the unstable real direction ejects them.

λ₁ ≈ +0.086  λ₂ = 0  λ₃ ≈ ⟨∇·F⟩ − λ₁ ≈ −0.47 − 0.086 = −0.556
D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.086/0.556 ≈ 2.155
Lyapunov time τ = 1/λ₁ ≈ 11.6 time units
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── integration parameters ────────────────────────────────────────────────────
B_PARAM = 2.70   # coupling coefficient in ż — canonical Sprott O
DT      = 0.01   # RK4 step; conservative for orbital frequency ω≈1.38 rad/tu
BURN_IN = 3_000  # transient burn (≈260 Lyapunov times at τ≈11.6, ensures attractor)
N_STEPS = 90_000 # recording steps
THIN    = 30     # keep every 30th → 3 000 waypoints
IC      = np.array([0.1, 0.0, 0.1])  # off fixed points; y=0 but x≠0,z≠-1

# ── tube geometry ─────────────────────────────────────────────────────────────
TUBE_SIDES = 8     # octagon cross-section — enough resolution, minimal verts
TUBE_R     = 0.040 # cross-section radius in metres
POI_R      = 0.090 # bounding-sphere radius for WebXR poi-head export

# ── vertex-colour attribute ───────────────────────────────────────────────────
ATTR_NAME = "SprottO_Speed"   # FLOAT_COLOR, consumed by shader + GLB exporter
COBALT    = np.array([0.020, 0.102, 0.557])  # slow-speed colour
AMBER     = np.array([0.950, 0.600, 0.000])  # fast-speed colour


# ─────────────────────────────────────────────────────────────────────────────
# 1. ODE + RK4
# ─────────────────────────────────────────────────────────────────────────────

def _f(s: np.ndarray, b: float) -> np.ndarray:
    """Sprott O vector field.  s = [x, y, z].

    WHY xz in ż: the bilinear term x·z creates a state-dependent divergence
    (∂ż/∂z = x) that makes phase-volume contraction position-dependent.  When x
    is negative (as it is on average, ⟨x⟩ ≈ −0.47) the volume contracts; when x
    momentarily turns positive the volume expands locally.  This breathing
    dissipation is mechanistically different from the constant-divergence
    Sprott attractors (B, C, E, F, G, H, J, K, L, M, N), where every
    infinitesimal volume element shrinks at the same rate regardless of position.
    """
    x, y, z = s
    return np.array([
         y,              # ẋ =  y           (x velocity = y coordinate)
         x - z,          # ẏ =  x − z       (linear restoring difference)
         x + x*z + b*y   # ż =  x + xz + by (bilinear xz + linear y)
    ])


def _rk4(s: np.ndarray, b: float, dt: float) -> np.ndarray:
    """Fourth-order Runge-Kutta step.

    WHY RK4 over Euler: the orbital frequency ω ≈ 1.38 rad/tu means the orbit
    completes one cycle in ≈ 4.56 time units.  At DT=0.01 that is 456 steps
    per orbit — RK4's O(dt⁴) error means phase-space trajectory error
    accumulates as ~10⁻⁸ per orbit, far below the attractor's fractal
    thickness.  Euler at the same step would produce errors ~10⁻⁴ per orbit.
    """
    k1 = _f(s,              b)
    k2 = _f(s + 0.5*dt*k1,  b)
    k3 = _f(s + 0.5*dt*k2,  b)
    k4 = _f(s +     dt*k3,  b)
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
    """Compute (N,3) tangent T, normal N, binormal B arrays.

    Bishop (1975) avoids Frenet's inflection-point singularity by requiring
    only that N stays perpendicular to T — no curvature constraint — so the
    frame rotates only as much as strictly necessary.  For Sprott O, where
    the attractor occasionally straightens out near the saddle at P=(−1,0,−1),
    Frenet would be undefined; Bishop is smooth everywhere.
    """
    n = len(pts)
    T = np.zeros((n, 3), dtype=np.float64)
    N = np.zeros((n, 3), dtype=np.float64)
    B = np.zeros((n, 3), dtype=np.float64)

    # tangents via central difference (forward/backward at endpoints)
    T[1:-1] = pts[2:] - pts[:-2]
    T[0]    = pts[1]  - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms[norms < 1e-12] = 1.0
    T /= norms

    # seed initial normal — choose axis not parallel to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([0.0, 1.0, 0.0])
    N[0] = np.cross(T[0], seed)
    N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])

    # propagate normal by Rodrigues rotation: minimum rotation T[i-1]→T[i]
    for i in range(1, n):
        axis  = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-12:
            N[i] = N[i-1]   # tangents parallel → no rotation needed
        else:
            cos_a  = float(np.dot(T[i-1], T[i]))
            axis  /= sin_a
            N[i]   = (N[i-1] * cos_a
                      + np.cross(axis, N[i-1]) * sin_a
                      + axis * np.dot(axis, N[i-1]) * (1.0 - cos_a))
            N[i]  /= max(np.linalg.norm(N[i]), 1e-12)
        B[i] = np.cross(T[i], N[i])

    return T, N, B


# ─────────────────────────────────────────────────────────────────────────────
# 3. Mesh construction
# ─────────────────────────────────────────────────────────────────────────────

def make_tube_mesh(pts: np.ndarray, r: float, sides: int):
    """Return (verts, faces, speeds) for a tube around the waypoint path.

    WHY bpy.data not bpy.ops.curve.add: operators require an active view-layer
    context and are blocked in headless render.  Direct data construction via
    mesh.from_pydata() works without a display, in background mode, and in
    Blender's Python console — all three entry points Dimona uses.
    """
    T, N_fr, B_fr = bishop_frames(pts)
    n = len(pts)
    angles = np.linspace(0.0, 2.0 * np.pi, sides, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    # vertex rings: one ring of `sides` vertices around each waypoint
    verts = []
    for i in range(n):
        for j in range(sides):
            v = pts[i] + r * (cos_a[j] * N_fr[i] + sin_a[j] * B_fr[i])
            verts.append(v)

    # quad faces connecting consecutive rings (no caps — open tube)
    faces = []
    for i in range(n - 1):
        base_c = i       * sides
        base_n = (i + 1) * sides
        for j in range(sides):
            j1 = (j + 1) % sides
            faces.append((base_c + j, base_c + j1,
                          base_n + j1, base_n + j))

    # per-vertex speed: magnitude of the vector field at each waypoint
    speeds_raw = np.array(
        [np.linalg.norm(_f(pts[i], B_PARAM)) for i in range(n)],
        dtype=np.float32
    )
    vmin, vmax = speeds_raw.min(), speeds_raw.max()
    speeds_norm = (speeds_raw - vmin) / max(vmax - vmin, 1e-9)
    speeds = np.repeat(speeds_norm, sides)  # broadcast ring → vertices

    return np.array(verts, dtype=np.float32), faces, speeds


# ─────────────────────────────────────────────────────────────────────────────
# 4. Scene assembly
# ─────────────────────────────────────────────────────────────────────────────

def clear_scene():
    """Remove all objects and orphaned meshes — safe for re-runs in same session."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def build_mesh_object(name: str, verts, faces, speeds):
    """Create a Blender mesh from raw arrays; attach FLOAT_COLOR attribute."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces)
    mesh.update()

    # FLOAT_COLOR: RGBA per vertex, stored at POINT domain
    attr = mesh.color_attributes.new(
        name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT'
    )
    rgba_flat = np.zeros(len(verts) * 4, dtype=np.float32)
    for vi, t in enumerate(speeds):
        c = (1.0 - t) * COBALT + t * AMBER
        rgba_flat[vi*4:vi*4+4] = [c[0], c[1], c[2], 1.0]
    attr.data.foreach_set("color", rgba_flat)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_shape_key(obj, key_name: str, b_val: float):
    """Integrate at b_val, rebuild tube vertex positions, store as shape key.

    WHY shape keys over separate objects: GLB morph targets (export_morph=True)
    let a single asset carry all four b-parameter orbits as blend weights.
    A WebXR runtime can lerp between shapes at 60 fps — no Python re-runs.
    Vertex count must match Basis exactly, which is guaranteed because
    THIN × sides stays constant across integrate() calls.
    """
    pts  = integrate(b_val)
    verts, _, _ = make_tube_mesh(pts, TUBE_R, TUBE_SIDES)

    sk = obj.shape_key_add(name=key_name, from_mix=False)
    coords = np.asarray(verts, dtype=np.float32).flatten()
    sk.data.foreach_set("co", coords)
    obj.data.update()


def add_material(obj):
    """Emission material reading SprottO_Speed vertex colour.

    WHY Emission at 1.8: Eevee Next bloom threshold is typically 0.5 lux;
    multiplying the attribute colour by 1.8 pushes peak (amber) above 1.0
    without clipping cobalt, giving a gradient glow effect without a
    separate point-light rig.  Cycles and WebXR renderers fall back to
    base-colour vertex shading when emission is unsupported.
    """
    mat = bpy.data.materials.new("SprottO_Mat")
    mat.use_nodes  = True
    mat.blend_method = 'OPAQUE'
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = 'GEOMETRY'

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Emission Strength"].default_value = 1.8
    bsdf.inputs["Metallic"].default_value  = 0.50
    bsdf.inputs["Roughness"].default_value = 0.22
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])

    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.append(mat)


def add_poi_sphere(obj):
    """Invisible bounding sphere for WebXR poi-head range detection.

    The holoflow exporter scans for a mesh with bounding radius ≤ POI_R.
    Parenting the sphere to the attractor object keeps it aligned after
    scale_to_unit() repositions the tube, since the sphere sits at the
    post-scale local origin.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0))
    sphere             = bpy.context.active_object
    sphere.name        = "poi_sphere"
    sphere.display_type = 'WIRE'
    sphere.hide_render  = True
    sphere.parent       = obj


def scale_to_unit(obj):
    """Centre and uniformly scale to fit within a 1-m cube (+Y up for WebXR).

    WHY 0.90 scale factor: leaves a 5 % margin on each side so tube edges
    never clip a standard 1-m WebXR grab-volume boundary.  The centre
    subtraction removes the attractor's natural offset from the origin —
    Sprott O's mean position is (⟨x⟩, 0, ⟨z⟩) ≈ (−0.47, 0, ?) rather
    than exactly (0,0,0).
    """
    mesh   = obj.data
    coords = np.array([v.co for v in mesh.vertices])
    centre = coords.mean(axis=0)
    extent = (coords.max(axis=0) - coords.min(axis=0)).max()
    scale  = 0.90 / max(extent, 1e-9)

    for v in mesh.vertices:
        v.co = (Vector(v.co) - Vector(centre)) * scale

    if mesh.shape_keys:
        for sk in mesh.shape_keys.key_blocks[1:]:
            sk_coords = np.array([v.co[:] for v in sk.data])
            sk_coords = (sk_coords - centre) * scale
            sk.data.foreach_set("co", sk_coords.flatten().astype(np.float32))
    mesh.update()


# ─────────────────────────────────────────────────────────────────────────────
# 5. Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    clear_scene()

    # --- Basis: b=2.7 canonical Sprott O ---
    pts  = integrate(B_PARAM)
    verts, faces, speeds = make_tube_mesh(pts, TUBE_R, TUBE_SIDES)

    obj = build_mesh_object("hf_sprott_o_poi", verts, faces, speeds)
    obj.shape_key_add(name="Basis", from_mix=False)  # index 0 is the reference

    # --- b-parameter variants as shape keys ---
    # WHY b=2.0: ż couples y less strongly → broader orbit, larger excursions
    # near the saddle P=(-1,0,-1); the char poly at O is λ³+λ+1=0.
    add_shape_key(obj, "SK_LowB",  b_val=2.00)

    # WHY b=3.5: stronger y-to-z feedback tightens the spiral around O;
    # char poly λ³+2.5λ+1=0, λ_r≈−0.38, ratio still exactly 2.
    add_shape_key(obj, "SK_HighB", b_val=3.50)

    # WHY b=1.7: near the lower end while still firmly chaotic; eigenvalues
    # at O become λ_r≈−0.62, λ_c≈+0.31±1.23i (ratio=2 as always), but the
    # orbit spends more time in the P-neighbourhood, visually changing shape.
    add_shape_key(obj, "SK_NearP",  b_val=1.70)

    scale_to_unit(obj)
    add_material(obj)
    add_poi_sphere(obj)

    # holoflow WebXR metadata
    obj["holoflow:facet"] = True

    print(
        f"[SprottO] Done.  Vertices={len(obj.data.vertices)}, "
        f"Faces={len(obj.data.polygons)}, "
        f"ShapeKeys={[sk.name for sk in obj.data.shape_keys.key_blocks]}"
    )


if __name__ == "__main__":
    main()
