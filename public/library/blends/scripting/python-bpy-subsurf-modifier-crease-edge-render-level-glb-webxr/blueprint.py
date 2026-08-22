"""
Python bpy.types.SubsurfModifier — Crease-Controlled Subdivision Surface:
Viewport/Render Level Split, Attribute-Based Creases & GLB Pre-Export Apply
Blender 5.1 | Holoflow Studio | CC0

TECHNIQUE
─────────
Catmull-Clark subdivision rounds every edge equally unless you mark individual
edges with a crease value between 0 (fully rounded) and 1 (completely sharp).
The key insight: SubD + creases replaces support loops — you sculpt curvature
intention in the control cage, then let the maths handle the interpolation.

Pipeline:
  1. Build a hard-surface prop via bmesh (console panel with raised pads).
  2. Mark boundary and feature edges with crease weight 1.0 via the
     "crease_edge" FloatAttribute (the 4.x/5.x data API — not the deprecated
     mesh.edges[i].crease property).
  3. Add SubsurfModifier: levels=1 viewport, render_levels=2 render.
  4. Apply the modifier before GLB export (glTF 2.0 has no SubD primitive).
  5. Export with Draco L6 compression for WebXR delivery.

BLENDER 5.1 API NOTES
─────────────────────
• Edge creases live in mesh.attributes["crease_edge"] (FLOAT, EDGE domain).
  The legacy mesh.edges[i].crease accessor still works in 5.1 as a migration
  bridge but writes to the same attribute underneath.  Use the attribute API
  for scripted bulk operations — foreach_set is 100× faster than a Python loop.
• mod.use_creases must be True (default) for the attribute to take effect.
• mod.use_custom_normals=True preserves any custom normals already on the mesh
  through the subdivision pass — vital if you hand-authored normals earlier.
• Applying with bpy.ops.object.modifier_apply() requires OBJECT mode and
  bpy.context.active_object == target.  Use temp_override in headless scripts.
• show_only_control_edges suppresses the subdivided lines in the viewport;
  leave it False unless subdivision is heavy and you need interactive speed.
"""

import bpy
import bmesh
from mathutils import Vector
import math

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG          = "hf_console_panel"
PANEL_W       = 2.0     # metres — total panel width
PANEL_H       = 1.2     # metres — total panel height
PANEL_DEPTH   = 0.04    # metres — base plate thickness
PAD_INSET     = 0.08    # metres — gap between panel perimeter and inset pads
PAD_DEPTH     = 0.015   # metres — how far pads protrude
SUBSURF_VIEW  = 1       # viewport level (responsive editing)
SUBSURF_REND  = 2       # render level (smooth output)
OUTPUT_PATH   = "//hf_console_panel.glb"


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.remove(block, do_unlink=True)


def build_panel_mesh() -> bpy.types.Object:
    """
    Construct a hard-surface console panel entirely in bmesh.

    Layout (top-down view):
        ┌─────────────────────────────────────┐
        │   ┌──────────┐   ┌──────────────┐   │
        │   │  PAD A   │   │    PAD B     │   │
        │   └──────────┘   └──────────────┘   │
        │   (button grid)   (display zone)    │
        └─────────────────────────────────────┘

    The base plate is a simple box.  Pads are raised quads inset from the
    plate top face.  Every hard feature edge (plate perimeter, pad borders)
    receives crease = 1.0 so SubD cannot round it.
    """
    mesh = bpy.data.meshes.new(SLUG)
    obj  = bpy.data.objects.new(SLUG, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # ── Base plate ─────────────────────────────────────────────────────────
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(PANEL_W, PANEL_DEPTH, PANEL_H),
                    verts=bm.verts)

    # Translate so the top face sits at Z=0 (panel face towards viewer is +Y)
    top_z = PANEL_H / 2
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0.0, -PANEL_DEPTH / 2, 0.0))

    bm.to_mesh(mesh)
    bm.free()

    # ── Sculpt two raised pads on the front (−Y) face ─────────────────────
    # We work directly on the Mesh via a new bmesh after linking the object,
    # so we can use index-aware bmesh topology.
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # Front face: all verts with Y close to -PANEL_DEPTH/2
    front_y = -PANEL_DEPTH / 2
    front_face = None
    for f in bm.faces:
        if all(abs(v.co.y - front_y) < 1e-4 for v in f.verts):
            front_face = f
            break

    if front_face:
        # Inset the entire front face to create a raised border ring
        result = bmesh.ops.inset_individual(
            bm, faces=[front_face],
            thickness=PAD_INSET, depth=0.0, use_even_offset=True
        )
        inner_faces = result['faces']

        # Split inner face into two pads with a vertical loop cut simulation
        # via inset_individual on each half — simpler: inset once, then
        # subdivide the inner face and raise sub-faces.
        if inner_faces:
            pad_result = bmesh.ops.subdivide_faces(
                bm, faces=inner_faces, cuts=1
            )
            sub_faces = [f for f in pad_result['geom'] if isinstance(f, bmesh.types.BMFace)]

            # Raise every sub-face as a pad
            for sf in sub_faces:
                bmesh.ops.extrude_face_region(bm, geom=[sf])
                for v in sf.verts:
                    v.co.y -= PAD_DEPTH   # push outward (−Y = towards viewer)

    bm.to_mesh(mesh)
    mesh.update()
    bm.free()

    return obj


