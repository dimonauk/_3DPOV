"""
Oloid — Convex Hull of Two Perpendicular Unit Circles (Schatz 1929)
Blender 5.1 · Python + scipy · Holoflow Studio

Technique in brief
──────────────────
An oloid is the convex hull of two congruent circles in mutually
perpendicular planes, each passing through the centre of the other.
Formally: let r be the radius and let O₁=(0,0,0) and O₂=(r,0,0) be
the circle centres. Then:

  C₁ = { (r·cos t,  0,        r·sin t)  : t ∈ [0,2π) }  ← in xz-plane (y=0)
  C₂ = { (r+r·cos s, r·sin s, 0)        : s ∈ [0,2π) }  ← in xy-plane (z=0)

The condition d(O₁,O₂)=r means each circle passes through the other's
centre: C₁ passes through O₂=(r,0,0) at t=0; C₂ passes through
O₁=(0,0,0) at s=π.

Key properties the surface inherits from this geometry:
  • Ruled: every surface point lies on a line segment between C₁ and C₂.
  • Developable: can be unrolled onto a plane without tearing.
  • 100% wetting: every surface point contacts the rolling plane during
    one complete roll — the only known solid with this property.
  • Rolling motion: the axis of rotation tilts continuously; the
    centre of mass traces a figure-of-eight lemniscate.

Implementation: scipy.spatial.ConvexHull on 2N discretised circle
points → triangulated hull → remove degenerate faces (all vertices
from the same circle = coplanar interior face) → clean boundary mesh.

Outputs
───────
  oloid_poi.blend  — Blender scene, smooth-shaded, vertex-colour gradient
  oloid_poi.glb    — Draco-6, WebP, Holoflow WebXR poi head

Run headless: blender --background --python blueprint.py
Requires scipy in Blender's Python environment:
  import subprocess, sys
  subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])
"""

import bpy, bmesh, math, os
import numpy as np
from scipy.spatial import ConvexHull

# ── Parameters ──────────────────────────────────────────────────────────────
R           = 0.06          # circle radius (m) — each circle passes through other's centre
N_CIRC      = 600           # sample points per circle (denser = smoother mesh)
SMOOTH      = True          # auto-smooth normals on mesh
METALLIC    = 0.45
ROUGHNESS   = 0.30
ROOT_NAME   = "oloid_poi"   # snake_case — Holoflow convention

_HERE       = os.path.dirname(os.path.abspath(__file__))
BLEND_OUT   = os.path.join(_HERE, "oloid_poi.blend")

_GLB_DIR    = os.path.join(
    _HERE, "..", "..", "..", "..", "glbs",
    "scripting", "python-scipy-oloid-convex-hull-schatz-1929-poi-head-webxr"
)
GLB_OUT     = os.path.join(_GLB_DIR, "oloid_poi.glb")

# ── Oloid geometry ───────────────────────────────────────────────────────────
# Circle 1: in the xz-plane (y=0), centre O₁=(0,0,0)
t = np.linspace(0.0, 2.0 * np.pi, N_CIRC, endpoint=False)
c1 = np.column_stack([R * np.cos(t),
                      np.zeros(N_CIRC),
                      R * np.sin(t)])

# Circle 2: in the xy-plane (z=0), centre O₂=(R,0,0)
# Offset by R in x so that O₂ lies on C₁ (t=0 → (R,0,0)=O₂ ✓)
# and O₁=(0,0,0) lies on C₂ (s=π → (R+R·cos π,0,0)=(0,0,0) ✓)
s = np.linspace(0.0, 2.0 * np.pi, N_CIRC, endpoint=False)
c2 = np.column_stack([R + R * np.cos(s),
                      R * np.sin(s),
                      np.zeros(N_CIRC)])

pts   = np.vstack([c1, c2])          # 2N points in R³
hull  = ConvexHull(pts)

# Filter: skip faces whose three vertices all come from the same circle.
# All-c1 faces (indices 0..N-1) are interior discs of C₁ (coplanar in xz).
# All-c2 faces (indices N..2N-1) are interior discs of C₂ (coplanar in xy).
# These are not part of the oloid surface.
N = N_CIRC
faces_oloid = [
    s.tolist()
    for s in hull.simplices
    if not (all(i <  N for i in s) or
            all(i >= N for i in s))
]

# ── Build Blender mesh ───────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

mesh = bpy.data.meshes.new(ROOT_NAME)
bm   = bmesh.new()

# Add all hull vertices; only the ones referenced by faces_oloid matter,
# but adding all is simpler — Blender's cleanup pass handles orphans.
bm_verts = [bm.verts.new(pts[i]) for i in range(len(pts))]
bm.verts.index_update()

for tri in faces_oloid:
    try:
        bm.faces.new([bm_verts[i] for i in tri])
    except ValueError:
        pass   # duplicate face guard

# Remove orphaned vertices (from the filtered circle interiors)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

# Vertex colour: map x-position to a gold→indigo gradient.
# x ∈ [-R, 2R] → [0,1], then to HSV rainbow.
# This visually reveals the ruled structure: iso-hue lines ≈ rulings.
col_layer = bm.loops.layers.color.new("Col")
x_min, x_max = -R, 2.0 * R
for face in bm.faces:
    for loop in face.loops:
        xn  = (loop.vert.co.x - x_min) / (x_max - x_min)
        xn  = max(0.0, min(1.0, xn))
        hue = 0.65 - xn * 0.65          # indigo→gold
        import colorsys
        r_, g_, b_ = colorsys.hsv_to_rgb(hue, 0.85, 1.0)
        loop[col_layer] = (r_, g_, b_, 1.0)

bm.to_mesh(mesh)
bm.free()

if SMOOTH:
    for poly in mesh.polygons:
        poly.use_smooth = True

# ── Object & material ────────────────────────────────────────────────────────
obj = bpy.data.objects.new(ROOT_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)

mat = bpy.data.materials.new(ROOT_NAME)
mat.use_nodes = True
nt  = mat.node_tree
bsdf = nt.nodes.get("Principled BSDF")
bsdf.inputs["Metallic"].default_value   = METALLIC
bsdf.inputs["Roughness"].default_value  = ROUGHNESS

attr = nt.nodes.new("ShaderNodeAttribute")
attr.attribute_name = "Col"
nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])

obj.data.materials.append(mat)

# Holoflow WebXR tags
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-head"

# ── Export ───────────────────────────────────────────────────────────────────
# Rotate so the longest axis aligns with +Y (WebXR convention)
obj.rotation_euler = (math.pi / 2, 0, 0)
bpy.context.view_layer.update()
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print("✓ blend →", BLEND_OUT)

os.makedirs(_GLB_DIR, exist_ok=True)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
    export_colors=True,
)
print("✓ GLB  →", GLB_OUT)
