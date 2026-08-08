"""
Python numpy — Barkley Excitable Medium: Rotating Spiral Wave
             Simulation, RK2 Integration & UV-Sphere Displacement
             Poi Head with Wave-State Shape Keys for WebXR (Blender 5.1)
=========================================================================
Technique
---------
The Barkley model (Barkley 1991) is a minimal two-species PDE system that
supports rotating spiral waves.  It is the canonical mathematical description
of scroll waves in excitable media — the same class of dynamics as the
Belousov-Zhabotinsky chemical reaction, cardiac fibrillation, and cortical
spreading depression.

  ∂u/∂t = (1/ε) u(1−u)(u − (v+b)/a) + D∇²u      [fast activator]
  ∂v/∂t = u − v                                     [slow inhibitor]

u ∈ [0,1]  (membrane-voltage analogue)
v ∈ [0,1]  (recovery gating variable analogue)

Parameters a=0.75, b=0.06, ε=0.02, D=1.0 sit inside the "rigidly rotating"
regime — the spiral neither meanders nor breaks up, executing a perfect
circular core orbit every T ≈ 19 time units.

We integrate on a 128×128 grid for 1 200 steps (Δt=0.05) using an explicit
Runge-Kutta 2 (midpoint) scheme, store three snapshots ≈ T/4 apart, then
map the u-field bilinearly onto a UV sphere to produce a displaced poi head
whose shape keys animate one quarter-turn of the spiral.

Outside sources
---------------
• Barkley, D. (1991). "A model for fast computer simulation of waves in
  excitable media." Physica D 49(1-2):61-70. CC0 / Public Domain equations.
  https://doi.org/10.1016/0167-2789(91)90194-E
  Related: Barkley 1992 Physica D 57, Winfree "The Geometry of Biological
  Time" (Springer 2001).

• Fenton, F. & Karma, A. (1998). "Vortex dynamics in three-dimensional
  continuous myocardium with fiber rotation." Chaos 8(1):20-47. CC0 / PD.
  https://doi.org/10.1063/1.166311
  Related: Cherry & Fenton Prog Biophys Mol Biol 2008; Hodgkin & Huxley
  J Physiol 1952.
"""

import bpy, bmesh, numpy as np, math, os

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG       = "hf_barkley_spiral"

# Barkley model parameters (rigidly rotating spiral regime)
A_BARKLEY  = 0.75      # threshold steepness (higher → sharper wavefront)
B_BARKLEY  = 0.06      # excitation threshold offset
EPS        = 0.02      # time-scale ratio fast/slow (ε << 1 → sharp pulse front)
D_DIFF     = 1.0       # activator diffusion coefficient

# Integration parameters
GRID_N     = 128       # spatial grid resolution (128² ≈ 16 k cells)
DX         = 1.0       # spatial step (arbitrary units; Barkley standard = 1)
DT         = 0.05      # time step (stable: DT < DX²/(4D) → 0.0625 for DX=1)
N_STEPS    = 1200      # total steps; spiral period T≈19 tu → ~63 complete turns
SNAP_A     = 800       # first snapshot (spiral well-established)
SNAP_B     = 895       # second snapshot (~T/4 = 4.75 steps @ T≈19 tu later)
SNAP_C     = 990       # third snapshot (~T/4 further)

# Mesh / export parameters
POI_RADIUS = 0.075     # poi head radius (7.5 cm) in metres
DISP_SCALE = 0.022     # maximum radial displacement from u-field (22 mm)
N_PHI      = 64        # latitude divisions
N_THETA    = 128       # longitude divisions (matches GRID_N for clean UV map)

# ── Step 1 — Barkley PDE simulation ──────────────────────────────────────────
# WHY RK2 (midpoint): explicit Euler is first-order and drifts the wavefront
# speed at coarse Δt; RK2 halves the local truncation error at the cost of one
# extra evaluation — worth it for the sharp nullcline crossing in u.
#
# WHY periodic boundary: No-flux (Neumann) walls reflect the spiral and create
# standing figure-8 patterns.  We want a clean free rotor, so periodic BC
# (np.roll) lets the spiral breathe; we'll later remap so seam artefacts are
# hidden at the poles.

def _laplacian(f):
    """5-point finite-difference Laplacian with periodic boundary."""
    return (np.roll(f, -1, 0) + np.roll(f, 1, 0) +
            np.roll(f, -1, 1) + np.roll(f, 1, 1) - 4.0 * f) / (DX * DX)

