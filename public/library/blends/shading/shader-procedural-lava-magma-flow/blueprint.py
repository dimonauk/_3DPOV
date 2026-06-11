"""
Shader — Procedural Lava / Magma Flow Material
Blender 5.1
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

TECHNIQUE OVERVIEW
  A convincing lava material requires two Voronoi lookups that serve opposite
  roles.  The first, in DISTANCE_TO_EDGE mode, produces a value of 0 at every
  Voronoi cell boundary and rises toward 1 at each cell centre — this is the
  crack network: inverting it gives bright edges (hot cracks) and dark interiors
  (cooling plates).  The second, in F1 (distance to nearest cell centre) mode,
  produces the complementary shape: 0 at cell centres and rising toward edges.
  F1 drives the Displacement socket so that plate centres sit high while cracks
  form physical grooves — matching geological reality where cooling lava forms
  convex domes above drainage channels.

  Animation is achieved by driving the Mapping node's Y Location with a scene
  frame expression, producing a smooth 2-D scroll that reads as viscous flow.
  The driver is pure Python and survives a save/reload cycle.

  For GLB export the emission is preserved via KHR_materials_emissive_strength,
  which lifts the per-channel 1.0 cap in core glTF 2.0 and allows values up to
  ~10 for EEVEE-Next Bloom-triggering levels.  Without this extension setting,
  exported cracks appear dim inside Three.js / model-viewer.

EXPERT GOTCHAS
  - DISTANCE_TO_EDGE vs F1: mixing these up gives a material where the flat
    plate surfaces glow and the cracks are dark — visually nonsensical.
    Mnemonic: "edge = crack, centre = plate."
  - EEVEE Next displacement: the Material Properties ▸ Settings ▸ Surface ▸
    Displacement dropdown MUST be set to "Displacement and Bump".  Setting only
    the Displacement node without flipping this enum leaves the mesh flat —
    no error, no feedback, just no displacement.  This is different from Cycles
    where the Experimental feature set enables subdivision displacement via a
    separate checkbox.
  - Bloom in EEVEE Next: Render Properties ▸ Effects ▸ Bloom (was previously
    a Compositor post-process in Blender 3.x; in 4.x+ it moved to a real-time
    render effect).  If bloom is absent the cracks read as flat painted colour.
  - Subdiv + Displacement: the plane needs enough geometry for the displacement
    to resolve.  A flat Quad with Subdivide × 8 gives 65 536 faces; that is the
    minimum for crack grooves to read at camera distance 3 m.  Higher counts
    improve the edge profile but dramatically slow viewport redraw.
  - Driver expression: bpy.context.scene.frame_current is not accessible inside
    a driver — use the built-in `frame` variable which the driver evaluator
    binds automatically.  Expression: `frame * 0.003` gives ~1 Blender unit of
    scroll over 333 frames (≈ 14 s at 24 fps).

OUTSIDE SOURCES
  Blender Manual — Voronoi Texture Node
    https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/voronoi.html
    CC-BY-SA-4.0 · Blender Foundation
  Khronos glTF 2.0 — KHR_materials_emissive_strength Extension Specification
    https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength
    Apache-2.0 · Khronos Group
  Blender glTF I/O Add-on (bundled, Apache-2.0)
    https://github.com/KhronosGroup/glTF-Blender-IO
    Julien Duroure et al. — KHR_materials_emissive_strength is auto-applied
    when Emission Strength > 1.0 in Principled BSDF or Emission node.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
PLANE_SIZE        = 4.0          # world-space width of the lava plane
SUBDIV_CUTS       = 8            # number of Subdivide passes (2^8 = 256 verts/side)
VORONOI_SCALE     = 5.0          # cell density — higher = more cracks, smaller plates
VORONOI_RANDOMNESS = 0.75        # cell irregularity; 1.0 = chaotic, 0 = grid
CRACK_WIDTH       = 0.08         # ColorRamp stop controlling crack width
DISPLACEMENT_SCALE = 0.12        # height of lava plates above crack grooves (m)
EMISSION_STRENGTH = 6.0          # crack glow intensity (>1.0 triggers EEVEE bloom)
SCROLL_SPEED      = 0.003        # Blender units of Y-scroll per frame
CAMERA_HEIGHT     = 3.0          # camera rig Z for viewport framing
ANIM_FRAMES       = 120          # 5 s at 24 fps for record.py

OUTPUT_BLEND = "//lava_magma_flow.blend"
OUTPUT_GLB   = "//lava_magma_flow.glb"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for item in list(pool):
            pool.remove(item)


def make_lava_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("lava_magma_flow")
    mat.use_nodes = True
    mat.displacement_method = 'DISPLACEMENT'   # EEVEE + Cycles: Displacement and Bump

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    def n(type_name: str, x: float, y: float) -> bpy.types.Node:
        nd = nodes.new(type_name)
        nd.location = (x, y)
        return nd

    # Output
    out = n('ShaderNodeOutputMaterial', 700, 0)

    # ── Coordinate animation ───────────────────────────────────────────────
    tex_coord = n('ShaderNodeTexCoord', -1000, 100)
    mapping   = n('ShaderNodeMapping',  -800, 100)
    mapping.name = "lava_flow_mapping"
    # Driver on Y location for scroll animation
    driver = mapping.inputs['Location'].driver_add('default_value', 1)
    driver.driver.expression = f"frame * {SCROLL_SPEED}"

    # ── Voronoi A — crack network (DISTANCE_TO_EDGE) ───────────────────────
    vor_edge = n('ShaderNodeTexVoronoi', -560, 200)
    vor_edge.voronoi_dimensions = '3D'
    vor_edge.feature             = 'DISTANCE_TO_EDGE'
    vor_edge.inputs['Scale'].default_value      = VORONOI_SCALE
    vor_edge.inputs['Randomness'].default_value = VORONOI_RANDOMNESS

    # Invert distance-to-edge so cracks are bright (value near 1)
    invert_crack = n('ShaderNodeMath', -320, 280)
    invert_crack.operation = 'SUBTRACT'
    invert_crack.inputs[0].default_value = 1.0

    # Crack mask ramp: narrow bright band at edges, wide dark background
    crack_ramp = n('ShaderNodeValToRGB', -120, 280)
    crack_ramp.color_ramp.interpolation = 'EASE'
    cr_stops = crack_ramp.color_ramp.elements
    cr_stops[0].position = 0.0;  cr_stops[0].color = (0, 0, 0, 1)
    cr_stops.new(CRACK_WIDTH);   cr_stops[1].color = (0, 0, 0, 1)
    crack_ramp.color_ramp.elements.new(CRACK_WIDTH + 0.04)
    crack_ramp.color_ramp.elements[-1].color = (1, 1, 1, 1)
    # stop at 1.0 default white — leave untouched

    # ── Voronoi B — plate centres (F1) ────────────────────────────────────
    vor_f1 = n('ShaderNodeTexVoronoi', -560, -100)
    vor_f1.voronoi_dimensions = '3D'
    vor_f1.feature             = 'F1'
    vor_f1.inputs['Scale'].default_value      = VORONOI_SCALE
    vor_f1.inputs['Randomness'].default_value = VORONOI_RANDOMNESS

    # Plate colour ramp: hot orange centre → cooling dark red → black crust edge
    plate_ramp = n('ShaderNodeValToRGB', -320, -100)
    plate_ramp.color_ramp.interpolation = 'B_SPLINE'
    pr_stops = plate_ramp.color_ramp.elements
    pr_stops[0].position = 0.0;  pr_stops[0].color = (1.0, 0.38, 0.02, 1)  # hot orange
    plate_ramp.color_ramp.elements.new(0.45);
    plate_ramp.color_ramp.elements[1].color = (0.55, 0.04, 0.01, 1)         # deep red
    pr_stops[1].position = 0.75; pr_stops[1].color = (0.08, 0.01, 0.0,  1)  # dark crust
    pr_stops.new(1.0) if len(pr_stops) < 3 else None

    # ── Principled BSDF — lava plate surface ──────────────────────────────
    principled = n('ShaderNodeBsdfPrincipled', 200, -100)
    principled.inputs['Roughness'].default_value         = 0.90  # matte cooled crust
    principled.inputs['Specular IOR Level'].default_value = 0.08  # low gloss
    # Subsurface for interior heat glow bleed
    principled.inputs['Subsurface Weight'].default_value  = 0.06
    principled.inputs['Subsurface Radius'].default_value  = (0.8, 0.15, 0.05)
    principled.inputs['Subsurface Scale'].default_value   = 0.04

    # ── Emission — crack glow ─────────────────────────────────────────────
    emission = n('ShaderNodeEmission', 200, 200)
    emission.inputs['Color'].default_value    = (1.0, 0.72, 0.10, 1)  # hot yellow
    emission.inputs['Strength'].default_value = EMISSION_STRENGTH

    # Mix shader: crack_mask drives emission vs principled
    mix = n('ShaderNodeMixShader', 460, 100)

    # ── Displacement ──────────────────────────────────────────────────────
    # F1 distance is 0 at plate centres → elevate centres; invert for correct geometry
    invert_disp = n('ShaderNodeMath', -120, -300)
    invert_disp.operation = 'SUBTRACT'
    invert_disp.inputs[0].default_value = 1.0

    displace_node = n('ShaderNodeDisplacement', 200, -300)
    displace_node.space = 'WORLD'
    displace_node.inputs['Scale'].default_value   = DISPLACEMENT_SCALE
    displace_node.inputs['Midlevel'].default_value = 0.0

    # ── Link everything ───────────────────────────────────────────────────
    links.new(tex_coord.outputs['Generated'], mapping.inputs['Vector'])

    links.new(mapping.outputs['Vector'], vor_edge.inputs['Vector'])
    links.new(mapping.outputs['Vector'], vor_f1.inputs['Vector'])

    links.new(vor_edge.outputs['Distance'], invert_crack.inputs[1])
    links.new(invert_crack.outputs['Value'], crack_ramp.inputs['Fac'])

    links.new(vor_f1.outputs['Distance'], plate_ramp.inputs['Fac'])
    links.new(plate_ramp.outputs['Color'], principled.inputs['Base Color'])
    links.new(plate_ramp.outputs['Color'], principled.inputs['Subsurface Color'])

    links.new(crack_ramp.outputs['Color'], emission.inputs['Color'])
    links.new(crack_ramp.outputs['Fac'],   mix.inputs['Fac'])
    links.new(principled.outputs['BSDF'], mix.inputs[1])
    links.new(emission.outputs['Emission'], mix.inputs[2])
    links.new(mix.outputs['Shader'], out.inputs['Surface'])

    links.new(vor_f1.outputs['Distance'], invert_disp.inputs[1])
    links.new(invert_disp.outputs['Value'], displace_node.inputs['Height'])
    links.new(displace_node.outputs['Displacement'], out.inputs['Displacement'])

    return mat


def make_lava_plane(mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=PLANE_SIZE, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "lava_plane"

    # Subdivide to give displacement enough geometry
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=2**SUBDIV_CUTS // 16)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Use Subdivision Surface modifier for adaptive density instead of brute force
    sub = obj.modifiers.new("SubSurf", 'SUBSURF')
    sub.levels          = 4
    sub.render_levels   = 6
    sub.subdivision_type = 'SIMPLE'   # preserve flat layout; displacement does the shaping

    obj.data.materials.append(mat)
    return obj


def setup_render_and_world() -> None:
    scene = bpy.context.scene
    scene.render.engine              = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.fps                  = 24
    scene.frame_start                 = 1
    scene.frame_end                   = ANIM_FRAMES

    # EEVEE Next: Bloom for crack halation
    eevee = scene.eevee
    eevee.use_bloom   = True
    eevee.bloom_threshold = 1.0
    eevee.bloom_intensity = 0.25
    eevee.bloom_radius    = 4.0

    # Dark world — lava is self-illuminating, ambient sky would wash out glow
    world = bpy.data.worlds.new("dark_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value   = (0.01, 0.005, 0.0, 1)
        bg.inputs['Strength'].default_value = 0.05

    # Camera overhead + slight angle for drama
    bpy.ops.object.camera_add(location=(0, -2.0, CAMERA_HEIGHT),
                               rotation=(math.radians(55), 0, 0))
    cam = bpy.context.active_object
    cam.name = "render_cam"
    scene.camera = cam

    # Key light: warm area lamp from above to rim-light raised plate edges
    bpy.ops.object.light_add(type='AREA', location=(1.5, -1.0, 3.0))
    light = bpy.context.active_object
    light.name = "key_light"
    light.data.energy = 120
    light.data.color  = (1.0, 0.55, 0.2)
    light.data.size   = 1.5
    light.rotation_euler = (math.radians(30), math.radians(20), 0)


def export_files() -> None:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

    bpy.ops.export_scene.gltf(
        filepath    = bpy.path.abspath(OUTPUT_GLB),
        export_format = 'GLB',
        export_apply  = True,
        export_animations = False,     # static snapshot; animation baked to frames
        export_image_format = 'WEBP',  # studio standard
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
    )


if __name__ == "__main__":
    clear_scene()
    mat   = make_lava_material()
    plane = make_lava_plane(mat)
    setup_render_and_world()
    export_files()
    print("lava_magma_flow: blueprint complete — blend + glb written.")
