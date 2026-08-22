"""
GN Image Texture Heightmap — Greyscale PNG to Displaced Terrain with Flat Faceting
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: A Geometry Nodes modifier samples a greyscale image at each grid
vertex by mapping world-space XY position to UV [0,1]², reading luminance via
the Image Texture node, and adding a scaled Z offset via Set Position. A Set
Shade Smooth node placed after displacement locks in flat per-face shading —
critical order because normals are computed on displaced triangles, not the flat
pre-deformed grid.

WHY IMAGE TEXTURE OVER NOISE DISPLACEMENT?
  Noise terrain is infinite and procedural but uncontrolled: you cannot decide
  where the ridge crests sit. An image heightmap lets you design terrain
  deliberately — sketch it in Krita, use real-world elevation from Poly Haven
  or terrain.party, or export a game-engine heightmap. The Image Texture node
  (stable in GN since 3.6, unchanged in 5.1) bridges authored data and
  procedural geometry without any bake step.

UV MAPPING STRATEGY:
  Grid vertices span [-GRID_SIZE/2, +GRID_SIZE/2] in XY. The Image Texture
  node expects UV in [0,1]². Two Math chains perform the remap:
    u = position.x / GRID_SIZE + 0.5
    v = position.y / GRID_SIZE + 0.5
  Grid corners land on UV (0,0) … (1,1) exactly — no bleeding, no repeat.

FLAT FACETING ORDER:
  Set Shade Smooth(False) runs AFTER Set Position. If you reverse the order,
  Blender computes normals on the flat grid, bakes them, then moves vertices
  leaving those pre-baked normals in place. Result: faceted topology, smooth
  lighting — the visual opposite of what we want.

Outside sources:
  Blender Manual — Image Texture Node (Geometry Nodes)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/texture/image.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Poly Haven — CC0 PBR heightmaps and terrain textures
    https://polyhaven.com  ·  CC0 Public Domain · Greg Zaal / Poly Haven
  Blender Manual — Set Position Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html
    CC-BY-SA 4.0 · Blender Documentation Team
"""

import bpy
import bmesh
import math

# ── Parameters ─────────────────────────────────────────────────────────────────
GRID_SIZE    = 10.0   # terrain XY extent in metres
GRID_RES     = 64     # segments per axis; 64 × 64 = 4 096 quads, 65 × 65 vertices
HEIGHT_SCALE = 2.5    # greyscale 1.0 → this many metres of Z displacement
IMG_RES      = 256    # synthetic heightmap pixel resolution
TREE_NAME    = "HS_ImgHeightmap"
OBJ_NAME     = "terrain_heightmap"
IMG_NAME     = "hs_heightmap"
MAT_NAME     = "HM_Terrain"
ATTR_HEIGHT  = "height"   # named attribute written into mesh for shader colour
OUTPUT_GLB   = "//../../glbs/geometry-nodes/gn-image-texture-heightmap-terrain/terrain_heightmap.glb"


# ── Cleanup ────────────────────────────────────────────────────────────────────
def _purge() -> None:
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        bpy.data.materials.remove(ma)
    for im in list(bpy.data.images):
        if im.name == IMG_NAME:
            bpy.data.images.remove(im)


# ── Heightmap ──────────────────────────────────────────────────────────────────
def _build_heightmap() -> bpy.types.Image:
    """Synthesise a greyscale island-ridge pattern from three sine octaves.
    Swap this entire body for bpy.data.images.load('/path/to/dem.png') to use
    a real-world elevation export (16-bit greyscale PNGs work identically)."""
    res = IMG_RES
    img = bpy.data.images.new(IMG_NAME, width=res, height=res, alpha=False)
    px  = [0.0] * (res * res * 4)

    for row in range(res):
        for col in range(res):
            u = col / (res - 1)
            v = row / (res - 1)
            # Octave 1: broad cosine dome, peak at centre
            h  = 0.50 * math.cos((u - 0.5) * math.pi) * math.cos((v - 0.5) * math.pi)
            # Octave 2: diagonal ridge crossing the dome
            h += 0.30 * math.cos((u * 2.0 + v * 1.5 - 0.8) * math.pi * 1.5)
            # Octave 3: fine detail via phase-shifted product wave
            h += 0.20 * math.sin(u * math.pi * 5 + 0.7) * math.cos(v * math.pi * 4 - 0.3)

            h = max(0.0, min(1.0, (h + 1.0) * 0.5))   # remap → [0,1] and clamp
            i = (row * res + col) * 4
            px[i] = px[i+1] = px[i+2] = h
            px[i+3] = 1.0

    img.pixels.foreach_set(px)
    img.update()
    img.pack()   # embed pixels in .blend so the GN modifier finds them when saved
    return img


