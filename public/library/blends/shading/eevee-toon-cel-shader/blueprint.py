"""
EEVEE Next Toon / Cel-Shader Node Group
=======================================
Blender 5.1 | Holoflow Studio | CC0

Builds a reusable ShaderNodeTree ('HoloflowToonShader') that implements a
two-band + rim-light cel shader entirely within EEVEE Next. The group is
applied to a flat-shaded icosphere as a standalone demonstration.

Core technique:
  Diffuse BSDF → Shader to RGB → ColorRamp (CONSTANT) → hard toon bands
  Geometry.Incoming · Normal → shift → rim mask → blend rim colour on top
  Emission shader output → renders the computed colour without a PBR pass

WHY Shader to RGB is EEVEE-only:
  EEVEE evaluates diffuse shading analytically per fragment and exposes the
  resulting 0–1 intensity factor via the Shader to RGB node. Cycles has no
  such concept — it accumulates stochastic path-traced radiance; the BSDF
  is a probability distribution, not a scalar. Shader to RGB on a Cycles
  render returns black. Alternative Cycles approaches (Facing driver, Light
  Path + custom AOV) are noisier and require post-processing passes.

WHY CONSTANT interpolation on ColorRamp:
  LINEAR maps 0–1 diffuse factor to a smooth gradient, which is physically
  plausible shading, not toon shading. CONSTANT snaps every sample to the
  nearest colour stop to its LEFT, creating step-function bands with a hard
  edge at each stop position. Two stops (shadow at 0.0, lit at TOON_STEP)
  give the classic cel look. A third stop near 0.95 adds a specular glint.

WHY Emission as the final BSDF:
  The toon colour output from the ColorRamp is already the intended screen
  colour — no further lighting response is desired. An Emission shader
  emits that colour directly without a second diffuse evaluation. Plugging
  the toon colour into a Principled BSDF Base Colour would apply a second
  EEVEE lighting pass, double-shading the surface and destroying the
  flat-band look.

WHY Geometry.Incoming for the rim:
  Geometry.Incoming in EEVEE shader context is the incident ray direction
  pointing FROM the camera TOWARD the surface (normalised). For a surface
  facing the camera: Normal points toward the camera, Incoming points away,
  dot = –1. At the silhouette edge both vectors are perpendicular, dot = 0.
  Adding 1.0 shifts the range to [0, 1] — 0 at front, 1 at silhouette.
  Feeding that into a CONSTANT ColorRamp with threshold = RIM_THRESHOLD
  creates a hard rim band of configurable width along the silhouette.

WHY node groups for reuse:
  bpy.data.node_groups['HoloflowToonShader'] is a single datablock. Any
  ShaderNodeGroup node in any material can point to it. Changing a stop
  colour on the group updates every material simultaneously — useful for
  a studio-wide palette shift.

Blender 5.1 API notes:
  tree.interface.new_socket() — 4.0+ API; tree.inputs.new() was removed.
  ShaderNodeVectorMath DOT_PRODUCT — scalar result at outputs['Value'] (index 1),
    NOT outputs['Vector'] (index 0).
  ColorRamp.elements[0]/[1] pre-created; call elements.new(pos) for a third stop.

glTF note: Emission maps to KHR_materials_emissive_strength; bake to texture
  for WebXR PBR compliance (see texture-baking-normal-ao tutorial).

Run headless:
    blender --background --python blueprint.py
"""

from pathlib import Path
import bpy
import bmesh

# ─── parameters ───────────────────────────────────────────────────────────────
GROUP_NAME    = "HoloflowToonShader"
MAT_NAME      = "ToonDemoMaterial"
OBJ_NAME      = "toon_demo_sphere"
SHADOW_COLOUR = (0.04, 0.05, 0.18, 1.0)   # deep navy shadow band
LIT_COLOUR    = (0.25, 0.55, 0.95, 1.0)   # bright cobalt lit band
RIM_COLOUR    = (0.95, 0.95, 1.00, 1.0)   # near-white rim highlight
TOON_STEP     = 0.45    # ColorRamp position of the shadow/lit boundary
RIM_THRESHOLD = 0.25    # ColorRamp position of the rim edge (0=thin, 0.5=wide)
OUT_DIR       = Path(__file__).parent
GLB_OUT       = OUT_DIR / "toon_demo.glb"
BLEND_OUT     = OUT_DIR / "toon_demo.blend"


