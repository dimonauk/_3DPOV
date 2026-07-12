import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.Mesh.from_pydata(vertices, edges, faces)</code> is a
        direct C-level mesh importer: it accepts plain Python lists of{" "}
        <code>(x, y, z)</code> tuples for vertices, integer-index tuples for
        faces (tris or quads, mixed freely), and an optional edge list you may
        safely pass as <code>[]</code> when faces cover the full topology —
        Blender infers the edge set from face winding. The call runs in{" "}
        <em>O(V)</em> on the C side, typically 10–20× faster than building the
        same vertex count one-by-one through <code>bmesh.verts.new()</code>.
        Follow every call with <code>me.update()</code> to finalise edge and
        face data structures; without it, draw caches are stale and some bpy
        accessors return empty results. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-faceted-gem-topology-construction-webxr"
          className={lk}
        >
          bmesh faceted-gem tutorial
        </Link>{" "}
        covers the alternative path when you need topology editing after
        construction — <code>from_pydata</code> is the right choice when the
        full geometry is known ahead of time from a mathematical formula.
      </p>
      <p>
        Enneper&apos;s surface (Alfred Enneper, 1863) is a classical{" "}
        <em>minimal surface</em> — mean curvature{" "}
        <code>H&nbsp;=&nbsp;0</code> everywhere inside the non-self-intersecting
        domain. Its parametric equations in right-hand +Y-up space are{" "}
        <code>x&nbsp;=&nbsp;u&nbsp;−&nbsp;u³/3&nbsp;+&nbsp;uv²</code>,{" "}
        <code>y&nbsp;=&nbsp;−v&nbsp;+&nbsp;v³/3&nbsp;−&nbsp;u²v</code>,{" "}
        <code>z&nbsp;=&nbsp;u²&nbsp;−&nbsp;v²</code>. The domain{" "}
        <code>|u|,&nbsp;|v|&nbsp;&lt;&nbsp;√3&nbsp;≈&nbsp;1.732</code> avoids
        self-intersection; clipping at 1.75 produces four symmetric boundary
        arcs with cusp-like corners. Flat shading (<code>use_smooth=False</code>
        ) assigns each of the 3 600 quads its own geometric face normal,
        revealing the saddle-point normal-field vortex as a mosaic of distinct
        planar shards — the studio faceted aesthetic. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr"
          className={lk}
        >
          custom split-normals tutorial
        </Link>{" "}
        for finer control over which edges read sharp and which blend smoothly,
        and with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-noise-terrain-heightfield-webxr"
          className={lk}
        >
          noise terrain tutorial
        </Link>{" "}
        for a similar <code>from_pydata</code> heightfield constructed from{" "}
        <code>mathutils.noise</code> rather than an analytic formula.
      </p>
      <p>
        The height-gradient vertex colour is baked into a{" "}
        <code>FLOAT_COLOR</code> point-domain attribute named{" "}
        <code>&apos;Col&apos;</code> via{" "}
        <code>me.color_attributes.new()</code>. The Blender 5.1 glTF exporter
        automatically writes any point-domain <code>FLOAT_COLOR</code>{" "}
        attribute as the <code>COLOR_0</code> accessor — no extra export flag is
        needed, and Three.js / WebXR reads it with{" "}
        <code>vertexColors:&nbsp;true</code> without custom shaders. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr"
          className={lk}
        >
          UV layer atlas tutorial
        </Link>{" "}
        for how mesh corner-domain data (UV maps) is handled differently from
        point-domain data. Outside references:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Mesh.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Mesh Python API (Blender Foundation, CC-BY-SA-4.0)
        </a>
        , siblings{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.ops.export_scene.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.ops.export_scene
        </a>{" "}
        and{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org
        </a>
        ;{" "}
        <a
          href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF 2.0 Specification — COLOR_0 accessor (Khronos Group, Apache-2.0)
        </a>
        , siblings{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Sample-Models"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF-Sample-Models
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
        title:
          "Scene reset + Enneper parameterisation + from_pydata tessellation",
        body: `"""
bpy.types.Mesh.from_pydata(vertices, edges, faces) is a one-shot C-level
mesh import: vertices = sequence of (x,y,z) tuples; edges=[] is valid when
faces cover the topology (Blender infers edges from winding); faces = index
tuples (tris or quads, mixed freely).  Call me.update() after to finalise.
Enneper's surface in right-hand +Y-up space:
  x(u,v) = u  − u³/3 + uv²
  y(u,v) = −v + v³/3 − u²v   (y negated for +Y-up)
  z(u,v) = u² − v²
Domain |u|, |v| < √3 ≈ 1.732 avoids self-intersection; 1.75 clips just inside
the fold.  N=60 → W×W = 3 721 verts, 3 600 CCW quads (bl, br, tr, tl).
"""
import bpy

N            = 60
U_MIN, U_MAX = -1.75, 1.75
SLUG         = "python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
OBJ_NAME     = "enneper_surface"
GLB_PATH, BLEND_PATH = "//enneper_surface.glb", "//enneper_surface.blend"

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def enneper(u, v):
    return (
         u  - (u**3) / 3.0 + u * (v**2),
        -v  + (v**3) / 3.0 - (u**2) * v,
         u**2 - v**2,
    )

W = N + 1
verts = []
for i in range(W):
    for j in range(W):
        u = U_MIN + (U_MAX - U_MIN) * j / N
        v = U_MIN + (U_MAX - U_MIN) * i / N
        verts.append(enneper(u, v))

faces = []
for i in range(N):
    for j in range(N):
        bl, br = i*W+j, i*W+(j+1)
        tr, tl = (i+1)*W+(j+1), (i+1)*W+j
        faces.append((bl, br, tr, tl))

me = bpy.data.meshes.new(OBJ_NAME + "_mesh")
me.from_pydata(verts, [], faces)
me.update()

ob = bpy.data.objects.new(OBJ_NAME, me)
sc.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
print(f"[{SLUG}] v={len(me.vertices)} f={len(me.polygons)}")`,
      },
      {
        title:
          "Flat-shaded faceting + height-gradient vertex colour attribute (COLOR_0)",
        body: `"""
polygon.use_smooth=False assigns the geometric face normal per polygon.
from_pydata meshes have flat normals by default but setting it explicitly is
belt-and-braces: bpy.ops.object.shade_smooth() in the viewport overrides it
silently.  On a minimal surface each quad occupies a distinct tangent plane;
3 600 distinct orientations reveal the saddle-point normal vortex as a mosaic.
me.color_attributes.new(name, type='FLOAT_COLOR', domain='POINT') writes one
32-bit RGBA per vertex (linear).  Blender 5.1 exports it as COLOR_0 — type
VEC4 UNSIGNED_BYTE normalised — without any extra export flag.
"""
z_vals  = [vt[2] for vt in verts]
z_min   = min(z_vals)
z_range = max(z_vals) - z_min or 1.0

for p in me.polygons:
    p.use_smooth = False

col_attr = me.color_attributes.new(name="Col", type='FLOAT_COLOR', domain='POINT')
TEAL, INDIGO = (0.06, 0.68, 0.82), (0.18, 0.12, 0.65)
for i, vt in enumerate(verts):
    t = (vt[2] - z_min) / z_range
    col_attr.data[i].color = (
        TEAL[0]*(1-t) + INDIGO[0]*t,
        TEAL[1]*(1-t) + INDIGO[1]*t,
        TEAL[2]*(1-t) + INDIGO[2]*t,
        1.0,
    )
me.update()

mat = bpy.data.materials.new("enneper_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.06, 0.68, 0.82, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.28
bsdf.inputs["Metallic"].default_value   = 0.08
ob.data.materials.append(mat)
print(f"[{SLUG}] flat shading + COLOR_0 + material done")`,
      },
      {
        title: "GLB export with transform bake + .blend save",
        body: `"""
export_apply=True bakes the transform matrix into vertex positions — studio-
standard: also resolves pending scale/rotation applied after ob.select_set.
export_yup=True converts +Z-up to +Y-up; Three.js loads without an X-rotation.
Draco level 6: 55–65 % compression on dense float-position geometry.
COLOR_0 (FLOAT_COLOR) is quantised to 8-bit UNORM in the Draco stream —
negligible quality loss.  Three.js: MeshStandardMaterial({vertexColors:true}).
"""
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(GLB_PATH),
    export_format                        = 'GLB',
    use_selection                        = False,
    export_apply                         = True,
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
    slug: "blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr",
    title:
      "Python bpy.types.Mesh.from_pydata() — Enneper Minimal Surface: Parametric Tessellation, Flat-Shaded Faceting & WebXR GLB (Blender 5.1)",
    description:
      "Build Enneper's classical minimal surface (mean curvature H=0, saddle-point 4-fold symmetry) in Blender 5.1 Python using bpy.types.Mesh.from_pydata(): evaluate the (u,v) parametric equations, wire CCW quad faces by index, bake a teal-to-indigo height-gradient FLOAT_COLOR attribute as COLOR_0, apply flat shading for the studio's faceted aesthetic, and export a Draco-compressed GLB for Three.js / WebXR.",
    topic: "scripting",
    tags: [
      "blender",
      "python",
      "from-pydata",
      "minimal-surface",
      "enneper",
      "parametric",
      "faceted",
      "flat-shading",
      "vertex-colour",
      "color-attribute",
      "glb",
      "webxr",
      "scripting",
      "bpy",
    ],
    date: "2026-07-12",
    body: <Body />,
  }
);
