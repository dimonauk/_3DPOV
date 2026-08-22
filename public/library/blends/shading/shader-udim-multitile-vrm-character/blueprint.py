"""
UDIM Multi-Tile UV Layout — VRM Character Torso
Blender 5.1  |  bpy direct API  |  CC0

A VRM humanoid torso is UV-unwrapped across three UDIM tiles:
  1001 (U 0–1) — front hemisphere
  1002 (U 1–2) — back hemisphere
  1003 (U 2–3) — neck / cap

The Principled BSDF material uses an Image Texture node set to
source=TILED.  Blender resolves the <UDIM> token at render time,
sampling the correct tile per UV coordinate automatically.

After painting, the three tiles are collapsed into a single 4K
atlas via a Diffuse bake onto a second UV channel, ready for
GLB / WebXR export (glTF 2.0 has no UDIM support).

Why UDIM instead of one large atlas from the start?
  — Each tile is independent: face tile can be 4K while back stays 1K.
  — No cross-island bleeding from tight packing.
  — USD, Houdini, and Katana all treat UDIMs natively — this blend
    is production-compatible for any downstream DCC.
  — Blender Cycles and EEVEE Next both resolve TILED images natively;
    no special render setting is required.

Departure: the mesh is a deliberately low-poly 12-sided torso stack
(not a subdivision cage).  The focus is the UV tiling workflow, not
the sculpt pipeline; large readable UV islands beat mesh fidelity here.
"""

import math
import bpy
import bmesh
from mathutils import Vector

# ── constants ─────────────────────────────────────────────────────────────────
TILE_RES   = 1024          # pixels per UDIM tile (swap to 4096 for production)
ATLAS_RES  = 4096          # combined atlas resolution for GLB export
OUT_PATH   = "//textures/" # relative to .blend; Blender creates the dir
SLUG       = "udim_character_torso"
SEGS       = 12            # horizontal cylinder divisions
PROFILE    = [             # (radius, height) from hip to neck-top
    (0.30, 0.00),
    (0.32, 0.20),
    (0.28, 0.40),
    (0.31, 0.60),
    (0.34, 0.80),
    (0.30, 1.00),
    (0.20, 1.15),
    (0.12, 1.28),
    (0.10, 1.38),
]


# ── scene helpers ─────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def new_col(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def relink(obj: bpy.types.Object, col: bpy.types.Collection) -> bpy.types.Object:
    col.objects.link(obj)
    try:
        bpy.context.scene.collection.objects.unlink(obj)
    except RuntimeError:
        pass
    return obj


# ── mesh ──────────────────────────────────────────────────────────────────────
def build_torso() -> bpy.types.Object:
    me = bpy.data.meshes.new("torso_mesh")
    ob = bpy.data.objects.new("torso", me)
    bpy.context.scene.collection.objects.link(ob)

    bm = bmesh.new()
    rings: list[list[bmesh.types.BMVert]] = []

    for r, h in PROFILE:
        verts = []
        for i in range(SEGS):
            a = 2 * math.pi * i / SEGS
            verts.append(bm.verts.new(Vector((r * math.cos(a), r * math.sin(a), h))))
        rings.append(verts)

    for ri in range(len(rings) - 1):
        for vi in range(SEGS):
            nv = (vi + 1) % SEGS
            bm.faces.new([rings[ri][vi], rings[ri][nv],
                          rings[ri + 1][nv], rings[ri + 1][vi]])

    # close top and bottom with n-gon caps
    bm.faces.new(rings[0])
    bm.faces.new(rings[-1])

    bm.to_mesh(me)
    bm.free()
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    return ob