# ─── scene setup ──────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"


def setup_lighting() -> None:
    # Key light at 45° — drives the Shader to RGB diffuse factor; a sharp
    # angle = narrow shadow, wide lit zone = more cobalt on the sphere.
    bpy.ops.object.light_add(type="SUN", location=(5, -5, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.data.angle  = 0.01  # nearly parallel rays → sharp toon shadow edge


# ─── node group ───────────────────────────────────────────────────────────────
def build_toon_shader_group() -> bpy.types.NodeTree:
    """
    Create (or recreate) the HoloflowToonShader ShaderNodeTree.

    Node graph:
      [GroupInput] ─Base Colour─► [DiffuseBSDF] ─► [ShaderToRGB]
                                                           │
                                               [ColorRamp CONSTANT]  ← toon ramp
                                                           │ Color
                                               [MixRGB Color1]
      [Geometry] ─Normal──► [DotProduct] ─► [Math +1] ─► [ColorRamp CONSTANT]
      [Geometry] ─Incoming──►│                             │ Alpha = rim mask
                                               [MixRGB Fac=rim_mask, Color2=Rim Colour]
                                                           │ Color
                                               [Emission] ─► [GroupOutput]
    """
    if GROUP_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GROUP_NAME])

    tree  = bpy.data.node_groups.new(type="ShaderNodeTree", name=GROUP_NAME)
    nodes = tree.nodes
    links = tree.links

    # ── interface sockets (4.0+ API) ──────────────────────────────────────────
    tree.interface.new_socket("Shader",        in_out="OUTPUT", socket_type="NodeSocketShader")
    tree.interface.new_socket("Base Colour",   in_out="INPUT",  socket_type="NodeSocketColor")
    tree.interface.new_socket("Shadow Colour", in_out="INPUT",  socket_type="NodeSocketColor")
    tree.interface.new_socket("Lit Colour",    in_out="INPUT",  socket_type="NodeSocketColor")
    tree.interface.new_socket("Rim Colour",    in_out="INPUT",  socket_type="NodeSocketColor")

    s_step = tree.interface.new_socket("Toon Step", in_out="INPUT", socket_type="NodeSocketFloat")
    s_step.default_value = TOON_STEP
    s_step.min_value = 0.01
    s_step.max_value = 0.99

    s_rim = tree.interface.new_socket("Rim Threshold", in_out="INPUT", socket_type="NodeSocketFloat")
    s_rim.default_value = RIM_THRESHOLD
    s_rim.min_value = 0.0
    s_rim.max_value = 0.99

    # ── nodes ─────────────────────────────────────────────────────────────────
    n_in  = nodes.new("NodeGroupInput");   n_in.location  = (-900,  100)
    n_out = nodes.new("NodeGroupOutput");  n_out.location  = ( 500,  100)

    n_diff = nodes.new("ShaderNodeBsdfDiffuse")
    n_diff.location = (-620, 260)

    # Shader to RGB — the EEVEE-only diffuse-factor extractor
    n_s2rgb = nodes.new("ShaderNodeShaderToRGB")
    n_s2rgb.location = (-380, 260)

    # Toon ramp — CONSTANT gives hard step edges
    n_toon_ramp = nodes.new("ShaderNodeValToRGB")
    n_toon_ramp.location = (-160, 260)
    cr = n_toon_ramp.color_ramp
    cr.interpolation = "CONSTANT"
    cr.elements[0].position = 0.0
    cr.elements[0].color    = SHADOW_COLOUR
    cr.elements[1].position = TOON_STEP
    cr.elements[1].color    = LIT_COLOUR

    # Geometry — supplies Normal and Incoming per-fragment
    n_geo = nodes.new("ShaderNodeNewGeometry")
    n_geo.location = (-900, -160)

    # Dot product: Normal · Incoming → scalar in [−1, 0] for front-facing
    n_dot = nodes.new("ShaderNodeVectorMath")
    n_dot.operation = "DOT_PRODUCT"
    n_dot.location  = (-620, -160)

    # Shift [−1, 0] → [0, 1]: 0 = front-facing, 1 = silhouette
    n_add = nodes.new("ShaderNodeMath")
    n_add.operation = "ADD"
    n_add.inputs[1].default_value = 1.0
    n_add.location = (-380, -160)

    # Rim ramp — CONSTANT, threshold = RIM_THRESHOLD
    n_rim_ramp = nodes.new("ShaderNodeValToRGB")
    n_rim_ramp.location = (-160, -160)
    cr2 = n_rim_ramp.color_ramp
    cr2.interpolation = "CONSTANT"
    cr2.elements[0].position = 0.0
    cr2.elements[0].color    = (0.0, 0.0, 0.0, 1.0)  # no rim at front
    cr2.elements[1].position = RIM_THRESHOLD
    cr2.elements[1].color    = (1.0, 1.0, 1.0, 1.0)  # full rim at silhouette

    # MixRGB — blends toon colour (Color1) toward rim colour (Color2)
    n_mix = nodes.new("ShaderNodeMixRGB")
    n_mix.blend_type = "MIX"
    n_mix.use_clamp  = True
    n_mix.location   = (60, 160)

    # Emission — outputs computed colour without a second lighting evaluation
    n_emit = nodes.new("ShaderNodeEmission")
    n_emit.inputs["Strength"].default_value = 1.0
    n_emit.location = (280, 160)

    # ── links ─────────────────────────────────────────────────────────────────
    links.new(n_in.outputs["Base Colour"],   n_diff.inputs["Color"])
    links.new(n_diff.outputs["BSDF"],        n_s2rgb.inputs["Shader"])
    links.new(n_s2rgb.outputs["Color"],      n_toon_ramp.inputs["Fac"])
    links.new(n_toon_ramp.outputs["Color"],  n_mix.inputs["Color1"])

    links.new(n_geo.outputs["Normal"],       n_dot.inputs[0])
    links.new(n_geo.outputs["Incoming"],     n_dot.inputs[1])
    links.new(n_dot.outputs["Value"],        n_add.inputs[0])  # scalar output
    links.new(n_add.outputs["Value"],        n_rim_ramp.inputs["Fac"])
    links.new(n_rim_ramp.outputs["Alpha"],   n_mix.inputs["Fac"])
    links.new(n_in.outputs["Rim Colour"],    n_mix.inputs["Color2"])

    links.new(n_mix.outputs["Color"],        n_emit.inputs["Color"])
    links.new(n_emit.outputs["Emission"],    n_out.inputs["Shader"])

    return tree


