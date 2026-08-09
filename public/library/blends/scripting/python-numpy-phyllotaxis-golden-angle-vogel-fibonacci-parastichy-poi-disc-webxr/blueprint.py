"""
Phyllotaxis — Golden Angle, Vogel Model, Fibonacci Parastichies
& Sunflower Poi Disc for WebXR  (Blender 5.1)

WHY THIS SHAPE:  In 1979 Helmut Vogel discovered that placing seed n at
polar coordinates (√n, n·α) — where α = 2π/φ² ≈ 137.508° is the golden
angle — produces the densest possible packing on a disc with no preferred
radial direction.  The reason is deep: φ = (1+√5)/2 has the continued
fraction [1;1,1,1,…], making it the "most irrational" number and the
hardest to approximate by low-order rationals.  Any rational approximation
p/q creates q-fold radial arms; φ's best rational approximants are all
Fibonacci ratios F_{k}/F_{k+1}, so the arms you SEE are always consecutive
Fibonacci pairs — 34 CW + 55 CCW in a 600-seed disc.  This blueprint builds
all this from first principles using only numpy and the bpy data API.

TECHNIQUE:  N_SEEDS seed cylinders (8-gons) are assembled from a single
`from_pydata` call.  Five shape keys vary the divergence angle α, letting
you scrub between perfect packing (137.508°) and visibly broken patterns
(180°, 120°), making the mathematics tactile in the viewport.

STUDIO CONVENTIONS:  holoflow:facet + flat shading.  +Y-up applied on
export.  Draco 6, WebP textures, snake_case root name.  GLB for WebXR.
"""

import bpy
import bmesh
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
N_SEEDS     = 280          # seed platelets; 280 → ~5k verts, fast build
SEED_SIDES  = 8            # polygon order per platelet (octagon)
DISC_RADIUS = 0.060        # metres — standard poi-head radius
DISC_THICK  = 0.007        # platelet height in Z
POI_NAME    = "phyllotaxis_poi_disc"

# Golden angle: α = 2π(2 − φ)  ≡  2π/φ²  ≡  2π(1 − 1/φ)
# All three forms are equivalent; we derive from first principles.
PHI         = (1.0 + np.sqrt(5.0)) / 2.0          # ≈ 1.6180339887
ALPHA_GOLD  = 2.0 * np.pi / PHI**2                # ≈ 2.3999632 rad = 137.508°

# Shape-key divergence angles [radians].
# Basis is the golden angle.  Others reveal the patterning penalty.
ALPHA_KEYS = {
    "Basis":        ALPHA_GOLD,
    "Alpha_137_3":  np.radians(137.3),   # sub-golden → faint 89-arm ghost
    "Alpha_137_7":  np.radians(137.7),   # super-golden → faint 89-arm ghost
    "Alpha_180":    np.radians(180.0),   # dyadic → collinear rows, worst case
    "Alpha_120":    np.radians(120.0),   # three-fold → 3 straight arms
}

# Vogel's scale: seed n at r = C·√n  so that seed N_SEEDS-1 lands at edge.
C_SCALE = DISC_RADIUS / np.sqrt(N_SEEDS - 1)

# Platelet radius: 0.44·C_SCALE means neighbours just kiss at golden angle.
SEED_R = C_SCALE * 0.44

# Fibonacci numbers for parastichy colouring.
FIB_CW = 34   # clockwise arm count visible in 280-seed disc

# ── Helpers ───────────────────────────────────────────────────────────────────

def seed_positions(alpha: float) -> np.ndarray:
    """
    Vogel model: seed n → (x, y) = (C·√n·cos(n·α), C·√n·sin(n·α)).
    Seed 0 sits at the origin (√0 = 0), forming the disc centre.
    Returns (N_SEEDS, 2) float32 array.
    """
    n   = np.arange(N_SEEDS, dtype=np.float32)
    r   = C_SCALE * np.sqrt(n)
    th  = n * alpha
    return np.column_stack((r * np.cos(th), r * np.sin(th)))


def build_octagon_geometry(positions: np.ndarray):
    """
    Assemble all seed platelets into flat Python lists for from_pydata.

    Each seed is an extruded regular SEED_SIDES-gon.
    Vertex layout per seed:
      [0 … S-1]  bottom ring
      [S … 2S-1] top ring
    Faces:
      side quads (S quads) + bottom cap fan + top cap fan.
    No shared vertices between seeds — enables per-seed shape-key morph.
    Returns (verts_flat, edges_flat, faces_flat).
    """
    S    = SEED_SIDES
    step = 2 * np.pi / S
    ang  = np.arange(S, dtype=np.float32) * step    # (S,)
    ux   = np.cos(ang) * SEED_R                      # unit ring x
    uy   = np.sin(ang) * SEED_R                      # unit ring y

    verts_all = []
    faces_all = []

    for idx, (cx, cy) in enumerate(positions):
        base = idx * (2 * S)   # vertex offset for this seed

        # Bottom ring  z=0
        for j in range(S):
            verts_all.append((float(cx + ux[j]), float(cy + uy[j]), 0.0))
        # Top ring  z=DISC_THICK
        for j in range(S):
            verts_all.append((float(cx + ux[j]), float(cy + uy[j]), DISC_THICK))

        # Side quads: (b_j, b_j+1, t_j+1, t_j)
        for j in range(S):
            j1 = (j + 1) % S
            faces_all.append((base + j, base + j1, base + S + j1, base + S + j))

        # Bottom cap fan — reversed winding for outward normal (face down)
        bottom_ring = [base + S - 1 - j for j in range(S)]
        faces_all.append(tuple(bottom_ring))

        # Top cap fan — standard winding (face up)
        faces_all.append(tuple(base + S + j for j in range(S)))

    return verts_all, [], faces_all


