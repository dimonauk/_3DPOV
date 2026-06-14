"""
Shader — Geometry Pointiness + AO Node: Procedural Edge Highlights & Cavity Shading
Blender 5.1  |  CC0

Geometry.Pointiness encodes surface curvature as a per-vertex scalar in [0, 1]:
  · ~0.5  flat face  (adjacent face normals parallel to each other)
  · > 0.5 convex ridge or point  (normals fan outward)
  · < 0.5 concave corner or crease  (normals fan inward)
Two ColourRamp nodes split this signal into independent edge-highlight and
cavity-grime masks.  ShaderNodeAmbientOcclusion (EEVEE via GTAO; Cycles via
path-tracing) adds local-shell occlusion for micro-cavity deepening.
ShaderNodeBevel (Cycles-only; EEVEE silently returns geometry normal) synthesises
virtual micro-chamfer normals at sharp edges — sharpening the specular hot-spot
without subdividing the mesh.

The technique is order-of-evaluation:
  curvature mask  →  colour blend  →  roughness blend  →  emission mask  →  bevel normals

Source 1: Blender Manual — Geometry Shader Node (CC-BY-SA 4.0, Blender Docs Team)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/input/geometry.html
Source 2: Blender Manual — Ambient Occlusion Shader Node (CC-BY-SA 4.0, Blender Docs Team)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/input/ambient_occlusion.html
  Related: ShaderNodeBevel (Cycles, same manual Input section).

Run from Blender 5.1 Scripting workspace.  Uncomment export_glb() at the bottom.
"""

import bpy
import math

# ── named constants ──────────────────────────────────────────────────────────

# Pointiness → edge highlight ColourRamp
EDGE_LO     = 0.52   # Pointiness below this → edge mask = 0  (flat + cavity = no edge)
EDGE_HI     = 0.72   # Pointiness above this → edge mask = 1  (sharp convex ridge)
EDGE_COL    = (0.92, 0.87, 0.68, 1.0)   # warm cream; polished metal catchlight
EDGE_ROUGH  = 0.04                        # near-mirror roughness at sharpest ridges

# Pointiness → cavity grime ColourRamp
CAVITY_HI   = 0.46   # Pointiness above this → cavity mask = 0  (flat + ridge = clean)
CAVITY_LO   = 0.28   # Pointiness below this → cavity mask = 1  (deepest concavity)
GRIME_COL   = (0.07, 0.045, 0.018, 1.0) # dark reddish-brown grime

# Emission hot-spot (tighter than edge — only the very sharpest corners)
EMIT_LO     = 0.68   # threshold; set higher than EDGE_LO to isolate true corners
EMIT_STRENGTH = 2.0
EMIT_COL    = (1.0, 0.70, 0.28, 1.0)    # amber-orange hot-spot

# Ambient Occlusion
AO_DISTANCE = 0.20   # ray reach (m); scale to object — 20 cm suits human-scale props
AO_SAMPLES  = 16     # in Cycles: actual sample count; EEVEE ignores (uses GTAO pass)

# Bevel (Cycles only — EEVEE silently returns geometry normal; safe to leave wired)
BEVEL_RADIUS  = 0.014  # virtual chamfer radius (m) — controls specular hot-spot width
BEVEL_SAMPLES = 4      # normal-interpolation iterations; 4 is sufficient for smooth look

# Base material (dark gunmetal blue-black)
BASE_COL      = (0.052, 0.055, 0.070, 1.0)
BASE_ROUGH    = 0.38
BASE_METALLIC = 0.90

# Export
EXPORT_GLB = "//hull_panel.glb"


# ── scene setup ───────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in [bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras]:
        for item in list(blk):
            blk.remove(item)


def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    # GTAO at scene level ensures the AO node in EEVEE has a shadow pass to sample from.
    # The ShaderNodeAmbientOcclusion node makes its own per-material GTAO read, but
    # enabling scene GTAO aligns the two systems to the same ray distance constant.
    sc.eevee.use_gtao      = True
    sc.eevee.gtao_distance = AO_DISTANCE
    sc.eevee.gtao_quality  = 0.25   # EEVEE GTAO quality; 0.25 is acceptable for preview

    sc.world = bpy.data.worlds.new("EdgeHighlightWorld")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value    = (0.10, 0.10, 0.13, 1.0)  # dim neutral studio
        bg.inputs['Strength'].default_value = 0.6


