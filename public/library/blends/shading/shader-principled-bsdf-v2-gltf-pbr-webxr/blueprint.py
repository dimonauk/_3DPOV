"""
Principled BSDF v2 — full parameter map to glTF 2.0 PBR for WebXR.
blueprint.py  ·  Blender 5.1  ·  Holoflow Studio  ·  CC0

Technique overview
──────────────────
Blender 4.0 redesigned the Principled BSDF into v2: the old single
"Clearcoat" weight became a dedicated Coat layer; "Sheen" became a
weighted layer; Subsurface merged cleanly into the base; Emission
gained a separate Strength socket; and "Specular" was renamed to
"Specular IOR Level" to clarify it controls Fresnel intensity, not
a flat specular multiplier.

In Blender 5.x the node API stabilised. This blueprint sets every
socket explicitly so developers can see which ones survive the GLB
export and which are silently dropped.

glTF 2.0 export mapping (Blender glTF I/O, Apache-2.0):
──────────────────────────────────────────────────────────
  BSDF socket              → glTF property / extension
  ─────────────────────────────────────────────────────
  Base Color               → pbrMetallicRoughness.baseColorFactor
  Metallic                 → pbrMetallicRoughness.metallicFactor
  Roughness                → pbrMetallicRoughness.roughnessFactor
  IOR                      → KHR_materials_ior.ior
  Alpha                    → material.alphaMode / alphaCutoff
  Emission Color+Strength  → emissiveFactor + KHR_materials_emissive_strength
  Specular IOR Level       → KHR_materials_specular.specularFactor (approx)
  Coat Weight              → KHR_materials_clearcoat.clearcoatFactor
  Coat Roughness           → KHR_materials_clearcoat.clearcoatRoughnessFactor
  Sheen Weight+Tint        → KHR_materials_sheen.sheenColorFactor
  Transmission Weight      → KHR_materials_transmission.transmissionFactor
  Subsurface *             → NOT exported (zero WebXR equivalent)
  Anisotropic              → KHR_materials_anisotropy.anisotropyStrength (5.x)

  * Subsurface bake: render a diffuse pass with SSS on, bake to texture,
    use that as the Base Color texture in the GLB instead.

Prop: a faceted sci-fi panel shard — asymmetric twisted hexagonal prism.
"""

import bpy
import bmesh
import math
import os

# ── Constants ────────────────────────────────────────────────────────────────
PROP_NAME           = "hs_control_shard"
MAT_NAME            = "hs_pbr_v2_mat"
OUTPUT_GLB          = "//hs_control_shard.glb"

# Base layer — dark blue-grey hard-surface plastic
BASE_COLOR          = (0.10, 0.14, 0.28, 1.0)
METALLIC            = 0.82
ROUGHNESS           = 0.26
IOR                 = 1.45                      # generic hard plastic
ALPHA               = 1.0

# Specular IOR Level — controls off-specular Fresnel brightness
# Maps to KHR_materials_specular.specularFactor in the exporter.
# 0.5 = "standard" (white reflections); 0.0 = dark-edge cel-shade trick.
SPECULAR_IOR_LEVEL  = 0.5

# Coat layer (was "Clearcoat" in PBSDF v1)
# Maps to KHR_materials_clearcoat in the GLB.
COAT_WEIGHT         = 0.65
COAT_ROUGHNESS      = 0.10
COAT_IOR            = 1.50

# Sheen layer — fabric/velvet edge sheen
# Maps to KHR_materials_sheen.sheenColorFactor in the GLB.
SHEEN_WEIGHT        = 0.18
SHEEN_ROUGHNESS     = 0.50
SHEEN_TINT          = (0.55, 0.35, 0.92, 1.0)  # lilac for cel-shade edge

# Emission — maps to emissiveFactor + KHR_materials_emissive_strength
EMISSION_COLOR      = (0.25, 0.55, 1.00, 1.0)  # blue glow
EMISSION_STRENGTH   = 0.35

# Transmission — fully opaque prop; 0 so KHR_materials_transmission is omitted
TRANSMISSION_WEIGHT = 0.0

# Shard geometry
SHARD_DIMS = (0.38, 0.07, 0.58)                # W × D × H metres


# ── Scene reset ──────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials,
                bpy.data.cameras, bpy.data.lights):
        for item in list(blk):
            blk.remove(item, do_unlink=True)


