"""
record.py — Faceted gem viewport render to video, Blender 5.1
Holoflow Studio / public/library/blends/faceted-mesh/faceted-gem/

Run:
  blender --background --python record.py

Renders a 5-second (150-frame) rotation of the gem in EEVEE Next,
outputting an MP4 to public/library/videos/faceted-mesh/faceted-gem/viewport.mp4
relative to the project root.

WHY the rotation is driven by a frame_change_post handler rather than
keyframes: no edit context required, and the script is self-contained
with no dependency on an existing .blend action.
"""

import math
import bpy

# ─── Constants ────────────────────────────────────────────────────────────────
N_FRAMES     = 150          # 5 seconds at 30 fps
ROTATION_DEG = 360.0        # full revolution
OUTPUT_VIDEO = "//../../../../videos/faceted-mesh/faceted-gem/viewport"
SIDES        = 8
CROWN_HEIGHT = 0.30
TABLE_SCALE  = 0.55
PAVILION_DEPTH = 0.55
IOR          = 1.77
GEM_COLOR    = (0.08, 0.55, 0.90, 1.0)


def _ring(bm, n, radius, z, offset_angle=0.0):
    verts = []
    for i in range(n):
        a = 2.0 * math.pi * i / n + offset_angle
        verts.append(bm.verts.new((radius * math.cos(a), radius * math.sin(a), z)))
    return verts


def _build_gem():
    """Inline gem build (mirrors blueprint.py) so record.py is self-contained."""
    import bmesh

    BEZEL_H = CROWN_HEIGHT * 0.55
    BEZEL_R = TABLE_SCALE * 1.25
    P1Z, P1R = -0.08, 0.88
    P2Z, P2R = -(PAVILION_DEPTH * 0.55), 0.42

    bm = bmesh.new()
    girdle = _ring(bm, SIDES, 1.0, 0.0)
    bezel  = _ring(bm, SIDES, BEZEL_R, BEZEL_H)
    table  = _ring(bm, SIDES, TABLE_SCALE, CROWN_HEIGHT, math.pi / SIDES)

    j = lambda i: (i + 1) % SIDES
    for i in range(SIDES):
        bm.faces.new([girdle[i], girdle[j(i)], bezel[j(i)], bezel[i]])
        bm.faces.new([bezel[i],  bezel[j(i)],  table[j(i)], table[i]])
    bm.faces.new(list(reversed(table)))

    pav1 = _ring(bm, SIDES, P1R, P1Z)
    pav2 = _ring(bm, SIDES, P2R, P2Z)
    culet = bm.verts.new((0.0, 0.0, -PAVILION_DEPTH))

    for i in range(SIDES):
        bm.faces.new([girdle[i], pav1[i], pav1[j(i)], girdle[j(i)]])
        bm.faces.new([pav1[i], pav2[i], pav2[j(i)], pav1[j(i)]])
        bm.faces.new([pav2[j(i)], culet, pav2[i]])

    mesh = bpy.data.meshes.new("FacetedGemMesh")
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()

    gem = bpy.data.objects.new("FacetedGem", mesh)
    bpy.context.collection.objects.link(gem)

    mat = bpy.data.materials.new("GemCrystal")
    mat.use_nodes = True
    mat.blend_method = "HASHED"
    nodes = mat.node_tree.nodes
    nodes.clear()
    out  = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value        = GEM_COLOR
    bsdf.inputs["Roughness"].default_value         = 0.03
    bsdf.inputs["IOR"].default_value               = IOR
    bsdf.inputs["Transmission Weight"].default_value = 0.95
    out.location, bsdf.location = (300, 0), (0, 0)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    gem.data.materials.append(mat)
    return gem


def _setup_lights_and_camera():
    def _light(name, energy, loc, col=(1.0, 1.0, 1.0)):
        ld = bpy.data.lights.new(name, "POINT")
        ld.energy, ld.color = energy, col
        ob = bpy.data.objects.new(name, ld)
        bpy.context.collection.objects.link(ob)
        ob.location = loc

    _light("Key",  800.0, (4.0, -3.0, 5.0), (1.0, 0.96, 0.88))
    _light("Fill", 250.0, (-5.0, 2.0, 2.5), (0.85, 0.90, 1.0))
    _light("Rim",  400.0, (0.5, 6.0, 4.0))

    dist, elev, azim = 6.0, math.radians(45.0), math.radians(-45.0)
    cx = dist * math.cos(elev) * math.cos(azim)
    cy = dist * math.cos(elev) * math.sin(azim)
    cz = dist * math.sin(elev)
    cd = bpy.data.cameras.new("Camera")
    co = bpy.data.objects.new("Camera", cd)
    bpy.context.collection.objects.link(co)
    co.location = (cx, cy, cz)
    co.rotation_euler = co.location.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = co


def _setup_render(scene):
    scene.render.engine        = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x  = 1280
    scene.render.resolution_y  = 720
    scene.render.fps           = 30
    scene.frame_start          = 1
    scene.frame_end            = N_FRAMES
    scene.render.filepath      = OUTPUT_VIDEO
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"


def main():
    # Clear default objects
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)

    gem = _build_gem()
    _setup_lights_and_camera()

    scene = bpy.context.scene
    _setup_render(scene)

    # Rotation handler: advance gem Z-rotation each frame
    deg_per_frame = ROTATION_DEG / N_FRAMES

    def rotate_gem(scene):
        gem.rotation_euler.z = math.radians(deg_per_frame * scene.frame_current)

    bpy.app.handlers.frame_change_post.append(rotate_gem)

    bpy.ops.render.render(animation=True)

    bpy.app.handlers.frame_change_post.remove(rotate_gem)
    print(f"[record] Render complete → {OUTPUT_VIDEO}.mp4")


if __name__ == "__main__":
    main()
