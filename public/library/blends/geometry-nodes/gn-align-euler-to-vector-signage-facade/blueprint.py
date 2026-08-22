"""
GN Align Euler to Vector — Normal-Aligned Panel Instances on a Curved Façade
=============================================================================
Blender 5.1 · CC0 · Holoflow Studio

Technique:
  FunctionNodeAlignEulerToVector rotates an Euler rotation so that one of the
  instance's local axes (X, Y, or Z — your choice) points along a given world
  vector, whilst a second "pivot" axis controls the roll. Understanding which
  axis to pick requires knowing your instance's default local frame — the most
  common point of confusion for beginners.

  Demo: a 16-sided cylindrical building. Flat sign panels are distributed on
  its outer faces via Distribute Points on Faces. Face Normal gives the outward
  direction per point. AlignEulerToVector (axis=Y, pivot_axis=Z) rotates each
  panel so its LOCAL +Y faces outward and its LOCAL +Z stays upright. The
  result: all panels face the camera regardless of which face of the cylinder
  they sit on, without any manual rotation or UV trick.

  Three canonical axis configurations:
  1. axis=Z, pivot=AUTO  — instance stands perpendicular to surface (normal=up).
                           Use for rocks, trees, debris on terrain.
  2. axis=Y, pivot=Z     — instance faces outward, stays upright.
                           Use for wall panels, signs, mounted fixtures.
  3. axis=X, pivot=Y     — instance aligns along the face tangent.
                           Use for edge-following cables, seam strips.

  pivot_axis=Z works for vertical surfaces (normals are horizontal); for terrain
  (normals mostly upward) use pivot_axis=AUTO to avoid gimbal collapse when a
  face normal is exactly parallel to the pivot axis.

Blender 5.1 API:
  bl_idname   : FunctionNodeAlignEulerToVector
  .axis       : 'X' | 'Y' | 'Z'
  .pivot_axis : 'AUTO' | 'X' | 'Y' | 'Z'
  inputs[0]   : Rotation (Vector / Euler) — starting orientation, usually zero
  inputs[1]   : Factor   (Float 0-1)     — blend; animate for gradual snap-on
  inputs[2]   : Vector   (Vector)         — target direction in world space
  outputs[0]  : Rotation (Vector / Euler) — aligned Euler, ready for Instance on Points

Outside sources:
  Blender Manual — Align Euler to Vector
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/
      utilities/rotation/align_euler_to_vector.html
    CC-BY-SA 4.0 · Blender Foundation
  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev  (GN tree construction patterns)
"""

import bpy
import bmesh
import math

# ── Parameters ─────────────────────────────────────────────────────────────
FACADE_NAME     = "SignageFacade"
PANEL_NAME      = "SignPanel_Instance"
NG_NAME         = "GN_AlignEulerSignage"
MA_FACADE_NAME  = "Facade_Concrete"
MA_PANEL_NAME   = "Panel_Emissive"
FACADE_VERTS    = 16       # sides on the cylinder
FACADE_HEIGHT   = 6.0      # metres
FACADE_RADIUS   = 2.5      # metres
PANEL_W         = 0.28     # panel width (local X)
PANEL_H         = 0.45     # panel height (local Z)
PANEL_D         = 0.025    # panel depth / thickness (local Y, outward)
PANEL_OFFSET    = 0.015    # gap between panel face and wall surface (metres)
POISSON_DIST    = 1.1      # minimum centre-to-centre distance between panels
POISSON_SEED    = 42
GLB_PATH        = "//signage_facade.glb"

# ── 1. Scene reset ─────────────────────────────────────────────────────────
def clean_scene():
    for col in (bpy.data.objects, bpy.data.meshes,
                bpy.data.node_groups, bpy.data.materials):
        for item in list(col):
            if item.name.startswith((FACADE_NAME, PANEL_NAME, NG_NAME,
                                     MA_FACADE_NAME, MA_PANEL_NAME)):
                col.remove(item, do_unlink=True)

# ── 2. Façade cylinder ─────────────────────────────────────────────────────
def make_facade():
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=FACADE_VERTS,
        depth=FACADE_HEIGHT,
        radius=FACADE_RADIUS,
        end_fill_type="NGON",
        location=(0.0, 0.0, FACADE_HEIGHT * 0.5),
    )
    obj = bpy.context.active_object
    obj.name = FACADE_NAME
    # Apply scale so face area is in world metres — required for density-based
    # distribution to work consistently across differently-scaled objects.
    bpy.ops.object.transform_apply(scale=True)

    # Delete end caps; we only want side faces for panel distribution.
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.faces.ensure_lookup_table()
    caps = [f for f in bm.faces if abs(f.normal.z) > 0.9]
    bmesh.ops.delete(bm, geom=caps, context="FACES")
    bm.to_mesh(me)
    bm.free()
    me.update()
    return obj

