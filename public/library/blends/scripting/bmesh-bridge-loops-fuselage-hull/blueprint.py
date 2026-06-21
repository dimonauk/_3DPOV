"""
blueprint.py  ─  bmesh-bridge-loops-fuselage-hull
Blender 5.1 | CC0

Builds a low-poly sci-fi fuselage hull using bmesh.ops.bridge_loops.

The key idea: define a series of circular cross-sections (rings) at varying
heights and radii, then bridge each consecutive pair into a watertight quad
surface.  bridge_loops takes all edges from both rings, identifies the two
cycles by graph connectivity, and fills the gap with SEGMENTS×1 quads — far
faster than placing every face by hand and guaranteed to produce exactly the
right vertex correspondence.

Two pitfalls to be aware of:
  1. Ring orientation — create_circle always builds on the XY plane at origin.
     We translate along +Z after creation.  If you rotate the ring before
     bridging, twist_offset becomes relevant and you may need to adjust it.
  2. End caps — bridge_loops fills between two open loops only.  We close
     each tip with a fan of triangles radiating from a centre vertex, then
     call recalc_face_normals once rather than juggling per-cap winding.

Exports: fuselage_hull.blend + fuselage_hull.glb (Draco L6, WebP)
"""

import os
import math
import bpy
import bmesh

# ── parameters ────────────────────────────────────────────────────────────────
# Profile: (z_height, radius) from tail to nose.  Adjust these to sculpt the
# silhouette — no 3D editing required.
PROFILE: list[tuple[float, float]] = [
    (0.00, 0.25),   # tail nozzle   — narrow engine exit
    (0.20, 0.80),   # engine bell   — fast outward flare
    (0.60, 1.20),   # belly         — widest section
    (1.20, 1.20),   # mid-body      — straight cylindrical run
    (1.80, 0.90),   # forward taper
    (2.20, 0.55),   # neck
    (2.50, 0.65),   # canopy bubble — slight re-expansion
    (2.80, 0.20),   # nose tip      — small closing ring
]
# SEGMENTS must be identical across all rings; bridge_loops requires equal
# vertex counts.  16 gives a clean silhouette while staying ~130 quads total.
SEGMENTS = 16

COL_HULL   = (0.05, 0.08, 0.12, 1.0)   # dark gunmetal hull
COL_ACCENT = (0.60, 0.80, 1.00, 1.0)   # cold-blue engine glow emission
EMIT_STR   = 2.5

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(SCRIPT_DIR, "fuselage_hull.blend")
GLB_PATH   = os.path.join(SCRIPT_DIR, "fuselage_hull.glb")


# ── helpers ───────────────────────────────────────────────────────────────────
def _clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials,
                  bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            block.remove(item)


def _ring_edges(bm: "bmesh.types.BMesh", verts: list) -> list:
    """Return edges whose both endpoints belong to `verts`."""
    vset = set(verts)
    return [e for e in bm.edges
            if e.verts[0] in vset and e.verts[1] in vset]


def _fan_cap(bm: "bmesh.types.BMesh",
             ring: list,
             z_centre: float,
             inward: bool = False) -> None:
    """
    Close an open ring with a fan of SEGMENTS triangles.
    `inward=True` flips the winding so the tail cap points -Z and the
    nose cap points +Z — both outward once recalc_face_normals runs.
    """
    centre = bm.verts.new((0.0, 0.0, z_centre))
    n = len(ring)
    for j in range(n):
        a = ring[j]
        b = ring[(j + 1) % n]
        if inward:
            bm.faces.new([b, a, centre])
        else:
            bm.faces.new([a, b, centre])


