"""
Shader — Holographic Interface Panel (Emission + Fresnel + Voronoi + Wave)
Blender 5.1
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

TECHNIQUE OVERVIEW
  A holographic panel combines three independently-controllable emissive
  signals over a near-invisible transparent base.

  HEX GRID (Voronoi DISTANCE_TO_EDGE)
    Voronoi in DISTANCE_TO_EDGE mode outputs 0 at every cell boundary and
    rises toward ~0.6 at each centroid.  Inverting (1 − distance) gives a
    function that PEAKS at cell edges.  A CONSTANT-interpolation ColorRamp
    squashes everything below the threshold to black and everything above
    to white, producing a razor-thin bright line at each cell boundary.
    Randomness = 0.0 → perfect honeycomb; Randomness = 1.0 → organic blobs.

  SCAN LINES (Wave Texture BANDS)
    Wave Texture in BANDS / Y-direction generates a sinusoidal pattern that
    varies with the V component of the UV coordinate — horizontal stripes on
    an upright panel.  A second CONSTANT ColorRamp keeps only the peak of
    each cycle (top ~15% of amplitude) as a bright stripe; the rest is black.
    A Mapping node's Y Location is frame-driver-animated so stripes scroll
    upward — the signature "data flowing through the interface" read.

  FRESNEL EDGE AMPLIFICATION
    The Fresnel node evaluates cos(θ) between the surface normal and the
    incoming ray direction.  It outputs 0 at the panel face (ray ⊥ surface)
    and 1 at the silhouette edge (ray ∥ surface).  Multiplying the combined
    emissive mask by (1 + FRESNEL_EMIT_BOOST × fresnel) makes every pattern
    element glow extra-bright at the rim — the optical behaviour of a
    thin-film display seen at grazing incidence, and the strongest visual cue
    that reads as "holographic" to the eye.

  ALPHA PIPELINE
    Three signals sum into the final alpha (clamped):
      base_alpha   ≈ 0.05 — nearly invisible face-on (the point is the lines)
      pattern_alpha = combined_mask × 0.55 — opaque where lines glow
      fresnel_alpha = fresnel × 0.40 — solid rim edge
    The panel is near-invisible background, semi-opaque at glow lines, and
    fully opaque at the silhouette — deliberately exposing the scene behind
    the interface while the lines remain readable.

  EEVEE-NEXT TRANSPARENCY
    mat.surface_render_method = 'FORWARD' — EEVEE-Next sorted alpha pass
    (replaces the legacy blend_method = 'BLEND' from EEVEE 3.x).  Without
    this the Alpha socket is silently ignored.
    mat.shadow_method = 'NONE' — holographic projections cast no shadow.
    mat.use_backface_culling = False — visible from both sides in WebXR orbit.

  GLB EXPORT
    KHR_materials_emissive_strength is applied automatically by Blender's
    built-in glTF-IO (Apache-2.0) whenever Emission Strength > 1.0.  This
    preserves values above 1.0 in Three.js / model-viewer, where the node
    maps to MeshPhysicalMaterial.emissiveIntensity.  Without the extension
    the GLB clamps emissive channels to [0,1] and the panel looks dull.

OUTSIDE SOURCES
  KhronosGroup/glTF — KHR_materials_emissive_strength Spec
    https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength
    Apache-2.0 · Khronos Group
    Related: KhronosGroup/glTF-Blender-IO · KhronosGroup/glTF-Sample-Assets
  KhronosGroup/glTF-Blender-IO (Blender bundled add-on)
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Julien Duroure et al.
    Emissive strength > 1.0 on Principled BSDF triggers KHR_materials_emissive_strength.
"""

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────────────
PANEL_WIDTH          = 2.0     # world-space panel width (m)
PANEL_HEIGHT         = 1.25    # world-space panel height (m)

HEX_SCALE            = 9.0     # Voronoi cell count across the UV space
HEX_RANDOMNESS       = 0.08    # 0 = perfect honeycomb  1 = organic blobs
HEX_LINE_DUTY        = 0.13    # fraction of each cell occupied by the bright edge line

