"""
Vector Displacement Map — Multires Sculpt Bake to 32-bit EXR + Cycles Adaptive Subdivision
Blender 5.1 | CC0 | Holoflow Studio

A vector displacement map (VDM) stores per-texel XYZ displacement vectors
in a 32-bit float EXR image.  Unlike a scalar height map (one channel,
signed displacement along the surface normal), a VDM encodes full tangent-space
offset, which means a rivet pressed sideways into a panel face is captured
exactly as-is — the displaced geometry doesn't need to lie on the original
normal cone.

Pipeline overview
─────────────────
  1. Model a sci-fi armour panel at low poly (~800 tris, UV-unwrapped).
  2. Duplicate → apply Displacement modifier (Noise, high amplitude) to
     produce a "sculpted" high-poly source without touching the base mesh.
  3. Add a 32-bit float Non-Color image node to the low-poly material.
  4. Bake DISPLACEMENT (Selected-to-Active) in Cycles → fills the image
     with scalar height encoded in the Red channel, range -scale … +scale.
  5. Save as OpenEXR 32-bit.
  6. On the low-poly add an Adaptive Subdivision modifier and enable Cycles
     Experimental features.
  7. In the material: Vector Displacement node reads the EXR; result feeds
     Material Output Displacement socket.
  8. Render in Cycles — micropolygons are diced per the Dicing Rate.

Export strategy
───────────────
  VDM cannot travel to WebXR / GLB: Three.js / WebGPU have no per-pixel
  geometry displacement at runtime.  Before export:
    a. Switch Material > Settings > Surface > Displacement to "Bump Only".
    b. Disable the Adaptive Subdivision modifier.
    c. Bake a normal map from the displaced Cycles render → include that
       normal map in the GLB (see the batch-bake tutorial for the full pass).

WHY 32-bit float EXR?
  A displacement map holds signed values: negative means inward displacement.
  8-bit PNG saturates at 0; a 16-bit half-float covers -65504 … +65504 but
  its precision near zero (half ULP ≈ 0.0006) loses sub-millimetre detail.
  32-bit float provides ≈ 1.2 × 10⁻⁷ precision across the entire range —
  enough to resolve sub-micron surface detail in a 1 m panel.

WHY Non-Color colorspace on the VDM image?
  Blender applies sRGB gamma decode to all "Colour" images when feeding the
  shader.  A VDM is raw linear data; gamma decode would remap the stored
  displacement values non-linearly, corrupting the geometry.  Non-Color
  bypasses all colorspace transforms.

WHY cage extrusion?
  The bake ray is fired from the low-poly surface by cage_extrusion metres
  before testing intersection with the high-poly.  Too small: rays miss
  surface features that protrude beyond the low-poly boundary (unresolved
  artefacts at high-amplitude rivet edges).  Too large: rays hit the wrong
  high-poly face through the mesh (bleed artefacts at UV seams).
  Rule of thumb: cage = 110 % of the maximum expected displacement amplitude.
"""

import math
import bpy
import bmesh

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
SLUG              = "vdm_armour_panel"
PANEL_W           = 0.32         # metres — panel width
PANEL_H           = 0.22         # metres — panel height
PANEL_CUTS_X      = 8            # edge loop cuts along X
PANEL_CUTS_Y      = 5            # edge loop cuts along Y
DISPLACE_AMP      = 0.015        # metres — peak sculpted displacement amplitude
CAGE_EXTRUSION    = DISPLACE_AMP * 1.1  # 110 % rule
VDM_RES           = 1024         # pixels — square VDM texture
DICING_RATE       = 1.0          # pixels per micropolygon edge (Cycles)
SUBDIV_LEVELS     = 2            # base subdivision before adaptive dicing
NOISE_SCALE_HI    = 12.0         # noise frequency on high-poly
NOISE_SCALE_LO    = 3.5          # low-frequency warp on high-poly
OUTPUT_EXR        = "//vdm_armour_panel.exr"   # saved relative to .blend


# ── SCENE RESET ───────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.engine = "CYCLES"
    # Experimental required for Adaptive Subdivision
    bpy.context.scene.cycles.feature_set = "EXPERIMENTAL"
    bpy.context.scene.cycles.samples = 32


# ── LOW-POLY BASE MESH ────────────────────────────────────────────────────────
def build_base_panel() -> bpy.types.Object:
    """
    Bevelled rectangular panel with a shoulder-indent cutout to suggest
    sci-fi armour geometry.  UV-unwrapped via Smart Project immediately so
    subsequent displacement bakes map correctly.
    """
    me = bpy.data.meshes.new(SLUG)
    bm = bmesh.new()

    # Start: flat grid
    bmesh.ops.create_grid(
        bm, x_segments=PANEL_CUTS_X, y_segments=PANEL_CUTS_Y,
        size=0.5
    )
    # Scale to desired dimensions
    for v in bm.verts:
        v.co.x *= PANEL_W
        v.co.y *= PANEL_H

    # Bevel outer boundary edges for a chamfered look
    boundary_edges = [e for e in bm.edges if e.is_boundary]
    if boundary_edges:
        bmesh.ops.bevel(
            bm, geom=boundary_edges, offset=0.006, offset_type="OFFSET",
            segments=2, profile=0.7, affect="EDGES"
        )

    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Smart UV — angle-based unwrap with a seam margin that avoids VDM bleed
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    return obj


