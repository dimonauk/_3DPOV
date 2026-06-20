"""
GN Set Curve Tilt — Möbius Ribbon Generator (Blender 5.1)

A Möbius strip is a non-orientable surface with a single boundary and a single
side.  In Geometry Nodes the mechanism is the Set Curve Tilt node: it rotates
the profile cross-section around the curve tangent at each sample point.  For a
closed circle curve traversed once (Spline Parameter Factor 0 → 1), applying
tilt = Factor × π produces a cumulative half-twist — the topological signature
of the Möbius strip.

Key nodes demonstrated:
  GeometryNodeSplineParameter   — Factor field on a closed curve (0 → 1)
  GeometryNodeSetCurveTilt      — field-driven profile rotation per point
  GeometryNodeCurvePrimitiveLine — 2-point open curve as flat ribbon profile
  GeometryNodeCurveToMesh       — profile swept along tilted base curve

Generalisation via Twist Turns parameter:
  0.5 → quarter-twist (open helix seam)
  1.0 → Möbius strip (half-twist, single-sided)
  2.0 → full-twist tube (both sides rejoin, orientable)
  3.0 → three-half-twist torus knot ribbon

Licence: CC0 — public domain
Source: Blender 5.1 bpy API, original implementation
"""

import bpy
import math
from pathlib import Path

# ---------------------------------------------------------------------------
# Named constants — change these first before anything else
# ---------------------------------------------------------------------------
CIRCLE_RESOLUTION = 128      # loop subdivisions; 64 minimum for a smooth twist
CIRCLE_RADIUS     = 1.5      # metres, how large the Möbius loop is
STRIP_HALF_WIDTH  = 0.35     # metres; total strip width = 2 × this value
TWIST_TURNS       = 1.0      # 1.0 = classic Möbius half-twist
STRIP_COLOUR      = (0.72, 0.22, 0.85, 1.0)  # violet-magenta (linear RGBA)

OUTPUT_DIR = Path(__file__).parent
BLEND_OUT  = OUTPUT_DIR / "mobius_ribbon.blend"
GLB_OUT    = OUTPUT_DIR / "mobius_ribbon.glb"


# ---------------------------------------------------------------------------
# Scene helpers
# ---------------------------------------------------------------------------

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.node_groups, bpy.data.cameras, bpy.data.lights):
        for block in list(pool):
            pool.remove(block)


def make_material(name: str) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return mat
    bsdf.inputs["Base Color"].default_value = STRIP_COLOUR
    bsdf.inputs["Roughness"].default_value  = 0.4
    bsdf.inputs["Metallic"].default_value   = 0.0
    # Slight emission so the single-sided twist reads in low-light renders
    bsdf.inputs["Emission Color"].default_value  = STRIP_COLOUR
    bsdf.inputs["Emission Strength"].default_value = 0.08
    return mat


# ---------------------------------------------------------------------------
# Geometry Nodes tree
# ---------------------------------------------------------------------------