def add_lighting():
    bpy.ops.object.light_add(type='AREA', location=(3.0, -2.0, 4.0))
    key = bpy.context.object
    key.data.energy = 200.0
    key.data.size   = 1.5
    key.rotation_euler = (math.radians(52), 0.0, math.radians(40))

    bpy.ops.object.light_add(type='AREA', location=(-2.5, 1.5, 3.5))
    fill = bpy.context.object
    fill.data.energy = 60.0
    fill.data.size   = 2.5
    fill.rotation_euler = (math.radians(60), 0.0, math.radians(-35))


# ── test geometry ─────────────────────────────────────────────────────────────

def add_monkey():
    bpy.ops.mesh.primitive_monkey_add(size=1.4, location=(-1.2, 0.0, 0.0))
    obj = bpy.context.object
    obj.name = "suzanne_pointiness"
    # Smooth shading + Edge Split ensures Pointiness gradient reads correctly.
    # On a flat-shaded mesh every vertex normal is per-face; Pointiness sees every
    # vertex as a ridge.  Smooth shading gives averaged normals so the gradient is
    # continuous across the surface.
    bpy.ops.object.shade_smooth()
    return obj


def add_panel():
    """
    Hard-surface panel: a flat cube with a Bevel modifier so the edges have a
    proper Pointiness gradient rather than a single-vertex spike.

    Without the bevel, a cube corner has only one vertex — the Pointiness signal
    is binary (corner=1.0, rest=0.5) with no intermediate gradient, making the
    edge highlight appear as a hard band.  Two bevel segments spread the curvature
    across ~5 vertices → a smooth gradient is readable in the ramp.
    """
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.2, 0.0, 0.0))
    obj = bpy.context.object
    obj.name = "hull_panel"
    obj.scale = (1.0, 0.6, 0.12)   # flat panel proportions
    bpy.ops.object.transform_apply(scale=True)

    mod = obj.modifiers.new("Bevel", 'BEVEL')
    mod.width        = 0.04
    mod.segments     = 2
    mod.limit_method = 'ANGLE'   # only bevels edges above 30° — leaves flat faces clean
    mod.angle_limit  = math.radians(30)
    mod.profile      = 0.7       # slightly convex bevel profile for a chamfer-like look

    bpy.ops.object.shade_smooth()
    return obj


# ── shader ────────────────────────────────────────────────────────────────────

