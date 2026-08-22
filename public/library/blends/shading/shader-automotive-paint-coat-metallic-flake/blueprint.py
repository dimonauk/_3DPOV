"""
AUTOMOTIVE PAINT — Principled BSDF v2 Three-Layer System (Blender 5.1)
======================================================================
Authentic automotive paint is a three-layer optical system: a pigmented
base coat, a sparse layer of metallic or pearlescent flakes suspended in
a binder resin, and a smooth glass-like clear coat lacquer on top.

Each layer has its own BRDF:
  Base coat  — Lambertian + weak specular, absorbs most light (high roughness)
  Flake layer — perfect or near-perfect mirrors tilted at random angles
                (metallic = 1, roughness ≈ 0.06–0.12)
  Clear coat  — smooth dielectric (IOR 1.45–1.52, roughness < 0.05)
                adds a floating specular highlight ABOVE the flake sparkle

Blender 5.1's Principled BSDF v2 exposes explicit Coat Weight, Coat IOR,
Coat Roughness, and Coat Tint sockets — you no longer need to stack two
separate BSDF nodes through a Mix Shader. The Coat lobe sits on top of
everything else: its contribution is computed AFTER the base + flake
sub-surface interaction, matching the physical layering order.

The metallic flake layer is synthesised entirely from a Noise Texture:
  • High-frequency noise (scale ≈ 85) thresholded by a sharp Color Ramp
    → discrete binary mask (flake = 1, base coat = 0)
  • Same noise (offset slightly so orientation ≠ coverage) feeds a Bump
    node → each visible flake has its normal tilted a few degrees relative
    to the macro surface → sparkle shifts direction as the viewpoint changes

This technique is resolution-independent and requires zero texture images.

Author  : Holoflow Studio — CC0 1.0 Universal
Blender : 5.1
Usage   : Run in Blender's Scripting workspace with an empty scene.
          Produces: automotive_paint.blend + automotive_paint.glb
"""

import bpy
import bmesh

# ─── TUNABLE CONSTANTS ────────────────────────────────────────────────────────

BASE_COLOR         = (0.62, 0.03, 0.02, 1.0)  # candy-red pigment
BASE_ROUGHNESS     = 0.48                       # pigment layer roughness
BASE_METALLIC      = 0.0                        # base coat is dielectric

FLAKE_COVERAGE     = 0.72                       # Color Ramp white point (0–1)
FLAKE_ROUGHNESS    = 0.07                       # mirror-like flake reflectance
FLAKE_METALLIC     = 1.0                        # pure metal at each flake
FLAKE_NOISE_SCALE  = 88.0                       # flake density (higher = finer)
FLAKE_BUMP_DIST    = 0.003                      # normal tilt in metres
FLAKE_BUMP_STRENGTH = 1.8                       # Bump node strength multiplier

COAT_WEIGHT        = 1.0                        # clear coat opacity (always 1)
COAT_IOR           = 1.50                       # lacquer index of refraction
COAT_ROUGHNESS     = 0.018                      # mirror-smooth wet lacquer
COAT_TINT          = (1.0, 1.0, 1.0)           # neutral (tinted = add pigment here)

PANEL_X            = 1.20                       # door panel width  (m)
PANEL_Y            = 0.60                       # door panel height (m)
PANEL_Z            = 0.010                      # panel thickness   (m)
SUBDIV_RENDER      = 2
SUBDIV_VIEWPORT    = 1

SCENE_NAME         = "automotive_paint_scene"
MAT_NAME           = "M_AutomotivePaint"
MESH_NAME          = "BodyPanel"

# ─── SCENE SETUP ─────────────────────────────────────────────────────────────

def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.lights) + list(bpy.data.cameras):
        block.user_clear()
        bpy.data.batch_remove([block])

def build_panel() -> bpy.types.Object:
    """Thin rectangular panel with SubDiv modifier — simulates a car door section."""
    mesh = bpy.data.meshes.new(MESH_NAME)
    obj  = bpy.data.objects.new(MESH_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=1.0)
    # Grid defaults to Z-up square; scale to panel proportions
    bmesh.ops.scale(bm, vec=(PANEL_X * 0.5, PANEL_Y * 0.5, 1.0),
                    verts=bm.verts)
    bm.to_mesh(mesh)
    bm.free()

    # Extrude thickness: solidify is cleaner than manual extrusion for a flat panel
    sol = obj.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness    = PANEL_Z
    sol.offset       = 1.0          # extrude toward +Z only
    sol.use_even_offset = True

    sub = obj.modifiers.new("SubDiv", "SUBSURF")
    sub.levels         = SUBDIV_VIEWPORT
    sub.render_levels  = SUBDIV_RENDER
    sub.quality        = 3

    return obj

