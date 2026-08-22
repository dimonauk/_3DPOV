"""
Holoflow Studio — Blender 5.1 Blueprint
Python Cycles Shader AOV — Arbitrary Output Variables
Custom Data Baking: World-Space Gradient, Noise Mask & Curvature Emit for WebXR

Cycles AOVs let you write custom shader-computed data into named render passes
alongside the beauty output.  The data is captured per-pixel in the full-res
render — no UV projection required.  For UV-mapped WebXR data textures the
companion technique is the Emit Bake: wire any shader data into an Emission
node, set it as the active Material Output, bake type=EMIT, and you get a
UV-projected data texture in exactly the layout the mesh already has.

This blueprint demonstrates both routes:
  Route A — ViewLayer AOV definition → ShaderNodeOutputAOV → single-sample
             Cycles render → compositor File Output → multi-layer EXR.
  Route B — Geometry.Pointiness → ColorRamp → Emission → active output →
             bpy.ops.object.bake(type='EMIT') → UV-mapped curvature WebP.

Blueprint outputs:
    aov_passes_0001.exr    — multi-layer EXR: HeightGradient + NoiseMask channels
    curvature_bake.webp    — UV-baked curvature (pointiness) data texture
    aov_sphere.glb         — sphere with embedded WebP, Draco 6 compressed
"""

import bpy
import math

# ─── Parameters ──────────────────────────────────────────────────────────────
MESH_NAME        = "aov_sphere"
MAT_NAME         = "aov_sphere_mat"
BAKE_RES         = 512            # pixels, square
RENDER_SAMPLES   = 1              # AOV pass only needs 1 sample — data not noisy
BAKE_SAMPLES     = 64             # emit bake: more = sharper pointiness boundary
OUTPUT_EXR_BASE  = "//aov_passes_"
OUTPUT_BAKE_WEBP = "//curvature_bake.webp"
OUTPUT_GLB       = "//aov_sphere.glb"
AOV_HEIGHT_NAME  = "HeightGradient"
AOV_NOISE_NAME   = "NoiseMask"


# ─── 1. Scene reset ───────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)


# ─── 2. UV sphere with smart unwrap ──────────────────────────────────────────
def make_sphere() -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1.0)
    ob = bpy.context.active_object
    ob.name = MESH_NAME
    ob.data.name = MESH_NAME

    # smart_project works without a VIEW_3D context — safe from Text Editor.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(
        angle_limit=math.radians(66.0), island_margin=0.02
    )
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