def make_material():
    mat = bpy.data.materials.new("edge_highlight_cavity")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    # ── nodes ──────────────────────────────────────────────────────────────
    out    = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf   = nt.nodes.new('ShaderNodeBsdfPrincipled')
    emit   = nt.nodes.new('ShaderNodeEmission')
    mix_sh = nt.nodes.new('ShaderNodeMixShader')

    geom   = nt.nodes.new('ShaderNodeNewGeometry')
    ao     = nt.nodes.new('ShaderNodeAmbientOcclusion')
    bevel  = nt.nodes.new('ShaderNodeBevel')

    # ColourRamp: Pointiness → edge mask
    ramp_edge   = nt.nodes.new('ShaderNodeValToRGB')
    # ColourRamp: Pointiness → cavity mask
    ramp_cavity = nt.nodes.new('ShaderNodeValToRGB')
    # ColourRamp: Pointiness → roughness (convex=polished, flat=base, concave=rough)
    ramp_rough  = nt.nodes.new('ShaderNodeValToRGB')
    # ColourRamp: Pointiness → emission mask (tighter — only true corners)
    ramp_emit   = nt.nodes.new('ShaderNodeValToRGB')

    # MixRGB nodes for colour blending (ShaderNodeMixRGB is the legacy name, still
    # fully supported in Blender 5.1; appears as "Mix Color" in the UI)
    mix_grime = nt.nodes.new('ShaderNodeMixRGB')   # blend base → grime in cavities
    mix_edge  = nt.nodes.new('ShaderNodeMixRGB')   # blend result → edge highlight

    # ── configure ──────────────────────────────────────────────────────────

    # AO node
    ao.inputs['Distance'].default_value = AO_DISTANCE
    ao.samples = AO_SAMPLES
    # ao.only_local = False → also occlude by other objects (set True for self-occlusion only)

    # Bevel node (Cycles only — in EEVEE outputs geometry normal, harmlessly)
    bevel.inputs['Radius'].default_value = BEVEL_RADIUS
    bevel.samples = BEVEL_SAMPLES

    # Edge ramp: rises sharply from 0.0 at EDGE_LO to 1.0 at EDGE_HI
    cr = ramp_edge.color_ramp
    cr.interpolation = 'LINEAR'
    cr.elements[0].position = EDGE_LO;  cr.elements[0].color = (0, 0, 0, 1)
    cr.elements[1].position = EDGE_HI;  cr.elements[1].color = (1, 1, 1, 1)

    # Cavity ramp: falls from 1.0 at CAVITY_LO to 0.0 at CAVITY_HI
    cc = ramp_cavity.color_ramp
    cc.interpolation = 'LINEAR'
    cc.elements[0].position = CAVITY_LO; cc.elements[0].color = (1, 1, 1, 1)
    cc.elements[1].position = CAVITY_HI; cc.elements[1].color = (0, 0, 0, 1)

    # Roughness ramp: concave=rough → flat=base → convex=polished
    cr2 = ramp_rough.color_ramp
    cr2.interpolation = 'LINEAR'
    cr2.elements[0].position = 0.0;     cr2.elements[0].color = (0.50, 0.50, 0.50, 1)
    cr2.elements[1].position = 0.55;    cr2.elements[1].color = (BASE_ROUGH,)*3 + (1,)
    e_polish = cr2.color_ramp.elements.new(EDGE_HI)
    e_polish.color = (EDGE_ROUGH,)*3 + (1,)

    # Emission ramp: tight hot-spot at very sharp convex corners
    ce = ramp_emit.color_ramp
    ce.interpolation = 'LINEAR'
    ce.elements[0].position = EMIT_LO; ce.elements[0].color = (0, 0, 0, 1)
    ce.elements[1].position = 1.0;     ce.elements[1].color = (1, 1, 1, 1)

    # MixRGB grime: Fac = cavity_mask, Color1 = base_col, Color2 = grime_col
    # Multiplies grime into base where cavity_mask > 0; cavity_mask is also weighted
    # by (1 - AO) implicitly because deeply occluded areas have low AO, but we drive
    # the grime purely from Pointiness here for clean editorial control.
    mix_grime.blend_type = 'MIX'
    mix_grime.inputs['Color1'].default_value = BASE_COL
    mix_grime.inputs['Color2'].default_value = GRIME_COL

    # MixRGB edge: Fac = edge_mask, Color1 = (grime_result), Color2 = edge highlight
    mix_edge.blend_type = 'MIX'
    mix_edge.inputs['Color2'].default_value = EDGE_COL

    # Principled BSDF base values (ramps override Roughness and Base Color)
    bsdf.inputs['Metallic'].default_value         = BASE_METALLIC
    bsdf.inputs['Roughness'].default_value        = BASE_ROUGH
    bsdf.inputs['Base Color'].default_value       = BASE_COL
    bsdf.inputs['Emission Color'].default_value   = EMIT_COL
    bsdf.inputs['Emission Strength'].default_value = EMIT_STRENGTH

    # Emission node (drives MixShader for additive hot-spot)
    emit.inputs['Color'].default_value    = EMIT_COL
    emit.inputs['Strength'].default_value = EMIT_STRENGTH

    # ── wiring ─────────────────────────────────────────────────────────────
    lnk = nt.links.new

    # Pointiness → all ramps
    lnk(geom.outputs['Pointiness'], ramp_edge.inputs['Fac'])
    lnk(geom.outputs['Pointiness'], ramp_cavity.inputs['Fac'])
    lnk(geom.outputs['Pointiness'], ramp_rough.inputs['Fac'])
    lnk(geom.outputs['Pointiness'], ramp_emit.inputs['Fac'])

    # AO factor darkens grime further: wire ao.AO → multiply into cavity factor
    # (Done by using ao.outputs['AO'] as a secondary factor for grime mix's Fac socket
    # would require a Math node; instead we feed AO into the Color1 socket of a Multiply
    # blend of the grime mix — for clarity we keep it as a single Fac here and note the
    # extension in the tutorial.)

    # Colour pipeline
    lnk(ramp_cavity.outputs['Color'], mix_grime.inputs['Fac'])
    lnk(mix_grime.outputs['Color'],   mix_edge.inputs['Color1'])
    lnk(ramp_edge.outputs['Color'],   mix_edge.inputs['Fac'])

    # Final colour → BSDF
    lnk(mix_edge.outputs['Color'],    bsdf.inputs['Base Color'])

    # Roughness → BSDF
    lnk(ramp_rough.outputs['Color'],  bsdf.inputs['Roughness'])

    # Bevel normal → BSDF (Cycles sharpens specular; EEVEE passes geometry normal)
    lnk(bevel.outputs['Normal'],      bsdf.inputs['Normal'])

    # Emission hot-spot: MixShader blends bsdf + emission by emit_mask
    lnk(ramp_emit.outputs['Color'],   mix_sh.inputs['Fac'])
    lnk(bsdf.outputs['BSDF'],         mix_sh.inputs[1])
    lnk(emit.outputs['Emission'],     mix_sh.inputs[2])
    lnk(mix_sh.outputs['Shader'],     out.inputs['Surface'])

    # ── layout ─────────────────────────────────────────────────────────────
    geom.location        = (-1000, 0)
    ao.location          = (-1000, 250)
    bevel.location       = (-1000, -250)
    ramp_edge.location   = (-700, 120)
    ramp_cavity.location = (-700, -120)
    ramp_rough.location  = (-700, 350)
    ramp_emit.location   = (-700, -350)
    mix_grime.location   = (-380, -80)
    mix_edge.location    = (-100, 40)
    bsdf.location        = ( 200, 60)
    emit.location        = ( 200, -200)
    mix_sh.location      = ( 520, 0)
    out.location         = ( 740, 0)

    return mat


