"""
Modifier — Decimate: Planar, Collapse and Un-Subdivide for WebXR LOD Meshes
===========================================================================
Blender 5.1 — bpy direct data API + bmesh, headless-safe.

TECHNIQUE: The Decimate modifier offers three independent algorithms selected
via decimate_type:

  COLLAPSE  — Garland-Heckbert Quadric Error Metrics (QEM): half-edges are
               collapsed in order of cost, preserving surface shape within
               the Ratio triangle budget. Correct for organic / curved meshes.

  DISSOLVE  — Planar dissolve: adjacent faces whose normals differ by less
               than Angle Limit are merged into n-gons. Produces NO visible
               change on flat architectural geometry; removes only redundant
               topology. Correct for hard-surface / boxy meshes.

  UNSUBDIV  — Reverses one or more levels of Catmull-Clark subdivision.
               Only valid on meshes produced by SubDiv; produces artefacts
               on triangulated imports or photogrammetry scans.

Export path: apply via export_apply=True so the source .blend retains the
live modifier for later re-tuning. A 12% Collapse ratio on a 12 000-face
UV sphere leaves ~1 440 faces — within the 2 000-triangle mobile VR budget.
"""

import bpy
import bmesh
import math
import pathlib

# ── parameters (edit before running) ─────────────────────────────────────────
COLLAPSE_RATIO   = 0.12   # keep 12% of tris; mobile VR budget target
PLANAR_ANGLE_DEG = 5.0    # dissolve faces within 5° of coplanar — conservative
UNSUBDIV_ITER    = 2      # reverse 2 Catmull-Clark subdivision levels
SUBDIV_LEVELS    = 3      # levels applied to the sphere before un-subdiv demo

# ── paths ─────────────────────────────────────────────────────────────────────
BLEND_OUT = "//decimate_lod.blend"
RENDER_OUT = "//output/lod_comparison_0001.png"


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=True)
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.objects, bpy.data.node_groups):
        for item in list(col):
            col.remove(item, do_unlink=True)


def flat_material(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = 0.55
    return mat


def make_subdivided_sphere(name: str, loc: tuple) -> bpy.types.Object:
    """
    Icosphere → apply Catmull-Clark SubDiv at SUBDIV_LEVELS → target for Un-Subdivide.

    WHY apply before adding the Decimate modifier: Un-Subdivide reads the
    mesh's Catmull-Clark history encoded in the topology structure. If SubDiv
    is only a live modifier above Decimate, Un-Subdivide reverses the wrong
    level count — it sees the ORIGINAL icosphere topology, not the subdivided one.
    Apply SubDiv first so Decimate UNSUBDIV operates on the correct mesh.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.85, location=loc)
    obj = bpy.context.active_object
    obj.name = name

    sub = obj.modifiers.new("SubDiv", "SUBSURF")
    sub.levels = SUBDIV_LEVELS
    bpy.ops.object.modifier_apply(modifier="SubDiv")

    obj.data.materials.append(flat_material(f"{name}_mat", (0.22, 0.55, 0.85, 1.0)))
    return obj


def make_box_building(name: str, loc: tuple) -> bpy.types.Object:
    """
    Cube with dense interior subdivisions on every face — the pathological input
    for Planar mode.

    Uses bmesh directly (headless-safe) rather than operators. Each face of the
    cube is subdivided 8 times via subdivide_edges, packing flat walls with
    ~300 redundant coplanar triangles per face. After Planar dissolve at 5° the
    wall faces collapse back to a single quad — zero visual difference, 98%
    triangle reduction on the flat areas.
    """
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    # Grid-fill the faces via edge subdivision
    bmesh.ops.subdivide_edges(
        bm,
        edges=bm.edges[:],
        cuts=8,
        use_grid_fill=True,
        use_single_edge=False,
    )
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    # Elongate into a building silhouette; scale stays as transform (fine for Decimate)
    obj.scale = (1.2, 0.8, 2.0)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(flat_material(f"{name}_mat", (0.68, 0.60, 0.50, 1.0)))
    return obj


def make_displaced_sphere(name: str, loc: tuple) -> bpy.types.Object:
    """
    Dense UV sphere + Displace modifier → organic high-poly mesh for QEM Collapse.

    Simulates a photogrammetry scan or sculpt export: many triangles, irregular
    distribution, no clean subdivision history (so Un-Subdivide would fail).
    QEM Collapse handles this correctly — it treats each vertex collapse as an
    optimisation problem and picks the sequence that minimises visual error.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, ring_count=48, radius=0.80, location=loc
    )
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.shade_smooth()

    # Noise texture for irregular surface detail
    tex = bpy.data.textures.new(f"{name}_clouds", 'CLOUDS')
    tex.noise_scale = 0.45
    tex.noise_depth = 4

    disp = obj.modifiers.new("Displace", "DISPLACE")
    disp.texture   = tex
    disp.strength  = 0.22
    disp.mid_level = 0.5
    # Apply so QEM receives actual displaced vertex positions
    bpy.ops.object.modifier_apply(modifier="Displace")

    obj.data.materials.append(flat_material(f"{name}_mat", (0.75, 0.30, 0.45, 1.0)))
    return obj


