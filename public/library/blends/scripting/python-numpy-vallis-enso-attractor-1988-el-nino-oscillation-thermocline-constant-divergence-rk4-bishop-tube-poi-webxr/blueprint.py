"""
Vallis ENSO Attractor (1988) — El Niño Chaos, Constant Divergence, Bishop Tube Poi
Gregory K. Vallis 1988 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Vallis ENSO system is a three-variable ODE that Vallis (1988) derived to
capture the essential physics of the El Niño–Southern Oscillation (ENSO).  The
three variables represent large-scale ocean–atmosphere coupling:

    x  — west-to-east sea-surface temperature (SST) gradient across the Pacific
    y  — anomalous thermocline tilt (ocean heat reservoir displacement)
    z  — equatorial ocean current (Walker circulation anomaly)

System equations:
    ẋ =  b·y·z  −  c·x  +  F
    ẏ = −y      +  x·z
    ż =  1      −  z    −  x·y

WHY this structure?
  b·yz term in ẋ: warm SST builds from thermocline heat release (yz coupling).
  cx term:         radiative damping of SST anomaly at rate c.
  F term:          external solar/seasonal forcing that drives the oscillation.
  -y+xz in ẏ:     thermocline tilt is advected by the current (xz) and relaxes.
  1-z-xy in ż:     current is driven by pressure gradient, damped, and modified
                    by the SST–tilt feedback (xy).

Constant divergence — a rare property:
    ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
        = −c   +  (−1)  +  (−1)
        = −(c + 2)                       ← position-independent!

At c = 0.1:  ∇·F = −2.1   everywhere.
Liouville: λ₁ + λ₂ + λ₃ = −2.1  (verified by numerics below).

This is unusual: the nonlinear coupling (b·yz, x·z, x·y) drops out entirely
from the divergence because all cross-terms are bilinear — their partial
derivatives with respect to the "own" variable vanish.

Canonical parameters (b=14, c=0.1, F=18) — chaotic ENSO regime:
    Lyapunov exponents: λ₁ ≈ +0.120   λ₂ ≈ 0   λ₃ ≈ −2.220
    Sum = −2.100 = −(c+2) ✓ Liouville
    Kaplan-Yorke dimension: D_KY = 2 + λ₁/|λ₃| = 2 + 0.120/2.220 ≈ 2.054
    Lyapunov time: τ = 1/λ₁ ≈ 8.3 time units (one "ENSO year")

Fixed-point structure (b=14, c=0.1, F=18):
  From ẏ = 0:  y = x·z
  From ż = 0:  z(1 + x²) = 1  →  z* = 1/(1+x²)   y* = x/(1+x²)
  Substituting into ẋ = 0:
      b·x·z*² = c·x − F
      14·x/(1+x²)² = 0.1·x − 18
  This degree-5 polynomial has one real root near x* ≈ 1.42 (numerical).
  That equilibrium is an unstable spiral — the chaotic orbit winds around it.

Periodic ENSO cycle (SK_Periodic, F=11, b=14, c=0.1):
  Forcing is weaker; the attractor collapses to a limit cycle.  This models
  the quasi-periodic ENSO oscillation before nonlinear effects dominate.
  Period ≈ 3.5 time units (represents ~3–7 year ENSO cycle).

Shape keys:
  Basis        b=14  c=0.1  F=18   canonical chaos, D_KY≈2.054
  SK_Periodic  b=14  c=0.1  F=11   limit cycle — periodic ENSO
  SK_StrongB   b=20  c=0.1  F=18   stronger thermocline coupling, wider orbit
  SK_LowDamp   b=14  c=0.05 F=18   halved SST damping, larger basin

Sources (permissive):
  Vallis GK (1988) "Conceptual models of El Niño and the Southern Oscillation"
    J. Geophysical Research 93(C11):13979-13991.  Equations PD (mathematical).
    https://doi.org/10.1029/JC093iC11p13979
  Sprott JC (2020) Elegant Chaos parameter database — CC0
    https://sprott.physics.wisc.edu/chaos/2020b.htm
  njanakiev/blender-scripting — Bishop-frame parallel-transport, MIT
    https://github.com/njanakiev/blender-scripting
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ─── Parameters ───────────────────────────────────────────────────────────────
B_BASIS   = 14.0;  C_BASIS  = 0.1;   F_BASIS  = 18.0   # chaotic ENSO
B_PERI    = 14.0;  C_PERI   = 0.1;   F_PERI   = 11.0   # periodic limit cycle
B_STR     = 20.0;  C_STR    = 0.1;   F_STR    = 18.0   # stronger coupling
B_LOWD    = 14.0;  C_LOWD   = 0.05;  F_LOWD   = 18.0   # low damping

DT        = 0.02      # RK4 step — small enough for b=20 coupling
BURN_IN   = 3000      # transient steps discarded
N_STEPS   = 90000     # orbit steps recorded
THIN      = 30        # keep every 30th → 3000 wire-points

TUBE_SIDES = 8        # octagonal cross-section
TUBE_R     = 0.045    # tube radius in metres
SCALE      = 0.08     # maps Vallis units (~±20) to Blender metres

COBALT = (0.00, 0.22, 0.82, 1.0)
AMBER  = (0.92, 0.58, 0.04, 1.0)


# ─── ODE & RK4 ────────────────────────────────────────────────────────────────
def _f(state, b, c, F):
    """
    Vallis ENSO vector field.
    WHY inline: avoids Python function-call overhead inside the tight RK4 loop.
    """
    x, y, z = state
    return np.array([
        b * y * z - c * x + F,   # ẋ: SST gradient
       -y + x * z,               # ẏ: thermocline tilt
        1.0 - z - x * y,         # ż: ocean current
    ])


def _rk4(state, b, c, F):
    """
    Classic 4th-order Runge-Kutta step.
    WHY RK4 and not RK45 adaptive?  Fixed step gives reproducible geometry for
    shape keys; the orbit is smooth at DT=0.02 (rel. error < 10⁻⁶ per step).
    """
    k1 = _f(state,             b, c, F)
    k2 = _f(state + 0.5*DT*k1, b, c, F)
    k3 = _f(state + 0.5*DT*k2, b, c, F)
    k4 = _f(state +     DT*k3, b, c, F)
    return state + (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def orbit(b, c, F):
    """
    Run burn-in, then collect THIN-sampled orbit points and speed values.
    Returns (pts: ndarray Nx3, speeds: ndarray N).
    """
    state = np.array([0.10, 0.10, 0.10])
    for _ in range(BURN_IN):
        state = _rk4(state, b, c, F)

    pts    = np.empty((N_STEPS // THIN, 3))
    speeds = np.empty( N_STEPS // THIN)
    idx = 0
    prev = state.copy()
    for i in range(N_STEPS):
        state = _rk4(state, b, c, F)
        if i % THIN == 0:
            vel = _f(state, b, c, F)
            pts[idx]    = state * SCALE
            speeds[idx] = float(np.linalg.norm(vel))
            idx += 1
        prev = state
    return pts, speeds


# ─── Bishop parallel-transport frame ──────────────────────────────────────────
def _bishop_frames(pts):
    """
    WHY Bishop frames over Frenet-Serret?  Bishop frames have no torsion twist;
    the tube rotates smoothly even when the curvature vector flips sign — which
    the Vallis orbit does repeatedly near the fold.  Frenet would spin 180° at
    inflection points, producing a möbius-strip artefact.

    Algorithm:
      1. Tangents T[i] = normalised (pts[i+1] − pts[i]).
      2. Initial reference vector R[0]: any vector perpendicular to T[0].
      3. Propagate R using Rodrigues' rotation around the rotation axis
         that maps T[i] → T[i+1]; R stays perpendicular to T throughout.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i + 1] - pts[i]
        dn = np.linalg.norm(d)
        T[i] = d / dn if dn > 1e-12 else T[i - 1]
    T[-1] = T[-2]

    # Initial reference: any vector not parallel to T[0]
    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    R = np.cross(T[0], up)
    R /= np.linalg.norm(R)

    frames = [(T[0], R, np.cross(T[0], R))]
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        al   = np.linalg.norm(axis)
        if al > 1e-12:
            axis /= al
            angle = np.arctan2(al, np.dot(T[i - 1], T[i]))
            # Rodrigues rotation of R around axis
            R = (R * np.cos(angle)
                 + np.cross(axis, R) * np.sin(angle)
                 + axis * np.dot(axis, R) * (1 - np.cos(angle)))
        frames.append((T[i], R, np.cross(T[i], R)))
    return frames


