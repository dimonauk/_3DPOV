"""
Blueprint: Python Cycles Texture Batch Bake Pipeline
Topic:     bpy.ops.object.bake() — Normal, AO & Emission to WebP for WebXR
Slug:      python-cycles-batch-bake-normal-ao-emission-webxr
Blender:   5.1  |  Licence: CC0

WHY THIS SCRIPT EXISTS
----------------------
Blender's bake operator solves one of the hardest problems in real-time asset
production: the gap between Cycles surface fidelity and the triangle budget a
WebXR scene can afford. A sculpted 500k-polygon hand bakes down to a 2k normal
map that a 800-tri low-poly can sample at runtime — the viewer perceives depth
that isn't there. Running the bake manually per object per pass does not scale
past a handful of props. This script automates the full cycle.

FUNDAMENTAL CONSTRAINT: bpy.ops.object.bake() is a Cycles-only operator. It
silently does nothing (no error) if the render engine is EEVEE Next. The
script temporarily overrides the engine and restores it on exit.

ACTIVE IMAGE TEXTURE NODE RULE
-------------------------------
Blender does not bake into a node connected to Material Output. It bakes into
whichever Image Texture node is currently *active* (highlighted blue) in the
material's node tree — and that node must be *disconnected* from the output
chain. We inject a temporary node, mark it active, run the bake, save to disk,
then remove the node. The object's live shader is never disturbed.

SELECTED-TO-ACTIVE NORMAL BAKING
---------------------------------
For hi-poly → lo-poly normal transfer:
  - hi-poly: selected (acts as ray source)
  - lo-poly: active (receives bake into its UV map)
  - use_selected_to_active=True
  - cage_extrusion >= maximum protrusion of hi-poly surface beyond lo-poly
For standalone AO / Emission bakes:
  - only the lo-poly is selected AND active
  - use_selected_to_active=False
"""

import bpy
import os

# ── tuneable parameters ───────────────────────────────────────────────────────
OUTPUT_DIR   = "//bake_output"    # // = relative to the .blend file
IMAGE_WIDTH  = 1024
IMAGE_HEIGHT = 1024
SAMPLES      = 64                 # Cycles samples per bake pass
MARGIN_PX    = 16                 # UV island bleed margin in pixels
CAGE_EXTRUDE = 0.02               # hi-poly overhang tolerance for S2A normals (m)

PASSES: list[dict] = [
    # type matches bpy.ops.object.bake(type=...) enum
    {"type": "NORMAL", "bits": 32, "suffix": "_nm"},
    {"type": "AO",     "bits": 8,  "suffix": "_ao"},
    {"type": "EMIT",   "bits": 8,  "suffix": "_em"},
]
# ─────────────────────────────────────────────────────────────────────────────


def _ensure_output_dir(blend_rel: str) -> str:
    """Resolve a // path and create the directory tree if absent."""
    abs_path = bpy.path.abspath(blend_rel)
    os.makedirs(abs_path, exist_ok=True)
    return abs_path


def _require_uv_map(obj: bpy.types.Object) -> None:
    """
    Guarantee at least one UV layer exists and is active.
    Without a UV map, bpy.ops.object.bake() raises RuntimeError immediately.
    """
    if not obj.data.uv_layers:
        obj.data.uv_layers.new(name="BakeST")
    obj.data.uv_layers.active = obj.data.uv_layers[0]


def _new_image(name: str, width: int, height: int, bits: int) -> bpy.types.Image:
    """
    Allocate an image buffer.

    bits=32 → float buffer (correct for normal maps: linear, no gamma encoding).
    bits=8  → 8-bit sRGB (correct for AO and emission, which are colour values).
    is_data=True marks the image as non-colour so Cycles handles gamma correctly
    during the bake; the colorspace_settings below makes this explicit in the UI.
    """
    img = bpy.data.images.new(
        name=name,
        width=width,
        height=height,
        alpha=False,
        float_buffer=(bits == 32),
        is_data=(bits == 32),
    )
    img.colorspace_settings.name = "Non-Color" if bits == 32 else "sRGB"
    return img


def _inject_bake_node(
    mat: bpy.types.Material, img: bpy.types.Image
) -> bpy.types.Node:
    """
    Insert an Image Texture node, assign the target image, and mark it active.

    The node is intentionally disconnected from the shader tree. Blender's
    baker reads from the active node regardless of the graph's output chain.
    Connecting it would corrupt the object's live material appearance.
    """
    mat.use_nodes = True
    tree = mat.node_tree
    node = tree.nodes.new("ShaderNodeTexImage")
    node.image = img
    node.label = "_HOLOFLOW_BAKE_TMP"
    # Park the node out of the way of the existing graph
    node.location = (0.0, -500.0)
    # Mark active — the baker reads this one
    tree.nodes.active = node
    return node


def _remove_bake_node(mat: bpy.types.Material) -> None:
    """Remove the temporary node identified by its label."""
    tree = mat.node_tree
    for node in list(tree.nodes):
        if node.label == "_HOLOFLOW_BAKE_TMP":
            tree.nodes.remove(node)


