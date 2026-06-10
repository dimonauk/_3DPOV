"""
Shader: Procedural Wood Grain
==============================
Wave-Band Annual Rings · Noise-Distorted Grain Lines · Principled BSDF v2
Anisotropy + KHR_materials_anisotropy GLB Export
Blender 5.1  ·  Category: shading  ·  Licence: CC0

Wood grain arises from two biological processes running simultaneously.
Annual rings form because the tree switches between rapid spring growth
(large, thin-walled earlywood cells — pale) and dense summer growth
(small, thick-walled latewood cells — dark).  Grain waviness forms because
the tree fibres follow the spiral growth path of the cambium layer — they
are never perfectly straight.

This shader models both processes without image textures:

  1. ANNUAL RINGS via ShaderNodeTexWave (wave_type='BANDS', direction='X').
     Object-space coordinates are pre-scaled with a strong Z-axis compression
     (LONG_COMPRESS ≈ 0.06) so the "rings" become long grain lines on the
     flat faces and tight concentric arcs on the end faces — matching the
     appearance of a face-sawn plank.

  2. GRAIN WAVINESS via ShaderNodeTexNoise (low spatial frequency, high
     detail octaves) injected as a coordinate perturbation BEFORE the Wave
     node.  Perturbing coordinates rather than mixing the output preserves
     the full dark→light→dark ring colour cycle; mixing outputs would flatten
     the rings toward a uniform average.

  3. FIBRE ROUGHNESS via a second high-frequency Noise node.  Real wood has
     small roughness variation along the grain because individual fibres
     differ in smoothness.  Mapping this to Roughness in [BASE−VAR, BASE+VAR]
     avoids the uniformly smooth-plastic look of a constant roughness value.

  4. ANISOTROPIC HIGHLIGHT via Principled BSDF v2's Anisotropic parameter
     (0.68 for a sanded plank, higher for polished parquet) combined with a
     Tangent node reading UV map derivatives.  The highlight sweeps in a band
     parallel to the grain, which is the characteristic sheen of finished wood.
     This exports as KHR_materials_anisotropy in the GLB (Three.js r153+
     reads it via MeshPhysicalMaterial.anisotropy + anisotropyRotation).

Node graph overview
  [TexCoord.Object]──[VecMath MULTIPLY scale]──┐
                                                ├──► [VecMath ADD perturb]──► [Wave BANDS X]──► [ColorRamp]──► PBSDF BaseColor
  [Noise low-freq]──[VecMath SCALE distortion]──┘
  [Noise hi-freq fiber]──[MapRange roughness]──────────────────────────────► PBSDF Roughness
  [Tangent UV_MAP]─────────────────────────────────────────────────────────► PBSDF Tangent

Sources
  Blender Manual — Wave Texture Node (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html

  KhronosGroup/glTF — KHR_materials_anisotropy extension (Apache-2.0, Khronos Group)
  https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy
"""

import bpy
import bmesh
import math
from pathlib import Path

# ── OUTPUT PATHS ──────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
BLEND_OUT = _HERE / "wood_grain.blend"
GLB_OUT   = (
    _HERE.parents[2]
    / "glbs" / "shading" / "shader-procedural-wood-grain"
    / "wood_grain.glb"
)

# ── PARAMETERS ────────────────────────────────────────────────────────────────
# Plank geometry
PLANK_LENGTH = 1.8    # metres — long axis runs along X
PLANK_DEPTH  = 0.04   # metres — thickness
PLANK_WIDTH  = 0.25   # metres — face width

# Ring pattern
RING_FREQ      = 14.0   # wave cycles per unit; 14 = ~14 rings across 1 m face
LONG_COMPRESS  = 0.06   # Z-axis scale factor; low value makes rings elongate into planks
# WHY: with LONG_COMPRESS=1 the Wave Bands node sees equal scale in X,Y,Z and produces
# spherical blob pattern — not plank-like.  Compressing Z by 0.06 stretches the ring
# cross-section into ~17:1 ellipses which read as long grain lines from the side.

