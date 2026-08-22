"""
record.py — Viewport render: gem pendant integrity pipeline visualisation
Output: public/library/videos/scripting/
        python-bmesh-ops-find-doubles-recalc-normals-holes-fill-mesh-integrity-glb-webxr/
        viewport.mp4
Duration: ~10 s @ 24 fps (240 frames)
  F001-072  — broken mesh rotating (seam crack + dark patch visible)
  F073-144  — repaired mesh same rotation (seam healed, all faces lit)
  F145-240  — repaired mesh slow spin + slight zoom for final presentation
Run:  blender --background --python record.py
"""

import bpy, bmesh, math
from mathutils import Vector, Euler

VIDEO_PATH = "//public/library/videos/scripting/" \
    "python-bmesh-ops-find-doubles-recalc-normals-holes-fill-mesh-integrity-glb-webxr/" \
    "viewport.mp4"
FACETS      = 12
EQUATOR_R   = 0.40
WELD_DIST   = 1e-4

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 240
scene.render.fps  = 24
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.filepath                   = VIDEO_PATH
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.engine                     = 'BLENDER_EEVEE_NEXT'

def build_broken() -> bpy.types.Object:
    bm = bmesh.new()

    def ring(z, r):
        verts = []
        for i in range(FACETS):
            a = 2.0 * math.pi * i / FACETS
            verts.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        return verts

    upper = [ring(i / 3 * 0.25, EQUATOR_R * (1.0 - i / 3 * 0.85)) for i in range(4)]
    dupe  = [bm.verts.new(v.co.copy()) for v in upper[0]]
    lower = [dupe] + [ring(-i / 4 * 0.35, EQUATOR_R * (1.0 - i / 4)) for i in range(1, 5)]
    culet = bm.verts.new((0.0, 0.0, -0.35))

    for lvl in range(3):
        lo, hi = upper[lvl], upper[lvl + 1]
        for i in range(FACETS):
            j = (i + 1) % FACETS
            bm.faces.new([lo[i], lo[j], hi[j], hi[i]])

    for lvl in range(3):
        lo, hi = lower[lvl], lower[lvl + 1]
        for i in range(FACETS):
            j = (i + 1) % FACETS
            if lvl == 0:
                bm.faces.new([lo[j], lo[i], hi[i], hi[j]])  # flipped
            else:
                bm.faces.new([lo[i], lo[j], hi[j], hi[i]])

    for i in range(FACETS):
        j = (i + 1) % FACETS
        bm.faces.new([lower[-1][i], culet, lower[-1][j]])

    bm.normal_update()
    for f in bm.faces: f.smooth = False
    me = bpy.data.meshes.new("gem_broken")
    ob = bpy.data.objects.new("gem_broken", me)
    bpy.context.scene.collection.objects.link(ob)
    bm.to_mesh(me); bm.free()
    return ob

def build_repaired() -> bpy.types.Object:
    bm = bmesh.new()

    def ring(z, r):
        verts = []
        for i in range(FACETS):
            a = 2.0 * math.pi * i / FACETS
            verts.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        return verts

    upper = [ring(i / 3 * 0.25, EQUATOR_R * (1.0 - i / 3 * 0.85)) for i in range(4)]
    dupe  = [bm.verts.new(v.co.copy()) for v in upper[0]]
    lower = [dupe] + [ring(-i / 4 * 0.35, EQUATOR_R * (1.0 - i / 4)) for i in range(1, 5)]
    culet = bm.verts.new((0.0, 0.0, -0.35))

    for lvl in range(3):
        lo, hi = upper[lvl], upper[lvl + 1]
        for i in range(FACETS):
            j = (i + 1) % FACETS
            bm.faces.new([lo[i], lo[j], hi[j], hi[i]])

    for lvl in range(3):
        lo, hi = lower[lvl], lower[lvl + 1]
        for i in range(FACETS):
            j = (i + 1) % FACETS
            if lvl == 0:
                bm.faces.new([lo[j], lo[i], hi[i], hi[j]])
            else:
                bm.faces.new([lo[i], lo[j], hi[j], hi[i]])

    for i in range(FACETS):
        j = (i + 1) % FACETS
        bm.faces.new([lower[-1][i], culet, lower[-1][j]])

    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    ret = bmesh.ops.find_doubles(bm, verts=bm.verts[:], keep_verts=[], dist=WELD_DIST)
    if ret['targetmap']:
        bmesh.ops.weld_verts(bm, targetmap=ret['targetmap'])
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    boundary = [e for e in bm.edges if e.is_boundary]
    if boundary:
        bmesh.ops.holes_fill(bm, edges=boundary, sides=4)
    bm.normal_update()
    for f in bm.faces: f.smooth = False
    me = bpy.data.meshes.new("gem_repaired")
    ob = bpy.data.objects.new("gem_repaired", me)
    bpy.context.scene.collection.objects.link(ob)
    bm.to_mesh(me); bm.free()
    return ob

broken   = build_broken()
repaired = build_repaired()
repaired.location = (0.0, 0.0, 0.0)

# Hide/show via object visibility keyframes
for f in [1, 72]:
    scene.frame_set(f)
    broken.hide_viewport = repaired.hide_viewport = False if f == 1 else True
    broken.hide_render   = repaired.hide_render   = False if f == 1 else True
    broken.keyframe_insert("hide_viewport"); broken.keyframe_insert("hide_render")
    repaired.keyframe_insert("hide_viewport"); repaired.keyframe_insert("hide_render")

for f in [73, 240]:
    scene.frame_set(f)
    broken.hide_viewport = broken.hide_render = True
    repaired.hide_viewport = repaired.hide_render = False
    broken.keyframe_insert("hide_viewport"); broken.keyframe_insert("hide_render")
    repaired.keyframe_insert("hide_viewport"); repaired.keyframe_insert("hide_render")

# Camera
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 85
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.scene.collection.objects.link(cam)
cam.location = (0.0, -1.4, 0.0)
cam.rotation_euler = Euler((math.pi / 2, 0.0, 0.0))
scene.camera = cam

# Key light
light_data = bpy.data.lights.new("key", type='SUN')
light_data.energy = 3.0
light = bpy.data.objects.new("key", light_data)
bpy.context.scene.collection.objects.link(light)
light.rotation_euler = Euler((math.radians(45), 0.0, math.radians(30)))

# Rotation animation on the repaired gem (F145-240 spin)
repaired.rotation_euler = Euler((0.0, 0.0, 0.0))
scene.frame_set(145); repaired.keyframe_insert("rotation_euler")
repaired.rotation_euler = Euler((0.0, 0.0, math.pi * 2))
scene.frame_set(240); repaired.keyframe_insert("rotation_euler")

bpy.ops.render.render(animation=True)
print(f"[holoflow] record.py done → {VIDEO_PATH}")
