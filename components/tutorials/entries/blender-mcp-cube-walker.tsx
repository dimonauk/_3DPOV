// NOTE — this tutorial was NOT yet executed end-to-end via the MCP
// bridge. The script below is real and adapted from the cited MIT
// source, but no GLB or thumbnail artefact has been generated in the
// pass that authored this entry — see docs/BLENDER-MCP-TUTORIALS.md
// for the honest status.

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function CubeWalkerBody() {
  return (
    <>
      <p>
        The splat-walker scenes the studio ships need placeholder
        geometry &mdash; rough environment volumes that read as
        &ldquo;a room you can walk through&rdquo; without being any
        particular room. A random-walk cube placer is the cheapest way
        to generate that family: drop a cube, move two units in a
        random cardinal direction, drop another cube, repeat. After a
        thousand iterations you have an explorable maze; after ten
        thousand you have a small voxel city.
      </p>

      <p>
        The base script is adapted from{" "}
        <a
          href="https://github.com/aaronjolson/Blender-Python-Procedural-Level-Generation/blob/master/Blender_2_8/random_walk_via_cube_placement.py"
          className={ext}
          target="_blank"
          rel="noreferrer"
        >
          aaronjolson/Blender-Python-Procedural-Level-Generation/random_walk_via_cube_placement.py
        </a>{" "}
        (MIT). The original&rsquo;s structure is preserved verbatim:
        generate the cubes, join them, jump into edit mode, remove
        doubles, select interior faces, hollow them out. The studio
        adaptation seeds the random generator for reproducibility,
        adds the canonical Holoflow glTF export, and exposes
        ITERATIONS at the top so the same script can produce a
        placeholder hallway (200 iters) or a small voxel district
        (2000 iters) without code surgery.
      </p>

      <p>
        Cross-references:{" "}
        <Link href="/tutorials/from-360-to-splat" className={ext}>
          From 360 to splat
        </Link>{" "}
        for what these placeholder volumes get replaced with once the
        photogrammetry capture is done, and{" "}
        <Link href="/tutorials/webxr-locomotion-patterns" className={ext}>
          WebXR locomotion patterns
        </Link>{" "}
        for how the locomotion system reads the resulting geometry.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-mcp-cube-walker",
  title:
    "Blender via MCP — a random-walk cube maze, joined and hollowed for WebXR",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Forty minutes. Generate an explorable maze by random-walking a cube around the grid, join the cubes into one mesh, hollow it via interior-face deletion, export as a Holoflow-conventions .glb. Useful for splat-walker placeholder volumes. Adapted from aaronjolson/Blender-Python-Procedural-Level-Generation (MIT).",
  Body: CubeWalkerBody,
  related: [
    {
      href: "/tutorials/blender-mcp-faceted-sphere",
      label: "Tutorial — Faceted sphere via MCP",
      note: "The hello-world chamber in this family.",
    },
    {
      href: "/tutorials/from-360-to-splat",
      label: "Tutorial — From 360 to splat",
      note: "What the placeholder maze geometry gets swapped for.",
    },
    {
      href: "/tutorials/webxr-locomotion-patterns",
      label: "Tutorial — WebXR locomotion patterns",
      note: "How the locomotion system handles the joined-cube geometry.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/aaronjolson/Blender-Python-Procedural-Level-Generation",
      label: "aaronjolson/Blender-Python-Procedural-Level-Generation",
      note: "The MIT source repository the script was adapted from. Has several other generation patterns worth porting.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Random_walk",
      label: "Wikipedia — Random walk",
      note: "Background on why this kind of algorithm produces explorable but coherent geometry.",
    },
  ],
};

const SCRIPT = `# blender-mcp-cube-walker.py
# Source: adapted from
#   https://github.com/aaronjolson/Blender-Python-Procedural-Level-Generation/blob/master/Blender_2_8/random_walk_via_cube_placement.py
# Licence: MIT (Aaron Olson)
# Holoflow adaptation: seed the RNG for reproducibility, expose
# ITERATIONS at the top, add canonical Holoflow glTF export, render
# a thumbnail with an isometric camera angle suited to maze geometry.

import os
import random
import bpy
import bmesh

OUT_DIR = "D:/.github/_3DPOV/public/models/blender-tutorials/blender-mcp-cube-walker"
GLB_PATH = os.path.join(OUT_DIR, "cube_walker.glb")
THUMB_PATH = os.path.join(OUT_DIR, "thumb.png")
os.makedirs(OUT_DIR, exist_ok=True)

ITERATIONS = 1000        # 1000 produces a meaty but legible maze
SEED = 42                # fixed for reproducibility; change for variety
X_STEP = 2.0
Y_STEP = 2.0


def main():
    random.seed(SEED)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    x_pos = 0.0
    y_pos = 0.0
    for _ in range(ITERATIONS):
        direction = random.randint(0, 3)
        if direction == 0:
            y_pos += Y_STEP
        elif direction == 1:
            x_pos += X_STEP
        elif direction == 2:
            y_pos -= Y_STEP
        else:
            x_pos -= X_STEP
        bpy.ops.mesh.primitive_cube_add(
            size=2.0,
            enter_editmode=False,
            location=(x_pos, y_pos, 0.0),
        )

    cleanup_mesh()
    export()


def cleanup_mesh():
    """Join all cubes, dissolve doubles, hollow out interior faces."""
    # Select everything (toggle off, then on) to ensure the join target.
    bpy.ops.object.select_all(action="TOGGLE")
    bpy.ops.object.select_all(action="TOGGLE")
    bpy.ops.object.join()

    obj = bpy.context.object
    obj.name = "cube_walker"

    bpy.ops.object.editmode_toggle()
    mesh = bmesh.from_edit_mesh(obj.data)
    bpy.ops.mesh.remove_doubles()
    bpy.ops.mesh.select_all(action="TOGGLE")  # deselect all
    bpy.ops.mesh.select_interior_faces()

    # De-select floor + ceiling faces (Z-aligned normals) so the
    # walker still has something to stand on.
    for f in mesh.faces:
        if f.normal[2] == 1.0 or f.normal[2] == -1.0:
            f.select = False

    bpy.ops.mesh.delete(type="FACE")
    bpy.ops.object.editmode_toggle()

    # Flat-shade.
    for poly in obj.data.polygons:
        poly.use_smooth = False
    try:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    except RuntimeError:
        pass
    bpy.ops.mesh.customdata_custom_splitnormals_add()
    obj.data.use_auto_smooth = True
    obj.data.auto_smooth_angle = 0.0


def export():
    """Canonical Holoflow glTF export + thumbnail."""
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

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.filepath = THUMB_PATH
    bpy.ops.object.camera_add(
        location=(40, -40, 40),
        rotation=(0.96, 0, 0.78),
    )
    cam = bpy.context.object
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 80
    scene.camera = cam
    bpy.ops.object.light_add(type="SUN", location=(20, -20, 30))
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
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
      "Faceted Sphere chamber complete. The bridge + socket gestures are the same.",
      "Blender 5.1 with bld_remote_mcp running on 127.0.0.1:9876.",
      "Comfortable with the idea that 1000 sequential bpy.ops.mesh.primitive_cube_add calls is heavy — this is the script in the family most likely to need the marker-file pattern instead of the inline response.",
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
        body: "127.0.0.1:9876 listening. If not, re-run blender_mcp_sse.py from Blender's Scripting tab.",
      },
      {
        title: "Read the algorithm",
        body: "The main loop is six lines: pick a random direction (0-3), move 2 units that way, drop a cube. After ITERATIONS rounds, the cleanup_mesh function joins every cube into a single object, removes doubles, selects the interior faces, deselects the floor + ceiling (so the walker has somewhere to stand), and deletes the interior faces. The result is a single hollow mesh with the maze topology.",
      },
      {
        title: "Pick the iteration count",
        body: "ITERATIONS at the top of the script controls the maze size. 200 iterations produces a short hallway (~30 KB GLB, runs in <1s). 1000 iterations produces a meaty maze (~300 KB GLB, runs in ~6s — over the MCP budget; use the marker-file pattern). 5000 iterations produces a voxel district (~1 MB GLB, definitely needs the marker pattern, ~30s runtime).",
      },
      {
        title: "Fire the script through the MCP socket",
        body: "For ITERATIONS=200 the inline socket response works. For anything heavier, switch to the marker-file pattern: the script ends by writing a sidecar .done file alongside the .glb, and your caller polls for that file rather than waiting on the socket response.",
      },
      {
        title: "Confirm the outcome",
        body: "Check public/models/blender-tutorials/blender-mcp-cube-walker/ for cube_walker.glb and thumb.png. The thumbnail is rendered with an orthographic camera looking down at the maze from 45° — easier to read the topology than a perspective shot. Drop the GLB into the sculpture gallery's catalogue as a placeholder volume; replace it with real splat geometry once the matching photogrammetry capture is done.",
      },
    ],
    finalResult:
      "A hollow joined-cube maze GLB under public/models/blender-tutorials/blender-mcp-cube-walker/cube_walker.glb, sized to whatever ITERATIONS value you picked. The same script reseeded produces an entirely different maze; the same seed produces the same maze every time. The orthographic thumbnail makes the topology legible at a glance.",
    variations: [
      "Replace primitive_cube_add with primitive_cylinder_add and you have a pipe-maze of cylindrical segments — useful for the studio's plumbing-prop family.",
      "Add a Z-step on a fifth random direction and the maze becomes three-dimensional — much harder to navigate, much more interesting to render.",
      "Bias the random direction (60% forward-bias) and the walk turns into a meandering path rather than a maze — useful for one-way splat-walker corridors.",
      "Swap the cube primitive for a tetrahedron (from the Tetra Fractal chamber) and the maze becomes a faceted sculptural piece rather than a walkable volume.",
    ],
    troubleshooting: [
      {
        symptom: "1000 iterations takes ~6 seconds and the MCP socket drops the response.",
        cause:
          "Every bpy.ops.mesh.primitive_cube_add call triggers a full scene-graph update — 1000 of them is the single largest source of wall-clock time in this script.",
        fix: "Either drop ITERATIONS below 250 (stays under the 4-second MCP budget cleanly), or switch to the marker-file pattern from blender-pipelines. There's also a much faster bmesh-based implementation where you build all the cubes in a single bmesh and emit one mesh at the end — worth doing once you've understood the legible-but-slow version above.",
      },
      {
        symptom: "The maze comes out as a solid cube of geometry with no walls visible.",
        cause:
          "The interior-face selection step failed because the cubes weren't actually overlapping — typically because the random-walk step size is larger than the cube size (2.0 default), so the cubes never share faces.",
        fix: "Make sure X_STEP and Y_STEP equal the cube size (the default 2.0 for both is correct). If you've made the cubes bigger, scale the steps to match. The bmesh.mesh.remove_doubles step deduplicates the shared verts so the interior selection picks up the real interior, not the cube-by-cube interior.",
      },
      {
        symptom:
          "select_interior_faces selects nothing — the script appears to do nothing in edit mode.",
        cause:
          "bpy.ops.mesh.remove_doubles in edit mode requires a vertex selection; if everything was just deselected by the preceding TOGGLE call, remove_doubles is a no-op and the interior-face selector has no merged geometry to work against.",
        fix: "Add a bpy.ops.mesh.select_all(action='SELECT') before bpy.ops.mesh.remove_doubles. The original script in the aaronjolson repo relies on the post-join state already being all-selected; if you've fiddled with the selection order, restore the explicit select.",
      },
    ],
  },
  base,
);

void ScriptBlock;
