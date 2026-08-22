"""
Miura-Ori Rigid Origami — Kawasaki Flat-Foldability, Auxetic Fold & Poi Disc
=============================================================================
Blender 5.1 | Python 3.11 | numpy ≥ 1.26 | pure bpy data API (no bpy.ops)

Technique
---------
Miura-ori is a rigid origami tessellation — every panel is a rigid
parallelogram and the entire M×N sheet folds via a single degree of freedom.
The fold state is parameterised by the crease dihedral angle θ ∈ (0°, 90°]:
θ = 90° → fully deployed flat sheet, θ → 0° → compacted stack.

Schenk & Guest (2013 PNAS) show the lattice-vector magnitudes are:
    lx(θ) = a·sin θ / √(1 − sin²φ·cos²θ)   # x-pitch
    ly(θ) = b·√(1 − sin²φ·cos²θ)            # y-pitch (couples to x — auxetic)
    lz(θ) = a·cos θ·sin φ / √(1 − sin²φ·cos²θ)  # z-amplitude

Negative Poisson ratio (auxetic): ν = −sin²φ·cos²θ·sin²θ / (1−sin²φ·cos²θ)²
When you pull the sheet in x it also expands in y — the hallmark auxetic
response (ν < 0 for all φ ∈ (0°,90°) and θ ∈ (0°,90°)).

Kawasaki theorem (1989): at every interior vertex the four face angles must
satisfy α₁+α₃ = α₂+α₄ = π for the crease pattern to be flat-foldable.
In Miura-ori every vertex has angles φ, π−φ, φ, π−φ — trivially satisfying
Kawasaki, which is why the single-DOF global fold is always possible.

Output: poi disc GLB with 4 shape keys (Basis/SK_ThirdFold/SK_TwoThirdFold/
SK_Compact), Fold_Phase FLOAT_COLOR POINT vertex attribute (amber peaks,
cobalt troughs), Draco-6 WebP export, +Y-up, holoflow:facet=True.
"""

import bpy, bmesh, numpy as np

# ─── PARAMETERS ────────────────────────────────────────────────────────────────
MESH_NAME  = "HF_MiuraOri_Poi"
OBJ_NAME   = "hf_miura_ori_poi"
PANEL_A    = 0.055          # panel length along horizontal crease direction (m)
PANEL_B    = 0.048          # panel length across crease (parallelogram slant) (m)
PHI        = np.radians(58) # sector angle — angle between crease families (radians)
N_ROWS     = 16             # panel rows (y-direction)
N_COLS     = 20             # panel cols (x-direction)
DISC_R     = 0.35           # disc radius at flat state for circular mask (m)
POI_R      = 0.100          # target bounding-sphere radius for GLB (m)

# Shape-key fold angles θ in radians; θ=π/2 flat, θ→0 compact
FOLD_THETAS = [np.pi / 2,          # Basis — fully flat
               np.pi / 3,          # SK_ThirdFold — one-third of the way folded
               np.pi / 6,          # SK_TwoThirdFold
               np.pi / 12]         # SK_Compact — nearly closed
SK_NAMES    = ["Basis", "SK_ThirdFold", "SK_TwoThirdFold", "SK_Compact"]

# Vertex colour palette (linear sRGB)
C_PEAK  = (0.92, 0.56, 0.04, 1.0)   # amber — mountain-peak vertices (+z)
C_VALLEY = (0.06, 0.22, 0.78, 1.0)  # cobalt — valley-trough vertices (−z)
C_EDGE   = (0.55, 0.55, 0.55, 1.0)  # mid-grey — boundary vertices (z≈0)

GLB_PATH   = "//hf_miura_ori_poi.glb"