# ── UDIM UV layout ────────────────────────────────────────────────────────────
def unwrap_udim(ob: bpy.types.Object) -> None:
    """
    Manually assign UV coordinates so faces land in the correct tiles.

    Front-facing segments (seg_idx < SEGS//2) → tile 1001, U in [0, 1].
    Back-facing segments                      → tile 1002, U in [1, 2].
    Cap faces                                 → tile 1003, U in [2, 3].

    We do this by hand rather than calling bpy.ops.uv.smart_project()
    because that operator always places all islands in tile 1001 and
    gives no control over the multi-tile placement.
    """
    bpy.ops.object.mode_set(mode="EDIT")
    bm_e = bmesh.from_edit_mesh(ob.data)
    bm_e.faces.ensure_lookup_table()
    uv = bm_e.loops.layers.uv.new("UVMap")

    n_band_faces = (len(PROFILE) - 1) * SEGS  # total ring-band faces

    for fi, face in enumerate(bm_e.faces):
        if fi >= n_band_faces:
            # cap face: radial layout inside tile 1003
            u_off = 2.0
            cx = face.calc_center_median()
            for loop in face.loops:
                v = loop.vert.co
                a = math.atan2(v.y, v.x)
                r = math.hypot(v.x, v.y) * 0.45
                loop[uv].uv = (u_off + 0.5 + r * math.cos(a),
                                0.5 + r * math.sin(a))
        else:
            band = fi // SEGS
            seg  = fi % SEGS
            half = SEGS // 2
            u_off = 0.0 if seg < half else 1.0
            # normalise seg within its half-cylinder
            local_seg  = seg % half
            b0 = band / (len(PROFILE) - 1)
            b1 = (band + 1) / (len(PROFILE) - 1)
            s0 = local_seg / half
            s1 = (local_seg + 1) / half
            coords = [(u_off + s0, b0), (u_off + s1, b0),
                      (u_off + s1, b1), (u_off + s0, b1)]
            for loop, co in zip(face.loops, coords):
                loop[uv].uv = co

    bmesh.update_edit_mesh(ob.data)
    bpy.ops.object.mode_set(mode="OBJECT")


# ── UDIM images ───────────────────────────────────────────────────────────────
def create_udim_images() -> dict[int, bpy.types.Image]:
    """
    One flat-colour image per tile as painting targets.
    In production you would load or bake into these; here we fill
    them with a base skin colour so renders are immediately readable.
    """
    colours = {
        1001: (0.72, 0.53, 0.40, 1.0),  # front — warm ochre
        1002: (0.58, 0.42, 0.32, 1.0),  # back  — slightly darker
        1003: (0.80, 0.63, 0.50, 1.0),  # neck  — lighter highlight
    }
    images: dict[int, bpy.types.Image] = {}
    for tile, col in colours.items():
        name = f"{SLUG}.{tile}"
        img  = bpy.data.images.new(name, TILE_RES, TILE_RES, alpha=False)
        img.pixels[:] = col * (TILE_RES * TILE_RES)
        img.filepath  = f"{OUT_PATH}{name}.png"
        img.file_format = "PNG"
        images[tile] = img
    return images


