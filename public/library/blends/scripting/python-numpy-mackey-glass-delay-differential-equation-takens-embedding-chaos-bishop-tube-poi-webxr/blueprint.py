"""
Mackey–Glass Delay Differential Equation (1977)
─────────────────────────────────────────────────────────────────────────────
Mackey MC & Glass L 1977 "Oscillation and Chaos in Physiological Control
Systems" Science 197(4300):287-289 DOI 10.1126/science.267326

The equation models haematopoiesis (white blood cell production):

    dx/dt = β·x(t−τ) / (1 + x(t−τ)ⁿ) − γ·x(t)

where x is normalised blood cell concentration.  The feedback is Hill-function
type: production β·x/(1+xⁿ) saturates at large x, while degradation γ·x is
linear.  The DELAY τ is the physiological lag between bone-marrow signal and
circulating cell count — typically 6–20 days.

KEY INSIGHT — why delay ⟹ infinite dimensions
  An ODE ẋ = F(x(t)) needs only the current state x(t) to step forward.
  A DDE needs x(t−τ) — a whole FUNCTION segment from [t−τ, t].
  That segment lives in an infinite-dimensional function space, so the DDE
  has infinitely many Lyapunov exponents.  The Kaplan–Yorke dimension of the
  attractor grows with τ: D_KY ≈ 2.1 for τ=17, ≈ 3.4 for τ=30.

VISUALISATION — Takens delay embedding (Takens 1981)
  We cannot plot x(t) against its exact derivative (unknown in real data).
  Instead we embed the scalar series in 3-D using two additional lags:
      P(t) = ( x(t), x(t − T_E), x(t − 2·T_E) )
  Takens' theorem guarantees this recovers the attractor topology provided
  T_E is chosen so the lagged copies are "independent enough" — typically
  T_E ~ τ/4.  This is the same trick used in experimental time-series analysis.

NUMERICAL METHOD — RK4 with history ring-buffer + linear interpolation
  We store x at every DT step in a ring buffer of size H = ceil(τ_max/DT)+4.
  At each RK4 sub-step we need x(t−τ); we compute the fractional index into
  the buffer and linearly interpolate.  This is first-order accurate in the
  delay lookup but suffices for visualisation (a production solver would use
  cubic Hermite interpolation).

BLENDER STRATEGY
  1. Integrate with the history buffer.
  2. Apply Takens embedding to obtain 3-D waypoints.
  3. Build a Bishop parallel-transport tube (no gimbal twist).
  4. Colour by instantaneous x(t) value: cobalt (low) → amber (high).
  5. Four shape-key variants: τ=17 (canonical), τ=23, τ=30, τ=8 (near-periodic).
  6. Export as WebXR poi head: +Y-up, apply transforms, Draco-6, WebP.

Run via:  blender --background --python blueprint.py
Output:   mackey_glass_poi.blend + mackey_glass_poi.glb
"""

import math
import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ─── NAMED CONSTANTS ──────────────────────────────────────────────────────────
BETA       = 0.2     # production rate (standard Mackey-Glass)
GAMMA      = 0.1     # degradation rate
N_HILL     = 10      # Hill exponent (sharpness of saturation; n≥9 gives chaos)
X_INIT     = 0.5     # initial condition for x(t) in [-τ, 0] (constant history)

DT         = 0.10    # integration step (days, rescaled)
T_WARMUP   = 500.0   # wash-out transients for 500 time units
T_RECORD   = 600.0   # record this many time units after warmup
THIN       = 2       # keep every THIN-th step → waypoints ≈ 3 000

T_EMBED    = 4.0     # Takens embedding lag (≈ τ_basis/4 = 17/4 ≈ 4.25)

TUBE_R     = 0.045   # Bishop tube radius
TUBE_SIDES = 10      # faces around the tube circumference
POI_R      = 0.090   # outer poi-head sphere radius

SLUG = "mackey_glass_poi"

# ─── DELAY CONFIGURATIONS (one per shape key) ─────────────────────────────────
CONFIGS = [
    dict(name="Basis",        tau=17.0, label="τ=17 canonical chaotic D_KY≈2.1"),
    dict(name="SK_HighTau",   tau=23.0, label="τ=23 richer topology D_KY≈2.7"),
    dict(name="SK_VeryHiTau", tau=30.0, label="τ=30 high-dimensional D_KY≈3.4"),
    dict(name="SK_Periodic",  tau= 8.0, label="τ=8 near-periodic limit cycle"),
]

TAU_MAX = max(c["tau"] for c in CONFIGS)


# ─── DDE INTEGRATION ──────────────────────────────────────────────────────────
def _mg_deriv(x_now: float, x_delayed: float) -> float:
    """Right-hand side of the Mackey-Glass DDE."""
    return BETA * x_delayed / (1.0 + x_delayed ** N_HILL) - GAMMA * x_now


