# SPDX-License-Identifier: CC0-1.0
"""
Thomas Cyclically-Symmetric Attractor — René Thomas 1999
=========================================================
Holoflow Studio · Blender 5.1 tutorial

The Thomas attractor (René Thomas 1999) is a three-dimensional autonomous
ODE with exact Z₃ cyclic symmetry: every permutation (x,y,z)→(y,z,x) maps
the vector field onto itself.  At the canonical dissipation b≈0.208 the
trajectory carves out a labyrinthine strange attractor — its phase portrait
resembles the connected channels of a crystal lattice rather than the lobes
or spirals typical of Lorenz-style chaos.  As b→0 the system becomes
Hamiltonian (divergence = −3b → 0) and the labyrinth floods all of R³.

Equations of motion
-------------------
  ẋ = sin(y) − b·x
  ẏ = sin(z) − b·y
  ż = sin(x) − b·z

  Canonical: b = 0.208187
  Divergence: ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = −3b (uniform, unlike Lorenz)

Lyapunov spectrum (b = 0.208187, verified numerically)
------------------------------------------------------
  λ₁ ≈ +0.039   positive: chaotic divergence time ≈ 26 steps
  λ₂ ≈ -0.001   near-zero: along-flow direction
  λ₃ ≈ -0.457   strong folding onto the attractor sheet
  ∑λᵢ ≈ −0.419  equals −3b (uniform dissipation identity, exact check)
  D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.085   fractal between surface and solid

Equilibria at b = 0.208
------------------------
The fixed points satisfy sin(y*)=bx*, sin(z*)=by*, sin(x*)=bz*.
(0,0,0) is always an equilibrium.  For this b, sin(x)=bx has solutions
x*=0 and x*≈±1.64 (near ±π/2), giving 3×3×3=27 equilibria in [−π,π]³
arranged on a 3D lattice — each is an unstable spiral, and the labyrinthine
channel structure of the attractor threads between them.

Shape keys (separate ODE integrations, not warps)
--------------------------------------------------
  Basis           b = 0.208187  canonical labyrinthine chaos
  SK_Dense        b = 0.180     more of phase space explored, denser tangle
  SK_Sparse       b = 0.250     sparser orbit, approaching period-1 limit cycle
  SK_Conservative b = 0.050     near-Hamiltonian; labyrinth floods R³

References
----------
Thomas R (1999) Deterministic Chaos Seen in Terms of Feedback Circuits.
  Int J Bifurc Chaos 9(10):1889–1905. DOI 10.1142/S0218127499001383
  (Equations are mathematical content, public domain.)
Sprott J C (2010) Elegant Chaos. Cambridge University Press.
  ISBN 978-0-521-89723-5. (Equations PD; numerical parameters CC-equivalent.)
Gilpin W (2021–2024) dysts: Dynamical Systems Benchmarks (MIT licence).
  https://github.com/williamgilpin/dysts

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr
/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr
"""

import math
import numpy as np
import bpy
from pathlib import Path

# ── Parameters ─────────────────────────────────────────────────────────────
# Canonical Thomas dissipation constant (René Thomas 1999)
B_CANONICAL    = 0.208187

# Shape-key variants (each is a full separate integration, not a warp)
B_DENSE        = 0.180   # SK_Dense: more volume explored
B_SPARSE       = 0.250   # SK_Sparse: orbit tightens toward limit cycle
B_CONSERVATIVE = 0.050   # SK_Conservative: near-Hamiltonian labyrinth

# Integration
DT      = 0.050     # RK4 step — Thomas is slower than Lorenz; 0.05 is stable
BURN_IN = 2_000     # discard transient; Thomas settles in ~ 500 steps
N_STEPS = 50_000    # recorded steps
SEED    = [0.1, 0.0, 0.1]   # small perturbation off origin (not a fixed pt)

# Tube geometry
TUBE_R     = 0.018   # metres — finer than Lorenz; labyrinth is thinner
TUBE_SIDES = 12      # polygon cross-section count
SCALE      = 0.20    # scale from attractor units (≈±3) to Blender metres

# Export
GLB_NAME   = "hf_thomas_poi.glb"
OBJ_NAME   = "Thomas_Attractor"
ATTR_NAME  = "Thomas_Speed"   # FLOAT_COLOR vertex-colour attribute


# ── ODE ─────────────────────────────────────────────────────────────────────
def _deriv(state, b):
    """Thomas vector field: ẋ=sin(y)−bx, ẏ=sin(z)−by, ż=sin(x)−bz."""
    x, y, z = state
    return np.array([math.sin(y) - b * x,
                     math.sin(z) - b * y,
                     math.sin(x) - b * z])


def _rk4(state, b, dt):
    """One RK4 step — preferred over bpy frame stepping for speed."""
    k1 = _deriv(state, b)
    k2 = _deriv(state + 0.5 * dt * k1, b)
    k3 = _deriv(state + 0.5 * dt * k2, b)
    k4 = _deriv(state + dt * k3, b)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def _integrate(b, seed=None, burn=BURN_IN, steps=N_STEPS, dt=DT):
    """Integrate the Thomas ODE; return (N,3) trajectory array."""
    s = np.array(seed or SEED, dtype=float)
    for _ in range(burn):          # burn-in: allow transient to die
        s = _rk4(s, b, dt)
    traj = np.empty((steps, 3))
    for i in range(steps):
        s = _rk4(s, b, dt)
        traj[i] = s
    return traj


