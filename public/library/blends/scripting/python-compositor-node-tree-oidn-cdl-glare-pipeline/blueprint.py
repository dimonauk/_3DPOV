"""
Python CompositorNodeTree — OIDN Denoise + ASC-CDL Grade + Streak Glare Pipeline
Blender 5.1  |  CC0  |  Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNIQUE  Blender has three distinct node trees: ShaderNodeTree (per-material),
GeometryNodeTree (per-modifier), and CompositorNodeTree (per-scene). This script
builds the third from Python — constructing a full production pipeline in one
headless pass: OIDN guided denoising, ASC-CDL colour correction, streak glare
for emission highlights, and float-32 EXR output. The compositor tree persists
in the .blend and re-evaluates on every render without re-running the script.

Pipeline:
  Render Layers (Combined + Denoising Normal + Denoising Albedo)
    → OIDN Denoise  [guided, HDR, ACCURATE prefilter]
    → ASC-CDL Color Balance  [Slope/Offset/Power per-channel]
    → Streak Glare  [4 streaks, threshold 0.85 scene-linear]
    → Composite  (live viewport output)
    → FileOutput  (float-32 EXR to disk)

Outside ref — Blender Manual: Compositing  CC-BY-SA 4.0  Blender Foundation
  https://docs.blender.org/manual/en/5.1/compositing/index.html
  sibling: https://github.com/blender/blender

Outside ref — ASC-CDL Specification (Slope/Offset/Power)  Apache-2.0  ACES Central
  https://docs.acescentral.com/specifications/acescc-technical-reference/
  sibling: https://github.com/AcademySoftwareFoundation/aces-dev

RUN    blender --background --python blueprint.py
OUTPUT  oidn_cdl_glare.blend  (render manually: F12 or bpy.ops.render.render())
"""

import bpy
import math

# ─── constants ───────────────────────────────────────────────────────────────
OUTPUT_BLEND   = "//oidn_cdl_glare.blend"
OUTPUT_EXR     = "//oidn_cdl_glare_render"   # FileOutput appends frame number

RENDER_RES_X   = 1280
RENDER_RES_Y   = 720
RENDER_SAMPLES = 96     # low for fast demo; raise to 512+ for clean output

# ASC-CDL:  out = clamp(in × Slope + Offset) ^ (1 / Power)
# Warm shadows, cooler mids, slight green-teal top end.
CDL_SLOPE  = (1.04, 1.00, 0.96)   # RGB  — warm bias in reds
CDL_OFFSET = (0.02, 0.01, 0.00)   # RGB  — lifted shadow warmth
CDL_POWER  = (0.94, 0.96, 1.02)   # RGB  — cool gamma in G/B

GLARE_THRESHOLD  = 0.85    # scene-linear: pixels above this emit streaks
GLARE_STREAKS    = 4       # anamorphic 4-streak cross
GLARE_ITERATIONS = 4       # higher = longer, more diffuse streaks
GLARE_MIX        = 0.0     # -1=no glare, 0=50/50 blend, +1=pure glare

GEM_EMISSION_STR = 2.8     # forces pixels well above GLARE_THRESHOLD


# ─── scene ───────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.lights,
                bpy.data.cameras, bpy.data.materials):
        for blk in list(col):
            col.remove(blk)


def build_gem():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.55,
                                          location=(0, 0, 0.55))
    gem = bpy.context.active_object
    gem.name = "gem_host"
    bpy.ops.object.shade_flat()

    mat = bpy.data.materials.new("gem_mat")
    mat.use_nodes = True
    pb = mat.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value          = (0.12, 0.38, 0.92, 1.0)
    pb.inputs["Transmission Weight"].default_value  = 0.85
    pb.inputs["IOR"].default_value                  = 2.42
    pb.inputs["Roughness"].default_value            = 0.0
    pb.inputs["Emission Color"].default_value       = (0.45, 0.78, 1.0, 1.0)
    pb.inputs["Emission Strength"].default_value    = GEM_EMISSION_STR
    gem.data.materials.append(mat)
    return gem


