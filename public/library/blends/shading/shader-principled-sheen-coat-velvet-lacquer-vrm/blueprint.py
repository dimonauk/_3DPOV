"""
Shader — Principled BSDF v2: Sheen & Coat Deep-Dive
blueprint.py  ·  Blender 5.1  ·  Holoflow Studio  ·  CC0

Technique
─────────
Principled BSDF v2 added two composite layers that are almost universally
left at defaults: Sheen and Coat.  Each wraps a distinct physical model.

SHEEN — Charlier–Estevez retroreflective lobe
  The sheen peak occurs when view-to-light angle ≈ 180° (grazing backscatter),
  producing the bright-edge glow of velvet, microfibre, and woven silk.

    Sheen Weight   [0–1]  overall mix into base response
    Sheen Roughness[0–1]  lobe width — 0.0 = sharp velvet peak,
                          1.0 = broad microfibre wash / peach-fuzz
    Sheen Tint     [0–1]  0.0 = white specular edge highlight,
                          1.0 = edge tinted by Base Color

  glTF 2.0 → KHR_materials_sheen:
    sheenColorFactor     = lerp(white, BaseColor, Tint) × SheenWeight
    sheenRoughnessFactor = SheenRoughness

COAT — two-layer attenuated BSDF
  The coat lobe sits above the base and physically attenuates it via
  transmittance (higher Coat Weight → deeper, richer appearance of base layer).

    Coat Weight    [0–1]  specular strength of the coat film
    Coat Roughness [0–1]  0.0 = mirror lacquer, 1.0 = satin/semi-matte
    Coat IOR       [≥1.0] film index of refraction; 1.49 = acrylic lacquer
    Coat Normal    [vec3] separate bump for the coat surface only —
                          lets raised texture sit under a smooth glaze

  glTF 2.0 → KHR_materials_clearcoat:
    clearcoatFactor          = Coat Weight
    clearcoatRoughnessFactor = Coat Roughness
    clearcoatNormalTexture   = baked tangent normal for Coat Normal

Materials built
───────────────
  VelvetJacket_Navy  — high sheen, zero coat: dark navy pile fabric
  LacquerBelt_Black  — low sheen, high coat: patent leather / wet-look

Outside sources
───────────────
  Blender Manual — Principled BSDF (CC BY):
    https://docs.blender.org/manual/en/5.1/render/shader_nodes/shader/principled.html
  Khronos KHR_materials_sheen spec (MIT):
    https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_sheen/README.md
  Khronos KHR_materials_clearcoat spec (MIT):
    https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md
"""

import bpy
import bmesh
import math
import os

# ── Constants ──────────────────────────────────────────────────────────────
CLOTH_NAME      = "cloth_panel"
BAND_NAME       = "lacquer_band"
MAT_VELVET      = "VelvetJacket_Navy"
MAT_LACQUER     = "LacquerBelt_Black"
OUTPUT_GLB      = "//velvet_lacquer_clothing.glb"

CLOTH_SUBDIVS   = 12          # grid cuts per axis — enough for wave detail
CLOTH_WAVE_AMP  = 0.07        # cloth drape amplitude (m)
CLOTH_WAVE_FREQ = 2.4         # spatial frequency (cycles across 1 m panel)

BAND_RADIUS     = 0.38
BAND_DEPTH      = 0.12
BAND_VERTS      = 48

# Velvet — dark navy pile fabric
VLV_BASE    = (0.038, 0.052, 0.175, 1.0)
VLV_ROUGH   = 0.74    # pile fibres scatter light broadly
VLV_SHEEN_W = 0.93    # strong retroreflective edge
VLV_SHEEN_R = 0.21    # narrow peak ≈ true velvet (not microfibre)
VLV_SHEEN_T = 0.36    # 36 % tinted — edges lean slightly blue, not pure white

# Lacquer — patent leather / wet-look coat over near-black base
LCQ_BASE    = (0.020, 0.016, 0.014, 1.0)
LCQ_ROUGH   = 0.67    # underlying leather diffuse roughness
LCQ_SHEEN_W = 0.11    # faint suede bloom beneath the coat
LCQ_SHEEN_R = 0.80    # wide, soft — not a sharp velvet peak
LCQ_COAT_W  = 0.87    # strong lacquer coat
LCQ_COAT_R  = 0.04    # near-mirror glossy film
LCQ_COAT_I  = 1.49    # acrylic lacquer IOR (typical: 1.47–1.52)


# ── Helpers ────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(blk):
            blk.remove(item)


def set_sock(node: bpy.types.Node, name: str, val) -> None:
    """Set a shader socket default_value; handles colour tuples correctly."""
    inp = node.inputs[name]
    dv  = inp.default_value
    if hasattr(dv, "__len__"):          # colour or vector
        for i, v in enumerate(val):
            dv[i] = v
    else:
        inp.default_value = val


def new_pbsdf(mat: bpy.types.Material) -> bpy.types.Node:
    """Return a fresh Principled BSDF wired to Output inside mat."""
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (420, 0)
    pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    pbsdf.location = (0, 0)
    nt.links.new(pbsdf.outputs["BSDF"], out.inputs["Surface"])
    return pbsdf


