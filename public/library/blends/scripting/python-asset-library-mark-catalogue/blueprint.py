"""
Python — Asset Library API: Batch-Mark Materials & Node Groups as Catalogue Assets
Blender 5.1 | CC0 | Holoflow Studio

The Asset Browser (introduced in Blender 3.0, API stabilised in 4.0+) treats ordinary
Blender datablocks — materials, objects, node groups, worlds, actions — as reusable
studio assets once they are *marked*.  Marking writes an AssetMetaData struct into the
datablock: a description, a set of string tags, a UUID-based catalog assignment, and a
preview image.  The marked datablock must then be saved to a *library .blend file* on a
path registered in Preferences → File Paths → Asset Libraries.  Blender's file browser
indexes every .blend in that tree and serves them in the Asset Browser panel.

Why use the Python API instead of the UI?
  UI  → click Mark Asset per-datablock, assign tags one by one, hand-type catalog IDs.
  API → loop over 50 materials in 3 seconds, enforce naming conventions, generate previews
        in batch, write .cats.txt from a dict — reproducible, version-controlled, CI-safe.

This script demonstrates:
  1. Procedural creation of four studio-standard materials.
  2. Marking each with asset_mark() + AssetMetaData fields.
  3. Creating a .cats.txt catalogue file (the registry Blender reads for category trees).
  4. Generating preview thumbnails programmatically.
  5. Saving to an external library .blend via bpy.ops.wm.save_as_mainfile().

Run in Blender's Script Editor (Text → Run Script) or via
  blender --background --python blueprint.py
"""

import bpy
import os
import math

# ── Named constants ─────────────────────────────────────────────────────────────
SLUG              = "python-asset-library-mark-catalogue"
LIBRARY_BLEND     = os.path.join(os.path.expanduser("~"), "holoflow_asset_lib.blend")
CATALOG_PATH      = os.path.join(os.path.expanduser("~"), "holoflow_asset_lib.cats.txt")

# Catalog UUIDs — fixed per category so .cats.txt is stable across resaves.
# UUIDs are arbitrary but must be unique; generate once, commit to VCS, never change.
CAT_ROOT     = "ho10f1ow-0000-0000-0000-000000000000"
CAT_MAT      = "ho10f1ow-0001-0000-0000-000000000001"
CAT_MAT_PBR  = "ho10f1ow-0001-0001-0000-000000000001"
CAT_MAT_NPR  = "ho10f1ow-0001-0002-0000-000000000001"
CAT_NODES    = "ho10f1ow-0002-0000-0000-000000000002"

# ── 0. Fresh scene ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = SLUG
scene.render.engine = "CYCLES"