# ── HIGH-POLY SOURCE ──────────────────────────────────────────────────────────
def build_high_poly(low: bpy.types.Object) -> bpy.types.Object:
    """
    Duplicate the low-poly and apply a Displacement modifier driven by a
    multi-frequency Noise texture.  This simulates the result of multires
    sculpting without requiring interactive brush strokes.

    WHY two noise frequencies?
      A single noise frequency produces smooth rolling hills.  Layering a
      high-frequency noise (NOISE_SCALE_HI) onto a low-frequency warp
      (NOISE_SCALE_LO) mimics the structure of real sculpted surfaces:
      large anatomical deformations (e.g. armour contours) punctuated by
      fine surface micro-detail (rivets, wear, stamping).
    """
    bpy.ops.object.select_all(action="DESELECT")
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.duplicate(linked=False)
    hi = bpy.context.active_object
    hi.name = f"{SLUG}_hi"

    # Subdivide high-poly first so displacement has geometry to work with
    sub = hi.modifiers.new("subd_hi", "SUBSURF")
    sub.levels = 4  # 4 levels = 16× face count per quad

    # Low-frequency warp layer
    noise_lo = bpy.data.textures.new(f"{SLUG}_noise_lo", "CLOUDS")
    noise_lo.noise_scale = 1.0 / NOISE_SCALE_LO
    mod_lo = hi.modifiers.new("disp_lo", "DISPLACE")
    mod_lo.texture = noise_lo
    mod_lo.strength = DISPLACE_AMP * 0.4
    mod_lo.mid_level = 0.5

    # High-frequency detail layer
    noise_hi = bpy.data.textures.new(f"{SLUG}_noise_hi", "CLOUDS")
    noise_hi.noise_scale = 1.0 / NOISE_SCALE_HI
    noise_hi.noise_depth = 3
    mod_hi = hi.modifiers.new("disp_hi", "DISPLACE")
    mod_hi.texture = noise_hi
    mod_hi.strength = DISPLACE_AMP * 0.7
    mod_hi.mid_level = 0.5

    # Apply modifiers so the high-poly is a real mesh for bake
    bpy.context.view_layer.objects.active = hi
    for mod in list(hi.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)

    return hi


# ── VDM IMAGE + MATERIAL ──────────────────────────────────────────────────────
def setup_low_poly_material(low: bpy.types.Object) -> bpy.types.Image:
    """
    Create the 32-bit float Non-Color image that will receive the baked
    displacement, then add it as an active Image Texture node in the
    low-poly material so Cycles knows where to write the bake result.
    """
    # 32-bit float, 1 channel is enough for scalar height but we use 4
    # (RGBA) because bpy.data.images.new() does not expose a 1-channel path;
    # only the Red channel is written by DISPLACEMENT bake.
    vdm_img = bpy.data.images.new(
        f"{SLUG}_vdm", VDM_RES, VDM_RES,
        is_data=True, float_buffer=True, alpha=False
    )
    # Non-Color is mandatory — see module docstring.
    vdm_img.colorspace_settings.name = "Non-Color"

    mat = bpy.data.materials.new(f"{SLUG}_mat")
    mat.use_nodes = True
    nt = mat.node_tree

    img_node = nt.nodes.new("ShaderNodeTexImage")
    img_node.image = vdm_img
    img_node.location = (-600, 300)
    # Active image node = bake write target
    nt.nodes.active = img_node

    low.data.materials.append(mat)
    return vdm_img


# ── BAKE ──────────────────────────────────────────────────────────────────────
def bake_displacement(low: bpy.types.Object,
                      hi: bpy.types.Object,
                      vdm_img: bpy.types.Image) -> None:
    """
    Cycles DISPLACEMENT bake: fires rays from low-poly surface inward and
    outward by cage_extrusion, records the high-poly surface offset along
    the normal into the Red channel of vdm_img.

    Selected-to-Active mode requires:
      - hi selected but NOT active
      - low active
    """
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 1   # bake doesn't use path-trace samples

    # Cage extrusion — see module docstring for sizing rationale.
    scene.render.bake.use_cage         = False   # cage object not needed
    scene.render.bake.cage_extrusion   = CAGE_EXTRUSION
    scene.render.bake.use_selected_to_active = True
    scene.render.bake.margin           = 8   # pixel bleed margin

    bpy.ops.object.select_all(action="DESELECT")
    hi.select_set(True)          # source: high-poly (selected but not active)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low  # target: low-poly (active)

    bpy.ops.object.bake(type="DISPLACEMENT")

    # Persist to disk as 32-bit float OpenEXR
    vdm_img.file_format = "OPEN_EXR"
    vdm_img.filepath_raw = OUTPUT_EXR
    vdm_img.save()
    print(f"[blueprint] VDM EXR saved → {OUTPUT_EXR}")


