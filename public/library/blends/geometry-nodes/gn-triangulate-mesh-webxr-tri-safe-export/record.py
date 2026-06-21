"""
record.py — Viewport animation for GN Triangulate Mesh tutorial
Blender 5.1 | Holoflow Studio | CC0

Renders a 4-panel comparison: the same mixed-topology mesh triangulated with
each of the four quad methods arranged in a 2×2 grid. Output: a single frame
JPEG at public/library/videos/geometry-nodes/gn-triangulate-mesh-webxr-tri-safe-export/
viewport.mp4 is assembled externally from this render plus a screen recording.

Run after blueprint.py has been executed and tri_safe_demo.blend is open.
"""

import bpy
import bmesh
from mathutils import Vector

OUTPUT_DIR  = "//../../../../public/library/videos/geometry-nodes/gn-triangulate-mesh-webxr-tri-safe-export/"
FRAME_RANGE = (1, 80)

METHODS = [
    ("BEAUTY",           (-2.5,  1.5, 0)),
    ("FIXED",            ( 1.5,  1.5, 0)),
    ("FIXED_ALTERNATE",  (-2.5, -1.5, 0)),
    ("SHORTEST_DIAGONAL",( 1.5, -1.5, 0)),
]


def build_panel_mesh(quad_method: str) -> bpy.types.Mesh:
    """Minimal 2×2 quad + n-gon mesh, triangulated via bmesh ops."""
    me = bpy.data.meshes.new(f"panel_{quad_method}")
    bm = bmesh.new()

    # 4×2 quad grid
    v = {}
    for y in range(3):
        for x in range(5):
            v[(x, y)] = bm.verts.new(Vector((x - 2.0, y - 1.0, 0.0)))

    for y in range(2):
        for x in range(4):
            bm.faces.new([v[(x, y)], v[(x+1, y)], v[(x+1, y+1)], v[(x, y+1)]])

    bm.faces.ensure_lookup_table()
    # Dissolve one interior edge to create an n-gon in the centre
    centre_edges = [
        e for e in bm.edges
        if (abs(e.verts[0].co.x - e.verts[1].co.x) < 0.01
            and abs(e.verts[0].co.x - 0.0) < 0.01
            and 0 < int(round(e.verts[0].co.y + 1)) < 2)
    ]
    if centre_edges:
        bmesh.ops.dissolve_edges(bm, edges=centre_edges, use_verts=False)

    # Triangulate the whole panel with the given method
    bm.faces.ensure_lookup_table()
    bmesh.ops.triangulate(
        bm, faces=list(bm.faces),
        quad_method=quad_method, ngon_method="BEAUTY",
    )

    for f in bm.faces:
        f.smooth = False

    bm.to_mesh(me)
    bm.free()
    return me


def setup_comparison_scene() -> None:
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.frame_start = FRAME_RANGE[0]
    bpy.context.scene.frame_end   = FRAME_RANGE[1]

    # Label material per panel — unique colour per method
    colours = {
        "BEAUTY":            (0.3, 0.7, 0.9, 1),
        "FIXED":             (0.9, 0.5, 0.2, 1),
        "FIXED_ALTERNATE":   (0.5, 0.9, 0.4, 1),
        "SHORTEST_DIAGONAL": (0.9, 0.3, 0.6, 1),
    }

    for method, location in METHODS:
        me = build_panel_mesh(method)
        mat = bpy.data.materials.new(f"mat_{method}")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = colours[method]
            bsdf.inputs["Roughness"].default_value  = 0.7
        me.materials.append(mat)

        ob = bpy.data.objects.new(f"panel_{method}", me)
        ob.location = Vector(location)
        bpy.context.collection.objects.link(ob)

    # Overhead camera for a clean 2×2 comparison layout
    bpy.ops.object.camera_add(location=(0, 0, 9))
    cam = bpy.context.active_object
    cam.rotation_euler = (0, 0, 0)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 9.0
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
    sun = bpy.context.active_object
    sun.data.energy = 3.0

    # Render settings for viewport-style output
    scene = bpy.context.scene
    scene.render.engine             = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "JPEG"
    scene.render.filepath           = OUTPUT_DIR + "viewport_comparison"
    scene.render.resolution_x       = 1920
    scene.render.resolution_y       = 1080


setup_comparison_scene()
bpy.ops.render.render(write_still=True)
print("[record.py] Comparison render complete.")