# ── 3. Panel instance object ───────────────────────────────────────────────
def make_panel():
    """Thin box: X=width, Z=height, Y=depth (outward-facing axis).
    Local +Y is the panel's FRONT face normal. AlignEulerToVector with
    axis='Y' rotates the instance so local +Y matches each face normal."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(100.0, 0.0, 0.0))
    ob = bpy.context.active_object
    ob.name = PANEL_NAME
    # Scale the unit cube to actual panel dimensions.
    ob.scale = (PANEL_W, PANEL_D, PANEL_H)
    bpy.ops.object.transform_apply(scale=True)
    # Shift the panel so its back face sits at Y=0 (flush contact point).
    # After alignment, the front face protrudes PANEL_D into world space.
    ob.location.y = PANEL_D * 0.5 + PANEL_OFFSET
    bpy.ops.object.transform_apply(location=True)
    ob.hide_render = False
    return ob

# ── 4. GN tree ─────────────────────────────────────────────────────────────
def build_gn_tree(panel_ob):  # noqa: max-complexity
    ng = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")

    ng.interface.new_socket("Geometry", in_out="INPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    s_dist = ng.interface.new_socket("Panel Spacing", in_out="INPUT",
                                     socket_type="NodeSocketFloat")
    s_dist.default_value = POISSON_DIST
    s_dist.subtype = "DISTANCE"

    ns = ng.nodes
    lk = ng.links.new

    n_in  = ns.new("NodeGroupInput");  n_in.location  = (-1200, 0)
    n_out = ns.new("NodeGroupOutput"); n_out.location = (1200, 0)

    # ── Distribute points on the façade faces ─────────────────────────────
    # POISSON_DISK gives an even, non-overlapping distribution.
    # Distance Min = Panel Spacing socket → user controls density interactively.
    n_dist = ns.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method = "POISSON_DISK"
    n_dist.location = (-900, 0)
    n_dist.inputs["Seed"].default_value = POISSON_SEED

    # ── Face Normal ───────────────────────────────────────────────────────
    # InputNormal returns the interpolated vertex normal on POINT domain
    # when used after Distribute. For flat-shaded facades it equals the
    # face normal. On curved (subdivided) faces use CaptureAttribute with
    # domain=FACE first to freeze the true flat face normal.
    n_norm = ns.new("GeometryNodeInputNormal")
    n_norm.location = (-900, -200)

    # ── KEY NODE — Align Euler to Vector ──────────────────────────────────
    # axis='Y'       → make LOCAL +Y of each instance point toward face normal.
    #                  Works because the panel is modelled with +Y = outward.
    # pivot_axis='Z' → roll around world Z to keep panels upright.
    #                  Valid here because all face normals are horizontal
    #                  (vertical cylinder). For terrain, use pivot_axis='AUTO'.
    n_align = ns.new("FunctionNodeAlignEulerToVector")
    n_align.axis       = "Y"
    n_align.pivot_axis = "Z"
    n_align.location   = (-600, -100)
    # inputs[0]: starting Rotation (zero = identity, panels start unrotated)
    # inputs[1]: Factor (1.0 = full alignment; animate 0→1 for snap-on reveal)
    # inputs[2]: Vector (face normal in world space)

    # ── Object Info — supplies panel geometry as instance ─────────────────
    # transform_space='ORIGINAL' preserves the panel's world-space modelling
    # (the PANEL_OFFSET shift we applied). 'RELATIVE' would ignore it.
    n_obj = ns.new("GeometryNodeObjectInfo")
    n_obj.transform_space = "ORIGINAL"
    n_obj.inputs["Object"].default_value = panel_ob
    n_obj.location = (-600, 200)

    # ── Instance on Points ─────────────────────────────────────────────────
    # Rotation socket accepts the Euler from AlignEulerToVector directly.
    # Scale is uniform 1.0 (panel size is baked into the instance mesh).
    n_inst = ns.new("GeometryNodeInstanceOnPoints")
    n_inst.location = (-200, 0)

    # ── Realize Instances ──────────────────────────────────────────────────
    # Collapses instances to real geometry so GLB export bakes all transforms.
    # Without this, some renderers receive per-instance transforms separately —
    # fine for WebXR threejs rendering but not for baked lightmap use.
    n_real = ns.new("GeometryNodeRealizeInstances")
    n_real.location = (100, 0)

    # ── Join Geometry — merge façade shell + panels ───────────────────────
    n_join = ns.new("GeometryNodeJoinGeometry")
    n_join.location = (400, 0)

    # ── Set Material ───────────────────────────────────────────────────────
    n_mat = ns.new("GeometryNodeSetMaterial")
    n_mat.location = (700, 0)

    # ── Links ─────────────────────────────────────────────────────────────
    # Façade geometry → distribute
    lk(n_in.outputs["Geometry"],        n_dist.inputs["Mesh"])
    lk(n_in.outputs["Panel Spacing"],   n_dist.inputs["Distance Min"])

    # Face normal → Align Euler to Vector
    # inputs[2] is the Vector target (the direction we want axis to point to)
    lk(n_norm.outputs["Normal"],        n_align.inputs[2])

    # Align Euler → Instance on Points rotation
    lk(n_dist.outputs["Points"],        n_inst.inputs["Points"])
    lk(n_obj.outputs["Geometry"],       n_inst.inputs["Instance"])
    lk(n_align.outputs["Rotation"],     n_inst.inputs["Rotation"])

    # Instance on Points → realize → join with raw façade mesh
    lk(n_inst.outputs["Instances"],     n_real.inputs["Geometry"])
    lk(n_real.outputs["Geometry"],      n_join.inputs["Geometry"])
    lk(n_in.outputs["Geometry"],        n_join.inputs["Geometry"])

    # → set material → output
    lk(n_join.outputs["Geometry"],      n_mat.inputs["Geometry"])
    lk(n_mat.outputs["Geometry"],       n_out.inputs["Geometry"])

    return ng

# ── 5. Materials ───────────────────────────────────────────────────────────
def make_materials():
    # Façade — dark matte concrete
    mat_f = bpy.data.materials.new(MA_FACADE_NAME)
    mat_f.use_nodes = True
    t = mat_f.node_tree
    pbr = t.nodes.get("Principled BSDF")
    if pbr:
        pbr.inputs["Base Color"].default_value = (0.06, 0.07, 0.09, 1.0)
        pbr.inputs["Roughness"].default_value  = 0.88

    # Panel — bright emissive face with dark frame
    mat_p = bpy.data.materials.new(MA_PANEL_NAME)
    mat_p.use_nodes = True
    t2 = mat_p.node_tree
    for n in list(t2.nodes):
        t2.nodes.remove(n)
    n_ge = t2.nodes.new("ShaderNodeFresnel")
    n_ge.inputs["IOR"].default_value = 1.35
    n_ge.location = (-300, 50)
    n_em = t2.nodes.new("ShaderNodeEmission")
    n_em.inputs["Color"].default_value  = (0.15, 0.85, 0.90, 1.0)  # cyan glow
    n_em.inputs["Strength"].default_value = 3.5
    n_em.location = (-300, -100)
    n_mix = t2.nodes.new("ShaderNodeMixShader")
    n_mix.location = (0, 0)
    n_out2 = t2.nodes.new("ShaderNodeOutputMaterial")
    n_out2.location = (250, 0)
    t2.links.new(n_ge.outputs["Fac"],   n_mix.inputs[0])
    t2.links.new(n_em.outputs["Emission"], n_mix.inputs[2])
    t2.links.new(n_mix.outputs["Shader"],  n_out2.inputs["Surface"])

    return mat_f, mat_p

# ── 6. GLB export ──────────────────────────────────────────────────────────
def export_glb(filepath=GLB_PATH):
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(filepath),
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[blueprint] GLB exported → {filepath}")

# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    clean_scene()
    facade_ob  = make_facade()
    panel_ob   = make_panel()
    ng         = build_gn_tree(panel_ob)
    mat_f, mat_p = make_materials()

    mod = facade_ob.modifiers.new(NG_NAME, "NODES")
    mod.node_group = ng
    facade_ob.data.materials.append(mat_f)

    # Assign panel material to the panel instance object
    panel_ob.data.materials.append(mat_p)
    for node in ng.nodes:
        if node.type == "SET_MATERIAL":
            node.inputs["Material"].default_value = mat_f

    export_glb()
    print("[blueprint] Done — signage_facade.glb ready for WebXR.")
