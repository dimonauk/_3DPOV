"""
Python gpu.types.GPUOffScreen — Offscreen Render-to-Texture
Blender 5.1 | CC0 | Holoflow Studio

TECHNIQUE
---------
Blender's GPU Python module (stable from 4.0, replacing the deprecated bgl
OpenGL wrapper) exposes a headless render path via gpu.types.GPUOffScreen.
An offscreen target is an OpenGL framebuffer backed by a colour attachment
and, optionally, a depth attachment. You bind it, draw geometry using any
GPUShader, then read the colour attachment back into a bpy.types.Image.

The result is a GPU-generated data texture: a world-space normal map, a
position map, an AO mask, or any custom data field you encode into RGBA
channels. No Cycles render required — generation takes ~1 ms on any
modern GPU versus several seconds for an equivalent Cycles bake.

WHY this matters for WebXR
--------------------------
Three.js TSL shaders can sample arbitrary data textures (normal maps,
position offsets, curvature fields) at runtime. Pre-baking those fields
into a WebP in Blender and embedding them in the GLB is far cheaper than
computing them on the GPU each frame in the browser. This blueprint
demonstrates the full pipeline: author a custom GLSL shader in Python,
render the mesh into a 512×512 offscreen buffer, and write the result to
an image file alongside the GLB export.

OUTSIDE SOURCES
---------------
Blender Foundation — bpy.types.GPUOffScreen API reference
  URL: https://docs.blender.org/api/5.1/gpu.types.html#gpu.types.GPUOffScreen
  Licence: CC-BY-SA 4.0

Blender Foundation — gpu.types module overview
  URL: https://docs.blender.org/api/5.1/gpu.types.html
  Licence: CC-BY-SA 4.0

FAILURE MODES
-------------
• GPUOffScreen raises RuntimeError if width/height are not positive ints.
• Drawing outside an offscreen.bind() context silently has no effect —
  no error, just a black output. Always wrap draw calls in the with block.
• offscreen.texture_color returns a GPUTexture, not pixel data.
  Reading pixels requires a GPUFrameBuffer.read() call (see step 5).
• Non-uniform object scale breaks normal reconstruction.
  Apply transforms (Ctrl+A) before baking.
"""

import bpy
import gpu
import mathutils
import numpy as np
import os

from gpu_extras.batch import batch_for_shader

# ============================================================
# PARAMETERS
# ============================================================
SLUG        = 'python-gpu-offscreen-render-to-texture-webxr'
TOPIC       = 'scripting'
BAKE_W      = 512          # offscreen buffer width  (power of 2 recommended)
BAKE_H      = 512          # offscreen buffer height
NEAR        = 0.01         # projection near plane
FAR         = 100.0        # projection far plane
CAMERA_DIST = 2.0          # camera pull-back from world origin


# ============================================================
# SCENE SETUP — icosphere with a flat-shade faceted look
# ============================================================
def build_scene() -> bpy.types.Object:
    """
    Build a flat-shaded ico-sphere as the subject.
    apply_transforms() is mandatory before the offscreen bake:
    non-identity matrix_world means the normal-space calculation
    needs the inverse-transpose of the 3×3 sub-matrix; applying first
    keeps the shader simpler and avoids a subtle precision error when
    the object has non-uniform scale.
    """
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=1,
        radius=0.8,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = 'bake_subject'

    # Flat shading — each face gets its own geometric normal.
    # WHY flat shade for a data-texture bake?
    #   World-space normals from a smooth-shaded mesh encode interpolated
    #   normals, not the true face plane vectors.  For a faceted gem or
    #   low-poly prop the face-plane normals are the signal you want.
    bpy.ops.object.shade_flat()

    # Apply scale/rotation so matrix_world is identity after this call.
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj


# ============================================================
# CUSTOM GLSL VERTEX + FRAGMENT SHADER
# ============================================================
# Encodes world-space normals as RGB: X→R, Y→G, Z→B, remapped [−1,1]→[0,1].
# Alpha channel carries a linear depth value (0 = near, 1 = far) useful
# for parallax/silhouette effects in Three.js TSL.
_VERT_SRC = """
uniform mat4 viewProjectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;   /* inverse-transpose of 3x3 model sub-matrix */

in vec3 pos;
in vec3 nor;

out vec3 vNormal;    /* world-space normal, unit length */
out float vDepth;    /* NDC depth [0,1] for the alpha channel */

void main() {
    vec4 worldPos   = modelMatrix * vec4(pos, 1.0);
    gl_Position     = viewProjectionMatrix * worldPos;
    vNormal         = normalize(normalMatrix * nor);
    /* remap NDC z from [-1,1] to [0,1] */
    vDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
}
"""

_FRAG_SRC = """
in vec3 vNormal;
in float vDepth;

out vec4 fragColor;

void main() {
    /* remap [-1,1] → [0,1] for unsigned texture storage */
    vec3 n = vNormal * 0.5 + 0.5;
    fragColor = vec4(n, vDepth);
}
"""