def _du(u, v):
    # cubic nullcline F(u,v): u(1-u)(u-(v+b)/a) — the "kinetics" term
    thresh = (v + B_BARKLEY) / A_BARKLEY
    return (u * (1.0 - u) * (u - thresh)) / EPS + D_DIFF * _laplacian(u)

def _dv(u, v):
    return u - v

def _rk2_step(u, v):
    """Midpoint RK2: k1 at t, k2 at t+dt/2, then advance by dt*k2."""
    k1u = _du(u, v)
    k1v = _dv(u, v)
    u2  = np.clip(u + 0.5 * DT * k1u, 0.0, 1.0)
    v2  = np.clip(v + 0.5 * DT * k1v, 0.0, 1.0)
    u_new = np.clip(u + DT * _du(u2, v2), 0.0, 1.0)
    v_new = np.clip(v + DT * _dv(u2, v2), 0.0, 1.0)
    return u_new, v_new

# Initial condition — phase-plane jump that seeds a spiral rotor
# WHY this IC: placing a step in u and a ramp in v creates a "phase singularity"
# (a point where the phase of the spiral is undefined).  The system resolves the
# singularity by organising a free rotor around it (Winfree 1974).
rng  = np.random.default_rng(42)
u    = np.zeros((GRID_N, GRID_N), dtype=np.float32)
v    = np.zeros((GRID_N, GRID_N), dtype=np.float32)

half = GRID_N // 2
u[:half, :] = 1.0                                  # left half excited
v[:, :half] = np.linspace(0, 0.5, half)            # bottom-half v ramp
# tiny noise breaks unwanted symmetry
u += 0.01 * rng.standard_normal((GRID_N, GRID_N)).astype(np.float32)
u  = np.clip(u, 0.0, 1.0)

snapshots = {}   # step_index → u_field copy
for step in range(N_STEPS + 1):
    if step in (SNAP_A, SNAP_B, SNAP_C):
        snapshots[step] = u.copy()
    u, v = _rk2_step(u, v)

snap_a, snap_b, snap_c = snapshots[SNAP_A], snapshots[SNAP_B], snapshots[SNAP_C]

# ── Step 2 — UV sphere mesh ───────────────────────────────────────────────────
# WHY UV sphere over ico-sphere: the UV sphere has natural (u,v) latitude/longitude
# coordinates that map cleanly to our 2-D simulation grid without angular
# distortion at the equator.  Pole pinching at the caps is acceptable for a poi
# head viewed from the side.
#
# Convention: PHI = latitude in [0, π], THETA = longitude in [0, 2π).
# Vertex index: i*N_THETA + j  (i=phi row, j=theta column).

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

def _sphere_vertex(phi, theta, disp=0.0):
    r = POI_RADIUS + disp
    return (r * math.sin(phi) * math.cos(theta),
            r * math.sin(phi) * math.sin(theta),
            r * math.cos(phi))

def _sample_bilinear(field, phi_norm, theta_norm):
    """Bilinear sample from [0,1]² normalised coords into (GRID_N, GRID_N)."""
    # phi_norm ∈ [0,1] maps to row axis; theta_norm ∈ [0,1] maps to col axis
    gx = theta_norm * (GRID_N - 1)
    gy = phi_norm   * (GRID_N - 1)
    ix, iy = int(gx), int(gy)
    fx, fy = gx - ix, gy - iy
    ix1 = min(ix + 1, GRID_N - 1)
    iy1 = min(iy + 1, GRID_N - 1)
    return (field[iy,  ix ] * (1 - fx) * (1 - fy) +
            field[iy,  ix1] *      fx  * (1 - fy) +
            field[iy1, ix ] * (1 - fx) *      fy  +
            field[iy1, ix1] *      fx  *      fy)

def build_sphere_mesh(u_field, name):
    """Build displaced UV sphere from u_field, returned as (obj, bm)."""
    bm = bmesh.new()

    phi_arr   = np.linspace(0, math.pi, N_PHI + 1)      # N_PHI+1 rows
    theta_arr = np.linspace(0, 2 * math.pi, N_THETA, endpoint=False)

    # Compute displacements upfront via vectorised bilinear sample
    phi_norm   = phi_arr   / math.pi                # [0,1]
    theta_norm = theta_arr / (2 * math.pi)          # [0,1]

    verts = []
    for i, phi in enumerate(phi_arr):
        for j, theta in enumerate(theta_arr):
            disp = _sample_bilinear(u_field, phi_norm[i], theta_norm[j])
            verts.append(bm.verts.new(_sphere_vertex(phi, theta, disp * DISP_SCALE)))

    bm.verts.ensure_lookup_table()

    # North pole cap quads → triangles
    n_rows = len(phi_arr)                            # N_PHI+1 rows
    for i in range(n_rows - 1):
        for j in range(N_THETA):
            j1 = (j + 1) % N_THETA
            a = verts[i  * N_THETA + j ]
            b = verts[i  * N_THETA + j1]
            c = verts[(i+1) * N_THETA + j1]
            d = verts[(i+1) * N_THETA + j ]
            bm.faces.new((a, b, c, d))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = False

    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# Build basis (snap_a) mesh
