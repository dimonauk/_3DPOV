# =============================================================================
# EEVEE Next Shadow Catcher + Holdout: AR-Ready Composite Ground Pass
# Blender 5.1 — bpy direct data API, EEVEE Next renderer
#
# WHY shadow catcher exists: a ground plane marked is_shadow_catcher = True
# receives cast shadows and ambient occlusion from hero objects, but its own
# surface renders as fully transparent in the RGBA output. The alpha channel
# encodes shadow density — 0.0 where the plane is unlit, fractional values
# where shadows fall — so compositing over any background image adds only
# the shadow, never the ground geometry. This is the standard AR product-
# visualisation trick.
#
# WHY holdout is separate: is_holdout = True punches a matte hole through the
# render for every pixel the object covers. It is used here for a vertical
# crop card behind the hero so the background plate shows only in the framed
# region, avoiding any unintended world-colour bleed at frame edges.
#
# EEVEE Next vs Cycles difference: in Cycles the shadow catcher pass is
# separate (View Layer > Passes > Shadow Catcher); in EEVEE Next (Blender
# 4.2+) the shadow is baked directly into the RGBA alpha of the beauty
# pass — no separate pass needed, which makes the compositor simpler.
# =============================================================================

import bpy
import bmesh
import math

# ── named constants ──────────────────────────────────────────────────────────
BLEND_OUT   = "//ar_composite.blend"
RENDER_W    = 1280
RENDER_H    = 720
EEVEE_SAMP  = 64
GEM_SEGS    = 6        # hexagonal cross-section
GEM_Z_OFF   = 0.62     # gem base above catcher plane (metres)

# ── helper: create + link an object ─────────────────────────────────────────
def link(name: str, mesh) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

def add_light(name, loc, rot_deg, energy, size, color=(1.0, 1.0, 1.0)):
    ldata = bpy.data.lights.new(name, type="AREA")
    ldata.energy = energy
    ldata.size   = size
    ldata.color  = color
    ldata.use_shadow = True
    lobj = bpy.data.objects.new(name, ldata)
    lobj.location      = loc
    lobj.rotation_euler = [math.radians(d) for d in rot_deg]
    bpy.context.scene.collection.objects.link(lobj)
    return lobj

# =============================================================================
# 1.  Scene + EEVEE Next render settings
# =============================================================================
scn = bpy.context.scene
scn.render.engine             = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x       = RENDER_W
scn.render.resolution_y       = RENDER_H
scn.render.resolution_percentage = 100
scn.render.film_transparent   = True    # essential: world becomes alpha=0
scn.render.image_settings.file_format  = "PNG"
scn.render.image_settings.color_mode   = "RGBA"  # shadow lives in alpha
scn.render.filepath           = "//render/ar_composite_####"

ev = scn.eevee
ev.taa_render_samples         = EEVEE_SAMP
ev.use_shadows                = True
ev.shadow_cube_size           = "1024"
ev.shadow_cascade_size        = "2048"

# remove scene defaults
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# =============================================================================
# 2.  World — low-energy neutral grey (prevents sky colour bleeding onto shadows)
# =============================================================================
wld = bpy.data.worlds.new("world_ar")
scn.world = wld
wld.use_nodes = True
wld.node_tree.nodes["Background"].inputs["Color"].default_value   = (0.1, 0.1, 0.1, 1.0)
wld.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6

# =============================================================================
# 3.  Hero crystal — hexagonal diamond-cut gem (entirely via bmesh)
# =============================================================================
me = bpy.data.meshes.new("hero_crystal")
bm = bmesh.new()

# table (top flat vertex) and culet (bottom tip)
table  = bm.verts.new((0.0, 0.0, 0.76))
culet  = bm.verts.new((0.0, 0.0, -0.60))

# three rings: crown (top), girdle (widest), pavilion (lower taper)
def ring(bm, n, r, z, phase=0.0):
    return [bm.verts.new((math.cos(math.radians(i*360/n + phase))*r,
                          math.sin(math.radians(i*360/n + phase))*r, z))
            for i in range(n)]

crown    = ring(bm, GEM_SEGS, 0.30,  0.55, phase=30)
girdle   = ring(bm, GEM_SEGS, 0.46,  0.16, phase=0)
pavilion = ring(bm, GEM_SEGS, 0.28, -0.25, phase=30)

bm.verts.ensure_lookup_table()
N = GEM_SEGS

# table fan → crown
for i in range(N):
    bm.faces.new([table, crown[i], crown[(i+1) % N]])

# crown quads → girdle
for i in range(N):
    bm.faces.new([crown[i], girdle[i], girdle[(i+1) % N], crown[(i+1) % N]])

# girdle quads → pavilion
for i in range(N):
    bm.faces.new([girdle[i], pavilion[i], pavilion[(i+1) % N], girdle[(i+1) % N]])

# pavilion fan → culet
for i in range(N):
    bm.faces.new([pavilion[i], culet, pavilion[(i+1) % N]])

bm.to_mesh(me)
bm.free()
gem = link("hero_crystal", me)
gem.location = (0.0, 0.0, GEM_Z_OFF)

