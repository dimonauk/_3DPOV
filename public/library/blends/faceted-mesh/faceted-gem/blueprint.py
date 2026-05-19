"""
blueprint.py — Faceted gem polyhedron with flat normals in Blender 5.1
Holoflow Studio / public/library/blends/faceted-mesh/faceted-gem/

WHY bmesh instead of bpy.ops:
  bpy.ops operators are context-dependent: they require an active window,
  a specific space type (VIEW_3D), and an active object in the right mode.
  They silently fail or raise RuntimeError when called from a background
  process, from a GN script node, or any context that doesn't match their
  poll(). bmesh operates directly on mesh data — no context required, no
  operator overhead, safe in headless --background runs, and trivially
  callable from a Geometry Nodes Python script node in Blender 5.x.

Blender 5.1 note on flat normals:
  mesh.use_auto_smooth was removed in 4.1. Per-polygon shading is now
  controlled via poly.use_smooth directly on each polygon. The "Smooth by
  Angle" modifier is the new canonical route for mixed smooth/flat surfaces;
  for a fully-faceted gem we skip the modifier and set every polygon flat.

Run:  blender --python blueprint.py
      blender --background --python blueprint.py
"""

import math
import bpy
import bmesh

# ─── Named constants ────────────────────────────────────────────────────────
SIDES          = 8       # girdle vertex count (octagonal cut)
CROWN_HEIGHT   = 0.30    # z of the table face above girdle z=0
TABLE_SCALE    = 0.55    # table ring radius relative to GIRDLE_RADIUS
GIRDLE_RADIUS  = 1.00    # equatorial radius
PAVILION_DEPTH = 0.55    # z depth of the culet below girdle z=0
IOR            = 1.77    # index of refraction (~cubic zirconia)
GEM_COLOR      = (0.08, 0.55, 0.90, 1.0)  # rich blue
OUTPUT_GLB     = "//faceted_gem.glb"
OUTPUT_BLEND   = "//faceted_gem.blend"

BEZEL_HEIGHT = CROWN_HEIGHT * 0.55
BEZEL_RADIUS = TABLE_SCALE  * 1.25
PAV1_Z = -0.08
PAV1_R = GIRDLE_RADIUS * 0.88
PAV2_Z = -(PAVILION_DEPTH * 0.55)
PAV2_R = GIRDLE_RADIUS  * 0.42


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _ring(bm, n, radius, z, offset=0.0):
    """n evenly-spaced verts at height z; returns list in CCW order (+Z view)."""
    return [
        bm.verts.new((radius * math.cos(2*math.pi*i/n + offset),
                      radius * math.sin(2*math.pi*i/n + offset), z))
        for i in range(n)
    ]


def _j(i): return (i + 1) % SIDES


# ─── Mesh construction ───────────────────────────────────────────────────────

def _build_gem_mesh(mesh):
    """
    Crown:    girdle → bezel quads → table quads + table polygon
    Pavilion: girdle → ring1 → ring2 → culet fan

    Winding note: bm.faces.new([...]) assigns the normal toward the CCW
    vertex order seen from outside. Reversed lists where needed so normals
    point outward.
    """
    bm = bmesh.new()

    # Crown rings — table offset by half-step creates star facet pattern
    girdle = _ring(bm, SIDES, GIRDLE_RADIUS, 0.0)
    bezel  = _ring(bm, SIDES, BEZEL_RADIUS,  BEZEL_HEIGHT)
    table  = _ring(bm, SIDES, TABLE_SCALE,   CROWN_HEIGHT,
                   offset=math.pi / SIDES)

    for i in range(SIDES):
        j = _j(i)
        # Crown bezel quads: girdle edge → bezel edge
        bm.faces.new([girdle[i], girdle[j], bezel[j], bezel[i]])
        # Crown star quads: bezel edge → table edge
        bm.faces.new([bezel[i], bezel[j], table[j], table[i]])

    # Table polygon — reverse winding: face seen from +Z must wind CW in world
    # XY so that the outward normal points up (+Z).
    bm.faces.new(list(reversed(table)))

    # Pavilion rings
    pav1  = _ring(bm, SIDES, PAV1_R, PAV1_Z)
    pav2  = _ring(bm, SIDES, PAV2_R, PAV2_Z)
    culet = bm.verts.new((0.0, 0.0, -PAVILION_DEPTH))

    for i in range(SIDES):
        j = _j(i)
        # Girdle → ring1 quads (slope outward-down)
        bm.faces.new([girdle[i], pav1[i], pav1[j], girdle[j]])
        # Ring1 → ring2 quads (converging inward)
        bm.faces.new([pav1[i], pav2[i], pav2[j], pav1[j]])
        # Culet fan — reverse winding: seen from below, CCW = outward (-Z)
        bm.faces.new([pav2[_j(i)], culet, pav2[i]])

    bm.to_mesh(mesh)
    bm.free()

    # Flat normals — poly.use_smooth = False is the direct per-polygon toggle
    # in Blender 4.1+. Every face flat → every facet catches light at its own
    # angle: the Holoflow high-facet aesthetic.
    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()