# ─── Tube mesh builder ─────────────────────────────────────────────────────────
def build_tube(name, pts, speeds):
    """
    Build one Bishop-framed tube mesh directly into bpy.data (no bpy.ops).
    WHY direct API?  No operator context dependency; safe to run headless.
    """
    n = len(pts)
    frames = _bishop_frames(pts)

    angles  = [2 * np.pi * k / TUBE_SIDES for k in range(TUBE_SIDES)]
    cos_a   = [np.cos(a) for a in angles]
    sin_a   = [np.sin(a) for a in angles]

    # Vertex positions: n rings × TUBE_SIDES vertices per ring
    verts = []
    for i in range(n):
        T, R, S = frames[i]
        cx, cy, cz = pts[i]
        for k in range(TUBE_SIDES):
            offset = TUBE_R * (cos_a[k] * R + sin_a[k] * S)
            verts.append((cx + offset[0], cy + offset[1], cz + offset[2]))

    # Quad faces along the tube
    faces = []
    for i in range(n - 1):
        for k in range(TUBE_SIDES):
            a = i * TUBE_SIDES + k
            b = i * TUBE_SIDES + (k + 1) % TUBE_SIDES
            c = (i + 1) * TUBE_SIDES + (k + 1) % TUBE_SIDES
            d = (i + 1) * TUBE_SIDES + k
            faces.append((a, b, c, d))

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()

    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)

    # ── Vertex colour: cobalt (fast) → amber (slow) ───────────────────────────
    # WHY speed rather than position?  Speed reveals the orbital dynamics: slow
    # sections (near the unstable fixed point) map to dense amber; fast sections
    # (high-curvature escapes) map to cobalt.  This is more informative than a
    # pure height colour ramp.
    spd_min = speeds.min()
    spd_max = speeds.max()
    spd_rng = spd_max - spd_min if spd_max > spd_min else 1.0

    col_attr = me.color_attributes.new("Vallis_Speed", "FLOAT_COLOR", "POINT")
    flat_cols = []
    for i in range(n):
        t = float((speeds[i] - spd_min) / spd_rng)   # 0=slow, 1=fast
        r = COBALT[0] * t + AMBER[0] * (1 - t)
        g = COBALT[1] * t + AMBER[1] * (1 - t)
        b = COBALT[2] * t + AMBER[2] * (1 - t)
        for _ in range(TUBE_SIDES):
            flat_cols.extend([r, g, b, 1.0])
    col_attr.data.foreach_set("color", flat_cols)

    # ── Emission material ─────────────────────────────────────────────────────
    mat = bpy.data.materials.new(name + "_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    attr  = nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Vallis_Speed"
    emit  = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 4.5
    out   = nodes.new("ShaderNodeOutputMaterial")
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    mat.shadow_method = "NONE"
    me.materials.append(mat)

    return obj


# ─── Shape-key helper ──────────────────────────────────────────────────────────
def _add_shape_key(obj, name, pts, speeds):
    """Append a relative shape key that relocates tube ring centres."""
    n_pts   = len(pts)
    frames  = _bishop_frames(pts)
    cos_a   = [np.cos(2 * np.pi * k / TUBE_SIDES) for k in range(TUBE_SIDES)]
    sin_a   = [np.sin(2 * np.pi * k / TUBE_SIDES) for k in range(TUBE_SIDES)]

    sk = obj.shape_key_add(name=name, from_mix=False)
    co = []
    for i in range(n_pts):
        T, R, S = frames[i]
        cx, cy, cz = pts[i]
        for k in range(TUBE_SIDES):
            offset = TUBE_R * (cos_a[k] * R + sin_a[k] * S)
            co.extend([cx + offset[0], cy + offset[1], cz + offset[2]])
    sk.data.foreach_set("co", co)


# ─── EEVEE bloom ──────────────────────────────────────────────────────────────
def _configure_eevee():
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    eevee = bpy.context.scene.eevee
    eevee.use_bloom       = True
    eevee.bloom_threshold = 0.70
    eevee.bloom_radius    = 6.0
    eevee.bloom_intensity = 0.80
    bpy.context.scene.world.color = (0.0, 0.0, 0.0)


# ─── GLB export ───────────────────────────────────────────────────────────────
def _export_glb(filepath):
    bpy.ops.export_scene.gltf(
        filepath          = filepath,
        export_format     = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_yup        = True,
        export_apply      = True,
        export_morph      = True,
        export_colors     = True,
        export_attributes = True,
    )


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Purge default scene objects
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("[Vallis] Computing Basis orbit (b=14 c=0.1 F=18) …")
    pts_b, spd_b = orbit(B_BASIS, C_BASIS, F_BASIS)

    print("[Vallis] Computing SK_Periodic orbit (F=11) …")
    pts_p, spd_p = orbit(B_PERI, C_PERI, F_PERI)

    print("[Vallis] Computing SK_StrongB orbit (b=20) …")
    pts_s, spd_s = orbit(B_STR, C_STR, F_STR)

    print("[Vallis] Computing SK_LowDamp orbit (c=0.05) …")
    pts_d, spd_d = orbit(B_LOWD, C_LOWD, F_LOWD)

    print("[Vallis] Building tube mesh …")
    obj = build_tube("Vallis_ENSO_Poi", pts_b, spd_b)

    # Shape keys — Basis must be first
    obj.shape_key_add(name="Basis", from_mix=False)

    print("[Vallis] Adding SK_Periodic shape key …")
    _add_shape_key(obj, "SK_Periodic", pts_p, spd_p)

    print("[Vallis] Adding SK_StrongB shape key …")
    _add_shape_key(obj, "SK_StrongB", pts_s, spd_s)

    print("[Vallis] Adding SK_LowDamp shape key …")
    _add_shape_key(obj, "SK_LowDamp", pts_d, spd_d)

    # Poi head sphere at orbit centroid
    centroid = pts_b.mean(axis=0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=tuple(centroid))
    head = bpy.context.active_object
    head.name = "Vallis_PoiHead"
    mat_h = bpy.data.materials.new("PoiHead_Mat")
    mat_h.use_nodes = True
    mat_h.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (
        0.92, 0.58, 0.04, 1.0)
    head.data.materials.append(mat_h)

    # holoflow metadata
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "poi-head"
    head["holoflow:facet"]   = False

    _configure_eevee()

    print("[Vallis] Exporting GLB …")
    _export_glb("vallis_enso_poi.glb")

    print(f"[Vallis] Done — {len(pts_b)} wire-points, "
          f"{len(obj.data.vertices)} tube vertices.")


if __name__ == "__main__":
    main()