# ─── material application ─────────────────────────────────────────────────────
def apply_toon_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(name=MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    n_mat_out = nodes.new("ShaderNodeOutputMaterial")
    n_mat_out.location = (300, 0)

    n_group = nodes.new("ShaderNodeGroup")
    n_group.node_tree = bpy.data.node_groups[GROUP_NAME]
    n_group.location  = (0, 0)

    # Per-material overrides; editing these doesn't touch the shared group
    n_group.inputs["Base Colour"].default_value   = LIT_COLOUR
    n_group.inputs["Shadow Colour"].default_value = SHADOW_COLOUR
    n_group.inputs["Lit Colour"].default_value    = LIT_COLOUR
    n_group.inputs["Rim Colour"].default_value    = RIM_COLOUR
    n_group.inputs["Toon Step"].default_value     = TOON_STEP
    n_group.inputs["Rim Threshold"].default_value = RIM_THRESHOLD

    links.new(n_group.outputs["Shader"], n_mat_out.inputs["Surface"])

    obj.data.materials.clear()
    obj.data.materials.append(mat)


# ─── mesh ─────────────────────────────────────────────────────────────────────
def build_sphere() -> bpy.types.Object:
    # icosphere subdivisions=1 → 20 flat triangles: faceted silhouette under
    # flat shading, which exaggerates the toon shadow edge at polygon borders.
    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = False  # flat shading per polygon
    mesh.update()
    return obj


# ─── export ───────────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="WEBP",
        export_normals=True,
        # No Draco: icosphere has only 20 faces; compression overhead > gain
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))


# ─── entry point ──────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    setup_lighting()
    build_toon_shader_group()
    sphere = build_sphere()
    apply_toon_material(sphere)
    export_glb(sphere)
    print(f"[toon-shader] GLB   → {GLB_OUT}")
    print(f"[toon-shader] Blend → {BLEND_OUT}")


if __name__ == "__main__":
    main()