def apply_shape_key(mesh_obj, key_name: str, positions: np.ndarray):
    """
    Add a shape key with the same platelet topology but moved centres.
    Only XY changes; Z stays constant — the platelets slide on the disc plane.
    """
    sk = mesh_obj.shape_key_add(name=key_name, from_mix=False)
    S  = SEED_SIDES
    sk_data = sk.data
    n_verts  = N_SEEDS * 2 * S        # 2 rings per seed, no cap-center verts

    for idx, (cx, cy) in enumerate(positions):
        step = 2 * np.pi / S
        ang  = np.arange(S, dtype=np.float32) * step
        ux   = np.cos(ang) * SEED_R
        uy   = np.sin(ang) * SEED_R

        # Bottom ring
        for j in range(S):
            v = sk_data[idx * 2 * S + j]
            v.co = (float(cx + ux[j]), float(cy + uy[j]), 0.0)
        # Top ring
        for j in range(S):
            v = sk_data[idx * 2 * S + S + j]
            v.co = (float(cx + ux[j]), float(cy + uy[j]), DISC_THICK)


def set_vertex_colour(mesh_obj, positions_gold: np.ndarray):
    """
    Colour each platelet by which clockwise parastichy arm it belongs to:
      arm = n  mod  FIB_CW  → hue in [0, 1) cycling FIB_CW colours.
    Applied as FLOAT_COLOR point-domain attribute for Blender 5.1.
    """
    S = SEED_SIDES
    mesh = mesh_obj.data

    col_attr = mesh.color_attributes.new(
        name="PhylloArm",
        type="FLOAT_COLOR",
        domain="POINT",
    )

    import colorsys
    for idx in range(N_SEEDS):
        arm  = idx % FIB_CW
        hue  = arm / FIB_CW
        r, g, b = colorsys.hsv_to_rgb(hue, 0.75, 0.92)

        for ring_off in (0, S):
            for j in range(S):
                vi = idx * 2 * S + ring_off + j
                col_attr.data[vi].color = (r, g, b, 1.0)


# ── Main build ────────────────────────────────────────────────────────────────

# Clear scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Basis positions (golden angle)
pos_gold = seed_positions(ALPHA_GOLD)
verts, edges, faces = build_octagon_geometry(pos_gold)

mesh = bpy.data.meshes.new(POI_NAME)
mesh.from_pydata(verts, edges, faces)
mesh.update()

obj = bpy.data.objects.new(POI_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Flat shading — no smooth per holoflow:facet convention
for poly in mesh.polygons:
    poly.use_smooth = False

# Shape keys
obj.shape_key_add(name="Basis", from_mix=False)        # key 0: reference
for key_name, alpha_val in ALPHA_KEYS.items():
    if key_name == "Basis":
        continue
    apply_shape_key(obj, key_name, seed_positions(alpha_val))

# Vertex colour by parastichy arm
set_vertex_colour(obj, pos_gold)

# Material — Principled BSDF with vertex colour driving Base Color
mat = bpy.data.materials.new(name="PhylloMat")
mat.use_nodes = True
mat.use_backface_culling = False
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

vcol  = nodes.new("ShaderNodeVertexColor"); vcol.layer_name = "PhylloArm"
bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Metallic"].default_value   = 0.45
bsdf.inputs["Roughness"].default_value  = 0.28
out   = nodes.new("ShaderNodeOutputMaterial")
links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
mesh.materials.append(mat)

# holoflow metadata
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-head"

# Apply +Y-up transform for GLB export
obj.rotation_euler = (1.5707963, 0.0, 0.0)
bpy.ops.object.transform_apply(rotation=True)

# GLB export
import os
out_dir = os.path.join(
    os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp",
    "phyllotaxis_poi_disc",
)
os.makedirs(out_dir, exist_ok=True)
glb_path = os.path.join(out_dir, "phyllotaxis_poi_disc.glb")

bpy.ops.export_scene.gltf(
    filepath          = glb_path,
    export_format     = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_colors     = True,
    export_morph      = True,
    export_apply      = True,
    export_yup        = True,
    export_image_format = "WEBP",
)

print(f"[phyllotaxis] GLB written → {glb_path}")
print(f"  Seeds: {N_SEEDS}  Verts: {len(mesh.vertices)}  Faces: {len(mesh.polygons)}")
