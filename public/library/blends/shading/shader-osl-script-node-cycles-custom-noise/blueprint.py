"""
Shader: OSL Script Node — Custom Procedural Lava-Crack Turbulence in Cycles
Holoflow Studio | CC0

Technique
---------
Open Shading Language (OSL) lets you write custom shader functions in C-like
syntax and plug them into the Cycles node graph as a Script node. The node
parses the .osl source at load time and generates typed input/output sockets
automatically — no C++ compile step, no add-on required.

This blueprint demonstrates the full pipeline:
  1. Write an .osl Text block (hs_lava_crack) inside Blender's data block.
  2. Wire a ShaderNodeScript → Principled BSDF → Material Output.
  3. Use OSL built-in noise("perlin", ...) with turbulence (absolute-value FBM)
     to produce a cracked-rock / lava-seam procedural texture.
  4. Render a single Cycles frame to output/osl_lava_0001.png.
  5. Save the .blend for record.py and screen-recording sessions.

OSL execution model
-------------------
Cycles evaluates the OSL shader once per shading sample on the CPU. The shader
sees every OSL global (P, N, I, u, v, time, …) scoped to the current ray. The
Script node translates OSL output variables into node sockets; input variables
become node sockets as well, so you can drive them with Texture Coordinate
nodes, value drivers, or literal constants.

IMPORTANT: Cycles must run on CPU for OSL. The script sets device='CPU' and
shading_system=True. GPU path-tracing does not support OSL in Blender 5.1.

Turbulence FBM
--------------
Fractal Brownian Motion (FBM) sums multiple octaves of noise, each at double
the spatial frequency (lacunarity=2) and half the amplitude (gain=0.5).
Standard FBM can produce negative values; taking abs() before summing
("turbulence" variant) folds the negative valleys upward, creating sharp ridges
that read as lava cracks separating cooler rock.

The Threshold / smoothstep pair converts the continuous noise field into a
near-binary mask: values above Threshold (hot lava) ramp to 1.0 over 0.1 units,
values below read as cold rock. Adjusting Threshold changes crack density.

Run: Scripting workspace → Run Script.
Outputs: osl_lava_crack.blend + output/osl_lava_0001.png (alongside blueprint).
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector

# ── CONSTANTS ────────────────────────────────────────────────────────────────
BLEND_NAME   = "osl_lava_crack"
MESH_NAME    = "LavaPlane"
MAT_NAME     = "OslLavaCrack_Mat"
OSL_TEXT     = "hs_lava_crack.osl"

PLANE_DIVS   = 128          # subdivision level — high enough to show texture
PLANE_SIZE   = 2.0          # metres across

CAM_LOCATION = Vector((0.0, -3.5, 2.2))
CAM_ROTATION = (math.radians(55), 0.0, 0.0)

LIGHT_ENERGY = 800.0        # watts — sun lamp equivalent
LIGHT_LOC    = Vector((2.0, -1.5, 4.0))

RENDER_SAMPLES = 64         # Cycles samples — enough to assess texture, fast
OUTPUT_DIR   = bpy.path.abspath("//output/")
OUTPUT_FILE  = os.path.join(OUTPUT_DIR, "osl_lava")   # Cycles appends _0001.png

# OSL shader defaults — tuned for a clear lava-crack at plane-unit scale
SCALE_DEFAULT      = 5.0
OCTAVES_DEFAULT    = 4.0
LACUNARITY_DEFAULT = 2.0
GAIN_DEFAULT       = 0.5
THRESHOLD_DEFAULT  = 0.42
LAVA_COL           = (1.0, 0.22, 0.02)   # sRGB deep orange
ROCK_COL           = (0.07, 0.05, 0.04)  # near-black basalt

# ── OSL SOURCE ───────────────────────────────────────────────────────────────
# Stored as a raw string so it survives copy-paste into the Blender text editor.
# Note: OSL's noise("perlin", point) returns [0, 1].  abs() is not needed for
# the perlin variant but IS essential for the turbulence character — without it
# the summation stays smooth FBM; with it the negative valleys fold upward and
# create sharp ridges that read as crack seams.
OSL_SOURCE = """\
/* hs_lava_crack — Holoflow Studio | CC0
   Turbulence-FBM lava-crack procedural for Blender Cycles 5.1 OSL.
   P is the global shading-point position in object space by default.
   Outputs: Color (rock↔lava blend), Fac (0=rock, 1=lava heat). */
