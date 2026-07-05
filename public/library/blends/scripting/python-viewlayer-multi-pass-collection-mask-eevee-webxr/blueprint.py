"""
blueprint.py — Python bpy.types.ViewLayer
Multi-Pass Collection Masking, Per-Layer Render Flags
& Compositor Merge for WebXR Bakes (Blender 5.1)

Technique synopsis
------------------
A production WebXR bake separates the scene into named collections and
assigns each collection to a dedicated ViewLayer so that render pass
sets can be chosen per layer without affecting the others.  Three
ViewLayers are built here — Env, Props, Character — each masking out
the other two.  A compositor tree reads from three RenderLayers nodes
and merges them with AlphaOver into a single composite output plus an
EXR archive of all individual passes.

Key API calls
  scene.view_layers.new(name)                     create a new view layer
  vl.layer_collection.children[name].exclude      hide collection from layer
  vl.use_pass_*                                   toggle individual render passes
  scene.render.compositor_device = 'GPU'          GPU compositor (Blender 5.1)
  node.layer = 'ViewLayerName'                    wire RenderLayers node to a layer
  tree.links.new(src_socket, dst_socket)          connect compositor nodes

Design decisions
  — `exclude` vs `holdout` vs `indirect_only`:
      exclude=True  → objects are completely invisible; they contribute
                      nothing to the layer (no shadows, no indirect bounce).
      holdout=True  → objects are invisible but still occlude; you get a
                      cut-out alpha where they are. Use for AR compositing.
      indirect_only → objects receive and cast light but don't render.
      This blueprint uses exclude for layer isolation; switching to holdout
      on the ENV layer turns background geometry into an AR matte.
  — GPU compositor (compositor_device='GPU') bypasses the CPU tile renderer
    for the compositor pass; mandatory on Blender 5.1 for Glare and Denoise
    to run in < 1 second per frame on a modern GPU.
  — bpy.ops.render.render() is not called here — blueprint authors the
    scene state; rendering is deferred to Dimona's screen-recording session.
"""

import bpy

# ──────────────────────────────────────────────────────────
# PARAMETERS
# ──────────────────────────────────────────────────────────
COLLECTION_ENV    = "HLF_Env"
COLLECTION_PROPS  = "HLF_Props"
COLLECTION_CHAR   = "HLF_Char"

VL_ENV            = "Env"
VL_PROPS          = "Props"
VL_CHAR           = "Character"

EXR_OUTPUT        = "//render/multilayer"     # relative to .blend
RESOLUTION_X      = 1920
RESOLUTION_Y      = 1080


# ──────────────────────────────────────────────────────────
# 1. SCENE INIT — clear defaults
# ──────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine      = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = RESOLUTION_X
scene.render.resolution_y = RESOLUTION_Y

# GPU compositor: evaluates the compositor tree on the GPU — much faster
# for Glare and Denoise nodes on large renders.
scene.render.compositor_device    = 'GPU'
scene.render.compositor_precision = 'AUTO'

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)


# ──────────────────────────────────────────────────────────
# 2. COLLECTIONS — one per render element
# ──────────────────────────────────────────────────────────
root_col = bpy.context.scene.collection

def _get_or_create_col(name: str) -> bpy.types.Collection:
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    root_col.children.link(col)
    return col

col_env   = _get_or_create_col(COLLECTION_ENV)
col_props = _get_or_create_col(COLLECTION_PROPS)
col_char  = _get_or_create_col(COLLECTION_CHAR)


# ──────────────────────────────────────────────────────────
# 3. PLACEHOLDER GEOMETRY — one object per collection
# ──────────────────────────────────────────────────────────
def _add_plane(name: str, col: bpy.types.Collection, z: float = 0.0,
               scale: float = 4.0) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=scale, location=(0, 0, z))
    ob = bpy.context.active_object
    ob.name = name
    # move from the default scene collection to target collection
    root_col.objects.unlink(ob)
    col.objects.link(ob)
    return ob


def _add_sphere(name: str, col: bpy.types.Collection,
                location: tuple = (0, 0, 1.0)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=location)
    ob = bpy.context.active_object
    ob.name = name
    root_col.objects.unlink(ob)
    col.objects.link(ob)
    return ob


# ENV — ground plane
env_plane = _add_plane("HLF_GroundPlane", col_env, z=0.0, scale=8.0)

# PROPS — a box and a cylinder as stand-in scene props
bpy.ops.mesh.primitive_cube_add(size=0.8, location=(-1.2, 0, 0.4))
prop_box = bpy.context.active_object
prop_box.name = "HLF_PropBox"
root_col.objects.unlink(prop_box)
col_props.objects.link(prop_box)

bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=1.2, location=(1.2, 0, 0.6))
prop_cyl = bpy.context.active_object
prop_cyl.name = "HLF_PropCylinder"
root_col.objects.unlink(prop_cyl)
col_props.objects.link(prop_cyl)

# CHAR — sphere as character stand-in
char_body = _add_sphere("HLF_CharBody", col_char, location=(0, 0, 1.2))

# LIGHTS — one area light in root (visible in all layers)
bpy.ops.object.light_add(type='AREA', location=(3, -3, 5))
key_light = bpy.context.active_object
key_light.name = "HLF_KeyLight"
key_light.data.energy = 600.0
key_light.data.size    = 3.0
# Lights in root_col are visible by default in every view layer that
# does not explicitly exclude root_col's children.


# ──────────────────────────────────────────────────────────
# 4. VIEW LAYERS — create Env, Props, Character
# ──────────────────────────────────────────────────────────
# Blender creates one ViewLayer ("ViewLayer") by default.  Rename it.
default_vl = scene.view_layers[0]
default_vl.name = "All"                # keep a full-composite reference layer

def _new_layer(name: str) -> bpy.types.ViewLayer:
    """Create a view layer; skip if already exists."""
    existing = scene.view_layers.get(name)
    if existing:
        return existing
    return scene.view_layers.new(name)

vl_env   = _new_layer(VL_ENV)
vl_props = _new_layer(VL_PROPS)
vl_char  = _new_layer(VL_CHAR)


# ──────────────────────────────────────────────────────────
# 5. PER-LAYER COLLECTION MASKS
# ──────────────────────────────────────────────────────────
# vl.layer_collection is the root LayerCollection.
# Its .children dict mirrors the scene collection hierarchy.
# Setting .exclude = True on a child makes that collection invisible
# in this view layer: no geometry, no shadow, no light contribution.

def _set_layer_masks(
    vl: bpy.types.ViewLayer,
    include: list[str],
    exclude: list[str],
) -> None:
    root_lc = vl.layer_collection
    for col_name in exclude:
        lc = root_lc.children.get(col_name)
        if lc:
            lc.exclude = True          # completely invisible
    for col_name in include:
        lc = root_lc.children.get(col_name)
        if lc:
            lc.exclude = False         # ensure it is visible

_set_layer_masks(
    vl_env,
    include=[COLLECTION_ENV],
    exclude=[COLLECTION_PROPS, COLLECTION_CHAR],
)

_set_layer_masks(
    vl_props,
    include=[COLLECTION_PROPS],
    exclude=[COLLECTION_ENV, COLLECTION_CHAR],
)

_set_layer_masks(
    vl_char,
    include=[COLLECTION_CHAR],
    exclude=[COLLECTION_ENV, COLLECTION_PROPS],
)


# ──────────────────────────────────────────────────────────
# 6. PER-LAYER RENDER PASSES
# ──────────────────────────────────────────────────────────
# Each ViewLayer exposes .use_pass_* booleans that enable socket outputs
# on the corresponding RenderLayers compositor node.  Enabled passes
# increase render time and memory — only enable what the compositor
# actually consumes.

# ENV layer — needs Diffuse + AO for baked-light detail and shadows.
vl_env.use_pass_diffuse_direct    = True
vl_env.use_pass_diffuse_indirect  = True
vl_env.use_pass_ambient_occlusion = True
vl_env.use_pass_shadow            = True

# PROPS layer — needs AO (cavity detail) + normal for contact shadows.
vl_props.use_pass_diffuse_direct    = True
vl_props.use_pass_ambient_occlusion = True
vl_props.use_pass_normal            = True

# CHAR layer — needs Normal (for OIDN) + Shadow (rim shadow bake).
vl_char.use_pass_diffuse_direct = True
vl_char.use_pass_normal         = True
vl_char.use_pass_shadow         = True
# Enable denoising data so OIDN uses albedo+normal guidance
vl_char.use_denoising_data      = True


# ──────────────────────────────────────────────────────────
# 7. COMPOSITOR — one RenderLayers node per view layer
# ──────────────────────────────────────────────────────────
# scene.use_nodes = True creates the compositor node tree.
# The tree persists across renders; rebuild it to avoid stale nodes.

scene.use_nodes = True
tree = scene.node_tree
tree.nodes.clear()                # wipe auto-generated defaults

nodes = tree.nodes
links = tree.links

