"""
Holoflow Studio — Geometry Nodes Low-Poly Terrain
Blender 5.1 · licence: CC0 (this script)

Builds a faceted 400-face terrain using a live Geometry Nodes modifier.
Run from Blender's Scripting workspace (Alt+R / Run Script).

Why GN over the old Displace modifier:
  • The modifier stays live — Height and Noise sliders work in the panel
    after the script runs, no re-run needed.
  • apply_to_mesh() bakes it to a clean mesh for GLB export without
    disturbing the source .blend.
  • Flat shading is declared inside the graph rather than requiring a
    post-operation context call.
  • Noise is evaluated per-vertex in parallel on the GPU (Blender 5 EEVEE
    / Cycles GPU path), so large grids stay interactive.
"""

import bpy
import math
from pathlib import Path

# ── CONSTANTS — edit here, not inside the functions ────────────────────
GRID_SIZE        = 10.0   # world-space metres; 1:1 with holoflow:scale 1.0
GRID_SUBDIV      = 20     # 20×20 = 400 faces — good WebXR budget
HEIGHT_SCALE_DEF = 2.0    # exposed as a GN panel slider; metres peak-trough
NOISE_SCALE_DEF  = 3.5    # spatial frequency; lower → broader hills
NOISE_ROUGH_DEF  = 0.65   # fractal roughness; 0.5 = smooth, 0.9 = jagged
OBJECT_NAME      = "terrain_low_poly"
NG_NAME          = "HoloflowTerrainGN"
EXPORT_PATH      = "//output/terrain_low_poly.glb"


# ── 1. SCENE SETUP ────────────────────────────────────────────────────

