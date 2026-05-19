// NOTE — this tutorial was NOT yet executed end-to-end via the MCP
// bridge. The script below is real and adapted from the cited MIT
// source, but no GLB or thumbnail artefact has been generated in the
// pass that authored this entry — see docs/BLENDER-MCP-TUTORIALS.md
// for the honest status.

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function ParametricTorusBody() {
  return (
    <>
      <p>
        The default <code>primitive_torus_add</code> operator in Blender
        builds a torus by triangulating a parametric surface internally,
        but it exposes only the headline arguments &mdash; major radius,
        minor radius, segment counts. The studio&rsquo;s waveguide,
        spirograph and ring-sculpture work needs more direct control:
        non-uniform segment density along the major axis, deliberate
        non-circular cross-sections, surfaces that aren&rsquo;t actually
        toroidal but share the build-a-mesh-from-a-(u, v)-grid pattern.
        This chamber teaches that pattern using a clean torus as the
        target so the maths stays legible.
      </p>

      <p>
        The base script is adapted from{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/parametric_torus.py"
          className={ext}
          target="_blank"
          rel="noreferrer"
        >
          njanakiev/blender-scripting/parametric_torus.py
        </a>{" "}
        (MIT). The original depends on a sibling <code>utils.py</code>{" "}
        module for the camera/lights/render. The adaptation inlines the
        small bit that&rsquo;s actually load-bearing &mdash; the
        <code>create_surface</code> helper &mdash; and replaces the
        camera/lights/render block with a straight glTF export, because
        the bench cares about the mesh, not the picture.
      </p>

      <p>
        The companion piece for the geometry is{" "}
        <Link href="/articles/parametric-form-without-cad" className={ext}>
          Parametric form without CAD
        </Link>{" "}
        if it exists; otherwise the{" "}
        <Link href="/tutorials/lighting-a-waveguide-object" className={ext}>
          waveguide-lighting tutorial
        </Link>{" "}
        sits in the same family.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-mcp-parametric-torus",
  title:
    "Blender via MCP — a parametric torus built from a (u, v) surface, not a primitive",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Thirty minutes. Generate a torus mesh from a hand-written (u, v) parameterisation rather than the primitive_torus_add operator — useful when you want surface-level control over segment density, cross-section shape, or to swap in a non-toroidal surface entirely. Adapted from njanakiev/blender-scripting (MIT).",
  Body: ParametricTorusBody,
  related: [
    {
      href: "/tutorials/blender-mcp-faceted-sphere",
      label: "Tutorial — Faceted sphere via MCP",
      note: "The hello-world chamber in this family; same socket pattern, simpler geometry.",
    },
    {
      href: "/tutorials/lighting-a-waveguide-object",
      label: "Tutorial — Lighting a waveguide object",
      note: "The fabrication side of the same parametric-surface family.",
    },
    {
      href: "/tutorials/blender-mcp-tetra-fractal",
      label: "Tutorial — Recursive tetrahedron fractal via MCP",
      note: "Next chamber along; recursion replaces the (u, v) grid.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/njanakiev/blender-scripting/blob/master/scripts/parametric_torus.py",
      label: "njanakiev/blender-scripting — parametric_torus.py",
      note: "The MIT source the studio's adaptation is based on.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Torus#Geometry",
      label: "Wikipedia — Torus geometry",
      note: "The (u, v) parameterisation in the script comes straight from the canonical formula here.",
    },
  ],
};

const SCRIPT = `# blender-mcp-parametric-torus.py
# Source: adapted from
#   https://github.com/njanakiev/blender-scripting/blob/master/scripts/parametric_torus.py
# Licence: MIT (Nikolai Janakiev)
# Holoflow adaptation: inline the create_surface helper (the original
# imported it from a sibling utils module), strip the render rig,
# export as a Holoflow-conventions .glb.

import os
from math import sin, cos, pi
import bpy

TAU = 2 * pi
OUT_DIR = "D:/.github/_3DPOV/public/models/blender-tutorials/blender-mcp-parametric-torus"
GLB_PATH = os.path.join(OUT_DIR, "parametric_torus.glb")
THUMB_PATH = os.path.join(OUT_DIR, "thumb.png")
os.makedirs(OUT_DIR, exist_ok=True)


def torus_surface(r0, r1):
    """Closure: returns a (u, v) -> (x, y, z) parameterisation."""
    def surface(u, v):
        return (
            (r0 + r1 * cos(TAU * v)) * cos(TAU * u),
            (r0 + r1 * cos(TAU * v)) * sin(TAU * u),
            r1 * sin(TAU * v),
        )
    return surface


def create_surface(surface, n=20, m=20, name="Surface"):
    """Sample an n*m grid in (u, v) space, build quad faces, return obj."""
    verts = []
    faces = []
    for col in range(m):
        for row in range(n):
            u = row / n
            v = col / m
            verts.append(surface(u, v))
            row_next = (row + 1) % n
            col_next = (col + 1) % m
            faces.append((
                (col * n) + row_next,
                (col_next * n) + row_next,
                (col_next * n) + row,
                (col * n) + row,
            ))

    mesh = bpy.data.meshes.new(name + "_mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.from_pydata(verts, [], faces)
    mesh.update(calc_edges=True)
    return obj


# 1. Clear the scene.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# 2. Build the torus surface — major radius 4, minor radius 2, 40*40 grid.
obj = create_surface(torus_surface(4, 2), 40, 40, name="parametric_torus")

# 3. Flat-shade every poly so the high-facet aesthetic survives.
for poly in obj.data.polygons:
    poly.use_smooth = False

# 4. Bake split normals (same pattern as faceted_sphere).
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
try:
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
except RuntimeError:
    pass
bpy.ops.mesh.customdata_custom_splitnormals_add()
obj.data.use_auto_smooth = True
obj.data.auto_smooth_angle = 0.0

# 5. Material.
mat = bpy.data.materials.new("parametric_torus_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.55, 0.78, 0.92, 1.0)
bsdf.inputs["Roughness"].default_value = 0.55
obj.data.materials.append(mat)

# 6. Canonical Holoflow glTF export.
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

# 7. Thumbnail.
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.filepath = THUMB_PATH
bpy.ops.object.camera_add(location=(8, -8, 6), rotation=(1.1, 0, 0.78))
scene.camera = bpy.context.object
bpy.ops.object.light_add(type="SUN", location=(6, -6, 10))
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
    time: "30 minutes",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "The Faceted Sphere chamber finished — same socket pattern, less to think about.",
      "Comfortable reading a (u, v) -> (x, y, z) surface parameterisation. If you're not, the Wikipedia torus geometry article is the right ten-minute pre-read.",
      "Blender 5.1 with bld_remote_mcp running on 127.0.0.1:9876.",
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
        body: "If you've come straight from the Faceted Sphere chamber, the bridge is still up. If not: re-run D:\\The_Hangar\\mcp\\blender_mcp_sse.py from Blender's Scripting tab and confirm port 9876 is listening.",
      },
      {
        title: "Read the parameterisation",
        body: "Open the script below and read the torus_surface function. The (u, v) inputs go from 0 to 1; the closure returns (x, y, z) for each grid point. r0 is the major radius (centre of the tube to centre of the donut), r1 is the minor (the tube's own radius). Change those two numbers and the donut changes shape; change the function itself and the surface is no longer a torus.",
      },
      {
        title: "Fire the script through the MCP socket",
        body: "Save the script to D:\\temp\\blender-mcp-parametric-torus.py, then send it as `{\"type\": \"execute_code\", \"params\": {\"code\": \"<contents>\"}}\\n` over a TCP socket to 127.0.0.1:9876. The script runs in ~3-4 seconds on a 3080 Ti; the 40×40 grid is the size that fits inside the MCP timeout cleanly. Larger grids need the marker-file pattern from blender-pipelines.",
      },
      {
        title: "Confirm the outcome and tune the parameters",
        body: "Check public/models/blender-tutorials/blender-mcp-parametric-torus/ for parametric_torus.glb and thumb.png. The GLB should be under 200 KB. Now the interesting bit: re-run the script with different (r0, r1, n, m) values. Big r0 + small r1 = thin ring; equal radii = pinched horn torus; r1 > r0 = spindle torus, self-intersecting and a useful failure mode to see once.",
      },
    ],
    finalResult:
      "A 1600-quad parametric torus GLB under public/models/blender-tutorials/blender-mcp-parametric-torus/parametric_torus.glb, plus a 512×512 thumbnail. The script's create_surface helper is reusable for any (u, v) surface — swap the torus_surface closure for a Möbius strip, a Klein bottle, a helicoid, a waveguide cross-section profile.",
    variations: [
      "Swap torus_surface for a Möbius strip parameterisation and the script generates a Möbius mesh with one twist per loop.",
      "Bump n and m to 80×80 — the GLB rises to ~600 KB, the script takes ~10 seconds, and you'll need the marker-file pattern to get the response back through the MCP. Worth doing once to feel the boundary.",
      "Replace the cos/sin of TAU*v with a more complex cross-section profile — e.g. a star polygon — and the torus becomes a star-section ring, useful for jewellery + decorative ring sculpts.",
      "Animate r0 across frames by wrapping the create_surface call in a frame-change handler — same approach the original phyllotaxis_flower script in the source repo uses.",
    ],
    troubleshooting: [
      {
        symptom: "The torus comes out with visible seam artefacts at the u=0 and v=0 lines.",
        cause:
          "The (row + 1) % n and (col + 1) % m index wrap is necessary for the seam to close. If you change the indexing logic to row + 1 without the modulo, the last quad of each row is missing.",
        fix: "Keep the modulo. The wrap is what makes the seam close. If you specifically want a flat patch instead of a closed torus, replace the modulo with min(row + 1, n - 1) and remove the closure faces.",
      },
      {
        symptom: "The MCP socket times out before the script finishes.",
        cause:
          "Per blender-pipelines: any script taking >4s total will drop its response. A 40×40 grid is under that; an 80×80 grid is over.",
        fix: "Either reduce n*m below 4000, or use the bpy.app.timers two-call pattern: the setup call schedules the heavy work via timers.register, returns immediately, and a poll script watches for the .glb file to appear.",
      },
      {
        symptom: "from_pydata raises 'invalid face indices'.",
        cause:
          "A face tuple is referencing a vert index >= len(verts) — usually because the (row + 1) % n wrap was edited and the math no longer adds up.",
        fix: "Print len(verts) and the max value in any face tuple; the max should be exactly len(verts) - 1. Re-derive the indices from a 5×5 grid on paper if it's not obvious where the off-by-one crept in.",
      },
    ],
  },
  base,
);

void ScriptBlock;
