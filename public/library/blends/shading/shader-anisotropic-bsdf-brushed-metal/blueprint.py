"""
Shader — Anisotropic BSDF: Brushed Metal & Circular-Titanium Disc
Blender 5.1  |  CC0

ShaderNodeBsdfAnisotropic models directional micro-surface scratch patterns —
the visual signature of brushed metal.  The GGX micro-facet NDF is stretched along
a tangent axis so the specular highlight elongates perpendicular to the scratch
direction.  A Noise Texture adds micro-roughness variation that mimics the slight
pitch irregularity of hand-drawn brushing passes.

Two objects show the canonical tangent sources:
  · linear_panel  — ShaderNodeTangent(UV_MAP): U axis aligns with brush strokes
  · circular_disc — ShaderNodeTangent(RADIAL / Z): highlight orbits the disc centre

The highlight direction is: PERPENDICULAR TO THE TANGENT.
(tangent = scratch direction; highlight stretches across the scratches)

Sources:
  1. Blender Manual — Anisotropic BSDF (CC-BY-SA 4.0, Blender Docs Team)
     https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/anisotropic.html
  2. KHR_materials_anisotropy glTF extension (Apache-2.0, Khronos Group)
     https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_anisotropy/README.md

Run from Blender 5.1 Scripting workspace (Text Editor → Run Script).
"""

import bpy
import math

# ── named constants ──────────────────────────────────────────────────────────

# Anisotropic BSDF core parameters
ANISO_ROUGHNESS   = 0.14   # base roughness; GGX stretches this along the tangent plane
ANISO_AMOUNT      = 0.88   # [0, 1]: 0 = round highlight, 1 = maximum streak
DISTRIBUTION      = 'GGX'  # 'GGX' | 'MULTI_GGX' | 'BECKMANN'; GGX for sharp metal peaks

# Tint per object (Anisotropic BSDF Color = diffuse + specular rolled in, no Metallic socket)
TINT_LINEAR   = (0.62, 0.64, 0.68, 1.0)  # cold blue-grey: brushed steel / titanium
TINT_CIRCULAR = (0.78, 0.72, 0.58, 1.0)  # warm champagne: machined brass disc

# Noise micro-variation layer (texture coordinates: Object space)
NOISE_SCALE      = 85.0   # high scale → tight banding ≈ individual scratch pitch
NOISE_ROUGH_GAIN = 0.06   # additive roughness perturbation: keeps highlight organic

# Geometry
PANEL_SCALE  = (2.0, 0.8, 0.06)   # rectangular panel (W × D × H m)
DISC_RADIUS  = 0.60               # disc radius (m)
DISC_SEGS    = 64                 # circumference vertex count — even-number for seam symmetry

# Lighting
KEY_ENERGY   = 300.0     # area key: bright directional source needed to show the streak
FILL_ENERGY  = 50.0

# Render + export
RENDER_ENGINE   = 'BLENDER_EEVEE_NEXT'
EXPORT_GLB      = "//anisotropic_brushed_metal.glb"


# ── helpers ───────────────────────────────────────────────────────────────────

def lnk(nt, a, b):
    nt.links.new(a, b)


# ── scene ─────────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials,
                bpy.data.lights, bpy.data.cameras):
        for item in list(blk):
            blk.remove(item)


def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = RENDER_ENGINE
    # EEVEE Next screen-space reflections are required for the anisotropic highlight
    # to be visible in the viewport at render quality; without SSR the highlight is
    # approximated as a blurred sphere and the streak is not apparent.
    sc.eevee.use_raytracing = True
    sc.eevee.ray_tracing_options.use_denoise = True
    sc.world = bpy.data.worlds.new("AnisoBrushedWorld")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value    = (0.08, 0.08, 0.10, 1.0)
        bg.inputs['Strength'].default_value = 0.4


def add_lighting():
    # Key light: narrow area, positioned to graze the panel at ~30° — the low angle
    # is deliberate.  Anisotropic highlights are brightest when the light direction
    # falls roughly along the scratch tangent; grazing incidence maximises the streak.
    bpy.ops.object.light_add(type='AREA', location=(3.5, -1.5, 2.5))
    key = bpy.context.object
    key.name = "key_light"
    key.data.energy = KEY_ENERGY
    key.data.size   = 0.6   # compact source → sharper highlight edge
    key.rotation_euler = (math.radians(55), 0.0, math.radians(42))

    # Fill: wide, soft — reveals the object shape without competing with the streak
    bpy.ops.object.light_add(type='AREA', location=(-2.5, 2.0, 3.0))
    fill = bpy.context.object
    fill.name = "fill_light"
    fill.data.energy = FILL_ENERGY
    fill.data.size   = 3.0
    fill.rotation_euler = (math.radians(65), 0.0, math.radians(-30))


# ── geometry ──────────────────────────────────────────────────────────────────

def add_linear_panel():
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.3, 0.0, 0.0))
    obj = bpy.context.object
    obj.name = "linear_panel"
    obj.scale = PANEL_SCALE
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()

    # UV-unwrap with Smart Project so U runs along the long (X) axis — this is the
    # UV_MAP tangent reference for the linear brush direction.
    bpy.ops.object.editmode_toggle()
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66)
    bpy.ops.object.editmode_toggle()
    return obj


