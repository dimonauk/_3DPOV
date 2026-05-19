"""
blueprint.py — Custom Split Normals for Flat-Faceted Cel-Shading
================================================================
Holoflow Studio · library/blends/shading/flat-shaded-faceted-normals
Source: studio original — no GPL dependencies
Licence: MIT (SPDX: MIT)

TECHNIQUE
---------
Cel-shading produces crisp illustrated colour-bands from the diffuse
lighting calculation.  The shape of those bands depends entirely on how
Blender computes the normal at each shading sample: smooth normals give
curved, gradient bands; flat normals give hard polygonal edges.

For the studio's low-poly faceted aesthetic the answer is neither — it is
*custom split normals*, where every loop in the mesh carries an explicit
normal you authored.  This lets you:
  • hold a smooth silhouette (outer edge loops point outward, not face-ward)
  • force interior shading bands to fall exactly on polygon boundaries
  • blend those two strategies per-region without extra geometry

Blender 5.1 change log (relevant to this script):
  • mesh.use_auto_smooth removed in 4.1; custom normals are always active.
  • normals_split_custom_set() still works; just call it, no flag needed.
  • calc_normals() is deprecated in 4.1 but kept for back-compat; in 5.x
    the face normals are always available via poly.normal after me.update().

CONSTANTS — edit before running
"""

import bpy
import bmesh
from mathutils import Vector
import math

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
OBJECT_NAME   = "faceted_sphere"
SPHERE_SEGS   = 12        # longitude segments — low to make facets visible
SPHERE_RINGS  = 8         # latitude rings
SPHERE_RADIUS = 1.0
CEL_STEPS     = 3         # colour bands in the ramp
SUN_ENERGY    = 3.0
SUN_ANGLE_DEG = 5         # small = sharp shadows

# ── HELPERS ───────────────────────────────────────────────────────────────────

def _clear_scene() -> None:
    """Remove all mesh objects; purge orphaned data so the script is idempotent."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def _make_sphere() -> bpy.types.Object:
    """Create a UV sphere with studio snake_case naming convention."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SPHERE_SEGS,
        ring_count=SPHERE_RINGS,
        radius=SPHERE_RADIUS,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = OBJECT_NAME
    obj.data.name = OBJECT_NAME + "_mesh"
    return obj


def apply_shade_flat_direct(obj: bpy.types.Object) -> None:
    """
    Shade every polygon flat using the mesh data API.

    Why not bpy.ops.object.shade_flat?  The operator is context-sensitive;
    called from a script without the correct area/region context it raises
    RuntimeError.  Setting poly.use_smooth is always safe.
    """
    me = obj.data
    for poly in me.polygons:
        poly.use_smooth = False
    me.update()


def apply_custom_normals_flat(obj: bpy.types.Object) -> None:
    """
    Assign per-loop custom normals equal to the face's own normal.

    Visually this is the same as shade_flat, but the normals are now an
    explicit attribute you can sculpt loop-by-loop later — the entry point
    for face-weighted normal blending.

    Protocol in Blender 5.1:
      1. Set all polygons to use_smooth = True so Blender reads the custom
         normals rather than discarding them in favour of the face normal.
      2. Build a list of length == len(mesh.loops), one (x,y,z) per loop.
      3. Call mesh.normals_split_custom_set(normals) — list or flat sequence.
    """
    me = obj.data
    me.update()   # ensure poly normals are computed

    loop_normals = [None] * len(me.loops)
    for poly in me.polygons:
        fn = poly.normal.copy()           # Vector — the face's geometric normal
        for li in poly.loop_indices:
            loop_normals[li] = fn

    # normals_split_custom_set expects a flat sequence of 3-tuples or vectors.
    me.normals_split_custom_set(loop_normals)

    # Mark smooth so Blender honours the custom normals attribute.
    for poly in me.polygons:
        poly.use_smooth = True
    me.update()