# ── Geometry Nodes Tree ────────────────────────────────────────────────────────
def _build_gn_tree(hm: bpy.types.Image) -> bpy.types.GeometryNodeTree:
    ng = bpy.data.node_groups.new(TREE_NAME, "GeometryNodeTree")
    iface = ng.interface
    iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nodes = ng.nodes
    links = ng.links

    def gn(bl_id: str, x: float, y: float):
        n = nodes.new(bl_id); n.location = (x, y); return n

    # Group I/O
    n_in  = gn("NodeGroupInput",   -900,   0)
    n_out = gn("NodeGroupOutput",   900,   0)

    # ── UV remap chain: world XY → [0,1] UV ──────────────────────────────────
    n_pos = gn("GeometryNodeInputPosition", -700, 250)
    n_sep = gn("ShaderNodeSeparateXYZ",     -500, 250)   # → X, Y, Z

    # u = x / GRID_SIZE + 0.5
    n_du  = gn("ShaderNodeMath", -300, 350); n_du.operation = "DIVIDE"
    n_du.inputs[1].default_value = GRID_SIZE
    n_au  = gn("ShaderNodeMath", -100, 350); n_au.operation = "ADD"
    n_au.inputs[1].default_value = 0.5

    # v = y / GRID_SIZE + 0.5
    n_dv  = gn("ShaderNodeMath", -300, 150); n_dv.operation = "DIVIDE"
    n_dv.inputs[1].default_value = GRID_SIZE
    n_av  = gn("ShaderNodeMath", -100, 150); n_av.operation = "ADD"
    n_av.inputs[1].default_value = 0.5

    # Pack U,V into a vector for the Image Texture input
    n_uvw = gn("ShaderNodeCombineXYZ", 80, 250)
    n_uvw.inputs["Z"].default_value = 0.0

    # ── Image Texture ─────────────────────────────────────────────────────────
    # image property sets the data block; interpolation Linear gives smooth height
    # sampling that pairs with flat per-face shading for a crisp faceted look.
    n_img = gn("GeometryNodeImageTexture", 280, 250)
    n_img.image         = hm
    n_img.interpolation = "Linear"

    # Color output from Image Texture is a 3-float (R,G,B). For greyscale R=G=B.
    # SeparateXYZ treats the color vector's X component as the R channel.
    n_rgb = gn("ShaderNodeSeparateXYZ",  480, 250)   # extracts R as .X

    # Scale normalised height [0,1] to metres
    n_mul = gn("ShaderNodeMath", 640, 250); n_mul.operation = "MULTIPLY"
    n_mul.inputs[1].default_value = HEIGHT_SCALE

    # Build a Z-only offset vector — XY stays untouched by Set Position Offset
    n_off = gn("ShaderNodeCombineXYZ", 800, 350)
    n_off.inputs["X"].default_value = 0.0
    n_off.inputs["Y"].default_value = 0.0

    # ── Set Position (Offset) ─────────────────────────────────────────────────
    # Using Offset rather than Position leaves XY as-is from the input mesh.
    n_spos = gn("GeometryNodeSetPosition", 800, 0)

    # ── Store normalised height as a named attribute ───────────────────────────
    # The shader's Attribute node reads this to drive elevation colour ramp.
    n_str = gn("GeometryNodeStoreNamedAttribute", 800, -200)
    n_str.domain    = "POINT"
    n_str.data_type = "FLOAT"
    n_str.inputs["Name"].default_value = ATTR_HEIGHT

    # ── Set Shade Smooth: flat shading AFTER displacement ─────────────────────
    # Shade Smooth = False → flat (per-face) normals. domain='FACE' is default.
    n_smt = gn("GeometryNodeSetShadeSmooth", 800, -380)
    n_smt.domain = "FACE"
    n_smt.inputs["Shade Smooth"].default_value = False

    # ── Links ─────────────────────────────────────────────────────────────────
    links.new(n_pos.outputs["Position"],     n_sep.inputs["Vector"])
    links.new(n_sep.outputs["X"],            n_du.inputs[0])
    links.new(n_sep.outputs["Y"],            n_dv.inputs[0])
    links.new(n_du.outputs["Value"],         n_au.inputs[0])
    links.new(n_dv.outputs["Value"],         n_av.inputs[0])
    links.new(n_au.outputs["Value"],         n_uvw.inputs["X"])
    links.new(n_av.outputs["Value"],         n_uvw.inputs["Y"])
    links.new(n_uvw.outputs["Vector"],       n_img.inputs["Vector"])
    links.new(n_img.outputs["Color"],        n_rgb.inputs["Vector"])
    links.new(n_rgb.outputs["X"],            n_mul.inputs[0])
    links.new(n_mul.outputs["Value"],        n_off.inputs["Z"])
    links.new(n_off.outputs["Vector"],       n_spos.inputs["Offset"])
    links.new(n_in.outputs["Geometry"],      n_spos.inputs["Geometry"])
    links.new(n_rgb.outputs["X"],            n_str.inputs["Value"])
    links.new(n_spos.outputs["Geometry"],    n_str.inputs["Geometry"])
    links.new(n_str.outputs["Geometry"],     n_smt.inputs["Geometry"])
    links.new(n_smt.outputs["Geometry"],     n_out.inputs["Geometry"])

    return ng


