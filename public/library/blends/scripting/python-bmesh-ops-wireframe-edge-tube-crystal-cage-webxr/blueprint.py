"""
Holoflow Studio — Blender 5.1
bmesh.ops.wireframe
Edge-Tube Lattice, Crystal Cage & Holographic Grid for WebXR

Technique:
  bmesh.ops.wireframe solidifies every edge in the selected face set into a
  rectangular tube by inserting new vertices at each face corner, building
  quad rings around each edge, and (when use_replace=True) removing the
  original face fill.  The result is a hollow lattice driven entirely from
  Python — no active Object, no Edit Mode, no undo-stack overhead.

  Two studio props:
    hf_wireframe_cage.glb     — icosahedron crystal cage (hollow, emissive)
    hf_wireframe_grid_hud.glb — 6×6 flat grid HUD panel (fill + wire)

  Outside sources:
    Blender Foundation — bmesh.ops API Reference — CC-BY-SA-4.0
    https://docs.blender.org/api/5.1/bmesh.ops.html
    Related: https://projects.blender.org/blender/blender

    KhronosGroup — glTF-Blender-IO — Apache-2.0
    https://github.com/KhronosGroup/glTF-Blender-IO
    Related: https://github.com/KhronosGroup/glTF
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
CAGE_SUBDIVS         = 1      # icosahedron subdivisions (0=20f · 1=80f · 2=320f)
CAGE_RADIUS          = 1.0    # base radius in metres
CAGE_THICKNESS       = 0.045  # tube half-width in metres
CAGE_OFFSET          = 0.005  # inward offset before tube starts (face-normal direction)

GRID_DIVISIONS       = 6      # N×N cell count for HUD grid
GRID_SCALE           = 1.2    # half-extents in metres
GRID_TUBE            = 0.022  # tube half-width for grid lines

EXPORT_CAGE_PATH     = "//hf_wireframe_cage.glb"
EXPORT_GRID_PATH     = "//hf_wireframe_grid_hud.glb"
# ──────────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def make_material(name: str, rgb: tuple, metallic: float = 0.0,
                  roughness: float = 0.5, emission: float = 0.0,
                  alpha: float = 1.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (*rgb, 1.0)
    bsdf.inputs["Metallic"].default_value    = metallic
    bsdf.inputs["Roughness"].default_value   = roughness
    bsdf.inputs["Alpha"].default_value       = alpha
    if emission > 0.0:
        bsdf.inputs["Emission Strength"].default_value = emission
        bsdf.inputs["Emission Color"].default_value    = (*rgb, 1.0)
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
    return mat


def build_crystal_cage() -> bpy.types.Object:
    """
    Hollow icosahedron cage via bmesh.ops.wireframe.

    use_replace=True:
      Original fill faces are deleted — only the tube quads remain.
      Result is a true hollow lattice.  The mesh has no interior faces
      blocking WebXR depth-sorting.

    use_replace=False would retain fill faces and lay wire tubes on
    top of the surface — used in build_grid_hud() below to keep the
    panel backdrop visible.

    use_even_offset=True:
      Distributes tube thickness evenly at angled junctions.  Without it,
      tubes at narrow junction angles look thinner than those at right
      angles — visible as inconsistent emissive brightness in real-time
      rendering.  Always enable for isotropic lattices.

    use_boundary=False:
      A closed icosphere has no boundary edges (every edge borders two
      faces) so this flag has no visual effect here.  Documented for the
      grid HUD below where boundary edges ARE present.

    material_offset=0:
      Wire quads inherit the same slot index as the source faces.  Since
      use_replace=True removes all fill faces, only the wire material
      needs to be present in me.materials[0].

    Topology invariant:
      Each original edge in the input mesh produces four new quad faces
      forming a rectangular-section tube.  The total face count after
      wireframe is 4 × (original edge count).  On a subdivided icosphere
      with 1 subdivision: 120 edges → 480 quad tube faces.
    """
    bm = bmesh.new()
    bmesh.ops.create_icosphere(
        bm,
        subdivisions = CAGE_SUBDIVS,
        radius       = CAGE_RADIUS,
        calc_uvs     = False,
    )
    bm.normal_update()

    result = bmesh.ops.wireframe(
        bm,
        faces               = list(bm.faces),
        thickness           = CAGE_THICKNESS,
        offset              = CAGE_OFFSET,
        use_even_offset     = True,
        use_replace         = True,
        use_boundary        = False,
        use_crease          = False,
        use_relative_offset = False,
        material_offset     = 0,
    )

    for f in result['faces']:
        f.smooth = False
    bm.normal_update()
    for e in bm.edges:
        e.smooth = False   # writes 'sharp_edge' attribute → split normals in GLB

    me = bpy.data.meshes.new("hf_wireframe_cage")
    bm.to_mesh(me)
    bm.free()
    me.update()

    mat = make_material(
        "hf_cage_wire",
        rgb=(0.04, 0.55, 0.98),
        metallic=0.9, roughness=0.12, emission=2.5,
    )
    me.materials.append(mat)

    obj = bpy.data.objects.new("hf_wireframe_cage", me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_grid_hud() -> bpy.types.Object:
    """
    6×6 grid HUD panel via wireframe with use_replace=False.

    use_boundary=True:
      A flat grid has perimeter edges with only one adjacent face
      (boundary).  Setting use_boundary=True extends tubes to those
      edges so the outer frame of the HUD panel is solid.  Without it
      the grid border is an open ragged rim.

    use_replace=False:
      Keeps the original flat fill quads.  The wire tubes sit on top.
      material_offset=1 shifts wire quads to material slot 1 (emissive)
      while fill quads remain at slot 0 (semi-transparent glass).

    Two-material depth cue:
      Semi-transparent fill (alpha=0.12) gives the panel a volumetric
      presence in WebXR environments.  A fully transparent fill makes
      the grid appear to float with no depth reference; the slight tint
      anchors it spatially for parallax depth sorting.
    """
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments = GRID_DIVISIONS,
        y_segments = GRID_DIVISIONS,
        size       = GRID_SCALE,
        calc_uvs   = False,
    )
    bm.normal_update()

    result = bmesh.ops.wireframe(
        bm,
        faces               = list(bm.faces),
        thickness           = GRID_TUBE,
        offset              = 0.001,
        use_even_offset     = True,
        use_replace         = False,   # keep fill quads
        use_boundary        = True,    # outer frame edges included
        use_crease          = False,
        use_relative_offset = False,
        material_offset     = 1,       # wire → slot 1, fill stays slot 0
    )

    for f in result['faces']:
        f.smooth = False
    bm.normal_update()
    for e in bm.edges:
        e.smooth = False

    me = bpy.data.meshes.new("hf_wireframe_grid_hud")
    bm.to_mesh(me)
    bm.free()
    me.update()

    mat_fill = make_material(
        "hf_hud_fill",
        rgb=(0.04, 0.18, 0.42),
        metallic=0.0, roughness=0.9, alpha=0.12,
    )
    mat_wire = make_material(
        "hf_hud_wire",
        rgb=(0.12, 0.78, 1.0),
        metallic=0.85, roughness=0.08, emission=3.0,
    )
    me.materials.append(mat_fill)   # slot 0
    me.materials.append(mat_wire)   # slot 1

    obj = bpy.data.objects.new("hf_wireframe_grid_hud", me)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (3.0, 0.0, 0.0)
    obj.rotation_euler = (math.radians(90), 0.0, 0.0)  # face camera for HUD
    return obj


def export_glb(obj: bpy.types.Object, path: str) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(
        filepath                              = bpy.path.abspath(path),
        use_selection                         = True,
        export_format                         = 'GLB',
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_image_format                   = 'WEBP',
        export_yup                            = True,
        export_apply                          = True,
    )


def main() -> None:
    purge_scene()
    cage = build_crystal_cage()
    grid = build_grid_hud()
    export_glb(cage, EXPORT_CAGE_PATH)
    export_glb(grid, EXPORT_GRID_PATH)
    print("[holoflow] wireframe cage + grid HUD → GLB done")


main()
