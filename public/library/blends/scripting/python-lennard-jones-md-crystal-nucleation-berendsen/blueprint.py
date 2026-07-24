"""
Python — 2D Lennard-Jones MD: Crystal Nucleation & Berendsen Thermostat (Blender 5.1)
========================================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

2-D Lennard-Jones molecular dynamics on a periodic square box.
A Berendsen thermostat cools the system from a disordered hot liquid (T*=2.0)
through the hexatic intermediate phase to a polycrystalline solid (T*=0.35),
making visible hexagonal domain nucleation.

  V(r) = 4ε[(σ/r)¹² − (σ/r)⁶]   for r < r_cut = 2.5σ
  F_ij = (48/r²)[(σ/r)¹² − 0.5(σ/r)⁶] · r_ij   (reduced units: ε=σ=m=1)

Integrator: Velocity Verlet (time-reversible, symplectic).
Thermostat: Berendsen velocity-rescaling with τ_B = 0.5 LJ time units.
  λ = √(1 + (dt/τ_B)(T_target/T_curr − 1))

Outside sources:
  jax-md  Apache-2.0  Google Brain
    https://github.com/google/jax-md
    related: https://github.com/google/jax
  OpenMM  MIT  Stanford / OpenMM contributors
    https://github.com/openmm/openmm
    related: https://github.com/openmm/openmmtools
  NumPy  BSD-3-Clause  NumPy Contributors
    https://github.com/numpy/numpy
    related: https://github.com/scipy/scipy
"""

import bpy, bmesh, math, numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
N_PART      = 100      # particle count (10×10 initial lattice)
L_BOX       = 11.0     # periodic box side (σ); density ρ* = N/L² ≈ 0.826
R_CUT       = 2.5      # LJ cutoff radius (σ)
DT          = 0.005    # time step (τ = σ√(m/ε) reduced time)
N_SUBSTEPS  = 8        # Velocity Verlet substeps per Blender frame
N_FRAMES    = 240      # total frames → 9.6 τ simulated
T_START     = 2.0      # initial T* (k_B T/ε) — hot disordered liquid
T_END       = 0.35     # final T* — crystal stable below ~0.45 at ρ*=0.826
TAU_B       = 0.5      # Berendsen coupling constant (τ)
SCALE       = 0.23     # Blender units per σ → box = 2.53 Blender units
SPHERE_R    = 0.085    # icosphere radius (Blender units ≈ 0.37σ)
SLUG        = "python-lennard-jones-md-crystal-nucleation-berendsen"
RNG         = np.random.default_rng(42)


def purge() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.node_groups, bpy.data.actions):
        for b in list(col):
            col.remove(b, do_unlink=True)


# ── LJ force engine ───────────────────────────────────────────────────────────

def lj_forces(pos: np.ndarray) -> np.ndarray:
    """Vectorised 2D LJ forces with minimum-image periodic BC.

    Displacement matrix dr (N×N×2) uses broadcasting — no Python loop over
    pairs.  The minimum-image fold dr -= L*round(dr/L) wraps each component
    into (−L/2, L/2], implementing the nearest-image PBC convention.

    Force formula (gradient of V):
      F_ij = −∂V/∂r · r̂ = (48/r^14 − 24/r^8) · r_ij
           = (48/r²)·[(1/r)¹² − 0.5·(1/r)⁶] · r_ij

    Sign convention: dr[i,j] = pos[i] − pos[j] points FROM j TO i, so
    F on i = Σ_j f_scalar[i,j] · (−dr[i,j]) = attraction pulls i toward j.
    """
    dr   = pos[:, None, :] - pos[None, :, :]          # (N, N, 2)
    dr  -= L_BOX * np.round(dr / L_BOX)               # minimum image
    r2   = np.einsum('ijk,ijk->ij', dr, dr)            # (N, N)
    mask = (r2 < R_CUT**2) & (r2 > 1e-12)
    r2s  = np.where(mask, r2, 1.0)                    # safe denominator
    r2i  = 1.0 / r2s
    r6i  = r2i ** 3
    fsc  = np.where(mask, 48.0 * r2i * (r6i**2 - 0.5 * r6i), 0.0)
    # F_i = Σ_j fsc[i,j] · (−dr[i,j])  (dr = pos_i − pos_j, force toward j)
    return -np.einsum('ij,ijk->ik', fsc, dr)           # (N, 2)


def berendsen_lam(vel: np.ndarray, T_target: float) -> float:
    """λ for Berendsen velocity rescaling.  2D: T = Σ|v|²/(2N)."""
    T_curr = np.sum(vel ** 2) / (2.0 * N_PART)
    if T_curr < 1e-10:
        return 1.0
    return math.sqrt(max(1.0 + (DT / TAU_B) * (T_target / T_curr - 1.0), 0.01))


