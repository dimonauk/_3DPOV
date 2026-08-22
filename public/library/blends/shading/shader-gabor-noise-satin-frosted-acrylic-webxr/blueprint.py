"""
Gabor Noise Texture — Satin Frosted Acrylic Panel for WebXR
Blender 5.1 | CC0 | Holoflow Studio

Gabor Texture (ShaderNodeTexGabor, added in Blender 4.1) is a frequency-space
noise function.  Unlike Musgrave or Noise Texture, which blend random amplitude
values, Gabor uses a bank of oriented sinusoidal kernels — producing the
directional striations found on satin fabric, spun acrylic, frosted glass, and
geological bedding planes.

Key outputs:
  Value       — real part of the convolution sum, range ≈ –1 … +1
  Phase Offset — derivative field of the kernel; maps directly into a Bump node
                 as a height proxy without a separate Normal Map bake.

This blueprint builds a milky PMMA acrylic wall tile in two shader layers:
  Layer A (Roughness) — Stochastic Gabor at 600 Hz drives roughness 0.04→0.38,
    creating alternating specular hair-lines on the satin surface.
  Layer B (Bump)      — same field at 22.5° orientation; Phase Offset → Bump
    node at strength 0.35 gives tactile striae without a second UV map.
  PBR path — Principled BSDF, Transmission 0.78, IOR 1.49, ready for GLB.
  Bake path — Roughness and Normal baked to 1024×1024 WebP for WebXR runtime.

WHY Stochastic vs coherent Gabor?
  GABOR_STOCHASTIC places kernels at random Poisson positions — result looks
  like spun or brushed glass: consistent average density, no periodicity.
  GABOR (coherent) repeats the kernel grid — a precise grating for holographic
  foil or CD surfaces.  This tutorial uses Stochastic.

WHY 600 Hz?
  At 1 m UV scale, 600 Hz ≈ 600 striae per metre, matching real spun-acrylic
  stock (300–800 µm fibre spacing).  Below 200 Hz the pattern reads as velvet;
  above 1000 Hz it disappears at 1080p export resolution.

WHY 22.5° orientation?
  Axis-aligned Gabor (0° / 90°) creates Moiré with the screen pixel grid at
  export.  22.5° breaks that alignment — the classic half-angle used in
  halftone rosette printing.
"""

import math
import bpy
import bmesh

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
SLUG            = "gabor_frosted_acrylic"
PANEL_W         = 0.24       # metres — wall panel width
PANEL_H         = 0.16       # metres — wall panel height
PANEL_D         = 0.004      # metres — panel depth (4 mm acrylic stock)
GABOR_SCALE     = 2.0        # UV-space scale of the noise field
GABOR_FREQ      = 600.0      # kernel frequency (striae per metre at scale 1)
GABOR_ANISO     = 0.88       # 0 = isotropic blob, 1 = perfect directional stripes
GABOR_ORIENT    = math.radians(22.5)   # break pixel-grid Moiré
ROUGHNESS_MIN   = 0.04       # polished zones — tight specular halo
ROUGHNESS_MAX   = 0.38       # satin zones — broad diffuse spread
IOR             = 1.49       # PMMA acrylic at room temperature
TRANSMISSION    = 0.78       # partial — milky diffusion, not clear glass
BASE_COLOR      = (0.88, 0.94, 0.97, 1.0)  # slightly blue-tinted clear acrylic
BUMP_STRENGTH   = 0.35
BAKE_RESOLUTION = 1024
BAKE_MARGIN     = 4
MAT_NAME        = f"{SLUG}_mat"
OBJ_NAME        = SLUG


# ── SCENE SETUP ───────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for d in list(bpy.data.meshes) + list(bpy.data.materials):
        d.user_clear()
        d.use_fake_user = False
        bpy.data.batch_remove([d])


# ── GEOMETRY ──────────────────────────────────────────────────────────────────
def build_panel() -> bpy.types.Object:
    """Thin box UV-unwrapped for a single front-face island."""
    mesh = bpy.data.meshes.new(OBJ_NAME)
    bm   = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    obj.scale = (PANEL_W / 2, PANEL_D / 2, PANEL_H / 2)

    # Apply scale so UV density is predictable.
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(scale=True)

    # Smart UV project — adequate for a flat panel; adjust seams for hero assets.
    bpy.ops.object.editmode_toggle()
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
    bpy.ops.object.editmode_toggle()
    return obj