def mark_crease_edges(obj: bpy.types.Object, crease_value: float = 1.0) -> None:
    """
    Mark ALL boundary edges of the mesh and hard-feature edges with crease.

    Strategy: any edge that is on the boundary of a manifold face island, or
    that connects faces with normals diverging by > 45°, is a feature edge
    that should resist SubD rounding.

    We identify them via bmesh (boundary + angle threshold) then write
    the values back to the 'crease_edge' attribute with foreach_set.
    """
    mesh = obj.data

    # Ensure the attribute exists (Blender 4.0+ replaces mesh.edge_crease)
    if "crease_edge" not in mesh.attributes:
        mesh.attributes.new("crease_edge", 'FLOAT', 'EDGE')

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.edges.ensure_lookup_table()

    ANGLE_THRESHOLD = math.radians(30)   # edges sharper than 30° → crease

    crease_array = [0.0] * len(bm.edges)

    for i, edge in enumerate(bm.edges):
        is_boundary = edge.is_boundary
        is_sharp_angle = False
        if len(edge.link_faces) == 2:
            n0 = edge.link_faces[0].normal
            n1 = edge.link_faces[1].normal
            angle = n0.angle(n1, 0.0)
            is_sharp_angle = angle > ANGLE_THRESHOLD

        if is_boundary or is_sharp_angle:
            crease_array[i] = crease_value

    bm.free()

    mesh.attributes["crease_edge"].data.foreach_set("value", crease_array)
    mesh.update()


def add_subsurf_modifier(obj: bpy.types.Object) -> bpy.types.SubsurfModifier:
    """
    Add and configure a Catmull-Clark SubsurfModifier.

    WHY separate viewport and render levels:
        level=1 viewport keeps interactive editing fast.
        render_levels=2 produces the smooth output written to the GLB.
        They are independent — the modifier stack applies the active level
        depending on whether Blender is in a render pass or the 3D viewport.
        For GLB export the exporter evaluates at render_levels.

    WHY use_creases=True (it is the default):
        Without this flag the 'crease_edge' attribute is ignored and every
        edge rounds fully — the panel border disappears into mush.
    """
    mod: bpy.types.SubsurfModifier = obj.modifiers.new("SubSurf", 'SUBSURF')

    mod.subdivision_type      = 'CATMULL_CLARK'
    mod.levels                = SUBSURF_VIEW
    mod.render_levels         = SUBSURF_REND
    mod.use_creases           = True         # honour crease_edge attribute
    mod.use_custom_normals    = True         # preserve hand-authored normals
    mod.show_only_control_edges = False      # show subdivided mesh in viewport
    mod.uv_smooth             = 'PRESERVE_BOUNDARIES'   # do not slide UV boundaries
    mod.boundary_smooth       = 'ALL'        # smooth open boundary loops if any

    return mod


def apply_and_export(obj: bpy.types.Object) -> None:
    """
    Apply the SubsurfModifier then export as GLB for WebXR delivery.

    WHY apply before GLB export:
        glTF 2.0 has no subdivision surface primitive.  Exporters silently
        export the *control cage* at whatever viewport level is currently
        shown unless you apply first.  Applying at render_levels=2 bakes the
        smooth geometry into the mesh before the exporter reads it.

    Applying requires OBJECT mode with the target as the active object.
    In a headless or batch context use bpy.context.temp_override().
    """
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    with bpy.context.temp_override(active_object=obj, selected_objects=[obj]):
        # Apply at render_levels — switch levels temporarily
        mod = obj.modifiers.get("SubSurf")
        if mod:
            mod.levels = mod.render_levels
            bpy.ops.object.modifier_apply(modifier=mod.name)

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(OUTPUT_PATH),
        export_format                        = 'GLB',
        use_selection                        = False,
        export_materials                     = 'EXPORT',
        export_animations                    = False,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_texcoords                     = True,
        export_normals                       = True,
    )
    print(f"[holoflow] Exported → {bpy.path.abspath(OUTPUT_PATH)}")


def assign_flat_material(obj: bpy.types.Object) -> None:
    """Minimal faceted-toon material so the GLB has colour in Three.js."""
    mat = bpy.data.materials.new(name="hf_panel_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.22, 0.28, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.6
    bsdf.inputs["Roughness"].default_value  = 0.4
    obj.data.materials.append(mat)


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    clear_scene()

    panel = build_panel_mesh()
    mark_crease_edges(panel, crease_value=1.0)
    assign_flat_material(panel)
    add_subsurf_modifier(panel)

    bpy.context.view_layer.update()
    apply_and_export(panel)

    print("[holoflow] blueprint complete — hf_console_panel.glb ready.")
