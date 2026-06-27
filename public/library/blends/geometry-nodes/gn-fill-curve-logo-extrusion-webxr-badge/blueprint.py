"""
GN Fill Curve + Set Spline Type — Hexagonal WebXR Badge Extrusion
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique
─────────
Fill Curve (GeometryNodeFillCurve) turns a closed cyclic spline into a flat face
mesh — the standard GN entry point for 2-D → 3-D extrusion pipelines: logos, badges,
architectural cross-sections, lettering.

The central insight is spline-type interaction:

  BEZIER → Fill Curve: evaluates at curve resolution (default 12 pts/segment).
    6-point bezier hexagon at resolution 12 → 72-vertex near-circle outline.
  POLY → Fill Curve: uses control points directly, straight edges between them.
    Same 6 points converted to POLY → crisp 6-sided hexagon.

Set Spline Type (GeometryNodeSetSplineType) converts in-tree, before Fill Curve,
so the input curve's bezier smoothness is preserved for editing but the fill
receives the exact control-polygon. This is the correct pattern for logo extrusion:
design with bezier curves, fill with poly precision.

Fill Curve mode: TRIANGLES produces a triangulated face mesh (safer for WebXR GLB),
NGONS produces a single n-gon face (cleaner for further GN operations like SubD).

Outside sources
───────────────
  Blender Manual — Fill Curve Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/fill_curve.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related in same section: Curve to Mesh, Fillet Curve

  Blender Manual — Set Spline Type Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_spline_type.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related: Set Spline Cyclic, Set Spline Resolution, Trim Curve

  KhronosGroup/glTF-Blender-IO
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
    Sibling: https://github.com/KhronosGroup/glTF-Sample-Assets (CC0)
"""

import bpy
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
BADGE_RADIUS   = 1.0    # hexagon circumradius in metres
BADGE_DEPTH    = 0.20   # extrusion depth (−Z)
SMOOTH_ANGLE   = 30.0   # degrees — edges above this threshold stay hard (flat-shaded)
EMIT_STRENGTH  = 2.8    # emission multiplier for the face material
EXPORT_FRAME   = 1
OUTPUT_DIR     = "//output"

# Compare by changing to 'BEZIER' or 'NURBS' and re-running
SPLINE_MODE    = 'POLY'       # 'POLY', 'BEZIER', or 'NURBS'
FILL_MODE      = 'TRIANGLES'  # 'TRIANGLES' (WebXR-safe) or 'NGONS'


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in list(bpy.data.meshes):      bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.curves):      bpy.data.curves.remove(blk)
    for blk in list(bpy.data.node_groups): bpy.data.node_groups.remove(blk)
    for blk in list(bpy.data.materials):   bpy.data.materials.remove(blk)