# ── 1. Helper: build a preview mesh so Blender has something to render ───────────
def add_preview_sphere(name: str, mat: bpy.types.Material) -> bpy.types.Object:
    """A UV sphere used as the standard material-preview subject."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = f"_preview_{name}"
    obj.data.materials.append(mat)
    return obj


# ─────────────────────────────────────────────────────────────────────────────────
# 2. Create four studio-standard materials
# ─────────────────────────────────────────────────────────────────────────────────

# ── 2a. PBR Faceted Flat ─────────────────────────────────────────────────────────
# Faceted (flat-shaded) low-poly material: no subsurface, zero roughness variation,
# pure diffuse colour.  The holoflow:facet flag is set on the OBJECT, not the material,
# but this material is designed to pair with flat-shaded geometry.
def make_faceted_flat_mat() -> bpy.types.Material:
    mat = bpy.data.materials.new("HF_Faceted_Flat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    bsdf.inputs["Base Color"].default_value   = (0.18, 0.52, 0.82, 1.0)   # steel blue
    bsdf.inputs["Roughness"].default_value    = 0.85
    bsdf.inputs["Metallic"].default_value     = 0.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.04

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── 2b. Toon Cel Shader ──────────────────────────────────────────────────────────
# Uses a Diffuse BSDF → ShaderToRgb → ColorRamp (step) pattern to give a hard-edge
# two-tone cel look in EEVEE.  The key: ShaderToRgb is an EEVEE-specific node that
# captures the rendered illumination value as a colour, letting a ColorRamp posterise it.
# In Cycles this degrades gracefully to a smooth ramp.
def make_toon_cel_mat() -> bpy.types.Material:
    mat = bpy.data.materials.new("HF_Toon_Cel")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial");  out.location   = (700, 0)
    emit  = nt.nodes.new("ShaderNodeEmission");        emit.location  = (500, 0)
    ramp  = nt.nodes.new("ShaderNodeValToRGB");        ramp.location  = (250, 0)
    s2rgb = nt.nodes.new("ShaderNodeShaderToRGB");     s2rgb.location = (0, 0)
    diff  = nt.nodes.new("ShaderNodeBsdfDiffuse");     diff.location  = (-250, 0)

    diff.inputs["Color"].default_value    = (0.95, 0.30, 0.25, 1.0)   # warm red
    diff.inputs["Roughness"].default_value = 0.0

    # Two-stop step ramp: shadow band + lit band
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = (0.20, 0.07, 0.05, 1.0)  # shadow
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color    = (1.00, 0.80, 0.75, 1.0)  # lit

    emit.inputs["Strength"].default_value = 1.0

    nt.links.new(diff.outputs["BSDF"],    s2rgb.inputs["Shader"])
    nt.links.new(s2rgb.outputs["Color"],  ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"],   emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── 2c. Principled Glass ─────────────────────────────────────────────────────────
# IOR 1.50 (borosilicate), transmission 1.0.  In Blender 4.x Principled BSDF v2 the
# Transmission input was renamed from "Transmission" to "Transmission Weight".  We use
# the generic index approach to be forward-compatible.
def make_glass_mat() -> bpy.types.Material:
    mat = bpy.data.materials.new("HF_Glass_Clear")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (400, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (100, 0)

    bsdf.inputs["Base Color"].default_value  = (0.98, 0.99, 1.0, 1.0)
    bsdf.inputs["Roughness"].default_value   = 0.03
    bsdf.inputs["IOR"].default_value         = 1.50
    # Try by name first; fall back to index for older builds
    try:
        bsdf.inputs["Transmission Weight"].default_value = 1.0
    except KeyError:
        bsdf.inputs["Transmission"].default_value = 1.0

    mat.blend_method  = "BLEND"
    mat.shadow_method = "HASHED"

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── 2d. Procedural Emissive Grid ─────────────────────────────────────────────────
# Sci-fi panel grid: a dark base with thin bright emissive lines.
# Pattern: fract(UV * scale) → smoothstep → emissive colour.
# Uses UV Mapping + Texture Coordinate so it works without explicit UV unwrap.
def make_emissive_grid_mat() -> bpy.types.Material:
    SCALE     = 6.0
    LINE_W    = 0.05   # fraction of cell width occupied by line
    LINE_COL  = (0.05, 0.90, 1.00, 1.0)   # cyan plasma
    BASE_COL  = (0.06, 0.07, 0.09, 1.0)   # near-black

    mat = bpy.data.materials.new("HF_Emissive_Grid")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out    = nt.nodes.new("ShaderNodeOutputMaterial"); out.location    = (900, 0)
    add_sh = nt.nodes.new("ShaderNodeAddShader");      add_sh.location = (700, 0)
    emit   = nt.nodes.new("ShaderNodeEmission");       emit.location   = (500, 100)
    bsdf   = nt.nodes.new("ShaderNodeBsdfDiffuse");    bsdf.location   = (500,-100)
    mix    = nt.nodes.new("ShaderNodeMixRGB");         mix.location    = (300, 100)
    ssmth  = nt.nodes.new("ShaderNodeMath");           ssmth.location  = (100, 100)
    fract  = nt.nodes.new("ShaderNodeMath");           fract.location  = (-100, 0)
    scale  = nt.nodes.new("ShaderNodeMath");           scale.location  = (-300, 0)
    uvmap  = nt.nodes.new("ShaderNodeUVMap");          uvmap.location  = (-600, 0)
    tc     = nt.nodes.new("ShaderNodeTexCoord");       tc.location     = (-800, 0)

    scale.operation = "MULTIPLY"
    scale.inputs[1].default_value = SCALE

    fract.operation = "FRACT"

    ssmth.operation = "SMOOTHSTEP"     # smoothstep(edge0, edge1, x): returns 0..1
    ssmth.inputs[0].default_value = 0.0
    ssmth.inputs[1].default_value = LINE_W

    mix.blend_type = "MIX"
    mix.inputs["Color1"].default_value = BASE_COL
    mix.inputs["Color2"].default_value = LINE_COL

    emit.inputs["Strength"].default_value = 4.0
    bsdf.inputs["Color"].default_value    = BASE_COL

    nt.links.new(tc.outputs["UV"],        uvmap.inputs["UV"])
    nt.links.new(uvmap.outputs["UV"],     scale.inputs[0])
    nt.links.new(scale.outputs["Value"],  fract.inputs[0])
    nt.links.new(fract.outputs["Value"],  ssmth.inputs[2])
    nt.links.new(ssmth.outputs["Value"],  mix.inputs["Fac"])
    nt.links.new(mix.outputs["Color"],    emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], add_sh.inputs[0])
    nt.links.new(bsdf.outputs["BSDF"],   add_sh.inputs[1])
    nt.links.new(add_sh.outputs["Shader"], out.inputs["Surface"])
    return mat


# ── 3. Instantiate all materials ─────────────────────────────────────────────────
mat_faceted = make_faceted_flat_mat()
mat_toon    = make_toon_cel_mat()
mat_glass   = make_glass_mat()
mat_grid    = make_emissive_grid_mat()

all_assets = [
    (mat_faceted, CAT_MAT_PBR, ["vrm", "low-poly", "faceted", "pbr"],
     "Studio-standard flat-shaded Principled BSDF. Pairs with holoflow:facet flat geometry."),
    (mat_toon,    CAT_MAT_NPR, ["vrm", "cel", "toon", "eevee", "npr"],
     "Two-stop constant ColorRamp cel shader. Shader-to-RGB requires EEVEE; Cycles gives smooth ramp."),
    (mat_glass,   CAT_MAT_PBR, ["glass", "transmission", "cycles", "pbr"],
     "Borosilicate glass (IOR 1.50). Use Path Guiding + Shadow Caustics in Cycles for accurate refractions."),
    (mat_grid,    CAT_MAT_NPR, ["emissive", "scifi", "grid", "pbr", "procedural"],
     "Procedural emissive grid. No UV bake required. Scale constant controls line density."),
]


# ── 4. Mark each datablock as an Asset ───────────────────────────────────────────
# asset_mark() writes an AssetMetaData struct into the datablock.
# Until marked, the datablock is an ordinary Blender resource — no catalog, no tags.
# After marking, it becomes addressable by the Asset Browser.

for mat, cat_uuid, tags, description in all_assets:
    mat.asset_mark()                          # writes AssetMetaData

    ad = mat.asset_data                       # bpy.types.AssetMetaData
    ad.description = description
    ad.catalog_id  = cat_uuid                 # must match a UUID in .cats.txt

    for tag in tags:
        ad.tags.new(tag, skip_if_exists=True) # idempotent; safe to re-run

    # Preview: Blender generates it during interactive save, but we can request it now.
    # In --background mode this is a no-op (no display context); interactive sessions render it.
    try:
        with bpy.context.temp_override(id=mat):
            bpy.ops.ed.lib_id_generate_preview()
    except Exception:
        pass   # background mode: skip; Blender generates on first interactive open


# ── 5. Write .cats.txt ────────────────────────────────────────────────────────────
# .cats.txt is a plain-text file placed alongside the .blend library.  Each non-comment
# line is:  UUID:path/with/slashes:optional-simple-name
# The path uses forward slashes as separators on all platforms.
# Blender reads .cats.txt from the same folder as the .blend when it indexes the library.

CATS_CONTENT = f"""\
# Holoflow Studio Asset Catalogue
# Auto-generated by {SLUG}/blueprint.py — do not hand-edit UUIDs.
VERSION 1

