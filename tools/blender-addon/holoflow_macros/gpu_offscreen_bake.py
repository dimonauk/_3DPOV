"""
holoflow_macros/gpu_offscreen_bake.py
Reusable helper: render any mesh object into a gpu.types.GPUOffScreen
and return raw RGBA float pixel data.

Blender 5.1 | CC0 | Holoflow Studio

Usage:
    from holoflow_macros.gpu_offscreen_bake import bake_world_normals
    pixels = bake_world_normals(bpy.data.objects['MyMesh'], 512, 512)
"""

import bpy
import gpu
import mathutils
from gpu_extras.batch import batch_for_shader

_VERT = """
uniform mat4 viewProjectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;
in vec3 pos;
in vec3 nor;
out vec3 vNormal;
out float vDepth;
void main() {
    vec4 wp   = modelMatrix * vec4(pos, 1.0);
    gl_Position = viewProjectionMatrix * wp;
    vNormal   = normalize(normalMatrix * nor);
    vDepth    = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
}
"""

_FRAG = """
in vec3 vNormal;
in float vDepth;
out vec4 fragColor;
void main() {
    vec3 n = vNormal * 0.5 + 0.5;
    fragColor = vec4(n, vDepth);
}
"""


def _build_batch(obj: bpy.types.Object, shader: gpu.types.GPUShader):
    dg   = bpy.context.evaluated_depsgraph_get()
    ev   = obj.evaluated_get(dg)
    mesh = ev.to_mesh()
    mesh.calc_normals_split()

    pos, nor, idx = [], [], []
    for p in mesh.polygons:
        base = len(pos)
        vl, nl = [], []
        for li in p.loop_indices:
            lp = mesh.loops[li]
            vl.append(tuple(mesh.vertices[lp.vertex_index].co))
            nl.append(tuple(lp.normal))
        pos.extend(vl)
        nor.extend(nl)
        for k in range(len(vl) - 2):
            idx.append((base, base + k + 1, base + k + 2))

    ev.to_mesh_clear()
    return batch_for_shader(
        shader, 'TRIS',
        {'pos': [c for v in pos for c in v],
         'nor': [c for n in nor for c in n]},
        indices=[i for t in idx for i in t],
    )


def bake_world_normals(
    obj: bpy.types.Object,
    width: int = 512,
    height: int = 512,
    ortho_size: float = 1.0,
) -> list[float]:
    """
    Render world-space normals (RGB) + linear depth (A) of obj into an
    offscreen framebuffer.  Returns a flat RGBA float list, bottom-up,
    length = width * height * 4.
    """
    shader = gpu.types.GPUShader(_VERT, _FRAG)
    batch  = _build_batch(obj, shader)

    cam    = mathutils.Vector((0.0, 0.0, 2.0))
    fwd    = mathutils.Vector((0.0, 0.0, -1.0))
    view   = mathutils.Matrix.look_at(cam, cam + fwd,
                                       mathutils.Vector((0.0, 1.0, 0.0)))
    l = r = ortho_size
    n, f   = 0.01, 100.0
    proj   = mathutils.Matrix([
        [1/l, 0,   0,              0       ],
        [0,   1/l, 0,              0       ],
        [0,   0,  -2/(f-n),       -(f+n)/(f-n)],
        [0,   0,   0,              1       ],
    ])
    vp  = proj @ view
    mod = obj.matrix_world
    nm  = mod.to_3x3().inverted().transposed()

    offscreen = gpu.types.GPUOffScreen(width, height)
    with offscreen.bind():
        fb = gpu.state.active_framebuffer_get()
        fb.clear(color=(0, 0, 0, 0), depth=1.0)
        gpu.state.depth_test_set('LESS_EQUAL')
        gpu.state.depth_mask_set(True)
        gpu.state.blend_set('NONE')
        shader.bind()
        shader.uniform_float('viewProjectionMatrix', vp)
        shader.uniform_float('modelMatrix',          mod)
        shader.uniform_float('normalMatrix',         nm)
        batch.draw(shader)
        buf = fb.read_color(0, 0, width, height, 4, 0, 'FLOAT')
    offscreen.free()
    return list(buf)