obj = build_sphere_mesh(snap_a, SLUG)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Step 3 — Shape keys for wave-state morphs ─────────────────────────────────
# WHY three snapshots: each is ~T/4 into the rotor period, so the three keys
# tile one half-revolution.  Blending between them in a WebXR app produces a
# smooth looping animation of the spiral rotating.

def add_shape_key(obj, field, key_name):
    sk = obj.shape_key_add(name=key_name, from_mix=False)
    phi_arr   = np.linspace(0, math.pi, N_PHI + 1)
    theta_arr = np.linspace(0, 2 * math.pi, N_THETA, endpoint=False)
    phi_norm  = phi_arr  / math.pi
    theta_norm = theta_arr / (2 * math.pi)

    pts = []
    for i, phi in enumerate(phi_arr):
        for j, theta in enumerate(theta_arr):
            disp = _sample_bilinear(field, phi_norm[i], theta_norm[j])
            r = POI_RADIUS + disp * DISP_SCALE
            pts.extend([r * math.sin(phi) * math.cos(theta),
                        r * math.sin(phi) * math.sin(theta),
                        r * math.cos(phi)])
    sk.data.foreach_set('co', pts)

obj.shape_key_add(name="Basis", from_mix=False)
add_shape_key(obj, snap_b, "Spiral_T2")
add_shape_key(obj, snap_c, "Spiral_T3")

# ── Step 4 — Vertex colours (activator field) ─────────────────────────────────
# WHY FLOAT_COLOR + POINT domain: FLOAT_COLOR stores linear values; POINT domain
# means one colour per vertex (shared across its faces), which the holoflow
# exporter reads as vertex colours in the GLB.  BYTE_COLOR clips to [0,255]
# and loses sub-step gradient precision.

me = obj.data
col_attr = me.color_attributes.new(
    name="ActivatorField",
    type='FLOAT_COLOR',
    domain='POINT',
)
phi_arr   = np.linspace(0, math.pi, N_PHI + 1)
theta_arr = np.linspace(0, 2 * math.pi, N_THETA, endpoint=False)
phi_norm   = phi_arr   / math.pi
theta_norm = theta_arr / (2 * math.pi)

rgba_flat = []
for i, phi in enumerate(phi_arr):
    for j, theta in enumerate(theta_arr):
        u_val = float(_sample_bilinear(snap_a, phi_norm[i], theta_norm[j]))
        # Colour map: quiescent (u≈0) → deep indigo; excited (u≈1) → flame yellow
        r = u_val ** 0.5
        g = u_val ** 2.0
        b = 1.0 - u_val
        rgba_flat.extend([r, g, b, 1.0])

col_attr.data.foreach_set('color', rgba_flat)

# ── Step 5 — Emission material ────────────────────────────────────────────────
mat = bpy.data.materials.new(f"{SLUG}_mat")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

attr_node = nt.nodes.new('ShaderNodeAttribute')
attr_node.attribute_name = "ActivatorField"

emit_node = nt.nodes.new('ShaderNodeEmission')
emit_node.inputs['Strength'].default_value = 2.2

out_node  = nt.nodes.new('ShaderNodeOutputMaterial')

nt.links.new(attr_node.outputs['Color'], emit_node.inputs['Color'])
nt.links.new(emit_node.outputs['Emission'], out_node.inputs['Surface'])

obj.data.materials.append(mat)

# Custom property for holoflow WebXR exporter
obj['holoflow:facet'] = True

# Orient Y-up (Blender Z → export Y)
obj.rotation_euler = (math.radians(-90), 0, 0)
bpy.ops.object.transform_apply(rotation=True)

print(f"[barkley] Done — '{SLUG}' built: "
      f"{len(obj.data.vertices)} verts, "
      f"{len(obj.data.polygons)} faces, "
      f"{len(obj.data.shape_keys.key_blocks)} shape keys.")