# ── material ──────────────────────────────────────────────────────────────────
def make_udim_material(ob: bpy.types.Object,
                       images: dict[int, bpy.types.Image]) -> bpy.types.Material:
    """
    source='TILED' on the Image Texture node is the key flag that
    activates UDIM sampling.  Blender infers sibling tiles from the
    anchor image (tile 1001) and the tiles registered in image.tiles.
    The <UDIM> path token is not required in the node itself — the
    tiles list drives the lookup.
    """
    mat   = bpy.data.materials.new("udim_skin")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out   = nodes.new("ShaderNodeOutputMaterial");  out.location   = (500, 0)
    bsdf  = nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location  = (200, 0)
    tex   = nodes.new("ShaderNodeTexImage");        tex.location   = (-150, 50)
    uvmap = nodes.new("ShaderNodeUVMap");            uvmap.location = (-380, 50)

    tex.image        = images[1001]
    tex.image.source = "TILED"
    # register sibling tiles (offsets from 1001: 1002 = offset 1, 1003 = offset 2)
    for offset in [1, 2]:
        images[1001].tiles.new(tile_offset=offset)

    uvmap.uv_map = "UVMap"
    links.new(uvmap.outputs["UV"],   tex.inputs["Vector"])
    links.new(tex.outputs["Color"],  bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    bsdf.inputs["Roughness"].default_value          = 0.65
    bsdf.inputs["Metallic"].default_value           = 0.0
    bsdf.inputs["Subsurface Weight"].default_value  = 0.08  # Blender 5.1 SSS
    bsdf.inputs["Subsurface Radius"].default_value  = (1.0, 0.2, 0.1)

    ob.data.materials.clear()
    ob.data.materials.append(mat)
    return mat


# ── single-atlas bake for GLB ─────────────────────────────────────────────────
def bake_udim_to_atlas(ob: bpy.types.Object) -> bpy.types.Image:
    """
    Remap three UDIM tiles → one 4K atlas for GLB export.

    atlas_uv layout:
      tile 1001 (U 0–1) → atlas U 0.00–0.33
      tile 1002 (U 1–2) → atlas U 0.33–0.66
      tile 1003 (U 2–3) → atlas U 0.66–1.00

    A second UV channel atlas_uv stores the remapped coordinates.
    Cycles bakes Diffuse Color from the UDIM source UVMap onto the
    atlas target using atlas_uv.  The source channel must be active
    during painting; atlas_uv is only needed at bake time.
    """
    atlas = bpy.data.images.new("udim_atlas", ATLAS_RES, ATLAS_RES, alpha=False)
    atlas.filepath    = f"{OUT_PATH}{SLUG}_atlas.png"
    atlas.file_format = "PNG"

    me = ob.data
    atlas_uv = me.uv_layers.new(name="atlas_uv")
    src_uv   = me.uv_layers["UVMap"]

    for poly in me.polygons:
        for li in poly.loop_indices:
            u, v = src_uv.data[li].uv
            tile_idx = int(u)          # 0 → 1001, 1 → 1002, 2 → 1003
            frac_u   = u - tile_idx
            atlas_uv.data[li].uv = ((tile_idx + frac_u) / 3.0, v)

    me.uv_layers.active = atlas_uv

    mat       = ob.data.materials[0]
    bake_node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    bake_node.image = atlas
    mat.node_tree.nodes.active = bake_node

    scn = bpy.context.scene
    scn.render.engine          = "CYCLES"
    scn.cycles.device          = "CPU"
    scn.cycles.samples         = 1  # flat-colour; 1 sample is exact
    scn.render.bake.use_pass_direct   = False
    scn.render.bake.use_pass_indirect = False
    scn.render.bake.use_pass_color    = True

    bpy.ops.object.bake(type="DIFFUSE")
    atlas.save()

    mat.node_tree.nodes.remove(bake_node)
    me.uv_layers.active = me.uv_layers["UVMap"]  # restore painter's channel
    return atlas


# ── camera + lighting ─────────────────────────────────────────────────────────
def setup_scene(col: bpy.types.Collection) -> None:
    scn   = bpy.context.scene
    world = bpy.data.worlds.new("world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value    = (0.06, 0.06, 0.10, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.5
    scn.world = world

    cam_d = bpy.data.cameras.new("cam")
    cam_d.lens = 85.0  # 85mm portrait focal length minimises torso distortion
    cam   = bpy.data.objects.new("cam", cam_d)
    cam.location       = (1.9, -2.5, 0.75)
    cam.rotation_euler = (1.31, 0.0, 0.64)
    relink(cam, col)
    scn.camera = cam

    sun_d = bpy.data.lights.new("sun", type="SUN")
    sun_d.energy = 3.5
    sun_d.angle  = 0.04
    sun   = bpy.data.objects.new("sun", sun_d)
    sun.rotation_euler = (0.58, 0.0, 0.52)
    relink(sun, col)


# ── main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    col    = new_col("udim_character")
    torso  = build_torso()
    relink(torso, col)
    unwrap_udim(torso)
    images = create_udim_images()
    make_udim_material(torso, images)
    bake_udim_to_atlas(torso)
    setup_scene(col)

    bpy.ops.wm.save_as_mainfile(
        filepath="//udim_character_torso.blend",
        check_existing=False,
    )
    print("UDIM blueprint complete — udim_character_torso.blend saved")


if __name__ == "__main__":
    main()