def _build_hull() -> tuple["bpy.types.Mesh", "bpy.types.Object"]:
    bm = bmesh.new()
    rings: list[list] = []

    # 1. Build each cross-section ring at its profile height.
    #    create_circle constructs on the XY plane at origin; we translate
    #    each ring to its target z immediately after creation.
    for z, r in PROFILE:
        res = bmesh.ops.create_circle(bm,
            cap_ends=False,    # open ring only — caps handled by _fan_cap
            cap_tris=False,
            segments=SEGMENTS,
            radius=r,
        )
        for v in res['verts']:
            v.co.z = z
        rings.append(res['verts'])

    # 2. Bridge consecutive rings into quad panels.
    #    use_cyclic=True is REQUIRED for closed rings; without it, bridge_loops
    #    treats each loop as an open chain and leaves a single gap in the hull.
    #    use_smooth=False preserves hard facet normals for the low-poly look.
    #    twist_offset=0 aligns the vertex at angle=0 on ring[i] to angle=0 on
    #    ring[i+1]; non-zero values introduce a helical twist between sections.
    for i in range(len(rings) - 1):
        lo = _ring_edges(bm, rings[i])
        hi = _ring_edges(bm, rings[i + 1])
        bmesh.ops.bridge_loops(bm,
            edges=lo + hi,
            use_cyclic=True,
            use_smooth=False,
            use_merge=False,
            merge_factor=0.5,
            twist_offset=0,
        )

    # 3. Fan-cap tail (pointing −Z) and nose (pointing +Z).
    _fan_cap(bm, rings[0],  z_centre=PROFILE[0][0],  inward=False)
    _fan_cap(bm, rings[-1], z_centre=PROFILE[-1][0], inward=True)

    # 4. Fix normals and weld any floating duplicates.
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)

    mesh = bpy.data.meshes.new("fuselage_hull")
    bm.to_mesh(mesh)
    bm.free()

    # Flat shading — each polygon uses its own face normal, giving the
    # hard-faceted silhouette favoured in cel/low-poly art pipelines.
    for poly in mesh.polygons:
        poly.use_smooth = False

    obj = bpy.data.objects.new("fuselage_hull", mesh)
    bpy.context.collection.objects.link(obj)
    return mesh, obj


def _hull_material() -> "bpy.types.Material":
    mat = bpy.data.materials.new("HullBase")
    mat.use_nodes = True
    nt   = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    out  = nt.nodes.get("Material Output")
    if not bsdf:
        return mat

    bsdf.inputs["Base Color"].default_value      = COL_HULL
    bsdf.inputs["Metallic"].default_value        = 0.80
    bsdf.inputs["Roughness"].default_value       = 0.18
    # Thin engine-glow emission seeded on the hull surface
    bsdf.inputs["Emission Color"].default_value  = COL_ACCENT
    bsdf.inputs["Emission Strength"].default_value = EMIT_STR * 0.30
    return mat


def _setup_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    # Positioned to show the fuselage from a 3/4 angle, nose elevated
    cam_obj.location       = (3.5, -3.0, 1.8)
    cam_obj.rotation_euler = (1.15, 0.0, 0.88)
    scene.camera           = cam_obj

    sun      = bpy.data.lights.new("Sun", 'SUN')
    sun_obj  = bpy.data.objects.new("Sun", sun)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (0.60, 0.20, -0.80)
    sun.energy = 5.0
    sun.angle  = 0.03   # narrow disc → sharper terminator on hull panels

    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.01, 0.02, 0.06, 1.0)
        bg.inputs["Strength"].default_value = 0.12
    scene.world = world


def _export_glb(obj: "bpy.types.Object") -> None:
    # Holoflow WebXR export conventions: apply transforms → clean origin,
    # Draco level 6, WebP textures, +Y up (glTF default, handled by exporter).
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
        export_apply=True,
        export_normals=True,
    )
    print(f"[holoflow] GLB  → {GLB_PATH}")


# ── main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    _clear_scene()
    _setup_scene()

    mesh, obj = _build_hull()
    mesh.materials.append(_hull_material())

    # Rotation keyframes for the record.py turntable
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0.0, 0.0, math.tau)
    obj.keyframe_insert("rotation_euler", frame=60)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    bpy.context.scene.frame_set(1)

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[holoflow] .blend → {BLEND_PATH}")

    _export_glb(obj)
    print("[holoflow] done.")


if __name__ == "__main__":
    main()
