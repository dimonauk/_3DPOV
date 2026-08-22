"""
Holoflow Studio — Blueprint
Python bpy.context.temp_override() — Headless Mesh Repair Pipeline
Blender 5.1  |  CC0 1.0 Universal

PURPOSE
-------
Incoming prop meshes from photogrammetry captures, kit-bash libraries, or
third-party downloads frequently arrive with three defects that break WebXR:

  1. Flipped / inconsistent face normals   → surfaces invisible behind backface culling
  2. Duplicate vertices at weld seams      → seam-split artefacts under Draco compression
  3. Stray triangles in quad-dominant areas → inflated index buffers and poorer LOD

This script demonstrates bpy.context.temp_override() — the Blender 4.0+
replacement for the deprecated context-dict pattern — to safely call
edit-mode mesh operators from any execution context:
  • Text Editor → Run Script
  • blender --python script.py --background (headless CLI)
  • Any Holoflow pipeline subprocess

OUTSIDE SOURCES
---------------
  Blender Manual — Context Overrides
    CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/manual/en/latest/advanced/scripting/context_override.html
    Sibling docs: bpy.ops overview · bpy.context screen areas · Writing Add-ons

  Blender Python API — bpy.types.Context.temp_override
    CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/api/current/bpy.types.Context.html#bpy.types.Context.temp_override
    Sibling: bpy.ops.mesh · bpy.ops.object · IDPropertyGroup
"""

import bpy
import time

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
COLLECTION_NAME = "holoflow_props"   # process only mesh objects in this collection
MERGE_THRESHOLD = 0.0001             # 0.1 mm weld distance — safe for prop-scale assets
TRI_FACE_ANGLE  = 0.698              # ~40° coplanarity limit for tri-to-quad merge
TRI_SHAPE_ANGLE = 0.698              # ~40° shape-factor companion (keeps quad regularity)
EXPORT_DIR      = "/tmp/holoflow_repaired/"
DRACO_LEVEL     = 6                  # studio default Draco compression level
EXPORT_GLB      = False              # flip to True to write per-object GLBs after repair


# ─── CONTEXT HELPER ───────────────────────────────────────────────────────────

def _find_view3d_context():
    """
    Walk every open window → screen → area to find the first VIEW_3D area.

    temp_override() needs window, area, and region populated for operators
    that poll() against the context.  bpy.ops.object.mode_set(),
    bpy.ops.mesh.select_all(), and all mesh repair operators require VIEW_3D.

    Running from Text Editor or CLI means bpy.context.area is a TEXT_EDITOR or
    None — both fail the VIEW_3D poll.  We therefore hunt for a 3D viewport
    that is already open in any screen of any window.

    Returns (window, area, region) where region.type == 'WINDOW'.
    Raises RuntimeError if no VIEW_3D is visible — caller must open one first,
    or switch to EXEC_DEFAULT execution context for operators that support it.
    """
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type != 'VIEW_3D':
                continue
            for region in area.regions:
                if region.type == 'WINDOW':
                    return window, area, region
    raise RuntimeError(
        "No VIEW_3D area found.  Open a 3D Viewport before running this "
        "script.  For fully-headless execution call bpy.ops.wm.window_new() "
        "and set the new screen's first area type to 'VIEW_3D' before calling "
        "_find_view3d_context()."
    )


# ─── REPAIR ───────────────────────────────────────────────────────────────────

def repair_mesh(obj, window, area, region):
    """
    Run three mesh-repair passes on obj inside a single edit-mode session.

    We enter Edit Mode once, run all three passes, then return to Object Mode.
    Each mode-set triggers a full depsgraph evaluation, so keeping them to the
    minimum (one in + one out) is critical for batch performance on dense meshes.
    """
    # Isolate selection — operators act on the active+selected object only
    bpy.context.view_layer.objects.active = obj
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    obj.select_set(True)

    with bpy.context.temp_override(window=window, area=area, region=region):
        # mode_set polls VIEW_3D and an active mesh object — both satisfied above
        bpy.ops.object.mode_set(mode='EDIT')

        # Select all geometry so every pass acts on the full mesh, not just
        # whatever happened to be selected when the script ran
        bpy.ops.mesh.select_all(action='SELECT')

        # ── Pass 1: Merge by Distance (renamed from Remove Doubles in 4.0) ──
        # MERGE_THRESHOLD of 0.1 mm catches UV-seam double vertices and
        # photogrammetry over-sampling without collapsing intentional micro-detail.
        # use_unselected=False prevents boundary-vertex creep across shell seams.
        bpy.ops.mesh.remove_doubles(
            threshold=MERGE_THRESHOLD,
            use_unselected=False,
        )

        # ── Pass 2: Recalculate Normals Outward ──
        # inside=False → point outward (standard for closed manifold props).
        # The operator uses BVHTree winding-order voting per connected shell,
        # so multi-shell meshes (outer hull + inner cavity detail) each get
        # their own consistent outward convention without cross-shell bleed.
        bpy.ops.mesh.normals_make_consistent(inside=False)

        # ── Pass 3: Triangles to Quads ──
        # Effective only where triangulated quads already exist (import-time
        # triangulation from OBJ/STL) — purely organic all-tri photogrammetry
        # meshes are unchanged.  face_threshold / shape_threshold together
        # prevent merging tris that span surface creases or form skewed quads.
        bpy.ops.mesh.tris_convert_to_quads(
            face_threshold=TRI_FACE_ANGLE,
            shape_threshold=TRI_SHAPE_ANGLE,
        )

        bpy.ops.object.mode_set(mode='OBJECT')

    print(f"  ✓ {obj.name}")