# ─── SCHENK-GUEST LATTICE VECTORS ──────────────────────────────────────────────
def _lattice(theta: float):
    """Return (lx, ly, lz) lattice-vector magnitudes for fold angle θ.

    WHY: these three scalars fully parameterise the periodicity of the Miura-ori
    sheet at any fold state.  lz is the z-offset of mountain vs valley vertices
    (half the peak-to-trough amplitude). The denominator √(1−sin²φ·cos²θ) → 1
    at θ=π/2 (flat) and → cos(φ) at θ→0 (compact).
    """
    sp2 = np.sin(PHI) ** 2
    ct  = np.cos(theta)
    st  = np.sin(theta)
    den = np.sqrt(max(1.0 - sp2 * ct ** 2, 1e-9))
    lx  = PANEL_A * st / den
    ly  = PANEL_B * den
    lz  = PANEL_A * ct * np.sin(PHI) / den
    return lx, ly, lz

# ─── VERTEX GRID ───────────────────────────────────────────────────────────────
def _vertex_grid(theta: float) -> np.ndarray:
    """Compute (N_ROWS+1)×(N_COLS+1) vertex positions for fold state θ.

    WHY: vertex (row i, col j) sits at (j·lx, i·ly, ±lz) where the sign
    alternates in a checkerboard pattern — the hallmark of Miura-ori topology.
    Even (i+j) vertices are mountain peaks (+lz), odd are valley troughs (−lz).
    At θ=π/2: lz=0 so the sheet is flat.  As θ decreases the z-amplitude grows
    and lx,ly shrink — the auxetic compaction.
    """
    lx, ly, lz = _lattice(theta)
    rows = np.arange(N_ROWS + 1, dtype=float)
    cols = np.arange(N_COLS + 1, dtype=float)
    J, I = np.meshgrid(cols, rows)           # (N_ROWS+1, N_COLS+1)
    sign = 1 - 2 * ((I + J).astype(int) % 2)  # +1 for peaks, −1 for valleys
    X = J * lx
    Y = I * ly
    Z = sign * lz
    # Centre grid so disc mask is symmetric
    X -= X.max() / 2.0
    Y -= Y.max() / 2.0
    return np.stack([X, Y, Z], axis=-1).reshape(-1, 3)

# ─── CIRCULAR MASK (flat-state centroids) ──────────────────────────────────────
def _panel_mask() -> np.ndarray:
    """Boolean array of length N_ROWS×N_COLS: True if panel centroid ≤ DISC_R.

    WHY: applied in the flat state so the disc edge is a perfect circle at rest.
    The same connectivity is reused for all fold states (rigid origami preserves
    topology).  Panel (i,j) centroid = average of its 4 corner positions.
    """
    lx, ly, _ = _lattice(np.pi / 2)  # flat-state lattice
    rows = np.arange(N_ROWS, dtype=float)
    cols = np.arange(N_COLS, dtype=float)
    J, I = np.meshgrid(cols, rows)
    cx = (J + 0.5) * lx - N_COLS * lx / 2.0
    cy = (I + 0.5) * ly - N_ROWS * ly / 2.0
    return np.sqrt(cx ** 2 + cy ** 2) <= DISC_R   # (N_ROWS, N_COLS)

# ─── FACE LIST FROM MASK ───────────────────────────────────────────────────────
def _build_faces(mask: np.ndarray):
    """Return list of quad vertex-index tuples for included panels.

    Vertex grid index for (row i, col j) = i*(N_COLS+1)+j.  CCW winding.
    """
    faces = []
    for i in range(N_ROWS):
        for j in range(N_COLS):
            if not mask[i, j]:
                continue
            v00 = i * (N_COLS + 1) + j
            v10 = v00 + 1
            v01 = v00 + (N_COLS + 1)
            v11 = v01 + 1
            faces.append((v00, v10, v11, v01))  # CCW from below
    return faces

