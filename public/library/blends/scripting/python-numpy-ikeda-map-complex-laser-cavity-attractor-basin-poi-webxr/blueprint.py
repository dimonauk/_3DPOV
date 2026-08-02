# ============================================================
# Ikeda Map — Complex Laser Cavity Attractor
# Blender 5.1 / Python + numpy blueprint
# CC0 1.0 Universal — Holoflow Studio
# ============================================================
# The Ikeda recurrence z_{n+1} = a + b·z·exp(i·t(z)),
# t(z) = c − d/(1+|z|²)  models the complex field amplitude
# inside a ring laser cavity where the Kerr medium applies
# intensity-dependent phase shift d/(1+I) and the cavity
# roundtrip reintroduces fixed offset a.  For b ≥ 0.6 the
# map becomes dissipative-chaotic; b=0.9 produces a strange
# attractor whose topology is a product of a Cantor set and
# a smooth curve — the same non-integer Hausdorff dimension
# that makes long-exposure light-painting photographs of poi
# orbits look fractal.
# ============================================================

import bpy, bmesh, numpy as np

# ─────────────────────── PARAMETERS ─────────────────────────
A        = 1.0           # additive constant (cavity offset)
C        = 0.4           # phase modulation wavenumber
D        = 6.0           # saturation denominator for t(z)
B_BASIS  = 0.85          # b used for Basis shape key
B_VALS   = [0.70, 0.85, 0.92]   # b sweep: period-2, edge-of-chaos, full chaos
N_WARMUP = 600           # warmup iterations to land on attractor
N_TRAIL  = 400           # extra iterations recorded per seed
N_SEEDS  = 180_000       # independent starting points (cloud density)
GRID_N   = 320           # density histogram resolution
MESH_N   = 120           # quad-mesh resolution (MESH_N² vertices)
Z_SCALE  = 0.40          # height-field amplitude in Blender units
EXTENT   = 3.2           # ℂ-plane window radius
OBJ_NAME = "hf_ikeda"
GLB_PATH = "//hf_ikeda.glb"
# ─────────────────────────────────────────────────────────────

rng = np.random.default_rng(0xC0FFEE)


def ikeda_batch(z: np.ndarray, b: float, n: int) -> np.ndarray:
    """Vectorised Ikeda iteration for n steps.
    Passing all N_SEEDS points as one array lets numpy use
    BLAS-level complex multiply; avoids Python loop overhead.
    """
    for _ in range(n):
        t = C - D / (1.0 + z.real ** 2 + z.imag ** 2)
        z = A + b * z * np.exp(1j * t)
    return z


def attractor_density(b: float) -> np.ndarray:
    """Return (GRID_N, GRID_N) normalised density histogram.

    Seeds cover ℂ in [-EXTENT, EXTENT]² uniformly.  After
    N_WARMUP steps every point is on (or very near) the
    attractor; N_TRAIL further steps accumulate the cloud.
    """
    z = (rng.uniform(-EXTENT, EXTENT, N_SEEDS) +
         1j * rng.uniform(-EXTENT, EXTENT, N_SEEDS))
    z = ikeda_batch(z, b, N_WARMUP)          # discard transient
    all_pts = []
    for _ in range(N_TRAIL):
        t = C - D / (1.0 + z.real ** 2 + z.imag ** 2)
        z = A + b * z * np.exp(1j * t)
        all_pts.append(z)
    pts = np.concatenate(all_pts)
    mask = (np.abs(pts.real) < EXTENT) & (np.abs(pts.imag) < EXTENT)
    pts = pts[mask]
    H, _, _ = np.histogram2d(
        pts.real, pts.imag, bins=GRID_N,
        range=[[-EXTENT, EXTENT], [-EXTENT, EXTENT]])
    # log-compress: avoids one dense bright filament drowning everything else
    H = np.log1p(H)
    return H / (H.max() or 1.0)


def grid_to_mesh_arrays(H: np.ndarray):
    """Downsample density grid H to MESH_N and return vertex arrays.

    Stride-downsampling (not filtering) is intentional — the
    density grid is already smooth enough from 72M sample points
    that aliasing artefacts are sub-pixel.
    """
    step = GRID_N // MESH_N
    H2 = H[:MESH_N * step:step, :MESH_N * step:step]   # (MESH_N, MESH_N)
    xs = np.linspace(-1.0, 1.0, MESH_N)
    N = MESH_N
    XX, YY = np.meshgrid(xs, xs, indexing='ij')
    ZZ = H2 * Z_SCALE
    verts = np.column_stack([XX.ravel(), YY.ravel(), ZZ.ravel()])
    # Density normalised back from H2 for vertex colour ramp
    return verts, H2.ravel()


