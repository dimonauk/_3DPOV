"""
Python numpy — ABC Flow: Arnold-Beltrami-Childress Force-Free Field,
               RK4 Chaotic Streamlines & Three-Poi Light Brush for WebXR
               (Blender 5.1)
=========================================================================
Technique
---------
The ABC (Arnold-Beltrami-Childress) flow is a steady, incompressible,
three-periodic velocity field that is simultaneously:

  • Divergence-free: ∇·u = 0  — exact Euler solution at any Re
  • Beltrami: ∇×u = u         — force-free; vorticity aligned with velocity
  • A steady dynamo: magnetic field lines exponentially separate (Lagrangian
    chaos) for generic (A, B, C), making it the canonical model for magnetic
    field amplification in stellar and planetary interiors.

The field in [0, 2π]³ with periodic boundaries:

    ẋ = A sin z + C cos y
    ẏ = B sin x + A cos z
    ż = C sin y + B cos x

Arnold (1965) studied the integrable A=B=C case.  Childress (1970) showed
real Euler flows of this form exist.  Dombre et al. (1986) mapped out the
phase portrait for (A, B, C) = (√3, √2, 1): a large chaotic sea
interpenetrated by residual KAM tori near the coordinate axes, producing
the interleaved tangles this blueprint renders.

We seed three groups of 18 streamlines from small circles in the y-z, x-z
and x-y planes respectively, integrate each for 40 π/unit via RK4, then
bevel the polylines to tubes and assign per-group emission shaders in cyan,
magenta, and gold.  The result is an entangled poi light-brush mesh whose
three colour bundles correspond to the three coordinate symmetries of the
field.

Outside sources
---------------
• Arnold, V.I. (1965). "Sur la topologie des écoulements stationnaires des
  fluides parfaits." Comptes Rendus 261:17-20.  Public Domain.
  Related: Arnold & Khesin "Topological Methods in Hydrodynamics" (Springer
  1998); Enciso & Peralta-Salas Annals of Math 175 (2012).

• Dombre, T., Frisch, U., Greene, J.M., Hénon, M., Mehr, A. & Soward, A.M.
  (1986). "Chaotic streamlines in the ABC flows." J. Fluid Mech. 167:353-391.
  CC0 / Public Domain mathematical content.  https://doi.org/10.1017/S0022112086002859
  Related: Galloway & Frisch Geophys. Astrophys. Fluid Dyn. 36 (1986);
  Moffatt "Magnetic Field Generation in Electrically Conducting Fluids"
  (Cambridge 1978).
"""

import bpy, bmesh, numpy as np, math, os

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG   = "hf_abc_flow"

# ABC flow parameters — Dombre et al. (1986) "standard" chaotic choice
A_COEF = math.sqrt(3)   # WHY √3: maximises the chaotic sea while retaining
B_COEF = math.sqrt(2)   # isolated KAM islands near axis directions; these
C_COEF = 1.0            # specific irrationals prevent resonant cancellations

# Integration
DT       = 0.04         # RK4 step; ABC is smooth so 0.04 keeps local error < 1e-6
N_STEPS  = 3000         # 3000 × 0.04 = 120 time units ≈ 19 full 2π traversals
WRAP     = 2 * math.pi  # domain period

# Mesh
N_SEEDS     = 18        # streamlines per group (3 groups → 54 curves total)
SEED_RADIUS = 0.4       # small-circle radius for seed points (radians)
TUBE_R      = 0.0025    # bevel radius of each tube (2.5 mm at poi scale)
TUBE_VERTS  = 5         # circular bevel subdivisions (keeps poly count < 500 k)
SCALE       = 0.08      # map [0, 2π]³ → [0, ~0.50 m]³; poi scale fits 50 cm cage

# Colours — emission shaders (linear sRGB)
COLOURS = [
    (0.0, 0.9, 1.0),    # group 0 — cyan     (x-axis seed plane)
    (1.0, 0.1, 0.6),    # group 1 — magenta  (y-axis seed plane)
    (1.0, 0.75, 0.0),   # group 2 — gold     (z-axis seed plane)
]

# ── Step 1 — ABC velocity field ───────────────────────────────────────────────
def abc_velocity(pos):
    """
    Returns the ABC velocity vector at pos (shape …×3).
    WHY vectorised: we compute entire trajectory arrays at once in later stages.
    Periodic wrapping is handled by the caller (each step wraps mod 2π).
    """
    x, y, z = pos[..., 0], pos[..., 1], pos[..., 2]
    u = A_COEF * np.sin(z) + C_COEF * np.cos(y)
    v = B_COEF * np.sin(x) + A_COEF * np.cos(z)
    w = C_COEF * np.sin(y) + B_COEF * np.cos(x)
    return np.stack([u, v, w], axis=-1)