shader hs_lava_crack(
    float Scale      = 5.0,
    float Octaves    = 4.0,
    float Lacunarity = 2.0,
    float Gain       = 0.5,
    float Threshold  = 0.42,
    color Lava_Col   = color(1.0, 0.22, 0.02),
    color Rock_Col   = color(0.07, 0.05, 0.04),
    output color Color = color(0),
    output float Fac   = 0.0
) {
    /* Walk through FBM octaves.  Each iteration doubles frequency and halves
       amplitude.  abs() on perlin noise is the turbulence fold that creates
       the characteristic sharp ridges at frequency boundaries. */
    point p         = P * Scale;
    float val       = 0.0;
    float amp       = 1.0;
    float total_amp = 0.0;
    int   n         = (int)Octaves;
    for (int i = 0; i < n; i++) {
        val       += amp * abs(noise("perlin", p));
        total_amp += amp;
        amp       *= Gain;
        p         *= Lacunarity;
    }
    val /= total_amp;    /* normalise to [0, 1] */

    /* smoothstep: values above Threshold ramp to 1.0 over a 0.1 band.
       Narrow band = crisp crack edges; widen to 0.2–0.3 for soft glow. */
    float t = smoothstep(Threshold, Threshold + 0.1, val);
    Color = mix(Rock_Col, Lava_Col, t);
    Fac   = t;
}
"""

# ── SCENE RESET ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"

# ── CYCLES + OSL ─────────────────────────────────────────────────────────────
scene.render.engine = 'CYCLES'
# OSL requires CPU. GPU Cycles (OptiX / HIP / Metal) does NOT support OSL in 5.1.
scene.cycles.device         = 'CPU'
scene.cycles.shading_system = True          # enables Open Shading Language
scene.cycles.samples        = RENDER_SAMPLES
scene.cycles.use_denoising = False          # keep raw OSL output for inspection

# ── OSL TEXT BLOCK ───────────────────────────────────────────────────────────
if OSL_TEXT in bpy.data.texts:
    bpy.data.texts.remove(bpy.data.texts[OSL_TEXT])
text_block = bpy.data.texts.new(OSL_TEXT)
text_block.write(OSL_SOURCE)
# Rewind cursor to line 1 so Blender's text editor shows the header comment.
text_block.cursor_set(0)

# ── MESH ─────────────────────────────────────────────────────────────────────
def build_plane() -> bpy.types.Object:
    """Subdivided plane. High subdivision ensures OSL's continuous field is
    sampled densely enough to show crack detail in EEVEE previews as well."""
    me = bpy.data.meshes.new(MESH_NAME)
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments=PLANE_DIVS,
        y_segments=PLANE_DIVS,
        size=PLANE_SIZE / 2,    # create_grid takes half-size
    )
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj

plane = build_plane()

# ── MATERIAL ─────────────────────────────────────────────────────────────────
def build_material() -> bpy.types.Material:
    """
    Node tree:
      [Script: hs_lava_crack] ──Color──▶ [Principled BSDF] Base Color
                               ──Fac───▶ [Emission] Strength (via Math×3)
                                         [Mix Shader Fac=Fac]
      [Principled BSDF] ──▶ [Mix Shader input 1]
      [Emission]        ──▶ [Mix Shader input 2]
                            [Mix Shader] ──▶ [Material Output]

    The emission layer adds lava glow without affecting the BSDF's roughness
    response. Mixing by Fac ensures only crack-seam pixels glow.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    # OSL Script node
    script_nd = nodes.new('ShaderNodeScript')
    script_nd.mode   = 'INTERNAL'
    script_nd.script = text_block    # triggers OSL parse; sockets auto-generate
    script_nd.location = (-500, 200)

    # Principled BSDF — represents the solid rock surface
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (-100, 200)
    bsdf.inputs['Roughness'].default_value = 0.85
    bsdf.inputs['Specular IOR Level'].default_value = 0.1

    # Emission — represents the glowing lava inside cracks
    emission = nodes.new('ShaderNodeEmission')
    emission.location = (-100, -50)
    emission.inputs['Strength'].default_value = 3.5

    # Mix Shader — blend BSDF (rock) and Emission (lava) by Fac
    mix_sh = nodes.new('ShaderNodeMixShader')
    mix_sh.location = (200, 100)

    # Material Output
    output_nd = nodes.new('ShaderNodeOutputMaterial')
    output_nd.location = (450, 100)

    # ── LINKS ────────────────────────────────────────────────────────────────
    # Force an update so OSL sockets are available by name.
    bpy.context.view_layer.update()

    # Script → BSDF Base Color + Emission Color
    # outputs[0] = Color, outputs[1] = Fac (order matches OSL output declarations)
    links.new(script_nd.outputs[0], bsdf.inputs['Base Color'])
    links.new(script_nd.outputs[0], emission.inputs['Color'])

    # Script Fac → Mix Shader blend factor + rock roughness
    links.new(script_nd.outputs[1], mix_sh.inputs['Fac'])

    # BSDF + Emission → Mix Shader
    links.new(bsdf.outputs['BSDF'], mix_sh.inputs[1])
    links.new(emission.outputs['Emission'], mix_sh.inputs[2])

    # Mix Shader → Output
    links.new(mix_sh.outputs['Shader'], output_nd.inputs['Surface'])

    return mat

mat = build_material()
plane.data.materials.append(mat)

# ── CAMERA ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
cam_obj.location        = CAM_LOCATION
cam_obj.rotation_euler  = CAM_ROTATION
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# ── LIGHTING ─────────────────────────────────────────────────────────────────
# Warm point light above-left to pick out the lava-seam glow contrast.
light_data = bpy.data.lights.new("SunKey", type='POINT')
light_data.energy = LIGHT_ENERGY
light_data.color  = (1.0, 0.92, 0.8)   # slightly warm
light_obj  = bpy.data.objects.new("SunKey", light_data)
light_obj.location = LIGHT_LOC
bpy.context.scene.collection.objects.link(light_obj)

# World background — deep charcoal to separate from lava colour
bpy.context.scene.world.use_nodes = True
bg = bpy.context.scene.world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.01, 0.01, 0.01, 1.0)
    bg.inputs['Strength'].default_value = 0.05

# ── RENDER ───────────────────────────────────────────────────────────────────
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = OUTPUT_FILE
scene.render.image_settings.file_format = 'PNG'

os.makedirs(OUTPUT_DIR, exist_ok=True)
bpy.ops.render.render(write_still=True)
print(f"[blueprint.py] Render complete → {OUTPUT_DIR}osl_lava_0001.png")

# ── SAVE ─────────────────────────────────────────────────────────────────────
save_path = bpy.path.abspath(f"//{BLEND_NAME}.blend")
bpy.ops.wm.save_as_mainfile(filepath=save_path)
print(f"[blueprint.py] Saved → {save_path}")
