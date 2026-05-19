"""
Blender 5.1 Blueprint: Faceted Low-Poly Hard-Surface Panel
===========================================================
Technique: box-model a wall-mount control panel, apply Smooth by Angle
at 30° so geometric features read as deliberate facets rather than
shading artefacts, mark silhouette edges Sharp for crisp cel-outlines,
assign a flat studio-palette material, export GLB (Y-up, Draco 6, WebP).

Why Smooth by Angle instead of Shade Flat?
  Shade Flat kills ALL normal interpolation. Perfect for maximally
  faceted reads (every polygon its own island), but harsh on surfaces
  where a gentle curve is intentional — e.g. a cylindrical boolean
  drilled into the panel face. Smooth by Angle at 30° preserves the
  faceting on steep-angle joins while letting near-coplanar faces share
  normals, so a 5° chamfer doesn't appear as a hard band.

Blender 5.1 note:
  In 4.1, Auto Smooth was removed from Object Properties. The
  replacement is the 'Smooth by Angle' geometry-node modifier, added
  automatically via Right-click > Shade Smooth by Angle in the viewport,
  or via bpy.ops.object.shade_smooth_by_angle(angle=radians(n)).
  Do NOT use the legacy obj.data.use_auto_smooth flag for 5.x work —
  it is read-only / deprecated and does nothing in 5.1.

Run: blender --background --python blueprint.py
Outputs: faceted_hard_surface_panel.glb (same directory as script)
"""

import bpy
import bmesh
import math
import os

# ── Constants ─────────────────────────────────────────────────────────────────
PANEL_NAME       = "holoflow_hard_surface_panel"   # snake_case root per studio convention
MAT_NAME         = "holoflow_flat_dustrose"
SMOOTH_ANGLE_DEG = 30.0       # faceting threshold — steeper joins split normals
BEVEL_WIDTH      = 0.025      # metres; one thin chamfer loop per edge
BEVEL_SEGMENTS   = 1          # one loop = max facet economy, minimal extra polys
PANEL_W          = 0.80       # width  (X)
PANEL_D          = 0.07       # depth  (Y) — shallow for wall mounting
PANEL_H          = 0.50       # height (Z)
INSET_THICKNESS  = 0.06       # border rail width on front face
INSET_DEPTH      = 0.012      # how far the inner panel is recessed
FILL_COLOUR      = (0.820, 0.680, 0.660, 1.0)   # studio Dust Rose, sRGB

SCRIPT_DIR       = os.path.dirname(os.path.realpath(__file__))
EXPORT_PATH      = os.path.join(SCRIPT_DIR, "faceted_hard_surface_panel.glb")


# ── Scene teardown ─────────────────────────────────────────────────────────────
def clear_scene() -> None:
    """Idempotent reset — script can be re-run in a live session."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[block])


# ── Mesh construction ──────────────────────────────────────────────────────────
def build_panel_mesh() -> bpy.types.Object:
    """
    Direct bmesh API — no operator context dependency.
    Shape: a rectangular block whose front face (+Y) is inset to create a
    raised border rail around a recessed inner panel. This gives the
    'control panel' silhouette the studio leans into without a single
    boolean, so the mesh stays clean quads throughout.
    """
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)

    # Scale verts in-mesh so the final object transform is identity.
    # Identity transforms are mandatory for correct GLB export (no need
    # to apply scale separately).
    for v in bm.verts:
        v.co.x *= PANEL_W
        v.co.y *= PANEL_D
        v.co.z *= PANEL_H

    # ── Inset the front face ────────────────────────────────────────────────
    # The 'front' face is whichever has the highest Y centroid on the cube.
    bm.faces.ensure_lookup_table()
    front = max(bm.faces, key=lambda f: f.calc_center_median().y)

    # inset_individual pushes a ring inward and optionally raises/lowers
    # the inner region. depth < 0 = extrude inward → recessed panel.
    result = bmesh.ops.inset_individual(
        bm,
        faces=[front],
        thickness=INSET_THICKNESS,
        depth=-INSET_DEPTH,
        use_even_offset=True,
        use_interpolate=True,
    )
    # result["faces"] is the inner face after inset — useful for further ops.
    _ = result["faces"]

    # ── Bevel all edges ─────────────────────────────────────────────────────
    # A single bevel loop at each edge. This is the key structural move:
    # it adds a tiny chamfer strip at every corner, giving Smooth by Angle
    # the topology it needs to split normals at the exact chamfer boundary
    # rather than averaging across the full face width.
    bmesh.ops.bevel(
        bm,
        geom=list(bm.edges),
        offset=BEVEL_WIDTH,
        offset_type="OFFSET",
        segments=BEVEL_SEGMENTS,
        profile=0.5,
        affect="EDGES",
        loop_slide=True,
    )

    mesh = bpy.data.meshes.new(PANEL_NAME)
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate()

    obj = bpy.data.objects.new(PANEL_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


# ── Smooth by Angle ────────────────────────────────────────────────────────────
def apply_smooth_by_angle(obj: bpy.types.Object, deg: float) -> None:
    """
    Blender 5.1 path for controlled normal splitting.
    The operator adds a 'Smooth by Angle' geometry-node modifier to the
    object. Unlike the removed Auto Smooth flag, the modifier is live,
    non-destructive, and round-trips through GLB via the custom normal
    attribute it bakes on export.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(deg))