# Hero material — teal transparent gem, Principled BSDF
mat_gem = bpy.data.materials.new("mat_hero_crystal")
mat_gem.use_nodes = True
bsdf = mat_gem.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value          = (0.07, 0.70, 0.74, 1.0)
bsdf.inputs["Metallic"].default_value            = 0.0
bsdf.inputs["Roughness"].default_value           = 0.04
bsdf.inputs["IOR"].default_value                 = 2.42
bsdf.inputs["Transmission Weight"].default_value = 0.75
bsdf.inputs["Coat Weight"].default_value         = 1.0
bsdf.inputs["Coat Roughness"].default_value      = 0.0
gem.data.materials.append(mat_gem)

# =============================================================================
# 4.  Shadow Catcher ground plane
#     is_shadow_catcher = True: EEVEE Next bakes cast shadows into the
#     beauty pass alpha instead of rendering the plane's own diffuse colour.
# =============================================================================
pc_me = bpy.data.meshes.new("shadow_catcher_ground")
pc_bm = bmesh.new()
bmesh.ops.create_grid(pc_bm, x_segments=1, y_segments=1, size=2.0)
pc_bm.to_mesh(pc_me)
pc_bm.free()
catcher = link("shadow_catcher_ground", pc_me)
catcher.is_shadow_catcher = True          # the key flag

mat_catcher = bpy.data.materials.new("mat_shadow_catcher")
mat_catcher.use_nodes = True
c_bsdf = mat_catcher.node_tree.nodes["Principled BSDF"]
c_bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
c_bsdf.inputs["Roughness"].default_value  = 1.0   # fully diffuse, no specular
catcher.data.materials.append(mat_catcher)

# =============================================================================
# 5.  Holdout crop card (vertical plane behind the hero)
#     is_holdout = True: punches an alpha hole; only background plate shows
#     through in those pixels. Prevents world-colour fringe at frame edges.
# =============================================================================
hm = bpy.data.meshes.new("holdout_surround")
hbm = bmesh.new()
bmesh.ops.create_grid(hbm, x_segments=1, y_segments=1, size=2.5)
hbm.to_mesh(hm)
hbm.free()
holdout_obj = link("holdout_surround", hm)
holdout_obj.location      = (0.0, 0.6, 1.0)
holdout_obj.rotation_euler = (math.radians(90), 0.0, 0.0)
holdout_obj.is_holdout    = True          # punches a matte hole

# =============================================================================
# 6.  Three-point lighting rig
#     Key (warm, upper-left) casts the main shadow onto the catcher.
#     Fill (cool, right) softens secondary shadows without strong caster.
#     Rim (neutral, behind) separates gem edge from background.
# =============================================================================
add_light("key_area",  ( 1.9, -2.0,  2.5), ( 55, 0,  35), energy=180, size=1.5,
          color=(1.00, 0.95, 0.88))
add_light("fill_area", (-1.8, -1.5,  1.2), ( 45, 0, -35), energy= 60, size=2.0,
          color=(0.82, 0.90, 1.00))
add_light("rim_area",  ( 0.2,  2.2,  1.8), (-45, 0,   0), energy= 90, size=0.8,
          color=(1.00, 0.98, 0.92))

# =============================================================================
# 7.  Camera — 85 mm portrait framing, hero centred
# =============================================================================
cam_d = bpy.data.cameras.new("cam_ar")
cam_d.lens       = 85
cam_d.dof.use_dof = False
cam_obj = bpy.data.objects.new("cam_ar", cam_d)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location       = (0.0, -2.8, 1.5)
cam_obj.rotation_euler = (math.radians(77), 0.0, 0.0)
scn.camera = cam_obj

# =============================================================================
# 8.  Compositor — shadow composite over background plate
#     Node graph:
#       Background image → Alpha Over (bottom)
#       Render Layers    → Alpha Over (top)   [RGBA: shadow in alpha]
#                          Alpha Over → Composite output
#     The shadow catcher's alpha encodes shadow density directly; Alpha Over
#     blends it onto the plate proportionally — no extra multiply needed.
# =============================================================================
scn.use_nodes = True
ct = scn.node_tree
for n in list(ct.nodes):
    ct.nodes.remove(n)

rl   = ct.nodes.new("CompositorNodeRLayers"); rl.location   = (0, 400)
bg   = ct.nodes.new("CompositorNodeImage");   bg.location   = (0, 100)
ao   = ct.nodes.new("CompositorNodeAlphaOver"); ao.location = (400, 300)
comp = ct.nodes.new("CompositorNodeComposite"); comp.location = (650, 300)
view = ct.nodes.new("CompositorNodeViewer");    view.location = (650, 100)

# Placeholder warm-white background (replace with a real photo at composite time)
bg_img = bpy.data.images.new("bg_plate_placeholder", width=RENDER_W, height=RENDER_H,
                               alpha=False, float_buffer=False)
bg_img.generated_type  = "BLANK"
bg_img.generated_color = (0.87, 0.84, 0.80, 1.0)
bg.image = bg_img

ct.links.new(bg.outputs["Image"],   ao.inputs[1])   # background plate (bottom)
ct.links.new(rl.outputs["Image"],   ao.inputs[2])   # shadow render (top)
ct.links.new(ao.outputs["Image"],  comp.inputs["Image"])
ct.links.new(ao.outputs["Image"],  view.inputs["Image"])

# =============================================================================
# 9.  Save
# =============================================================================
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
print("Saved ar_composite.blend — shadow catcher + holdout scene ready.")
