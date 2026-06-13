"""
Shader: Procedural Marble — Vein System
========================================
Wave-Distortion Vein Network · Noise Cloud Variation · Principled BSDF v2
Subsurface Translucency · Clearcoat Polish
Blender 5.1  ·  Category: shading  ·  Licence: CC0

Marble forms when limestone is subjected to extreme heat and pressure during
metamorphic events.  Calcite crystals recrystallise into an interlocking mosaic
of near-pure white grains.  Impurities — iron oxides, graphite, serpentine —
cannot fit into the calcite lattice and migrate to the boundaries between
growing crystals.  Under continued stress these impurity layers flow as thin
seams, eventually freezing as veins when the rock cools.

This shader reproduces three visual layers without image textures:

  1. VEIN NETWORK via ShaderNodeTexWave (wave_type='BANDS', bands_direction='Z').
     Distortion ≈ 2.5 bends the straight wave bands into the irregular, flowing
     lines characteristic of real marble.  A ColorRamp with CONSTANT interpolation
     maps the continuous wave output to a sharp binary vein/background mask.
     The gap between stops VEIN_STOP_LO and VEIN_STOP_HI controls hairline
     thickness — 7% of the wave period gives ~1.4 cm veins per 0.2 m period.

  2. CLOUD VARIATION via ShaderNodeTexNoise (large scale, moderate octaves).
     Carrara marble is not a flat white — it has gentle tonal drift from grain-
     size variation and micro-inclusion density.  The noise output drives a subtle
     colour shift from warm white to a slightly cooler grey.

  3. SUBSURFACE TRANSLUCENCY via Principled BSDF v2 Subsurface Weight + Radius.
     Calcite transmits red light furthest (R 0.05 m), green less (G 0.04 m),
     blue least (B 0.03 m), giving the characteristic warm amber glow visible at
     slab edges and a feeling of internal depth on back-lit tiles.

  4. CLEARCOAT via Coat Weight = 1.0, Coat Roughness = 0.04.  Polished marble
     has two specular layers: smooth mirror coat over a rougher calcite base.
     Z-compression (VEIN_Z_COMPRESS = 0.45) elongates veins across the face —
     without it, bands form tight ellipses instead of long sweeping lines.

Node graph:
  [TexCoord.Object]──[VecMath MULTIPLY z-compress]──► [Wave BANDS Z]──► [CR_vein CONSTANT]── Fac
  [Noise large-scale]──[CR_cloud LINEAR]────────────────────────────── Color1 ►[MixRGB]──► PBSDF
  VEIN_COLOR ───────────────────────────────────────────────────────── Color2 ►[MixRGB]

Outside sources
  Blender Manual — Wave Texture (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html

  Blender Manual — Principled BSDF v2 (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html
"""

import bpy
import bmesh
from pathlib import Path

# ── OUTPUT PATHS ──────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
BLEND_OUT = _HERE / "marble.blend"
GLB_OUT   = (
    _HERE.parents[2]
    / "glbs" / "shading" / "shader-procedural-marble-veins"
    / "marble.glb"
)

# ── GEOMETRY PARAMETERS ───────────────────────────────────────────────────────
SLAB_X = 0.60   # metres — tile width
SLAB_Y = 0.60   # metres — tile depth
SLAB_Z = 0.02   # metres — tile thickness

# ── VEIN PARAMETERS ───────────────────────────────────────────────────────────
VEIN_FREQ       = 5.0   # wave cycles per unit; 5 = 5 major vein families across 1 m
VEIN_DISTORT    = 2.5   # wave distortion amount; 0=ruler-straight, 4=chaotic folds
VEIN_STOP_LO    = 0.35  # ColorRamp start of vein band
VEIN_STOP_HI    = 0.42  # ColorRamp end of vein band (gap=0.07 → ~7% of period)
VEIN_Z_COMPRESS = 0.45  # Z-axis scale factor; <1 elongates veins across the face

# ── COLOUR PARAMETERS ─────────────────────────────────────────────────────────
# Carrara marble (white calcite + dark graphite veins)
BASE_COLOR  = (0.94, 0.92, 0.90, 1.0)   # warm white calcite face
CLOUD_DARK  = (0.80, 0.79, 0.77, 1.0)   # cooler grey for cloudy tonal drift
VEIN_COLOR  = (0.05, 0.05, 0.06, 1.0)   # near-black graphite vein