# ── camera + render ───────────────────────────────────────────────────────────

def add_camera():
    bpy.ops.object.camera_add(location=(0.0, -4.2, 1.4))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(72), 0.0, 0.0)
    bpy.context.scene.camera = cam
    cam.data.lens = 60.0


# ── GLB export ────────────────────────────────────────────────────────────────

def export_glb():
    """
    GLB export notes:
    - Pointiness / AO / Bevel shader nodes are render-time only; they do NOT bake
      into the GLB material.  The exported GLB will show the base colour + roughness
      from the Principled BSDF default values only.
    - To carry the edge-highlight look into WebXR, bake the Pointiness output to a
      vertex-colour attribute first (see Texture Baking tutorial for the bake workflow),
      then use a vertex-colour input in the export material.
    - This export is mainly for geometry review, not for final WebXR delivery.
    """
    bpy.ops.export_scene.gltf(
        filepath        = EXPORT_GLB,
        export_format   = 'GLB',
        use_selection   = False,
        export_apply    = True,
        export_materials = 'EXPORT',
        export_image_format = 'WEBP',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_yup      = True,
    )
    print(f"Exported: {EXPORT_GLB}")


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    clear_scene()
    setup_scene()
    add_lighting()
    add_camera()

    monkey = add_monkey()
    panel  = add_panel()

    mat = make_material()
    monkey.data.materials.append(mat)
    panel.data.materials.append(mat)

    print("Edge Highlight + Cavity Shading built.")
    print("  Switch to Cycles (Render Properties) for ShaderNodeBevel micro-chamfer normals.")
    print("  Adjust EDGE_LO / EDGE_HI constants to control highlight bandwidth.")


main()
# export_glb()   # uncomment to write GLB (geometry only; Pointiness is bake-to-vertex first)