def _save_as_webp(img: bpy.types.Image, out_dir: str) -> str:
    """
    Save an image buffer to disk as WebP.

    Normal maps use quality=100 (maximum, near-lossless) to preserve the
    signed XYZ direction vectors precisely; AO and emission can tolerate
    quality=90 for a smaller file footprint.
    """
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "WEBP"
    is_normal = img.name.endswith("_nm")
    scene.render.image_settings.quality = 100 if is_normal else 90

    filepath = os.path.join(out_dir, img.name + ".webp")
    img.file_format = "WEBP"
    img.filepath_raw = filepath
    img.save_render(filepath=filepath, scene=scene)
    return filepath


def bake_object_passes(
    lo_poly: bpy.types.Object,
    hi_poly: bpy.types.Object | None,
    out_dir: str,
) -> list[str]:
    """
    Run every bake pass for lo_poly, optionally projecting from hi_poly.

    Returns a list of WebP filepaths written to out_dir.
    """
    _require_uv_map(lo_poly)
    saved_paths: list[str] = []

    for pass_cfg in PASSES:
        pass_type: str = pass_cfg["type"]
        suffix: str    = pass_cfg["suffix"]
        bits: int      = pass_cfg["bits"]

        img_name = f"{lo_poly.name}{suffix}"
        img = _new_image(img_name, IMAGE_WIDTH, IMAGE_HEIGHT, bits)

        # Inject bake node into every material slot on lo_poly.
        # Objects with multiple materials need the target node in each slot —
        # the baker iterates material slots internally.
        for slot in lo_poly.material_slots:
            if slot.material is None:
                continue
            _inject_bake_node(slot.material, img)

        # Selection state ────────────────────────────────────────────────────
        # For Selected-to-Active (hi→lo normal): hi selected, lo active.
        # For standalone bakes: lo is both selected and active.
        bpy.ops.object.select_all(action="DESELECT")
        lo_poly.select_set(True)
        bpy.context.view_layer.objects.active = lo_poly
        use_s2a = hi_poly is not None and pass_type == "NORMAL"
        if use_s2a:
            hi_poly.select_set(True)
        # ────────────────────────────────────────────────────────────────────

        bpy.ops.object.bake(
            type=pass_type,
            use_selected_to_active=use_s2a,
            cage_extrusion=CAGE_EXTRUDE if use_s2a else 0.0,
            margin=MARGIN_PX,
            # EXTEND fills the margin with the nearest UV island pixel,
            # preventing hard seams at the island edge on minified textures.
            margin_type="EXTEND",
            save_mode="INTERNAL",
        )

        path = _save_as_webp(img, out_dir)
        saved_paths.append(path)
        print(f"  [{pass_type}] → {path}")

        # Cleanup: strip the injected node and free the in-memory buffer
        for slot in lo_poly.material_slots:
            if slot.material:
                _remove_bake_node(slot.material)
        bpy.data.images.remove(img)

    return saved_paths


def run_batch_bake(
    lo_poly_names: list[str],
    hi_poly_map: dict[str, str] | None = None,
) -> None:
    """
    Top-level entry point.

    lo_poly_names : names of lo-poly objects to bake.
    hi_poly_map   : optional {lo_name: hi_name} pairs for S2A normal baking.
    """
    scene = bpy.context.scene
    prev_engine = scene.render.engine
    prev_samples = scene.cycles.samples

    # Cycles is required — EEVEE Next silently ignores the bake operator
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES

    out_dir = _ensure_output_dir(OUTPUT_DIR)
    hi_map = hi_poly_map or {}
    total: list[str] = []

    for lo_name in lo_poly_names:
        lo_obj = bpy.data.objects.get(lo_name)
        if lo_obj is None:
            print(f"[WARN] '{lo_name}' not found — skipped")
            continue

        hi_name = hi_map.get(lo_name)
        hi_obj  = bpy.data.objects.get(hi_name) if hi_name else None
        if hi_name and hi_obj is None:
            print(f"[WARN] hi-poly '{hi_name}' missing — normal baked without S2A")

        pair_label = f"{lo_name}" + (f" ← {hi_name}" if hi_obj else "")
        print(f"\n[BAKE] {pair_label}")
        saved = bake_object_passes(lo_obj, hi_obj, out_dir)
        total.extend(saved)

    # Restore engine and sample count
    scene.render.engine = prev_engine
    scene.cycles.samples = prev_samples
    print(f"\n[DONE] {len(total)} map(s) written to {out_dir}/")


# ── demo: auto-discover lo_* / hi_* object pairs in the scene ────────────────
if __name__ == "__main__":
    lo_names = sorted(
        o.name for o in bpy.data.objects if o.name.startswith("lo_")
    )
    hi_map: dict[str, str] = {}
    for n in lo_names:
        candidate = n.replace("lo_", "hi_", 1)
        if bpy.data.objects.get(candidate):
            hi_map[n] = candidate

    if not lo_names:
        print("[INFO] No objects prefixed 'lo_' found. Rename your lo-poly objects and re-run.")
    else:
        run_batch_bake(lo_names, hi_map)