SCAN_SCALE           = 18.0    # scan-line count per UV unit (line frequency)
SCAN_SCROLL_SPEED    = 0.0045  # UV units of Y scroll per frame (≈2 lines/sec at 24fps)
SCAN_LINE_DUTY       = 0.15    # fraction of each wave cycle that is bright

BASE_COLOUR          = (0.0,  0.22, 0.20, 1)   # dark teal base
EMISSIVE_COLOUR      = (0.10, 1.0,  0.90, 1)   # bright cyan glow
EMISSION_STRENGTH    = 4.5    # multiplier — above 1.0 triggers bloom + KHR ext
FRESNEL_IOR          = 1.42   # glass-ish edge glow (RI of common glass)
FRESNEL_EMIT_BOOST   = 2.2    # extra emission at silhouette edges
FRESNEL_ALPHA_BOOST  = 0.40   # extra opacity at silhouette edges
BASE_ALPHA           = 0.05   # face-on panel opacity (nearly invisible)
PATTERN_ALPHA_MIX    = 0.55   # opacity contribution per unit of pattern brightness

ANIM_FRAMES          = 150    # 6.25 s at 24 fps for record.py

OUTPUT_BLEND = "//holographic_panel.blend"
OUTPUT_GLB   = "//holographic_panel.glb"
# ──────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for item in list(pool):
            pool.remove(item)