# ── CLOUD NOISE PARAMETERS ────────────────────────────────────────────────────
CLOUD_SCALE  = 0.5    # large scale relative to slab; small value = large clouds
CLOUD_DETAIL = 5.0    # octaves; 5 gives smooth organic variation

# ── BSDF PARAMETERS ──────────────────────────────────────────────────────────
ROUGHNESS   = 0.08             # honed/polished; increase to 0.35 for tumbled
IOR_CALCITE = 1.486            # calcite refractive index (ordinary ray)
SSS_WEIGHT  = 0.12             # subsurface amount; 0.12 = gentle edge glow
SSS_RADIUS  = (0.05, 0.04, 0.03)  # metres per channel; R>G>B = warm amber glow
COAT_WEIGHT = 1.0              # full clearcoat
COAT_ROUGH  = 0.04             # mirror-smooth coat; 0.15 for satin finish


# ─────────────────────────────────────────────────────────────────────────────
def _clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def _make_slab() -> bpy.types.Object:
    """Box representing a 60×60 cm polished marble tile."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "marble_slab"
    obj.scale = (SLAB_X, SLAB_Y, SLAB_Z)
    bpy.ops.object.transform_apply(scale=True)

    # Subdivide top face for smooth SSS gradient across the surface.
    # WHY: SSS in Cycles computes per-shading-point; too-large polygons give
    # blotchy gradients.  4 cuts → 16 sub-faces per original quad.
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    top_edges = [
        e for e in bm.edges
        if all(f.normal.z > 0.9 for f in e.link_faces)
    ]
    bmesh.ops.subdivide_edges(bm, edges=top_edges, cuts=4, use_grid_fill=True)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj


def _N(nodes, tp, x=0, y=0):
    n = nodes.new(type=tp)
    n.location = (x, y)
    return n


def _build_marble_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("marble_carrara")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    def N(tp, x=0, y=0):
        return _N(nodes, tp, x, y)

    out     = N("ShaderNodeOutputMaterial",  900, 300)
    pbsdf   = N("ShaderNodeBsdfPrincipled",  600, 300)
    mix_rgb = N("ShaderNodeMixRGB",          350, 400)
    cr_vn   = N("ShaderNodeValToRGB",        100, 550)   # vein mask
    cr_cl   = N("ShaderNodeValToRGB",        100, 200)   # cloud tone
    wave    = N("ShaderNodeTexWave",        -150, 550)
    noise   = N("ShaderNodeTexNoise",       -150, 200)
    vscale  = N("ShaderNodeVectorMath",     -400, 550)   # Z compression
    tcoord  = N("ShaderNodeTexCoord",       -620, 400)

    # MixRGB: Fac=0 → Color1 (cloud base), Fac=1 → Color2 (vein)
    # CR_vein WHITE=background (Fac=1→Color2), BLACK=vein (Fac=0→Color1)
    # RGBA→Float via luminance — pure black→0, pure white→1
    mix_rgb.blend_type = 'MIX'
    mix_rgb.use_clamp  = True
    mix_rgb.inputs['Color1'].default_value = (*VEIN_COLOR[:3], 1)

    vscale.operation = 'MULTIPLY'
    vscale.inputs[1].default_value = (1.0, 1.0, VEIN_Z_COMPRESS)

    wave.wave_type            = 'BANDS'
    wave.bands_direction      = 'Z'
    wave.wave_profile         = 'SIN'
    wave.inputs['Scale'].default_value           = VEIN_FREQ
    wave.inputs['Distortion'].default_value      = VEIN_DISTORT
    wave.inputs['Detail'].default_value          = 2.0
    wave.inputs['Detail Roughness'].default_value = 0.5

    # Noise: large-scale cloud variation
    noise.noise_dimensions                    = '3D'
    noise.inputs['Scale'].default_value       = CLOUD_SCALE
    noise.inputs['Detail'].default_value      = CLOUD_DETAIL
    noise.inputs['Roughness'].default_value   = 0.5
    noise.inputs['Distortion'].default_value  = 0.0

    # ColorRamp — vein mask: CONSTANT gives a sharp hard edge at the vein boundary.
    # WHY CONSTANT not LINEAR: a LINEAR ramp would produce a soft gradient where
    # veins fade in and out, losing the knife-thin hairline quality of real marble.
    cr_vn.color_ramp.interpolation = 'CONSTANT'
    ev = cr_vn.color_ramp.elements
    ev[0].position = 0.0;  ev[0].color = (1, 1, 1, 1)  # background = white
    ev[1].position = 1.0;  ev[1].color = (1, 1, 1, 1)  # far edge = white (was black by default!)
    v_lo = ev.new(VEIN_STOP_LO)
    v_lo.color = (0, 0, 0, 1)    # vein start = black
    v_hi = ev.new(VEIN_STOP_HI)
    v_hi.color = (1, 1, 1, 1)    # vein end = white (background resumes)

    # ColorRamp — cloud tone: smooth ramp from dark grey to warm white
    cr_cl.color_ramp.interpolation = 'LINEAR'
    ec = cr_cl.color_ramp.elements
    ec[0].position = 0.0;  ec[0].color = (*CLOUD_DARK[:3], 1)
    ec[1].position = 1.0;  ec[1].color = (*BASE_COLOR[:3], 1)

    # Principled BSDF v2 — two specular layers + SSS
    pbsdf.inputs['Roughness'].default_value           = ROUGHNESS
    pbsdf.inputs['IOR'].default_value                 = IOR_CALCITE
    pbsdf.inputs['Subsurface Weight'].default_value   = SSS_WEIGHT
    pbsdf.inputs['Subsurface Radius'].default_value   = SSS_RADIUS
    pbsdf.inputs['Coat Weight'].default_value         = COAT_WEIGHT
    pbsdf.inputs['Coat Roughness'].default_value      = COAT_ROUGH

    # ── Links ─────────────────────────────────────────────────────────────────
    links.new(tcoord.outputs['Object'],  vscale.inputs[0])
    links.new(vscale.outputs[0],          wave.inputs['Vector'])
    links.new(wave.outputs['Color'],      cr_vn.inputs['Fac'])

    links.new(tcoord.outputs['Object'],  noise.inputs['Vector'])
    links.new(noise.outputs['Fac'],       cr_cl.inputs['Fac'])

    links.new(cr_vn.outputs['Color'],    mix_rgb.inputs['Fac'])     # vein mask → factor
    links.new(cr_cl.outputs['Color'],    mix_rgb.inputs['Color2'])  # cloud tone → base colour

    links.new(mix_rgb.outputs['Color'],  pbsdf.inputs['Base Color'])
    links.new(pbsdf.outputs['BSDF'],     out.inputs['Surface'])

    return mat


def _add_lighting():
    # Key: large area light at 45° — shows the coat specular peak on the tile surface
    bpy.ops.object.light_add(type='AREA', location=(1.0, -1.0, 1.4))
    key = bpy.context.active_object
    key.name = "Key"
    key.data.energy = 500
    key.data.size   = 0.8
    key.rotation_euler = (0.78, 0.0, 0.78)

    # Fill: soft light opposite side, no shadows — reveals SSS glow at slab edges
    bpy.ops.object.light_add(type='POINT', location=(-1.2, 0.6, 0.6))
    fill = bpy.context.active_object
    fill.name = "Fill"
    fill.data.energy          = 60
    fill.data.shadow_soft_size = 0.6


def _add_camera():
    # 45° viewing angle — shows vein pattern AND coat sheen simultaneously
    bpy.ops.object.camera_add(location=(0.0, -1.1, 0.8))
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.rotation_euler          = (1.05, 0.0, 0.0)  # ~60° from vertical
    cam.data.lens               = 50
    bpy.context.scene.camera   = cam
    return cam


def _configure_render():
    scene = bpy.context.scene
    scene.render.engine          = 'CYCLES'
    scene.cycles.samples         = 128
    scene.cycles.use_denoising  = True
    # World: neutral dark grey — keeps specular highlights readable
    world = bpy.data.worlds.get("World")
    if world:
        world.use_nodes = True
        bg = world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs['Color'].default_value    = (0.06, 0.06, 0.08, 1.0)
            bg.inputs['Strength'].default_value = 0.3


def _export_glb(obj):
    GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
        export_yup=True,
    )
    print(f"[marble] GLB → {GLB_OUT}")


def main():
    _clear_scene()
    slab = _make_slab()
    mat  = _build_marble_material()
    slab.data.materials.append(mat)
    _add_lighting()
    _add_camera()
    _configure_render()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[marble] blend → {BLEND_OUT}")
    _export_glb(slab)


main()
