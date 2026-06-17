"""
Shader: Procedural Stained Glass — Voronoi Cell Tint + Lead Lines + EEVEE Shadow Caustics
===========================================================================================
Blender 5.1  ·  Category: shading  ·  Licence: CC0

In a medieval stained-glass window the lead came channels (the black lattice holding
the coloured glass pieces) run exactly along the boundaries between glass panes.  Those
boundaries ARE Voronoi cell edges: each piece of glass is cut to cover one Voronoi cell,
and the lead follows the skeleton of the tessellation.  The Blender Voronoi Texture node
with feature='DISTANCE_TO_EDGE' outputs exactly the proximity metric we need — zero at
any cell edge, rising to a local maximum at the cell's interior centroid.  Thresholding
this with a ColorRamp produces a hard lead-line mask.

THIS TUTORIAL vs THE CRACKED-CERAMIC TUTORIAL
  Both use DISTANCE_TO_EDGE, but the physics differ critically:
  • Ceramic: thermal crack → Object-space Voronoi (3D stress field, seam-independent)
  • Stained glass: hand-drawn lead layout → UV-space Voronoi (2D pattern, pane-flat)
  Additionally, this tutorial uses BOTH output sockets of the same Voronoi node:
  • Distance output → ColorRamp → lead-line mask (opacity/closure selector)
  • Color  output → HueSaturation → per-cell colour tint for the glass panes
  No second texture node is needed; the cell colour hash and the boundary distance
  are delivered by the same evaluation, saving a lookup in the shader graph.

WHY MIX SHADER, NOT MIX RGB
  Stained glass requires two physically distinct BSDFs:
    Lead: opaque, matte, sub-metallic sheen  → Principled BSDF Metallic=0.3 Trans=0
    Glass: transmissive, IOR=1.52, coloured  → Principled BSDF Trans=0.92
  Mixing two Principled closures via Mix Shader is energy-conserving in the closure
  domain.  Mixing colour and transmission values inside one Principled via Mix RGB
  would break the closure's energy budget at mixed-mask gradient points: a 0.5-mask
  pixel would receive 50% of the lead roughness response AND 50% of the glass
  transmission response simultaneously, which is physically incoherent.  Mix Shader
  always evaluates only one closure per sample (in Cycles: probabilistic selection;
  in EEVEE: weighted additive blend).

EEVEE SHADOW CAUSTICS (Blender 4.2+ / 5.1)
  True optical caustics (Snell-law focusing bands) require path tracing.  EEVEE Next
  provides an approximation: shadow-pass light is modulated by the material's effective
  alpha from the Transmission Weight.  Setting light.shadow_caustics=True activates
  a kernel that colours the shadow with the filtered transmission tint — the projected
  pattern on the floor approximates the coloured light patches seen below real stained
  glass.  This does NOT reproduce sharp caustic concentration bands; for those, switch
  to Cycles and enable Render Properties → Light Paths → Caustics → Reflective/Refractive.

KEY API NOTES — BLENDER 5.1
  ShaderNodeTexVoronoi:
    voronoi_dimensions = '3D'  (not '2D' — UV feeds Z=0 automatically; '3D' is stable)
    feature             = 'DISTANCE_TO_EDGE'
    outputs: Distance (float), Color (COLOR — random hash per cell index)
  ShaderNodeMixShader:
    inputs[0] = Fac (float, 0→Shader1, 1→Shader2)
    inputs[1] = Shader 1  (at Fac=0)
    inputs[2] = Shader 2  (at Fac=1)
  Material.shadow_method = 'HASHED'  — EEVEE: coloured transmission in shadow pass
  Material.blend_method  = 'BLEND'   — EEVEE: alpha blending for transmission
  light.shadow_caustics  = True      — EEVEE Next: enable caustic shadow kernel

FAILURE MODES
  • Lead lines invisible in Material Preview: switch to Rendered mode; Material Preview
    does not evaluate Mix Shader correctly in all configurations.
  • Shadow caustics absent on floor: verify light.shadow_caustics=True AND
    scene.eevee.use_shadows=True AND material shadow_method='HASHED'.
  • All glass cells appear grey: ColorRamp feeding Mix Shader must not be in EASE
    interpolation mode (use LINEAR or CONSTANT) — EASE blurs the 0/1 boundary.
  • Floor shows hard-edged grey blob instead of coloured caustic: the glass material
    needs blend_method='BLEND' (not 'OPAQUE'); the opaque shadow pass discards tint.
  • AttributeError: 'Light' has no 'shadow_caustics': this attribute was introduced in
    Blender 4.2 (EEVEE Next).  Verify the build is 4.2+.  In older builds, caustics
    require Cycles with Render > Light Paths > Caustics toggled on.
"""

import math
import bpy
import bmesh

