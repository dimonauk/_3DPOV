"""
Blueprint: GN Index-Driven Per-Face Colour — Procedural Mosaic Tile
Blender 5.1 | CC0 | Holoflow Studio

GeometryNodeInputIndex evaluates once per face and returns 0, 1, 2 … N-1 in
face-definition order (left-to-right, bottom-to-top for a grid built by row).
Modulo(HUE_REPEAT) maps that flat integer to a column bucket 0-15, and
Divide(HUE_REPEAT) converts it to a normalised hue 0.0–0.9375.
ShaderNodeCombineColor (mode=HSV) converts to RGB. StoreNamedAttribute writes
a FLOAT_COLOR value at FACE domain — one constant colour per quad.

Key distinction from the Vertex Colour tutorial (VERTEX domain): FACE domain
attributes are uniform across each face. No interpolation happens at triangle
edges. This produces hard, clean tile boundaries in EEVEE Next without
requiring flat-shading hacks on the vertex normals.
"""

import bpy
import bmesh
from mathutils import Vector, Matrix
from pathlib import Path

# ─── Constants ──────────────────────────────────────────────────────────────
GRID_COLS    = 16       # quads per row
GRID_ROWS    = 16       # quads per column  (256 faces total)
FACE_SIZE    = 0.25     # metres per quad edge
HUE_REPEAT   = 16.0     # columns per full hue rotation; equal to GRID_COLS → one rainbow cycle per row
SAT          = 0.65     # saturation — jewel-pastel balance that reads well in a headset
VAL          = 0.88     # value — avoids pure white blowout under EEVEE bloom
EMIT_STR     = 1.8      # emission strength — bright enough for WebXR without HDR clip

_HERE        = Path(__file__).parent
_LIB         = _HERE.parent.parent.parent.parent
BLEND_OUT    = _LIB / "blends" / "geometry-nodes" / "gn-index-face-colour-mosaic" / "mosaic_tile.blend"
GLB_OUT      = _LIB / "glbs"  / "geometry-nodes" / "gn-index-face-colour-mosaic" / "mosaic_tile.glb"

# ─── Scene reset ────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene      = bpy.context.scene
scene.name = "MosaicTileScene"

# ─── Grid mesh (bmesh) ──────────────────────────────────────────────────────
# Face index order: column-major within each row — face i is at
#   col = i % GRID_COLS
#   row = i // GRID_COLS
# The grid is centred at origin.
bm   = bmesh.new()
half_x = GRID_COLS * FACE_SIZE / 2
half_y = GRID_ROWS * FACE_SIZE / 2

verts = []
for r in range(GRID_ROWS + 1):
    for c in range(GRID_COLS + 1):
        verts.append(bm.verts.new(
            Vector((-half_x + c * FACE_SIZE, -half_y + r * FACE_SIZE, 0.0))
        ))
bm.verts.ensure_lookup_table()

for r in range(GRID_ROWS):
    for c in range(GRID_COLS):
        v0 = verts[r * (GRID_COLS + 1) + c]
        v1 = verts[r * (GRID_COLS + 1) + c + 1]
        v2 = verts[(r + 1) * (GRID_COLS + 1) + c + 1]
        v3 = verts[(r + 1) * (GRID_COLS + 1) + c]
        bm.faces.new([v0, v1, v2, v3])

base_mesh = bpy.data.meshes.new("mosaic_tile_base")
bm.to_mesh(base_mesh)
bm.free()

grid_obj       = bpy.data.objects.new("mosaic_tile", base_mesh)
grid_obj.name  = "mosaic_tile"
scene.collection.objects.link(grid_obj)

