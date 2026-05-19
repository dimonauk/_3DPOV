"""
GN Instance on Points — Viewport Recording Script
==================================================
Produces a 10-second EEVEE render showing the scatter panel tilting from a
top-down view to a 45° angle so the tile depth reads.

Output: public/library/videos/geometry-nodes/instance-on-points/viewport.mp4

Run headlessly:
    blender --background --python record.py
"""

import bpy
import bmesh
import os
import math

# ── parameters ───────────────────────────────────────────────────────────
RESOLUTION_X  = 1280
RESOLUTION_Y  = 720
FPS           = 24
FRAME_COUNT   = 240   # 10 s
SAMPLES       = 16
SURFACE_SIZE  = 8.0
SURFACE_VERTS = 4
TILE_RADIUS   = 0.22
TILE_SCALE    = 0.25
DENSITY       = 6.0
SEED          = 42
BASE_COLOR    = (0.15, 0.55, 0.90, 1.0)
ROUGHNESS     = 0.22
# ─────────────────────────────────────────────────────────────────────────


def resolve_output() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    lib_root = os.path.normpath(os.path.join(here, "..", "..", ".."))
    out_dir = os.path.join(lib_root, "videos", "geometry-nodes", "instance-on-points")
    os.makedirs(out_dir, exist_ok=True)
    return os.path.join(out_dir, "viewport")


def reset_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for col in list(bpy.data.collections):
        if col.name != bpy.context.scene.collection.name:
            bpy.data.collections.remove(col)


def build_tile() -> bpy.types.Object:
    r = TILE_RADIUS
    h = r * 0.12
    bm = bmesh.new()
    verts = [
        bm.verts.new(( r, 0, 0)), bm.verts.new((0,  r, 0)),
        bm.verts.new((-r, 0, 0)), bm.verts.new((0, -r, 0)),
        bm.verts.new(( r, 0, h)), bm.verts.new((0,  r, h)),
        bm.verts.new((-r, 0, h)), bm.verts.new((0, -r, h)),
    ]
    bm.faces.new([verts[0], verts[3], verts[2], verts[1]])
    bm.faces.new([verts[4], verts[5], verts[6], verts[7]])
    bm.faces.new([verts[0], verts[1], verts[5], verts[4]])
    bm.faces.new([verts[1], verts[2], verts[6], verts[5]])
    bm.faces.new([verts[2], verts[3], verts[7], verts[6]])
    bm.faces.new([verts[3], verts[0], verts[4], verts[7]])
    mesh = bpy.data.meshes.new("RecordTile")
    if "sharp_face" not in mesh.attributes:
        mesh.attributes.new("sharp_face", "BOOLEAN", "FACE")
    bm.to_mesh(mesh)
    bm.free()
    mesh.attributes["sharp_face"].data.foreach_set("value", [True] * len(mesh.polygons))
    mesh.update()
    mat = bpy.data.materials.new("RecordTileMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = BASE_COLOR
        bsdf.inputs["Roughness"].default_value = ROUGHNESS
    mesh.materials.append(mat)
    obj = bpy.data.objects.new("RecordTile", mesh)
    tile_col = bpy.data.collections.new("_tile_src")
    bpy.context.scene.collection.children.link(tile_col)
    tile_col.objects.link(obj)
    return obj


def build_surface(tile: bpy.types.Object) -> bpy.types.Object:
    mesh = bpy.data.meshes.new("RecordSurface")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=SURFACE_VERTS, y_segments=SURFACE_VERTS,
                          size=SURFACE_SIZE / 2)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new("RecordSurface", mesh)
    bpy.context.collection.objects.link(obj)

    mod = obj.modifiers.new("ScatterGN", "NODES")
    tree = bpy.data.node_groups.new("RecordScatter", "GeometryNodeTree")
    mod.node_group = tree
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    ns = tree.nodes
    lk = tree.links
    ni = ns.new("NodeGroupInput")
    no = ns.new("NodeGroupOutput")
    nd = ns.new("GeometryNodeDistributePointsOnFaces")
    nd.distribute_method = "POISSON"
    nd.inputs["Density Max"].default_value = DENSITY
    nd.inputs["Seed"].default_value        = SEED
    nb = ns.new("GeometryNodeObjectInfo")
    nb.inputs["Object"].default_value = tile
    nb.transform_space = "RELATIVE"
    nip = ns.new("GeometryNodeInstanceOnPoints")
    nip.inputs["Scale"].default_value = (TILE_SCALE, TILE_SCALE, TILE_SCALE)
    nr = ns.new("GeometryNodeRealizeInstances")
    lk.new(ni.outputs["Geometry"],  nd.inputs["Mesh"])
    lk.new(nd.outputs["Points"],    nip.inputs["Points"])
    lk.new(nb.outputs["Geometry"],  nip.inputs["Instance"])
    lk.new(nip.outputs["Instances"], nr.inputs["Geometry"])
    lk.new(nr.outputs["Geometry"],   no.inputs["Geometry"])
    return obj


def add_camera_and_light() -> None:
    import mathutils

    # Camera: starts top-down (frame 1), tilts to 45° (frame 120), holds (frame 240)
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35.0
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    def set_camera_kf(frame: int, loc, rot_x_deg: float) -> None:
        bpy.context.scene.frame_set(frame)
        cam.location = loc
        cam.rotation_euler = (math.radians(rot_x_deg), 0.0, 0.0)
        cam.keyframe_insert("location")
        cam.keyframe_insert("rotation_euler")

    set_camera_kf(1,   (0.0,  0.0, 14.0), 0.0)    # top-down
    set_camera_kf(120, (0.0, -8.0,  8.0), 45.0)   # tilted 45°
    set_camera_kf(240, (0.0, -8.0,  8.0), 45.0)   # hold

    light_data = bpy.data.lights.new("RecordLight", type="AREA")
    light_data.energy = 800.0
    light_data.size   = 6.0
    light = bpy.data.objects.new("RecordLight", light_data)
    bpy.context.collection.objects.link(light)
    light.location = (5.0, -3.0, 8.0)
    light.rotation_euler = (math.radians(30), 0, math.radians(30))


def configure_render(output_path: str) -> None:
    scene = bpy.context.scene
    scene.render.engine       = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = RESOLUTION_X
    scene.render.resolution_y = RESOLUTION_Y
    scene.render.fps          = FPS
    scene.frame_start         = 1
    scene.frame_end           = FRAME_COUNT
    scene.render.filepath     = output_path
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = SAMPLES


def main() -> None:
    reset_scene()
    tile    = build_tile()
    surface = build_surface(tile)
    bpy.context.view_layer.update()
    add_camera_and_light()
    out = resolve_output()
    configure_render(out)
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] instance-on-points recording → {out}.mp4")


if __name__ == "__main__":
    main()