# ── Named constants ───────────────────────────────────────────────────────────
OBJ_PANEL    = "stained_glass_panel"
OBJ_FLOOR    = "caustic_floor"
MAT_GLASS    = "M_StainedGlass_Voronoi"
MAT_FLOOR    = "M_CausticFloor"

PANEL_W      = 1.6           # metres — classic lancet window aspect
PANEL_H      = 2.4           # metres
LEAD_SCALE   = 7.0           # ~49 Voronoi cells over UV [0,1]²
LEAD_WIDTH   = 0.07          # ColorRamp stop: 7% of inter-cell radius = lead thickness
LEAD_ROUGH   = 0.50          # oxidised lead came surface roughness
LEAD_COLOR   = (0.03, 0.03, 0.03, 1.0)   # near-black patinated lead

GLASS_IOR    = 1.52          # soda-lime float glass (medieval glass ≈ 1.51–1.53)
GLASS_TRANS  = 0.92          # Transmission Weight (0=opaque, 1=fully transmissive)
GLASS_ROUGH  = 0.025         # hand-blown glass has slight surface undulation

CELL_SAT     = 1.80          # HueSaturation: push the hash toward vivid hues
CELL_VAL     = 0.75          # value cap to avoid fully-white cells

SUN_ENERGY   = 15.0          # Watts: enough to project legible tinted caustic
SUN_ANGLE    = math.radians(40.0)   # elevation above horizontal

GLB_PATH     = "//stained_glass_panel.glb"


# ── Utilities ─────────────────────────────────────────────────────────────────

def purge_orphans() -> None:
    bpy.ops.outliner.orphans_purge(
        do_local_ids=True, do_linked_ids=True, do_recursive=True
    )


def delete_defaults() -> None:
    for name in ("Cube", "Light", "Camera"):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def nn(tree: bpy.types.NodeTree, bl_idname: str, loc: tuple) -> bpy.types.Node:
    n = tree.nodes.new(type=bl_idname)
    n.location = loc
    return n


def lk(tree, a, a_sock, b, b_sock) -> None:
    tree.links.new(a.outputs[a_sock], b.inputs[b_sock])


# ── Glass panel geometry ──────────────────────────────────────────────────────

def build_panel() -> bpy.types.Object:
    """
    Grid primitive with default UV unwrap covers [0,1]² uniformly —
    ideal for UV-space Voronoi where the cells should be evenly distributed
    across the flat window pane regardless of world-scale dimensions.
    """
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=20, y_subdivisions=30, size=1.0)
    obj = bpy.context.active_object
    obj.name = OBJ_PANEL
    obj.scale = (PANEL_W, PANEL_H, 1.0)
    obj.rotation_euler = (math.radians(90), 0, 0)   # stand vertical, face +Y
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    return obj


# ── Stained glass material ────────────────────────────────────────────────────

