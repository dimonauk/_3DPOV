"""
Holoflow Studio — Blender 5.1
bmesh.ops Primitive Forge
create_grid · create_cube · create_cone · create_icosphere
  · create_uvsphere · create_circle
Modular Crystal Environment Tile for WebXR

Technique:
  All six bmesh.ops.create_* operators share the same calling convention:
  target BMesh, optional 4×4 placement matrix, and calc_uvs flag.  They
  return {'verts': list[BMVert]} — direct element references usable for
  downstream transforms without any lookup-table refresh.

  The decisive advantage over bpy.ops.mesh.primitive_*: every create_*
  call works on a raw BMesh with no active Object, no mode switch, and no
  operator context.  Multiple primitives built in the same BMesh become a
  single mesh on bm.to_mesh() — zero object merges or join operations.

  Size semantics differ by operator (a genuine 5.1 gotcha):
    create_grid   → size is the HALF-SPAN  (verts at ±size)
    create_cube   → size is the EDGE LENGTH (corners at ±size/2)
    create_cone   → depth is the FULL HEIGHT (spans ±depth/2 on Z)
    create_*sphere / create_circle → radius is the CIRCUMRADIUS

  Studio prop: a 3 m × 3 m crystal floor tile with five hexagonal spires
  on a pentagon ring, icosphere gem caps at each tip, a UV-sphere accent
  atop the central pedestal cube, and flat circle-disc bases.
  Flat-shaded, Draco-compressed GLB for WebXR.

Outside sources:
  Blender Foundation — bmesh.ops API Reference — CC-BY-SA-4.0
  https://docs.blender.org/api/5.1/bmesh.ops.html
  Related: https://projects.blender.org/blender/blender

  KhronosGroup — glTF-Blender-IO — Apache-2.0
  https://github.com/KhronosGroup/glTF-Blender-IO
  Related: https://github.com/KhronosGroup/glTF
"""

import math
import bpy
import bmesh
from mathutils import Matrix

# ── PARAMETERS ─────────────────────────────────────────────────────────────
TILE_HALF    = 1.5    # create_grid size param: half-span → tile spans ±1.5 m
GRID_DIV     = 6      # 6×6 quads on the base floor

N_SPIRES     = 5      # pentagon of crystal spires
SPIRE_SEGS   = 6      # hexagonal cross-section for each spire
SPIRE_R_BASE = 0.18   # cone radius1 (base)
SPIRE_R_TIP  = 0.03   # cone radius2 (tip) — non-zero: hexagonal frustum, not pure cone
SPIRE_DEPTH  = 1.60   # cone depth (full height); cone centre sits at depth/2 above tile
SPIRE_RING_R = 0.95   # pentagon circumradius for spire base positions

GEM_SUBDIV   = 1      # icosphere subdivisions: 0=20 tris, 1=80 tris (faceted look)
GEM_RADIUS   = 0.11   # circumradius of gem cap

UV_SEGS_U    = 8      # u-segments for pedestal uvsphere
UV_SEGS_V    = 5      # v-segments — low count keeps poles faceted
UV_R         = 0.14   # uvsphere radius for pedestal accent

RING_SEGS    = 12     # segments in accent circle ring at each spire base
RING_RADIUS  = SPIRE_R_BASE + 0.09  # ring wider than spire base

PED_SIZE     = 0.58   # create_cube size = EDGE LENGTH → cube is 0.58 m³

EXPORT_PATH  = "//hf_crystal_tile.glb"
# ──────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def make_material(name: str, rgb: tuple,
                  metallic: float = 0.0, roughness: float = 0.6) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Metallic"].default_value   = metallic
    bsdf.inputs["Roughness"].default_value  = roughness
    return mat


def pentagon_positions():
    """Five evenly-spaced positions on a circle, starting at +Y."""
    return [
        (SPIRE_RING_R * math.cos(2 * math.pi * i / N_SPIRES + math.pi / 2),
         SPIRE_RING_R * math.sin(2 * math.pi * i / N_SPIRES + math.pi / 2))
        for i in range(N_SPIRES)
    ]


