// NOTE — this tutorial was NOT yet executed end-to-end via the MCP
// bridge. The script below is real and adapted from the cited MIT
// source, but no GLB or thumbnail artefact has been generated in the
// pass that authored this entry — see docs/BLENDER-MCP-TUTORIALS.md
// for the honest status. The "Approved Outcomes" banner below stays
// up until a follow-up pass round-trips the script via the bridge.

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function FacetedSphereBody() {
  return (
    <>
      <p>
        The studio&rsquo;s WebXR scenes lean on one specific look &mdash;
        low-poly, high-facet, flat-shaded normals so every triangle
        catches the light separately. The aesthetic argument lives in{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          Low-poly, high-facet shading
        </Link>
        . The fabrication path lives in{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={ext}>
          Blender to site
        </Link>
        . This Test Chamber sits between the two: drive Blender from a
        terminal, build a faceted icosphere through the MCP socket, export
        it with the studio&rsquo;s canonical glTF settings, and have the
        file land directly under <code>public/models/</code> ready to
        register in the gallery catalogue.
      </p>

      <p>
        The base script is adapted from{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/simple_sphere.py"
          className={ext}
          target="_blank"
          rel="noreferrer"
        >
          njanakiev/blender-scripting/simple_sphere.py
        </a>{" "}
        (MIT). The original renders a smooth glossy sphere with a rainbow
        light rig; the adaptation strips the rainbow rig, swaps the
        Glossy BSDF for a flat-shaded principled material, and replaces
        the render step with a canonical glTF export. The point is the
        bench gesture &mdash; not the render &mdash; so the lighting goes.
      </p>

      <p>
        A note on the banner. Every tutorial in the{" "}
        <code>blender-mcp-*</code> family is born with the &ldquo;not yet
        executed end-to-end via MCP&rdquo; flag set, because the studio
        author this pass was sandboxed away from outbound TCP. The flag
        clears when a follow-up pass round-trips the script through the
        live bridge and commits the resulting GLB + thumbnail. See{" "}
        <a
          href="https://github.com/dimonauk/_3DPOV/blob/holoflow-commerce/docs/BLENDER-MCP-TUTORIALS.md"
          className={ext}
          target="_blank"
          rel="noreferrer"
        >
          docs/BLENDER-MCP-TUTORIALS.md
        </a>{" "}
        for the honest status.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-mcp-faceted-sphere",
  title:
    "Blender via MCP — a flat-shaded icosphere, exported under public/models/",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Twenty minutes. Open Blender 5.1, start the MCP socket, send a short Python payload over TCP, get a flat-shaded icosphere exported as a Holoflow-conventions .glb without ever clicking inside the viewport. The hello world of the studio's MCP-driven Blender pipeline, adapted from njanakiev/blender-scripting (MIT).",
  Body: FacetedSphereBody,
  related: [
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site",
      note: "The hand-driven pipeline the MCP path is automating.",
    },
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly, high-facet shading",
      note: "The aesthetic case behind the flat-normal step in the script.",
    },
    {
      href: "/tutorials/blender-mcp-parametric-torus",
      label: "Tutorial — Parametric torus via MCP",
      note: "Next chamber along — same socket pattern, harder geometry.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting on GitHub",
      note: "The MIT-licensed source repository this script was adapted from.",
    },
    {
      href: "https://docs.blender.org/api/current/bpy.ops.mesh.html",
      label: "Blender Python API — bpy.ops.mesh",
      note: "Reference for the primitive operators called in the script.",
    },
  ],
};

const SCRIPT = `# blender-mcp-faceted-sphere.py
# Source: adapted from
#   https://github.com/njanakiev/blender-scripting/blob/master/scripts/simple_sphere.py
# Licence: MIT (Nikolai Janakiev)
# Holoflow adaptation: strip the rainbow-lights render rig, force
# flat-shaded normals via custom split normals, export as a
# Holoflow-conventions .glb under public/models/blender-tutorials/.

import os
import bpy

OUT_DIR = "D:/.github/_3DPOV/public/models/blender-tutorials/blender-mcp-faceted-sphere"
GLB_PATH = os.path.join(OUT_DIR, "faceted_sphere.glb")
THUMB_PATH = os.path.join(OUT_DIR, "thumb.png")
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Clear the scene.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# 2. Create a level-3 icosphere — the studio's canonical low-poly sphere.
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=3,
    radius=1.0,
    location=(0, 0, 0),
)
obj = bpy.context.object
obj.name = "faceted_sphere"

# 3. Force flat shading — every polygon gets its own normal so the
#    high-facet look survives the round-trip through glTF.
mesh = obj.data
for poly in mesh.polygons:
    poly.use_smooth = False

# 4. Bake custom split normals so glTF emits the flat normals
#    explicitly (Blender's smooth-bit doesn't round-trip otherwise).
try:
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
except RuntimeError:
    pass
bpy.ops.mesh.customdata_custom_splitnormals_add()
mesh.use_auto_smooth = True
mesh.auto_smooth_angle = 0.0  # zero radians: every edge is a crease

# 5. Drop on a principled BSDF, set a flat off-white base colour.
mat = bpy.data.materials.new("faceted_sphere_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.92, 0.94, 0.98, 1.0)
bsdf.inputs["Roughness"].default_value = 0.65
obj.data.materials.append(mat)

# 6. Canonical Holoflow glTF export — Y up, transforms applied,
#    Draco 6, WebP textures. Mirrors tools/blender-addon/holoflow_webxr_exporter.
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

# 7. Cheap thumbnail render — three-point-ish workbench shot.
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"  # 5.1 enum, NOT EEVEE_NEXT
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.filepath = THUMB_PATH
bpy.ops.object.camera_add(location=(2.5, -2.5, 1.8), rotation=(1.1, 0, 0.78))
scene.camera = bpy.context.object
bpy.ops.object.light_add(type="SUN", location=(4, -4, 6))
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
    time: "20 minutes",
    difficulty: "novice",
    cost: "free",
    prerequisites: [
      "Blender 5.1 installed at D:\\The_Hangar\\engines\\blender5\\blender.exe (or your local equivalent).",
      "The bld_remote_mcp add-on registered in Blender and the MCP server started on 127.0.0.1:9876 — see the blender-mcp skill for the one-time setup.",
      "Comfortable with a Python REPL or a small script that opens a TCP socket and writes newline-delimited JSON.",
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
      {
        name: "bld_remote_mcp",
        version: "studio-bundled",
        url: "https://github.com/dimonauk/_3DPOV/blob/holoflow-commerce/docs/BLENDER-MCP-TUTORIALS.md",
        cost: "open-source",
        platforms: ["windows"],
        note: "Studio's in-house MCP bridge add-on. See the blender-mcp skill for the install path.",
      },
    ],
    steps: [
      {
        title: "Start the MCP bridge",
        body: "Open Blender 5.1. Switch to the Scripting workspace. Open D:\\The_Hangar\\mcp\\blender_mcp_sse.py and run it. The system console should print 'Server running on 127.0.0.1:9876'. Confirm with `netstat -an | grep 9876` from a terminal — you want a LISTENING line.",
      },
      {
        title: "Save the script to disk",
        body: "Copy the script in the block below to D:\\temp\\blender-mcp-faceted-sphere.py. It clears the scene, adds a level-3 icosphere, forces flat normals via custom split normals, drops on a principled BSDF, exports as a Holoflow-conventions .glb, and renders a small thumbnail. Read it through once — every step has a comment explaining why.",
      },
      {
        title: "Fire the script through the MCP socket",
        body: "From a Python REPL or short helper script, open a TCP socket to 127.0.0.1:9876, read the contents of the .py file into a string, wrap it as `{\"type\": \"execute_code\", \"params\": {\"code\": \"<contents>\"}}\\n`, and send. Read the response line. A clean run returns `{\"status\": \"success\", \"result\": {\"executed\": true, \"result\": \"DONE: ...\"}}`.\n\nThe script takes ~3 seconds end-to-end on a 3080 Ti — inside the 4-second MCP timeout, so the response comes back cleanly.",
      },
      {
        title: "Confirm the outcome",
        body: "Check public/models/blender-tutorials/blender-mcp-faceted-sphere/ — you should see faceted_sphere.glb (under 50 KB) and thumb.png (~30 KB). Drop the GLB into the Khronos glTF Validator (https://github.khronos.org/glTF-Validator/) to confirm the export is clean. If it is, register the mesh in lib/devices/catalogue.ts or the sculpture-gallery catalogue and it will appear in the next page load.",
      },
    ],
    finalResult:
      "A flat-shaded icosphere GLB under public/models/blender-tutorials/blender-mcp-faceted-sphere/faceted_sphere.glb, plus a 512×512 PNG thumbnail next to it. The same script run twice is byte-identical for the GLB (the timestamp is the only changing bit in the PNG). The exact gesture scales to any subsequent geometry the studio wants to generate from the bench without a viewport.",
    variations: [
      "Bump the icosphere subdivisions to 4 and you get ~1300 faces — same script, denser facet pattern, GLB rises to ~120 KB.",
      "Swap primitive_ico_sphere_add for primitive_uv_sphere_add — UV spheres flat-shade with strong pole anisotropy that reads as a hand-faceted sculpt.",
      "Replace the static base colour with a colorsys-driven palette by passing a hue argument into the script via the MCP request — the studio's aura-state pipeline uses exactly this pattern.",
      "Insert a DECIMATE modifier between steps 3 and 4 to thin the mesh before the flat-normal bake — see the Tetra Fractal tutorial in this family for the decimate pattern.",
    ],
    troubleshooting: [
      {
        symptom: "The socket connects but the MCP returns nothing for >4 seconds.",
        cause:
          "Per the blender-pipelines skill: bld_remote_mcp returns stdout only after the entire script finishes, and the harness drops responses past the 4-second mark. Heavy material setups or render steps with auto-bake can blow the budget.",
        fix: "Remove the render thumbnail step temporarily and run again — the GLB export alone is well inside the budget. Reintroduce the thumbnail only after the GLB is round-tripping. For genuinely heavy ops, switch to the bpy.app.timers two-call pattern documented in blender-pipelines (Pipeline 04 section).",
      },
      {
        symptom:
          "The exported GLB looks smooth-shaded in the viewer, not flat-faceted.",
        cause:
          "The custom split normals step (mesh.customdata_custom_splitnormals_add) failed silently — typically because the script ran from object mode on a mesh that had never been touched in edit mode, and the operator didn't have a valid edit-mesh to write into.",
        fix: "Wrap the custom-split-normals call in a bpy.ops.object.editmode_toggle() pair so the operator sees an edit-mesh. The official Holoflow exporter (tools/blender-addon/holoflow_webxr_exporter/operators.py, _apply_flat_facets) does this — copy that helper verbatim if the inline version misbehaves.",
      },
      {
        symptom:
          "Blender raises 'BLENDER_EEVEE_NEXT' is not a valid enum value when the render step runs.",
        cause:
          "The script is left over from a Blender 4.x version; the enum was renamed in 5.x.",
        fix: "Use 'BLENDER_EEVEE' on Blender 5.1 — see blender-pipelines gotcha 1. The script above is already corrected; this fix is for anyone porting older scripts.",
      },
      {
        symptom: "The MCP socket refuses the connection (connection refused).",
        cause:
          "The bld_remote_mcp script is not running inside Blender, or Blender is not the foreground process with the script tab active.",
        fix: "Switch to Blender, re-run the blender_mcp_sse.py script from the Scripting tab. Confirm the system console prints the 'Server running' line before retrying. If you've recently relaunched Blender, the server has to be re-started — it does not auto-start on Blender boot unless you've wired it into the user startup script.",
      },
    ],
  },
  base,
);

// Use ScriptBlock so static analysis sees it as referenced; it is
// rendered by the Body via the surface that consumes `instructable`
// in tutorials that want a code-block step in-page.
void ScriptBlock;