# ─── MATERIAL ─────────────────────────────────────────────────────────────────

def build_material() -> bpy.types.Material:
    """
    Node tree (all via bpy.data API — no ops):

    ┌──────────────────┐     ┌────────────────────────┐
    │ Noise (coverage) │─────│ ColorRamp (step)       │
    │   Scale=88       │     │  [0→0.72]: BLACK       │
    │                  │     │  [0.72→1]: WHITE       │
    └──────────────────┘     └───────────┬────────────┘
                                          │  Metallic ──────────────────┐
    ┌──────────────────┐                  │  Factor → MixRGB (roughness) │
    │ Noise (orient)   │──── Bump ───────►│  Normal                      │
    │   Scale=88 +0.2  │     Dist=0.003   │                              │
    └──────────────────┘     Str=1.8      │       Principled BSDF v2     │
                                          │  Base Color = candy red      │
    ┌──────────────────┐                  │  Roughness = MixRGB output   │
    │ ColorRamp(rough) │──────────────────│    (base=0.48, flake=0.07)   │
    │  via same mask   │                  │  Metallic = Ramp output      │
    └──────────────────┘                  │  Coat Weight  = 1.0          │
                                          │  Coat IOR     = 1.50         │
                                          │  Coat Rough   = 0.018        │
                                          └──────────────────────────────┘
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    def N(t, x, y, **kw):
        n = nodes.new(t)
        n.location = (x, y)
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    out   = N("ShaderNodeOutputMaterial",  700, 0)
    bsdf  = N("ShaderNodeBsdfPrincipled",  200, 0)

    # ── Noise A: flake coverage / metallic mask ──
    noise_cov = N("ShaderNodeTexNoise", -700, 200)
    noise_cov.inputs["Scale"].default_value    = FLAKE_NOISE_SCALE
    noise_cov.inputs["Detail"].default_value   = 2.0
    noise_cov.inputs["Roughness"].default_value = 0.5
    noise_cov.inputs["Distortion"].default_value = 0.15

    # Step Color Ramp — hard threshold produces discrete flakes, not a gradient
    ramp_metal = N("ShaderNodeValToRGB", -350, 200)
    ramp_metal.color_ramp.interpolation = "CONSTANT"  # hard step = crisp flake edges
    ramp_metal.color_ramp.elements[0].position = 0.0
    ramp_metal.color_ramp.elements[0].color    = (0, 0, 0, 1)
    ramp_metal.color_ramp.elements[1].position = FLAKE_COVERAGE
    ramp_metal.color_ramp.elements[1].color    = (1, 1, 1, 1)

    # ── Noise B: flake orientation (offset so coverage ≠ orientation) ──
    noise_ori = N("ShaderNodeTexNoise", -700, -100)
    noise_ori.inputs["Scale"].default_value     = FLAKE_NOISE_SCALE
    noise_ori.inputs["Detail"].default_value    = 0.0   # single octave = smooth tilt
    noise_ori.inputs["Roughness"].default_value = 0.5
    # Offset w-coordinate: ensures noise_ori ≠ noise_cov despite same scale
    noise_ori.inputs["W"].default_value = 0.27

    bump = N("ShaderNodeBump", -150, -100)
    bump.inputs["Strength"].default_value = FLAKE_BUMP_STRENGTH
    bump.inputs["Distance"].default_value = FLAKE_BUMP_DIST

    # ── Roughness blend: base coat roughness → flake roughness based on mask ──
    mix_rough = N("ShaderNodeMix", -150, 300)
    mix_rough.data_type = "FLOAT"
    mix_rough.inputs["A"].default_value = BASE_ROUGHNESS   # non-flake roughness
    mix_rough.inputs["B"].default_value = FLAKE_ROUGHNESS  # flake roughness

    # ── Wire up ──
    links.new(noise_cov.outputs["Fac"],   ramp_metal.inputs["Fac"])
    links.new(ramp_metal.outputs["Color"], bsdf.inputs["Metallic"])
    links.new(ramp_metal.outputs["Fac"],   mix_rough.inputs["Factor"])
    links.new(mix_rough.outputs["Result"], bsdf.inputs["Roughness"])
    links.new(noise_ori.outputs["Fac"],   bump.inputs["Height"])
    links.new(bump.outputs["Normal"],     bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"],       out.inputs["Surface"])

    # ── Base colour ──
    bsdf.inputs["Base Color"].default_value = BASE_COLOR
    bsdf.inputs["Metallic"].default_value   = BASE_METALLIC  # overridden by ramp

    # ── Coat layer (Principled BSDF v2 sockets) ──
    bsdf.inputs["Coat Weight"].default_value    = COAT_WEIGHT
    bsdf.inputs["Coat IOR"].default_value       = COAT_IOR
    bsdf.inputs["Coat Roughness"].default_value = COAT_ROUGHNESS
    # Coat Tint: neutral white = no tint
    bsdf.inputs["Coat Tint"].default_value      = (*COAT_TINT, 1.0)

    return mat

# ─── LIGHTING ─────────────────────────────────────────────────────────────────

def build_lights():
    """
    Tight, high-energy key light: small area = sharp specular; angled to
    graze the panel so both the coat highlight and individual flake sparkle
    are simultaneously visible in a single camera position.
    Studio fill prevents absolute black in shadows.
    """
    def add_light(name, kind, energy, size, loc, rot_deg):
        bpy.ops.object.light_add(type=kind, location=loc)
        l = bpy.context.active_object
        l.name = name
        l.data.energy = energy
        if kind == "AREA":
            l.data.size = size
        import math
        l.rotation_euler = [math.radians(d) for d in rot_deg]
        return l

    # Key: compact area, high energy, raked from upper-left
    add_light("Key", "AREA",  800, 0.5, ( 1.2, -1.8, 1.5), ( 55,  0,  30))
    # Fill: large soft area, low energy, opposite side
    add_light("Fill","AREA",  100, 2.0, (-1.5,  0.8, 1.0), ( 40,  0, -40))
    # Rim: spot from behind/above — catches coat gloss across top edge
    add_light("Rim", "SPOT",  400, 0.1, ( 0.0,  2.0, 1.8), (-60,  0,   0))

def build_camera():
    bpy.ops.object.camera_add(location=(0.0, -1.6, 0.45))
    cam = bpy.context.active_object
    import math
    cam.rotation_euler = [math.radians(80), 0, 0]
    cam.data.lens = 85          # telephoto compresses panel — coat highlight stays sharp
    bpy.context.scene.camera = cam
    return cam

# ─── RENDER CONFIG ────────────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 256
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    # Coat highlight needs many bounces to resolve correctly
    sc.cycles.max_bounces        = 12
    sc.cycles.diffuse_bounces    = 4
    sc.cycles.glossy_bounces     = 8
    sc.cycles.transmission_bounces = 12

# ─── GLB EXPORT ───────────────────────────────────────────────────────────────

def export_glb(panel_obj, out_path="//automotive_paint.glb"):
    """
    glTF KHR_materials_clearcoat maps to Principled BSDF Coat layer.
    Blender's exporter reads Coat Weight, Coat Roughness, and Coat IOR
    automatically.  Metallic flake encodes as Metallic texture if baked
    (not auto-baked here — use the Texture Baking Normal/AO tutorial first).
    Export includes KHR_materials_clearcoat extension automatically.
    """
    bpy.ops.object.select_all(action="DESELECT")
    panel_obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath        = bpy.path.abspath(out_path),
        export_format   = "GLB",
        use_selection   = True,
        export_apply    = True,
        export_materials= "EXPORT",
        export_colors   = True,
        export_image_format = "WEBP",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
    )

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    reset_scene()
    panel = build_panel()
    mat   = build_material()
    panel.data.materials.append(mat)
    build_lights()
    build_camera()
    configure_render()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//automotive_paint.blend"))
    export_glb(panel)
    print("Done: automotive_paint.blend + automotive_paint.glb written.")

main()