# ── Sharp edge marks ───────────────────────────────────────────────────────────
def mark_silhouette_sharps(obj: bpy.types.Object) -> None:
    """
    Explicitly mark the outermost vertical silhouette edges as Sharp.
    Why not rely on the angle threshold alone?
    The bevel loop at BEVEL_WIDTH=0.025 m subtends a very shallow dihedral
    (~6-8°) against the main panel face — well inside the 30° threshold.
    Without a Sharp mark the modifier smooths over the bevel seam, giving a
    plastic rounding look instead of the hard-edge cel silhouette we want.
    Manual marks are surgical: 'this specific edge is always a hard crease'.
    """
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    bm.verts.ensure_lookup_table()

    x_extent = max(abs(v.co.x) for v in bm.verts)
    z_extent = max(abs(v.co.z) for v in bm.verts)

    for e in bm.edges:
        # Edge on the left or right extreme (silhouette when viewed from front).
        on_x_silhouette = all(abs(v.co.x) > x_extent * 0.92 for v in e.verts)
        # Edge on the top or bottom extreme.
        on_z_silhouette = all(abs(v.co.z) > z_extent * 0.92 for v in e.verts)
        if on_x_silhouette or on_z_silhouette:
            e.smooth = False   # smooth=False → edge is Sharp in Blender API

    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode="OBJECT")


# ── Material ───────────────────────────────────────────────────────────────────
def assign_flat_material(obj: bpy.types.Object) -> None:
    """
    Flat PBR: Roughness 1.0, Specular IOR Level 0.0.
    The studio's cel-shading lives in the TSL post-pass on the website;
    sending a clean flat diffuse GLB means the viewer has nothing to
    fight against. Any PBR specularity in the asset would bleed through
    the cel threshold and create ghosting.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf   = nodes.new("ShaderNodeBsdfPrincipled")

    bsdf.inputs["Base Color"].default_value       = FILL_COLOUR
    bsdf.inputs["Roughness"].default_value        = 1.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.0

    mat.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    output.location = (300, 0)
    bsdf.location   = (0, 0)

    obj.data.materials.clear()
    obj.data.materials.append(mat)


# ── GLB export ─────────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object, path: str) -> None:
    """
    Studio conventions (holoflow_webxr_exporter parity):
      Y-up axis (WebXR standard)      export_yup=True
      Apply transforms                export_apply=True
      Draco compression level 6       smaller file, Quest 3 comfortable
      WebP textures                   75-80% smaller than PNG for diffuse
      Normals included                Smooth by Angle bakes custom normals
    """
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials="EXPORT",
        export_colors=False,
    )
    print(f"[holoflow] ✓ exported → {path}")


# ── Entry point ────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    obj = build_panel_mesh()
    apply_smooth_by_angle(obj, SMOOTH_ANGLE_DEG)
    mark_silhouette_sharps(obj)
    assign_flat_material(obj)
    export_glb(obj, EXPORT_PATH)


if __name__ == "__main__":
    main()