# ── Material builders ──────────────────────────────────────────────────────
def make_velvet_material() -> bpy.types.Material:
    mat  = bpy.data.materials.new(MAT_VELVET)
    bsdf = new_pbsdf(mat)

    set_sock(bsdf, "Base Color",      VLV_BASE)
    set_sock(bsdf, "Metallic",        0.0)
    set_sock(bsdf, "Roughness",       VLV_ROUGH)
    # Sheen layer — velvet retroreflection
    set_sock(bsdf, "Sheen Weight",    VLV_SHEEN_W)
    set_sock(bsdf, "Sheen Roughness", VLV_SHEEN_R)
    set_sock(bsdf, "Sheen Tint",      VLV_SHEEN_T)
    # No coat on fabric
    set_sock(bsdf, "Coat Weight",     0.0)
    return mat


def make_lacquer_material() -> bpy.types.Material:
    mat  = bpy.data.materials.new(MAT_LACQUER)
    bsdf = new_pbsdf(mat)

    set_sock(bsdf, "Base Color",      LCQ_BASE)
    set_sock(bsdf, "Metallic",        0.0)
    set_sock(bsdf, "Roughness",       LCQ_ROUGH)
    # Faint suede bloom shows through the coat at sharp angles
    set_sock(bsdf, "Sheen Weight",    LCQ_SHEEN_W)
    set_sock(bsdf, "Sheen Roughness", LCQ_SHEEN_R)
    set_sock(bsdf, "Sheen Tint",      0.55)
    # Strong lacquer coat — acrylic IOR, near-mirror
    set_sock(bsdf, "Coat Weight",     LCQ_COAT_W)
    set_sock(bsdf, "Coat Roughness",  LCQ_COAT_R)
    set_sock(bsdf, "Coat IOR",        LCQ_COAT_I)
    return mat


# ── Mesh builders ──────────────────────────────────────────────────────────
def make_cloth_panel() -> bpy.types.Object:
    """Subdivided plane with gentle sinusoidal drape to expose sheen at grazing angles."""
    mesh = bpy.data.meshes.new(CLOTH_NAME)
    obj  = bpy.data.objects.new(CLOTH_NAME, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments=CLOTH_SUBDIVS,
        y_segments=CLOTH_SUBDIVS,
        size=1.0,
    )
    # Drape: z = A * sin(fx * π * x) * cos(fy * π * y)
    for v in bm.verts:
        v.co.z = (
            CLOTH_WAVE_AMP
            * math.sin(v.co.x * math.pi * CLOTH_WAVE_FREQ)
            * math.cos(v.co.y * math.pi * CLOTH_WAVE_FREQ)
        )
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    mesh.calc_normals_split()
    obj.location = (-1.5, 0.0, 0.0)
    return obj


def make_lacquer_band() -> bpy.types.Object:
    """Cylinder arc — curved surface shows coat reflection clearly."""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=BAND_RADIUS,
        depth=BAND_DEPTH,
        vertices=BAND_VERTS,
        location=(1.5, 0.0, 0.0),
    )
    band = bpy.context.active_object
    band.name  = BAND_NAME
    band.scale = (1.0, 0.3, 1.0)       # squash to belt-strap proportions
    bpy.ops.object.transform_apply(scale=True)
    return band


# ── Lighting ───────────────────────────────────────────────────────────────
def add_lighting() -> None:
    # Key light — angled to graze cloth panel and trigger sheen bloom
    bpy.ops.object.light_add(type="AREA", location=(3.0, -2.0, 2.5))
    key = bpy.context.active_object
    key.data.energy    = 600.0
    key.data.size      = 0.6
    key.rotation_euler = (math.radians(55), 0.0, math.radians(35))
    # Rim light — backscatter angle for velvet retroreflection
    bpy.ops.object.light_add(type="SPOT", location=(-2.5, 1.5, 1.0))
    rim = bpy.context.active_object
    rim.data.energy        = 350.0
    rim.data.spot_size     = math.radians(38)
    rim.data.spot_blend    = 0.25
    rim.rotation_euler     = (math.radians(80), 0.0, math.radians(-120))
    # Camera
    bpy.ops.object.camera_add(location=(0.0, -3.8, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler        = (math.radians(72), 0.0, 0.0)
    bpy.context.scene.camera  = cam


# ── Export ─────────────────────────────────────────────────────────────────
def export_glb() -> None:
    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type == "MESH")
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_apply=True,
        export_yup=True,
    )
    print(f"[holoflow] GLB written → {bpy.path.abspath(OUTPUT_GLB)}")


# ── Main ───────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    velvet  = make_velvet_material()
    lacquer = make_lacquer_material()

    cloth = make_cloth_panel()
    cloth.data.materials.append(velvet)

    band = make_lacquer_band()
    band.data.materials.append(lacquer)

    add_lighting()
    export_glb()
    print("[holoflow] blueprint complete — open EEVEE Next to see sheen bloom")


main()