def build_tile() -> bpy.types.Object:
    bm = bmesh.new()
    # UV layer must be created BEFORE any create_* call with calc_uvs=True.
    # The operators write UV data to the active UV layer at creation time;
    # adding the layer afterward leaves every loop without UV coordinates.
    bm.loops.layers.uv.new("UVMap")

    # ── 1. BASE TILE: create_grid ──────────────────────────────────────────
    # size = HALF-SPAN.  create_grid(size=1.5) → verts at ±1.5 m = 3 m wide.
    # (Unlike create_cube where size is the full edge length — see note below.)
    bmesh.ops.create_grid(
        bm,
        x_segments=GRID_DIV, y_segments=GRID_DIV,
        size=TILE_HALF,
        calc_uvs=True,
    )

    # ── 2. CENTRAL PEDESTAL: create_cube ──────────────────────────────────
    # size = FULL EDGE LENGTH (corners at ±PED_SIZE/2).
    # Translate up by PED_SIZE/2 so the cube bottom sits flush on the tile.
    bmesh.ops.create_cube(
        bm,
        size=PED_SIZE,
        matrix=Matrix.Translation((0.0, 0.0, PED_SIZE / 2.0)),
        calc_uvs=True,
    )

    # ── 3. PEDESTAL ACCENT: create_uvsphere ───────────────────────────────
    # Low u/v segments keep the poles faceted.  Translate to pedestal top.
    bmesh.ops.create_uvsphere(
        bm,
        u_segments=UV_SEGS_U, v_segments=UV_SEGS_V,
        radius=UV_R,
        matrix=Matrix.Translation((0.0, 0.0, PED_SIZE + UV_R)),
        calc_uvs=True,
    )

    # ── 4. SPIRES: create_cone ─────────────────────────────────────────────
    # depth = FULL HEIGHT; cone is centred at matrix origin → spans ±depth/2.
    # To sit the base on the tile: translate Z by +depth/2.
    # radius2 > 0 → hexagonal frustum (truncated cone); avoids a sharp singularity.
    # cap_tris=False → n-gon caps (flat hexagonal faces, cleaner for flat-shading).
    for px, py in pentagon_positions():
        bmesh.ops.create_cone(
            bm,
            segments=SPIRE_SEGS,
            radius1=SPIRE_R_BASE,
            radius2=SPIRE_R_TIP,
            depth=SPIRE_DEPTH,
            cap_ends=True,
            cap_tris=False,
            matrix=Matrix.Translation((px, py, SPIRE_DEPTH / 2.0)),
            calc_uvs=True,
        )

    # ── 5. GEM CAPS: create_icosphere ─────────────────────────────────────
    # subdivisions=1 → 80 triangular faces — faceted but not too coarse.
    # Place the gem centre slightly below the spire tip so it sits nestled.
    gem_z = SPIRE_DEPTH - GEM_RADIUS * 0.7
    for px, py in pentagon_positions():
        bmesh.ops.create_icosphere(
            bm,
            subdivisions=GEM_SUBDIV,
            radius=GEM_RADIUS,
            matrix=Matrix.Translation((px, py, gem_z)),
            calc_uvs=True,
        )

    # ── 6. BASE RINGS: create_circle ──────────────────────────────────────
    # cap_ends=True → n-gon disc (filled).  cap_tris=False → single n-gon centre face.
    # cap_ends=False would give only the edge loop with no fill — useful for wire rings.
    # Offset 8 mm above tile to avoid z-fighting with the floor grid.
    for px, py in pentagon_positions():
        bmesh.ops.create_circle(
            bm,
            segments=RING_SEGS,
            radius=RING_RADIUS,
            cap_ends=True,
            cap_tris=False,
            matrix=Matrix.Translation((px, py, 0.008)),
            calc_uvs=True,
        )

    # ── 7. FLAT SHADE ──────────────────────────────────────────────────────
    bm.normal_update()
    for f in bm.faces:
        f.smooth = False
    for e in bm.edges:
        e.smooth = False

    # ── 8. SINGLE MESH ─────────────────────────────────────────────────────
    me = bpy.data.meshes.new("hf_crystal_tile")
    ob = bpy.data.objects.new("hf_crystal_tile", me)
    bpy.context.collection.objects.link(ob)
    bm.to_mesh(me)
    bm.free()
    me.update()
    return ob


def setup_scene(ob: bpy.types.Object) -> None:
    cam_data = bpy.data.cameras.new("cam")
    cam_ob   = bpy.data.objects.new("cam", cam_data)
    cam_ob.location      = (0.0, -5.5, 4.5)
    cam_ob.rotation_euler = (math.radians(52), 0.0, 0.0)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    sun = bpy.data.lights.new("sun", 'SUN')
    sun_ob = bpy.data.objects.new("sun", sun)
    sun_ob.location      = (4.0, -3.0, 6.0)
    sun_ob.rotation_euler = (0.6, 0.0, 0.85)
    sun.energy = 5.0
    bpy.context.collection.objects.link(sun_ob)


def main() -> None:
    purge_scene()

    mat_tile  = make_material("tile",  (0.12, 0.14, 0.18), metallic=0.3, roughness=0.75)
    mat_spire = make_material("spire", (0.38, 0.70, 0.95), metallic=0.65, roughness=0.18)

    ob = build_tile()
    ob.data.materials.append(mat_tile)
    ob.data.materials.append(mat_spire)
    setup_scene(ob)

    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        use_selection=True,
    )
    print(f"Exported → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