def reset_scene() -> None:
    """Remove default objects so the script is idempotent."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def make_grid() -> bpy.types.Object:
    """Create a flat grid with enough polygons for readable terrain."""
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_SUBDIV,
        y_subdivisions=GRID_SUBDIV,
        size=GRID_SIZE,
        location=(0, 0, 0),
        calc_uvs=True,          # UVs needed if baking a texture later
    )
    obj = bpy.context.active_object
    obj.name = OBJECT_NAME
    obj.data.name = OBJECT_NAME + "_mesh"
    return obj


# ── 2. GEOMETRY NODES SETUP ──────────────────────────────────────────

def build_node_tree() -> bpy.types.NodeTree:
    """
    Construct the GN graph programmatically via bpy.data (no ops).

    Graph topology:
      GroupInput.Geometry  → SetPosition.Geometry → SetShadeSmooth.Geometry
      InputPosition.Vector → NoiseTexture.Vector
      NoiseTexture.Fac × HeightScale → Math.Value → CombineXYZ.Z
      CombineXYZ.Vector → SetPosition.Offset
      SetShadeSmooth(False).Geometry → GroupOutput.Geometry

    The InputPosition node samples each vertex's current XY position and
    feeds it into the Noise Texture as the 3D lookup coordinate.  This
    makes the noise field align with world-space, so the terrain tiles
    cleanly if you duplicate it.  Feeding UV coordinates instead would
    break on non-square grids and cause stretching at the seam.
    """
    # ── node tree ──────────────────────────────────────────────────
    if NG_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[NG_NAME])
    ng = bpy.data.node_groups.new(NG_NAME, 'GeometryNodeTree')

    # ── interface (Blender 4.0+ .interface API) ────────────────────
    iface = ng.interface
    iface.new_socket("Geometry",     in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Height Scale", in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Noise Scale",  in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Roughness",    in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Geometry",     in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nodes = ng.nodes

    # ── add nodes ─────────────────────────────────────────────────
    grp_in  = nodes.new("NodeGroupInput")
    grp_out = nodes.new("NodeGroupOutput")
    pos_in  = nodes.new("GeometryNodeInputPosition")   # per-vertex XYZ
    noise   = nodes.new("ShaderNodeTexNoise")          # same ID in GN ctx
    math_m  = nodes.new("ShaderNodeMath")              # Fac × HeightScale
    combine = nodes.new("ShaderNodeCombineXYZ")        # → offset vector
    set_pos = nodes.new("GeometryNodeSetPosition")
    set_smo = nodes.new("GeometryNodeSetShadeSmooth")  # flat = False

    # Layout — helps readability when the artist opens the node editor
    grp_in.location  = (-800,  100)
    pos_in.location  = (-600, -200)
    noise.location   = (-400, -200)
    math_m.location  = (-200, -200)
    combine.location = (  0,  -200)
    set_pos.location = ( 200,  100)
    set_smo.location = ( 450,  100)
    grp_out.location = ( 700,  100)

    # ── node settings ──────────────────────────────────────────────
    math_m.operation = 'MULTIPLY'
    noise.noise_dimensions = '3D'

    # Flat shading — the entire point of the "faceted" look.
    # Domain='FACE' means each triangle gets its own averaged normal,
    # producing the hard-edge stylisation the studio favours.
    set_smo.domain = 'FACE'
    set_smo.inputs["Shade Smooth"].default_value = False

    # Default slider values surfaced in the modifier panel
    grp_in.outputs["Height Scale"].default_value = HEIGHT_SCALE_DEF
    grp_in.outputs["Noise Scale"].default_value  = NOISE_SCALE_DEF
    grp_in.outputs["Roughness"].default_value    = NOISE_ROUGH_DEF

    # ── links ──────────────────────────────────────────────────────
    lnk = ng.links.new

    # Geometry chain
    lnk(grp_in.outputs["Geometry"],    set_pos.inputs["Geometry"])
    lnk(set_pos.outputs["Geometry"],   set_smo.inputs["Geometry"])
    lnk(set_smo.outputs["Geometry"],   grp_out.inputs["Geometry"])

    # Noise evaluation
    lnk(pos_in.outputs["Position"],   noise.inputs["Vector"])
    lnk(grp_in.outputs["Noise Scale"], noise.inputs["Scale"])
    lnk(grp_in.outputs["Roughness"],   noise.inputs["Roughness"])

    # Height = Fac × HeightScale
    lnk(noise.outputs["Fac"],             math_m.inputs[0])
    lnk(grp_in.outputs["Height Scale"],   math_m.inputs[1])

    # Pack into Z-only offset vector (X=0, Y=0, Z=height)
    lnk(math_m.outputs["Value"],  combine.inputs["Z"])
    lnk(combine.outputs["Vector"], set_pos.inputs["Offset"])

    return ng


# ── 3. MATERIAL — flat-shade, cel-ready ──────────────────────────────

def make_terrain_material() -> bpy.types.Material:
    """
    A plain diffuse material ready for the cel-shading pipeline.
    No texture — colour comes from vertex colour or a single Principled
    BSDF slot.  Kept intentionally thin; the Freestyle + Toon BSDF
    override happens at render time, not here.
    """
    mat = bpy.data.materials.new("terrain_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.34, 0.48, 0.28, 1.0)
        bsdf.inputs["Roughness"].default_value  = 1.0
        bsdf.inputs["Metallic"].default_value   = 0.0
    return mat


# ── 4. WIRE IT TOGETHER ───────────────────────────────────────────────

def apply_terrain(obj: bpy.types.Object,
                  ng:  bpy.types.NodeTree,
                  mat: bpy.types.Material) -> None:
    """Attach modifier + material; configure Holoflow export flags."""
    mod = obj.modifiers.new("HoloflowTerrain", 'NODES')
    mod.node_group = ng

    # Assign terrain material
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    # holoflow:facet — the exporter reads this to skip smooth-normal
    # baking and instead preserve hard edges in the GLB.
    obj["holoflow:facet"] = True
    obj["holoflow:name"]  = OBJECT_NAME


# ── 5. GLB EXPORT (optional — uncomment when running locally) ─────────

def export_glb(obj: bpy.types.Object) -> None:
    """
    Bake the GN modifier and export.
    apply_modifiers=True is non-destructive — it operates on a temporary
    copy, so the source .blend keeps the live modifier.

    Draco compression level 6 is the studio default (BLENDER-EXTENSIONS.md
    §holoflow_webxr_exporter). Level 7+ gives marginal gains but triples
    decode time on Quest 3 hardware.
    """
    Path(bpy.path.abspath(EXPORT_PATH)).parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        use_selection=True,
        export_apply=True,           # bakes GN modifier
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,             # +Y up for three.js / WebXR
        export_format='GLB',
    )
    print(f"[HF] Exported → {EXPORT_PATH}")


# ── ENTRY POINT ───────────────────────────────────────────────────────

def main() -> None:
    reset_scene()
    obj = make_grid()
    ng  = build_node_tree()
    mat = make_terrain_material()
    apply_terrain(obj, ng, mat)

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    print(f"[HF] Terrain '{OBJECT_NAME}' ready — {GRID_SUBDIV**2} faces.")
    print("[HF] Adjust Height Scale / Noise Scale sliders in the modifier panel.")
    print("[HF] Uncomment export_glb(obj) below when ready to ship.")
    # export_glb(obj)


main()
