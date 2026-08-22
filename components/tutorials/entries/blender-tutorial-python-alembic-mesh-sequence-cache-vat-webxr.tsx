import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Alembic (`.abc`) is the open geometry-cache format from ILM and Sony
        — BSD-3-Clause, first shipped in 2011. It stores per-frame vertex
        positions without an armature, which makes it the production standard
        for cloth caches from Houdini, liquid sims, and rigid-body debris
        exported from any DCC. Blender reads it without baking via the{" "}
        <strong>Mesh Sequence Cache</strong> (MSC) modifier: on each frame
        Blender swaps in the geometry from the timeline of the `.abc` file.
        For WebXR, however, you cannot stream a raw Alembic cache to the
        browser. Instead you bake it to a <strong>Vertex Animation Texture</strong>{" "}
        (VAT): a float-32 EXR where each row is a frame and each column is a
        vertex, carrying the local-space Δ position from the rest pose. A
        custom GLSL shader adds the offset at the sampled time coordinate.
        This tutorial walks the full pipeline — from a synthetic animated
        source in Blender, through `.abc` export and re-import, to a
        production-ready GLB + EXR + JSON metadata bundle. It extends the
        cloth-simulation VAT approach from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cloth-modifier-sim-bake-vertex-animation-texture-webxr"
          className={lk}
        >
          cloth modifier VAT tutorial
        </Link>{" "}
        to an externally-sourced Alembic input.
      </p>
      <p>
        Outside references:{" "}
        <a
          href="https://www.alembic.io/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Alembic Project — ILM / Sony (BSD-3-Clause)
        </a>
        , sibling projects: Alembic C++ library (github.com/alembic/alembic),
        OpenEXR (github.com/AcademySoftwareFoundation/openexr);{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/files/import_export/alembic.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Foundation — Alembic Import/Export Manual (CC-BY-SA 4.0)
        </a>
        , sibling: projects.blender.org/blender/blender.
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Build the animated source and export to Alembic",
        body: `# WHY shape keys over a Displace modifier:
# Shape keys bake positions into .abc vertex data during alembic_export().
# A Displace modifier would need Apply Modifiers = True in the exporter,
# which breaks modifier-stack order when other modifiers are present.

import math, bpy
from mathutils import Vector

N_FRAMES       = 32
GRID_DIVS      = 8
WAVE_AMPLITUDE = 0.25
WAVE_FREQ      = 2.0
ABC_PATH       = "/tmp/holoflow_wave.abc"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

bpy.ops.mesh.primitive_grid_add(
    x_subdivisions=GRID_DIVS, y_subdivisions=GRID_DIVS,
    size=1.0, location=(0, 0, 0),
)
obj = bpy.context.active_object
obj.name = "WaveGrid"
obj.shape_key_add(name="Basis", from_mix=False)

verts = obj.data.vertices
for f in range(N_FRAMES):
    t  = f / max(N_FRAMES - 1, 1)
    sk = obj.shape_key_add(name=f"frame_{f:03d}", from_mix=False)
    for vi, v in enumerate(verts):
        angle = t * 2 * math.pi
        z = WAVE_AMPLITUDE * math.sin(
            2 * math.pi * WAVE_FREQ * (
                v.co.x * math.cos(angle) + v.co.y * math.sin(angle)
            )
        )
        sk.data[vi].co.z = z
    # Animate value: 1.0 on its frame, 0.0 on all others
    kb = obj.data.shape_keys.key_blocks[f"frame_{f:03d}"]
    for ff in range(1, N_FRAMES + 1):
        kb.value = 1.0 if ff == f + 1 else 0.0
        kb.keyframe_insert("value", frame=ff)

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = N_FRAMES

# Export to Alembic — shape keys baked into per-frame vertex data
bpy.ops.wm.alembic_export(
    filepath    = ABC_PATH,
    frame_start = 1,
    frame_end   = N_FRAMES,
    selected    = True,
    triangulate = False,
    apply_subdiv = True,
    flatten      = False,
)
print(f"[holoflow] .abc → {ABC_PATH}")`,
      },
      {
        title: "Import Alembic — the Mesh Sequence Cache modifier",
        body: `# bpy.ops.wm.alembic_import() does three things automatically:
#   1. Parses the .abc hierarchy into Blender objects.
#   2. Adds a Mesh Sequence Cache modifier to each mesh object.
#   3. Binds the modifier's .abc filepath so frame_set() drives the geometry.
#
# The MSC modifier is visible in Object Properties → Modifier stack.
# Its key fields:
#   mod.cache_file  — the CacheFile data block pointing to the .abc
#   mod.object_path — the path inside the .abc hierarchy (e.g. "/WaveGrid")
#   mod.read_data   — which channels to read: VERT, POLY, UV, COLOR, ATTR
#
# WHY NOT apply the modifier manually:
# MSC reads positions lazily per frame. Applying it collapses to one frame.
# Keep it live so sample_vat() can step through the timeline.

import bpy

ABC_PATH = "/tmp/holoflow_wave.abc"

# Clear the source objects but keep the .abc on disk
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

bpy.ops.wm.alembic_import(
    filepath          = ABC_PATH,
    as_background_job = False,
)

abc_obj = next(
    (o for o in bpy.context.selected_objects if o.type == 'MESH'),
    None,
)
if abc_obj is None:
    raise RuntimeError("alembic_import returned no MESH — check filepath")

abc_obj.name = "WaveGrid_vat"

# Verify the MSC modifier is present
msc = next((m for m in abc_obj.modifiers if m.type == 'MESH_SEQUENCE_CACHE'), None)
print(f"[holoflow] MSC modifier: {msc is not None}")
print(f"[holoflow] cache file:   {msc.cache_file.filepath if msc else 'n/a'}")`,
      },
      {
        title: "Sample per-frame vertex positions via depsgraph",
        body: `# obj.evaluated_get(depsgraph) is the correct path for post-modifier
# geometry. bpy.ops-based mesh reading ignores modifier results in headless
# context. evaluated_get() gives you the fully-evaluated data block —
# including the MSC modifier's per-frame mesh replacement.
#
# frame_set() + dg.update() is the required two-step: frame_set() moves
# the scene timeline; dg.update() propagates the change through the
# modifier stack so the next evaluated_get() sees the new frame's data.

import bpy
from mathutils import Vector

N_FRAMES = 32
scene    = bpy.context.scene
abc_obj  = bpy.data.objects["WaveGrid_vat"]
dg       = bpy.context.evaluated_depsgraph_get()

frames_positions = []
for f in range(N_FRAMES):
    scene.frame_set(f + 1)
    dg.update()
    obj_eval  = abc_obj.evaluated_get(dg)
    mesh_eval = obj_eval.to_mesh()
    frames_positions.append([v.co.copy() for v in mesh_eval.vertices])
    obj_eval.to_mesh_clear()   # release the temporary evaluated mesh

rest_pos = frames_positions[0]
n_verts  = len(rest_pos)
print(f"[holoflow] sampled {n_verts} verts × {N_FRAMES} frames")
print(f"[holoflow] rest vertex[0]: {rest_pos[0]}")
print(f"[holoflow] frame-16 vertex[0]: {frames_positions[15][0]}")`,
      },
      {
        title: "Pack offsets into a float-32 EXR Vertex Animation Texture",
        body: `# WHY offsets, not absolute positions:
#   - Offset magnitude ≈ WAVE_AMPLITUDE (0.25 m). Absolute positions span
#     the full grid (±0.5 m). Storing offsets concentrates float precision
#     on the delta, giving ~8× better precision in 32-bit float.
#   - The WebXR shader is simpler: world_pos = rest_pos + offset.
#     No bbox remap needed.
#
# WHY EXR not PNG:
#   EXR supports FLOAT32 per channel natively. PNG is unsigned 8- or
#   16-bit — encoding signed float offsets requires a range remap and
#   loses precision on values close to zero.
#
# Texture layout:
#   width  = vertex_count  (one column per vertex)
#   height = frame_count   (one row per frame)
#   RGBA   = (Δx, Δy, Δz, 1.0)

import bpy

EXR_PATH = "//vat_position.exr"

n_verts  = len(rest_pos)
n_frames = len(frames_positions)
img = bpy.data.images.new(
    name="vat_position",
    width=n_verts, height=n_frames,
    float_buffer=True, is_data=True,
)
pixels = [0.0] * (n_verts * n_frames * 4)
for fi, frame in enumerate(frames_positions):
    for vi, pos in enumerate(frame):
        offset = pos - rest_pos[vi]
        idx = (fi * n_verts + vi) * 4
        pixels[idx]     = offset.x
        pixels[idx + 1] = offset.y
        pixels[idx + 2] = offset.z
        pixels[idx + 3] = 1.0
img.pixels[:] = pixels
img.file_format = 'OPEN_EXR'
img.colorspace_settings.name = 'Non-Color'
abs_exr = bpy.path.abspath(EXR_PATH)
img.save_render(abs_exr)
print(f"[holoflow] EXR written → {abs_exr}")
print(f"[holoflow] texture size: {n_verts} × {n_frames} px")`,
      },
      {
        title: "Export rest-pose GLB and decode in Three.js",
        body: `# Export frame-1 geometry as the rest-pose GLB.
# Animations are excluded — the VAT EXR drives motion instead.
# The WebXR shader reconstructs world positions from (rest_pos + offset).

import bpy, json

GLB_PATH  = "//alembic_vat_rest.glb"
META_PATH = "//alembic_vat_meta.json"
scene     = bpy.context.scene

scene.frame_set(1)
bpy.context.evaluated_depsgraph_get().update()
bpy.ops.object.select_all(action='DESELECT')
abc_obj = bpy.data.objects["WaveGrid_vat"]
abc_obj.select_set(True)
bpy.context.view_layer.objects.active = abc_obj

bpy.ops.export_scene.gltf(
    filepath          = bpy.path.abspath(GLB_PATH),
    use_selection     = True,
    export_format     = "GLB",
    export_animations = False,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)

meta = {
    "vertex_count": n_verts,
    "frame_count" : n_frames,
    "vat_layout"  : "width=vertex_count, height=frame_count, RGBA=delta_xyz_1",
    "webxr_shader": (
        "vec2 uv = vec2((aVertexId + 0.5) / vertex_count, "
        "(uTime * (frame_count - 1.0) + 0.5) / frame_count); "
        "vec3 offset = texture(uVAT, uv).xyz; "
        "vec3 world_pos = position + offset;"
    ),
}
with open(bpy.path.abspath(META_PATH), "w") as fh:
    json.dump(meta, fh, indent=2)
print(f"[holoflow] GLB  → {bpy.path.abspath(GLB_PATH)}")
print(f"[holoflow] META → {bpy.path.abspath(META_PATH)}")

# Three.js ShaderMaterial snippet:
# const vatMat = new THREE.ShaderMaterial({
#   uniforms: { uVAT: { value: vatTexture }, uTime: { value: 0 } },
#   vertexShader: \`
#     attribute float aVertexId;
#     uniform sampler2D uVAT;
#     uniform float uTime;
#     void main() {
#       vec2 uv = vec2((aVertexId + 0.5) / ${n_verts}.0,
#                      (uTime * ${n_frames - 1}.0 + 0.5) / ${n_frames}.0);
#       vec3 offset = texture2D(uVAT, uv).xyz;
#       gl_Position = projectionMatrix * modelViewMatrix
#                     * vec4(position + offset, 1.0);
#     }\`,
# });`,
      },
    ],
    troubleshooting: [
      {
        problem: "alembic_import returns no MESH — RuntimeError",
        solution:
          "Verify ABC_PATH exists before calling alembic_import(). The blueprint writes it to /tmp/ which may be cleared on reboot. Re-run the export step. Also check that Blender's built-in Alembic add-on is enabled: Edit > Preferences > Add-ons > search 'Alembic'.",
      },
      {
        problem: "MSC modifier shows red filepath warning after blueprint runs",
        solution:
          "The MSC modifier stores an absolute path to the .abc at import time. If /tmp/ was cleared, the file is gone and the modifier turns red. Re-run blueprint.py — the alembic_export() step regenerates /tmp/holoflow_wave.abc before alembic_import() references it.",
      },
      {
        problem: "All VAT rows are identical — wave animation does not appear",
        solution:
          "dg.update() was not called after frame_set(). The depsgraph must be explicitly updated in scripts — it is not automatic outside of the main event loop. Ensure the sequence is: scene.frame_set(f + 1) → dg.update() → obj.evaluated_get(dg) on every frame.",
      },
      {
        problem: "EXR image shows up black in the Image Editor",
        solution:
          "The offset values are small floats (< 0.25 m) and display nearly black at default exposure. In the Image Editor header, set the View Transform to Raw and increase Exposure by +6 stops to verify the data is present. The EXR is correct for the shader even if it looks black at default exposure.",
      },
      {
        problem: "WebXR shader shows incorrect vertex positions at frame boundaries",
        solution:
          "The VAT UV calculation assumes nearest-sample (no bilinear blending between frames). In Three.js set vatTexture.minFilter = THREE.NearestFilter and vatTexture.magFilter = THREE.NearestFilter. Bilinear blending between adjacent frame rows would blend vertex positions — only correct if you deliberately want frame interpolation.",
      },
    ],
    outsideSources: [
      {
        title: "Alembic Project — ILM / Sony (BSD-3-Clause)",
        author: "Industrial Light & Magic / Sony Pictures Imageworks",
        licence: "BSD-3-Clause",
        url: "https://www.alembic.io/",
        relatedProjects: [
          "https://github.com/alembic/alembic",
          "https://github.com/AcademySoftwareFoundation/openexr",
        ],
      },
      {
        title: "Blender Foundation — Alembic Import/Export Manual (CC-BY-SA 4.0)",
        author: "Blender Foundation",
        licence: "CC-BY-SA-4.0",
        url: "https://docs.blender.org/manual/en/latest/files/import_export/alembic.html",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/features/io/alembic/",
        ],
      },
    ],
  },
  {
    slug: "python-alembic-mesh-sequence-cache-vat-webxr",
    title:
      "Python Alembic Mesh Sequence Cache → VAT for WebXR (Blender 5.1)",
    description:
      "Import an Alembic animated-geometry cache into Blender 5.1 via the Mesh Sequence Cache modifier, sample per-frame vertex offsets through the depsgraph, and bake them to a float-32 EXR Vertex Animation Texture for GPU-driven WebXR playback.",
    date: "2026-07-11",
    image: null,
    body: <Body />,
    tags: [
      "blender",
      "python",
      "scripting",
      "alembic",
      "vertex-animation-texture",
      "vat",
      "mesh-sequence-cache",
      "webxr",
      "depsgraph",
      "animation",
      "three.js",
    ],
  }
);