def build_floor():
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "floor"
    mat = bpy.data.materials.new("floor_mat")
    mat.use_nodes = True
    pb = mat.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value  = (0.03, 0.03, 0.05, 1.0)
    pb.inputs["Roughness"].default_value   = 0.55
    pb.inputs["Metallic"].default_value    = 0.15
    floor.data.materials.append(mat)


def build_lights():
    configs = [
        ("key",  ( 2.5, -2.2, 3.2), (1.00, 0.94, 0.84), 130.0),
        ("fill", (-2.2, -1.0, 2.0), (0.68, 0.82, 1.00), 75.0),
        ("rim",  ( 0.0,  2.8, 1.8), (0.90, 0.48, 1.00), 90.0),
    ]
    for name, loc, col, energy in configs:
        ld = bpy.data.lights.new(name, type="AREA")
        ld.energy = energy
        ld.color  = col
        ld.size   = 1.0
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        bpy.context.scene.collection.objects.link(lo)


def build_camera():
    bpy.ops.object.camera_add(location=(0.0, -4.8, 2.8))
    cam = bpy.context.active_object
    cam.name = "render_cam"
    cam.rotation_euler = (math.radians(62), 0.0, 0.0)
    bpy.context.scene.camera = cam


# ─── render ──────────────────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.render.engine          = "CYCLES"
    sc.cycles.device          = "CPU"
    sc.cycles.samples         = RENDER_SAMPLES
    sc.render.resolution_x    = RENDER_RES_X
    sc.render.resolution_y    = RENDER_RES_Y
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "OPEN_EXR"
    sc.render.image_settings.color_depth = "32"

    # Denoising pass storage: Cycles must write Denoising Normal + Albedo so the
    # Denoise compositor node can use them for guided denoising.  Setting
    # use_denoising = False disables the automatic in-render denoiser — we apply
    # it manually in the compositor, giving full control over placement in the
    # pipeline (before grading, not after).
    vl = sc.view_layers["ViewLayer"]
    vl.cycles.denoising_store_passes = True
    vl.cycles.use_denoising          = False


# ─── compositor tree ─────────────────────────────────────────────────────────