def make_holo_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("holographic_panel")
    mat.use_nodes              = True
    mat.surface_render_method  = 'FORWARD'  # EEVEE-Next sorted alpha; replaces blend_method
    mat.shadow_method          = 'NONE'     # hologram projects no shadow
    mat.use_backface_culling   = False       # visible from both faces in WebXR orbit

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    def n(t: str, x: float, y: float) -> bpy.types.Node:
        nd = nodes.new(t)
        nd.location = (x, y)
        return nd

    out   = n('ShaderNodeOutputMaterial', 900, 0)
    pbsdf = n('ShaderNodeBsdfPrincipled', 620, 0)

    # ── Coordinate sources ────────────────────────────────────────────────────
    tex_coord    = n('ShaderNodeTexCoord', -1050, 200)

    # Separate mapping for scan-line animation (animated Y Location)
    scan_mapping = n('ShaderNodeMapping', -820, 200)
    scan_mapping.name = "holo_scan_mapping"
    drv = scan_mapping.inputs['Location'].driver_add('default_value', 1)
    drv.driver.expression = f"frame * {SCAN_SCROLL_SPEED}"

    # ── Voronoi — hex grid (DISTANCE_TO_EDGE mode) ────────────────────────────
    voronoi = n('ShaderNodeTexVoronoi', -600, 380)
    voronoi.voronoi_dimensions = '2D'             # 2D: ignores depth for flat panel
    voronoi.feature             = 'DISTANCE_TO_EDGE'
    voronoi.inputs['Scale'].default_value      = HEX_SCALE
    voronoi.inputs['Randomness'].default_value = HEX_RANDOMNESS

    # Invert distance: 0 at edges → 1 at edges (spike at cell boundaries)
    hex_inv = n('ShaderNodeMath', -380, 380)
    hex_inv.operation = 'SUBTRACT'
    hex_inv.inputs[0].default_value = 1.0

    # CONSTANT ramp: dark background, narrow bright band at the spike tip
    hex_ramp = n('ShaderNodeValToRGB', -180, 380)
    hex_ramp.color_ramp.interpolation = 'CONSTANT'
    hex_threshold = 1.0 - HEX_LINE_DUTY
    new_hex = hex_ramp.color_ramp.elements.new(hex_threshold)
    new_hex.color = (1, 1, 1, 1)   # bright at threshold → spike tip = hex line
    # elements[0]=0.0,black  |  new=hex_threshold,white  |  elements[2]=1.0,white

    # ── Wave Texture — scan lines ─────────────────────────────────────────────
    wave = n('ShaderNodeTexWave', -600, 100)
    wave.wave_type       = 'BANDS'
    wave.bands_direction = 'Y'               # bands vary with V → horizontal stripes
    wave.inputs['Scale'].default_value       = SCAN_SCALE
    wave.inputs['Distortion'].default_value  = 0.25  # slight bend in scan lines
    wave.inputs['Detail'].default_value      = 1.5

    # CONSTANT ramp: bright only at the wave peak (top SCAN_LINE_DUTY of cycle)
    scan_ramp = n('ShaderNodeValToRGB', -380, 100)
    scan_ramp.color_ramp.interpolation = 'CONSTANT'
    scan_threshold = 1.0 - SCAN_LINE_DUTY
    new_scan = scan_ramp.color_ramp.elements.new(scan_threshold)
    new_scan.color = (1, 1, 1, 1)  # bright where wave peaks

    # ── Fresnel — edge glow (grazing angle → 1) ───────────────────────────────
    fresnel = n('ShaderNodeFresnel', -600, -180)
    fresnel.inputs['IOR'].default_value = FRESNEL_IOR

    # ── Combine hex + scan → clamp to [0,1] ──────────────────────────────────
    add_patt = n('ShaderNodeMath', 80, 280)
    add_patt.operation = 'ADD'
    add_patt.use_clamp = True   # overlapping lines don't over-drive

    # Fresnel amplifier: fresnel * BOOST + 1.0  →  min=1.0 (face-on), max=3.2 (edge)
    fresnel_amp = n('ShaderNodeMath', 80, 80)
    fresnel_amp.operation = 'MULTIPLY_ADD'
    fresnel_amp.inputs[1].default_value = FRESNEL_EMIT_BOOST
    fresnel_amp.inputs[2].default_value = 1.0

    # pattern * fresnel_amplifier  →  amplified_pattern
    emit_mul = n('ShaderNodeMath', 280, 180)
    emit_mul.operation = 'MULTIPLY'

    # amplified_pattern * EMISSION_STRENGTH  →  final emission strength
    emit_scale = n('ShaderNodeMath', 450, 180)
    emit_scale.operation = 'MULTIPLY'
    emit_scale.inputs[1].default_value = EMISSION_STRENGTH

    # ── Alpha computation ─────────────────────────────────────────────────────
    patt_alpha = n('ShaderNodeMath', 80, -80)
    patt_alpha.operation = 'MULTIPLY'
    patt_alpha.inputs[1].default_value = PATTERN_ALPHA_MIX

    # BASE_ALPHA + pattern contribution
    alpha_sum1 = n('ShaderNodeMath', 280, -80)
    alpha_sum1.operation = 'ADD'
    alpha_sum1.inputs[0].default_value = BASE_ALPHA

    fres_alpha = n('ShaderNodeMath', 80, -240)
    fres_alpha.operation = 'MULTIPLY'
    fres_alpha.inputs[1].default_value = FRESNEL_ALPHA_BOOST

    # (BASE_ALPHA + pattern) + fresnel  →  clamp
    alpha_sum2 = n('ShaderNodeMath', 450, -160)
    alpha_sum2.operation = 'ADD'
    alpha_sum2.use_clamp = True

    # ── Principled BSDF ───────────────────────────────────────────────────────
    pbsdf.inputs['Base Color'].default_value     = BASE_COLOUR
    pbsdf.inputs['Emission Color'].default_value  = EMISSIVE_COLOUR
    pbsdf.inputs['Roughness'].default_value       = 0.05   # near-mirror surface
    pbsdf.inputs['IOR'].default_value             = 1.02   # negligible refraction
    pbsdf.inputs['Transmission Weight'].default_value = 0.25  # subtle glass clarity

    # ── Wire the graph ────────────────────────────────────────────────────────
    # UV → scan mapping → wave texture
    links.new(tex_coord.outputs['UV'],   scan_mapping.inputs['Vector'])
    links.new(scan_mapping.outputs['Vector'], wave.inputs['Vector'])

    # UV → voronoi (no mapping needed; Voronoi Scale drives density)
    links.new(tex_coord.outputs['UV'],   voronoi.inputs['Vector'])

    # Voronoi Distance → invert → hex ramp → hex mask
    links.new(voronoi.outputs['Distance'], hex_inv.inputs[1])
    links.new(hex_inv.outputs['Value'],    hex_ramp.inputs['Fac'])

    # Wave Fac → scan ramp → scan mask
    links.new(wave.outputs['Fac'],         scan_ramp.inputs['Fac'])

    # hex + scan → combined mask
    links.new(hex_ramp.outputs['Color'],   add_patt.inputs[0])
    links.new(scan_ramp.outputs['Color'],  add_patt.inputs[1])

    # Fresnel → amplifier (fresnel * BOOST + 1.0)
    links.new(fresnel.outputs['Fac'],      fresnel_amp.inputs[0])

    # pattern * amplifier → scaled emission strength
    links.new(add_patt.outputs['Value'],   emit_mul.inputs[0])
    links.new(fresnel_amp.outputs['Value'], emit_mul.inputs[1])
    links.new(emit_mul.outputs['Value'],   emit_scale.inputs[0])
    links.new(emit_scale.outputs['Value'], pbsdf.inputs['Emission Strength'])

    # Alpha: BASE + pattern*MIX + fresnel*BOOST → clamp
    links.new(add_patt.outputs['Value'],   patt_alpha.inputs[0])
    links.new(patt_alpha.outputs['Value'], alpha_sum1.inputs[1])
    links.new(fresnel.outputs['Fac'],      fres_alpha.inputs[0])
    links.new(alpha_sum1.outputs['Value'], alpha_sum2.inputs[0])
    links.new(fres_alpha.outputs['Value'], alpha_sum2.inputs[1])
    links.new(alpha_sum2.outputs['Value'], pbsdf.inputs['Alpha'])

    links.new(pbsdf.outputs['BSDF'], out.inputs['Surface'])

    return mat


