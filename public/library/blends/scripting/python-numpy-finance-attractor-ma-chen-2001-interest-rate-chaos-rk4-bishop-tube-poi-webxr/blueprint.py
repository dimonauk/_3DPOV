"""
Finance Attractor — Bishop Tube Poi Head for WebXR
=====================================================
Technique: RK4 integration of the Ma–Chen finance ODE, Bishop parallel-transport
frame through 3 000 thinned waypoints, extruded circular tube with Finance_Speed
FLOAT_COLOR attribute, four shape-key parameter families.

Physical origin (Ma & Chen 2001):
  The three variables model a simplified macroeconomic market:
    x — interest rate
    y — investment demand
    z — price index
  Parameter `a` is the savings rate, `b` the cost per unit of investment, and `c`
  the elasticity of demand with respect to the price index.  Typical monetary
  policy targets move all three variables; the nonlinear coupling between them
  can produce deterministic chaos — unpredictable despite fully known rules.

  The divergence ∇·F = (y − a) + (−b) + (−c) = y − (a+b+c) is position-
  dependent.  Near the two chaotic equilibria P± (y ≈ a+1/c ≈ 1.57) the
  effective divergence ≈ −1.03, confirming dissipation.  Near P₀=(0,5,0)
  the divergence is positive, so P₀ is unstable — the economy is repelled from
  the high-investment-demand fixed point back into the chaotic trading region.

References:
  Ma, J. & Chen, G. (2001). Study for the bifurcation topological structure and
  the global complicated character of a kind of non-linear finance system (I).
  Applied Mathematics and Mechanics 22(11):1240–1251.
  Mathematical equations: public domain (mathematical fact, not copyrightable).

  Chen, W.-C. (2008). Nonlinear dynamics and chaos in a fractional-order financial
  system. Chaos, Solitons & Fractals 36(5):1305–1314.  DOI: 10.1016/j.chaos.2006.08.005.

Licence: CC0 — release all rights.
Blender: 5.1  |  Python: 3.11+  |  numpy required (bundled with Blender)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── parameters ──────────────────────────────────────────────────────────────
# Canonical Ma–Chen 2001 parameters — chaotic regime
A = 0.9   # savings rate        (higher A → more savings, damps investment demand)
B = 0.2   # investment cost     (higher B → weaker demand oscillations)
C = 1.5   # price elasticity    (higher C → faster z-recovery toward equilibrium)

DT      = 0.01        # RK4 time step
N_TOTAL = 90_000      # total integration steps
THIN    = 30          # keep 1 in THIN → 3 000 waypoints
BURN_IN = 3_000       # discard transient before recording

TUBE_R     = 0.048    # tube cross-section radius (m)
TUBE_SIDES = 8        # polygon count around tube circumference
POI_R      = 0.090    # approximate poi-head bounding sphere (informational)

OBJ_NAME   = "hf_finance_attractor_poi"
IC         = np.array([0.1, 2.0, 0.0])   # start near basin of attraction

# ─── ODE ─────────────────────────────────────────────────────────────────────
def _f(s: np.ndarray, a: float = A, b: float = B, c: float = C) -> np.ndarray:
    """Finance vector field.
    ẋ = z + (y − a)·x   — interest rate: driven by price & excess demand
    ẏ = 1 − b·y − x²    — investment demand: unit inflow minus cost minus speculation
    ż = −x − c·z        — price: deflated by high rates, decays at rate c
    Divergence: ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z = (y − a) − b − c  (position-dependent)
    """
    x, y, z = s
    return np.array([
        z + (y - a) * x,
        1.0 - b * y - x * x,
        -x - c * z,
    ])


def _rk4(s: np.ndarray, dt: float, **kw) -> np.ndarray:
    k1 = _f(s, **kw)
    k2 = _f(s + 0.5 * dt * k1, **kw)
    k3 = _f(s + 0.5 * dt * k2, **kw)
    k4 = _f(s + dt * k3, **kw)
    return s + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def integrate(a: float = A, b: float = B, c: float = C) -> np.ndarray:
    """Return (N_WP, 3) float64 array of thinned waypoints."""
    N_WP = N_TOTAL // THIN
    pts  = np.empty((N_WP, 3), dtype=np.float64)
    s    = IC.copy()
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a=a, b=b, c=c)
    for i in range(N_WP):
        for _ in range(THIN):
            s = _rk4(s, DT, a=a, b=b, c=c)
        pts[i] = s
    return pts


# ─── Bishop parallel-transport frame ─────────────────────────────────────────
def bishop_tube(pts: np.ndarray, r: float = TUBE_R, sides: int = TUBE_SIDES):
    """
    Build a smooth tube around an open polyline via Bishop (1975) parallel-transport.
    Returns (verts [N*sides, 3], faces [(N-1)*sides quads]).
    WHY Bishop not Frenet: Frenet normals flip at inflection points and produce
    twisted seams.  Bishop transport rotates the normal minimally so the seam is
    always continuous even through tight bends.
    """
    n = len(pts)
    # Tangents — central differences, forward/back at ends
    T = np.empty_like(pts)
    T[0]  = pts[1]  - pts[0]
    T[-1] = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms

    # Seed the first normal: find a vector not parallel to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([0.0, 1.0, 0.0])
    N0 = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    # Rodrigues parallel transport
    Ns = np.empty_like(pts)
    Ns[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        sa   = np.linalg.norm(axis)
        ca   = np.clip(np.dot(T[i - 1], T[i]), -1.0, 1.0)
        if sa < 1e-10:
            Ns[i] = Ns[i - 1]
        else:
            axis /= sa
            Ns[i] = (ca * Ns[i - 1]
                     + sa * np.cross(axis, Ns[i - 1])
                     + (1.0 - ca) * np.dot(axis, Ns[i - 1]) * axis)
    Bs = np.cross(T, Ns)

    # Build rings
    angles  = np.linspace(0.0, 2.0 * np.pi, sides, endpoint=False)
    cos_a   = np.cos(angles)
    sin_a   = np.sin(angles)
    verts   = np.empty((n * sides, 3))
    for i in range(n):
        base = pts[i]
        for s, (ca, sa) in enumerate(zip(cos_a, sin_a)):
            verts[i * sides + s] = base + r * (ca * Ns[i] + sa * Bs[i])

    # Quad faces: wrap around circumference, open at both ends of tube
    faces = []
    for i in range(n - 1):
        for s in range(sides):
            sn = (s + 1) % sides
            faces.append((
                i * sides + s,
                (i + 1) * sides + s,
                (i + 1) * sides + sn,
                i * sides + sn,
            ))
    return verts, faces


# ─── colour attribute ─────────────────────────────────────────────────────────
COBALT = np.array([0.03, 0.15, 0.58, 1.0])
AMBER  = np.array([1.00, 0.65, 0.00, 1.0])

def speed_colors(pts: np.ndarray, a: float, b: float, c: float, sides: int = TUBE_SIDES) -> np.ndarray:
    """Finance_Speed: |ẋ, ẏ, ż| normalised cobalt→amber, repeated for each ring vertex."""
    speeds = np.linalg.norm(np.array([_f(p, a=a, b=b, c=c) for p in pts]), axis=1)
    t = (speeds - speeds.min()) / (speeds.max() - speeds.min() + 1e-30)
    rgba = COBALT[None, :] + t[:, None] * (AMBER - COBALT)[None, :]
    return np.repeat(rgba, sides, axis=0)   # each waypoint → TUBE_SIDES verts


# ─── mesh builder ─────────────────────────────────────────────────────────────
def build_mesh(pts: np.ndarray, a: float, b: float, c: float) -> bpy.types.Object:
    verts, faces = bishop_tube(pts)
    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        bm.faces.new([bm_verts[i] for i in f])

    me = bpy.data.meshes.new(OBJ_NAME)
    bm.to_mesh(me)
    bm.free()

    # Finance_Speed FLOAT_COLOR on POINT domain
    col_attr = me.color_attributes.new(name="Finance_Speed", type="FLOAT_COLOR", domain="POINT")
    rgba = speed_colors(pts, a, b, c)
    col_attr.data.foreach_set("color", rgba.ravel())

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ─── shape keys ───────────────────────────────────────────────────────────────
PRESETS = {
    "Basis":       dict(a=0.9, b=0.2, c=1.5),   # canonical chaos: two asymmetric scrolls
    "SK_Thrift":   dict(a=0.4, b=0.2, c=1.5),   # low savings: tighter interest-rate orbit
    "SK_LowCost":  dict(a=0.9, b=0.1, c=1.5),   # cheap investment: looser demand cycles
    "SK_Rigid":    dict(a=0.9, b=0.2, c=0.8),   # inelastic price: expanded z-excursion
}


def add_shape_keys(ob: bpy.types.Object) -> None:
    """Compute waypoints for each preset and store as relative shape keys."""
    me = ob.data
    ob.shape_key_add(name="Basis", from_mix=False)
    basis_key = me.shape_keys.reference_key

    for key_name, params in list(PRESETS.items())[1:]:
        pts_k    = integrate(**params)
        v_k, _   = bishop_tube(pts_k)
        sk       = ob.shape_key_add(name=key_name, from_mix=False)
        # WHY list comprehension not foreach_set: shape-key co is a
        # bpy_prop_collection of ShapeKeyPoint, not a flat buffer.
        for i, co in enumerate(v_k):
            sk.data[i].co = Vector(co)


# ─── material ─────────────────────────────────────────────────────────────────
def make_material(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("Finance_Attractor_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Finance_Speed"
    attr.attribute_type = "GEOMETRY"

    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value  = 0.22
    bsdf.inputs["Metallic"].default_value   = 0.50
    bsdf.inputs["Emission Strength"].default_value = 1.6

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    ob.data.materials.append(mat)


# ─── holoflow metadata ────────────────────────────────────────────────────────
def set_custom_props(ob: bpy.types.Object) -> None:
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:slug"]     = (
        "python-numpy-finance-attractor-ma-chen-2001-interest-rate-chaos"
        "-rk4-bishop-tube-poi-webxr"
    )


# ─── transform & export prep ──────────────────────────────────────────────────
def apply_transform(ob: bpy.types.Object) -> None:
    """Rotate −90° on X so Blender +Z maps to glTF +Y-up."""
    import math
    ob.rotation_euler = (-math.pi / 2.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)


# ─── main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    # Clear existing mesh objects with this name
    for o in list(bpy.data.objects):
        if o.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(o, do_unlink=True)

    pts = integrate()          # Basis waypoints
    ob  = build_mesh(pts, A, B, C)
    add_shape_keys(ob)
    make_material(ob)
    set_custom_props(ob)
    apply_transform(ob)
    print(f"[finance-attractor] built {OBJ_NAME}: "
          f"{len(ob.data.vertices)} verts, "
          f"{len(ob.data.polygons)} faces, "
          f"{len(ob.data.shape_keys.key_blocks)} shape keys")


if __name__ == "__main__":
    main()