# ─── 3. AOV material — Route A output nodes ──────────────────────────────────
def build_aov_material(ob: bpy.types.Object) -> bpy.types.Material:
    """
    One material with:
      - Principled BSDF → out_render   (used for beauty render + GLB export)
      - Two ShaderNodeOutputAOV nodes  (HeightGradient + NoiseMask)
    The AOV Output nodes fire regardless of which Material Output is active —
    Cycles evaluates all AOV Output nodes in every material simultaneously.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    # Beauty path — Principled BSDF → Material Output.
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)

    out_render = nt.nodes.new('ShaderNodeOutputMaterial')
    out_render.name          = "out_render"
    out_render.location      = (300, 0)
    out_render.is_active_output = True
    nt.links.new(bsdf.outputs['BSDF'], out_render.inputs['Surface'])

    # --- Height gradient: Object-space Y coordinate, remapped 0→1 ---
    tex_coord = nt.nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-700, 350)

    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    sep.location = (-500, 350)
    nt.links.new(tex_coord.outputs['Object'], sep.inputs['Vector'])

    remap = nt.nodes.new('ShaderNodeMapRange')
    remap.location = (-300, 350)
    remap.inputs['From Min'].default_value = -1.0
    remap.inputs['From Max'].default_value =  1.0
    remap.inputs['To Min'].default_value   =  0.0
    remap.inputs['To Max'].default_value   =  1.0
    nt.links.new(sep.outputs['Y'], remap.inputs['Value'])

    # Pack scalar into RGB — AOV COLOR type expects a colour input.
    combine = nt.nodes.new('ShaderNodeCombineXYZ')
    combine.location = (-100, 350)
    for ch in ('X', 'Y', 'Z'):
        nt.links.new(remap.outputs['Result'], combine.inputs[ch])

    # ShaderNodeOutputAOV.name is the AOV target name (shadows Node.name).
    # It must match the ViewLayer AOV name exactly — case-sensitive.
    aov_h = nt.nodes.new('ShaderNodeOutputAOV')
    aov_h.name     = AOV_HEIGHT_NAME   # sets which ViewLayer AOV to write
    aov_h.location = (100, 350)
    nt.links.new(combine.outputs['Vector'], aov_h.inputs['Color'])

    # --- Noise threshold mask ---
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.location = (-500, -200)
    noise.inputs['Scale'].default_value      = 6.0
    noise.inputs['Detail'].default_value     = 4.0
    noise.inputs['Roughness'].default_value  = 0.6
    noise.inputs['Distortion'].default_value = 0.2

    gt = nt.nodes.new('ShaderNodeMath')
    gt.operation = 'GREATER_THAN'
    gt.location  = (-300, -200)
    gt.inputs[1].default_value = 0.55
    nt.links.new(noise.outputs['Fac'], gt.inputs[0])

    # AOV VALUE type — scalar; wire to Value socket, not Color.
    aov_n = nt.nodes.new('ShaderNodeOutputAOV')
    aov_n.name     = AOV_NOISE_NAME
    aov_n.location = (-100, -200)
    nt.links.new(gt.outputs['Value'], aov_n.inputs['Value'])

    ob.data.materials.append(mat)
    return mat


# ─── 4. Define AOVs on the active ViewLayer ──────────────────────────────────
def define_aovs() -> None:
    """
    ViewLayer AOVs must be defined here AND matched by name in the shader.
    Removing and re-adding is the idempotent pattern — safe for re-runs.
    """
    vl = bpy.context.view_layer
    for aov in list(vl.aovs):
        vl.aovs.remove(aov)

    aov_h      = vl.aovs.add()
    aov_h.name = AOV_HEIGHT_NAME
    aov_h.type = 'COLOR'    # 3-channel float — HeightGradient is RGB-packed

    aov_n      = vl.aovs.add()
    aov_n.name = AOV_NOISE_NAME
    aov_n.type = 'VALUE'    # 1-channel float — NoiseMask is scalar


# ─── 5. Compositor: RenderLayers AOV sockets → multi-layer EXR ───────────────
def build_compositor(scene: bpy.types.Scene) -> None:
    """
    After define_aovs(), the RenderLayers node grows output sockets named
    after each AOV.  These appear only once the ViewLayer AOVs are committed —
    if you build the compositor before define_aovs() runs the sockets are absent.
    """
    scene.use_nodes = True
    ct = scene.node_tree
    ct.nodes.clear()

    rl = ct.nodes.new('CompositorNodeRLayers')
    rl.location = (0, 0)
    rl.scene    = scene
    rl.layer    = bpy.context.view_layer.name

    fo = ct.nodes.new('CompositorNodeOutputFile')
    fo.location                  = (500, 0)
    fo.format.file_format        = 'OPEN_EXR_MULTILAYER'
    fo.format.color_depth        = '32'
    fo.base_path                 = bpy.path.abspath(OUTPUT_EXR_BASE)

    fo.file_slots[0].path = AOV_HEIGHT_NAME
    fo.file_slots.new(AOV_NOISE_NAME)

    # Link AOV sockets — present only because define_aovs() already ran.
    ct.links.new(rl.outputs[AOV_HEIGHT_NAME], fo.inputs[AOV_HEIGHT_NAME])
    ct.links.new(rl.outputs[AOV_NOISE_NAME],  fo.inputs[AOV_NOISE_NAME])


# ─── 6. Cycles config for single-sample AOV render ───────────────────────────
def configure_render(scene: bpy.types.Scene) -> None:
    scene.render.engine            = 'CYCLES'
    scene.cycles.samples           = RENDER_SAMPLES
    scene.cycles.use_denoising     = False
    scene.render.resolution_x      = BAKE_RES
    scene.render.resolution_y      = BAKE_RES
    scene.render.resolution_percentage = 100
    scene.frame_start = scene.frame_end = 1


# ─── 7. Run AOV render ────────────────────────────────────────────────────────
def run_aov_render() -> None:
    """
    Triggers full Cycles render.  The compositor File Output node writes the
    EXR with two layers (HeightGradient, NoiseMask) to aov_passes_0001.exr.
    write_still=False because File Output handles the write — not render.filepath.
    """
    bpy.ops.render.render(write_still=False, use_viewport=False)


# ─── 8. Emit bake — Route B (UV-projected curvature data texture) ─────────────
def bake_emit_texture(ob: bpy.types.Object, mat: bpy.types.Material) -> None:
    """
    Geometry.Pointiness gives a vertex-interpolated curvature estimate.
    Wired through a ColorRamp → Emission → second Material Output.
    bake(type='EMIT') captures whatever is on Surface of the active output.
    """
    scene = bpy.context.scene
    nt    = mat.node_tree

    # Build the curvature→emit sub-graph.
    geom = nt.nodes.new('ShaderNodeNewGeometry')
    geom.location = (-400, -500)

    cramp = nt.nodes.new('ShaderNodeValToRGB')
    cramp.location = (-200, -500)
    cramp.color_ramp.elements[0].position = 0.4
    cramp.color_ramp.elements[0].color    = (0.0, 0.0, 0.0, 1.0)
    cramp.color_ramp.elements[1].position = 0.7
    cramp.color_ramp.elements[1].color    = (1.0, 1.0, 1.0, 1.0)
    nt.links.new(geom.outputs['Pointiness'], cramp.inputs['Fac'])

    emit = nt.nodes.new('ShaderNodeEmission')
    emit.location = (0, -500)
    nt.links.new(cramp.outputs['Color'], emit.inputs['Color'])

    out_bake = nt.nodes.new('ShaderNodeOutputMaterial')
    out_bake.name               = "out_bake"
    out_bake.location           = (300, -500)
    out_bake.is_active_output   = True    # make this the bake target
    nt.links.new(emit.outputs['Emission'], out_bake.inputs['Surface'])

    # Deactivate the render output during bake.
    out_render = nt.nodes.get("out_render")
    if out_render:
        out_render.is_active_output = False

    # Create bake target image texture.
    bake_img  = bpy.data.images.new(
        "curvature_bake", BAKE_RES, BAKE_RES, float_buffer=True
    )
    img_node  = nt.nodes.new('ShaderNodeTexImage')
    img_node.image    = bake_img
    img_node.location = (-700, -500)
    # Must be ACTIVE and have NO output links — Blender uses this as bake target.
    nt.nodes.active   = img_node

    scene.render.engine        = 'CYCLES'
    scene.cycles.samples       = BAKE_SAMPLES
    scene.render.bake.use_pass_direct   = False
    scene.render.bake.use_pass_indirect = False

    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.bake(type='EMIT')

    # Save to WebP.
    bake_img.filepath_raw = bpy.path.abspath(OUTPUT_BAKE_WEBP)
    bake_img.file_format  = 'WEBP'
    bake_img.save()

    # Restore render output for GLB export.
    out_bake.is_active_output   = False
    if out_render:
        out_render.is_active_output = True


# ─── 9. GLB export ────────────────────────────────────────────────────────────
def export_glb(ob: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(scale=True, rotation=True, location=True)

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(OUTPUT_GLB),
        export_format                        = 'GLB',
        use_selection                        = True,
        export_image_format                  = 'WEBP',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_apply                         = False,
    )


# ─── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    scene = bpy.context.scene
    reset_scene()
    ob  = make_sphere()
    mat = build_aov_material(ob)
    define_aovs()
    build_compositor(scene)
    configure_render(scene)
    run_aov_render()        # writes aov_passes_0001.exr
    bake_emit_texture(ob, mat)  # writes curvature_bake.webp
    export_glb(ob)          # writes aov_sphere.glb
    print("Done — check aov_passes_0001.exr, curvature_bake.webp, aov_sphere.glb")


if __name__ == "__main__":
    main()