# Grain waviness (coordinate perturbation before Wave)
DISTORT_SCALE    = 0.8   # noise spatial frequency for waviness; lower = smoother curves
DISTORT_DETAIL   = 8.0   # octave count — 8 gives gentle curvature, not fractal chaos
DISTORT_ROUGH    = 0.55  # noise roughness (0=smooth field, 1=fractal)
DISTORT_STRENGTH = 0.38  # perturbation amplitude; 0=perfectly straight rings, 1=chaotic
# WHY 0.38: grain lines in sawn timber deviate at most 15-20° from parallel at the plank
# surface.  Above 0.5 the bands fold back on themselves and the periodic colour cycle
# produces aliasing banding rather than natural waviness.

# Wood colours — temperate oak palette
DARK_WOOD   = (0.079, 0.033, 0.007)   # dark latewood (late summer, compact cells)
LIGHT_WOOD  = (0.570, 0.280, 0.072)   # light earlywood (spring, large open cells)
MID_WOOD    = (0.330, 0.145, 0.030)   # medium tone (transition zone)
# sRGB values — Blender stores and renders in linear, but these constants are written
# as sRGB approximations of visual oak; bpy ColorRamp uses linear internally.

# Fine fibre roughness
FIBER_SCALE      = 55.0   # noise scale — ~55 Hz along grain = individual fibre width
ROUGHNESS_BASE   = 0.30   # sanded plank base roughness (0.20=polished, 0.50=rough-sawn)
ROUGHNESS_VAR    = 0.14   # ± variation around base from individual fibre texture

# Principled BSDF v2
IOR              = 1.55   # typical wood IOR (range 1.45 cellulose to 1.60 dense hardwood)
ANISOTROPY       = 0.68   # along-grain anisotropic highlight intensity
# WHY 0.68: real sanded oak has an anisotropy ratio ~0.6-0.75 measured goniometrically;
# polished lacquered parquet reads at 0.80+; rough-sawn timber is 0.30-0.45.
ANISO_ROTATION   = 0.0    # 0 = highlight band aligns with UV U-axis = grain direction

# Camera
CAM_DISTANCE = 2.8
CAM_ELEVATION_DEG = 28.0


# ── HELPERS ───────────────────────────────────────────────────────────────────
def _clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def _link(nt, from_node, from_socket, to_node, to_socket):
    """Link by socket name (locale-independent)."""
    nt.links.new(from_node.outputs[from_socket], to_node.inputs[to_socket])


def _n(nt, node_type, x, y, **kwargs):
    """Create a node at position (x, y) and apply kwargs as attributes."""
    nd = nt.nodes.new(node_type)
    nd.location = (x, y)
    for k, v in kwargs.items():
        setattr(nd, k, v)
    return nd


