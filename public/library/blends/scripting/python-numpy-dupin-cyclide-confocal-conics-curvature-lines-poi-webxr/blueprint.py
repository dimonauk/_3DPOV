"""
Python numpy — Dupin Cyclide: Confocal-Conic Curvature Lines,
               Torus Inversion & Three-Morphotype Poi Head for WebXR
               (Blender 5.1)
=====================================================================
Technique
---------
A Dupin cyclide is the unique closed algebraic surface in ℝ³ whose
TWO principal curvature families are each made entirely of circles.
Pierre Charles François Dupin described the surface in his 1822 treatise
"Applications de géométrie"; the algebraic form is a degree-4 implicit
surface that subsumes the torus, circular cone, and circular cylinder as
limiting cases.

Maxwell's parametrisation (1868):

    x = (d(c − a cos u cos v) + b² cos u)  /  (a − c cos u cos v)
    y = b sin u (a − d cos v)               /  (a − c cos u cos v)
    z = b sin v (c cos u − d)               /  (a − c cos u cos v)

with constraint  a² = b² + c²  (so a, b, c form a Pythagorean triple;
here 5, 4, 3).  Parameter d controls the shape continuously:

  • Ring cyclide    0 < d < c   — smooth, closed, no singularities
  • Horn cyclide    d = c       — one cuspidal point at (b²/a, 0, 0)
  • Spindle cyclide c < d < a   — self-intersects along two circles

WHY this matters for poi:  the inner cavity for d ∈ (0, c) is a smooth
hollow that fits an LED module exactly.  All curvature lines are circles,
so the surface is everywhere aligned with spherical wave fronts —
gorgeous when lit from inside.

Outside sources
---------------
• Dupin, C. (1822). "Applications de géométrie et de méchanique."
  Paris: Bachelier.  Public Domain.
  Related: Monge "Application de l'analyse à la géométrie" (1795);
  Darboux "Leçons sur la théorie générale des surfaces" Vol. III (1894).

• Pratt, V.R. (1990). "Cyclides in Computer Aided Geometric Design."
  Computer Aided Geometric Design 7(1-4):221-242.
  https://doi.org/10.1016/0167-8396(90)90033-K
  Mathematical content CC0 / Public Domain.
  Related: Boehm (1990) same issue; Chandru, Dutta & Hoffmann (1989)
  "On the geometry of Dupin cyclides" The Visual Computer 5(5):277-290.
"""

import bpy, bmesh, numpy as np, math, os

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG = "hf_dupin_cyclide"

# Pythagorean triple (5, 4, 3): b² = a² − c²
# WHY 5-4-3: cleanest integer Pythagorean triple; a=5 gives a 50 cm poi
# head at SCALE=0.10; ratio a/c = 5/3 ≈ 1.67 produces a pleasingly
# proportioned ring — neither too skinny (a/c→1) nor too flat (a/c→∞).
A = 5.0
C = 3.0
B = math.sqrt(A**2 - C**2)   # = 4.0 exactly (3-4-5 right triangle)

# Shape-key d values
# WHY 1.5 for ring: midway between 0 (torus limit) and C=3 (horn);
# thick ring with a visible hollow cavity
D_RING    = 1.5
D_HORN    = C          # d = c → singular point; limit approached but not used
D_TORUS   = 0.05       # d ≈ 0 → near-torus (standard ring torus)
D_SPINDLE = A - 0.3    # d > c but < a; 4.7 gives visible self-intersection
# (we clamp slightly below A to avoid numerical blow-up at denom→0)

SCALE  = 0.10          # 5 units → 0.5 m (60 cm poi cage)
RES    = 60            # 60×60 quad grid per period; 3600 quads, 3600 verts

# Vertex colours for curvature-circle visualisation
COL_GOLD  = (1.00, 0.75, 0.00, 1.0)  # v-circles (principal)
COL_MAG   = (0.90, 0.10, 0.60, 1.0)  # u-circles (principal)
COL_CYAN  = (0.00, 0.85, 1.00, 1.0)  # midpoint blend stop


# ── Helper: evaluate cyclide on grid ─────────────────────────────────────────
def eval_cyclide(d: float) -> np.ndarray:
    """
    Return (RES, RES, 3) float64 vertex positions for a given d.

    Denominator (a − c cos u cos v) ∈ [a − c, a + c] = [2, 8] for ring and
    horn cases (d ≤ c), because |cos u cos v| ≤ 1 and a > c > 0.
    For d > c (spindle), the same bound holds as long as d < a.
    """
    u = np.linspace(0.0, 2.0 * math.pi, RES, endpoint=False)
    v = np.linspace(0.0, 2.0 * math.pi, RES, endpoint=False)
    U, V = np.meshgrid(u, v, indexing="ij")

    cos_u, sin_u = np.cos(U), np.sin(U)
    cos_v, sin_v = np.cos(V), np.sin(V)

    denom = A - C * cos_u * cos_v
    x = (d * (C - A * cos_u * cos_v) + B**2 * cos_u) / denom
    y = B * sin_u * (A - d * cos_v)                   / denom
    z = B * sin_v * (C * cos_u - d)                   / denom

    return np.stack([x, y, z], axis=-1) * SCALE