def run_md() -> np.ndarray:
    """Velocity Verlet + Berendsen cooling.

    Returns trajectory array (N_FRAMES × N_PART × 2) in LJ σ units.

    Initial positions: square lattice with small random jitter to break
    perfect symmetry (pure lattice has degenerate forces along axes).
    """
    nx   = int(math.sqrt(N_PART))
    a    = L_BOX / nx
    xi, yi = np.meshgrid(np.arange(nx), np.arange(nx), indexing='ij')
    pos  = np.column_stack([
        xi.ravel() * a + (yi.ravel() % 2) * 0.5 * a,   # hex stagger on alt rows
        yi.ravel() * a
    ]) + RNG.uniform(-0.08, 0.08, (N_PART, 2))
    pos %= L_BOX

    vel  = RNG.normal(0.0, math.sqrt(T_START), (N_PART, 2))
    vel -= vel.mean(axis=0)                              # zero net momentum

    # Linear T schedule over all steps
    T_sched = np.linspace(T_START, T_END, N_FRAMES * N_SUBSTEPS)
    acc     = lj_forces(pos)
    traj    = np.zeros((N_FRAMES, N_PART, 2), dtype=np.float32)
    step    = 0

    for frame in range(N_FRAMES):
        for _ in range(N_SUBSTEPS):
            vel += 0.5 * acc * DT
            pos += vel * DT
            pos %= L_BOX
            acc  = lj_forces(pos)
            vel += 0.5 * acc * DT
            vel *= berendsen_lam(vel, T_sched[step])
            step += 1
        traj[frame] = pos.astype(np.float32)

    return traj


# ── Scene assembly ─────────────────────────────────────────────────────────────

def make_material() -> tuple:
    """Emission material whose colour is keyframed: white-hot → cyan → violet."""
    mat = bpy.data.materials.new("LJ_Particle")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = 9.0
    emit.inputs['Color'].default_value    = (1.0, 0.88, 0.72, 1.0)  # warm white (hot)
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    out.location  = (300, 0)
    emit.location = (0, 0)
    return mat, emit


def build_scene(traj: np.ndarray) -> None:
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, N_FRAMES

    mat, emit_node = make_material()

    # Keyframe global emission colour as global temperature cools
    half = L_BOX * 0.5 * SCALE
    emit_node.inputs['Color'].default_value = (1.0, 0.88, 0.72, 1.0)
    emit_node.inputs['Color'].keyframe_insert('default_value', frame=1)
    emit_node.inputs['Color'].default_value = (0.12, 0.90, 0.92, 1.0)  # cyan: liquid
    emit_node.inputs['Color'].keyframe_insert('default_value', frame=100)
    emit_node.inputs['Color'].default_value = (0.28, 0.04, 0.82, 1.0)  # violet: crystal
    emit_node.inputs['Color'].keyframe_insert('default_value', frame=N_FRAMES)

    # Shared icosphere mesh
    base = bpy.data.meshes.new("atom_base")
    bm   = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=SPHERE_R)
    bm.to_mesh(base); bm.free()

    col = bpy.data.collections.new("LJ_Atoms")
    sc.collection.children.link(col)

    # Build fast fcurves for all N_PART × 3 axes — bypasses slow keyframe_insert
    # traj: (N_FRAMES, N_PART, 2) in σ; map to Blender XZ plane (+Y up)
    tx = traj[:, :, 0] * SCALE - half   # (N_FRAMES, N_PART) Blender X
    tz = traj[:, :, 1] * SCALE - half   # (N_FRAMES, N_PART) Blender Z
    frames_f = np.arange(1, N_FRAMES + 1, dtype=np.float32)

    for i in range(N_PART):
        obj = bpy.data.objects.new(f"atom_{i:03d}", base)
        col.objects.link(obj)
        obj.data.materials.append(mat)
        obj.location = (float(tx[0, i]), 0.0, float(tz[0, i]))

        act = bpy.data.actions.new(f"atom_{i:03d}")
        obj.animation_data_create()
        obj.animation_data.action = act

        for axis, vals in enumerate([tx[:, i], None, tz[:, i]]):
            fcu = act.fcurves.new(data_path='location', index=axis)
            pts = fcu.keyframe_points
            pts.add(N_FRAMES)
            y_vals = vals if vals is not None else np.zeros(N_FRAMES, dtype=np.float32)
            for f in range(N_FRAMES):
                kp = pts[f]
                kp.co           = (frames_f[f], float(y_vals[f]))
                kp.interpolation = 'LINEAR'
            fcu.update()

    # Orthographic top-down camera (XZ plane = floor)
    cam_d = bpy.data.cameras.new("cam")
    cam_d.type        = 'ORTHO'
    cam_d.ortho_scale = L_BOX * SCALE * 1.12
    cam_o = bpy.data.objects.new("camera", cam_d)
    sc.collection.objects.link(cam_o)
    sc.camera           = cam_o
    cam_o.location      = (0.0, -4.0, 0.0)
    cam_o.rotation_euler = (math.pi * 0.5, 0.0, 0.0)

    sc.world.node_tree.nodes['Background'].inputs['Color'].default_value = (
        0.004, 0.002, 0.014, 1.0)
    sc.eevee.use_bloom       = True
    sc.eevee.bloom_threshold = 0.22
    sc.eevee.bloom_intensity = 1.3
    sc.eevee.bloom_radius    = 4.0

    bpy.ops.wm.save_as_mainfile(filepath="hf_lj_crystal.blend")
    print(f"[blueprint.py] saved hf_lj_crystal.blend — {N_PART} atoms × {N_FRAMES} frames")


def main() -> None:
    purge()
    print("[blueprint.py] integrating LJ-MD trajectory …")
    traj = run_md()
    print(f"[blueprint.py] trajectory {traj.shape} — assembling scene …")
    build_scene(traj)


if __name__ == '__main__':
    main()
