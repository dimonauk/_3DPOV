import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 5.0 removed the <code>bgl</code> OpenGL wrapper that
        add-ons used for raw GPU access. Its replacement &mdash; the{" "}
        <code>gpu</code> module, stable since Blender 4.0 &mdash; exposes a
        headless render path via <code>gpu.types.GPUOffScreen</code>. An
        offscreen target is an OpenGL framebuffer with a colour attachment
        and an optional depth attachment. You bind it, draw mesh geometry
        through a custom GLSL shader, then read the colour buffer back to a{" "}
        <code>bpy.types.Image</code> without ever invoking the Cycles or EEVEE
        render pipeline. On a modern GPU this takes under two milliseconds;
        a comparable Cycles bake takes several seconds. The resulting image
        is a data texture &mdash; a world-space normal map, a position map,
        a curvature field &mdash; ready to embed in a GLB and sample from a
        Three.js TSL material in WebXR.
      </p>

      <p>
        The critical distinction between this approach and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay"
          className={lk}
        >
          viewport overlay tutorial
        </Link>{" "}
        is where drawing happens. A viewport overlay uses{" "}
        <code>SpaceView3D.draw_handler_add()</code> to hook into the live
        screen-space draw loop &mdash; it draws pixels on screen but cannot
        capture them. An offscreen render draws into a private framebuffer
        that is never displayed, which is why you can read the pixel data
        back. The two techniques are complementary: use the viewport hook for
        diagnostic overlays, use the offscreen for baking and data export.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr"
          className={lk}
        >
          image pixel buffer tutorial
        </Link>{" "}
        shows the CPU-side counterpart: writing pixels by hand using{" "}
        <code>Image.pixels[:]</code>. The GPU offscreen approach is faster by
        roughly three orders of magnitude on large textures, because the
        computation runs entirely on the GPU with no round-trip to the CPU
        until the final <code>read_color()</code> call.
      </p>

      <p>
        The shader in this tutorial encodes world-space normals as RGB
        (X&rarr;R, Y&rarr;G, Z&rarr;B, remapped from [&minus;1,&thinsp;1] to
        [0,&thinsp;1]) with linear depth in the alpha channel. The WebXR
        reason: a Three.js TSL shader can unpack these channels at runtime to
        drive parallax offsets, edge-detect facets for outline shading, or
        reconstruct a screen-space AO pass without a full deferred renderer.
        The technique mirrors what the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-shader-aov-custom-pass-bake-webxr"
          className={lk}
        >
          Cycles AOV bake tutorial
        </Link>{" "}
        does with Cycles render passes, but avoids launching a full path
        tracer &mdash; viable on headless servers or during export pipelines
        where Cycles would time out. For the GLB export side of this
        pipeline, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-render-engine-webxr-snapshot"
          className={lk}
        >
          custom render engine tutorial
        </Link>
        , which shows how to hook <code>F12</code> into a programmatic GLB
        write.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "advanced",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    supplies: {
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Understand the GPUOffScreen object lifecycle",
        body: `# gpu.types.GPUOffScreen allocates a framebuffer on the GPU.
# It must be freed explicitly — Python's garbage collector does NOT
# release GPU memory when the Python object is collected.

import gpu

# width/height must be positive integers.
# Float or zero raises RuntimeError immediately.
WIDTH  = 512
HEIGHT = 512

offscreen = gpu.types.GPUOffScreen(WIDTH, HEIGHT)
# offscreen.texture_color → GPUTexture (the colour attachment)
# offscreen.width / offscreen.height → int

# BINDING — all draw calls inside the with block target this framebuffer.
# Draw calls outside the with block target the active viewport — silently.
with offscreen.bind():
    fb = gpu.state.active_framebuffer_get()
    fb.clear(color=(0.0, 0.0, 0.0, 0.0), depth=1.0)
    # ... draw geometry here ...
    pass

# EXPLICIT FREE — release GPU resources immediately after use.
# Forgetting this leaks VRAM until Blender exits.
offscreen.free()

# WHY not just let it go out of scope?
#   Python's reference counter calls __del__ eventually, but Blender's
#   VRAM allocator does not shrink until a free() call.  On scenes with
#   many bake targets (e.g. one per mesh in a batch export) this adds up
#   to hundreds of MB of leaked VRAM within a single session.`,
      },
      {
        title: "Write a custom GLSL shader for world-space normal encoding",
        body: `import gpu

VERT_SRC = """
uniform mat4 viewProjectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;

in vec3 pos;
in vec3 nor;

out vec3 vNormal;
out float vDepth;

void main() {
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    gl_Position   = viewProjectionMatrix * worldPos;
    vNormal       = normalize(normalMatrix * nor);
    vDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
}
"""

FRAG_SRC = """
in vec3 vNormal;
in float vDepth;

out vec4 fragColor;

void main() {
    // remap [-1,1] → [0,1] for unsigned texture storage
    vec3 n = vNormal * 0.5 + 0.5;
    fragColor = vec4(n, vDepth);
}
"""

# gpu.types.GPUShader(vert, frag) compiles on construction.
# A GLSL syntax error raises RuntimeError with the GLSL log attached.
# Check Window → Toggle System Console for the full message.
shader = gpu.types.GPUShader(VERT_SRC, FRAG_SRC)

# WHY custom GLSL rather than gpu.shader.from_builtin()?
#   The built-in shaders (FLAT_COLOR, SMOOTH_COLOR, UNIFORM_COLOR, etc.)
#   are fixed-function pipelines with no world-space normal output.
#   Any custom data channel — position, curvature, UV coordinates —
#   requires writing your own vertex and fragment programs.
#
# WHY store depth in alpha rather than as a separate pass?
#   A single RGBA read_color() call retrieves all four channels in one
#   GPU round-trip.  Separate passes would require two offscreen binds,
#   doubling the GPU overhead.  The WebXR sampler can unpack channels
#   independently: rgb for the normal, a for depth.`,
      },
      {
        title: "Build a GPUBatch from a Blender mesh",
        body: `import bpy, gpu
from gpu_extras.batch import batch_for_shader

def mesh_to_batch(obj, shader):
    """
    Extract per-loop geometry and build a TRIS GPUBatch.

    Per-loop indexing is essential for flat-shaded meshes: vertices at
    shared edges have different normals on each adjoining face, so a
    per-vertex buffer would need to pick one normal arbitrarily.  A
    per-loop buffer gives each face its own copies of the shared vertices
    with the correct per-face normal — no discontinuity artefacts.
    """
    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    mesh     = eval_obj.to_mesh()
    mesh.calc_normals_split()

    positions, normals, indices = [], [], []
    for poly in mesh.polygons:
        base = len(positions)
        verts_l, nors_l = [], []
        for li in poly.loop_indices:
            loop = mesh.loops[li]
            verts_l.append(tuple(mesh.vertices[loop.vertex_index].co))
            nors_l.append(tuple(loop.normal))
        positions.extend(verts_l)
        normals.extend(nors_l)
        for k in range(len(verts_l) - 2):
            indices.append((base, base+k+1, base+k+2))

    eval_obj.to_mesh_clear()

    # gpu_extras.batch.batch_for_shader() is the 5.1-recommended helper.
    # It handles GPUVertFormat and GPUVertBuf construction internally.
    # The 'content' dict maps attribute name → flat list of values.
    return batch_for_shader(
        shader, 'TRIS',
        {
            'pos': [c for v in positions for c in v],
            'nor': [c for n in normals   for c in n],
        },
        indices=[i for tri in indices for i in tri],
    )

# TROUBLESHOOTING:
#   'RuntimeError: GPUVertBuf.attr_fill: attribute not found'
#     The shader attribute name in GLSL (e.g. 'pos') must EXACTLY match
#     the key in the 'content' dict passed to batch_for_shader().
#   'ValueError: seq must be a list or tuple of floats'
#     batch_for_shader() expects a flat list, not a list of mathutils.Vector.
#     Convert with: [c for v in positions for c in v]`,
      },
      {
        title: "Set up orthographic projection for a texel-accurate bake",
        body: `import mathutils

# For a bake, every texel should receive exactly one ray perpendicular
# to the projection plane.  An orthographic projection guarantees this;
# a perspective projection introduces foreshortening that distorts the
# baked values near the edges of the view.

# Camera looking straight down -Z from above.
cam_loc = mathutils.Vector((0.0, 0.0, 2.0))
cam_fwd = mathutils.Vector((0.0, 0.0, -1.0))
cam_up  = mathutils.Vector((0.0, 1.0,  0.0))

view_mat = mathutils.Matrix.look_at(cam_loc, cam_loc + cam_fwd, cam_up)

# Orthographic projection matrix (column-major convention).
# Maps the view volume [l,r]x[b,t]x[near,far] to the NDC cube [-1,1]^3.
ortho = 1.0   # half-size of the view volume in world units
near, far = 0.01, 100.0
l, r, b, t = -ortho, ortho, -ortho, ortho

proj_mat = mathutils.Matrix([
    [2/(r-l),  0,        0,           -(r+l)/(r-l)],
    [0,        2/(t-b),  0,           -(t+b)/(t-b)],
    [0,        0,        -2/(far-near), -(far+near)/(far-near)],
    [0,        0,         0,            1          ],
])

vp_mat = proj_mat @ view_mat   # combined view-projection matrix

# Normal matrix: inverse-transpose of the 3x3 upper-left of model_mat.
# Required for correct normal transformation under non-uniform scale.
model_mat = bpy.context.active_object.matrix_world
nor_mat   = model_mat.to_3x3().inverted().transposed()

# WHY not use mathutils.Matrix.OrthoProjection()?
#   OrthoProjection() builds a projection along a named axis but does not
#   accept arbitrary frustum boundaries (l, r, b, t, near, far).
#   The manual matrix construction gives full control over the bake window
#   and is the correct approach when the subject's extent does not fit in
#   a unit cube.`,
      },
      {
        title: "Draw the mesh into the offscreen buffer and read pixels back",
        body: `import gpu

def render_to_offscreen(obj, shader, batch, vp_mat, model_mat, nor_mat,
                         width=512, height=512):
    offscreen = gpu.types.GPUOffScreen(width, height)

    with offscreen.bind():
        fb = gpu.state.active_framebuffer_get()
        fb.clear(color=(0.0, 0.0, 0.0, 0.0), depth=1.0)

        # Enable depth testing so front faces occlude back faces.
        # Without this every face composites additively → garbage output.
        gpu.state.depth_test_set('LESS_EQUAL')
        gpu.state.depth_mask_set(True)
        gpu.state.blend_set('NONE')   # no alpha blending for data textures

        shader.bind()
        shader.uniform_float('viewProjectionMatrix', vp_mat)
        shader.uniform_float('modelMatrix',          model_mat)
        shader.uniform_float('normalMatrix',         nor_mat)
        batch.draw(shader)

        # read_color(x, y, width, height, channels, slot, dtype)
        # dtype = 'FLOAT' returns float32 values normalised to [0,1].
        # channels = 4 → RGBA.
        # slot = 0 → colour attachment 0 (the only one GPUOffScreen has).
        pixel_buf = fb.read_color(0, 0, width, height, 4, 0, 'FLOAT')

    offscreen.free()
    return list(pixel_buf)   # flat RGBA list, row-major, bottom-up

# TROUBLESHOOTING:
#   'read_color returns all zeros'
#     Check that depth_test_set() and depth_mask_set() are called INSIDE
#     the with block — gpu.state is framebuffer-scoped in 5.1.
#   'RuntimeError: draw handler not set'
#     batch.draw() must be called inside an active offscreen bind context.
#     Never call it in a draw_handler callback and then try to read pixels —
#     the handler runs in the viewport context, not the offscreen context.`,
      },
      {
        title: "Write pixels to bpy.types.Image and export as WebP",
        body: `import bpy, os

def save_data_texture(pixels, width, height, out_dir, name):
    """
    Store the raw RGBA float list in a bpy.types.Image and export as WebP.

    float_buffer=True preserves 32-bit precision in memory.
    The save_render() codec pipeline converts to 8-bit WebP on disk, which
    is sufficient for normal maps (8 bits = 256 levels per channel).
    For position data that spans a large world-space range, pack values
    into a 16-bit PNG instead (file_format='PNG', color_depth='16').
    """
    img = bpy.data.images.new(
        name=name,
        width=width,
        height=height,
        alpha=True,
        float_buffer=True,
    )
    img.pixels[:] = pixels   # row-major, bottom-up; matches OpenGL convention

    out_path = os.path.join(out_dir, f'{name}.webp')
    img.filepath_raw = out_path
    img.file_format  = 'WEBP'
    img.save_render(out_path)

    bpy.data.images.remove(img)   # clean up the session data-block
    return out_path

# WHY save_render() rather than img.save()?
#   img.save() uses the image's internal format settings, which default to
#   PNG.  save_render() uses the file_format and filepath_raw you just set,
#   and runs through the colour management pipeline (gamma, OCIO) so that
#   the exported WebP is colour-correct for the current view transform.
#   For a linear data texture you want the opposite: raw linear values.
#   Set scene.view_settings.view_transform = 'Raw' before calling save_render()
#   to bypass display-referred tone-mapping on the exported pixels.

scene = bpy.context.scene
prev_vt = scene.view_settings.view_transform
scene.view_settings.view_transform = 'Raw'   # no tone-mapping on bake data

out_dir = bpy.path.abspath('//public/library/blends/scripting/'
    'python-gpu-offscreen-render-to-texture-webxr/')
path = save_data_texture(pixel_buf, 512, 512, out_dir, 'world_normal_data_tex')
print('Exported:', path)

scene.view_settings.view_transform = prev_vt   # restore display transform`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-gpu-offscreen-render-to-texture-webxr",
    title:
      "Python gpu.types.GPUOffScreen — Offscreen Render-to-Texture: Custom GPU Bake for WebXR Data Textures",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Use Blender 5.1's gpu.types.GPUOffScreen to draw mesh geometry into a headless framebuffer via a custom GLSL shader, read the pixel data back to a bpy.types.Image, and export a world-space normal + depth texture as WebP for embedding in a GLB data texture — all without Cycles.",
    Body,
  }
);