def build_glass_material() -> bpy.types.Material:
    """
    Single Voronoi node, two output sockets used simultaneously:
      Distance → ColorRamp → lead-line mask → Mix Shader Fac
      Color    → HueSaturation → per-cell tint → Glass BSDF Base Color
    """
    mat = bpy.data.materials.new(MAT_GLASS)
    mat.use_nodes      = True
    mat.blend_method   = 'BLEND'    # EEVEE: enable alpha blending
    mat.shadow_method  = 'HASHED'   # EEVEE: tinted shadow for caustic kernel
    tree = mat.node_tree
    tree.nodes.clear()

    # Texture Coordinate: UV space (glass panels are 2D flat designs)
    tc  = nn(tree, "ShaderNodeTexCoord",     (-700, 100))
    out = nn(tree, "ShaderNodeOutputMaterial", (1100, 0))

    # Voronoi — one node, two outputs
    vor = nn(tree, "ShaderNodeTexVoronoi",   (-480, 100))
    vor.voronoi_dimensions               = '3D'
    vor.feature                          = 'DISTANCE_TO_EDGE'
    vor.distance                         = 'EUCLIDEAN'
    vor.inputs["Scale"].default_value    = LEAD_SCALE
    vor.inputs["Randomness"].default_value = 1.0
    lk(tree, tc, "UV", vor, "Vector")

    # Lead-line mask from Distance: bright at edge (lead), dark in cell (glass)
    ramp = nn(tree, "ShaderNodeValToRGB",    (-240, 220))
    ramp.color_ramp.interpolation    = 'LINEAR'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = (1, 1, 1, 1)   # lead boundary = white
    ramp.color_ramp.elements[1].position = LEAD_WIDTH
    ramp.color_ramp.elements[1].color    = (0, 0, 0, 1)   # glass interior = black
    lk(tree, vor, "Distance", ramp, "Fac")

    # Per-cell colour: Voronoi Color output → boost saturation → vivid hues
    hsv = nn(tree, "ShaderNodeHueSaturation", (-240, -60))
    hsv.inputs["Saturation"].default_value = CELL_SAT
    hsv.inputs["Value"].default_value      = CELL_VAL
    lk(tree, vor, "Color", hsv, "Color")

    # Glass BSDF — transmissive, per-cell tinted
    g_bsdf = nn(tree, "ShaderNodeBsdfPrincipled", (280, 200))
    g_bsdf.inputs["Roughness"].default_value           = GLASS_ROUGH
    g_bsdf.inputs["IOR"].default_value                 = GLASS_IOR
    g_bsdf.inputs["Transmission Weight"].default_value = GLASS_TRANS
    g_bsdf.inputs["Alpha"].default_value               = 1.0 - GLASS_TRANS
    lk(tree, hsv, "Color", g_bsdf, "Base Color")

    # Lead BSDF — opaque, matte, sub-metallic
    l_bsdf = nn(tree, "ShaderNodeBsdfPrincipled", (280, -200))
    l_bsdf.inputs["Base Color"].default_value = LEAD_COLOR
    l_bsdf.inputs["Metallic"].default_value   = 0.30   # oxidised lead has dull sheen
    l_bsdf.inputs["Roughness"].default_value  = LEAD_ROUGH
    l_bsdf.inputs["Transmission Weight"].default_value = 0.0

    # Mix Shader: Fac=0 (glass interior) → g_bsdf; Fac=1 (lead boundary) → l_bsdf
    mix = nn(tree, "ShaderNodeMixShader",  (680, 0))
    lk(tree, ramp,  "Color",  mix, "Fac")   # 1 = lead region, 0 = glass region
    lk(tree, g_bsdf, "BSDF", mix, 1)        # Shader at Fac=0 = glass
    lk(tree, l_bsdf, "BSDF", mix, 2)        # Shader at Fac=1 = lead
    lk(tree, mix,   "Shader", out, "Surface")
    return mat


def build_floor_material() -> bpy.types.Material:
    """Warm stone floor that makes tinted caustic patches legible."""
    mat  = bpy.data.materials.new(MAT_FLOOR)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out  = nn(tree, "ShaderNodeOutputMaterial", (400, 0))
    bsdf = nn(tree, "ShaderNodeBsdfPrincipled", (160, 0))
    bsdf.inputs["Base Color"].default_value = (0.85, 0.82, 0.78, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.80
    lk(tree, bsdf, "BSDF", out, "Surface")
    return mat


# ── Scene assembly ────────────────────────────────────────────────────────────

def build_scene() -> None:
    purge_orphans()
    delete_defaults()

    panel = build_panel()
    panel.data.materials.append(build_glass_material())

    # Receiving floor: sits below panel to catch tinted caustic projection
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0, 1.8, -1.2))
    floor      = bpy.context.active_object
    floor.name = OBJ_FLOOR
    floor.data.materials.append(build_floor_material())

    # Sun light — angled through the panel from behind to project caustics onto floor
    bpy.ops.object.light_add(type='SUN', location=(3, -5, 6))
    sun = bpy.context.active_object
    sun.name                   = "Sun_Caustic"
    sun.rotation_euler         = (math.pi / 2 - SUN_ANGLE, 0, math.radians(-25))
    sun.data.energy            = SUN_ENERGY
    sun.data.angle             = math.radians(2.0)  # soft but directional
    sun.data.shadow_caustics   = True   # EEVEE Next: tinted caustic kernel

    # Camera: frontal position, looking at panel from about 4 m
    bpy.ops.object.camera_add(location=(0, -4.0, 0.3))
    cam = bpy.context.active_object
    cam.name                       = "Camera"
    cam.rotation_euler             = (math.radians(90), 0, 0)
    bpy.context.scene.camera       = cam

    scene                          = bpy.context.scene
    scene.render.engine            = 'BLENDER_EEVEE_NEXT'
    scene.eevee.use_shadows        = True
    scene.eevee.shadow_ray_count   = 2
    scene.eevee.shadow_step_count  = 8
    scene.render.resolution_x      = 1920
    scene.render.resolution_y      = 1080
    scene.render.film_transparent  = False

    # Cycles fallback — accurate transmission caustics via Render > Light Paths
    scene.cycles.samples           = 256
    scene.cycles.use_denoising     = True


def export_glb(path: str) -> None:
    for ob in bpy.data.objects:
        ob.select_set(ob.type == 'MESH')
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_cameras=False,
        export_lights=False,
        use_selection=True,
    )


if __name__ == "__main__":
    build_scene()
    export_glb(bpy.path.abspath(GLB_PATH))
    print("Blueprint complete — stained_glass_panel.glb written.")
