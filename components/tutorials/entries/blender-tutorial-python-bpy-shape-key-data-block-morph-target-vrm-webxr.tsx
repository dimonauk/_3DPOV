import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender Mesh that carries shape keys owns a{" "}
        <code>bpy.types.Key</code> data-block, accessible as{" "}
        <code>mesh.shape_keys</code>. Blender creates the Key automatically
        when you call <code>ob.shape_key_add()</code> for the first time.{" "}
        <code>key.key_blocks</code> is an ordered list of{" "}
        <code>bpy.types.ShapeKey</code> objects; index 0 is always the Basis —
        the neutral vertex positions that all relative keys offset from. The
        fast bulk write path is{" "}
        <code>sk.data.foreach_set(&apos;co&apos;, flat)</code>, where{" "}
        <code>flat</code> is a plain <code>array.array(&apos;f&apos;, …)</code>{" "}
        of length <code>3 × vertex_count</code> in interleaved{" "}
        <code>(x, y, z)</code> order. The C-layer memcopy is roughly 80×
        faster than a Python for-loop over <code>sk.data[i].co</code> for
        meshes beyond a few hundred vertices.
      </p>
      <p>
        VRM 1.0&apos;s expression system uses reserved lower-camel-case preset
        names — <code>happy</code>, <code>angry</code>, <code>sad</code>,{" "}
        <code>surprised</code>, <code>blink</code>, <code>blinkLeft</code>,{" "}
        <code>blinkRight</code>, <code>aa</code> and the other visemes — that{" "}
        <code>three-vrm</code>&apos;s <code>ExpressionManager</code> binds
        automatically at runtime without extra JSON wiring. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial"
          className={lk}
        >
          shape-key driver tutorial
        </Link>{" "}
        covers binding FCurve drivers to shape key weights; the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-driver-shape-key-bone-rotation-vrm"
          className={lk}
        >
          FCurve driver tutorial
        </Link>{" "}
        shows how to drive those weights from bone rotations for a full VRM
        facial rig. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-bone-collections-vrm-rig-classification-webxr"
          className={lk}
        >
          bone collections tutorial
        </Link>{" "}
        for the underlying armature structure that hosts the deform envelope.
      </p>
      <p>
        GLB export requires <code>export_morph=True</code> (the default) to
        pack shape keys as glTF morph targets. Set{" "}
        <code>export_morph_normal=True</code> to ship per-morph normal deltas
        so the surface shading deforms correctly; set{" "}
        <code>export_morph_tangent=False</code> because tangent deltas add
        roughly 30 % to file size and three-vrm recomputes them. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
          className={lk}
        >
          vertex group tutorial
        </Link>{" "}
        explains how to constrain each expression to a vertex group via{" "}
        <code>sk.vertex_group</code>. Outside reference:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Key.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Key (Blender Foundation, CC-BY-SA-4.0)
        </a>
        , siblings{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.ShapeKey.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.ShapeKey
        </a>{" "}
        and{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.ShapeKeyPoint.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.ShapeKeyPoint
        </a>
        ; VRM expression preset specification:{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/expressions.md"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          VRMC_vrm expressions (VRM Consortium, MIT)
        </a>
        , siblings{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          three-vrm (pixiv, MIT)
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/vrm-c/UniVRM"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          UniVRM (VRM Consortium, MIT)
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Scene setup, UV sphere, and Basis shape key",
        body: `"""
ob.shape_key_add(name='Basis', from_mix=False) creates the bpy.types.Key
data-block on the mesh for the first time.  Subsequent calls append to
key_blocks without recreating the block.  from_mix=False copies the current
vertex positions rather than the active mix result — mandatory for the Basis.
me.shape_keys.reference_key = basis_sk is belt-and-braces: without it,
shape keys copied from another object may reference a stale block.
foreach_get('co', flat) reads all vertex positions in a single C-level call.
"""
import bpy, array as arr

SLUG, OBJ_NAME, GLB_PATH, BLEND_PATH = (
    "python-bpy-shape-key-data-block-morph-target-vrm-webxr",
    "vrm_head_proxy", "//vrm_morph_proxy.glb", "//vrm_morph_proxy.blend",
)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

bpy.ops.mesh.primitive_uv_sphere_add(
    segments=16, ring_count=12, radius=1.0, location=(0.0, 0.0, 0.0)
)
ob = bpy.context.active_object
ob.name = OBJ_NAME
me = ob.data;  me.name = OBJ_NAME + "_mesh"
for p in me.polygons: p.use_smooth = True

mat = bpy.data.materials.new("vrm_skin");  mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value       = (0.80, 0.61, 0.47, 1.0)
bsdf.inputs["Subsurface Weight"].default_value = 0.15
bsdf.inputs["Roughness"].default_value         = 0.65
ob.data.materials.append(mat)

basis_sk = ob.shape_key_add(name="Basis", from_mix=False)
me.shape_keys.use_relative  = True
me.shape_keys.reference_key = basis_sk

n = len(me.vertices)
basis_flat = arr.array('f', [0.0] * (3 * n))
basis_sk.data.foreach_get('co', basis_flat)
print(f"[{SLUG}] Basis: {n} verts read via foreach_get")`,
      },
      {
        title: "VRM expression shape keys via foreach_set",
        body: `"""
make_expression() copies the Basis flat buffer with arr.array('f', basis_flat)
— one C-level memcopy — then modifies it per-vertex via delta_fn and calls
foreach_set to write the result.  sk.relative_key = basis_sk is set explicitly
because copying an object can reset relative_key to None in some builds,
producing silent identity morphs.  VRM 1.0 preset names used here: happy,
angry, sad, surprised, blink, blinkLeft, blinkRight, aa.
"""
def make_expression(name, delta_fn, slider_max=1.0):
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.slider_min = 0.0;  sk.slider_max = slider_max
    sk.relative_key = basis_sk
    flat = arr.array('f', basis_flat)
    for i in range(n):
        x, y, z = flat[i*3], flat[i*3+1], flat[i*3+2]
        dx, dy, dz = delta_fn(x, y, z)
        flat[i*3] += dx;  flat[i*3+1] += dy;  flat[i*3+2] += dz
    sk.data.foreach_set('co', flat)
    return sk

make_expression("happy", lambda x,y,z: (
    0.0, 0.0,
    (0.10*max(0.0,(abs(x)-0.35)/0.65)
     if -0.55<z<-0.15 and abs(x)>0.35 and y<0.05 else 0.0)
))
make_expression("angry", lambda x,y,z: (
    0.0, 0.0,
    (-0.10*max(0.0,1.0-abs(x)/0.55)
     if 0.30<z<0.70 and y<0.0 else 0.0)
))
make_expression("sad", lambda x,y,z: (
    0.0, 0.0,
    (-0.09*max(0.0,(abs(x)-0.35)/0.65)
     if -0.50<z<-0.10 and abs(x)>0.35 and y<0.05 else 0.0)
))
def _surp(x,y,z):
    if z>0.20: t=(z-0.20)/0.80; return (x*.12*t, y*.12*t, z*.08*t)
    if z<-0.20 and y<0.0: t=(-z-.20)/.80; return (0.0, 0.0, -.12*t)
    return (0.0, 0.0, 0.0)
make_expression("surprised", _surp)
def _blink(x,y,z):
    if 0.20<z<0.65 and y<-0.05: return (0.0, 0.0, -0.22*(z-0.20)/0.45)
    return (0.0, 0.0, 0.0)
make_expression("blink",      _blink)
make_expression("blinkLeft",  lambda x,y,z: _blink(x,y,z) if x<0 else (0.,0.,0.))
make_expression("blinkRight", lambda x,y,z: _blink(x,y,z) if x>0 else (0.,0.,0.))
make_expression("aa", lambda x,y,z: (
    0.0, 0.0,
    (-0.15*max(0.0,(-z-0.05)/0.95) if z<-0.05 and y<0.10 else 0.0)
))
print(f"[{SLUG}] keys: {[kb.name for kb in me.shape_keys.key_blocks]}")`,
      },
      {
        title: "GLB morph-target export and .blend save",
        body: `"""
export_morph=True (the default) packs ShapeKey data as glTF morph targets.
export_morph_normal=True ships per-morph normal deltas so the mesh shading
deforms cleanly under expression weights — without it surfaces look flat.
export_morph_tangent=False omits tangent deltas: they add ~30 % file size
and three-vrm recomputes them from the morph normals at load time.
"""
bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(GLB_PATH),
    export_format                        = 'GLB',
    use_selection                        = False,
    export_apply                         = True,
    export_morph                         = True,
    export_morph_normal                  = True,
    export_morph_tangent                 = False,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_yup                           = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
print(f"[{SLUG}] done — {GLB_PATH}")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-shape-key-data-block-morph-target-vrm-webxr",
    title:
      "Python bpy.types.Key + ShapeKey — Scripted Morph Target Construction: foreach_set Bulk Write & VRM Expression GLB for WebXR (Blender 5.1)",
    description:
      "Script VRM facial expression shape keys in Blender 5.1 Python: create the Key data-block via ob.shape_key_add(), bulk-write vertex deltas with ShapeKey.data.foreach_set(), name keys with VRM 1.0 preset strings, and export a GLB with morph targets and morph normals for three-vrm WebXR playback.",
    topic: "scripting",
    tags: [
      "blender",
      "python",
      "shape-keys",
      "morph-targets",
      "vrm",
      "bpy",
      "foreach-set",
      "webxr",
      "glb",
      "animation",
      "scripting",
      "three-vrm",
    ],
    date: "2026-07-12",
    body: <Body />,
  }
);