# ─── GN modifier tree ───────────────────────────────────────────────────────
# Node tree overview:
#
#  Field branch (hangs off the side — no geometry socket):
#    InputIndex → Math(MOD,16) → Math(DIV,16) → CombineColor.H
#                                                 CombineColor.S = SAT (const)
#                                                 CombineColor.V = VAL (const)
#                                                → CombineColor.Color
#
#  Geometry pipe:
#    GroupInput → SetShadeSmooth(FACE, False)
#               → StoreNamedAttribute('tile_colour', FACE, FLOAT_COLOR, value=above)
#               → GroupOutput
#
gn  = bpy.data.node_groups.new("MosaicTileGN", "GeometryNodeTree")

# Interface sockets — required or Blender 5.1 will log a warning on modifier init.
gn.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
gn.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

gi = gn.nodes.new("NodeGroupInput");  gi.location = (-600, 0)
go = gn.nodes.new("NodeGroupOutput"); go.location  = (500,  0)

# ---- Flat shading: SetShadeSmooth forces FACE domain shade_smooth=False.
#      Must come before StoreNamedAttribute so the geometry pipe is consistent.
n_flat              = gn.nodes.new("GeometryNodeSetShadeSmooth")
n_flat.domain       = "FACE"
n_flat.location     = (-400, 0)
n_flat.inputs[2].default_value = False   # shade_smooth = False → hard facet edges

# ---- StoreNamedAttribute at FACE domain — this is the key node.
#      data_type='FLOAT_COLOR' is a 4-channel float RGBA stored as float32×4.
#      attribute_name 'tile_colour' exports as _TILE_COLOUR in the glTF binary
#      vertex buffer when export_apply=True is set. In Three.js:
#        mesh.geometry.attributes._TILE_COLOUR  // Float32Array, 4 per vertex
#        // but the value is constant per face → reading any vertex of a face
#        // returns the same RGBA.
n_store             = gn.nodes.new("GeometryNodeStoreNamedAttribute")
n_store.data_type   = "FLOAT_COLOR"
n_store.domain      = "FACE"
n_store.location    = (100, 0)
n_store.inputs[2].default_value = "tile_colour"   # name socket

# ---- ShaderNodeCombineColor (mode HSV) — available in GN since Blender 3.3.
#      Converts the normalised hue [0, 1) to RGB before StoreNamedAttribute.
#      Using HSV here is essential: a linear ramp of R alone would give grey
#      in the middle — HSV rotation gives equal perceptual brightness at all
#      hue steps, which is what makes a mosaic look like a mosaic.
n_hsv               = gn.nodes.new("ShaderNodeCombineColor")
n_hsv.mode          = "HSV"
n_hsv.location      = (-150, -200)
n_hsv.inputs[1].default_value = SAT    # S — constant
n_hsv.inputs[2].default_value = VAL    # V — constant

# ---- Math (DIVIDE) — hue = column_bucket / HUE_REPEAT
#      Converts integer column (0-15) to normalised float (0.0-0.9375).
#      At HUE_REPEAT=16, hue never reaches 1.0, so red does not wrap to red.
#      For a tighter palette (fewer hues), raise HUE_REPEAT; for more variety,
#      lower it to 4 or 8.
n_div               = gn.nodes.new("ShaderNodeMath")
n_div.operation     = "DIVIDE"
n_div.location      = (-350, -200)
n_div.inputs[1].default_value = HUE_REPEAT

# ---- Math (MODULO) — column_bucket = face_index % HUE_REPEAT
#      The modulo of the flat face index gives the column position within a
#      HUE_REPEAT-wide tile. At HUE_REPEAT=GRID_COLS=16, column 0 always gets
#      hue 0 and column 15 always gets hue 0.9375 — the row number does not
#      affect the hue. Every row of the grid is an identical rainbow strip.
#      To vary hue BY ROW instead of by column, change inputs[0] to
#      Math(FLOOR, Math(DIVIDE, Index, HUE_REPEAT)) — see Variations section.
n_mod               = gn.nodes.new("ShaderNodeMath")
n_mod.operation     = "MODULO"
n_mod.location      = (-550, -200)
n_mod.inputs[1].default_value = HUE_REPEAT