# ── Material ───────────────────────────────────────────────────────────────────
def _build_material() -> bpy.types.Material:
    ma = bpy.data.materials.new(MAT_NAME)
    ma.use_nodes = True
    nt = ma.node_tree
    nt.nodes.clear()

    def mn(bl_id, x, y):
        n = nt.nodes.new(bl_id); n.location = (x, y); return n

    n_attr = mn("ShaderNodeAttribute",     -600,  80)
    n_attr.attribute_type = "GEOMETRY"
    n_attr.attribute_name = ATTR_HEIGHT   # reads the float stored by GN

    # Elevation-based colour ramp: deep blue → forest green → sandy white
    n_ramp = mn("ShaderNodeValToRGB",      -350, 100)
    cr = n_ramp.color_ramp
    cr.interpolation = "EASE"
    cr.elements[0].position = 0.0;  cr.elements[0].color = (0.02, 0.05, 0.18, 1)
    cr.elements[1].position = 1.0;  cr.elements[1].color = (0.90, 0.88, 0.82, 1)
    el_mid = cr.elements.new(0.45);  el_mid.color = (0.12, 0.28, 0.06, 1)

    n_bsdf = mn("ShaderNodeBsdfPrincipled", -50,  0)
    n_bsdf.inputs["Roughness"].default_value  = 0.85
    n_bsdf.inputs["Metallic"].default_value   = 0.0

    n_out = mn("ShaderNodeOutputMaterial",  250,  0)

    nt.links.new(n_attr.outputs["Fac"],    n_ramp.inputs["Fac"])
    nt.links.new(n_ramp.outputs["Color"],  n_bsdf.inputs["Base Color"])
    nt.links.new(n_bsdf.outputs["BSDF"],   n_out.inputs["Surface"])
    return ma


# ── Scene Assembly ─────────────────────────────────────────────────────────────
def _build_scene() -> None:
    hm   = _build_heightmap()
    tree = _build_gn_tree(hm)
    mat  = _build_material()

    # Grid mesh: bmesh.ops.create_grid spans [-size, +size] so size = GRID_SIZE/2
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm, x_segments=GRID_RES, y_segments=GRID_RES, size=GRID_SIZE * 0.5
    )
    bm.to_mesh(me); bm.free()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)

    mod = obj.modifiers.new("ImageHeightmap", "NODES")
    mod.node_group = tree
    obj.data.materials.append(mat)

    # Camera — raised and angled for a hero overhead-oblique view
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (8.0, -8.0, 9.0)
    cam.rotation_euler = (math.radians(55), 0, math.radians(45))
    bpy.context.scene.camera = cam

    # Sun
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("Sun", sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))

    # Force depsgraph evaluation to verify attribute is present
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    eval_me = obj.evaluated_get(dg).data
    assert ATTR_HEIGHT in [a.name for a in eval_me.attributes], (
        f"Named attribute '{ATTR_HEIGHT}' missing on evaluated mesh. "
        "Check that the GN tree ran correctly."
    )

    # GLB export: apply modifiers so displaced vertex positions and named
    # attributes bake into the mesh data. Draco level 6 for web delivery.
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        export_apply=True,
        export_attributes=True,    # emit ATTR_HEIGHT as _HEIGHT accessor
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"Exported → {OUTPUT_GLB}")


if __name__ == "__main__":
    _purge()
    _build_scene()
