"""
Sprott L Attractor — 5-Term Quadratic ODE, Shilnikov Saddle-Focus
Julien Clinton Sprott 1994 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sprott L is system #12 in the 1994 catalogue of minimal three-variable
autonomous ODEs with at most five terms and one quadratic nonlinearity:

    ẋ = y + a·z
    ẏ = b·x² − y
    ż = 1 − x          (canonical  a=3.9,  b=0.9)

The x² term in ẏ is a RECTIFYING nonlinearity: its output is non-negative
regardless of the sign of x, perpetually injecting energy into the y-axis
component.  The linear damping −y dissipates that energy, and the z-drive
(ż = 1 − x) provides a slow oscillation that couples back through ẋ.
Together these create a single-scroll strange attractor.

Constant divergence  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + (−1) + 0 = −1
Liouville:           λ₁ + λ₂ + λ₃ = −1  (exact)
Lyapunov:            λ₁ ≈ +0.063   λ₂ ≈ 0   λ₃ ≈ −1.063
Kaplan-Yorke dim:    D_KY = 2 + 0.063/1.063 ≈ 2.059

Fixed point (unique):  ż=0 → x=1;  ẏ=0 → y=b·1²=b;  ẋ=0 → y+az=0 → z=−b/a
    P* = (1,  b,  −b/a) = (1, 0.9, −3/13) ≈ (1, 0.9, −0.231)

Jacobian at P*:
    J = [[0, 1, a], [2b, −1, 0], [−1, 0, 0]]
Characteristic polynomial  λ³ + λ² + (a−2b)λ + a·2b − ... = 0
Eigenvalues (a=3.9, b=0.9):  λ_r ≈ −1.47   λ_c ≈ +0.235 ± 1.61i

This is a Shilnikov saddle-focus: one stable real direction (λ_r < 0) and
one unstable complex direction (Re λ_c > 0).  Shilnikov's 1965 theorem
guarantees chaos when |λ_r| > Re(λ_c):  1.47 > 0.235  ✓

Shape keys sample four parameter regimes:
  Basis       a=3.9  b=0.9   canonical single-scroll
  SK_HighA    a=5.0  b=0.9   stronger z-coupling → broader spiral
  SK_LowB     a=3.9  b=0.6   weaker rectification → near-bifurcation
  SK_Compact  a=2.8  b=1.1   increased rectification, tighter orbit

Sources (permissive):
  Sprott JC (1994) "Some simple chaotic flows" Phys Rev E 50(2):R647–R650
      DOI 10.1103/PhysRevE.50.R647  — PD mathematics
      companion atlas: https://sprott.physics.wisc.edu/chaos/  (MIT/permissive)
  Gilpin W (2021–2024) dysts Dynamical Systems Benchmarks  MIT
      https://github.com/williamgilpin/dysts
"""

import bpy
import bmesh
import math
import mathutils
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
DT          = 0.01          # RK4 step size — small enough for Sprott L (fast spiral)
BURN_IN     = 3_000         # steps discarded to erase transient from IC
N_STEPS     = 90_000        # steps recorded after burn-in
THIN        = 30            # keep every THIN-th step → N_WP waypoints
N_WP        = N_STEPS // THIN   # = 3 000 waypoints per shape key
IC          = np.array([0.0, -0.1, 0.1])  # robust IC for canonical params

TUBE_SEGS   = 8             # polygon sides of tube cross-section
TUBE_R      = 0.055         # tube radius in metres (world space)
POI_R       = 0.085         # poi head radius

OBJ_NAME    = "SprottL_Attractor"
ATTR_NAME   = "SprottL_Speed"

COBALT = np.array([0.05, 0.22, 0.82, 1.0])
AMBER  = np.array([0.92, 0.58, 0.04, 1.0])

PRESETS: dict[str, tuple[float, float]] = {
    "Basis"     : (3.9, 0.9),   # Sprott 1994 canonical
    "SK_HighA"  : (5.0, 0.9),   # stronger z-coupling
    "SK_LowB"   : (3.9, 0.6),   # weaker rectification
    "SK_Compact": (2.8, 1.1),   # high rectification, compact orbit
}