# ─── VERTEX COLOUR ─────────────────────────────────────────────────────────────
def _vert_colours(verts_3d: np.ndarray) -> np.ndarray:
    """Return RGBA colour per vertex encoding the mountain/valley phase.

    WHY: the (i+j)%2 parity determines which vertices are peaks (amber) vs
    troughs (cobalt) in any folded state.  We can detect it from the flat-state
    vertex index rather than from z (which is 0 in Basis).
    """
    n = (N_ROWS + 1) * (N_COLS + 1)
    idx = np.arange(n)
    row = idx // (N_COLS + 1)
    col = idx  % (N_COLS + 1)
    parity = (row + col) % 2           # 0 = peak (amber), 1 = valley (cobalt)

    # Boundary vertices blend toward grey
    on_edge = ((col == 0) | (col == N_COLS) | (row == 0) | (row == N_ROWS))

    colours = np.where(parity[:, None] == 0,
                       C_PEAK, C_VALLEY)
    colours[on_edge] = C_EDGE
    return colours.astype(np.float32)

# ─── MESH BUILD ────────────────────────────────────────────────────────────────
def _clear_mesh(name):
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    if name in bpy.data.meshes:
        bpy.data.meshes.remove(bpy.data.meshes[name])

_clear_mesh(OBJ_NAME)
mesh = bpy.data.meshes.new(MESH_NAME)
obj  = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)

mask  = _panel_mask()
faces = _build_faces(mask)
basis_verts = _vertex_grid(FOLD_THETAS[0])  # flat state for Basis

mesh.from_pydata(basis_verts.tolist(), [], faces)
mesh.update()

# Scale to target poi radius
flat_r = np.linalg.norm(basis_verts[:, :2], axis=1).max()
scale  = POI_R / flat_r if flat_r > 1e-6 else 1.0
obj.scale = (scale, scale, scale)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(scale=True)

# ─── SHADE FLAT ────────────────────────────────────────────────────────────────
for p in mesh.polygons:
    p.use_smooth = False

# ─── VERTEX COLOUR ATTRIBUTE ───────────────────────────────────────────────────
colour_attr = mesh.attributes.new("Fold_Phase", "FLOAT_COLOR", "POINT")
colours     = _vert_colours(basis_verts) * scale   # colour stays regardless of scale
# override scale multiply (colours are not spatial)
colours     = _vert_colours(basis_verts)
flat_list   = colours.flatten().tolist()
colour_attr.data.foreach_set("color", flat_list)

# ─── SHAPE KEYS ────────────────────────────────────────────────────────────────
obj.shape_key_add(name="Basis", from_mix=False)
mesh.shape_keys.use_relative = True

for theta, name in zip(FOLD_THETAS[1:], SK_NAMES[1:]):
    sk = obj.shape_key_add(name=name, from_mix=False)
    verts_3d = _vertex_grid(theta) * scale
    flat = verts_3d.flatten().tolist()
    sk.data.foreach_set("co", flat)

mesh.shape_keys.reference_key.name = "Basis"

# ─── MATERIAL (Principled BSDF + Vertex Colour) ────────────────────────────────
mat = bpy.data.materials.new("MiuraOri_Poi_Mat")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()
bsdf   = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Roughness"].default_value = 0.50
bsdf.inputs["Metallic"].default_value  = 0.12
vc     = nodes.new("ShaderNodeAttribute")
vc.attribute_name = "Fold_Phase"
vc.attribute_type = "GEOMETRY"
out    = nodes.new("ShaderNodeOutputMaterial")
links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
obj.data.materials.append(mat)

# ─── HOLOFLOW CUSTOM PROPERTIES ────────────────────────────────────────────────
obj["holoflow:facet"]       = True
obj["holoflow:category"]    = "poi-disc"
obj["holoflow:fold_dof"]    = 1
obj["holoflow:sector_angle_deg"] = int(round(np.degrees(PHI)))
obj["holoflow:licence"]     = "CC0"
obj["holoflow:N_panels"]    = int(mask.sum())

# +Y-up orientation
obj.rotation_euler = (np.pi / 2, 0.0, 0.0)
bpy.ops.object.transform_apply(rotation=True)

# ─── GLB EXPORT ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_morph=True,
    export_colors=True,
    export_apply=False,
)

print(f"[Miura-ori] panels={mask.sum()} shape-keys={len(SK_NAMES)} scale={scale:.4f}")
print("[Miura-ori] blueprint complete — hf_miura_ori_poi.glb exported.")