# ─── GLB EXPORT ───────────────────────────────────────────────────────────────

def export_repaired_glbs(objects):
    """
    Export each repaired mesh to a separate GLB using Holoflow studio settings.

    GLB export (bpy.ops.export_scene.gltf) does not need a VIEW_3D area — it
    is context-independent — but a window must still be present in the override
    or some Blender builds raise a 'no window' poll error.
    """
    import os
    os.makedirs(EXPORT_DIR, exist_ok=True)
    window = bpy.context.window_manager.windows[0]

    for obj in objects:
        for o in bpy.context.view_layer.objects:
            o.select_set(False)
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        out_path = os.path.join(EXPORT_DIR, f"{obj.name}.glb")
        with bpy.context.temp_override(window=window):
            bpy.ops.export_scene.gltf(
                filepath=out_path,
                use_selection=True,
                export_apply=True,
                export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=DRACO_LEVEL,
                export_image_format='WEBP',
                export_yup=True,
            )
        print(f"  ↳ exported → {out_path}")


# ─── DEMO SCENE BUILDER ───────────────────────────────────────────────────────

def build_demo_scene():
    """
    Create a demo collection with intentionally damaged meshes for testing.

    Demonstrates the problem being solved:
      sphere_a — half its faces have normals flipped (simulates scan import)
      cube_b   — imported from OBJ with triangulated quads and a weld seam

    In production, replace this function with your own asset loading logic.
    """
    # Ensure clean state
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    coll = bpy.data.collections.get(COLLECTION_NAME)
    if coll is None:
        coll = bpy.data.collections.new(COLLECTION_NAME)
        bpy.context.scene.collection.children.link(coll)

    # ── Sphere with partial flipped normals ──
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "sphere_damaged"
    # Flip every other face to simulate inconsistent winding from a scan
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(sphere.data)
    for i, face in enumerate(bm.faces):
        if i % 2 == 0:
            face.normal_flip()
    bm.to_mesh(sphere.data)
    bm.free()
    sphere.data.update()
    # Move to target collection
    bpy.context.scene.collection.objects.unlink(sphere)
    coll.objects.link(sphere)

    # ── Cube with triangulated OBJ-style topology ──
    bpy.ops.mesh.primitive_cube_add(size=0.8, location=(1.5, 0, 0))
    cube = bpy.context.active_object
    cube.name = "cube_triangulated"
    bm2 = bmesh.new()
    bm2.from_mesh(cube.data)
    bmesh.ops.triangulate(bm2, faces=bm2.faces)
    bm2.to_mesh(cube.data)
    bm2.free()
    cube.data.update()
    bpy.context.scene.collection.objects.unlink(cube)
    coll.objects.link(cube)

    print(f"[Demo] Created collection '{COLLECTION_NAME}' with 2 damaged meshes.")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    build_demo_scene()

    coll = bpy.data.collections.get(COLLECTION_NAME)
    mesh_objects = [o for o in coll.all_objects if o.type == 'MESH']
    print(f"\n[Holoflow Mesh Repair] {len(mesh_objects)} object(s) in '{COLLECTION_NAME}'")

    try:
        window, area, region = _find_view3d_context()
    except RuntimeError as e:
        print(f"[ERROR] {e}")
        return

    t0 = time.perf_counter()
    for obj in mesh_objects:
        repair_mesh(obj, window, area, region)

    elapsed = time.perf_counter() - t0
    print(f"[Holoflow Mesh Repair] Done in {elapsed:.2f}s")

    if EXPORT_GLB:
        export_repaired_glbs(mesh_objects)


main()