def build_compositor():
    sc = bpy.context.scene

    # Enabling use_nodes on the scene creates a CompositorNodeTree at
    # sc.node_tree and seeds it with a default RenderLayers + Composite pair.
    # We clear both to start from a clean slate.
    sc.use_nodes = True
    nt    = sc.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()    # clearing nodes implicitly removes all links too

    # ── 1. Render Layers ────────────────────────────────────────────────────
    # CompositorNodeRLayers is the source of every render pass.  The .layer
    # property must match the actual ViewLayer name (case-sensitive).  Outputs
    # 'Denoising Normal' and 'Denoising Albedo' only appear when
    # vl.cycles.denoising_store_passes is True.
    rl = nodes.new("CompositorNodeRLayers")
    rl.location = (-900, 300)
    rl.layer    = "ViewLayer"

    # ── 2. OIDN Denoise ─────────────────────────────────────────────────────
    # Guided denoising: auxiliary Normal + Albedo passes constrain the filter,
    # preserving texture sharpness at edges where un-guided denoising smears.
    # prefilter='ACCURATE' runs a second denoise pass on the auxiliaries before
    # using them — removes fireflies in normal/albedo, costs ~15% extra time.
    # use_hdr=True keeps the signal in scene-linear float range; without it the
    # node clips at 1.0, losing emission bloom highlights pre-grade.
    dn = nodes.new("CompositorNodeDenoise")
    dn.location  = (-580, 300)
    dn.use_hdr   = True
    dn.prefilter = "ACCURATE"

    links.new(rl.outputs["Image"],            dn.inputs["Image"])
    links.new(rl.outputs["Denoising Normal"], dn.inputs["Normal"])
    links.new(rl.outputs["Denoising Albedo"], dn.inputs["Albedo"])

    # ── 3. ASC-CDL Colour Balance ───────────────────────────────────────────
    # correction_method='ASC_CDL' enables the Slope/Offset/Power model, the
    # industry-standard per-shot colour transform used in DCP mastering.
    # Formula:  out = clamp(in × Slope + Offset) ^ (1 / Power)
    # Slope scales the signal (gain / saturation per-channel).
    # Offset lifts or lowers the blacks (exposure bias per-channel).
    # Power applies a gamma curve per-channel (non-linear contrast tweak).
    # Values differ from LIFT_GAMMA_GAIN: Slope≈Gain, Offset≈Lift,
    # Power≈inverse of Gamma (Power=0.9 ≈ Gamma=1.11, brighter mids).
    cb = nodes.new("CompositorNodeColorBalance")
    cb.location          = (-260, 300)
    cb.correction_method = "ASC_CDL"
    cb.slope             = CDL_SLOPE
    cb.offset            = CDL_OFFSET
    cb.power             = CDL_POWER

    links.new(dn.outputs["Image"], cb.inputs["Image"])

    # ── 4. Streak Glare ─────────────────────────────────────────────────────
    # Glare fires on pixels above threshold in SCENE-LINEAR values — not
    # display-referred.  A value of 0.85 fires on anything brighter than 85%
    # of the reference white before tone-mapping, which includes the gem's
    # emission (Strength=2.8) but excludes diffuse lit surfaces (~0.3–0.6).
    # STREAKS produces anamorphic radial lines; iterations controls decay
    # length (higher = longer streaks, more diffuse).
    # Mix semantics: -1.0 = input unchanged, 0.0 = 50% glare overlay,
    # +1.0 = pure glare with no original image.
    gl = nodes.new("CompositorNodeGlare")
    gl.location    = (60, 300)
    gl.glare_type  = "STREAKS"
    gl.quality     = "MEDIUM"
    gl.threshold   = GLARE_THRESHOLD
    gl.streaks     = GLARE_STREAKS
    gl.iterations  = GLARE_ITERATIONS
    gl.mix         = GLARE_MIX

    links.new(cb.outputs["Image"], gl.inputs["Image"])

    # ── 5. Composite (display output) ───────────────────────────────────────
    comp = nodes.new("CompositorNodeComposite")
    comp.location = (380, 300)
    links.new(gl.outputs["Image"], comp.inputs["Image"])

    # ── 6. Viewer (Image Editor / F11 live preview) ──────────────────────────
    viewer = nodes.new("CompositorNodeViewer")
    viewer.location = (380, 80)
    links.new(gl.outputs["Image"], viewer.inputs["Image"])

    # ── 7. FileOutput — float-32 EXR ────────────────────────────────────────
    # Writing the post-pipeline composite to disk preserves the full HDR float
    # range for round-trip grading in DaVinci or Nuke.  The default slot name
    # 'Image' maps to the single input socket; change path for a custom name.
    # For multilayer EXR: set file_format='OPEN_EXR_MULTILAYER' and call
    # file_slots.new(name) for each layer — sockets match slot names exactly.
    fo = nodes.new("CompositorNodeOutputFile")
    fo.location                          = (700, 300)
    fo.base_path                         = OUTPUT_EXR
    fo.format.file_format                = "OPEN_EXR"
    fo.format.color_depth                = "32"
    fo.format.exr_codec                  = "ZIP"

    links.new(gl.outputs["Image"], fo.inputs["Image"])

    return nt


# ─── main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    clear_scene()
    build_floor()
    build_gem()
    build_lights()
    build_camera()
    configure_render()
    build_compositor()
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    print("[compositor-pipeline] oidn_cdl_glare.blend saved.")
    print("  Open the blend and press F12 to render — compositor applies")
    print("  automatically.  Output EXR written to OUTPUT_EXR path.")
