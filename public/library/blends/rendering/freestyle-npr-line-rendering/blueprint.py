"""
Freestyle NPR Line Rendering — Blender 5.1
Three line sets (silhouette, crease, material boundary) on a hexagonal gem.
Freestyle is Cycles-only; for EEVEE use Grease Pencil Line Art instead.

Sources:
  https://docs.blender.org/manual/en/latest/render/freestyle/  CC-BY-SA 4.0
  https://docs.blender.org/api/current/bpy.types.FreestyleLineStyle.html  CC-BY-SA 4.0
"""

import bpy
import math
import bmesh
from mathutils import Vector

# ─── PARAMETERS ─────────────────────────────────────────────────────────────
RENDER_WIDTH      = 1280
RENDER_HEIGHT     = 720
RENDER_SAMPLES    = 64
OUTPUT_PATH       = "//freestyle_npr_lines.png"

GEM_SIDES         = 6
GEM_RADIUS        = 0.85
GEM_DEPTH         = 1.2

SILHOUETTE_WIDTH  = 2.8   # px — outer profile, heaviest weight
CREASE_WIDTH      = 1.3   # px — interior facet edges
BOUNDARY_WIDTH    = 1.0   # px — material seam, dashed

# Edges sharper than this dihedral angle qualify as crease edges
CREASE_THRESHOLD  = math.radians(22)

GRADIENT_A = (0.04, 0.02, 0.28, 1.0)   # stroke-start: shadow blue
GRADIENT_B = (0.88, 0.47, 0.06, 1.0)   # stroke-end: accent amber

# Screen-space wobble — PERLIN_NOISE_2D displaces in pixels; value is
# resolution-independent in the sense that matching pixel counts look
# identical regardless of viewport zoom.
NOISE_AMP  = 1.3
NOISE_FREQ = 0.09
NOISE_OCT  = 4
NOISE_SEED = 11

FADE_NEAR = 1.5    # fully opaque within this camera distance (m)
FADE_FAR  = 13.0   # fades to transparent at this distance (m)


# ─── SCENE ──────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def mat(name, colour, roughness=0.35, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*colour, 1.0)
    b.inputs["Roughness"].default_value  = roughness
    b.inputs["Metallic"].default_value   = metallic
    return m


def make_gem():
    # Two materials so Freestyle can draw the material_boundary edge type
    # between the teal side faces and the gold crown faces.
    mat_body = mat("gem_body", (0.02, 0.35, 0.52), roughness=0.12, metallic=0.6)
    mat_cap  = mat("gem_cap",  (0.78, 0.55, 0.08), roughness=0.08, metallic=0.9)

    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False,
        segments=GEM_SIDES,
        radius1=GEM_RADIUS, radius2=GEM_RADIUS * 0.62,
        depth=GEM_DEPTH,
    )
    top = [f for f in bm.faces if f.calc_center_median().z > GEM_DEPTH * 0.35]
    bmesh.ops.inset_individual(bm, faces=top, thickness=0.18, depth=0.15,
                               use_even_offset=True)
    mesh = bpy.data.meshes.new("gem_mesh")
    bm.to_mesh(mesh); bm.free()

    obj = bpy.data.objects.new("gem_prism", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat_body)
    obj.data.materials.append(mat_cap)
    for poly in obj.data.polygons:
        poly.material_index = 1 if abs(poly.normal.z) > 0.5 else 0
    obj.location.z = GEM_DEPTH * 0.5 + 0.02
    return obj


def make_pedestal():
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=1.1, depth=0.2,
                                        location=(0, 0, 0.1))
    p = bpy.context.object
    p.name = "pedestal"
    p.data.materials.append(mat("pedestal", (0.18, 0.16, 0.14), roughness=0.65))
    return p


def make_ground():
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    g = bpy.context.object
    g.name = "ground_plane"
    g.data.materials.append(mat("ground", (0.08, 0.08, 0.09), roughness=0.82))
    return g


def setup_lighting():
    bpy.ops.object.light_add(type='AREA', location=(3.2, -2.5, 4.8))
    k = bpy.context.object
    k.data.energy = 420; k.data.size = 2.2
    k.rotation_euler = (math.radians(52), 0, math.radians(35))
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 8))
    s = bpy.context.object
    s.data.energy = 0.4
    s.rotation_euler = (math.radians(20), math.radians(10), 0)


