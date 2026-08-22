"""
GN Volume Cube + Noise Field — Procedural Cumulus Cloud
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: the Geometry Nodes Volume Cube node evaluates its Density socket
as a per-voxel field.  That means you can wire a Noise Texture directly to
Density and Blender samples the noise at every voxel centre in one GN pass —
no simulation, no baking, purely procedural.  Two layered noise passes give
coarse cloud-mass shape plus fine wispy detail.  A Z-axis Map Range gradient
enforces the flat-base / rounded-top silhouette typical of cumulus.  A
threshold Map Range strips the haze below density 0.45, leaving sky visible
between cloud cells.  The resulting Volume geometry is shaded with Principled
Volume; because GLB/glTF does not carry voxel data, the script also builds a
Mesh from Volume iso-surface object for WebXR export.

Outside sources
  Blender Manual — Volume Cube (Geometry Nodes)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/volume_cube.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Blender Manual — Principled Volume Shader
    https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/volume_principled.html
    CC-BY-SA 4.0 · Blender Documentation Team
  blender-scripting — Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
CLOUD_DIMS   = (4.0, 3.0, 1.8)   # volume bounding-box half-extents (x, y, z metres)
VOXEL_RES    = (80, 60, 40)       # resolution — 80×60×40 = 192 000 voxels, fast
                                   # raise to (160, 120, 80) for final-quality renders

# Noise A — coarse cloud mass (equivalent to ~200 m cloud cells at real scale)
NOISE_A_SCALE   = 1.4   # lower → larger blobs
NOISE_A_DETAIL  = 4.0   # octave count; more octaves add surface complexity
NOISE_A_ROUGH   = 0.55  # per-octave amplitude fall-off

# Noise B — fine wisps layered over the coarse structure
NOISE_B_SCALE   = 5.5
NOISE_B_DETAIL  = 2.0
NOISE_B_ROUGH   = 0.65
NOISE_B_BLEND   = 0.28  # weight of fine noise in the combined signal

# Density shaping
DENSITY_THRESHOLD = 0.45   # voxels below this value are clear sky
                            # 0.30 → more cloud, 0.65 → thin cirrus
CLOUD_BASE_Z  = -0.9       # object-space Z of flat cloud base
CLOUD_TOP_Z   =  0.9       # gradient zeroes density above this altitude

# Principled Volume material
SCATTER_COLOUR   = (0.92, 0.94, 1.00)   # slightly blue-white water droplets
ABSORB_COLOUR    = (0.70, 0.78, 0.90)   # darker absorption for cloud shadows
DENSITY_MULT     = 14.0    # multiplied with the 0-1 voxel field value
ANISOTROPY       = 0.30    # forward scattering — positive Henyey-Greenstein

# GLB iso-surface export
ISO_THRESHOLD   = 0.55
EXPORT_PATH     = "//cumulus_cloud_iso.glb"

MATERIAL_NAME   = "Cloud_PrincipledVolume"
OBJ_NAME        = "cumulus_cloud"
ISO_OBJ_NAME    = "cumulus_cloud_iso"
NG_NAME         = "CumulusCloudGN"


# ── Helpers ───────────────────────────────────────────────────────────────────
def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith((OBJ_NAME, ISO_OBJ_NAME)):
            bpy.data.objects.remove(ob, do_unlink=True)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith(NG_NAME):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith(MATERIAL_NAME):
            bpy.data.materials.remove(ma)


def _make_volume_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MATERIAL_NAME)
    mat.use_nodes = True
    mat.use_fake_user = True
    nt = mat.node_tree
    nt.nodes.clear()

    pv = nt.nodes.new("ShaderNodeVolumePrincipled")
    pv.location = (0, 0)
    pv.inputs["Color"].default_value = (*SCATTER_COLOUR, 1.0)
    pv.inputs["Density"].default_value = DENSITY_MULT
    # Absorption Color darkens the interior — gives depth to thick regions
    pv.inputs["Absorption Color"].default_value = (*ABSORB_COLOUR, 1.0)
    pv.inputs["Anisotropy"].default_value = ANISOTROPY
    # Emission stays zero; clouds do not self-illuminate
    pv.inputs["Emission Strength"].default_value = 0.0

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    nt.links.new(pv.outputs["Volume"], out.inputs["Volume"])
    # Surface socket intentionally left empty — pure volume shader
    return mat


def _make_cloud_node_group(mat: bpy.types.Material) -> bpy.types.NodeTree:
    ng = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    N  = ng.nodes
    L  = ng.links
    x  = 0   # running X offset for layout

    g_out = N.new("NodeGroupOutput");  g_out.location = (1100, 0)

    # Per-voxel position — field domain is POINT (each voxel centre)
    pos = N.new("GeometryNodeInputPosition"); pos.location = (-600, 0)

    # ── Noise A: coarse structure ────────────────────────────────────────────
    na = N.new("ShaderNodeTexNoise"); na.location = (-400, 120)
    na.noise_dimensions = "3D"
    na.inputs["Scale"].default_value      = NOISE_A_SCALE
    na.inputs["Detail"].default_value     = NOISE_A_DETAIL
    na.inputs["Roughness"].default_value  = NOISE_A_ROUGH
    na.inputs["Distortion"].default_value = 0.0
    L.new(pos.outputs["Position"], na.inputs["Vector"])

    # ── Noise B: fine wisps ───────────────────────────────────────────────────
    nb = N.new("ShaderNodeTexNoise"); nb.location = (-400, -100)
    nb.noise_dimensions = "3D"
    nb.inputs["Scale"].default_value      = NOISE_B_SCALE
    nb.inputs["Detail"].default_value     = NOISE_B_DETAIL
    nb.inputs["Roughness"].default_value  = NOISE_B_ROUGH
    nb.inputs["Distortion"].default_value = 0.0
    L.new(pos.outputs["Position"], nb.inputs["Vector"])

    # Scale fine noise by blend weight before adding
    mul_b = N.new("ShaderNodeMath"); mul_b.location = (-160, -100)
    mul_b.operation = "MULTIPLY"
    mul_b.inputs[1].default_value = NOISE_B_BLEND
    L.new(nb.outputs["Fac"], mul_b.inputs[0])

    add_ab = N.new("ShaderNodeMath"); add_ab.location = (0, 60)
    add_ab.operation = "ADD"
    add_ab.use_clamp = False
    L.new(na.outputs["Fac"], add_ab.inputs[0])
    L.new(mul_b.outputs["Value"], add_ab.inputs[1])

    # ── Altitude gradient: flat base, fade-out at top ────────────────────────
    # Separate Z from the per-voxel position
    sep = N.new("ShaderNodeSeparateXYZ"); sep.location = (-400, -280)
    L.new(pos.outputs["Position"], sep.inputs["Vector"])

    alt_map = N.new("ShaderNodeMapRange"); alt_map.location = (-160, -280)
    alt_map.data_type = "FLOAT"
    alt_map.clamp = True
    # Maps Z: cloud_base → 1.0 (full density), cloud_top → 0.0 (no cloud)
    alt_map.inputs["From Min"].default_value = CLOUD_BASE_Z
    alt_map.inputs["From Max"].default_value = CLOUD_TOP_Z
    alt_map.inputs["To Min"].default_value   = 1.0
    alt_map.inputs["To Max"].default_value   = 0.0
    L.new(sep.outputs["Z"], alt_map.inputs["Value"])

    # Multiply combined noise by altitude mask
    mul_alt = N.new("ShaderNodeMath"); mul_alt.location = (180, 0)
    mul_alt.operation = "MULTIPLY"
    L.new(add_ab.outputs["Value"], mul_alt.inputs[0])
    L.new(alt_map.outputs["Result"], mul_alt.inputs[1])

    # Threshold: remap [density_threshold, 1] → [0, 1] and clamp
    # Voxels below the threshold collapse to 0.0 — clear sky between cloud cells
    thr = N.new("ShaderNodeMapRange"); thr.location = (360, 0)
    thr.data_type = "FLOAT"
    thr.clamp = True
    thr.inputs["From Min"].default_value = DENSITY_THRESHOLD
    thr.inputs["From Max"].default_value = 1.0
    thr.inputs["To Min"].default_value   = 0.0
    thr.inputs["To Max"].default_value   = 1.0
    L.new(mul_alt.outputs["Value"], thr.inputs["Value"])

    # ── Volume Cube ──────────────────────────────────────────────────────────
    vc = N.new("GeometryNodeVolumeCube"); vc.location = (560, 0)
    # The Density socket is field-evaluated: noise value per voxel centre
    L.new(thr.outputs["Result"], vc.inputs["Density"])
    vc.inputs["Background"].default_value    = 0.0   # clear outside cube
    vc.inputs["Min"].default_value           = (-CLOUD_DIMS[0], -CLOUD_DIMS[1], -CLOUD_DIMS[2])
    vc.inputs["Max"].default_value           = ( CLOUD_DIMS[0],  CLOUD_DIMS[1],  CLOUD_DIMS[2])
    vc.inputs["Resolution X"].default_value  = VOXEL_RES[0]
    vc.inputs["Resolution Y"].default_value  = VOXEL_RES[1]
    vc.inputs["Resolution Z"].default_value  = VOXEL_RES[2]

    # ── Set Material ─────────────────────────────────────────────────────────
    sm = N.new("GeometryNodeSetMaterial"); sm.location = (780, 0)
    sm.inputs["Material"].default_value = mat
    L.new(vc.outputs["Volume"], sm.inputs["Geometry"])

    L.new(sm.outputs["Geometry"], g_out.inputs["Geometry"])
    return ng


def _add_cloud_object(ng: bpy.types.NodeTree) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)

    mod = obj.modifiers.new("CumulusCloud", "NODES")
    mod.node_group = ng
    return obj


def _build_iso_mesh(cloud_obj: bpy.types.Object) -> None:
    """
    Converts the volume to a mesh at ISO_THRESHOLD density.  This iso-surface
    is the only form that survives GLB export — glTF has no volume primitive.
    The mesh is a coarse approximation; use it for real-time WebXR preview,
    never for volumetric renders.
    """
    bpy.context.view_layer.objects.active = cloud_obj
    cloud_obj.select_set(True)
    bpy.ops.object.duplicate()
    iso_obj = bpy.context.active_object
    iso_obj.name = ISO_OBJ_NAME

    # Collapse GN modifier to apply voxel geometry
    bpy.ops.object.modifier_apply(modifier="CumulusCloud")

    # Convert volume to mesh at the chosen iso-value
    mod_v2m = iso_obj.modifiers.new("VolumeToMesh", "VOLUME_TO_MESH")
    mod_v2m.object          = iso_obj
    mod_v2m.threshold       = ISO_THRESHOLD
    mod_v2m.resolution_mode = "VOXEL_AMOUNT"
    mod_v2m.voxel_amount    = 40
    bpy.ops.object.modifier_apply(modifier="VolumeToMesh")

    iso_obj.location.y = 5.0   # offset so both objects are visible side-by-side


def _setup_world() -> None:
    """Light-grey sky — neutral backdrop so cloud scatter reads cleanly."""
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.70, 0.78, 0.90, 1.0)
        bg.inputs["Strength"].default_value = 1.2


# ── Entry point ───────────────────────────────────────────────────────────────
def build() -> None:
    _cleanup()

    mat = _make_volume_material()
    ng  = _make_cloud_node_group(mat)
    cloud_obj = _add_cloud_object(ng)
    _build_iso_mesh(cloud_obj)
    _setup_world()

    # Render settings for a meaningful preview
    scene = bpy.context.scene
    scene.render.engine   = "CYCLES"
    scene.cycles.samples  = 64
    scene.cycles.max_bounces = 12
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080

    print(f"[CumulusCloud] built — {VOXEL_RES[0] * VOXEL_RES[1] * VOXEL_RES[2]:,} voxels")


if __name__ == "__main__":
    build()