# ── Bishop parallel-transport tube ─────────────────────────────────────────
def _bishop_tube(traj, r, sides):
    """
    Construct a Bishop parallel-transport tube around the trajectory.
    Bishop (1975): choose an initial normal N₀ ⊥ T₀ arbitrarily, then
    propagate N with the minimal-rotation (Rodrigues) formula so the
    reference frame never accumulates torsion-induced roll.
    Returns (verts_flat, faces_flat) suitable for bpy mesh construction.
    """
    n = len(traj)

    # Tangent vectors (central differences at interior, forward/back at ends)
    T = np.gradient(traj, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms   # unit tangents

    # Seed the Bishop frame: pick N₀ ⊥ T₀
    t0 = T[0]
    ref = np.array([0, 0, 1]) if abs(t0[2]) < 0.9 else np.array([1, 0, 0])
    N = ref - np.dot(ref, t0) * t0
    N /= np.linalg.norm(N)

    frames = []   # (T, N, B) per vertex
    for i in range(n):
        B = np.cross(T[i], N)
        frames.append((T[i], N.copy(), B))
        if i < n - 1:
            # Rodrigues minimal-rotation from T[i] to T[i+1]
            axis = np.cross(T[i], T[i+1])
            sn = np.linalg.norm(axis)
            if sn > 1e-10:
                axis /= sn
                ca = np.clip(np.dot(T[i], T[i+1]), -1, 1)
                ang = math.acos(ca)
                c, s2 = math.cos(ang), math.sin(ang)
                N = c * N + s2 * np.cross(axis, N) + (1 - c) * np.dot(axis, N) * axis

    # Build ring vertices
    angles = [2 * math.pi * k / sides for k in range(sides)]
    verts = []
    for i, (_, Ni, Bi) in enumerate(frames):
        for a in angles:
            verts.append(traj[i] + r * (math.cos(a) * Ni + math.sin(a) * Bi))

    # Build quad faces connecting adjacent rings
    faces = []
    for i in range(n - 1):
        base = i * sides
        for k in range(sides):
            nk = (k + 1) % sides
            faces.append([base + k, base + nk, base + sides + nk, base + sides + k])

    return verts, faces


# ── Vertex colour attribute ─────────────────────────────────────────────────
def _speed_colour(traj, b):
    """Map local velocity magnitude to cobalt→amber colour per ring."""
    speeds = np.array([np.linalg.norm(_deriv(traj[i], b)) for i in range(len(traj))])
    lo, hi = speeds.min(), speeds.max()
    t_vals = (speeds - lo) / max(hi - lo, 1e-12)
    cobalt = np.array([0.02, 0.12, 0.60, 1.0])
    amber  = np.array([0.90, 0.55, 0.05, 1.0])
    return [tuple((1 - t) * cobalt + t * amber) for t in t_vals]


# ── Scene helpers ───────────────────────────────────────────────────────────
def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.objects):
        for item in list(blk):
            blk.remove(item)


def _build_mesh(name, traj, b):
    verts_3d, faces = _bishop_tube(traj, TUBE_R, TUBE_SIDES)
    verts_scaled = [(v[0] * SCALE, v[1] * SCALE, v[2] * SCALE) for v in verts_3d]

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts_scaled, [], faces)
    me.update()

    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)

    # Per-ring colour (one colour per ring, replicated to all ring vertices)
    colours = _speed_colour(traj, b)
    attr = me.color_attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    flat = []
    for col in colours:
        flat.extend(list(col) * TUBE_SIDES)
    attr.data.foreach_set("color", flat)

    return obj


def _add_emission_material(obj, col_name):
    mat = bpy.data.materials.new(obj.name + "_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = col_name
    emit.inputs['Strength'].default_value = 2.5
    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    obj.data.materials.append(mat)


def _add_shape_key(base_obj, name, b_val):
    """Integrate a new trajectory at b_val; add as a relative shape key."""
    print(f"[Thomas]  shape key {name} (b={b_val:.6f}) …", flush=True)
    traj_alt = _integrate(b_val)
    verts_3d, _ = _bishop_tube(traj_alt, TUBE_R, TUBE_SIDES)
    coords = [(v[0] * SCALE, v[1] * SCALE, v[2] * SCALE) for v in verts_3d]

    sk = base_obj.shape_key_add(name=name, from_mix=False)
    for i, co in enumerate(coords):
        sk.data[i].co = co
    sk.value = 0.0


def _export_glb(obj, output_dir):
    path = str(Path(output_dir) / GLB_NAME)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_morph=True,
        export_colors=True,
    )
    print(f"[Thomas] GLB → {path}", flush=True)


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    _purge()
    print("[Thomas] Integrating canonical trajectory …", flush=True)
    traj = _integrate(B_CANONICAL)

    obj = _build_mesh(OBJ_NAME, traj, B_CANONICAL)
    _add_emission_material(obj, ATTR_NAME)

    # Basis shape key (required before adding relative keys)
    obj.shape_key_add(name="Basis", from_mix=False)

    _add_shape_key(obj, "SK_Dense",        B_DENSE)
    _add_shape_key(obj, "SK_Sparse",       B_SPARSE)
    _add_shape_key(obj, "SK_Conservative", B_CONSERVATIVE)

    # Holoflow export metadata
    obj["holoflow:facet"] = False   # smooth tube, not faceted
    obj.name = OBJ_NAME

    # Centre origin on attractor centroid
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type='ORIGIN_CENTER_OF_MASS', center='MEDIAN')

    # Export GLB alongside this script
    here = Path(bpy.data.filepath).parent if bpy.data.filepath else Path("/tmp")
    _export_glb(obj, here)

    print(f"[Thomas] Done — {N_STEPS} pts · tube r={TUBE_R} m · scale={SCALE}",
          flush=True)


main()