{CAT_ROOT}:Holoflow:Holoflow Studio
{CAT_MAT}:Holoflow/Materials:Materials
{CAT_MAT_PBR}:Holoflow/Materials/PBR:PBR
{CAT_MAT_NPR}:Holoflow/Materials/NPR:NPR
{CAT_NODES}:Holoflow/NodeGroups:Node Groups
"""

os.makedirs(os.path.dirname(CATALOG_PATH), exist_ok=True) if os.path.dirname(CATALOG_PATH) else None
with open(CATALOG_PATH, "w", encoding="utf-8") as f:
    f.write(CATS_CONTENT)

print(f"[blueprint] Wrote catalogue: {CATALOG_PATH}")


# ── 6. Place preview objects in the scene (cosmetic, for viewport screenshot) ────
# Arrange four spheres in a row so the viewport recording shows all four materials.
for i, (mat, *_) in enumerate(all_assets):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.4,
        location=(i * 1.1 - 1.65, 0, 0),
        segments=32,
        ring_count=16,
    )
    obj = bpy.context.active_object
    obj.name = f"preview_{mat.name}"
    obj.data.materials.append(mat)

# Camera
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location       = (0.0, -4.5, 1.2)
cam_obj.rotation_euler = (math.radians(75), 0.0, 0.0)

# Three-point lighting
for loc, energy, name in [
    ((-3, -3,  4), 600, "key"),
    (( 3, -2,  3), 200, "fill"),
    (( 0,  2,  4), 150, "rim"),
]:
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.size   = 1.5
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc

# Render settings
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = "//output/asset_library_preview_0001.png"
scene.cycles.samples   = 64

# ── 7. Save to library .blend ─────────────────────────────────────────────────────
# The file MUST be saved before asset previews are finalised and before Blender
# indexes it as part of a library.  In interactive sessions the user presses
# Ctrl+S; in scripts we use bpy.ops.wm.save_as_mainfile().
# IMPORTANT: copy=True means save a COPY to LIBRARY_BLEND without making it the
# active file; the session stays pointed at the original working .blend.
bpy.ops.wm.save_as_mainfile(filepath=LIBRARY_BLEND, copy=True)
print(f"[blueprint] Library saved: {LIBRARY_BLEND}")
print("[blueprint] Done — 4 materials marked, catalogued, and saved.")