def add_circular_disc():
    # Cylinder with height=0 gives a flat disc; DISC_SEGS ensures smooth circumference.
    # The Radial Tangent node (Z axis) naturally wraps around a cylinder — the
    # tangent at every surface point is the local circumferential direction.
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=DISC_SEGS, radius=DISC_RADIUS,
        depth=0.04, location=(1.3, 0.0, 0.0)
    )
    obj = bpy.context.object
    obj.name = "circular_disc"
    bpy.ops.object.shade_smooth()
    return obj


# ── material ──────────────────────────────────────────────────────────────────

def make_brushed_mat(name, tint, circular=False):
    """
    Build an Anisotropic BSDF material with explicit Tangent control.

    circular=False → Tangent from UV_MAP (linear brush direction follows U axis)
    circular=True  → Tangent from RADIAL/Z  (concentric ring highlight)

    Node pipeline:
      Object TexCoord → Noise (micro-roughness) → ADD → Aniso.Roughness
      Tangent (RADIAL or UV_MAP) → Aniso.Tangent
      Aniso BSDF → Output
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    # Core nodes
    out    = nt.nodes.new('ShaderNodeOutputMaterial')
    aniso  = nt.nodes.new('ShaderNodeBsdfAnisotropic')
    coord  = nt.nodes.new('ShaderNodeTexCoord')
    noise  = nt.nodes.new('ShaderNodeTexNoise')
    mul    = nt.nodes.new('ShaderNodeMath')   # noise Fac × NOISE_ROUGH_GAIN
    add    = nt.nodes.new('ShaderNodeMath')   # result + ANISO_ROUGHNESS
    tang   = nt.nodes.new('ShaderNodeTangent')

    # Anisotropic BSDF setup
    aniso.distribution = DISTRIBUTION
    aniso.inputs['Color'].default_value      = tint
    aniso.inputs['Roughness'].default_value  = ANISO_ROUGHNESS
    aniso.inputs['Anisotropy'].default_value = ANISO_AMOUNT
    aniso.inputs['Rotation'].default_value   = 0.0

    # Tangent source: RADIAL wraps around Z (ideal for discs); UV_MAP uses first UV
    if circular:
        tang.direction_type = 'RADIAL'
        tang.axis           = 'Z'
    else:
        tang.direction_type = 'UV_MAP'
        tang.uv_map         = 'UVMap'

    # Noise micro-roughness: Object-space coordinates give scale-independent scratch bands
    noise.noise_dimensions = '3D'
    noise.inputs['Scale'].default_value      = NOISE_SCALE
    noise.inputs['Detail'].default_value     = 0.0   # no detail octaves — single-frequency bands
    noise.inputs['Roughness'].default_value  = 0.0   # flat bands, not fractal
    noise.inputs['Distortion'].default_value = 0.1   # slight warp → irregular scratch spacing

    # Math: scale noise to small perturbation
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = NOISE_ROUGH_GAIN

    # Math: add perturbation to base roughness
    add.operation = 'ADD'
    add.inputs[1].default_value = ANISO_ROUGHNESS

    # Wiring
    lnk(nt, coord.outputs['Object'],  noise.inputs['Vector'])
    lnk(nt, noise.outputs['Fac'],     mul.inputs[0])
    lnk(nt, mul.outputs['Value'],     add.inputs[0])
    lnk(nt, add.outputs['Value'],     aniso.inputs['Roughness'])
    lnk(nt, tang.outputs['Tangent'],  aniso.inputs['Tangent'])
    lnk(nt, aniso.outputs['BSDF'],    out.inputs['Surface'])

    # Layout (left → right in Shader Editor)
    coord.location = (-700, 0)
    noise.location = (-500, 0)
    mul.location   = (-260, 0)
    add.location   = (-60, 0)
    tang.location  = (-300, -180)
    aniso.location = ( 160, 0)
    out.location   = ( 420, 0)

    return mat


# ── camera + export ───────────────────────────────────────────────────────────

def add_camera():
    bpy.ops.object.camera_add(location=(0.0, -4.8, 1.8))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(68), 0.0, 0.0)
    bpy.context.scene.camera = cam
    cam.data.lens = 55.0


def export_glb():
    """
    Export note: ShaderNodeBsdfAnisotropic does NOT map to KHR_materials_anisotropy
    automatically.  The exporter recognises Principled BSDF's Anisotropic parameter only.
    For WebXR delivery with authentic anisotropy, convert to Principled BSDF and set its
    Anisotropic + Anisotropic Rotation sockets; the glTF exporter then writes
    KHR_materials_anisotropy.  Alternatively bake the material to a BaseColor + ORM texture.
    """
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
    )
    print(f"Exported: {EXPORT_GLB}")


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    clear_scene()
    setup_scene()
    add_lighting()
    add_camera()

    panel = add_linear_panel()
    disc  = add_circular_disc()

    mat_linear   = make_brushed_mat("brushed_linear",   TINT_LINEAR,   circular=False)
    mat_circular = make_brushed_mat("brushed_circular",  TINT_CIRCULAR, circular=True)

    panel.data.materials.append(mat_linear)
    disc.data.materials.append(mat_circular)

    print("Anisotropic brushed metal scene built.")
    print("  Switch render engine to Cycles for the most accurate highlight shape.")
    print("  In EEVEE Next, enable Screen-Space Reflections to see the streak.")
    print("  Orbit the viewport: the highlight sweeps parallel to the panel surface")
    print("  on the panel, and traces a ring on the disc.")


main()
# export_glb()  # uncomment to write GLB; see docstring for KHR_materials_anisotropy note