def _compile_shader() -> gpu.types.GPUShader:
    """
    Compile the custom GLSL shader.
    gpu.types.GPUShader(vert_src, frag_src) compiles on first call.
    Compilation errors surface as RuntimeError with the GLSL log — check
    the Blender console (Window → Toggle System Console) for the message.
    """
    return gpu.types.GPUShader(_VERT_SRC, _FRAG_SRC)


# ============================================================
# BUILD VERTEX + INDEX BUFFERS FROM A MESH
# ============================================================
def _mesh_to_buffers(obj: bpy.types.Object):
    """
    Extract per-loop position and normal data from the evaluated mesh.

    WHY per-loop, not per-vertex?
    For a flat-shaded mesh every loop belonging to the same face shares
    the same geometric normal, but different faces that share a vertex
    have different normals at that vertex.  Indexing by loop (one entry
    per corner of each polygon) avoids normal discontinuities at shared
    edges — which is precisely the seam a world-space normal map must NOT
    smooth over for a faceted aesthetic.
    """
    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    mesh     = eval_obj.to_mesh()
    mesh.calc_normals_split()   # populate loop normals

    positions = []
    normals   = []
    indices   = []

    for poly in mesh.polygons:
        # A polygon is already a fan of (fan_count = len - 2) triangles.
        # We collect loop positions/normals and build the triangle fan.
        verts_local = []
        nors_local  = []
        for li in poly.loop_indices:
            loop = mesh.loops[li]
            verts_local.append(mesh.vertices[loop.vertex_index].co.copy())
            nors_local.append(loop.normal.copy())

        base = len(positions)
        positions.extend(verts_local)
        normals.extend(nors_local)
        # Fan triangulation: (0,1,2), (0,2,3), … for convex n-gon
        for k in range(len(verts_local) - 2):
            indices.append((base, base + k + 1, base + k + 2))

    eval_obj.to_mesh_clear()

    pos_flat = [c for v in positions for c in v]
    nor_flat = [c for n in normals  for c in n]
    idx_flat = [i for tri in indices for i in tri]
    return pos_flat, nor_flat, idx_flat


