"""
blueprint.py — EEVEE Next Volumetric Light Cone + Bloom
Blender 5.1 · CC0 · Holoflow Studio

Builds a dark interior scene with two crossing spot lights (warm amber + cool
teal) scattering through a Principled Volume World.  Demonstrates EEVEE Next's
voxel-grid frustum volumetric sampler and Bloom post-process.  A secondary
transparent emission-cone mesh provides a GLB-exportable fake beam for WebXR
targets where GPU volumetrics cannot transfer.

Key insight — Anisotropy encodes Mie forward scatter:
  0.0 = isotropic (equal scatter in all directions, hazy fog)
  0.6 = moderate forward bias (dust, thin mist — beam visible from camera)
  0.9 = strong forward bias (deep smoke — requires looking into the light)
  Use 0.55–0.65 for the 'visible beam from any angle' studio look.

Requires: Blender 5.1 (BLENDER_EEVEE_NEXT engine).
"""

import bpy
import bmesh
from math import radians, tan, cos, sin, pi
from mathutils import Vector

# ── parameters ───────────────────────────────────────────────────────────────
WORLD_DENSITY    = 0.042          # Principled Volume scatter density (dust level)
WORLD_ANISO      = 0.60           # Mie forward-scatter bias
WORLD_SCATTER    = (0.80, 0.88, 1.00)  # cool blue-white ambient (studio dust)

SPOT_A_POS       = Vector(( 2.2, -1.0, 4.2))
SPOT_A_TARGET    = Vector((-0.2,  0.2, 0.0))
SPOT_A_COLOUR    = (1.00, 0.60, 0.20)   # warm amber
SPOT_A_ENERGY    = 2800.0
SPOT_A_ANGLE     = radians(28)           # half-angle of cone

SPOT_B_POS       = Vector((-1.8,  1.8, 3.8))
SPOT_B_TARGET    = Vector(( 0.25,-0.15, 0.0))
SPOT_B_COLOUR    = (0.28, 0.68, 1.00)   # cool teal
SPOT_B_ENERGY    = 2200.0
SPOT_B_ANGLE     = radians(22)

CONE_ALPHA       = 0.11           # fake-cone emission opacity for GLB
CONE_SEGS        = 20             # polygon count of fake cone

BLOOM_THRESHOLD  = 0.75
BLOOM_INTENSITY  = 0.065
BLOOM_RADIUS     = 5.5

VOL_START        = 0.1            # m — near clip for volumetric integration
VOL_END          = 18.0           # m — far clip (scene is 8m across)
VOL_TILE         = "2"            # "2"|"4"|"8"|"16" — 2px = highest quality
VOL_SAMPLES      = 64
VOL_SHADOW_SAMP  = 16

OUTPUT_BLEND     = "//volumetric_light_cone.blend"
OUTPUT_GLB       = "//volumetric_light_cone.glb"


# ── helpers ──────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.lights, bpy.data.cameras,
                  bpy.data.materials):
        for item in block:
            block.remove(item)