def make_quads(N: int) -> list:
    """Row-major quad face list for an N×N vertex grid."""
    faces = []
    for j in range(N - 1):
        for i in range(N - 1):
            v = j * N + i
            faces.append((v, v + 1, v + N + 1, v + N))
    return faces


# ─────────────────── SCENE SETUP ─────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
# world
world = bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.005, 0.005, 0.01, 1)
bg.inputs["Strength"].default_value = 0.0
scene.world = world

# ─────────────── PRE-COMPUTE ALL THREE GRIDS ──────────────────
# Compute outside the shape-key loop so seeds are reused —
# same rng state guarantees identical seed coverage per b.
grids = {}
rng2 = np.random.default_rng(0xC0FFEE)   # deterministic per-grid rng
for b in B_VALS:
    # Each call re-seeds identically; use per-b state for fairness
    _rng = np.random.default_rng(int(b * 1e6))
    _z = (_rng.uniform(-EXTENT, EXTENT, N_SEEDS) +
          1j * _rng.uniform(-EXTENT, EXTENT, N_SEEDS))
    _z = ikeda_batch(_z, b, N_WARMUP)
    _all = []
    for _ in range(N_TRAIL):
        _t = C - D / (1.0 + _z.real ** 2 + _z.imag ** 2)
        _z = A + b * _z * np.exp(1j * _t)
        _all.append(_z)
    _pts = np.concatenate(_all)
    _mask = (np.abs(_pts.real) < EXTENT) & (np.abs(_pts.imag) < EXTENT)
    _pts = _pts[_mask]
    _H, _, _ = np.histogram2d(
        _pts.real, _pts.imag, bins=GRID_N,
        range=[[-EXTENT, EXTENT], [-EXTENT, EXTENT]])
    _H = np.log1p(_H)
    grids[b] = _H / (_H.max() or 1.0)

# ─────────────────── BUILD MESH ──────────────────────────────
basis_H = grids[B_BASIS]
basis_verts, basis_density = grid_to_mesh_arrays(basis_H)
faces = make_quads(MESH_N)

mesh = bpy.data.meshes.new(OBJ_NAME)
mesh.from_pydata(list(map(tuple, basis_verts)), [], faces)
mesh.update()
obj = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ─────────────────── SHAPE KEYS ──────────────────────────────
obj.shape_key_add(name="Basis", from_mix=False)
for b in B_VALS:
    sk_verts, _ = grid_to_mesh_arrays(grids[b])
    sk = obj.shape_key_add(name=f"b={b:.2f}", from_mix=False)
    for vi, (x, y, z) in enumerate(sk_verts):
        sk.data[vi].co.x = x
        sk.data[vi].co.y = y
        sk.data[vi].co.z = z

# ─────────────────── VERTEX COLOURS ──────────────────────────
# Cyan (low density) → magenta (high density) using FLOAT_COLOR domain POINT.
# FLOAT_COLOR avoids 8-bit quantisation visible on the smooth density gradient.
attr = obj.data.color_attributes.new("density", 'FLOAT_COLOR', 'POINT')
n_verts = len(basis_density)
col = np.ones((n_verts, 4), dtype=np.float32)
d = basis_density.astype(np.float32)
col[:, 0] = d                    # R: 0→1  (cyan → magenta)
col[:, 1] = np.sqrt(1.0 - d)    # G: sqrt ramp for perceptual balance
col[:, 2] = 1.0 - d * 0.5       # B: stays bright, drops at peaks
col[:, 3] = 1.0
attr.data.foreach_set("color", col.ravel())

# ─────────────────── MATERIAL ────────────────────────────────
mat = bpy.data.materials.new("ikeda_emit")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
vcol = nt.nodes.new("ShaderNodeVertexColor")
vcol.layer_name = "density"
emit = nt.nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = 4.0
out  = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(vcol.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
obj.data.materials.append(mat)

# ─────────────────── CAMERA ──────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_obj  = bpy.data.objects.new("Cam", cam_data)
cam_obj.location = (0.0, -3.0, 1.6)
cam_obj.rotation_euler = (1.15, 0.0, 0.0)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# ─────────────────── GLB EXPORT ──────────────────────────────
# apply_transforms=True bakes the height-field transforms so WebXR
# loaders see a canonical +Y-up coordinate frame (studio convention).
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_colors=True,
    export_morph=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
)
print(f"[ikeda] exported {GLB_PATH}")
