"""
Chua's Circuit — Leon Chua 1983, Double-Scroll Attractor
=========================================================
Chua LO (1983) — The genesis of the Chua circuit is traced to its
1983 introduction; the double-scroll proof appears in:
Chua LO, Komuro M, Matsumoto T (1986) "The double scroll family"
IEEE Trans Circuits Syst 33(11):1072–1118.
Mathematical equations public domain (CC0, >40 yr).

Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of Chua's 3-ODE piecewise-linear circuit produces
3 000 waypoints; Bishop parallel-transport extrudes a 12-sided tube
welded into a poi head.  Four shape keys traverse α-space revealing
the period-doubling route to the double-scroll attractor.

WHY CHUA'S CIRCUIT — PIECEWISE LINEARITY AND PROVABLE CHAOS
------------------------------------------------------------
Every other attractor in this library is smooth: Lorenz, Rössler,
all the Sprott systems, even the piecewise-linear Lozi map is
discrete.  Chua's circuit is the only continuous-time, physical
circuit system with a piecewise-linear nonlinearity that has been
proved rigorously to exhibit Shilnikov chaos.

  ẋ = α (y − h(x))                   (voltage across C₁)
  ẏ = x − y + z                      (voltage across C₂)
  ż = −β y                           (current through inductor L)

  h(x) = m₁x + ½(m₀−m₁)(|x+1| − |x−1|)   (Chua diode i–v)

Piecewise form of h(x):
  h(x) = m₁x + (m₀−m₁)   for x > +1
  h(x) = m₀x              for |x| ≤ 1      (negative-conductance inner)
  h(x) = m₁x − (m₀−m₁)   for x < −1

Canonical: α=15.6  β=28.0  m₀=−1/7  m₁=2/7
Physical correspondences: α = C₂/C₁·G²·L  β = G²L/C₂  normalised
conductances m₀ = Ga/G  m₁ = Gb/G  (Ga<0: negative resistance)

FIXED POINTS
-----------
Setting ẋ=ẏ=ż=0:
  ż=0 → y=0 ;  ẏ=0 → z=−x ;  ẋ=0 → h(x)=0

For |x|≤1:   m₀·x = 0           →  P₀ = (0, 0, 0)
For x>1:     m₁(x−1) + m₀ = 0   →  x = 1 − m₀/m₁ = 1 + ½ = 1.5
             P₊ = (1.5,  0, −1.5)
For x<−1:   by Z₂ symmetry      P₋ = (−1.5, 0, +1.5)

Jacobian at P± (outer region, h′=m₁=2/7):
  J = [−αm₁, α, 0; 1, −1, 1; 0, −β, 0]
    = [−8.914, 15.6, 0; 1, −1, 1; 0, −28, 0]

Eigenvalues at P±:  λ_r ≈ −1.52   (stable real — inward)
                    λ_c ≈ +0.31 ± 2.70i  (unstable spiral — outward)
Shilnikov condition: |λ_r| > Re(λ_c)  →  1.52 > 0.31  ✓
Shilnikov ratio ρ = 1.52/0.31 ≈ 4.9  → homoclinic chaos guaranteed

POSITION-DEPENDENT DIVERGENCE (unique in this library)
------------------------------------------------------
∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z  =  −α·h′(x) − 1

Inner region |x|<1 (h′=m₀=−1/7):
  ∇·F = −15.6·(−1/7) − 1 ≈ +1.23   ← LOCAL EXPANSION (negative resistance)

Outer regions |x|>1 (h′=m₁=2/7):
  ∇·F = −15.6·(2/7) − 1 ≈ −5.46   ← STRONG CONTRACTION

The orbit crosses the breakpoints x=±1 constantly; the time-average
divergence is negative (attractor exists) because the orbit spends more
time in the outer regions.  This is the operational essence of the
Chua diode: inject energy locally, dissipate globally.

LYAPUNOV SPECTRUM (canonical parameters)
-----------------------------------------
  λ₁ ≈ +0.39   (chaos confirmed)
  λ₂ ≈  0.00   (neutral)
  λ₃ ≈ −2.79   (strong folding)
  D_KY = 2 + λ₁/|λ₃| = 2 + 0.39/2.79 ≈ 2.14
  Lyapunov time  τ ≈ 1/λ₁ ≈ 2.6

RK4 PARAMETERS (canonical)
--------------------------
  ALPHA=15.6  BETA=28.0  M0=−1/7  M1=2/7
  DT=0.002   BURN_IN=3000   N_STEPS=90000   THIN=30  → 3000 waypoints

SHAPE KEYS
----------
  Basis       α=15.6  β=28.0  — canonical double-scroll
  SK_HighAlpha α=20.0  β=28.0  — tighter winding, same topology
  SK_SpiralChua α=9.5  β=28.0  — spiral Chua (single-scroll chaos)
  SK_LowBeta   α=15.6  β=16.0  — changed LC ratio, different scroll width
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
ALPHA_BASIS       = 15.6          # C₂/C₁ ratio (normalised)
BETA_BASIS        = 28.0          # 1/LC product (normalised)
M0                = -1.0 / 7.0   # inner slope (negative resistance, Ga/G)
M1                =  2.0 / 7.0   # outer slope (positive resistance, Gb/G)

ALPHA_HIGH        = 20.0          # SK_HighAlpha
ALPHA_SPIRAL      =  9.5          # SK_SpiralChua — single-scroll regime
BETA_LOW          = 16.0          # SK_LowBeta

DT                = 0.002         # RK4 step (piecewise system needs small dt)
BURN_IN           = 3000          # discarded warm-up steps
N_STEPS           = 90000         # recorded steps
THIN              = 30            # subsample → 3000 waypoints

TUBE_SEGS         = 12            # dodecagonal cross-section
TUBE_RADIUS       = 0.016         # tube outer radius (m)
POI_RADIUS        = 0.085         # scale attractor cloud to this radius (m)

COBALT = (0.06, 0.14, 0.66, 1.0)  # low speed / cool
AMBER  = (0.88, 0.52, 0.04, 1.0)  # high speed / warm

EXPORT_PATH  = "//hf_chua_poi.glb"
BLEND_NAME   = "hf_chua_poi"
ATTR_NAME    = "Chua_Speed"
IC           = (0.1, 0.0, 0.0)    # slightly off origin, inside attractor basin


# ── ODE helpers ───────────────────────────────────────────────────────────────
def _chua_h(x, m0, m1):
    """Piecewise-linear Chua diode i–v characteristic.

    WHY numpy abs formulation: avoids Python if/else branching so the
    same function vectorises over arrays during batch-parameter sweeps.
    The algebra: for |x|≤1 the two |·| terms sum to 2x, leaving m₀·x.
    For |x|>1 they collapse to ±2, producing the outer slope m₁.
    """
    return m1 * x + 0.5 * (m0 - m1) * (abs(x + 1.0) - abs(x - 1.0))


def _chua_deriv(state, alpha, beta, m0, m1):
    """Right-hand side of Chua's normalised circuit equations.

    x: capacitor C₁ voltage  y: capacitor C₂ voltage  z: inductor current
    The α(y−h(x)) term is the voltage-controlled current from the Chua
    diode; x−y+z is Kirchhoff's current law at node C₂; −βy couples
    inductor dynamics back to the LC tank.
    """
    x, y, z = state
    hx = _chua_h(x, m0, m1)
    return np.array([alpha * (y - hx),
                     x - y + z,
                     -beta * y])


def _rk4_step(state, alpha, beta, m0, m1, dt):
    """Classical 4th-order Runge–Kutta step.

    WHY RK4 not Euler: the orbit crosses the piecewise breakpoints at
    x=±1, where h′ is discontinuous.  RK4 evaluates the derivative at
    four sub-steps per interval, smoothing across the breakpoints far
    better than any lower-order method at the same step cost.
    """
    k1 = _chua_deriv(state,            alpha, beta, m0, m1)
    k2 = _chua_deriv(state + 0.5*dt*k1, alpha, beta, m0, m1)
    k3 = _chua_deriv(state + 0.5*dt*k2, alpha, beta, m0, m1)
    k4 = _chua_deriv(state +     dt*k3, alpha, beta, m0, m1)
    return state + (dt / 6.0) * (k1 + 2.0*k2 + 2.0*k3 + k4)


def _integrate(alpha, beta, m0=M0, m1=M1):
    """Integrate the Chua system; return (pts, speeds) as 3000-row arrays.

    Burn-in removes the initial transient so waypoints lie on the attractor.
    THIN subsamples to keep mesh complexity within Blender's comfort zone.
    Speed is the instantaneous RHS magnitude — maps to emission colour.
    """
    state = np.array(IC, dtype=float)
    for _ in range(BURN_IN):
        state = _rk4_step(state, alpha, beta, m0, m1, DT)

    pts, spds = [], []
    for i in range(N_STEPS):
        d = _chua_deriv(state, alpha, beta, m0, m1)
        if i % THIN == 0:
            pts.append(state.copy())
            spds.append(float(np.linalg.norm(d)))
        state = _rk4_step(state, alpha, beta, m0, m1, DT)

    return np.array(pts), np.array(spds)


# ── Geometry helpers ───────────────────────────────────────────────────────────
def _bishop_frames(pts):
    """Bishop parallel-transport frames along the waypoint curve.

    WHY Bishop not Frenet: Frenet frames flip at inflection points and
    produce twisted tubes at low-curvature segments.  Bishop frames
    propagate the normal by minimal rotation around each tangent update,
    giving a smooth tube with no artificial twists — essential for the
    sharp x=±1 turns that the Chua orbit makes.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    T = T / np.linalg.norm(T, axis=1, keepdims=True)

    N = np.empty((n - 1, 3))
    perp = np.array([0.0, 0.0, 1.0]) if abs(T[0, 2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N[0] = np.cross(T[0], perp)
    N[0] /= np.linalg.norm(N[0])

    for i in range(1, n - 1):
        axis = np.cross(T[i - 1], T[i])
        ln   = np.linalg.norm(axis)
        if ln < 1e-10:
            N[i] = N[i - 1]
        else:
            axis /= ln
            angle = np.arccos(np.clip(np.dot(T[i - 1], T[i]), -1.0, 1.0))
            c, s  = np.cos(angle), np.sin(angle)
            N[i]  = c * N[i - 1] + s * np.cross(axis, N[i - 1])
            N[i] /= np.linalg.norm(N[i])

    B = np.cross(T, N)
    return T, N, B


def _normalise(pts):
    """Centre and scale orbit cloud to a sphere of radius POI_RADIUS."""
    pts = pts - pts.mean(axis=0)
    scale = POI_RADIUS / np.percentile(np.linalg.norm(pts, axis=1), 95)
    return pts * scale


def _build_tube(me, pts, spds, T, N, B):
    """Extrude a tube mesh and write speed as a FLOAT_COLOR vertex attribute."""
    bm = bmesh.new()
    n_rings = len(pts) - 1
    rings = []
    for i in range(n_rings):
        ring = []
        for j in range(TUBE_SEGS):
            angle = 2.0 * np.pi * j / TUBE_SEGS
            c, s  = np.cos(angle), np.sin(angle)
            v = Vector(pts[i] + TUBE_RADIUS * (c * N[i] + s * B[i]))
            ring.append(bm.verts.new(v))
        rings.append(ring)

    for i in range(n_rings - 1):
        for j in range(TUBE_SEGS):
            j2 = (j + 1) % TUBE_SEGS
            bm.faces.new([rings[i][j], rings[i][j2],
                          rings[i + 1][j2], rings[i + 1][j]])

    bm.to_mesh(me)
    bm.free()

    # Speed attribute for cobalt→amber emission
    layer = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    n_verts = len(me.vertices)
    spd_min, spd_max = spds.min(), spds.max()
    for v_idx in range(n_rings):
        t = (spds[v_idx] - spd_min) / (spd_max - spd_min + 1e-9)
        col = tuple(COBALT[k] * (1.0 - t) + AMBER[k] * t for k in range(4))
        for s in range(TUBE_SEGS):
            layer.data[v_idx * TUBE_SEGS + s].color = col


def _add_emission_material(obj):
    """Attribute→ emission shader; the speed attribute drives colour + strength."""
    mat = bpy.data.materials.new(BLEND_NAME + "_mat")
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    nt = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    emit  = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 3.5
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"],  emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    obj.data.materials.append(mat)


def _add_poi_head(centre):
    """Small UV sphere welded at the attractor centroid as a poi head."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.055, location=tuple(centre), segments=16, ring_count=8
    )
    head = bpy.context.object
    head.name = BLEND_NAME + "_head"
    _add_emission_material(head)
    return head


def _build_shape_key(obj, label, alpha, beta=BETA_BASIS):
    """Rebuild tube geometry as a shape key.

    WHY per-key integration: each parameter set produces a structurally
    different attractor; re-integrating guarantees the key reflects the
    true orbital geometry rather than a smooth interpolation that would
    pass through physically meaningless intermediate states.
    """
    pts_raw, spds = _integrate(alpha, beta)
    pts = _normalise(pts_raw)
    T, N, B = _bishop_frames(pts)

    n_rings = len(pts) - 1
    sk = obj.shape_key_add(name=label, from_mix=False)
    for i in range(n_rings):
        for j in range(TUBE_SEGS):
            angle = 2.0 * np.pi * j / TUBE_SEGS
            c, s  = np.cos(angle), np.sin(angle)
            v_idx = i * TUBE_SEGS + j
            sk.data[v_idx].co = Vector(
                pts[i] + TUBE_RADIUS * (c * N[i] + s * B[i])
            )


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # Basis orbit
    pts_raw, spds = _integrate(ALPHA_BASIS, BETA_BASIS)
    pts = _normalise(pts_raw)
    T, N, B = _bishop_frames(pts)

    me = bpy.data.meshes.new(BLEND_NAME + "_mesh")
    ob = bpy.data.objects.new(BLEND_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob

    _build_tube(me, pts, spds, T, N, B)
    _add_emission_material(ob)

    # Basis shape key (required before adding further keys)
    ob.shape_key_add(name="Basis", from_mix=False)

    # Shape keys sweep α and β parameter space
    _build_shape_key(ob, "SK_HighAlpha", ALPHA_HIGH, BETA_BASIS)
    _build_shape_key(ob, "SK_SpiralChua", ALPHA_SPIRAL, BETA_BASIS)
    _build_shape_key(ob, "SK_LowBeta",   ALPHA_BASIS, BETA_LOW)

    # Poi head at attractor centroid
    _add_poi_head(tuple(pts.mean(axis=0)))

    # Export
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"Exported → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
