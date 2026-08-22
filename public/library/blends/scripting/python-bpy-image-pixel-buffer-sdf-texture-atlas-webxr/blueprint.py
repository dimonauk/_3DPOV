"""
Python bpy.types.Image — Pixel Buffer Manipulation:
Procedural SDF Texture Atlas for WebXR

Blender 5.1 | CC0 | Holoflow Studio
https://holoflow.co.uk/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr

Technique overview
──────────────────
bpy.data.images.new() creates an Image data block whose .pixels property is a
flat RGBA float array of length width*height*4.  Direct index writes
  img.pixels[i] = v
are O(n^2): Python converts and copies the full sequence on every assignment.
Correct approach: build a plain array.array('f', ...) in Python, fill it, then
  img.foreach_set('pixels', buf)
— one C-level bulk write.  10–50x faster on a 512^2 image.

SDF (Signed Distance Field) maths give smooth, resolution-independent masks.
A filled-circle SDF:  d = sqrt((x-cx)^2+(y-cy)^2) - r
Negative d → inside; positive → outside.  smooth_step maps d → 0..1 mask.

The atlas packs four shapes into quadrants of a single 512×512 image so a
WebXR shader can sample all four masks from one texture unit — critical on
mobile GPUs where sampler counts are limited.

Artefacts produced
──────────────────
  sdf_texture_atlas.webp  — Non-Color data space, 95% WebP quality, packed
  sdf_atlas_sphere.glb    — UV sphere with atlas as Base Color + Alpha

Outside sources
───────────────
  Blender Foundation — bpy.types.Image API — CC-BY-4.0
    https://docs.blender.org/api/5.1/bpy.types.Image.html
  Inigo Quilez — 2D SDF Functions — MIT
    https://iquilezles.org/articles/distfunctions2d/
"""

import math
import array
import bpy

# ── parameters ───────────────────────────────────────────────────────────────
IMAGE_NAME   = "sdf_texture_atlas"
IMAGE_SIZE   = 512          # power-of-two keeps GPU mip-map generation trivial
FEATHER      = 24.0         # soft-edge width in pixels
EXPORT_DIR   = bpy.path.abspath("//")
ATLAS_WEBP   = EXPORT_DIR + "sdf_texture_atlas.webp"
GLB_PATH     = EXPORT_DIR + "sdf_atlas_sphere.glb"
DRACO_LEVEL  = 6
WEBP_QUALITY = 95


# ── SDF primitives ───────────────────────────────────────────────────────────

def sdf_circle(px, py, cx, cy, r):
    """Signed distance to a filled disc.  < 0 inside, > 0 outside."""
    return math.sqrt((px - cx) ** 2 + (py - cy) ** 2) - r


def sdf_ring(px, py, cx, cy, r_outer, r_inner):
    """
    Annular ring — intersection of outer disc and inner disc complement.
    max(d_outer, d_inner) is the SDF of their intersection.
    """
    dist  = math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    d_out = dist - r_outer
    d_in  = r_inner - dist    # negative outside inner disc, positive inside
    return max(d_out, d_in)


def sdf_box(px, py, cx, cy, hw, hh):
    """
    Axis-aligned box SDF (Quilez formulation).
    Component-wise clamped distance handles all 9 regions correctly,
    including exact diagonal distances at corners.
    """
    dx = abs(px - cx) - hw
    dy = abs(py - cy) - hh
    return (
        math.sqrt(max(dx, 0.0) ** 2 + max(dy, 0.0) ** 2)
        + min(max(dx, dy), 0.0)
    )


def smooth_step(d, feather):
    """
    Map SDF distance → 0..1 alpha mask.
    d < -feather/2  →  fully inside  →  1.0
    d >  feather/2  →  fully outside →  0.0
    Hermite curve (3t²-2t³) gives a C1-continuous edge, avoiding the
    hard quantisation alias from a bare clamp.
    """
    t = 0.5 - d / feather
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


# ── pixel buffer construction ─────────────────────────────────────────────────

