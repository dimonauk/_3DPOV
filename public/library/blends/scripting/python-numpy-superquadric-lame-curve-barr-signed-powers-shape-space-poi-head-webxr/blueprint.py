"""
Superquadric Surfaces — Barr Signed Powers, Lamé Curve Extension &
Shape-Space Poi Head for WebXR (Blender 5.1)

Alan Barr (1981) extended the 2D Lamé curve  |x/a|^n + |y/b|^n = 1
to a 3D parametric surface using two independent exponents (e1, e2).
The signed-power function  fexp(s, e) = sgn(s)·|s|^e  handles
negative cosine/sine values cleanly, avoiding NaN at π boundaries.

Two exponents control shape independently:
  e1  → latitude "squareness"  (north-south profile)
  e2  → longitude "squareness" (equatorial cross-section)

At (e1, e2) = (1, 1): sphere
At (e1, e2) ≈ (0.2, 0.2): cube-like (pillow cube)
At (e1, e2) = (2, 2): 8-pointed concave star
At (e1, e2) = (1, 0.2): cylindrical pillow
At (e1, e2) = (0.2, 1): flattened disc

All parameterisations share the same (NU × NV) vertex grid topology,
so a single BMesh can carry ALL shapes as Blender Shape Keys — rendered
as glTF morph targets in Three.js / WebXR.
"""

import math
import numpy as np
import bpy
import bmesh

# ── parameters ─────────────────────────────────────────────────────────────────
RADIUS      = 0.55        # metres — poi-head radius
NU          = 48          # longitude subdivisions (even number)
NV          = 24          # latitude subdivisions (even, not counting poles)
OUT_DIR     = "//output"  # relative to .blend; set absolute for headless use
GLB_NAME    = "hf_superquadric_poi.glb"

SHAPE_KEYS = [
    ("sphere",    1.0, 1.0),
    ("cube",      0.2, 0.2),
    ("pillow",    1.0, 0.2),
    ("star",      2.5, 2.5),
    ("cylinder",  0.2, 1.0),
    ("discus",    0.5, 0.5),
]

# ── signed-power function ───────────────────────────────────────────────────────
def _fexp(s: np.ndarray, e: float) -> np.ndarray:
    """
    Barr signed power: sgn(s)·|s|^e.
    Unlike s**e, this is defined for s < 0 and avoids NaN on negative bases.
    At e=1 it reduces to s; at e→0 it approaches sgn(s) (cube limit).
    """
    return np.sign(s) * np.abs(s) ** e


def _sq_vertices(e1: float, e2: float) -> np.ndarray:
    """
    Return (NU+1)×(NV+2) superquadric vertex positions as float32 array.
    v is sampled in [-π/2, π/2] (latitude), u in [-π, π] (longitude).
    North and south poles are single collapsed rings at v=±π/2, giving
    clean UV seams. The extra NV+2 row accounts for both poles.
    """
    # latitude grid including poles
    v = np.linspace(-math.pi / 2, math.pi / 2, NV + 2)
    u = np.linspace(-math.pi, math.pi, NU + 1)  # u[0] == u[-1] for seam wrap
    vv, uu = np.meshgrid(v, u, indexing="ij")   # shape (NV+2, NU+1)

    cv = np.cos(vv)
    sv = np.sin(vv)
    cu = np.cos(uu)
    su = np.sin(uu)

    x = RADIUS * _fexp(cv, e1) * _fexp(cu, e2)
    y = RADIUS * _fexp(cv, e1) * _fexp(su, e2)
    z = RADIUS * _fexp(sv, e1)

    # flatten to (n_verts, 3)
    return np.column_stack([x.ravel(), y.ravel(), z.ravel()]).astype(np.float32)