# ============================================================
# OFFSCREEN RENDER — core function
# ============================================================
def bake_normal_map(
    obj:    bpy.types.Object,
    shader: gpu.types.GPUShader,
    width:  int = BAKE_W,
    height: int = BAKE_H,
) -> list[float]:
    """
    Render world-space normals + depth into an offscreen buffer and
    return the raw RGBA pixel list (length = width * height * 4).

    Camera setup
    ------------
    We position an orthographic projection looking straight down −Z at the
    object.  An orthographic view ensures every texel receives exactly one
    ray (no perspective foreshortening) — the correct condition for a bake.
    WHY not use Blender's camera here?  The offscreen path is fully
    GPU-side; there is no scene-level camera or render pipeline involved.
    We build the view and projection matrices by hand using mathutils.

    Buffer read-back
    ----------------
    offscreen.texture_color returns a GPUTexture.  To read pixels back to
    CPU we must create a temporary GPUFrameBuffer, bind it, and call
    gpu.state.active_framebuffer_get().read_color().
    """
    # ── Build geometry ────────────────────────────────────────────────────
    pos_flat, nor_flat, idx_flat = _mesh_to_buffers(obj)

    fmt = gpu.types.GPUVertFormat()
    fmt.attr_add(id='pos', comp_type='F32', len=3, fetch_mode='FLOAT')
    fmt.attr_add(id='nor', comp_type='F32', len=3, fetch_mode='FLOAT')

    vbuf = gpu.types.GPUVertBuf(len=len(pos_flat) // 3, format=fmt)
    vbuf.attr_fill(id='pos', data=pos_flat)
    vbuf.attr_fill(id='nor', data=nor_flat)

    ibuf  = gpu.types.GPUIndexBuf(type='TRIS', seq=idx_flat)
    batch = gpu.types.GPUBatch(type='TRIS', buf=vbuf, elem=ibuf)
    batch.program_set(shader)

    # ── Matrices ──────────────────────────────────────────────────────────
    # View: camera at (0, 0, CAMERA_DIST) looking toward −Z.
    cam_loc  = mathutils.Vector((0.0, 0.0, CAMERA_DIST))
    cam_fwd  = mathutils.Vector((0.0, 0.0, -1.0))
    cam_up   = mathutils.Vector((0.0, 1.0, 0.0))
    view_mat = mathutils.Matrix.look_at(cam_loc, cam_loc + cam_fwd, cam_up)

    # Orthographic projection: [-1, 1] in both X and Y mapped to the NDC cube.
    ortho_size = 1.0
    proj_mat   = mathutils.Matrix.OrthoProjection(
        'XY',
        4,
    )
    # Build a manual ortho projection for full control:
    # col-major format expected by Blender's GPU module.
    l, r, b, t = -ortho_size, ortho_size, -ortho_size, ortho_size
    near, far  = NEAR, FAR
    proj_mat = mathutils.Matrix([
        [2/(r-l),   0,       0,          -(r+l)/(r-l)],
        [0,         2/(t-b), 0,          -(t+b)/(t-b)],
        [0,         0,      -2/(far-near),-(far+near)/(far-near)],
        [0,         0,       0,           1           ],
    ])

    vp_mat    = proj_mat @ view_mat
    model_mat = obj.matrix_world
    # Normal matrix: inverse-transpose of the 3×3 model sub-matrix.
    nor_mat   = model_mat.to_3x3().inverted().transposed()

    # ── Offscreen render ──────────────────────────────────────────────────
    offscreen = gpu.types.GPUOffScreen(width, height)

    with offscreen.bind():
        fb = gpu.state.active_framebuffer_get()
        fb.clear(color=(0.0, 0.0, 0.0, 0.0), depth=1.0)

        gpu.state.depth_test_set('LESS_EQUAL')
        gpu.state.depth_mask_set(True)
        gpu.state.blend_set('NONE')

        shader.bind()
        shader.uniform_float('viewProjectionMatrix', vp_mat)
        shader.uniform_float('modelMatrix',          model_mat)
        shader.uniform_float('normalMatrix',         nor_mat)

        batch.draw(shader)

        # Read RGBA pixels from the currently-bound framebuffer.
        # buffer type 'FLOAT' returns float32 in [0,1].
        buf = fb.read_color(0, 0, width, height, 4, 0, 'FLOAT')

    offscreen.free()   # release GPU memory immediately — good hygiene
    return list(buf)


# ============================================================
# WRITE TO bpy.types.Image AND EXPORT AS WebP
# ============================================================
def save_as_webp(pixels: list[float], width: int, height: int,
                 out_dir: str, name: str) -> str:
    """
    Store the pixel list in a new bpy.types.Image and export as WebP.

    WHY use bpy.types.Image rather than a raw file write?
    bpy.data.images.new() manages the image lifetime within the current
    .blend session.  save_render() uses Blender's image-codec pipeline
    (libjpeg-xl, libwebp) with proper colour-management and bit-depth
    conversion — more reliable than writing raw bytes via struct.pack.
    """
    img = bpy.data.images.new(
        name=name,
        width=width,
        height=height,
        alpha=True,
        float_buffer=True,   # 32-bit float — preserves precision for data textures
    )
    img.pixels[:] = pixels   # flat RGBA list, row-major, bottom-up

    out_path = os.path.join(out_dir, f'{name}.webp')
    img.filepath_raw = out_path

    img.file_format = 'WEBP'
    img.save_render(out_path)

    bpy.data.images.remove(img)   # clean up session
    return out_path


# ============================================================
# GLB EXPORT — embed the baked texture as a material
# ============================================================
def export_glb(obj: bpy.types.Object, out_dir: str, tex_path: str) -> str:
    """
    Assign the baked normal map to a new Principled BSDF material, then
    export to GLB.  The Principled BSDF Normal input expects a tangent-space
    normal map in standard GLB convention.  We bake world-space for the data
    texture use case, so we attach it to the Base Color input instead —
    the WebXR shader interprets it as a data texture, not a bump map.
    """
    mat = bpy.data.materials.new('bake_data_mat')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node  = nodes.new('ShaderNodeOutputMaterial')
    bsdf      = nodes.new('ShaderNodeBsdfPrincipled')
    tex_node  = nodes.new('ShaderNodeTexImage')

    tex_img   = bpy.data.images.load(tex_path)
    tex_node.image = tex_img

    links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'],     out_node.inputs['Surface'])

    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    glb_path = os.path.join(out_dir, 'normal_data_sphere.glb')
    bpy.ops.export_scene.gltf(
        filepath        = glb_path,
        export_format   = 'GLB',
        use_selection   = True,
        export_apply    = True,
        export_texcoords = True,
        export_normals  = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )
    return glb_path


# ============================================================
# MAIN
# ============================================================
def main():
    blend_dir = bpy.path.abspath(
        f'//public/library/blends/{TOPIC}/{SLUG}/'
    )
    os.makedirs(blend_dir, exist_ok=True)

    obj    = build_scene()
    shader = _compile_shader()

    pixels = bake_normal_map(obj, shader)

    tex_path = save_as_webp(pixels, BAKE_W, BAKE_H, blend_dir,
                            'world_normal_data_tex')
    print(f'Normal map baked → {tex_path}')

    glb_path = export_glb(obj, blend_dir, tex_path)
    print(f'GLB exported → {glb_path}')

    bpy.ops.wm.save_as_mainfile(
        filepath=os.path.join(blend_dir, 'gpu_offscreen_bake.blend')
    )
    print('Blueprint complete.')


main()