def setup_camera():
    bpy.ops.object.camera_add(location=(4.2, -3.8, 3.0))
    cam = bpy.context.object; cam.name = "render_cam"
    cam.data.lens = 72
    bpy.context.scene.camera = cam
    direction = Vector((0, 0, GEM_DEPTH * 0.5)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


# ─── FREESTYLE ──────────────────────────────────────────────────────────────

def _style(name, colour, alpha, thickness):
    s = bpy.data.linestyles.new(name)
    s.color = colour; s.alpha = alpha; s.thickness = thickness
    s.use_chaining = True; s.chaining = 'PLAIN'
    return s


def _colour_along_stroke(style, name):
    # Maps stroke parametric t∈[0,1] through a colour ramp: shadow-blue at t=0
    # (chain start, typically furthest from camera), warm amber at t=1.
    # This mimics the look of a brush loaded with highlight colour at its tip.
    mod = style.color_modifiers.new(name, type='ALONG_STROKE')
    mod.blend = 'MIX'; mod.influence = 1.0
    mod.color_ramp.elements[0].position = 0.0
    mod.color_ramp.elements[0].color    = GRADIENT_A
    mod.color_ramp.elements[1].position = 1.0
    mod.color_ramp.elements[1].color    = GRADIENT_B


def _alpha_camera_fade(style, name):
    # Distant strokes fade out — prevents background clutter while keeping
    # foreground lines at full opacity. value_min/max are the alpha at range
    # edges, not the distance values (those are range_min/max).
    mod = style.alpha_modifiers.new(name, type='DISTANCE_FROM_CAMERA')
    mod.blend = 'MIX'; mod.influence = 0.9
    mod.range_min = FADE_NEAR; mod.range_max = FADE_FAR
    mod.value_min = 1.0; mod.value_max = 0.0


def _perlin_wobble(style, name, amp_scale=1.0, seed_offset=0):
    # PERLIN_NOISE_2D works in screen-space pixels — amplitude stays visually
    # consistent at any camera distance, unlike a 3-D object-space displacement.
    mod = style.geometry_modifiers.new(name, type='PERLIN_NOISE_2D')
    mod.frequency = NOISE_FREQ; mod.amplitude = NOISE_AMP * amp_scale
    mod.octaves   = NOISE_OCT;  mod.seed      = NOISE_SEED + seed_offset
    mod.angle     = math.radians(35)


def _thickness_taper(style, name):
    # ALONG_STROKE thickness (MULTIPLY blend): thin at stroke tips (value_min),
    # full-weight at centre. Mimics a tapered brush or dip-pen calligraphic line.
    mod = style.thickness_modifiers.new(name, type='ALONG_STROKE')
    mod.blend = 'MULTIPLY'; mod.influence = 0.85
    mod.value_min = 0.25; mod.value_max = 1.0


def setup_freestyle():
    scene = bpy.context.scene
    scene.render.use_freestyle = True

    vl = bpy.context.view_layer
    fs = vl.freestyle_settings

    # Crease angle is global to the view layer — all line sets see the same threshold.
    # Edges whose adjacent-face dihedral angle is sharper than this become crease edges.
    fs.crease_angle           = CREASE_THRESHOLD
    fs.use_material_boundaries = True   # required for the third line set

    # Direct data API — works headlessly; bpy.ops.scene.freestyle_lineset_add()
    # requires a Render Properties UI context and fails in --background mode.
    for existing in list(fs.linesets):
        fs.linesets.remove(existing)

    # ── 1. SILHOUETTE — outer profile, view-dependent ────────────────────────
    ls1 = fs.linesets.new("silhouette")
    ls1.select_silhouette        = True
    ls1.select_crease            = False
    ls1.select_border            = True   # open mesh boundary edges
    ls1.select_material_boundary = False
    ls1.select_suggestive_contours = False
    ls1.select_ridges_and_valleys  = False

    sty1 = _style("style_silhouette", (0.04, 0.02, 0.22), 0.96, SILHOUETTE_WIDTH)
    _colour_along_stroke(sty1, "SilhouetteGradient")
    _alpha_camera_fade(sty1,   "SilhouetteFade")
    _perlin_wobble(sty1,       "SilhouetteWobble")
    _thickness_taper(sty1,     "SilhouetteTaper")
    ls1.linestyle = sty1

    # ── 2. CREASE — interior facet edges ────────────────────────────────────
    # Lighter weight and muted colour keep this subordinate to the silhouette.
    ls2 = fs.linesets.new("crease")
    ls2.select_silhouette        = False
    ls2.select_crease            = True
    ls2.select_border            = False
    ls2.select_material_boundary = False
    ls2.select_suggestive_contours = False

    sty2 = _style("style_crease", (0.28, 0.22, 0.18), 0.72, CREASE_WIDTH)
    _perlin_wobble(sty2, "CreaseWobble", amp_scale=0.5, seed_offset=5)
    ls2.linestyle = sty2

    # ── 3. MATERIAL BOUNDARY — crown seam ───────────────────────────────────
    # The seam between gem_body and gem_cap is smooth geometry — no crease or
    # silhouette edge would catch it. Material boundary edge type is the only
    # way to draw a line there. Dashed to visually distinguish from silhouette.
    ls3 = fs.linesets.new("material_boundary")
    ls3.select_silhouette        = False
    ls3.select_crease            = False
    ls3.select_border            = False
    ls3.select_material_boundary = True
    ls3.select_suggestive_contours = False

    sty3 = _style("style_mat_boundary", (0.88, 0.72, 0.14), 0.88, BOUNDARY_WIDTH)
    sty3.use_dashed_line = True
    sty3.dash1 = 8; sty3.gap1 = 4
    ls3.linestyle = sty3


# ─── RENDER + MAIN ──────────────────────────────────────────────────────────

def setup_render():
    scene = bpy.context.scene
    scene.render.engine          = 'CYCLES'
    scene.cycles.samples         = RENDER_SAMPLES
    scene.cycles.use_denoising   = True
    scene.cycles.device          = 'GPU'
    scene.render.resolution_x    = RENDER_WIDTH
    scene.render.resolution_y    = RENDER_HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath        = OUTPUT_PATH
    scene.frame_start = 1; scene.frame_end = 1


def main():
    clear_scene()
    make_gem(); make_pedestal(); make_ground()
    setup_lighting(); setup_camera()
    setup_freestyle(); setup_render()
    blend_path = bpy.path.abspath("//freestyle_npr_lines.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved:", blend_path)


if __name__ == "__main__":
    main()