def build_hex_curve() -> bpy.types.Object:
    """
    6-point cyclic bezier hexagon with AUTO handles (smooth arcs in BEZIER mode,
    crisp hexagon after SetSplineType POLY in GN).

    use_cyclic_u = True is mandatory — Fill Curve produces no output on open splines.
    AUTO handles let Blender calculate tangent directions automatically; the resulting
    arcs give a clear visual difference between BEZIER fill and POLY fill, which is
    the teaching moment at the core of this tutorial.
    """
    curve_data = bpy.data.curves.new("badge_outline", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = 12   # bezier subdivision per segment

    sp = curve_data.splines.new('BEZIER')
    sp.bezier_points.add(5)         # 1 default + 5 added = 6 total
    sp.use_cyclic_u = True          # CLOSED — required for Fill Curve

    for i, pt in enumerate(sp.bezier_points):
        angle = math.tau * i / 6 - math.pi / 2   # start at top (12 o'clock)
        pt.co = (math.cos(angle) * BADGE_RADIUS,
                 math.sin(angle) * BADGE_RADIUS,
                 0.0)
        pt.handle_left_type  = 'AUTO'
        pt.handle_right_type = 'AUTO'

    obj = bpy.data.objects.new("badge_outline", curve_data)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return obj


def build_materials():
    """
    Two materials:
      0 — MAT_Badge_Side: metallic dark-gold Principled for the extruded side walls
          and the back cap.
      1 — MAT_Badge_Face: emission gold for the visible front face — the "lit" side
          of the badge in WebXR.
    """
    side = bpy.data.materials.new("MAT_Badge_Side")
    side.use_nodes = True
    nt = side.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value  = (0.60, 0.48, 0.02, 1.0)
        bsdf.inputs['Metallic'].default_value    = 0.95
        bsdf.inputs['Roughness'].default_value   = 0.25

    face = bpy.data.materials.new("MAT_Badge_Face")
    face.use_nodes = True
    nt2 = face.node_tree
    for nd in list(nt2.nodes): nt2.nodes.remove(nd)
    out  = nt2.nodes.new('ShaderNodeOutputMaterial'); out.location = (300, 0)
    emit = nt2.nodes.new('ShaderNodeEmission');       emit.location = (80, 0)
    emit.inputs['Color'].default_value    = (1.0, 0.84, 0.12, 1.0)
    emit.inputs['Strength'].default_value = EMIT_STRENGTH
    nt2.links.new(emit.outputs['Emission'], out.inputs['Surface'])

    return side, face


def build_gn_tree(obj: bpy.types.Object):
    ng  = bpy.data.node_groups.new("GN_FillCurve_Badge", 'GeometryNodeTree')
    mod = obj.modifiers.new("GN_Badge", 'NODES')
    mod.node_group = ng

    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nd = ng.nodes
    lk = ng.links

    def n(tp, loc=(0, 0)):
        node = nd.new(tp); node.location = loc; return node

    gin  = n('NodeGroupInput',  (-1400, 0))
    gout = n('NodeGroupOutput', (  900, 0))

    # ── 1. Set Spline Type ────────────────────────────────────────────────────
    # Convert the bezier spline to POLY before Fill Curve.
    # With POLY: Fill Curve receives exactly 6 control points → crisp hexagon.
    # Without this node (BEZIER input): Fill Curve receives 72 evaluated points
    # → near-circle. Change SPLINE_MODE to 'BEZIER' in parameters to compare.
    sst = n('GeometryNodeSetSplineType', (-1100, 0))
    sst.spline_type = SPLINE_MODE
    lk.new(gin.outputs[0], sst.inputs['Curve'])

    # ── 2. Fill Curve ─────────────────────────────────────────────────────────
    # Converts the closed cyclic spline into a flat face mesh on the spline's plane.
    # TRIANGLES mode: triangulated output — mandatory for safe WebXR GLB export
    # (WebGL requires triangles; NGONS mode leaves n-gons that the exporter must
    #  triangulate, sometimes producing bad normals on non-convex shapes).
    fill = n('GeometryNodeFillCurve', (-800, 0))
    fill.mode = FILL_MODE
    lk.new(sst.outputs['Curve'], fill.inputs['Curve'])

    # ── 3. Extrude Mesh ───────────────────────────────────────────────────────
    # Extrudes the flat fill face to give the badge its depth.
    # Offset=(0,0,−DEPTH): extrudes downward in world Z.
    # use_individual_faces not needed: single face input, no topology ambiguity.
    extrude = n('GeometryNodeExtrudeMesh', (-500, 0))
    extrude.mode = 'FACES'
    extrude.inputs['Offset'].default_value = (0.0, 0.0, -BADGE_DEPTH)
    extrude.inputs['Offset Scale'].default_value = 1.0
    lk.new(fill.outputs['Mesh'], extrude.inputs['Mesh'])
    # extrude.outputs['Top']  → Bool field: True on the back cap (at Z=−DEPTH)
    # extrude.outputs['Side'] → Bool field: True on the 6 side walls
    # Neither Top nor Side: the original front fill face at Z=0

    # ── 4. Material assignment ────────────────────────────────────────────────
    # Front face (neither Top nor Side) → mat 1 (gold emission).
    # NOT(Top) AND NOT(Side) selects exactly the original fill face.
    not_top  = n('FunctionNodeBooleanMath', (-500, -200)); not_top.operation  = 'NOT'
    not_side = n('FunctionNodeBooleanMath', (-300, -200)); not_side.operation = 'NOT'
    and_face = n('FunctionNodeBooleanMath', (-100, -200)); and_face.operation = 'AND'
    lk.new(extrude.outputs['Top'],   not_top.inputs[0])
    lk.new(extrude.outputs['Side'],  not_side.inputs[0])
    lk.new(not_top.outputs[0],       and_face.inputs[0])
    lk.new(not_side.outputs[0],      and_face.inputs[1])

    set_face_mat = n('GeometryNodeSetMaterialIndex', (-200, 0))
    set_face_mat.inputs['Material Index'].default_value = 1
    lk.new(extrude.outputs['Mesh'], set_face_mat.inputs['Geometry'])
    lk.new(and_face.outputs[0],     set_face_mat.inputs['Selection'])

    # ── 5. Smooth by Angle ────────────────────────────────────────────────────
    # Edges between side walls (at 60° apart in a hexagon) remain sharp — they are
    # below the threshold. The top/bottom face edges shade smoothly across the cap.
    # This gives the badge its faceted metallic side appearance.
    smooth = n('GeometryNodeSmoothByAngle', (100, 0))
    smooth.inputs['Angle'].default_value = math.radians(SMOOTH_ANGLE)
    lk.new(set_face_mat.outputs['Geometry'], smooth.inputs['Mesh'])

    # ── 6. Store holoflow:facet flag ──────────────────────────────────────────
    # Marks this mesh for the Holoflow WebXR exporter's facet-shading pipeline.
    store_facet = n('GeometryNodeStoreNamedAttribute', (350, 0))
    store_facet.domain    = 'FACE'
    store_facet.data_type = 'FLOAT'
    store_facet.inputs['Name'].default_value  = 'holoflow:facet'
    store_facet.inputs['Value'].default_value = 1.0
    lk.new(smooth.outputs['Mesh'], store_facet.inputs['Geometry'])

    lk.new(store_facet.outputs['Geometry'], gout.inputs[0])


def export_glb(obj: bpy.types.Object):
    bpy.context.scene.frame_set(EXPORT_FRAME)
    out_path = bpy.path.abspath(OUTPUT_DIR + "/hex_badge.glb")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,            # realises GN modifier before export
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"Exported → {out_path}")


def main():
    clear_scene()
    obj             = build_hex_curve()
    mat_side, mat_face = build_materials()
    obj.data.materials.append(mat_side)   # index 0: sides + back
    obj.data.materials.append(mat_face)   # index 1: front face

    build_gn_tree(obj)

    bpy.context.scene.render.engine   = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_bloom = True

    export_glb(obj)
    print("Blueprint complete — hexagonal WebXR badge ready.")


if __name__ == "__main__":
    main()