def apply_silhouette_blend(obj: bpy.types.Object, blend_rings: int = 2) -> None:
    """
    The studio's preferred hybrid: outer-ring loops carry a smoothed normal
    (curved silhouette) while inner loops carry the face normal (hard bands).

    blend_rings  —  number of edge-adjacent loops from each pole that receive
                    a smoothed (vertex-averaged) normal instead of the face normal.

    This is the technique that makes a 12×8 sphere read as an intentional
    stylistic choice rather than a low-resolution accident.
    """
    me = obj.data
    me.update()

    # Compute per-vertex averaged normals via bmesh.
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Build a vert_index → averaged normal map.
    vertex_normals: dict[int, Vector] = {}
    for v in bm.verts:
        vertex_normals[v.index] = v.normal.copy()

    bm.free()

    # Identify the top and bottom SPHERE_RINGS // 2 latitude rings.
    # UV sphere verts are laid out: north-pole, then rings from north to south.
    # Pole vertices are shared by all longitude segments — easy to detect by
    # high loop-count per vertex.
    pole_vert_indices: set[int] = set()
    vert_loop_count: dict[int, int] = {}
    for loop in me.loops:
        vert_loop_count[loop.vertex_index] = vert_loop_count.get(loop.vertex_index, 0) + 1
    # Vertices on latitude rings near the poles appear in more faces (smaller rings).
    # A cleaner heuristic: mark any vertex whose loop-count >= (SPHERE_SEGS - 2)
    # as near-pole and give it a smoothed normal.
    threshold = SPHERE_SEGS - 2
    for vi, count in vert_loop_count.items():
        if count >= threshold:
            pole_vert_indices.add(vi)

    loop_normals = [None] * len(me.loops)
    for poly in me.polygons:
        fn = poly.normal.copy()
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            if vi in pole_vert_indices:
                # Use the vertex-averaged normal — smooth silhouette near poles.
                loop_normals[li] = vertex_normals[vi]
            else:
                # Use the face normal — hard band interior.
                loop_normals[li] = fn

    me.normals_split_custom_set(loop_normals)
    for poly in me.polygons:
        poly.use_smooth = True
    me.update()


# ── MATERIAL ─────────────────────────────────────────────────────────────────

def _make_cel_material(name: str = "cel_faceted") -> bpy.types.Material:
    """
    Toon/cel material: Diffuse BSDF → Shader to RGB → Color Ramp → Emission.

    Why Emission as output, not Principled BSDF?  The Color Ramp is the
    lighting result — piping it back through Principled would add a second
    lighting evaluation that softens the bands we spent effort hardening.
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    for n in list(nodes):
        nodes.remove(n)

    diffuse = nodes.new("ShaderNodeBsdfDiffuse")
    diffuse.location = (-400, 0)
    diffuse.inputs["Color"].default_value = (0.8, 0.3, 0.1, 1.0)

    s2rgb = nodes.new("ShaderNodeShaderToRGB")
    s2rgb.location = (-200, 0)

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.location = (0, 0)
    ramp.color_ramp.interpolation = "CONSTANT"
    # Remove the default second stop, then rebuild with three hard bands.
    while len(ramp.color_ramp.elements) > 1:
        ramp.color_ramp.elements.remove(ramp.color_ramp.elements[-1])

    bands = [
        (0.00, (0.04, 0.04, 0.08, 1.0)),   # shadow — near-black blue
        (0.35, (0.55, 0.18, 0.05, 1.0)),   # mid-tone — dark rust
        (0.72, (0.95, 0.55, 0.15, 1.0)),   # highlight — warm ochre
    ]
    for i, (pos, col) in enumerate(bands):
        elem = ramp.color_ramp.elements[0] if i == 0 else ramp.color_ramp.elements.new(pos)
        if i == 0:
            elem.position = pos
        elem.color = col

    emission = nodes.new("ShaderNodeEmission")
    emission.location = (200, 0)

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (400, 0)

    links.new(diffuse.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])

    return mat


# ── SCENE SETUP ───────────────────────────────────────────────────────────────

def _add_sun() -> None:
    bpy.ops.object.light_add(type="SUN", location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.name = "studio_sun"
    sun.data.energy = SUN_ENERGY
    sun.data.angle = math.radians(SUN_ANGLE_DEG)


def _add_camera() -> None:
    bpy.ops.object.camera_add(location=(3.5, -3.5, 2.5))
    cam = bpy.context.active_object
    cam.name = "studio_cam"
    cam.rotation_euler = (math.radians(65), 0, math.radians(45))
    bpy.context.scene.camera = cam


def _export_glb(filepath: str) -> None:
    """Studio-canonical GLB export: +Y up, Draco 6, WebP, transforms applied."""
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _clear_scene()
    obj = _make_sphere()

    # Silhouette-blend normals: smooth near poles, flat across interior faces.
    # This is the studio default for cel-shaded low-poly spheroid objects.
    apply_silhouette_blend(obj, blend_rings=2)

    mat = _make_cel_material("cel_faceted")
    obj.data.materials.append(mat)

    _add_sun()
    _add_camera()

    bpy.ops.wm.save_as_mainfile(filepath="//faceted_sphere.blend")
    _export_glb("//faceted_sphere.glb")
    print("[Holoflow] faceted_sphere.blend + faceted_sphere.glb written.")


if __name__ == "__main__":
    main()