def build_gn_tree(name: str) -> bpy.types.GeometryNodeTree:
    tree = bpy.data.node_groups.new(type='GeometryNodeTree', name=name)

    # --- Declare interface sockets (Blender 4.0+ API; tree.inputs.new removed) ---
    # OUTPUT sockets appear as inputs on the Group Output node
    tree.interface.new_socket('Geometry', in_out='OUTPUT',
                              socket_type='NodeSocketGeometry')
    # INPUT sockets appear as outputs on the Group Input node
    s_rad   = tree.interface.new_socket('Radius',       in_out='INPUT',
                                        socket_type='NodeSocketFloat')
    s_rad.default_value = CIRCLE_RADIUS
    s_rad.min_value     = 0.1

    s_twist = tree.interface.new_socket('Twist Turns',  in_out='INPUT',
                                        socket_type='NodeSocketFloat')
    s_twist.default_value = TWIST_TURNS
    s_twist.min_value     = 0.0
    s_twist.max_value     = 6.0

    s_res   = tree.interface.new_socket('Resolution',   in_out='INPUT',
                                        socket_type='NodeSocketInt')
    s_res.default_value = CIRCLE_RESOLUTION
    s_res.min_value     = 8
    s_res.max_value     = 512

    nodes = tree.nodes
    links = tree.links

    # Group Input / Output nodes are auto-created; reposition them
    n_in  = nodes.get('Group Input')
    n_out = nodes.get('Group Output')
    n_in.location  = (-700,  0)
    n_out.location = ( 900,  0)

    # --- Curve Circle (the Möbius loop base) ---
    # RADIUS mode uses Resolution + Radius sockets only.
    # Use n_in.outputs by NAME to be resilient to socket reordering.
    n_circle = nodes.new('GeometryNodeCurvePrimitiveCircle')
    n_circle.mode     = 'RADIUS'
    n_circle.location = (-450, 150)
    links.new(n_in.outputs['Radius'],     n_circle.inputs['Radius'])
    links.new(n_in.outputs['Resolution'], n_circle.inputs['Resolution'])

    # --- Spline Parameter — Factor field (0 → 1 per point along closed curve) ---
    # For a CLOSED circle, Factor at the first point = 0, last point approaches 1.
    # The field is evaluated per-point when downstream nodes consume it.
    n_param = nodes.new('GeometryNodeSplineParameter')
    n_param.location = (-450, -80)

    # --- Math: tilt_radians = Factor × π × Twist_Turns ---
    # Two sequential Multiply nodes keep the graph readable:
    #   n_pi:    Factor × π         (bakes the Möbius half-turn constant)
    #   n_twist: (Factor×π) × Turns (user-controllable)
    n_pi = nodes.new('ShaderNodeMath')
    n_pi.operation = 'MULTIPLY'
    n_pi.location  = (-200, -80)
    n_pi.inputs[1].default_value = math.pi     # constant π in radians
    links.new(n_param.outputs['Factor'], n_pi.inputs[0])

    n_tw = nodes.new('ShaderNodeMath')
    n_tw.operation = 'MULTIPLY'
    n_tw.location  = (0, -80)
    links.new(n_pi.outputs[0],          n_tw.inputs[0])
    links.new(n_in.outputs['Twist Turns'], n_tw.inputs[1])

    # --- Set Curve Tilt ---
    # Tilt socket is ANGLE (radians internally, displayed as degrees in UI).
    # Selection defaults to True (all points), so no explicit selection link needed.
    n_tilt = nodes.new('GeometryNodeSetCurveTilt')
    n_tilt.location = (200, 150)
    links.new(n_circle.outputs['Curve'], n_tilt.inputs['Curve'])
    links.new(n_tw.outputs[0],           n_tilt.inputs['Tilt'])

    # --- Profile curve: a straight line segment (flat ribbon cross-section) ---
    # GeometryNodeCurvePrimitiveLine with mode='POINTS' creates a 2-point open
    # curve.  When used as the Profile Curve input to Curve to Mesh, each cross-
    # section ring is a LINE rather than a closed loop — producing a flat strip.
    # The Start/End vectors define the strip width symmetrically about the
    # curve tangent.  X=0 / Z=0 keeps the profile in the local YZ plane;
    # Curve to Mesh then rotates it to align with each sample's Normal + Tilt.
    n_profile = nodes.new('GeometryNodeCurvePrimitiveLine')
    n_profile.mode     = 'POINTS'
    n_profile.location = (0, 350)
    n_profile.inputs['Start'].default_value = (0.0, -STRIP_HALF_WIDTH, 0.0)
    n_profile.inputs['End'].default_value   = (0.0,  STRIP_HALF_WIDTH, 0.0)

    # --- Curve to Mesh ---
    # Fill Caps = False is REQUIRED for the Möbius topology.
    # A capped Möbius strip would close each open profile end with a polygon
    # that ignores the tilt twist, producing incorrect geometry at the seam.
    n_ctm = nodes.new('GeometryNodeCurveToMesh')
    n_ctm.location = (420, 150)
    n_ctm.inputs['Fill Caps'].default_value = False
    links.new(n_tilt.outputs['Curve'],       n_ctm.inputs['Curve'])
    links.new(n_profile.outputs['Curve'],    n_ctm.inputs['Profile Curve'])

    # --- Shade Smooth (FACE domain) ---
    # The twist makes face normals vary continuously, so smooth shading reads
    # correctly across the strip.  POINT domain smooth shading (the old default)
    # can produce flickering in EEVEE when adjacent face normals diverge sharply.
    n_smooth = nodes.new('GeometryNodeSetShadeSmooth')
    n_smooth.domain   = 'FACE'
    n_smooth.location = (640, 150)
    n_smooth.inputs['Shade Smooth'].default_value = True
    links.new(n_ctm.outputs['Mesh'], n_smooth.inputs['Geometry'])

    # --- Set Material ---
    n_mat = nodes.new('GeometryNodeSetMaterial')
    n_mat.location = (830, 150)
    links.new(n_smooth.outputs['Geometry'], n_mat.inputs['Geometry'])
    # Material slot assigned after tree is attached to the object (see build_scene)

    links.new(n_mat.outputs['Geometry'], n_out.inputs['Geometry'])

    return tree, n_mat