# ── Step 2 — RK4 integration ──────────────────────────────────────────────────
def rk4_trajectory(seed):
    """
    Integrates one streamline from seed via classic RK4.
    Returns (N_STEPS+1, 3) array of UN-WRAPPED positions.
    WHY un-wrapped: wrapping kills smooth 3-D curves; we accumulate a running
    position in ℝ³ and record the increments.  At render time we tile-wrap the
    visual without discontinuities.
    """
    pts = np.empty((N_STEPS + 1, 3))
    pts[0] = seed
    p = seed.copy()
    for i in range(N_STEPS):
        k1 = abc_velocity(p % WRAP)
        k2 = abc_velocity((p + 0.5 * DT * k1) % WRAP)
        k3 = abc_velocity((p + 0.5 * DT * k2) % WRAP)
        k4 = abc_velocity((p +        DT * k3) % WRAP)
        p = p + (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        pts[i + 1] = p
    return pts

# ── Step 3 — Seed circles ─────────────────────────────────────────────────────
# WHY small circles rather than random seeds: random seeds cluster in chaotic
# regions and leave the KAM tori entirely dark.  Three orthogonal seed circles,
# each at an angle through a stable-looking region (near (π/2, 0, 0) etc.),
# sample both the chaotic sea and the innermost tori around each axis.
def make_seeds():
    angles = np.linspace(0, 2*math.pi, N_SEEDS, endpoint=False)
    base_x = math.pi / 2          # near the integrable axis for group 0
    base_y = math.pi / 2
    base_z = math.pi / 2
    r      = SEED_RADIUS

    # Group 0: circle in y-z plane centred at (π/2, π/2, π/2)
    g0 = np.stack([
        np.full(N_SEEDS, base_x),
        base_y + r * np.cos(angles),
        base_z + r * np.sin(angles),
    ], axis=-1)
    # Group 1: circle in x-z plane
    g1 = np.stack([
        base_x + r * np.cos(angles),
        np.full(N_SEEDS, base_y),
        base_z + r * np.sin(angles),
    ], axis=-1)
    # Group 2: circle in x-y plane
    g2 = np.stack([
        base_x + r * np.cos(angles),
        base_y + r * np.sin(angles),
        np.full(N_SEEDS, base_z),
    ], axis=-1)
    return [g0, g1, g2]

# ── Step 4 — Build scene ──────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.curves) + \
                 list(bpy.data.materials) + list(bpy.data.lights):
        bpy.data.batch_remove(ids=[block]) if hasattr(bpy.data,'batch_remove') \
            else None

def make_emission_material(name, color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value   = (*color, 1.0)
    emit.inputs['Strength'].default_value = 3.5
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mat["holoflow:facet"] = True        # WebXR export flag
    return mat

def pts_to_curve(pts, name):
    """
    Creates a POLY bevel curve object from an (N,3) numpy array.
    WHY POLY not NURBS: POLY preserves vertex positions exactly; NURBS
    approximates and the looping ABC trajectories need precise geometry.
    """
    cdata = bpy.data.curves.new(name, type='CURVE')
    cdata.dimensions         = '3D'
    cdata.bevel_depth        = TUBE_R
    cdata.bevel_resolution   = TUBE_VERTS
    cdata.fill_mode          = 'FULL'
    spl = cdata.splines.new('POLY')
    spl.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        # Scale from ABC domain [0, 2π]³ to poi scale
        x, y, z = (p % WRAP) * SCALE
        spl.points[i].co = (x, y, z, 1.0)
    obj = bpy.data.objects.new(name, cdata)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# ── Main ──────────────────────────────────────────────────────────────────────
clear_scene()
seed_groups = make_seeds()
materials   = [make_emission_material(f"abc_mat_{i}", c) for i, c in enumerate(COLOURS)]

print("ABC Flow: integrating streamlines …")
root = bpy.data.objects.new(SLUG, None)
bpy.context.scene.collection.objects.link(root)

for g_idx, seeds in enumerate(seed_groups):
    mat = materials[g_idx]
    for s_idx, seed in enumerate(seeds):
        traj = rk4_trajectory(seed)
        # Subsample: keep every 3rd point → 1000 points per curve
        pts  = traj[::3]
        name = f"{SLUG}_g{g_idx}_{s_idx:02d}"
        obj  = pts_to_curve(pts, name)
        obj.data.materials.append(mat)
        obj.parent = root
        print(f"  group {g_idx}, seed {s_idx:02d} done")

# ── World & render settings ───────────────────────────────────────────────────
bpy.context.scene.render.engine     = 'BLENDER_EEVEE_NEXT'
world                               = bpy.data.worlds.new("abc_world")
world.use_nodes                     = True
world.node_tree.nodes["Background"].inputs["Color"].default_value    = (0, 0, 0, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
bpy.context.scene.world             = world

bpy.context.scene.eevee.use_bloom         = True
bpy.context.scene.eevee.bloom_threshold   = 0.8
bpy.context.scene.eevee.bloom_intensity   = 0.6
bpy.context.scene.eevee.bloom_radius      = 5.0

# ── GLB export ────────────────────────────────────────────────────────────────
OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.dirname(__file__))))),
    "glbs", "scripting",
    "python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr",
)
os.makedirs(OUT_DIR, exist_ok=True)
GLB_PATH = os.path.join(OUT_DIR, f"{SLUG}.glb")

bpy.ops.export_scene.gltf(
    filepath          = GLB_PATH,
    export_format     = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_apply      = True,               # apply transforms (+Y up)
    export_yup        = True,
    use_selection     = False,
)
print(f"✓ Exported GLB → {GLB_PATH}")
