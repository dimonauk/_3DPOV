"""
Holoflow Studio — Blender 5.1
Python numpy — Euler Rigid Body: Torque-Free Spinning Top Precession,
Nutation & Geometric Phase as Poi Staff Rotation

Technique:
  A torque-free rigid body's angular velocity ω traces a closed orbit in the
  body-fixed principal-axis frame — the polhode.  Euler's equations give dω/dt
  entirely from the principal moments I₁, I₂, I₃.  We couple them with
  quaternion kinematics (dq/dt = ½ q⊗Ω) to track the lab-frame orientation,
  then bake the result as LINEAR quaternion keyframes on a poi staff cylinder.
  Three presets illustrate: symmetric top (clean closed polhode ellipse),
  asymmetric top (open banana polhode), and the intermediate-axis instability
  (tennis-racket effect — slow spin about I₂ axis → chaotic tumbling).
"""

import bpy
import math
import numpy as np
from mathutils import Quaternion

# ── PRESET ────────────────────────────────────────────────────────────────────
# Principal moments of inertia [kg·m² — only ratios matter]
# Change PRESET to explore different regimes:
#   "SYMMETRIC"    → Euler angles exact, polhode is a circle
#   "ASYMMETRIC"   → Poinsot banana, nutation visible
#   "INTERMEDIATE" → tennis-racket flip (intermediate axis unstable)
PRESET = "ASYMMETRIC"

_PRESETS = {
    "SYMMETRIC":    dict(I1=0.80, I2=0.80, I3=0.12, omega0=(0.00, 0.00, 6.00)),
    "ASYMMETRIC":   dict(I1=0.90, I2=0.30, I3=0.10, omega0=(0.50, 0.06, 5.80)),
    "INTERMEDIATE": dict(I1=0.90, I2=0.50, I3=0.10, omega0=(0.02, 5.80, 0.02)),
}
_p   = _PRESETS[PRESET]
I1   = _p["I1"]
I2   = _p["I2"]
I3   = _p["I3"]
OMEGA0 = np.array(_p["omega0"], float)

# ── INTEGRATION PARAMETERS ────────────────────────────────────────────────────
# High substep count keeps per-step drift ≪ integration error — energy
# must drift less than 1e-5 over 240 frames to trust the quaternion stream.
DT       = 1.0 / 480.0   # RK4 step [s]  (480 Hz)
N_FRAMES = 240            # keyframe count (24 fps → 10 s animation)
N_SUB    = 20             # substeps per output frame

POLHODE_SCALE = 0.10      # metres per rad/s — scales body-frame ω trail
STAFF_LENGTH  = 0.80      # [m]
STAFF_RADIUS  = 0.018     # [m]
BEVEL_TUBE    = 0.006     # polhode trail tube radius [m]


# ── EULER RIGID BODY EQUATIONS (body frame, torque-free) ─────────────────────
#
#   I₁ ω̇₁ = (I₂ − I₃) ω₂ ω₃
#   I₂ ω̇₂ = (I₃ − I₁) ω₃ ω₁
#   I₃ ω̇₃ = (I₁ − I₂) ω₁ ω₂
#
# Two conserved quantities constrain the motion:
#   Kinetic energy  T = ½(I₁ω₁² + I₂ω₂² + I₃ω₃²)  → energy ellipsoid
#   Angular momentum  L² = (I₁ω₁)² + (I₂ω₂)² + (I₃ω₃²)  → momentum sphere
# The polhode is the intersection of these two quadrics (Poinsot, 1834).
#
def _euler(omega):
    w1, w2, w3 = omega
    return np.array([
        (I2 - I3) * w2 * w3 / I1,
        (I3 - I1) * w3 * w1 / I2,
        (I1 - I2) * w1 * w2 / I3,
    ])


# ── QUATERNION KINEMATICS ─────────────────────────────────────────────────────
#
#   dq/dt = ½ · q ⊗ [0, ω₁, ω₂, ω₃]
#
# Right-multiplication propagates the body-frame angular velocity into the
# lab-frame orientation quaternion.  Using BEZIER interpolation later would
# violate the unit-sphere constraint; we enforce LINEAR and renormalise at
# every substep to keep ‖q‖ = 1 to machine precision.
#
def _qkin(q, omega):
    qw, qx, qy, qz = q
    p, qr, r = omega
    return 0.5 * np.array([
        -qx * p  - qy * qr - qz * r,
         qw * p  - qz * qr + qy * r,
         qw * qr + qz * p  - qx * r,
         qw * r  - qy * p  + qx * qr,
    ])


# ── COUPLED RK4 STEP ─────────────────────────────────────────────────────────