# ---------------------------------------------------------------------------
# Scene assembly
# ---------------------------------------------------------------------------

def build_scene():
    clear_scene()

    # Empty mesh object — GN modifier provides all visible geometry procedurally
    mesh = bpy.data.meshes.new("mobius_ribbon")
    obj  = bpy.data.objects.new("mobius_ribbon", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Build GN tree, attach as modifier
    tree, n_mat = build_gn_tree("GN_MobiusRibbon")
    mod = obj.modifiers.new(name="GN_MobiusRibbon", type='NODES')
    mod.node_group = tree

    # Material — assign AFTER modifier is in place so the Set Material node
    # can reference the slot by index 0
    mat = make_material("mat_mobius")
    obj.data.materials.append(mat)
    n_mat.inputs['Material'].default_value = mat

    # Three-point studio lighting
    bpy.ops.object.light_add(type='AREA', radius=4.0,
                             location=(2.5, -3.5, 4.5))
    key = bpy.context.active_object
    key.data.energy = 900
    key.data.color  = (1.0, 0.95, 0.90)

    bpy.ops.object.light_add(type='AREA', radius=3.0,
                             location=(-3.5, 2.0, 2.0))
    fill = bpy.context.active_object
    fill.data.energy = 250
    fill.data.color  = (0.80, 0.85, 1.00)

    bpy.ops.object.light_add(type='POINT', radius=0.3,
                             location=(0.0, 0.0, -2.5))
    rim = bpy.context.active_object
    rim.data.energy = 120
    rim.data.color  = (1.00, 0.70, 0.90)

    # Camera — angled to reveal the half-twist
    bpy.ops.object.camera_add(location=(3.8, -3.8, 2.8))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    cam.data.lens = 50.0
    import mathutils
    direction  = mathutils.Vector((0, 0, 0)) - mathutils.Vector((3.8, -3.8, 2.8))
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    # Dark world background (studio void)
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value    = (0.02, 0.02, 0.04, 1.0)
        bg.inputs['Strength'].default_value = 0.3

    # Render settings for save-and-export
    bpy.context.scene.render.engine   = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.render.resolution_x = 1920
    bpy.context.scene.render.resolution_y = 1080

    return obj, n_mat


# ---------------------------------------------------------------------------
# Save and GLB export
# ---------------------------------------------------------------------------

def save_and_export(obj: bpy.types.Object) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[holoflow] Saved:    {BLEND_OUT}")

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # export_apply=True forces the dependency graph to evaluate the GN modifier
    # and bake the resulting mesh before serialising.  Without it the exporter
    # sees an empty base mesh (zero faces) because the Möbius geometry lives
    # only in the evaluated dependency graph, not in the original mesh datablock.
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials='EXPORT',
    )
    print(f"[holoflow] Exported: {GLB_OUT}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    obj, _ = build_scene()
    save_and_export(obj)