# ── Geometry ─────────────────────────────────────────────────────────────────
def build_shard() -> bpy.types.Object:
    """
    Asymmetric twisted hexagonal prism.  Irregular radii on both top
    and bottom rings produce the organic shard silhouette without
    sculpting.  Flat-shaded per Holoflow faceted convention.
    """
    mesh = bpy.data.meshes.new(PROP_NAME)
    obj  = bpy.data.objects.new(PROP_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bm = bmesh.new()

    w, d, h = SHARD_DIMS

    def hex_ring(z: float, scale: float, twist_deg: float) -> list:
        verts = []
        twist = math.radians(twist_deg)
        for i in range(6):
            angle = math.radians(i * 60 + 30) + twist
            r = w * 0.5 * scale * (1.0 + 0.14 * math.sin(i * 1.9))
            verts.append(bm.verts.new((math.cos(angle) * r,
                                       math.sin(angle) * r * (d / w),
                                       z)))
        return verts

    bot = hex_ring(0.0, 1.00, 0.0)
    top = hex_ring(h,   0.62, 18.0)

    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new([bot[i], bot[j], top[j], top[i]])

    bm.faces.new(bot)
    bm.faces.new(list(reversed(top)))
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = False

    return obj


# ── Material ─────────────────────────────────────────────────────────────────
def build_pbr_v2_material() -> bpy.types.Material:
    """
    Sets all Principled BSDF v2 sockets explicitly.
    Inline comments state the glTF destination for each socket.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    out   = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)

    pb = nodes.new("ShaderNodeBsdfPrincipled")
    pb.location = (0, 0)

    # ── Base layer ────────────────────────────────────────────────
    pb.inputs["Base Color"].default_value        = BASE_COLOR
    pb.inputs["Metallic"].default_value          = METALLIC
    pb.inputs["Roughness"].default_value         = ROUGHNESS
    pb.inputs["IOR"].default_value               = IOR          # → KHR_materials_ior
    pb.inputs["Alpha"].default_value             = ALPHA        # → alphaMode OPAQUE

    # ── Specular ──────────────────────────────────────────────────
    pb.inputs["Specular IOR Level"].default_value = SPECULAR_IOR_LEVEL  # → KHR_materials_specular

    # ── Coat (was Clearcoat) ──────────────────────────────────────
    pb.inputs["Coat Weight"].default_value       = COAT_WEIGHT     # → KHR_materials_clearcoat
    pb.inputs["Coat Roughness"].default_value    = COAT_ROUGHNESS
    pb.inputs["Coat IOR"].default_value          = COAT_IOR

    # ── Sheen ─────────────────────────────────────────────────────
    pb.inputs["Sheen Weight"].default_value      = SHEEN_WEIGHT    # → KHR_materials_sheen
    pb.inputs["Sheen Roughness"].default_value   = SHEEN_ROUGHNESS
    pb.inputs["Sheen Tint"].default_value        = SHEEN_TINT

    # ── Emission ──────────────────────────────────────────────────
    pb.inputs["Emission Color"].default_value    = EMISSION_COLOR
    pb.inputs["Emission Strength"].default_value = EMISSION_STRENGTH   # → KHR_materials_emissive_strength

    # ── Transmission ──────────────────────────────────────────────
    pb.inputs["Transmission Weight"].default_value = TRANSMISSION_WEIGHT  # → KHR_materials_transmission (0 = omitted)

    # Subsurface intentionally left at 0 — no glTF equivalent; bake to
    # base colour texture instead.

    mat.node_tree.links.new(pb.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── Camera + light ───────────────────────────────────────────────────────────
def add_camera_and_light() -> None:
    cam_data = bpy.data.cameras.new("hs_cam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("hs_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location       = (0.8, -1.0, 0.55)
    cam_obj.rotation_euler = (math.radians(72), 0, math.radians(38))
    bpy.context.scene.camera = cam_obj

    sun = bpy.data.lights.new("key_sun", "SUN")
    sun.energy = 4.5
    sun_obj = bpy.data.objects.new("key_sun", sun)
    bpy.context.scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(48), math.radians(-18), math.radians(32))


# ── GLB export ───────────────────────────────────────────────────────────────
def export_glb() -> None:
    """
    Holoflow WebXR export conventions:
      +Y up, transforms applied, Draco 6, WebP textures.
    All KHR_materials_* extensions are written automatically by the
    Blender glTF I/O exporter when the corresponding BSDF sockets
    contain non-zero values.
    """
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_materials="EXPORT",
        export_animations=False,
    )
    print(f"[blueprint] GLB → {OUTPUT_GLB}")


# ── Entry point ──────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()
    obj = build_shard()
    mat = build_pbr_v2_material()
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    add_camera_and_light()

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(scale=True, location=False, rotation=False)

    export_glb()


if __name__ == "__main__":
    main()