# ── VDM SHADER ────────────────────────────────────────────────────────────────
def build_vdm_shader(low: bpy.types.Object,
                     vdm_img: bpy.types.Image) -> None:
    """
    Vector Displacement node reads the baked EXR and feeds the Material
    Output Displacement socket.  Adaptive Subdivision modifier tells Cycles
    to dice the mesh at render time.

    Displacement node vs Vector Displacement node
    ─────────────────────────────────────────────
    Displacement node    — Height socket (scalar) → offset along mesh normal.
                           Input is a float (one channel).
    Vector Displacement  — Vector socket (RGB) → offset along arbitrary XYZ.
                           For a Cycles DISPLACEMENT bake the offset is
                           always along the normal (scalar packed in R), so
                           Vector Displacement in Tangent Space mode with
                           a value re-encoded as a 1D vector is equivalent.
                           Use Vector Displacement when the source VDM was
                           produced by a tool (ZBrush, Mudbox) that stores
                           full XYZ tangent-space vectors — Blender's
                           DISPLACEMENT bake stores only R=height; for a
                           pure-Blender workflow the Displacement node is
                           semantically cleaner, but Vector Displacement
                           is shown here as the general-purpose path.
    """
    mat = low.data.materials[0]
    nt  = mat.node_tree

    # Clear default nodes, keep the image node we set up for bake.
    img_node = next(n for n in nt.nodes if n.type == "TEX_IMAGE")
    out_node = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    pbr_node = next(
        (n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None
    )

    if pbr_node is None:
        pbr_node = nt.nodes.new("ShaderNodeBsdfPrincipled")
        pbr_node.location = (-200, 0)

    # Base colour — muted gunmetal
    pbr_node.inputs["Base Color"].default_value = (0.14, 0.15, 0.17, 1.0)
    pbr_node.inputs["Metallic"].default_value   = 0.9
    pbr_node.inputs["Roughness"].default_value  = 0.4
    nt.links.new(pbr_node.outputs["BSDF"], out_node.inputs["Surface"])

    # Vector Displacement chain
    vdisp_node = nt.nodes.new("ShaderNodeVectorDisplacement")
    vdisp_node.space = "TANGENT"   # matches Blender DISPLACEMENT bake space
    vdisp_node.location = (-300, -250)
    # Midlevel = 0.0 because DISPLACEMENT bake is already centred at zero.
    vdisp_node.inputs["Midlevel"].default_value = 0.0
    vdisp_node.inputs["Scale"].default_value    = 1.0

    nt.links.new(img_node.outputs["Color"], vdisp_node.inputs["Vector"])
    nt.links.new(vdisp_node.outputs["Displacement"],
                 out_node.inputs["Displacement"])

    # Material displacement mode must be set to use actual displacement geometry
    mat.cycles.displacement_method = "DISPLACEMENT"

    # Adaptive Subdivision modifier
    sub = low.modifiers.new("adpt_sub", "SUBSURF")
    sub.subdivision_type      = "CATMULL_CLARK"
    sub.levels                = SUBDIV_LEVELS
    sub.use_adaptive_subdivision = True  # WHY: camera-relative dicing
    bpy.context.scene.cycles.dicing_rate = DICING_RATE

    print("[blueprint] VDM shader + Adaptive Subdivision configured.")


# ── CAMERA + LIGHTING ─────────────────────────────────────────────────────────
def setup_scene_elements() -> None:
    bpy.ops.object.camera_add(location=(0, -0.6, 0.1))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(90), 0, 0)
    cam.data.lens = 85
    bpy.context.scene.camera = cam

    # Key area light — raking angle to emphasise displacement silhouettes
    bpy.ops.object.light_add(type="AREA", location=(0.4, -0.3, 0.35))
    key = bpy.context.active_object
    key.data.energy = 120
    key.data.size   = 0.3
    key.rotation_euler = (math.radians(55), 0, math.radians(25))


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()
    low    = build_base_panel()
    hi     = build_high_poly(low)
    vdm    = setup_low_poly_material(low)
    bake_displacement(low, hi, vdm)
    build_vdm_shader(low, vdm)
    setup_scene_elements()

    # Hide high-poly after bake — it's a helper mesh, not the deliverable
    hi.hide_render  = True
    hi.hide_viewport = True

    print("[blueprint] Vector Displacement Map pipeline complete.")
    print(f"  Base panel : {low.name}")
    print(f"  VDM EXR   : {OUTPUT_EXR}")
    print("  Next step  : Render › F12 (Cycles, Experimental) to see displaced geometry.")
    print("  GLB export : switch mat displacement to Bump Only; disable adpt_sub first.")


if __name__ == "__main__":
    main()