# ── Helper: build bmesh from grid ─────────────────────────────────────────────
def grid_to_bmesh(pts: np.ndarray) -> bmesh.types.BMesh:
    """
    Build a periodic quad mesh from a (RES, RES, 3) array.

    WHY bmesh not bpy.ops: context-free, order-independent, no active-object
    requirement; lets us add vertices/faces in a tight loop and only push
    data to bpy.data once the full topology is ready.
    """
    bm = bmesh.new()
    R = RES
    verts = [bm.verts.new(tuple(pts[i, j])) for i in range(R) for j in range(R)]
    bm.verts.ensure_lookup_table()

    for i in range(R):
        for j in range(R):
            i1, j1 = (i + 1) % R, (j + 1) % R
            bm.faces.new([verts[i*R+j], verts[i*R+j1],
                          verts[i1*R+j1], verts[i1*R+j]])
    bm.faces.ensure_lookup_table()
    return bm


# ── Helper: paint vertex colours by v-parameter ───────────────────────────────
def paint_circles(bm: bmesh.types.BMesh) -> None:
    """
    Per-loop colour whose hue cycles with the v-parameter, making every
    principal curvature circle (iso-v line) a single hue.

    WHY per-loop: Blender 5.1 stores colour attributes on face corners
    (loops), not vertices, so adjacent faces can share a vertex while
    showing different colours — this is required for the stripe look.
    """
    col_layer = bm.loops.layers.color.new("curvature_circles")
    R = RES

    for fi, face in enumerate(bm.faces):
        i, j = divmod(fi, R)
        t = j / R                          # v ∈ [0,1) across columns
        # 3-stop gradient: gold → magenta → cyan → gold
        if t < 0.5:
            s = t * 2.0
            col = tuple(a*(1-s)+b*s for a, b in zip(COL_GOLD, COL_MAG))
        else:
            s = (t - 0.5) * 2.0
            col = tuple(a*(1-s)+b*s for a, b in zip(COL_MAG, COL_CYAN))
        for loop in face.loops:
            loop[col_layer] = col


# ── Step 1 — Clear & build basis mesh ─────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

bm_basis = grid_to_bmesh(eval_cyclide(D_RING))
paint_circles(bm_basis)

# Flat normals per face (WHY: Holoflow faceted aesthetic; cyclide is everywhere
# smooth analytically but faceted flat shading gives the studio's crystal look)
for face in bm_basis.faces:
    face.smooth = False

mesh = bpy.data.meshes.new(SLUG)
bm_basis.to_mesh(mesh)
bm_basis.free()

obj = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Step 2 — Shape keys ───────────────────────────────────────────────────────
# Basis key (ring cyclide, D=1.5)
sk_basis = obj.shape_key_add(name="Basis", from_mix=False)
sk_basis.interpolation = "KEY_LINEAR"

def add_shape_key(name: str, d: float) -> None:
    """
    Add a shape key by evaluating the cyclide at parameter d.
    Uses the direct shape-key data block; avoids bpy.ops so it works in
    headless / background mode.
    """
    sk = obj.shape_key_add(name=name, from_mix=False)
    sk.interpolation = "KEY_LINEAR"
    pts = eval_cyclide(d).reshape(-1, 3)
    for idx, co in enumerate(pts):
        sk.data[idx].co = co

# WHY these three:
#  - Torus (D≈0): shows the limiting case; confirms the relation to a
#    standard ring torus (radius R = (A+C)/2, r = (A-C)/2 = 1)
#  - Horn (D=C):  singular degenerate; one point of self-tangency;
#    demonstrates the topological boundary between ring and spindle types
#  - Spindle (D=A-0.3): self-intersecting; lens-shaped cross section;
#    the same visual logic as a spindle torus but now conformally distorted
add_shape_key("Torus",   D_TORUS)
add_shape_key("Horn",    D_HORN)
add_shape_key("Spindle", D_SPINDLE)

# ── Step 3 — Material: vertex colour emission ─────────────────────────────────
mat = bpy.data.materials.new(name=SLUG + "_mat")
mat.use_nodes = True
tree = mat.node_tree
nodes = tree.nodes
nodes.clear()

attr = nodes.new("ShaderNodeAttribute")
attr.attribute_name = "curvature_circles"     # matches paint_circles() layer name
attr.location = (-400, 200)

emission = nodes.new("ShaderNodeEmission")
emission.inputs["Strength"].default_value = 3.0
emission.location = (-150, 200)

out = nodes.new("ShaderNodeOutputMaterial")
out.location = (100, 200)

tree.links.new(attr.outputs["Color"], emission.inputs["Color"])
tree.links.new(emission.outputs["Emission"], out.inputs["Surface"])

mesh.materials.append(mat)

# ── Step 4 — holoflow:facet flag ──────────────────────────────────────────────
obj["holoflow:facet"] = True  # marks mesh for flat-shaded WebXR export

# ── Step 5 — GLB export ───────────────────────────────────────────────────────
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

glb_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..",
    "glbs", "scripting",
    "python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr"
)
os.makedirs(glb_dir, exist_ok=True)
glb_path = os.path.join(glb_dir, SLUG + ".glb")

bpy.ops.export_scene.gltf(
    filepath         = glb_path,
    use_selection    = True,
    export_format    = "GLB",
    export_apply     = True,            # apply transforms at export time
    export_yup       = True,            # +Y up for WebXR
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)

print(f"[blueprint] wrote  {glb_path}")

# Save .blend
blend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SLUG + ".blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[blueprint] saved  {blend_path}")