def make_panel_geometry(mat: bpy.types.Material) -> None:
    # Main panel: flat in XY, rotated to vertical for the hero shot
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
    main = bpy.context.active_object
    main.name = "holo_panel_main"
    main.scale = (PANEL_WIDTH, PANEL_HEIGHT, 1.0)
    main.data.materials.append(mat)

    # Two accent sub-panels suggest a data readout layout below the main area
    for name, tx, ty in [("holo_sub_left",  -0.55, -0.72), ("holo_sub_right", 0.55, -0.72)]:
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(tx, ty, 0.0))
        sub = bpy.context.active_object
        sub.name = name
        sub.scale = (0.46, 0.20, 1.0)
        sub.data.materials.append(mat)


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine           = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x     = 1920
    scene.render.resolution_y     = 1080
    scene.render.fps              = 24
    scene.frame_start             = 1
    scene.frame_end               = ANIM_FRAMES

    # Bloom: without it the emission above 1.0 reads as flat colour in the viewport
    eevee = scene.eevee
    eevee.use_bloom       = True
    eevee.bloom_threshold = 0.8   # triggers earlier than default → panel rim glows
    eevee.bloom_intensity = 0.35
    eevee.bloom_radius    = 5.0

    # Deep dark world — emissive panel pops against near-black background
    world = bpy.data.worlds.new("holo_world")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value    = (0.005, 0.005, 0.012, 1)
        bg.inputs['Strength'].default_value = 0.08

    # Camera: oblique angle so Fresnel edge glow is clearly visible in tutorial render
    bpy.ops.object.camera_add(
        location=(1.4, -2.8, 0.9),
        rotation=(math.radians(72), 0, math.radians(28)),
    )
    cam = bpy.context.active_object
    cam.name = "render_cam"
    scene.camera = cam

    # Soft key light — low energy to avoid washing out the self-lit panel
    bpy.ops.object.light_add(type='AREA', location=(2.5, -1.5, 2.5))
    key = bpy.context.active_object
    key.name = "key_light"
    key.data.energy = 35
    key.data.color  = (0.9, 0.95, 1.0)  # cool white
    key.data.size   = 2.0
    key.rotation_euler = (math.radians(40), math.radians(20), 0)


def export_files() -> None:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(OUTPUT_GLB),
        export_format                        = 'GLB',
        export_apply                         = True,
        export_animations                    = False,
        export_image_format                  = 'WEBP',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
    )


if __name__ == "__main__":
    clear_scene()
    mat = make_holo_material()
    make_panel_geometry(mat)
    setup_scene()
    export_files()
    print("holographic_panel: blueprint complete — blend + glb written.")
