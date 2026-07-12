"""
bpy.types.Mesh.from_pydata() — Enneper Minimal Surface
Blender 5.1 · CC0 · Holoflow Studio

bpy.types.Mesh.from_pydata(vertices, edges, faces) is a single C-level bulk
importer: it accepts plain Python lists of tuples and writes the mesh arrays
directly without opening a bmesh session or calling any operator.  edges=[] is
valid whenever faces cover the full topology — Blender infers edges from face
winding.  The call is O(V) on the C side and typically 10-20× faster than
building the equivalent mesh vertex-by-vertex through bmesh.verts.new().

Enneper's surface (Alfred Enneper, 1863) is a classical minimal surface —
mean curvature H = 0 at every interior point — with the saddle-point topology
of a 4-fold planar twist.  Parametric equations in right-hand +Y-up space:
  x(u, v) = u  − u³/3 + uv²
  y(u, v) = −v + v³/3 − u²v
  z(u, v) = u² − v²
Domain |u|, |v| < √3 ≈ 1.732 avoids self-intersection.  Choosing 1.75 clips
just inside the first self-intersecting fold at the four boundary cusps.

Outside source: Blender Foundation bpy.types.Mesh Python API, CC-BY-SA 4.0
  https://docs.blender.org/api/5.1/bpy.types.Mesh.html
  sibling: glTF exporter https://docs.blender.org/api/5.1/bpy.ops.export_scene.html

Outside source: Khronos Group glTF 2.0 Specification, Apache-2.0
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  sibling: KhronosGroup/glTF https://github.com/KhronosGroup/glTF
"""

import bpy

# ── parameters ────────────────────────────────────────────────────────────────
N          = 60          # quads per axis → 3 600 faces, 3 721 vertices
U_MIN      = -1.75       # domain boundary: self-intersection begins at |u| = √3 ≈ 1.732
U_MAX      =  1.75
SLUG       = "python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
OBJ_NAME   = "enneper_surface"
GLB_PATH   = "//enneper_surface.glb"
BLEND_PATH = "//enneper_surface.blend"

# ── 1. scene ──────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'

# ── 2. parameterise + tessellate ──────────────────────────────────────────────
def enneper(u: float, v: float) -> tuple:
    return (
         u  - (u**3) / 3.0 + u * (v**2),
        -v  + (v**3) / 3.0 - (u**2) * v,
         u**2 - v**2,
    )

W = N + 1   # vertices per axis
verts = []
for i in range(W):
    for j in range(W):
        u = U_MIN + (U_MAX - U_MIN) * j / N
        v = U_MIN + (U_MAX - U_MIN) * i / N
        verts.append(enneper(u, v))

# CCW winding (bottom-left, bottom-right, top-right, top-left).
# Blender computes outward face normals using the right-hand rule on this order.
faces = []
for i in range(N):
    for j in range(N):
        bl = i       * W + j
        br = i       * W + (j + 1)
        tr = (i + 1) * W + (j + 1)
        tl = (i + 1) * W + j
        faces.append((bl, br, tr, tl))

me = bpy.data.meshes.new(OBJ_NAME + "_mesh")
me.from_pydata(verts, [], faces)   # edges=[] — inferred from face winding
me.update()

ob = bpy.data.objects.new(OBJ_NAME, me)
sc.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

print(f"[{SLUG}] v={len(me.vertices)} f={len(me.polygons)} e={len(me.edges)}")

# ── 3. flat shading — studio faceted aesthetic ────────────────────────────────
# use_smooth=False assigns the geometric face normal to every polygon.
# On a minimal surface each quad occupies a distinct tangent plane, so the
# 3 600 facets reveal the normal-field vortex that smooth shading would hide.
for p in me.polygons:
    p.use_smooth = False

# ── 4. height-gradient vertex colour → COLOR_0 ───────────────────────────────
# FLOAT_COLOR POINT attribute named 'Col' is exported automatically by the
# Blender 5.1 glTF exporter as COLOR_0 (VEC4 UNSIGNED_BYTE normalised in the
# Draco stream).  Three.js reads vertexColors=true without extra shader code.
z_vals  = [vt[2] for vt in verts]
z_min   = min(z_vals)
z_range = max(z_vals) - z_min or 1.0

col_attr = me.color_attributes.new(name="Col", type='FLOAT_COLOR', domain='POINT')
TEAL   = (0.06, 0.68, 0.82)
INDIGO = (0.18, 0.12, 0.65)
for i, vt in enumerate(verts):
    t = (vt[2] - z_min) / z_range
    col_attr.data[i].color = (
        TEAL[0] * (1.0 - t) + INDIGO[0] * t,
        TEAL[1] * (1.0 - t) + INDIGO[1] * t,
        TEAL[2] * (1.0 - t) + INDIGO[2] * t,
        1.0,
    )
me.update()

# ── 5. material ───────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("enneper_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.06, 0.68, 0.82, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.28
bsdf.inputs["Metallic"].default_value   = 0.08
ob.data.materials.append(mat)

# ── 6. camera + light ─────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("Cam", cam_data)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob
cam_ob.location       = (5.5, -5.5, 3.5)
cam_ob.rotation_euler = (1.10, 0.0, 0.785)

sun_data = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy = 3.5
sun_ob = bpy.data.objects.new("Sun", sun_data)
sc.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (0.55, 0.0, 1.2)

# ── 7. export GLB + save .blend ───────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(GLB_PATH),
    export_format                        = 'GLB',
    use_selection                        = False,
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_yup                           = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
print(f"[{SLUG}] done — {GLB_PATH}")