# Helper: place a node at a grid position
def _node(bl_type: str, x: float, y: float,
          label: str = "") -> bpy.types.Node:
    n = nodes.new(bl_type)
    n.location = (x, y)
    if label:
        n.label = label
    return n


# ── RenderLayers nodes ──────────────────────────────────
rl_env   = _node("CompositorNodeRLayers", -600,  300, "RenderLayers: Env")
rl_props = _node("CompositorNodeRLayers", -600,    0, "RenderLayers: Props")
rl_char  = _node("CompositorNodeRLayers", -600, -300, "RenderLayers: Char")

# .layer is the NAME of the ViewLayer this node renders.
# The name must match exactly — if you rename a ViewLayer the node goes blank.
rl_env.layer   = VL_ENV
rl_props.layer = VL_PROPS
rl_char.layer  = VL_CHAR


# ── AlphaOver chain — ENV → PROPS → CHAR ────────────────
# AlphaOver composites B over A using B's alpha.
# Characters sit atop props, props sit atop environment.
ao1 = _node("CompositorNodeAlphaOver", -200, 200, "AlphaOver: Env+Props")
ao2 = _node("CompositorNodeAlphaOver",  100, 100, "AlphaOver: +Char")

# ao1: blend Env + Props
links.new(rl_env.outputs["Image"],   ao1.inputs[1])   # A = Env
links.new(rl_props.outputs["Image"], ao1.inputs[2])   # B = Props over Env

# ao2: blend result + Character
links.new(ao1.outputs["Image"],       ao2.inputs[1])  # A = Env+Props
links.new(rl_char.outputs["Image"],   ao2.inputs[2])  # B = Char on top

# ── Composite output ────────────────────────────────────
comp = _node("CompositorNodeComposite", 400, 100, "Composite")
links.new(ao2.outputs["Image"], comp.inputs["Image"])


# ── File Output — multilayer EXR archive ───────────────
# File Output stores all named inputs into a multilayer EXR.
# Each .file_slots entry becomes one EXR layer name.
# The default slot must be removed; new ones added manually.
fout = _node("CompositorNodeOutputFile", 400, -200, "EXR Archive")
fout.format.file_format   = 'OPEN_EXR_MULTILAYER'
fout.format.color_depth   = '32'                 # full 32-bit float
fout.base_path            = EXR_OUTPUT

# Remove the auto-created default slot before adding custom ones.
# The slot list uses integer indices; removing by name is not available.
while fout.file_slots:
    fout.file_slots.remove(fout.file_slots[0])

# Add a named slot per significant pass; link matching output sockets.
SLOT_DEFS = [
    ("Env.Combined",   rl_env,   "Image"),
    ("Env.AO",         rl_env,   "AO"),
    ("Env.Shadow",     rl_env,   "Shadow"),
    ("Props.Combined", rl_props, "Image"),
    ("Props.AO",       rl_props, "AO"),
    ("Char.Combined",  rl_char,  "Image"),
    ("Char.Shadow",    rl_char,  "Shadow"),
    ("Char.Normal",    rl_char,  "Normal"),
]

for slot_name, src_node, src_socket_name in SLOT_DEFS:
    slot = fout.file_slots.new(slot_name)
    # After adding a slot, its input socket index == its list position.
    sock_idx = list(fout.file_slots).index(slot)
    src_sock = src_node.outputs.get(src_socket_name)
    if src_sock:
        links.new(src_sock, fout.inputs[sock_idx])


# ──────────────────────────────────────────────────────────
# 8. EXPORT LAYER DIAGNOSTICS — JSON manifest
# ──────────────────────────────────────────────────────────
import json, pathlib

diag = {
    "blender_version": list(bpy.app.version),
    "view_layers": [],
    "compositor_slots": [s.path for s in fout.file_slots],
}

for vl in scene.view_layers:
    entry = {
        "name": vl.name,
        "collections": {},
    }
    root_lc = vl.layer_collection
    for child_lc in root_lc.children:
        entry["collections"][child_lc.name] = {
            "exclude":      child_lc.exclude,
            "holdout":      child_lc.holdout,
            "indirect_only": child_lc.indirect_only,
        }
    diag["view_layers"].append(entry)

out_path = pathlib.Path(
    bpy.path.abspath("//render/viewlayer_manifest.json")
)
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(diag, indent=2))
print(f"[HLF] ViewLayer manifest written → {out_path}")

print("[HLF] Scene ready.  Run Render → Render Image to execute all layers.")
print("[HLF] Compositor will merge Env + Props + Char automatically.")
