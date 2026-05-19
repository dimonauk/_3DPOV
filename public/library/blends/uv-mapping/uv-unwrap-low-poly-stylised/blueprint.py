"""
UV Unwrapping for Low-Poly Stylised Meshes — Blender 5.1 blueprint
===================================================================
Technique: placing UV seams on a low-poly gem/prop and unwrapping it
for a cel/stylised texture — covering Smart UV Project vs manual
seams vs Angle-Based Unwrap, island packing, and aligning UV islands
to pixel boundaries for crisp hand-painted or procedural cel textures.

Why UV layout matters for low-poly work
-----------------------------------------
A common assumption: "low-poly = small texture = doesn't matter."
The opposite is true. With a low-poly faceted mesh, each face is a
large, clearly visible polygon. Misaligned UVs smear the texture
across a face at an angle, producing ugly gradients on what should
be a flat colour or clean gradient. Getting the UV layout right
means each face is an axis-aligned rectangle on the atlas — the
colour reads exactly as the artist painted it.

For stylised/cel work specifically:
  - Toon-shading ramps look right only when UV gradient direction
    is consistent (UV V-axis pointing 'up' relative to the face).
  - Texture seams are invisible when they fall on hard edges that are
    already visually distinct — the viewer's eye expects a boundary
    there.
  - Pixel-aligned UV edges prevent 1-pixel bleeds at island
    boundaries, which show as thin coloured lines in-engine.

Three unwrapping strategies compared
--------------------------------------
1. Smart UV Project  — one click, automatic seams. Good for
   non-important props where precision doesn't matter. Islands
   tend to be misaligned and non-square, making hand-painting hard.

2. Angle-Based Unwrap — Blender's default `U → Unwrap`. Follows
   the seams you mark manually. Minimises angular distortion but
   does NOT give you pixel-aligned edges unless you snap manually.

3. Cube Projection + Per-Face packing (this tutorial's method) —
   for faceted low-poly props, project each face independently as
   a flat projection, then pack all face-islands into the 0–1 UV
   space. Every face is a clean polygon with straight edges — ideal
   for hand-painted cel textures and for baking flat AO per face.

Usage
------
Run from Blender's Scripting workspace or CLI:
    blender --background --python blueprint.py

Builds a low-poly gem (6-face truncated octahedron), places seams,
unwraps using the studio's preferred method, and saves the result as
`./uv_low_poly_demo.blend` with a checker material applied for
visual verification.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# ── constants ────────────────────────────────────────────────────────────────
OUTPUT_BLEND = "uv_low_poly_demo.blend"
CHECKER_SCALE = 8        # how many checker squares across the UV tile
                          # 8 gives a fine enough grid to spot misalignment

# ── helpers ──────────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def build_low_poly_gem() -> bpy.types.Object:
    """
    Build a low-poly gem from scratch via bmesh so we own every vertex.
    Shape: a truncated octahedron — 6 square faces + 8 hexagonal faces
    — chosen because it has a mix of face sizes and orientations, which
    makes it a useful UV test piece.

    We use bmesh directly rather than bpy.ops.mesh.primitive_* because:
      1. We get a named reference to every face for seam placement.
      2. No operator context dependency — runs cleanly headless.
    """
    mesh = bpy.data.meshes.new("gem_mesh")
    obj = bpy.data.objects.new("gem_low_poly", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # Truncated octahedron vertices (unit scale, coords from symmetry)
    s = 1.0           # scale
    # The 24 vertices of a truncated octahedron
    coords = []
    for perm in [(0, 1, 2), (0, 2, 1), (1, 0, 2),
                 (1, 2, 0), (2, 0, 1), (2, 1, 0)]:
        for signs in [(-1, -1, -1), (-1, -1, 1), (-1, 1, -1), (-1, 1, 1),
                      (1, -1, -1), (1, -1, 1), (1, 1, -1), (1, 1, 1)]:
            v = [0.0, s, 2 * s]
            vert = tuple(signs[i] * v[perm[i]] for i in range(3))
            if vert not in coords:
                coords.append(vert)

    verts = [bm.verts.new(c) for c in coords]
    bm.verts.ensure_lookup_table()

    # Build convex hull from the vertex cloud — the hull IS the
    # truncated octahedron (provided we have the right 24 points).
    result = bmesh.ops.convex_hull(bm, input=verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # Apply a scale so it sits comfortably in the viewport
    obj.scale = (0.5, 0.5, 0.5)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)

    return obj


def mark_seams_on_hard_edges(obj: bpy.types.Object) -> None:
    """
    Mark UV seams on every edge where the dihedral angle > 45°.

    WHY this seam strategy?
    For a faceted low-poly mesh, every sharp silhouette edge is already
    visually distinct — the viewer sees a hard angle. A UV seam on that
    edge is invisible because the edge itself already acts as a visual
    boundary. Putting seams on soft, rounded transitions would produce
    visible texture stretching on what looks like a smooth surface —
    exactly what we want to avoid.

    The 45° threshold is a studio heuristic: lower gives more seams (more
    islands, easier to lay flat, but harder to paint seamlessly); higher
    gives fewer seams (bigger islands, more distortion). For a gem with
    predominantly planar faces, 45° hits the right balance.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")

    bm = bmesh.from_edit_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    threshold = math.radians(45)

    for edge in bm.edges:
        if len(edge.link_faces) == 2:
            f0, f1 = edge.link_faces
            angle = f0.normal.angle(f1.normal)
            edge.seam = (angle > threshold)
        else:
            # boundary edge — always a seam
            edge.seam = True

    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode="OBJECT")