# ── MESH: WOODEN PLANK ────────────────────────────────────────────────────────
def build_plank_mesh():
    """
    A flat rectangular plank with a subtle bevel on the long edges.
    UV-unwrapped with Cube Projection so each face gets a box-mapped
    coordinate — face grain (XZ), edge grain (XY), and end grain (YZ)
    all sample the same shader with the appropriate cross-section.
    """
    mesh = bpy.data.meshes.new("wood_grain_mesh")
    bm = bmesh.new()

    # Six box vertices for the plank
    hx = PLANK_LENGTH / 2
    hz = PLANK_WIDTH  / 2
    hy = PLANK_DEPTH  / 2

    verts = [
        bm.verts.new(( hx,  hy,  hz)),
        bm.verts.new(( hx,  hy, -hz)),
        bm.verts.new(( hx, -hy,  hz)),
        bm.verts.new(( hx, -hy, -hz)),
        bm.verts.new((-hx,  hy,  hz)),
        bm.verts.new((-hx,  hy, -hz)),
        bm.verts.new((-hx, -hy,  hz)),
        bm.verts.new((-hx, -hy, -hz)),
    ]
    bm.verts.ensure_lookup_table()

    # Six faces (cube box)
    faces_idx = [
        (0, 1, 3, 2),   # +X end grain
        (4, 6, 7, 5),   # -X end grain
        (0, 4, 5, 1),   # +Y face (top face)
        (2, 3, 7, 6),   # -Y face (bottom face)
        (0, 2, 6, 4),   # +Z face
        (1, 5, 7, 3),   # -Z face
    ]
    for fi in faces_idx:
        bm.faces.new([verts[i] for i in fi])

    # Bevel the long (Z-direction) edges of the top face: gives a slight chamfer
    # so the plank doesn't look like a pure CAD cube.
    # WHY bevel in bmesh not modifier: bevel modifier would appear in the stack
    # and require apply before GLB export; bmesh is baked into the mesh data-block.
    bm.edges.ensure_lookup_table()
    top_face = bm.faces[2]  # +Y face
    long_edges = [
        e for e in top_face.edges
        if abs(e.verts[0].co.z - e.verts[1].co.z) < 0.001  # horizontal edge = long axis
    ]
    result = bmesh.ops.bevel(
        bm,
        geom=long_edges,
        offset=0.005,
        offset_type='OFFSET',
        segments=1,
        profile=0.5,
        affect='EDGES',
    )

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("wood_grain", mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # UV unwrap: Cube Projection (box mapping) — the correct unwrap for solid
    # rectangular objects.  It assigns each face to one of six box projections
    # based on dominant normal direction, so the grain pattern is correctly
    # oriented (long axis along X) on both face-grain and edge-grain faces.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=1.0)
    bpy.ops.object.mode_set(mode='OBJECT')

    return obj


# ── MATERIAL: PROCEDURAL WOOD GRAIN ──────────────────────────────────────────
def build_wood_material(obj):
    mat = bpy.data.materials.new("wood_grain_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    # --- Output ---
    out = _n(nt, 'ShaderNodeOutputMaterial', 1200, 0)

    # --- Principled BSDF v2 ---
    pbsdf = _n(nt, 'ShaderNodeBsdfPrincipled', 850, 0)
    pbsdf.inputs['Metallic'].default_value   = 0.0
    pbsdf.inputs['IOR'].default_value        = IOR
    pbsdf.inputs['Anisotropic'].default_value       = ANISOTROPY
    pbsdf.inputs['Anisotropic Rotation'].default_value = ANISO_ROTATION
    # Subsurface Weight = 0.0 — sanded wood has negligible SSS vs ceramic/skin
    _link(nt, pbsdf, 'BSDF', out, 'Surface')

    # --- Texture coordinates (Object space) ---
    # WHY Object not UV: UV coords wrap the flat faces correctly but produce
    # inconsistent scale on the narrow edge and end faces.  Object coords are
    # uniform in world space and survive apply-transforms without stretching.
    tc = _n(nt, 'ShaderNodeTexCoord', -900, 0)

    # --- Scale: compress Z to elongate rings into grain lines ---
    v_scale = _n(nt, 'ShaderNodeVectorMath', -700, 0, operation='MULTIPLY')
    v_scale.inputs[1].default_value = (RING_FREQ, RING_FREQ, RING_FREQ * LONG_COMPRESS)
    _link(nt, tc, 'Object', v_scale, 0)

    # --- Distortion noise: low-frequency waviness injected as coord perturbation ---
    # Using Color output (vec3) rather than Fac (scalar) gives a 3D perturbation
    # that bends grain lines in all directions rather than only radially.
    n_distort = _n(nt, 'ShaderNodeTexNoise', -500, -220)
    n_distort.inputs['Scale'].default_value    = DISTORT_SCALE
    n_distort.inputs['Detail'].default_value   = DISTORT_DETAIL
    n_distort.inputs['Roughness'].default_value = DISTORT_ROUGH
    n_distort.inputs['Distortion'].default_value = 0.0
    _link(nt, v_scale, 'Vector', n_distort, 'Vector')

    # Scale the distortion vector by DISTORT_STRENGTH
    v_dstrength = _n(nt, 'ShaderNodeVectorMath', -280, -220, operation='SCALE')
    v_dstrength.inputs['Scale'].default_value = DISTORT_STRENGTH
    _link(nt, n_distort, 'Color', v_dstrength, 0)

    # Add perturbation to scaled coordinates
    v_perturb = _n(nt, 'ShaderNodeVectorMath', -60, 0, operation='ADD')
    _link(nt, v_scale,     'Vector', v_perturb, 0)
    _link(nt, v_dstrength, 'Vector', v_perturb, 1)

    # --- Wave Texture: annual rings ---
    wave = _n(nt, 'ShaderNodeTexWave', 160, 0,
              wave_type='BANDS',
              bands_direction='X',
              wave_profile='SIN')
    wave.inputs['Scale'].default_value          = 1.0   # pre-scaled by RING_FREQ above
    wave.inputs['Distortion'].default_value     = 0.0   # distortion applied externally
    wave.inputs['Detail'].default_value         = 2.0   # subtle fractal detail on rings
    wave.inputs['Detail Scale'].default_value   = 1.0
    wave.inputs['Detail Roughness'].default_value = 0.50
    # WHY Distortion=0 here: Wave.Distortion is an internal high-frequency perturbation
    # that creates small kinks in the bands.  Our coordinate perturbation operates at
    # a lower spatial frequency and produces gradual, realistic grain waviness instead.
    _link(nt, v_perturb, 'Vector', wave, 'Vector')

    # --- ColorRamp: map wave Fac to wood colour cycle ---
    # The SIN wave oscillates 0→1→0 per ring pair.  We map this to a
    # dark→light→mid→dark colour ramp to reproduce the annual ring appearance:
    # - 0.0 = dark latewood (highest Fac peak = maximum growth density)
    # - 0.42 = light earlywood (zero crossing = lowest growth density)
    # - 0.70 = transition mid-tone
    # - 1.0 = dark latewood again (next ring starts)
    cr = _n(nt, 'ShaderNodeValToRGB', 400, 100)
    cr.color_ramp.interpolation = 'B_SPLINE'
    cr.color_ramp.elements[0].position = 0.0
    cr.color_ramp.elements[0].color    = (*DARK_WOOD, 1.0)
    s1 = cr.color_ramp.elements.new(0.42)
    s1.color = (*LIGHT_WOOD, 1.0)
    s2 = cr.color_ramp.elements.new(0.70)
    s2.color = (*MID_WOOD, 1.0)
    cr.color_ramp.elements[-1].position = 1.0
    cr.color_ramp.elements[-1].color    = (*DARK_WOOD, 1.0)
    _link(nt, wave, 'Fac', cr, 'Fac')
    _link(nt, cr,   'Color', pbsdf, 'Base Color')

    # --- Fine fibre noise: per-fibre roughness variation ---
    # High FIBER_SCALE creates thin stripes along the grain that vary roughness,
    # reproducing the look of individual fibre bundles in sanded timber.
    n_fiber = _n(nt, 'ShaderNodeTexNoise', 160, -300)
    n_fiber.inputs['Scale'].default_value    = FIBER_SCALE
    n_fiber.inputs['Detail'].default_value   = 6.0
    n_fiber.inputs['Roughness'].default_value = 0.80
    n_fiber.inputs['Distortion'].default_value = 0.10
    _link(nt, v_perturb, 'Vector', n_fiber, 'Vector')

    # Map Fac [0,1] → roughness range [BASE-VAR, BASE+VAR]
    mr = _n(nt, 'ShaderNodeMapRange', 400, -280)
    mr.inputs['From Min'].default_value = 0.0
    mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Min'].default_value   = max(0.05, ROUGHNESS_BASE - ROUGHNESS_VAR)
    mr.inputs['To Max'].default_value   = min(0.95, ROUGHNESS_BASE + ROUGHNESS_VAR)
    _link(nt, n_fiber, 'Fac', mr, 'Value')
    _link(nt, mr,      'Result', pbsdf, 'Roughness')

    # --- Tangent: align anisotropy highlight with grain direction ---
    # direction_type='UV_MAP' reads the tangent from UV derivatives on the mesh.
    # The Cube Projection UV has its U direction aligned with the longest faces,
    # which is the X axis of the plank = grain direction.  The anisotropic
    # highlight therefore sweeps as a band parallel to the grain — correct.
    # WHY UV_MAP not RADIAL: RADIAL would give tangent pointing around the Z axis
    # (lathe-turned wood pattern) rather than along grain; wrong for a sawn plank.
    tang = _n(nt, 'ShaderNodeTangent', 600, -340)
    tang.direction_type = 'UV_MAP'
    # The UV map created by Cube Projection defaults to "UVMap" as name
    tang.uv_map = "UVMap"
    _link(nt, tang, 'Tangent', pbsdf, 'Tangent')

    obj.data.materials.append(mat)
    return mat


# ── LIGHTING ──────────────────────────────────────────────────────────────────
def build_lighting():
    # Key light: area lamp positioned to show anisotropic grain highlight
    key_data = bpy.data.lights.new("Key", type='AREA')
    key_data.energy = 200.0
    key_data.size   = 0.6
    key_data.color  = (1.0, 0.95, 0.88)   # warm white
    key = bpy.data.objects.new("Key", key_data)
    bpy.context.scene.collection.objects.link(key)
    key.location = (1.2, -1.8, 2.4)
    key.rotation_euler = (math.radians(52), 0, math.radians(30))

    # Fill light: dim area from the opposite side
    fill_data = bpy.data.lights.new("Fill", type='AREA')
    fill_data.energy = 40.0
    fill_data.size   = 1.2
    fill_data.color  = (0.9, 0.95, 1.0)   # slightly cool fill
    fill = bpy.data.objects.new("Fill", fill_data)
    bpy.context.scene.collection.objects.link(fill)
    fill.location = (-1.5, 1.0, 1.5)
    fill.rotation_euler = (math.radians(60), 0, math.radians(-30))

    # Rim light: grazing angle from the top to emphasise grain texture
    rim_data = bpy.data.lights.new("Rim", type='AREA')
    rim_data.energy = 80.0
    rim_data.size   = 0.3
    rim_data.color  = (1.0, 0.92, 0.78)
    rim = bpy.data.objects.new("Rim", rim_data)
    bpy.context.scene.collection.objects.link(rim)
    rim.location = (0.0, -0.5, 3.2)
    rim.rotation_euler = (math.radians(12), 0, 0)
    # Rim at 12° elevation = nearly parallel to plank surface — maximises the
    # anisotropic highlight band visibility along the grain direction.


# ── CAMERA ────────────────────────────────────────────────────────────────────
def build_camera():
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 85          # short telephoto = natural perspective for product shots
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    el = math.radians(CAM_ELEVATION_DEG)
    az = math.radians(200)
    r  = CAM_DISTANCE
    cam.location = (
        r * math.cos(el) * math.sin(az),
        -r * math.cos(el) * math.cos(az),
        r * math.sin(el),
    )
    cam.rotation_euler = (
        math.radians(90) - el,
        0.0,
        math.radians(200 - 180),
    )
    return cam


# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    # EEVEE Next: enable screen-space reflections to show anisotropic highlights
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_method = 'SCREEN'   # screen-space GI
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.film_transparent = False

    # HDRI world: neutral studio grey for unbiased colour evaluation
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    wnt = world.node_tree
    wnt.nodes.clear()
    bg = wnt.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value    = (0.12, 0.12, 0.12, 1.0)
    bg.inputs['Strength'].default_value = 0.8
    wo = wnt.nodes.new('ShaderNodeOutputWorld')
    wnt.links.new(bg.outputs['Background'], wo.inputs['Surface'])
    bpy.context.scene.world = world


# ── GLB EXPORT ────────────────────────────────────────────────────────────────
def export_glb(obj):
    """
    Export to GLB with:
    - export_apply=True: bakes NODES/modifiers into vertex data
    - export_image_format='WEBP': WebP textures (Holoflow standard)
    - export_draco_mesh_compression_enable=True level 6
    - +Y up (glTF convention from Blender +Z up)
    - KHR_materials_anisotropy: written automatically when Anisotropic > 0
      in Principled BSDF v2 + Tangent connected.  Three.js r153+ reads
      anisotropy and anisotropyRotation from MeshPhysicalMaterial.
    - KHR_materials_specular: IOR exported as specularFactor
    """
    GLB_OUT.parent.mkdir(parents=True, exist_ok=True)

    # Deselect all, select only the plank
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    print(f"[wood_grain] GLB → {GLB_OUT}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
_clear_scene()
plank = build_plank_mesh()
build_wood_material(plank)
build_lighting()
cam = build_camera()
configure_render()

# Save .blend
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[wood_grain] .blend → {BLEND_OUT}")

export_glb(plank)

print("[wood_grain] Done.  Run record.py in the same session to render viewport.mp4.")