# ─── Material ────────────────────────────────────────────────────────────────

def _build_material(name="GemCrystal"):
    """Principled BSDF EEVEE Next glass: near-mirror, refractive, blue tint."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.blend_method = "HASHED"   # correct Z-sort for glass in EEVEE Next
    mat.use_screen_refraction = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    out.location  = (300, 0)
    bsdf.location = (0, 0)

    bsdf.inputs["Base Color"].default_value           = GEM_COLOR
    bsdf.inputs["Roughness"].default_value            = 0.03
    bsdf.inputs["IOR"].default_value                  = IOR
    bsdf.inputs["Transmission Weight"].default_value  = 0.95

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ─── Lighting + Camera ───────────────────────────────────────────────────────

def _add_light(name, kind, energy, loc, color=(1.0, 1.0, 1.0)):
    ld  = bpy.data.lights.new(name=name, type=kind)
    ld.energy = energy
    ld.color  = color
    obj = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    return obj


def _build_lighting_rig():
    """3-point rig: Key (warm, dominant), Fill (cool), Rim (back edge)."""
    _add_light("Key",  "POINT", 800.0, ( 4.0, -3.0, 5.0), (1.00, 0.96, 0.88))
    _add_light("Fill", "POINT", 250.0, (-5.0,  2.0, 2.5), (0.85, 0.90, 1.00))
    _add_light("Rim",  "POINT", 400.0, ( 0.5,  6.0, 4.0), (1.00, 1.00, 1.00))


def _build_camera():
    """Camera at 45° elevation, 6 units out; aims at origin via track-to-quat."""
    d, elev, azim = 6.0, math.radians(45), math.radians(-45)
    loc = (d*math.cos(elev)*math.cos(azim),
           d*math.cos(elev)*math.sin(azim),
           d*math.sin(elev))
    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = loc
    cam_obj.rotation_euler = cam_obj.location.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam_obj
    return cam_obj


# ─── Scene clear ─────────────────────────────────────────────────────────────

def _clear_scene():
    """Remove all default objects via the data API (no bpy.ops context needed)."""
    for col   in list(bpy.data.collections): bpy.data.collections.remove(col)
    for obj   in list(bpy.data.objects):     bpy.data.objects.remove(obj, do_unlink=True)
    for me    in list(bpy.data.meshes):      bpy.data.meshes.remove(me)
    for light in list(bpy.data.lights):      bpy.data.lights.remove(light)
    for cam   in list(bpy.data.cameras):     bpy.data.cameras.remove(cam)


# ─── Export ──────────────────────────────────────────────────────────────────

def _export_glb(path):
    """Holoflow GLB conventions: +Y up, apply transforms, Draco 6, normals."""
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_normals=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_materials="EXPORT",
        use_mesh_edges=False,
        use_mesh_vertices=False,
    )


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    _clear_scene()

    mesh    = bpy.data.meshes.new("FacetedGemMesh")
    _build_gem_mesh(mesh)
    gem_obj = bpy.data.objects.new("FacetedGem", mesh)
    bpy.context.collection.objects.link(gem_obj)
    gem_obj.data.materials.append(_build_material())

    _build_lighting_rig()
    _build_camera()

    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"

    _export_glb(OUTPUT_GLB)
    print(f"[blueprint] GLB exported → {OUTPUT_GLB}")

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    print(f"[blueprint] .blend saved → {OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