def integrate_mg(tau: float) -> np.ndarray:
    """
    Integrate Mackey-Glass from constant history X_INIT.
    Returns an (N, 3) array of Takens-embedded waypoints.

    History is stored in a ring buffer at resolution DT.
    For RK4 sub-steps we need x at times t−τ and t−τ±DT/2, obtained via
    linear interpolation from the buffer.
    """
    H = int(math.ceil(tau / DT)) + 4          # buffer cells covering [t-τ, t]
    buf = np.full(H, X_INIT, dtype=np.float64) # constant history
    buf_idx = 0                                 # oldest-entry pointer

    T_LAG_STEPS = tau / DT                     # float number of steps in delay

    def get_delayed(frac_steps_ago: float) -> float:
        """Linear interpolation in the ring buffer, frac_steps_ago in [0, H-1]."""
        i0 = int(frac_steps_ago)
        f  = frac_steps_ago - i0
        # indices into ring: current slot is buf_idx-1 (most recent)
        i0 = (buf_idx - 1 - i0) % H
        i1 = (i0 - 1) % H
        return buf[i0] * (1.0 - f) + buf[i1] * f

    waypoints = []
    x = X_INIT
    step = 0

    # warmup
    N_WARM = int(T_WARMUP / DT)
    N_REC  = int(T_RECORD / DT)

    for _ in range(N_WARM + N_REC):
        xd = get_delayed(T_LAG_STEPS)
        # RK4 — uses x_delayed at t, t+DT/2, t+DT (approximate: same xd for all)
        k1 = _mg_deriv(x,              xd)
        k2 = _mg_deriv(x + 0.5*DT*k1, xd)
        k3 = _mg_deriv(x + 0.5*DT*k2, xd)
        k4 = _mg_deriv(x +     DT*k3, xd)
        x += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        x  = max(x, 0.0)          # clamp: cell count can't be negative

        buf[buf_idx % H] = x
        buf_idx += 1
        step    += 1

        if step > N_WARM and (step % THIN == 0):
            # Takens embedding: (x(t), x(t−T_E), x(t−2·T_E))
            x0 = x
            x1 = get_delayed(T_EMBED / DT)
            x2 = get_delayed(2.0 * T_EMBED / DT)
            waypoints.append([x0, x1, x2])

    pts = np.array(waypoints, dtype=np.float64)

    # Centre and scale to fit poi sphere
    pts -= pts.mean(axis=0)
    scale = POI_R * 0.80 / np.abs(pts).max()
    pts  *= scale
    return pts


# ─── BISHOP PARALLEL-TRANSPORT TUBE ───────────────────────────────────────────
def bishop_tube(pts: np.ndarray, r: float = TUBE_R, sides: int = TUBE_SIDES):
    """
    Build a closed-quad-strip tube around the waypoint polyline using Bishop
    (rotation-minimising) frames — no Frenet gimbal lock.

    Returns (vertices, faces, per-vertex colour weights [0,1]).
    """
    n = len(pts)

    # Tangents via central differences (more stable than forward differences)
    T = np.empty_like(pts)
    T[1:-1] = pts[2:] - pts[:-2]
    T[0]    = pts[1]  - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms

    # Seed normal — pick axis least parallel to T[0]
    ref = np.array([0.0, 1.0, 0.0])
    if abs(np.dot(ref, T[0])) > 0.9:
        ref = np.array([0.0, 0.0, 1.0])
    N0 = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    Ns = np.empty_like(pts)
    Ns[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        sa   = np.linalg.norm(axis)
        ca   = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)
        if sa < 1e-10:
            Ns[i] = Ns[i-1]
        else:
            axis /= sa
            # Rodrigues rotation formula
            Ns[i] = (ca * Ns[i-1]
                     + sa * np.cross(axis, Ns[i-1])
                     + (1.0 - ca) * np.dot(axis, Ns[i-1]) * axis)
    Bs = np.cross(T, Ns)

    thetas = np.linspace(0.0, 2.0 * math.pi, sides, endpoint=False)
    cos_t  = np.cos(thetas)
    sin_t  = np.sin(thetas)

    # Build vertex array (n × sides)
    verts = (pts[:, None, :]                      # (n,1,3)
             + r * cos_t[None, :, None] * Ns[:, None, :]   # radial N
             + r * sin_t[None, :, None] * Bs[:, None, :])  # radial B
    verts = verts.reshape(-1, 3)

    # Quad faces: wrap around circumference and along spine
    faces = []
    for i in range(n - 1):
        for s in range(sides):
            s1 = (s + 1) % sides
            a  = i  * sides + s
            b  = i  * sides + s1
            c  = (i+1) * sides + s1
            d  = (i+1) * sides + s
            faces.append((a, b, c, d))

    # Per-vertex colour weight = normalised x(t) value (first embedding coord)
    x_vals  = pts[:, 0]
    v_min, v_max = x_vals.min(), x_vals.max()
    weights = (x_vals - v_min) / max(v_max - v_min, 1e-9)
    weights = np.repeat(weights, sides)     # broadcast to all ring verts

    return verts, faces, weights