# ---- GeometryNodeInputIndex — outputs INT at whatever domain is being
#      evaluated. Connected into StoreNamedAttribute (FACE domain), Index
#      evaluates once per face: 0, 1, 2 … 255.
#      This is the same laziness principle from the Capture Attribute tutorial:
#      the Index node does not materialise all 256 values up-front — it's a
#      field expression that the evaluator expands per-element on demand.
n_idx               = gn.nodes.new("GeometryNodeInputIndex")
n_idx.location      = (-750, -200)

# ─── Link nodes ─────────────────────────────────────────────────────────────
lk = gn.links.new

# Field branch
lk(n_idx.outputs[0],    n_mod.inputs[0])     # Index → Modulo
lk(n_mod.outputs[0],    n_div.inputs[0])     # Modulo → Divide
lk(n_div.outputs[0],    n_hsv.inputs[0])     # hue float → CombineColor.H
lk(n_hsv.outputs[0],    n_store.inputs[3])   # Color → StoreNamedAttribute.Value

# Geometry pipe
lk(gi.outputs[0],       n_flat.inputs[0])    # in → SetShadeSmooth
lk(n_flat.outputs[0],   n_store.inputs[0])   # → StoreNamedAttribute
lk(n_store.outputs[0],  go.inputs[0])        # → out

# Attach modifier
mod            = grid_obj.modifiers.new("MosaicTile", "NODES")
mod.node_group = gn

# ─── Material: two-node Emission reads tile_colour via ShaderNodeAttribute ──
# ShaderNodeAttribute with attribute_type='GEOMETRY' reads stored GN attrs.
# attribute_type='OBJECT' would look up a custom property on the object itself.
# attribute_type='INSTANCER' would look up the instancer — neither applies here.
# The 'Color' output carries the RGBA colour; 'Fac' carries the alpha channel.
mat = bpy.data.materials.new("MosaicTileMat")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

n_attr                   = nt.nodes.new("ShaderNodeAttribute")
n_attr.attribute_type    = "GEOMETRY"
n_attr.attribute_name    = "tile_colour"
n_attr.location          = (-400, 0)

n_emit                   = nt.nodes.new("ShaderNodeEmission")
n_emit.inputs[1].default_value = EMIT_STR
n_emit.location          = (-150, 0)

n_out                    = nt.nodes.new("ShaderNodeOutputMaterial")
n_out.location           = (100, 0)

ml = nt.links.new
ml(n_attr.outputs["Color"],    n_emit.inputs["Color"])
ml(n_emit.outputs["Emission"], n_out.inputs["Surface"])

grid_obj.data.materials.append(mat)

# ─── Camera ─────────────────────────────────────────────────────────────────
# Isometric-style top-oblique view: far enough to frame the full grid.
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_data.type = "PERSP"
cam_data.lens = 28
cam_obj.location    = (0.0, -4.0, 4.5)
cam_obj.rotation_euler = (0.87, 0.0, 0.0)   # ≈ 50° tilt

# ─── Render settings ────────────────────────────────────────────────────────
scene.render.engine                = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x          = 1920
scene.render.resolution_y          = 1080
scene.eevee.use_bloom              = False   # bloom would bleed colours into neighbours

# ─── Save blend ─────────────────────────────────────────────────────────────
BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

# ─── Export GLB ─────────────────────────────────────────────────────────────
# export_apply=True is mandatory — without it the modifier is not evaluated
# and tile_colour does not exist in the exported mesh's vertex buffer.
# FLOAT_COLOR at FACE domain exports as _TILE_COLOUR in the glTF primitive;
# face-constant values are duplicated to all vertices of each face during
# evaluation so the binary accessor contains one float4 per vertex.
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath                              = str(GLB_OUT),
    export_format                         = "GLB",
    export_apply                          = True,
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format                   = "WEBP",
    export_yup                            = True,
    export_extras                         = True,
)

print(f"[holoflow] mosaic_tile.blend → {BLEND_OUT}")
print(f"[holoflow] mosaic_tile.glb   → {GLB_OUT}")