def build_atlas_buffer(size, feather):
    """
    Build a flat array.array('f') of length size*size*4.

    Quadrant layout (UV origin bottom-left, row 0 = bottom row):
      Q1  top-right    → filled circle      (greyscale, R=G=B=mask)
      Q2  top-left     → ring / annulus     (greyscale)
      Q3  bottom-left  → rounded box        (greyscale)
      Q4  bottom-right → radial gradient    (greyscale)

    All four shapes use the same R=G=B=mask convention so the atlas reads as
    readable greyscale in the UV Editor; the WebXR shader samples .r only.
    Alpha is always 1.0 — transparency compositing is left to the shader.
    """
    half = size // 2
    # Pre-allocate; array.array is 4x smaller than a list and foreach_set
    # accepts it directly via the buffer protocol.
    buf = array.array('f', [0.0]) * (size * size * 4)

    for row in range(size):
        for col in range(size):
            idx = (row * size + col) * 4

            # Position within the quadrant in pixel space
            px = float(col % half)
            py = float(row % half)
            mid = half * 0.5          # quadrant centre

            quad_right = col >= half
            quad_top   = row >= half

            if quad_top and quad_right:      # Q1 — circle
                d = sdf_circle(px, py, mid, mid, mid * 0.72)
                v = smooth_step(d, feather)

            elif quad_top and not quad_right:  # Q2 — ring
                d = sdf_ring(px, py, mid, mid, mid * 0.72, mid * 0.38)
                v = smooth_step(d, feather)

            elif not quad_top and not quad_right:  # Q3 — box
                d = sdf_box(px, py, mid, mid, mid * 0.58, mid * 0.58)
                v = smooth_step(d, feather)

            else:                              # Q4 — radial gradient
                dist = math.sqrt((px - mid) ** 2 + (py - mid) ** 2)
                v = max(0.0, 1.0 - dist / mid)

            buf[idx]     = v
            buf[idx + 1] = v
            buf[idx + 2] = v
            buf[idx + 3] = 1.0

    return buf


# ── image creation + GPU upload ───────────────────────────────────────────────

def create_atlas_image(name, size, feather):
    """
    Create (or replace) an Image data block and bulk-write pixels.

    float_buffer=True → 32-bit float per channel (HDR).  Prevents quantisation
    on the SDF soft edges, which would produce banding at 8-bit.

    colorspace_settings.name = 'Non-Color': data textures must NOT carry sRGB
    encoding.  The 'Non-Color' space tells Blender (and the GLTF exporter) that
    these values are linear data, not colour — no gamma correction is applied
    when sampling in a shader or exporting via GLB.  Using 'sRGB' here would
    silently apply a 2.2 gamma lift, darkening the transition band and shifting
    the effective edge position.

    img.update() signals the GPU to re-upload the texture.  Without it,
    the viewport still shows the old buffer until the next redraw event.
    """
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])

    img = bpy.data.images.new(
        name,
        width=size,
        height=size,
        alpha=True,
        float_buffer=True,
    )
    img.colorspace_settings.name = "Non-Color"

    buf = build_atlas_buffer(size, feather)

    # foreach_set: single C-level copy from the array buffer.
    # img.pixels = list(buf) would work but triggers n Python→C conversions.
    img.foreach_set("pixels", buf)
    img.update()

    return img


# ── WebP export ───────────────────────────────────────────────────────────────

def save_webp(img, filepath, quality):
    """
    img.file_format and img.file_settings live on the Image object in 5.1.
    scene.render.image_settings is for F12 render output only — do not mix.
    img.save() respects the image's own format settings; img.save_render()
    applies colour management on top (use that only for beauty renders).
    """
    img.filepath_raw = filepath
    img.file_format = "WEBP"
    img.file_settings.quality = quality
    img.save()


# ── material ──────────────────────────────────────────────────────────────────

def build_material(img):
    """
    Principled BSDF with atlas as Base Color + Alpha.
    blend_method='BLEND' enables alpha transparency in EEVEE.
    The Image Texture node colour space inherits from img.colorspace_settings,
    so the Non-Color flag is already encoded in the node — no manual override.
    """
    mat_name = "SDF_Atlas_Material"
    if mat_name in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[mat_name])

    mat = bpy.data.materials.new(mat_name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex  = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.location = (-420, 0)
    bsdf.location = (-100, 0)
    out.location  = ( 240, 0)

    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    mat.blend_method = "BLEND"
    return mat


def build_sphere(mat):
    """UV sphere gives well-distributed UVs that map the atlas across the surface."""
    if "sdf_sphere" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["sdf_sphere"], do_unlink=True)

    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0, segments=32, ring_count=16, location=(0, 0, 0)
    )
    ob = bpy.context.active_object
    ob.name = "sdf_sphere"
    ob.data.name = "sdf_sphere"
    ob.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return ob


# ── GLB export ────────────────────────────────────────────────────────────────

def export_glb(ob, filepath):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_image_format="WEBP",
        export_image_quality=WEBP_QUALITY,
    )


# ── entry point ───────────────────────────────────────────────────────────────

def main():
    img = create_atlas_image(IMAGE_NAME, IMAGE_SIZE, FEATHER)
    save_webp(img, ATLAS_WEBP, WEBP_QUALITY)
    img.pack()   # embed in .blend so the file is self-contained

    mat = build_material(img)
    ob  = build_sphere(mat)
    export_glb(ob, GLB_PATH)

    print(f"[holoflow] Atlas  → {ATLAS_WEBP}")
    print(f"[holoflow] GLB    → {GLB_PATH}")
    print(f"[holoflow] Image  → {IMAGE_NAME} ({IMAGE_SIZE}² × 4ch float)")


if __name__ == "__main__":
    main()