def add_plane(name, w, d, loc, rot=(0.0, 0.0, 0.0)):
    """Flat quad via data API — no operator context needed."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    hw, hd = w * 0.5, d * 0.5
    vs = [bm.verts.new(v) for v in [(-hw, -hd, 0), (hw, -hd, 0),
                                     (hw,  hd, 0), (-hw,  hd, 0)]]
    bm.faces.new(vs)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    bpy.context.scene.collection.objects.link(obj)
    return obj


def make_material(name, base_col, roughness=0.9, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*base_col, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat


def build_world_volume():
    """Replace the default World with a Principled Volume for atmospheric scatter."""
    world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    bg = nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.005, 0.006, 0.012, 1.0)  # near-black
    bg.inputs['Strength'].default_value = 0.0  # no ambient sky contribution

    vol = nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (*WORLD_SCATTER, 1.0)
    vol.inputs['Density'].default_value = WORLD_DENSITY
    vol.inputs['Anisotropy'].default_value = WORLD_ANISO
    # Absorption colour = scatter colour: neutral dust, not coloured fog

    out = nodes.new('ShaderNodeOutputWorld')
    links.new(bg.outputs['Background'], out.inputs['Surface'])
    links.new(vol.outputs['Volume'], out.inputs['Volume'])


def add_spot_light(name, pos, target, colour, energy, half_angle):
    """Create and aim a spot light via the data API (no operator context needed)."""
    ld = bpy.data.lights.new(name, type='SPOT')
    ld.energy = energy
    ld.color = colour
    ld.spot_size = half_angle * 2.0   # bpy.types.SpotLight.spot_size = FULL angle
    ld.spot_blend = 0.12              # soft falloff at cone edge
    ld.shadow_soft_size = 0.04        # small source → sharp volumetric shadows

    obj = bpy.data.objects.new(name, ld)
    obj.location = pos
    direction = (Vector(target) - pos).normalized()
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(obj)
    return obj


def add_fake_cone(name, apex, target, half_angle, colour, alpha):
    """
    Transparent emission cone for GLB export — fakes the volumetric beam.
    EEVEE Next volumes are GPU-only and don't transfer to glTF.  This mesh
    carries the visual impression of the light cone into WebXR renderers.
    Blend method BLEND + zero Shadow makes it invisible to other lights.
    """
    direction = Vector(target) - Vector(apex)
    length = direction.length
    base_r = tan(half_angle) * length
    n = CONE_SEGS

    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    apex_v = bm.verts.new((0, 0, 0))
    ring = [bm.verts.new((base_r * cos(2*pi*i/n),
                          base_r * sin(2*pi*i/n), length)) for i in range(n)]
    cap  = bm.verts.new((0, 0, length))
    for i in range(n):
        bm.faces.new([apex_v, ring[i], ring[(i+1) % n]])
    for i in range(n):
        bm.faces.new([cap, ring[(i+1) % n], ring[i]])
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = apex
    d = direction.normalized()
    obj.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(obj)

    mat = bpy.data.materials.new(name + '_mat')
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    mix = nt.nodes.new('ShaderNodeMixShader')
    transp = nt.nodes.new('ShaderNodeBsdfTransparent')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value = (*colour, 1.0)
    emit.inputs['Strength'].default_value = 0.35
    mix.inputs['Fac'].default_value = alpha   # 0 = fully transparent, 1 = fully emissive
    nt.links.new(transp.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emit.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    mesh.materials.append(mat)
    return obj


def configure_eevee_next():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    eevee = scene.eevee

    # Bloom — Render Properties > Bloom (restored in EEVEE Next 5.1)
    eevee.use_bloom = True
    eevee.bloom_threshold = BLOOM_THRESHOLD   # HDR pixels above this glow
    eevee.bloom_intensity = BLOOM_INTENSITY   # glow strength multiplier
    eevee.bloom_radius = BLOOM_RADIUS         # spread radius in pixels

    # Volumetrics — voxel-grid frustum sampler
    eevee.volumetric_start = VOL_START
    eevee.volumetric_end = VOL_END
    eevee.volumetric_tile_size = VOL_TILE     # 2px = densest voxel grid
    eevee.volumetric_samples = VOL_SAMPLES    # ray steps per tile
    eevee.use_volumetric_shadows = True       # spot shadow maps occlude the volume
    eevee.volumetric_shadow_samples = VOL_SHADOW_SAMP


def build_scene():
    clear_scene()
    coll = bpy.context.scene.collection

    # Floor
    floor = add_plane('floor', 8.0, 8.0, (0, 0, 0))
    floor.data.materials.append(make_material('floor_mat', (0.04, 0.04, 0.05), 0.92))

    # Back wall (rotated 90° on X, standing 4m behind centre)
    wall = add_plane('wall', 8.0, 5.0, (0, 4.0, 2.5), (radians(90), 0, 0))
    wall.data.materials.append(make_material('wall_mat', (0.06, 0.06, 0.08), 0.88))

    # Pedestal (cylinder: radius 0.1, height 0.8)
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, cap_tris=False, segments=16, radius=0.1)
    # Extrude up to form cylinder
    result = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    top_verts = [v for v in result['geom'] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, 0.8), verts=top_verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    ped_mesh = bpy.data.meshes.new('pedestal')
    bm.to_mesh(ped_mesh)
    bm.free()
    ped = bpy.data.objects.new('pedestal', ped_mesh)
    ped.location = (0, 0, 0)
    ped.data.materials.append(make_material('ped_mat', (0.08, 0.08, 0.1), 0.6, 0.2))
    coll.objects.link(ped)

    # Gem sphere (flat-shaded, faceted look) on top of pedestal
    gem_mesh = bpy.data.meshes.new('gem')
    bm2 = bmesh.new()
    bmesh.ops.create_icosphere(bm2, subdivisions=1, radius=0.14)
    bm2.to_mesh(gem_mesh)
    bm2.free()
    gem = bpy.data.objects.new('gem', gem_mesh)
    gem.location = (0, 0, 0.96)
    mat_gem = make_material('gem_mat', (0.6, 0.9, 1.0), 0.0, 0.0)
    mat_gem.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.9
    mat_gem.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value = 1.52
    gem.data.materials.append(mat_gem)
    coll.objects.link(gem)

    # Spot lights
    build_world_volume()
    add_spot_light('spot_amber', SPOT_A_POS, SPOT_A_TARGET,
                   SPOT_A_COLOUR, SPOT_A_ENERGY, SPOT_A_ANGLE)
    add_spot_light('spot_teal', SPOT_B_POS, SPOT_B_TARGET,
                   SPOT_B_COLOUR, SPOT_B_ENERGY, SPOT_B_ANGLE)

    # Fake emission cones (GLB export proxy for volumes)
    add_fake_cone('cone_amber', SPOT_A_POS, SPOT_A_TARGET,
                  SPOT_A_ANGLE, SPOT_A_COLOUR, CONE_ALPHA)
    add_fake_cone('cone_teal', SPOT_B_POS, SPOT_B_TARGET,
                  SPOT_B_ANGLE, SPOT_B_COLOUR, CONE_ALPHA)

    # Camera — 3/4 angle looking at pedestal
    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 50.0
    cam_data.sensor_width = 36.0
    cam = bpy.data.objects.new('cam', cam_data)
    cam.location = Vector((3.8, -3.8, 2.4))
    direction = (Vector((0, 0, 0.8)) - cam.location).normalized()
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    coll.objects.link(cam)
    bpy.context.scene.camera = cam

    configure_eevee_next()


def export_glb():
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    # Fake cones are included; real volumes are not — this is intentional.
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )


if __name__ == '__main__':
    build_scene()
    export_glb()
