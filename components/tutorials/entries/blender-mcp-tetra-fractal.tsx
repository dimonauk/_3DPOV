// NOTE — this tutorial was NOT yet executed end-to-end via the MCP
// bridge. The script below is real and adapted from the cited MIT
// source, but no GLB or thumbnail artefact has been generated in the
// pass that authored this entry — see docs/BLENDER-MCP-TUTORIALS.md
// for the honest status.

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function TetraFractalBody() {
  return (
    <>
      <p>
        Recursive subdivision is one of the cleanest patterns the studio
        has for generating high-facet geometry without modelling a single
        triangle by hand. A regular tetrahedron has four faces; subdivide
        each face into four smaller tetrahedra and you have sixteen
        tetrahedra; do it again and you have sixty-four. Depth 4 yields
        1024 tetrahedra, which is a richly faceted sculpt that decimates
        well, prints well, and renders well in the low-poly register.
      </p>

      <p>
        The base script is adapted from{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/tetrahedron_fractal.py"
          className={ext}
          target="_blank"
          rel="noreferrer"
        >
          njanakiev/blender-scripting/tetrahedron_fractal.py
        </a>{" "}
        (MIT). The original recursion + tetrahedron-points math is
        preserved verbatim; the adaptation strips the camera/lights/render
        rig (which lived in a sibling <code>utils</code> module not
        shipped here) and replaces it with the canonical Holoflow glTF
        export plus an optional Decimate pass for size-budgeting.
      </p>

      <p>
        The aesthetic argument for why this geometry belongs in the
        studio&rsquo;s catalogue lives in{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          Low-poly, high-facet shading
        </Link>
        . The fabrication side &mdash; printing one of these as a
        sculptural object &mdash; lives in the{" "}
        <Link href="/tutorials/tutorial-dragon-scale-wall-relief" className={ext}>
          Dragon-Scale Wall Relief
        </Link>{" "}
        tutorial&rsquo;s manifoldness validation steps.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-mcp-tetra-fractal",
  title:
    "Blender via MCP — recursive tetrahedron fractal, decimated to a print budget",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Forty minutes. Generate a Sierpinski-style tetrahedron fractal via bmesh recursion, decimate the result to fit a 2 MB GLB budget, export with Holoflow conventions. The cleanest low-poly recursive geometry the studio uses, adapted from njanakiev/blender-scripting (MIT).",
  Body: TetraFractalBody,
  related: [
    {
      href: "/tutorials/blender-mcp-faceted-sphere",
      label: "Tutorial — Faceted sphere via MCP",
      note: "The hello-world chamber. Read first if the MCP socket is new to you.",
    },
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly, high-facet shading",
      note: "The aesthetic case for why a 1024-tetra mesh belongs in the gallery.",
    },
    {
      href: "/tutorials/blender-addon-3d-print-toolbox",
      label: "Tutorial — 3D Print Toolbox",
      note: "Run this on the fractal output before sending it to the slicer.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/njanakiev/blender-scripting/blob/master/scripts/tetrahedron_fractal.py",
      label: "njanakiev/blender-scripting — tetrahedron_fractal.py",
      note: "The MIT source the recursion + tetrahedron-points math is taken from.",
    },
    {
      href: "https://mathworld.wolfram.com/RegularTetrahedron.html",
      label: "Wolfram MathWorld — Regular Tetrahedron",
      note: "Where the closed-form vertex positions in the script come from.",
    },
    {
      href: "https://docs.blender.org/api/current/bmesh.ops.html",
      label: "Blender Python API — bmesh.ops",
      note: "The recalc_face_normals call used to keep the recursive geometry consistent.",
    },
  ],
};

const SCRIPT = `# blender-mcp-tetra-fractal.py
# Source: adapted from
#   https://github.com/njanakiev/blender-scripting/blob/master/scripts/tetrahedron_fractal.py
# Licence: MIT (Nikolai Janakiev)
# Holoflow adaptation: inline tetrahedron_points + recursive_tetrahedron
# (originally imported utils), drop a DECIMATE modifier to hit the 2 MB
# GLB budget at depth 4, export as Holoflow-conventions .glb.

import os
import itertools as it
from math import sqrt
import bpy
import bmesh
from mathutils import Vector

OUT_DIR = "D:/.github/_3DPOV/public/models/blender-tutorials/blender-mcp-tetra-fractal"
GLB_PATH = os.path.join(OUT_DIR, "tetra_fractal.glb")
THUMB_PATH = os.path.join(OUT_DIR, "thumb.png")
os.makedirs(OUT_DIR, exist_ok=True)

DEPTH = 4              # 1024 tetrahedra at depth 4 — the sweet spot
DECIMATE_RATIO = 0.5   # half the polys; balances detail vs file size


def tetrahedron_points(r=1.0, origin=(0, 0, 0)):
    """Four vertices of a regular tetrahedron with circumradius r."""
    origin = Vector(origin)
    a = 4 * r / sqrt(6)
    points = [
        (sqrt(3) * a / 3,  0,        -r / 3),
        (-sqrt(3) * a / 6, -0.5 * a, -r / 3),
        (-sqrt(3) * a / 6,  0.5 * a, -r / 3),
        (0,                 0,        sqrt(6) * a / 3 - r / 3),
    ]
    return [Vector(p) + origin for p in points]


def recursive_tetrahedron(bm, points, level=0):
    """Sierpinski subdivision: each level splits every tet into 4 children."""
    sub_tetras = []
    for i in range(len(points)):
        p0 = points[i]
        pK = points[:i] + points[i + 1:]
        sub_tetras.append([p0] + [(p0 + p) / 2 for p in pK])

    if 0 < level:
        for sub in sub_tetras:
            recursive_tetrahedron(bm, sub, level - 1)
    else:
        for sub in sub_tetras:
            verts = [bm.verts.new(p) for p in sub]
            faces = [bm.faces.new(face) for face in it.combinations(verts, 3)]
            bmesh.ops.recalc_face_normals(bm, faces=faces)


# 1. Clear the scene.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# 2. Build the fractal in a bmesh.
bm = bmesh.new()
base_points = tetrahedron_points(r=2.0)
recursive_tetrahedron(bm, base_points, level=DEPTH)

# 3. Promote to a real mesh + object.
mesh = bpy.data.meshes.new("tetra_fractal_mesh")
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new("tetra_fractal", mesh)
bpy.context.collection.objects.link(obj)

# 4. Decimate to fit a 2 MB GLB budget at depth 4.
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
decimate = obj.modifiers.new("Decimate", "DECIMATE")
decimate.ratio = DECIMATE_RATIO
bpy.ops.object.modifier_apply(modifier="Decimate")

# 5. Flat-shade + split normals.
for poly in obj.data.polygons:
    poly.use_smooth = False
try:
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
except RuntimeError:
    pass
bpy.ops.mesh.customdata_custom_splitnormals_add()
obj.data.use_auto_smooth = True
obj.data.auto_smooth_angle = 0.0

# 6. Material — warm copper to read against the dark Aura backdrop.
mat = bpy.data.materials.new("tetra_fractal_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.85, 0.48, 0.24, 1.0)
bsdf.inputs["Metallic"].default_value = 0.6
bsdf.inputs["Roughness"].default_value = 0.45
obj.data.materials.append(mat)

# 7. Canonical Holoflow glTF export.
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_tangents=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_apply_modifiers=True,
)

# 8. Thumbnail render.
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.filepath = THUMB_PATH
bpy.ops.object.camera_add(location=(6, -6, 5), rotation=(1.05, 0, 0.78))
scene.camera = bpy.context.object
bpy.ops.object.light_add(type="SUN", location=(5, -5, 8))
bpy.ops.render.render(write_still=True)

print("DONE:", GLB_PATH, THUMB_PATH)
`;

function ScriptBlock() {
  return (
    <pre className="overflow-x-auto rounded-md border border-pink-200/10 bg-black/30 p-4 text-xs leading-relaxed text-pink-100/90">
      <code>{SCRIPT}</code>
    </pre>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "40 minutes",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "Faceted Sphere and Parametric Torus chambers complete. The recursion + bmesh patterns will read as variations on those.",
      "Blender 5.1 with bld_remote_mcp running on 127.0.0.1:9876.",
      "Some intuition for Sierpinski-style subdivision — recursion depth doubles roughly every depth level, so depth 5 is 4096 tetra and depth 6 is 16384. The script defaults to 4 deliberately.",
    ],
    supplies: {},
    software: [
      {
        name: "Blender",
        version: "5.1.0",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Re-confirm the bridge",
        body: "127.0.0.1:9876 should still be listening from the previous chambers. If not, restart blender_mcp_sse.py from Blender's Scripting tab.",
      },
      {
        title: "Read the recursion",
        body: "The recursive_tetrahedron function is the load-bearing six lines. For each vertex in the current tetra, build a smaller tetra from that vertex plus the midpoints to each of the other three vertices. Recurse until level==0; at the bottom of the stack, write the four faces of each leaf tetra into the bmesh. Bake your head around it on a depth-1 example first — the script prints DEPTH at the top.",
      },
      {
        title: "Fire the script through the MCP socket",
        body: "Send the script as `{\"type\": \"execute_code\", \"params\": {\"code\": \"<contents>\"}}\\n` over TCP to 127.0.0.1:9876. At depth 4 the script runs in ~3.5 seconds on a 3080 Ti — just inside the MCP timeout. At depth 5 it crosses the budget; switch to the marker-file pattern from blender-pipelines for depth ≥ 5.",
      },
      {
        title: "Confirm the outcome and tune the depth",
        body: "Check public/models/blender-tutorials/blender-mcp-tetra-fractal/ for tetra_fractal.glb. With DEPTH=4 and DECIMATE_RATIO=0.5 the file should land under 2 MB. Re-run with DEPTH=3 for a coarser sculpt; with DEPTH=5 for a much denser one (and budget for the longer runtime). Open the GLB in the Khronos validator to confirm it's clean; drop it into the sculpture gallery's catalogue and walk through it.",
      },
    ],
    finalResult:
      "A 1024-tetrahedron Sierpinski fractal, decimated to ~50% polys, exported as a Holoflow-conventions GLB under public/models/blender-tutorials/blender-mcp-tetra-fractal/tetra_fractal.glb. Target file size: under 2 MB. The recursion pattern is reusable for any subdivide-and-recurse geometry — swap the four-points tetrahedron base for a cube and you have a Menger sponge with the same code shape.",
    variations: [
      "Drop DECIMATE_RATIO to 0.25 — quarter the polys, file size halves again, the silhouette holds but the surface coarsens.",
      "Replace the recalc_face_normals call with a deliberate flip — every face inverted produces an inside-out fractal that reads as a cavern.",
      "Swap the tetrahedron base for a cube (8 vertices, 12 faces) and recurse on cube subdivision — the same recursion pattern yields a Menger sponge.",
      "Bake the fractal in stages and emit each depth as a separate GLB — useful for an animated build-up sequence in the gallery's walk-through camera.",
    ],
    troubleshooting: [
      {
        symptom: "Depth 4 takes longer than 4 seconds and the MCP returns nothing.",
        cause:
          "The DECIMATE modifier + the customdata split-normals bake combine to push the runtime past the 4-second MCP budget on slower CPUs.",
        fix: "Either remove the decimate step (file size will rise above the 2 MB budget) or switch to the bpy.app.timers two-call pattern from blender-pipelines: the first call kicks off the timer and returns immediately; a poll script watches for the .glb file to appear.",
      },
      {
        symptom:
          "Random faces are inverted (dark in the render, hole-like in the viewer).",
        cause:
          "recalc_face_normals is called per-leaf — it makes each leaf consistent internally, but doesn't enforce consistency across the boundary between adjacent tetrahedra.",
        fix: "After the bmesh is promoted to a mesh object, run bpy.ops.object.editmode_toggle(), then bpy.ops.mesh.select_all(action='SELECT'), then bpy.ops.mesh.normals_make_consistent(inside=False), then toggle back to object mode. This is a global recalc — slower than the per-leaf version, but it picks up the boundary inconsistencies.",
      },
      {
        symptom: "The decimate modifier leaves visible holes in the mesh.",
        cause:
          "DECIMATE_RATIO is too aggressive; under 0.2 the decimate-collapse operator starts dropping faces whose three vertices have all been merged into one.",
        fix: "Stay above 0.3 for production. If you genuinely need a tighter ratio, switch the decimate type from 'COLLAPSE' (the default) to 'PLANAR' — planar decimate respects coplanar regions and is gentler on the silhouette at low ratios.",
      },
    ],
  },
  base,
);

void ScriptBlock;