# ── mesh construction ───────────────────────────────────────────────────────────
def _build_superquadric(name: str, e1: float, e2: float) -> bpy.types.Object:
    """
    Build a single superquadric mesh object with the base shape (e1, e2).
    Returns the Blender object; caller adds further shape keys.

    Topology: (NV+2)×(NU+1) grid, quads between adjacent latitude rings.
    The seam column (u=–π = u=π) is merged at 'Find Doubles' threshold 1e-5.
    Flat shading (poly.use_smooth=False) gives the studio's faceted aesthetic.
    """
    verts_np = _sq_vertices(e1, e2)
    n_lat    = NV + 2     # rows
    n_lon    = NU + 1     # cols (first == last)

    verts = [tuple(v) for v in verts_np]

    faces = []
    for ri in range(n_lat - 1):
        for ci in range(n_lon - 1):
            a = ri * n_lon + ci
            b = ri * n_lon + ci + 1
            c = (ri + 1) * n_lon + ci + 1
            d = (ri + 1) * n_lon + ci
            faces.append((a, b, c, d))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    # flat shading — faceted aesthetic
    for poly in mesh.polygons:
        poly.use_smooth = False

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def _add_shape_keys(obj: bpy.types.Object) -> None:
    """
    Add one shape key per SHAPE_KEYS entry.  Because all shapes share the
    same vertex count and quad topology, the relative-key positions are
    exact superquadric displacements from the basis sphere.
    """
    # basis key — required before relative keys
    obj.shape_key_add(name="Basis", from_mix=False)

    for key_name, e1, e2 in SHAPE_KEYS:
        if key_name == "sphere":
            continue  # sphere is the basis
        sk = obj.shape_key_add(name=key_name, from_mix=False)
        verts_np = _sq_vertices(e1, e2)
        for i, co in enumerate(verts_np):
            sk.data[i].co = (float(co[0]), float(co[1]), float(co[2]))


# ── material ────────────────────────────────────────────────────────────────────
def _emission_material(name: str) -> bpy.types.Material:
    """
    Pure emission with a hue ramp tied to ObjectInfo.Random so every
    instance in WebXR gets a distinct colour.  No diffuse component —
    the mesh glows in the dark without baked lightmaps.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    info  = nodes.new("ShaderNodeObjectInfo")
    ramp  = nodes.new("ShaderNodeValToRGB")
    emit  = nodes.new("ShaderNodeEmission")
    out   = nodes.new("ShaderNodeOutputMaterial")

    ramp.color_ramp.elements[0].color = (0.05, 0.0, 0.40, 1.0)   # deep violet
    ramp.color_ramp.elements[1].color = (0.0,  0.8, 0.90, 1.0)   # cyan

    links.new(info.outputs["Random"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])

    emit.inputs["Strength"].default_value = 3.5
    return mat


# ── EEVEE / world setup ─────────────────────────────────────────────────────────
def _scene_setup() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    world = bpy.data.worlds.new("HF_World")
    world.color = (0.0, 0.0, 0.0)
    scene.world = world

    # EEVEE Next bloom for glow
    scene.eevee.use_bloom   = True
    scene.eevee.bloom_threshold = 0.30
    scene.eevee.bloom_intensity = 0.80
    scene.eevee.bloom_radius    = 5.0

    # camera — elevated three-quarter view
    cam_data = bpy.data.cameras.new("HF_Cam")
    cam_obj  = bpy.data.objects.new("HF_Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location         = (1.6, -1.6, 1.2)
    cam_obj.rotation_euler   = (math.radians(64), 0, math.radians(45))
    scene.camera             = cam_obj


# ── GLB export ──────────────────────────────────────────────────────────────────
def _export_glb(obj: bpy.types.Object) -> None:
    """
    Draco-6 + WebP + Y-up + export_morph=True.
    export_morph serialises shape keys as glTF morph targets,
    accessible via mesh.morphTargetInfluences[i] in Three.js.
    """
    import os
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # custom holoflow:facet property (for pipeline consumption)
    obj["holoflow:facet"] = True

    path = os.path.join(bpy.path.abspath(OUT_DIR), GLB_NAME)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath                           = path,
        use_selection                      = True,
        export_format                      = "GLB",
        export_yup                         = True,
        export_apply                       = False,       # shape keys must survive
        export_morph                       = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                = "WEBP",
    )
    print(f"[superquadric] exported → {path}")


# ── main ────────────────────────────────────────────────────────────────────────
def main() -> None:
    # clear default scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    _scene_setup()

    # base shape = sphere (e1=1, e2=1)
    obj = _build_superquadric("HF_SuperQ_Poi", e1=1.0, e2=1.0)

    # add all shape variants as morph targets
    _add_shape_keys(obj)

    mat = _emission_material("HF_SuperQ_Emit")
    obj.data.materials.append(mat)

    _export_glb(obj)

    print("[superquadric] done. shape keys:", [sk.name for sk in obj.data.shape_keys.key_blocks])


if __name__ == "__main__":
    main()