# ── MATERIAL ──────────────────────────────────────────────────────────────────
def build_gabor_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    def N(t, **kw):
        n = nt.nodes.new(type=t)
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    def link(a, b):
        nt.links.new(a, b)

    # Coordinates — Object space keeps UV stable under object transforms.
    tex_coord  = N("ShaderNodeTexCoord")
    mapping    = N("ShaderNodeMapping",
                   vector_type="OBJECT")
    mapping.inputs["Scale"].default_value = (GABOR_SCALE,) * 3
    link(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    # ── Gabor A: Roughness channel ─────────────────────────────────────────
    # ShaderNodeTexGabor was added in Blender 4.1.
    # gabor_type: 'GABOR_STOCHASTIC' (random-phase) or 'GABOR' (coherent).
    gabor_r = N("ShaderNodeTexGabor")
    gabor_r.gabor_type       = "GABOR_STOCHASTIC"
    gabor_r.inputs["Scale"].default_value       = GABOR_SCALE
    gabor_r.inputs["Frequency"].default_value   = GABOR_FREQ
    gabor_r.inputs["Anisotropy"].default_value  = GABOR_ANISO
    gabor_r.inputs["Orientation"].default_value = GABOR_ORIENT
    link(mapping.outputs["Vector"], gabor_r.inputs["Vector"])

    # Value output is signed (–1 … +1).  Absolute → Map Range maps it to 0→1
    # so the Color Ramp receives a clean 0–1 grey input.
    abs_node   = N("ShaderNodeMath", operation="ABSOLUTE")
    link(gabor_r.outputs["Value"], abs_node.inputs[0])

    ramp_rough = N("ShaderNodeValToRGB")
    ramp_rough.color_ramp.interpolation = "LINEAR"
    ramp_rough.color_ramp.elements[0].position = 0.0
    ramp_rough.color_ramp.elements[0].color    = (ROUGHNESS_MIN,) * 4
    ramp_rough.color_ramp.elements[1].position = 1.0
    ramp_rough.color_ramp.elements[1].color    = (ROUGHNESS_MAX,) * 4
    link(abs_node.outputs["Value"], ramp_rough.inputs["Fac"])

    # ── Gabor B: Bump channel ──────────────────────────────────────────────
    # Second instance at 22.5° — Phase Offset as bump height.
    # WHY Phase Offset?  It is the instantaneous frequency derivative of the
    # Gabor kernel sum — mathematically equivalent to the height map from which
    # Value was derived.  Feeding it straight into Bump avoids a normal-bake
    # round-trip for the Cycles preview.
    gabor_b = N("ShaderNodeTexGabor")
    gabor_b.gabor_type       = "GABOR_STOCHASTIC"
    gabor_b.inputs["Scale"].default_value       = GABOR_SCALE
    gabor_b.inputs["Frequency"].default_value   = GABOR_FREQ
    gabor_b.inputs["Anisotropy"].default_value  = GABOR_ANISO
    gabor_b.inputs["Orientation"].default_value = GABOR_ORIENT
    link(mapping.outputs["Vector"], gabor_b.inputs["Vector"])

    bump = N("ShaderNodeBump")
    bump.inputs["Strength"].default_value = BUMP_STRENGTH
    bump.inputs["Distance"].default_value = 0.004   # panel depth = bump scale
    link(gabor_b.outputs["Phase Offset"], bump.inputs["Height"])

    # ── Principled BSDF ────────────────────────────────────────────────────
    # Transmission + IOR replicates milky acrylic in both Cycles and Eevee Next.
    # In Blender 5.1 the Principled BSDF uses IOR rather than the old
    # Refraction Index socket — set via inputs["IOR"].
    bsdf = N("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value        = BASE_COLOR
    bsdf.inputs["Metallic"].default_value          = 0.0
    bsdf.inputs["Transmission Weight"].default_value = TRANSMISSION
    bsdf.inputs["IOR"].default_value               = IOR
    link(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])
    link(bump.outputs["Normal"],      bsdf.inputs["Normal"])

    out = N("ShaderNodeOutputMaterial")
    link(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # Arrange left-to-right for readability (x increases left→right).
    for i, node in enumerate([tex_coord, mapping, gabor_r, abs_node,
                               ramp_rough, gabor_b, bump, bsdf, out]):
        node.location = (i * 220 - 880, 0)
    gabor_b.location = (2 * 220 - 880, -260)
    bump.location     = (4 * 220 - 880, -260)
    return mat


# ── BAKE ──────────────────────────────────────────────────────────────────────
def bake_to_webp(obj: bpy.types.Object,
                 mat: bpy.types.Material) -> None:
    """
    Bake Roughness and Normal into 1024 WebP textures for WebXR runtime.
    In Blender 5.1 bpy.ops.object.bake() is used directly; the bake target
    image must be the ACTIVE image node in the material node tree.
    """
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32   # low for bake — noise averages out per texel

    nt = mat.node_tree

    for bake_pass, img_name in [
        ("ROUGHNESS", f"{SLUG}_rough"),
        ("NORMAL",    f"{SLUG}_normal"),
    ]:
        img = bpy.data.images.new(
            img_name, width=BAKE_RESOLUTION, height=BAKE_RESOLUTION,
            alpha=False, float_buffer=(bake_pass == "NORMAL"),
        )
        img.colorspace_settings.name = (
            "Non-Color" if bake_pass == "ROUGHNESS" else "Non-Color"
        )

        img_node = nt.nodes.new("ShaderNodeTexImage")
        img_node.image = img
        # Make it the ACTIVE node so Blender knows where to bake into.
        nt.nodes.active = img_node

        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        bpy.ops.object.bake(
            type=bake_pass,
            margin=BAKE_MARGIN,
            use_clear=True,
        )

        out_path = (
            f"//../../videos/shading/shader-gabor-noise-satin-frosted-acrylic-webxr/"
            f"{img_name}.webp"
        )
        img.filepath_raw = out_path
        img.file_format  = "WEBP"
        img.save()

        nt.nodes.remove(img_node)


# ── EXPORT ────────────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath="//gabor_frosted_acrylic.glb",
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_apply=True,
    )


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()
    obj = build_panel()
    mat = build_gabor_material()
    obj.data.materials.append(mat)
    bake_to_webp(obj, mat)
    export_glb(obj)
    print(f"[holoflow] {SLUG} complete.")


if __name__ == "__main__":
    main()