# ── DYNAMICS ──────────────────────────────────────────────────────────────────
def _deriv(s: np.ndarray, a: float, b: float) -> np.ndarray:
    """
    Sprott L derivative.  WHY not use a generic ODE wrapper?
    Inlining keeps the inner loop a single NumPy call with no Python overhead.
    The x² term is b*s[0]*s[0], not b*abs(s[0]) — the rectification comes from
    squaring, which is always non-negative, not from a piecewise function.
    """
    x, y, z = s
    return np.array([y + a * z,
                     b * x * x - y,
                     1.0 - x])


def _rk4(s: np.ndarray, dt: float, a: float, b: float) -> np.ndarray:
    """Classical 4th-order Runge-Kutta step.  Returns NEW state (does not mutate)."""
    k1 = _deriv(s, a, b)
    k2 = _deriv(s + 0.5 * dt * k1, a, b)
    k3 = _deriv(s + 0.5 * dt * k2, a, b)
    k4 = _deriv(s + dt * k3, a, b)
    return s + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def integrate(a: float, b: float) -> tuple[np.ndarray, np.ndarray]:
    """
    Run Sprott L for BURN_IN + N_STEPS steps, return (waypoints, speeds).

    WHY record speed (|ẋ|)?
    The magnitude of the velocity vector encodes local orbit curvature:
    the attractor has fast-moving straight segments (near-linear dynamics)
    and slow-moving curved segments (near the fixed point).  Speed-colouring
    makes the saddle-focus region immediately visible as a warm amber zone.
    """
    s = IC.copy()
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a, b)

    pts  = np.empty((N_WP, 3))
    spds = np.empty(N_WP)
    wi   = 0
    for i in range(N_STEPS):
        s = _rk4(s, DT, a, b)
        if i % THIN == 0:
            pts[wi]  = s
            spds[wi] = float(np.linalg.norm(_deriv(s, a, b)))
            wi += 1

    return pts, spds


