"""
N-Body Gravity — Star Cluster Collapse via Leapfrog Integration (Blender 5.1)
===============================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Twenty-four equal-mass stars initialised in a cold rotating Plummer disk
(virial ratio Q=0.25) collapse under mutual softened Newtonian gravity,
develop streaming orbital arms through differential rotation, and produce
poi light-painting trails that trace the gravitational choreography.

Each star's trajectory is pre-integrated in Python using KDK leapfrog —
a symplectic (structure-preserving) integrator that exactly conserves a
modified Hamiltonian, bounding energy drift over many orbital periods where
explicit Euler or even RK4 would accumulate secular errors.

Physics:
  Softened acceleration on star i from star j:
    a_ij = G·m_j·(r_j − r_i) / (|r_j − r_i|² + ε²)^(3/2)
  ε (softening length) ≈ 0.20 BU prevents 1/r singularity at close
  encounters; physically represents the finite size of a star cluster core.

  KDK Leapfrog (Kick-Drift-Kick, one step):
    v_{n+½} = v_n    + a_n       · (dt/2)   # half-kick
    x_{n+1} = x_n   + v_{n+½}   · dt        # full drift
    a_{n+1} = F(x_{n+1}) / m                # recompute forces
    v_{n+1} = v_{n+½} + a_{n+1} · (dt/2)   # half-kick

  Plummer sphere density: ρ(r) = (3M/4πa³)·(1 + r²/a²)^(−5/2)
  CDF inversion draw:     r = a / √(u^(−2/3) − 1),  u ~ U(0, 1)
  Circular velocity from smooth Plummer potential:
    v_c(r) = √(G·M·r² / (r² + a²)^(3/2))

Outside sources:
  REBOUND N-body integrator  MIT  Hanno Rein & David S. Spiegel
    https://github.com/hannorein/rebound
    related: https://rebound.readthedocs.io/
  pytreegrav treecode gravity  MIT  Mike Grudic & Lehman Garrison
    https://github.com/mikegrudic/pytreegrav
    related: https://github.com/mikegrudic/flathub
"""

import bpy, math, random, os, copy

# ── Constants ─────────────────────────────────────────────────────────────────
SLUG          = "hf_nbody"
N_STARS       = 24          # direct O(N²) sum — fine at this count
PLUMMER_A     = 1.2         # Plummer scale radius [Blender units]
G             = 1.0         # gravitational constant (N-body units, total mass=1)
TOTAL_MASS    = 1.0
MASS          = TOTAL_MASS / N_STARS
SOFTENING     = 0.20        # ε — prevents 1/r singularity (~17% of a)
DT            = 0.005       # leapfrog timestep in N-body time units
N_SUBSTEPS    = 4           # KDK steps per recorded frame
N_FRAMES      = 400         # animation frames
VIRIAL_PERTURB = 0.12       # Gaussian σ on v as fraction of v_circ
TUBE_R        = 0.012       # bevel tube radius [BU]
BEVEL_RES     = 3           # bevel polygon sides = 4*(RES+1) = 16
EMIT_STR      = 12.0        # emission strength (pushes above EEVEE bloom threshold)
SEED          = 42

# Six neon hues, four stars each
NEON = [
    (0.02, 0.85, 1.00),   # sky-blue
    (1.00, 0.20, 0.90),   # hot-pink
    (0.15, 1.00, 0.30),   # neon-green
    (1.00, 0.65, 0.05),   # amber
    (0.55, 0.15, 1.00),   # violet
    (0.05, 0.90, 0.65),   # teal
]

# ── Plummer-disk initial conditions ───────────────────────────────────────────
def _plummer_disk(n, a, total_mass, sigma_frac, seed):
    """Sample n stars from a rotating thin Plummer disk.

    Stars have circular velocities from the smooth analytic Plummer potential
    plus a Gaussian perturbation (sigma_frac of v_circ).  The asymmetry in
    the perturbations seeds differential winding: inner stars complete
    orbits faster, stretching initial clumps into streaming arms.
    Returns (pos, vel) each a list of n [x, y, z] lists.
    """
    rng = random.Random(seed)
    pos, vel = [], []
    for _ in range(n):
        # 3D Plummer CDF inversion — thin disk: rescale z by 0.12
        u   = rng.uniform(1e-4, 1.0 - 1e-4)
        r3d = a / math.sqrt(max(u ** (-2.0 / 3.0) - 1.0, 1e-10))
        phi = rng.uniform(0.0, 2.0 * math.pi)
        z   = rng.gauss(0.0, a * 0.12)
        px, py = r3d * math.cos(phi), r3d * math.sin(phi)
        pos.append([px, py, z])

        # Circular velocity from smooth Plummer potential at projected radius
        r_xy  = math.hypot(px, py)
        m_enc = total_mass * r_xy ** 3 / (r_xy ** 2 + a ** 2) ** 1.5
        v_c   = math.sqrt(G * m_enc / r_xy) if r_xy > 1e-3 else 0.0

        # Tangential (counter-clockwise) + random perturbation
        sx = sigma_frac * v_c
        vx = -v_c * math.sin(phi) + rng.gauss(0.0, sx)
        vy =  v_c * math.cos(phi) + rng.gauss(0.0, sx)
        vz =  rng.gauss(0.0, sx * 0.3)
        vel.append([vx, vy, vz])
    return pos, vel