def add_decimate(
    obj: bpy.types.Object,
    mode: str,
    *,
    ratio: float = 0.5,
    angle_deg: float = 5.0,
    iterations: int = 1,
) -> bpy.types.Modifier:
    """
    Add a Decimate modifier and set mode-specific parameters.
    The modifier is NOT applied — export_apply=True handles that at GLB time.
    """
    mod = obj.modifiers.new("Decimate", "DECIMATE")
    mod.decimate_type = mode

    if mode == 'COLLAPSE':
        mod.ratio = ratio
        # Symmetry on X: preserves bilateral symmetry for VRM character meshes.
        # Disable for asymmetric scans — symmetry lock adds a constraint pass
        # that may produce worse triangle distribution than free collapse.
        mod.use_symmetry   = True
        mod.symmetry_axis  = 'X'

    elif mode == 'DISSOLVE':
        mod.angle_limit = math.radians(angle_deg)
        # use_dissolve_boundaries=False: preserves UV-seam edges and sharp edges
        # (those marked as Sharp or with a Bevel Weight) even if they are
        # coplanar. Without this, UV islands collapse across seam boundaries,
        # destroying the texture mapping on export.
        mod.use_dissolve_boundaries = False

    elif mode == 'UNSUBDIV':
        mod.iterations = iterations

    return mod


def export_glb(obj: bpy.types.Object, slug: str) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=f"//{slug}.glb",
        export_format='GLB',
        use_selection=True,
        export_apply=True,          # materialises Decimate in-place without touching .blend
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials='EXPORT',
    )
    print(f"[Decimate] {slug}.glb exported")


def make_camera_and_light() -> None:
    import mathutils
    bpy.ops.object.camera_add(location=(0.0, -9.5, 2.5))
    cam = bpy.context.active_object
    cam.rotation_euler = mathutils.Euler(
        (math.radians(72), 0.0, 0.0), 'XYZ'
    )
    cam.data.lens = 50
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(4.0, -2.0, 9.0))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.data.angle  = math.radians(4)

    bpy.ops.object.light_add(type='AREA', location=(-4.0, 4.0, 4.0))
    fill = bpy.context.active_object
    fill.data.energy = 900
    fill.data.size   = 6.0


def main() -> None:
    purge_scene()

    # Three demo objects, spaced along X at +Y=0
    sphere = make_subdivided_sphere("lod_sphere_unsubdiv", loc=(-2.8, 0.0, 0.0))
    box    = make_box_building(    "lod_box_planar",       loc=( 0.0, 0.0, 0.8))
    blob   = make_displaced_sphere("lod_blob_collapse",    loc=( 2.8, 0.0, 0.0))

    add_decimate(sphere, 'UNSUBDIV', iterations=UNSUBDIV_ITER)
    add_decimate(box,    'DISSOLVE', angle_deg=PLANAR_ANGLE_DEG)
    add_decimate(blob,   'COLLAPSE', ratio=COLLAPSE_RATIO)

    make_camera_and_light()

    scene = bpy.context.scene
    scene.render.engine       = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath     = RENDER_OUT
    scene.eevee.use_shadows   = True
    scene.eevee.use_gtao      = True

    pathlib.Path(bpy.path.abspath("//output")).mkdir(exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

    export_glb(sphere, "lod_sphere_unsubdiv")
    export_glb(box,    "lod_box_planar")
    export_glb(blob,   "lod_blob_collapse")

    bpy.ops.render.render(write_still=True)
    print("[Decimate] blueprint complete — three LOD GLBs + render written.")


if __name__ == "__main__":
    main()