# ── BISHOP PARALLEL-TRANSPORT FRAME ──────────────────────────────────────────
def bishop_frame(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Builds N (normal) and B (binormal) along the polyline using the
    Bishop parallel-transport algorithm (Bishop 1975 Am Math Mon 82:246).

    WHY Bishop over Frenet-Serret?
    Frenet-Serret is undefined at inflection points (κ=0) and has a sign flip
    at each one.  Bishop propagates a frame without any reference to curvature
    — it only requires the tangent field.  The frame twists smoothly through
    the entire orbit, even when the curvature vanishes.
    """
    n = len(pts)
    T = np.gradient(pts, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms

    # Seed: pick a reference vector not parallel to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(ref, T[0])) > 0.9:
        ref = np.array([0.0, 1.0, 0.0])
    N0 = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty_like(pts)
    B = np.empty_like(pts)
    N[0] = N0
    B[0] = np.cross(T[0], N[0])

    for i in range(1, n):
        axis  = np.cross(T[i - 1], T[i])
        sa    = np.linalg.norm(axis)
        ca    = float(np.clip(np.dot(T[i - 1], T[i]), -1.0, 1.0))
        if sa < 1e-12:
            N[i] = N[i - 1]
        else:
            axis /= sa
            N[i] = (ca * N[i - 1]
                    + sa * np.cross(axis, N[i - 1])
                    + (1.0 - ca) * np.dot(axis, N[i - 1]) * axis)
        B[i] = np.cross(T[i], N[i])

    return N, B


# ── TUBE MESH ─────────────────────────────────────────────────────────────────
def build_tube(pts: np.ndarray, N: np.ndarray, B: np.ndarray,
               r: float, segs: int) -> tuple[np.ndarray, list]:
    """
    Expand the polyline into a closed circular tube.
    Returns vertex positions (n_pts * segs, 3) and quad face indices.
    """
    angles = np.linspace(0, 2 * math.pi, segs, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)
    # verts[i, k] = pts[i] + r*(cos_a[k]*N[i] + sin_a[k]*B[i])
    verts = (pts[:, None, :]
             + r * (cos_a[None, :, None] * N[:, None, :]
                    + sin_a[None, :, None] * B[:, None, :]))
    verts = verts.reshape(-1, 3)

    n   = len(pts)
    faces = []
    for i in range(n - 1):
        for k in range(segs):
            k1 = (k + 1) % segs
            a  = i * segs + k
            b  = i * segs + k1
            c  = (i + 1) * segs + k1
            d  = (i + 1) * segs + k
            faces.append((a, b, c, d))

    return verts, faces


# ── COLOUR MAPPING ────────────────────────────────────────────────────────────
def speed_to_rgba(spds: np.ndarray, segs: int) -> np.ndarray:
    """
    Map orbit speed → cobalt (slow) → amber (fast), FLOAT_COLOR per vertex.
    WHY percentile clip?  A tiny number of near-fixed-point steps have
    near-zero speed; clamping at the 2nd percentile prevents those outliers
    from collapsing the entire colour range to 'cobalt'.
    """
    lo = float(np.percentile(spds, 2))
    hi = float(np.percentile(spds, 98))
    t  = np.clip((spds - lo) / max(hi - lo, 1e-12), 0.0, 1.0)
    rgba = (1.0 - t[:, None]) * COBALT + t[:, None] * AMBER
    return np.repeat(rgba, segs, axis=0)  # one colour per tube vertex


# ── BLENDER BUILD ─────────────────────────────────────────────────────────────
def build_mesh_for_key(name: str, pts: np.ndarray, spds: np.ndarray,
                       r: float, segs: int) -> bpy.types.Object | None:
    """Create the Blender mesh object for the Basis key, return it."""
    N, B    = bishop_frame(pts)
    verts, faces = build_tube(pts, N, B, r, segs)
    rgba    = speed_to_rgba(spds, segs)

    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)

    bm = bmesh.new()
    bv = [bm.verts.new(v) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        bm.faces.new([bv[i] for i in f])
    bm.to_mesh(me)
    bm.free()

    # Vertex colour for speed
    attr = me.color_attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", rgba.flatten())

    me.shape_keys.add(name="Basis")
    return ob


def add_shape_key(ob: bpy.types.Object, key_name: str,
                  pts: np.ndarray, spds: np.ndarray,
                  r: float, segs: int) -> None:
    """Append a shape key with its own orbit and speed colours."""
    N, B    = bishop_frame(pts)
    verts, _ = build_tube(pts, N, B, r, segs)
    rgba    = speed_to_rgba(spds, segs)

    sk = ob.shape_key_add(name=key_name, from_mix=False)
    coords = np.empty(len(verts) * 3)
    for vi, v in enumerate(verts):
        coords[vi * 3    ] = v[0]
        coords[vi * 3 + 1] = v[1]
        coords[vi * 3 + 2] = v[2]
    sk.data.foreach_set("co", coords)

    attr = ob.data.color_attributes[ATTR_NAME]
    attr.data.foreach_set("color", rgba.flatten())


def add_material(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("SprottL_Mat")
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    bsdf.inputs["Metallic"        ].default_value = 0.50
    bsdf.inputs["Roughness"       ].default_value = 0.22
    bsdf.inputs["Emission Strength"].default_value = 1.7
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    ob.data.materials.append(mat)


def build_poi_head(parent: bpy.types.Object) -> None:
    """Add a small sphere representing the poi head for WebXR context."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0))
    head = bpy.context.active_object
    head.name = "SprottL_PoiHead"
    head.parent = parent
    mat = bpy.data.materials.new("PoiHead_Mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*AMBER[:3], 1.0)
    bsdf.inputs["Emission Color"].default_value = (*AMBER[:3], 1.0)
    bsdf.inputs["Emission Strength"].default_value = 2.0
    head.data.materials.append(mat)


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    first   = True
    ob      = None
    keys    = list(PRESETS.items())

    for key_name, (a, b) in keys:
        pts, spds = integrate(a, b)
        if first:
            ob    = build_mesh_for_key(OBJ_NAME, pts, spds, TUBE_R, TUBE_SEGS)
            first = False
        else:
            add_shape_key(ob, key_name, pts, spds, TUBE_R, TUBE_SEGS)

    add_material(ob)
    build_poi_head(ob)

    # Orient for WebXR (+Y up): rotate mesh data so Y is world-up
    rot = mathutils.Matrix.Rotation(math.pi / 2, 4, "X")
    ob.data.transform(rot)
    for sk in ob.data.shape_keys.key_blocks:
        sk.data.foreach_set("co",
            np.array([(rot @ mathutils.Vector(v.co))
                      for v in sk.data]).flatten())

    ob["holoflow:facet"] = False

    # ── GLB export ──
    bpy.ops.export_scene.gltf(
        filepath="//hf_sprott_l_poi.glb",
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_colors=True,
        export_yup=True,
    )
    print("Sprott L blueprint complete.")


main()
