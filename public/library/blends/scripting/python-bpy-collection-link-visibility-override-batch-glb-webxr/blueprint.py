"""
Python bpy.types.Collection — Collection Linking, Visibility Overrides
& Multi-Collection Batch GLB Export for WebXR (Blender 5.1)

Holoflow Studio | CC0 | 2026-07-10
https://holoflow.co.uk/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr

TECHNIQUE
─────────
Blender stores scene organisation in two parallel APIs that are easy to
conflate:

  bpy.types.Collection  — the *data block* in bpy.data.collections.
  bpy.types.LayerCollection — the per-ViewLayer *wrapper* accessed via
                               scene.view_layers[n].layer_collection tree.

Visibility flags on the data block (collection.hide_render) have NO effect
at render time.  All render-visibility control lives on the LayerCollection.
This entry demonstrates the full lifecycle: create named collections, add
geometry to them, locate their LayerCollections, set visibility overrides,
and batch-export each collection to its own GLB for WebXR streaming.
"""

import bpy
import bmesh
import json
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
COLLECTIONS = ["hf_env", "hf_props", "hf_lights"]
EXPORT_DIR  = bpy.path.abspath("//batch_glb/")
MANIFEST    = bpy.path.abspath("//collection_manifest.json")

# ── Helpers ───────────────────────────────────────────────────────────────────

def find_layer_collection(root_lc, name):
    """
    Recursively locate a LayerCollection by its underlying Collection name.
    bpy.data.collections[name] gives the data block — there is no direct
    lookup from a collection name to its LayerCollection.  You must walk
    the tree rooted at view_layer.layer_collection.
    """
    if root_lc.collection.name == name:
        return root_lc
    for child in root_lc.children:
        found = find_layer_collection(child, name)
        if found:
            return found
    return None


def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Remove named collections left from previous runs.
    for name in COLLECTIONS:
        if name in bpy.data.collections:
            bpy.data.collections.remove(bpy.data.collections[name])


def make_collection(name, parent_col=None):
    """
    Create a Collection data block and link it as a child of parent_col
    (defaults to the scene root collection).
    Collections must be linked into the scene hierarchy — a bare
    bpy.data.collections.new() is invisible until linked.
    """
    col = bpy.data.collections.new(name)
    if parent_col is None:
        parent_col = bpy.context.scene.collection
    parent_col.children.link(col)
    return col


# ── Step 1: Build collection hierarchy ────────────────────────────────────────

purge_scene()
os.makedirs(EXPORT_DIR, exist_ok=True)

scene_root = bpy.context.scene.collection   # The master collection — NOT in
                                             # bpy.data.collections; querying
                                             # bpy.data.collections['Scene'] will
                                             # raise KeyError in 5.1.

env_col    = make_collection("hf_env",    scene_root)
props_col  = make_collection("hf_props",  scene_root)
lights_col = make_collection("hf_lights", scene_root)

print("[holoflow] Collections created and linked to scene root.")


# ── Step 2: Add geometry to each collection ───────────────────────────────────

def add_to_collection(obj, col):
    """
    Link an object into a named collection and unlink it from the scene root.
    New objects from bpy.ops are linked to the *active* collection by the
    operator, not necessarily the collection you want.  Always re-link manually.
    """
    # Unlink from all current collections to avoid duplicates.
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


# env: flat ground plane
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=4.0)
me = bpy.data.meshes.new("env_ground")
bm.to_mesh(me)
bm.free()
env_obj = bpy.data.objects.new("env_ground", me)
bpy.context.scene.collection.objects.link(env_obj)
add_to_collection(env_obj, env_col)

# props: three low-poly spheres at different positions
for i, (x, radius) in enumerate([(-2.0, 0.3), (0.0, 0.5), (2.0, 0.4)]):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius)
    me = bpy.data.meshes.new(f"prop_{i}")
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(f"prop_{i}", me)
    obj.location = (x, 0.0, radius)
    bpy.context.scene.collection.objects.link(obj)
    add_to_collection(obj, props_col)

# lights: three area lights
for i, (angle, energy) in enumerate([(0, 300), (120, 150), (240, 80)]):
    ld   = bpy.data.lights.new(f"area_{i}", 'AREA')
    ld.energy = energy
    ld.size   = 1.5
    lobj = bpy.data.objects.new(f"area_{i}", ld)
    r    = math.radians(angle)
    lobj.location = (3.0 * math.cos(r), 3.0 * math.sin(r), 4.0)
    bpy.context.scene.collection.objects.link(lobj)
    add_to_collection(lobj, lights_col)

print("[holoflow] Geometry distributed across collections.")


# ── Step 3: Per-ViewLayer visibility overrides ────────────────────────────────

vl  = bpy.context.scene.view_layers[0]
root_lc = vl.layer_collection   # The root LayerCollection wrapping scene.collection

# Lights: indirect_only=True — they light the scene but are not visible
# in the final render.  Essential for baked-lighting WebXR scenes where
# light objects should not appear as geometry.
lc_lights = find_layer_collection(root_lc, "hf_lights")
if lc_lights:
    lc_lights.indirect_only = True   # contributes to GI but not direct render
    # lc_lights.hide_viewport = True   # would also hide in viewport

# Env: holdout=True marks the ground plane as a compositing cut-out.
# Set this when you want to render props over a transparent background
# for mixed-reality compositing.  In a full WebXR pipeline, the env
# collection would instead carry the production geometry.
lc_env = find_layer_collection(root_lc, "hf_env")
if lc_env:
    lc_env.holdout = False   # leave visible; document the flag for reference

# Props: full visibility — the default
lc_props = find_layer_collection(root_lc, "hf_props")
if lc_props:
    lc_props.exclude = False     # included in view layer
    lc_props.hide_viewport = False

print("[holoflow] LayerCollection visibility overrides applied.")


# ── Step 4: Batch export each collection to its own GLB ──────────────────────

manifest_entries = {}

def export_collection_glb(col, out_dir):
    """
    Select only the objects directly in this collection (not recursive),
    then export with use_selection=True.

    GOTCHA: col.objects is NOT recursive — nested child collections are
    excluded.  For a recursive gather use a traversal; here each collection
    is flat so direct .objects suffices.
    """
    bpy.ops.object.select_all(action='DESELECT')
    members = list(col.objects)
    for obj in members:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

    if not members:
        print(f"[holoflow] Skipping {col.name}: no objects.")
        return None

    filepath = os.path.join(out_dir, f"{col.name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        # Lights: export only if the collection contains light objects —
        # the exporter silently skips non-light objects from the selection
        # when export_lights=True, so it's safe to leave on globally.
        export_lights=True,
    )
    print(f"[holoflow] Exported {filepath}")
    return filepath


for col_name in COLLECTIONS:
    col = bpy.data.collections.get(col_name)
    if col is None:
        continue
    path = export_collection_glb(col, EXPORT_DIR)
    if path:
        manifest_entries[col_name] = {
            "glb": os.path.relpath(path, bpy.path.abspath("//")),
            "object_count": len(col.objects),
        }


# ── Step 5: Write manifest ─────────────────────────────────────────────────

with open(MANIFEST, "w") as fh:
    json.dump({"collections": manifest_entries}, fh, indent=2)

print(f"[holoflow] Manifest written: {MANIFEST}")
print("[holoflow] blueprint.py complete.")