# ── Softened N-body force (O(N²) direct sum) ──────────────────────────────────
def _accelerations(pos, mass, eps):
    """Return list of [ax, ay, az] for each particle.  Newton's third law
    halves the work: compute pair (i,j) once, add to both."""
    n    = len(pos)
    acc  = [[0.0, 0.0, 0.0] for _ in range(n)]
    eps2 = eps * eps
    for i in range(n):
        xi, yi, zi = pos[i]
        for j in range(i + 1, n):
            dx = pos[j][0] - xi
            dy = pos[j][1] - yi
            dz = pos[j][2] - zi
            r2  = dx * dx + dy * dy + dz * dz + eps2
            inv = 1.0 / (r2 ** 1.5)
            fi  = G * mass * inv  # acceleration magnitude on i from j
            acc[i][0] += fi * dx;  acc[i][1] += fi * dy;  acc[i][2] += fi * dz
            acc[j][0] -= fi * dx;  acc[j][1] -= fi * dy;  acc[j][2] -= fi * dz
    return acc

# ── KDK Leapfrog step ─────────────────────────────────────────────────────────
def _kdk_step(pos, vel, acc, dt, mass, eps):
    """Mutates pos/vel in place; updates acc to match new positions.
    KDK (Kick-Drift-Kick) is symplectic: it preserves phase-space volume and
    conserves a modified Hamiltonian, keeping long-run energy error O(dt²)
    rather than the secular drift of Euler or the non-symplectic RK4."""
    n   = len(pos)
    hdt = dt * 0.5
    for i in range(n):
        vel[i][0] += acc[i][0] * hdt
        vel[i][1] += acc[i][1] * hdt
        vel[i][2] += acc[i][2] * hdt
    for i in range(n):
        pos[i][0] += vel[i][0] * dt
        pos[i][1] += vel[i][1] * dt
        pos[i][2] += vel[i][2] * dt
    new_acc = _accelerations(pos, mass, eps)
    acc[:] = new_acc
    for i in range(n):
        vel[i][0] += acc[i][0] * hdt
        vel[i][1] += acc[i][1] * hdt
        vel[i][2] += acc[i][2] * hdt

# ── Integration ───────────────────────────────────────────────────────────────
def _integrate(pos, vel):
    """Run N_FRAMES * N_SUBSTEPS KDK steps, snapshot positions every N_SUBSTEPS.
    Returns traj[frame][star] = [x, y, z], shape (N_FRAMES+1, N_STARS, 3)."""
    acc  = _accelerations(pos, MASS, SOFTENING)
    snap = lambda: [[p[0], p[1], p[2]] for p in pos]
    traj = [snap()]
    for _ in range(N_FRAMES):
        for _ in range(N_SUBSTEPS):
            _kdk_step(pos, vel, acc, DT, MASS, SOFTENING)
        traj.append(snap())
    return traj

# ── Scene helpers ─────────────────────────────────────────────────────────────
def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.curves, bpy.data.node_groups):
        for b in list(col):
            col.remove(b, do_unlink=True)

def _emission_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    t   = mat.node_tree
    t.nodes.clear()
    em  = t.nodes.new('ShaderNodeEmission')
    out = t.nodes.new('ShaderNodeOutputMaterial')
    em.inputs['Color'].default_value    = (*rgb, 1.0)
    em.inputs['Strength'].default_value = EMIT_STR
    t.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return mat

def _setup_camera():
    cam = bpy.data.cameras.new("Camera")
    cam.type = 'PERSP'; cam.lens = 28.0
    ob  = bpy.data.objects.new("Camera", cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.location       = (0.0, -7.5, 5.8)
    ob.rotation_euler = (math.radians(52), 0.0, 0.0)
    bpy.context.scene.camera = ob

def _setup_world_and_eevee():
    w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background") or w.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value    = (0.0, 0.0, 0.0, 1.0)
    bg.inputs['Strength'].default_value = 0.0
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    ep = scene.eevee
    ep.use_bloom       = True
    ep.bloom_threshold = 0.30
    ep.bloom_intensity = 1.2
    ep.bloom_radius    = 5.0

def _make_trail(name, pts, mat):
    """Build a POLY bevel-curve trail with animated bevel_factor_end 0→1."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions      = '3D'
    cu.bevel_depth     = TUBE_R
    cu.bevel_resolution = BEVEL_RES
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, (x, y, z) in enumerate(pts):
        sp.points[i].co = (x, y, z, 1.0)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    cu.bevel_factor_end = 0.0
    cu.keyframe_insert('bevel_factor_end', frame=1)
    cu.bevel_factor_end = 1.0
    cu.keyframe_insert('bevel_factor_end', frame=N_FRAMES)
    if cu.animation_data and cu.animation_data.action:
        for fc in cu.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'
    return ob

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    _purge()
    _setup_world_and_eevee()

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = N_FRAMES
    scene.render.fps  = 30

    pos, vel = _plummer_disk(N_STARS, PLUMMER_A, TOTAL_MASS, VIRIAL_PERTURB, SEED)
    print(f"[{SLUG}] Integrating {N_STARS} stars × {N_FRAMES * N_SUBSTEPS} steps …")
    traj = _integrate(copy.deepcopy(pos), copy.deepcopy(vel))

    mats = [_emission_mat(f"star_{i:02d}", NEON[i % len(NEON)]) for i in range(N_STARS)]
    for i in range(N_STARS):
        pts = [traj[f][i] for f in range(N_FRAMES + 1)]
        _make_trail(f"{SLUG}_star_{i:02d}", pts, mats[i])

    _setup_camera()

    blend_dir = bpy.path.abspath("//")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, f"{SLUG}.blend"))

    # GLB: export at final frame so bevel_factor_end=1 on all trails
    scene.frame_set(N_FRAMES)
    bpy.ops.export_scene.gltf(
        filepath        = os.path.join(blend_dir, f"{SLUG}.glb"),
        export_format   = 'GLB',
        export_apply    = True,
        export_materials = 'EXPORT',
        use_selection   = False,
    )
    print(f"[{SLUG}] Done — blend + GLB written to {blend_dir}")

main()