def _rk4(omega, q, dt):
    k1o = _euler(omega);          k1q = _qkin(q, omega)

    o2 = omega + 0.5*dt*k1o
    q2 = q     + 0.5*dt*k1q;     q2 /= np.linalg.norm(q2)
    k2o = _euler(o2);             k2q = _qkin(q2, o2)

    o3 = omega + 0.5*dt*k2o
    q3 = q     + 0.5*dt*k2q;     q3 /= np.linalg.norm(q3)
    k3o = _euler(o3);             k3q = _qkin(q3, o3)

    o4 = omega + dt*k3o
    q4 = q     + dt*k3q;         q4 /= np.linalg.norm(q4)
    k4o = _euler(o4);             k4q = _qkin(q4, o4)

    new_omega = omega + (dt/6.0)*(k1o + 2*k2o + 2*k3o + k4o)
    new_q     = q     + (dt/6.0)*(k1q + 2*k2q + 2*k3q + k4q)
    new_q /= np.linalg.norm(new_q)
    return new_omega, new_q


# ── INTEGRATE ─────────────────────────────────────────────────────────────────

omega = OMEGA0.copy()
q     = np.array([1.0, 0.0, 0.0, 0.0])   # lab frame = body frame initially

omega_log  = [omega.copy()]
orient_log = [q.copy()]

for _frame in range(N_FRAMES):
    for _sub in range(N_SUB):
        omega, q = _rk4(omega, q, DT)
    omega_log.append(omega.copy())
    orient_log.append(q.copy())

omega_log  = np.array(omega_log)    # (N_FRAMES+1, 3)
orient_log = np.array(orient_log)   # (N_FRAMES+1, 4) [qw, qx, qy, qz]

# Conservation report — target: < 1e-5 relative drift
T_log = 0.5*(I1*omega_log[:,0]**2 + I2*omega_log[:,1]**2 + I3*omega_log[:,2]**2)
L_log = np.sqrt((I1*omega_log[:,0])**2 + (I2*omega_log[:,1])**2 + (I3*omega_log[:,2])**2)
print(f"[blueprint] T_drift={abs(T_log[-1]-T_log[0])/T_log[0]:.2e}  L_drift={abs(L_log[-1]-L_log[0])/L_log[0]:.2e}")


# ── HELPERS ───────────────────────────────────────────────────────────────────

def _mat_emission(name, rgb, strength=8.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = (*rgb, 1.0)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs[0])
    return m

def _mat_metal(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value  = (0.07, 0.07, 0.10, 1.0)
    b.inputs["Metallic"].default_value    = 0.96
    b.inputs["Roughness"].default_value   = 0.12
    return m


# ── PURGE OLD OBJECTS ─────────────────────────────────────────────────────────

for _n in ("HF_PoiStaff", "HF_PoiHead", "HF_Polhode"):
    if _n in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[_n], do_unlink=True)

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = N_FRAMES


# ── POI STAFF CYLINDER ────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_cylinder_add(radius=STAFF_RADIUS, depth=STAFF_LENGTH)
staff      = bpy.context.active_object
staff.name = "HF_PoiStaff"
staff.data.materials.append(_mat_metal("hf_staff_metal"))

bpy.ops.mesh.primitive_uv_sphere_add(
    radius=STAFF_RADIUS * 2.4, segments=12, ring_count=8,
    location=(0.0, 0.0, STAFF_LENGTH * 0.5))
head        = bpy.context.active_object
head.name   = "HF_PoiHead"
head.parent = staff
head.data.materials.append(_mat_emission("hf_staff_head", (0.35, 0.85, 1.0), 10.0))

# Bake quaternion keyframes — LINEAR is mandatory on quaternion channels
staff.rotation_mode = "QUATERNION"
for fi, qv in enumerate(orient_log):
    staff.rotation_quaternion = Quaternion((qv[0], qv[1], qv[2], qv[3]))
    staff.keyframe_insert("rotation_quaternion", frame=fi + 1)
if staff.animation_data and staff.animation_data.action:
    for fc in staff.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


# ── POLHODE TRAIL ─────────────────────────────────────────────────────────────
# Body-frame ω in metres (scaled) — shows Poinsot polhode closed curve.
# For SYMMETRIC preset this closes exactly after one period; for ASYMMETRIC
# it closes after one Jacobi period; for INTERMEDIATE it does not close but
# instead executes large excursions — the tennis-racket flip visualised.

cu_data = bpy.data.curves.new("HF_Polhode_cu", "CURVE")
cu_data.dimensions   = "3D"
cu_data.bevel_depth  = BEVEL_TUBE
cu_data.bevel_resolution = 3
sp = cu_data.splines.new("POLY")
sp.points.add(len(omega_log) - 1)
S = POLHODE_SCALE
for i, ow in enumerate(omega_log):
    sp.points[i].co = (ow[0]*S, ow[1]*S, ow[2]*S, 1.0)

polhode      = bpy.data.objects.new("HF_Polhode", cu_data)
scn.collection.objects.link(polhode)
cu_data.materials.append(_mat_emission("hf_polhode", (1.0, 0.45, 0.08), 7.0))


# ── WORLD / EEVEE ────────────────────────────────────────────────────────────

scn.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
scn.render.engine = "BLENDER_EEVEE_NEXT"
if hasattr(scn.eevee, "bloom_threshold"):
    scn.eevee.bloom_threshold = 0.28
    scn.eevee.bloom_intensity = 1.8
    scn.eevee.bloom_radius    = 6.0

print(f"Scene built — {N_FRAMES} staff keyframes, polhode {len(omega_log)} points.")