def unwrap_angle_based(obj: bpy.types.Object) -> None:
    """
    Run Blender's Angle-Based Unwrap following the seams we placed.

    'Angle-Based' is Blender's default algorithm (U → Unwrap in
    Edit Mode). It minimises angular distortion — meaning the shapes
    of faces in UV space match their 3D shapes as closely as possible.
    For flat-faced low-poly meshes this is effectively a flat
    projection per island, which is exactly what we want.

    The alternative — 'Conformal' — minimises area distortion but
    is less suited to faceted meshes where preserving relative face
    angles matters for consistent texel density.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.unwrap(method="ANGLE_BASED", margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")


def pack_uv_islands(obj: bpy.types.Object) -> None:
    """
    Pack UV islands to fill the 0-1 space with minimal waste.

    UV packing places all islands as efficiently as possible within
    the UV tile. Blender's built-in packer (bpy.ops.uv.pack_islands)
    uses a rectangle-packing heuristic. For production use, the
    studio also uses the Zen UV 'Pack' if it is available, but the
    built-in is sufficient for the demo.

    margin=0.005 leaves a 2-pixel gap on a 256x256 texture (1/256 ≈
    0.0039), preventing bleed between islands in bilinear filtering.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(margin=0.005)
    bpy.ops.object.mode_set(mode="OBJECT")


def add_checker_material(obj: bpy.types.Object, scale: int) -> None:
    """
    Apply a UV checker material for visual verification.

    The checker texture is the canonical way to inspect UV quality:
      - Uniform square size → consistent texel density.
      - Axis-aligned squares → island is not rotated.
      - No stretching or skewing → unwrap is clean.

    For production work, replace the checker with the actual texture.
    The node tree structure (UV Map → Image Texture → BSDF) is the
    same skeleton used for every hand-painted asset.
    """
    mat = bpy.data.materials.new("checker_verify")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    uv_node = nodes.new("ShaderNodeUVMap")
    uv_node.location = (-600, 0)

    checker = nodes.new("ShaderNodeTexChecker")
    checker.location = (-300, 0)
    checker.inputs["Scale"].default_value = float(scale)
    checker.inputs["Color1"].default_value = (0.9, 0.9, 0.9, 1.0)
    checker.inputs["Color2"].default_value = (0.2, 0.2, 0.8, 1.0)

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    bsdf.inputs["Roughness"].default_value = 0.8
    bsdf.inputs["Metallic"].default_value = 0.0

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (300, 0)

    links.new(uv_node.outputs["UV"], checker.inputs["Vector"])
    links.new(checker.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    obj.data.materials.clear()
    obj.data.materials.append(mat)


def setup_uv_editor_viewport() -> None:
    """
    Reconfigure the default workspace so the UV Editor is visible.
    Splits the 3D viewport into (3D View | UV Editor) horizontally.
    Only runs in interactive mode — no-op in background renders.
    """
    if bpy.app.background:
        return
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            # Split the area: 60% 3D view, 40% UV editor
            bpy.ops.screen.area_split(
                {"area": area},
                direction="VERTICAL",
                factor=0.6,
            )
            # The new area (rightmost VIEW_3D) becomes the UV editor
            areas = bpy.context.screen.areas
            new_area = areas[-1]
            new_area.type = "IMAGE_EDITOR"
            new_area.ui_type = "UV"
            break


# ── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()

    gem = build_low_poly_gem()
    mark_seams_on_hard_edges(gem)
    unwrap_angle_based(gem)
    pack_uv_islands(gem)
    add_checker_material(gem, CHECKER_SCALE)
    setup_uv_editor_viewport()

    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    print(f"[blueprint] saved → {OUTPUT_BLEND}")
    print("[blueprint] Inspect in UV Editor. Confirm all checker squares "
          "are uniformly sized and axis-aligned.")


if __name__ == "__main__":
    main()