# ─── COLOUR GRADIENT ──────────────────────────────────────────────────────────
COBALT = np.array([0.03, 0.20, 0.78], dtype=np.float32)   # low x
AMBER  = np.array([0.98, 0.62, 0.05], dtype=np.float32)   # high x

def weight_to_rgb(w: float):
    return tuple(float(v) for v in ((1-w)*COBALT + w*AMBER))


# ─── MESH BUILDER ─────────────────────────────────────────────────────────────
def build_mesh(configs, obj_name: str = SLUG):
    """Create a mesh object with one shape key per config."""
    bpy.ops.object.select_all(action="DESELECT")

    # Clear scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)

    first_verts, first_faces, first_weights = None, None, None
    mesh_data = bpy.data.meshes.new(obj_name + "_mesh")
    obj       = bpy.data.objects.new(obj_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Enable shape keys
    obj.shape_key_add(name="Basis", from_mix=False)

    for idx, cfg in enumerate(configs):
        pts    = integrate_mg(cfg["tau"])
        verts, faces, weights = bishop_tube(pts)

        if idx == 0:
            # Build the mesh from the first config
            first_verts   = verts
            first_faces   = faces
            first_weights = weights
            bm = bmesh.new()
            bverts = [bm.verts.new(v) for v in verts]
            bm.verts.ensure_lookup_table()
            for f in faces:
                bm.faces.new([bverts[i] for i in f])
            bm.to_mesh(mesh_data)
            bm.free()
        else:
            # Additional shape keys deform the same topology
            sk = obj.shape_key_add(name=cfg["name"], from_mix=False)
            for vi, v3d in enumerate(verts):
                sk.data[vi].co = Vector(v3d)

    # ── Vertex colour attribute (FLOAT_COLOR, POINT domain) ──────────────────
    attr = mesh_data.attributes.new("MG_Value", "FLOAT_COLOR", "POINT")
    for vi, w in enumerate(first_weights):
        r, g, b = weight_to_rgb(w)
        attr.data[vi].color = (r, g, b, 1.0)

    # Also bake colour into each shape key's attribute (loop over keys)
    # (shape keys share the attribute; record.py animates weight, not colour)

    # ── Material ──────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new("MG_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr_node = nt.nodes.new("ShaderNodeAttribute")
    attr_node.attribute_name = "MG_Value"
    attr_node.attribute_type  = "GEOMETRY"

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value          = 0.55
    bsdf.inputs["Roughness"].default_value         = 0.18
    bsdf.inputs["Emission Strength"].default_value = 1.6

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr_node.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr_node.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],       out.inputs["Surface"])

    mesh_data.materials.append(mat)

    # ── Poi outer shell ───────────────────────────────────────────────────────
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, segments=24, ring_count=16)
    shell = bpy.context.active_object
    shell.name = obj_name + "_shell"
    shell_mat  = bpy.data.materials.new("MG_Shell")
    shell_mat.use_nodes = True
    sn = shell_mat.node_tree.nodes["Principled BSDF"]
    sn.inputs["Base Color"].default_value    = (0.05, 0.05, 0.08, 1.0)
    sn.inputs["Metallic"].default_value      = 0.85
    sn.inputs["Roughness"].default_value     = 0.12
    sn.inputs["Alpha"].default_value         = 0.25
    shell_mat.blend_method = "BLEND"
    shell.data.materials.append(shell_mat)

    # ── Custom properties (holoflow exporter) ─────────────────────────────────
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj["holoflow:facet"] = False
    obj["holoflow:category"] = "poi-head"

    # ── Apply +Y-up transform ──────────────────────────────────────────────────
    import math as _m
    obj.rotation_euler   = (-_m.pi/2, 0, 0)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


# ─── EXPORT ───────────────────────────────────────────────────────────────────
def export_all():
    blend_path = f"//{SLUG}.blend"
    glb_path   = f"//{SLUG}.glb"
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.export_scene.gltf(
        filepath             = glb_path,
        export_format        = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_colors        = True,
        export_morph         = True,
        export_morph_normal  = False,
        export_image_format  = "WEBP",
    )
    print(f"Saved → {blend_path} + {glb_path}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    build_mesh(CONFIGS)
    export_all()
    print("Mackey-Glass DDE blueprint complete.")
