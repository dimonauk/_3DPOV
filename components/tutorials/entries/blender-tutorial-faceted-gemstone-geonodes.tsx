import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function GemstoneBody() {
  return (
    <>
      <p>
        A flat-shaded faceted mesh catches light the way a cut stone does:
        not gradually, not diffusely, but all at once per face, then dark
        again as the angle shifts. The visual register is crystalline, almost
        lapidary &mdash; and it is achieved entirely by refusing to smooth. This
        tutorial builds a gemstone from a UV sphere using Blender&nbsp;5.1&rsquo;s
        Python API and bmesh, introduces the Geometry Nodes parametric interface
        that replaced the 3.x socket API in Blender&nbsp;4.0, and exports a
        clean Draco-compressed GLB for immediate use in a WebXR scene.
      </p>

      <p>
        The gem is a sapphire-blue Principled BSDF with IOR&nbsp;2.42 and
        near-zero roughness. The specular peak on each flat triangular face is
        sharp enough to read as a glint at WebXR rendering distances. No baking,
        no texture maps, no post-process required &mdash; the geometry does the
        visual work, which is precisely the low-poly-high-facet principle the
        studio leans into throughout its sculpture gallery and prop library.
      </p>

      <p>
        If you have not yet wired a Blender mesh into a WebXR scene, read the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={ext}>
          Blender-to-site asset pipeline tutorial
        </Link>{" "}
        first. The export step here follows the same conventions &mdash; Y-up,
        Draco&nbsp;level&nbsp;6, WebP, snake_case root name. The aesthetic
        argument for the flat-shaded crystal read lives in the article{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          Low-poly, high-facet shading
        </Link>
        , and the studio&rsquo;s approach to building whole art-directed worlds
        around this register is in{" "}
        <Link href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds" className={ext}>
          Cohesive low-poly cell-shaded VRM worlds
        </Link>
        .
      </p>

      <p>
        The same flat-facet principle that makes the gemstone glitter is the one
        that makes a 3D-printed{" "}
        <Link href="/tutorials/tutorial-dragon-scale-wall-relief" className={ext}>
          dragon-scale wall panel
        </Link>{" "}
        catch the room&rsquo;s light from a shallow angle &mdash; discrete
        faces, each reflecting independently. The difference is that the gem
        exploits this in three dimensions simultaneously; the panel works in
        a single layer. Both are{" "}
        <Link href="/codex/fdm-printing" className={ext}>
          FDM printable
        </Link>{" "}
        if you want a physical object from the same mesh.
      </p>

      <p>
        Outside sources: the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/convex_hull.html"
          className={ext}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Geometry Nodes: Convex Hull
        </a>{" "}
        (Blender Foundation and Contributors, CC-BY-4.0) covers the GN Convex
        Hull node in depth; the GN technique in this tutorial is informed by but
        distinct from the manual example. The Blender Foundation also maintains{" "}
        <a
          href="https://studio.blender.org"
          className={ext}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Studio
        </a>{" "}
        and the{" "}
        <a
          href="https://github.com/blender/blender-addons"
          className={ext}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-addons repository
        </a>
        .{" "}
        <a
          href="https://github.com/carson-katri/geometry-script"
          className={ext}
          target="_blank"
          rel="noopener noreferrer"
        >
          geometry-script
        </a>{" "}
        by Carson Katri (MIT) is a Python-like scripting layer over Geometry
        Nodes worth studying alongside the raw API; Katri&rsquo;s{" "}
        <a
          href="https://github.com/carson-katri/dream-textures"
          className={ext}
          target="_blank"
          rel="noopener noreferrer"
        >
          dream-textures
        </a>{" "}
        add-on is a related project from the same author.
      </p>
    </>
  );
}

const base: Entry = {
  slug:    "blender-tutorial-faceted-gemstone-geonodes",
  title:   "Faceted gemstone — UV sphere to gem via bmesh and Geometry Nodes",
  date:    "2026-05-19",
  kind:    "tutorial",
  excerpt:
    "Build a sapphire-cut gem from a UV sphere in Blender 5.1: crown, girdle, and pavilion shaped by bmesh zone selection, flat-shaded to catch light per facet, Principled BSDF at IOR 2.42, Geometry Nodes parametric sliders via the 5.x interface API, exported as Draco GLB.",
  Body:    GemstoneBody,
  related: [
    { href: "/tutorials/blender-to-site-asset-pipeline",       label: "Blender-to-site asset pipeline" },
    { href: "/articles/low-poly-high-facet-shading",           label: "Low-poly, high-facet shading" },
    { href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds", label: "Cohesive low-poly VRM worlds" },
    { href: "/tutorials/tutorial-dragon-scale-wall-relief",    label: "Dragon-scale wall relief" },
    { href: "/codex/fdm-printing",                             label: "FDM printing (codex)" },
  ],
  furtherReading: [
    {
      href:  "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/",
      label: "Blender Manual — Geometry Nodes",
      note:  "Blender Foundation, CC-BY-4.0",
    },
    {
      href:  "https://github.com/carson-katri/geometry-script",
      label: "geometry-script by Carson Katri",
      note:  "MIT licence — Python-like GN scripting layer",
    },
    {
      href:  "https://docs.blender.org/api/current/bpy.types.html",
      label: "Blender Python API Reference",
      note:  "Blender Foundation, CC-BY-4.0",
    },
  ],
};

export const entry = buildInstructable(
  {
    time:       "one focused session of 45–90 minutes",
    difficulty: "intermediate",
    cost:       "free — Blender 5.1 is open-source",
    prerequisites: [
      "Blender 5.1 installed (blender.org — GPL + CC0 assets)",
      "Comfortable with Object mode / Edit mode tab-switching",
      "Basic familiarity with the Properties panel (materials tab, modifier tab)",
      "Python Scripting workspace enabled (Edit → Preferences → Interface → Python Tooltips is helpful)",
    ],
    software: [
      {
        name:      "Blender",
        version:   "5.1",
        url:       "https://www.blender.org/download/",
        cost:      "open-source",
        platforms: ["windows", "macos", "linux"],
        note:      "EEVEE Next is the default renderer in 5.x — no additional setup needed.",
      },
    ],
    supplies: {
      materials: [],
      tools: [
        {
          name: "blueprint.py",
          note: "Production script — headless execution outputs .blend + .glb",
          url:  "https://github.com/dimonauk/_3dpov/blob/main/public/library/blends/procedural/faceted-gemstone-geonodes/blueprint.py",
        },
        {
          name: "record.py",
          note: "Viewport animation script — outputs viewport.mp4",
          url:  "https://github.com/dimonauk/_3dpov/blob/main/public/library/blends/procedural/faceted-gemstone-geonodes/record.py",
        },
      ],
    },
    steps: [
      {
        title: "Open Blender 5.1 and clear the default scene",
        body:  "Launch Blender 5.1. In the default General workspace, select the default cube with a single click, then press X and confirm Delete. The light and camera can stay — they are harmless.\n\nOpen the Scripting workspace (click the + tab at the right of the workspace bar, choose Scripting). You will use it to paste and run sections of blueprint.py interactively, which is faster for learning than running the whole script headless.",
      },
      {
        title: "Add a UV sphere with gem topology",
        body:  "Switch back to the Layout workspace. Press Shift+A → Mesh → UV Sphere. The key numbers are in the Operator panel: press F9 (or look at the bottom-left pop-up).\n\nSet Segments to 8 and Rings to 6. Confirm.\n\nWhy these numbers? A UV sphere's segments are longitudinal slices (like orange wedges), rings are latitudinal bands. With 8 segments and 6 rings you get exactly one ring per gem zone: crown-top, crown-mid, girdle, pavilion-upper, pavilion-lower, and the culet (bottom pole). Each ring becomes a distinct facet group when flat-shaded. More segments give more facets; fewer give a coarser, more angular read — 8 is the sweet spot for a classic 8-cut gem.",
      },
      {
        title: "Shape the gem zones in Edit mode",
        body:  "Tab into Edit mode. Switch to Vertex select mode (press 1). The UV sphere's topology means each ring is a clean horizontal loop — Alt+click any vertical edge selects the whole ring loop.\n\nThe bmesh code in blueprint.py does this programmatically, but understanding it by hand first is the right learning order:\n\n1. Loop-select the girdle ring (ring index 2 from the bottom, approximately at Z=0). This stays in place — it is your widest point.\n2. Loop-select the top two rings + the north pole vertex. Scale XY inward (S → Shift+Z → 0.55 → Enter) to taper the crown. Then grab (G → Z) and push up slightly for crown height.\n3. Loop-select the bottom two rings. Scale XY inward (S → Shift+Z → 0.9). Then grab (G → Z) and push down for pavilion depth.\n4. Select only the south pole vertex. Grab (G → Z → -0.9) to pull the culet to a sharp point.\n\nTab back to Object mode. Right-click → Shade Flat. Every triangular face now has its own discrete normal and the mesh reads as a cut crystal.",
      },
      {
        title: "Run blueprint.py for the production mesh",
        body:  "In the Scripting workspace, click New to open a blank text block. Paste the full contents of blueprint.py. Adjust the constants at the top of the file if you want a different gem colour or proportions — BASE_COLOR, IOR, CROWN_XY_SCALE, PAVILION_PULL.\n\nClick Run Script (the triangle play button, or Alt+P with the cursor in the editor). The script clears the scene, rebuilds the gem programmatically via the bmesh API, applies the material, adds the Geometry Nodes modifier, saves gemstone.blend alongside the script, and exports gemstone.glb to the sibling glbs directory.\n\nCheck the system console (Window → Toggle System Console on Windows; launch from terminal on Linux/Mac) for the [blueprint] log lines confirming the paths.",
      },
      {
        title: "Examine the Geometry Nodes modifier",
        body:  "With the gem selected, open the Properties panel (N panel or click the wrench icon on the right). Under Modifier Properties (the wrench tab), you will see GemParams.\n\nThe two sliders — Crown Height and Pavilion Depth — are exposed via Blender 5.1's node group interface API: nt.interface.new_socket(). This replaced the Blender 3.x pattern of nt.inputs.new() / nt.outputs.new(), which was removed in 4.0. The modifier currently passes the geometry through unchanged and uses the sockets as named UI controls; a future iteration could wire them to shape-key drivers.\n\nDrag the sliders. At this stage they are read-only parameters displayed in the modifier panel — the values are stored as custom properties on the modifier and can be read by exporters or by downstream GN modifiers that reference them via Object Info.",
      },
      {
        title: "Inspect the material in the Shader Editor",
        body:  "Open the Shader Editor (Shift+F3 or the icon in the workspace header). The gem_sapphire material has a single Principled BSDF node.\n\nKey values to understand:\n- IOR 2.42 is the refractive index of sapphire. Diamond is 2.418. Ordinary glass is 1.45. A higher IOR means more specular concentration, which on a flat-shaded face produces a sharper, brighter glint. The flat shading means the specular peak is uniform across the entire face and then cuts off hard at the edge — exactly the lapidary look.\n- Roughness 0.02 keeps the specular tight. Increase it toward 0.4–0.6 if you want a frosted or matte gem read instead.\n- Transmission is left at 0. EEVEE Next handles transmission geometry well in 5.x, but flat-shaded faces with transmission produce visible seaming at face borders. Keep it opaque for clean WebXR export; the IOR still influences the specular without transmission enabled.",
      },
      {
        title: "Export the GLB and verify with a GLTF validator",
        body:  "The blueprint.py export call uses: Draco compression level 6, WebP image format, apply transforms, export selection only.\n\nThese match the studio's holoflow_webxr_exporter defaults (see tools/blender-addon/README.md). If you ran the script headless, the GLB is already in the glbs directory. If you want to re-export manually: File → Export → glTF 2.0. Under the Geometry section, enable Draco; under the Images section, set format to WebP.\n\nValidate with the Khronos glTF Validator (drag-and-drop at gltf.report) to confirm the mesh is clean, no degenerate triangles, and the material channel is correct.",
      },
      {
        title: "Render the viewport animation with record.py",
        body:  "Open gemstone.blend. In the Scripting workspace, open record.py. Click Run Script.\n\nThe script places a camera at 25° elevation, adds a key light and a cool-tinted rim light, animates the gem through 360° on the Y axis over 150 frames (5 seconds at 30 fps), and renders to viewport.mp4 in the videos directory.\n\nWhy Y-axis rotation? The gem was built Y-up, so spinning on Y shows all facet groups sequentially against the key light — you see the crown facets, the girdle, and the pavilion in one smooth arc. X-axis rotation would show the same faces repeatedly; Z-axis shows only the table and culet.",
      },
    ],
    finalResult:
      "A sapphire-blue faceted gem: 8 crown facets, 8 girdle facets, 8 pavilion facets, and a culet point. Flat-shaded throughout so every triangular face reflects independently. Principled BSDF at IOR 2.42 with near-zero roughness. Geometry Nodes modifier with Crown Height and Pavilion Depth sliders in the modifier panel. gemstone.blend saved, gemstone.glb exported at Draco level 6 and WebP textures, ready to drop into a WebXR scene or 3D-print.",
    variations: [
      "Change IOR to 2.418 (diamond) and BASE_COLOR to (0.95, 0.98, 1.0) for a clear diamond read.",
      "Increase SEGMENTS to 12 for a more elaborate 12-cut gem. Decrease to 6 for a bold hexagonal crystal.",
      "Set ROUGHNESS to 0.5 and add a slight blue tint to BASE_COLOR for a frosted aquamarine look.",
      "Add a second material slot on the table face (face indices at z > 0.85) in a warm gold to simulate a mixed-metal setting.",
      "Drive the GemParams GN sliders with drivers keyed to a scene property — useful for animated gems in a WebXR story scene.",
    ],
    troubleshooting: [
      {
        symptom: "Gem looks smooth-shaded after running blueprint.py",
        cause:   "A Blender extension or startup script is re-applying smooth shading globally.",
        fix:     "In Object mode, right-click the gem → Shade Flat. Or add obj.data.polygons[i].use_smooth = False in a loop after bm.to_mesh() in blueprint.py — the script already does this, so check that the script ran to completion without errors.",
      },
      {
        symptom: "GLB export fails with 'No valid selection' error",
        cause:   "The gem object is not selected when bpy.ops.export_scene.gltf() fires.",
        fix:     "The blueprint calls bpy.ops.object.select_all(action='DESELECT') then obj.select_set(True) before export. If running manually: click the gem in the viewport first, then File → Export.",
      },
      {
        symptom: "nt.interface.new_socket() raises AttributeError",
        cause:   "Running on Blender 3.x, which uses the old nt.inputs.new() API.",
        fix:     "Update to Blender 4.0 or later. The interface API is the Blender 4.0+ standard and is present in all 5.x builds.",
      },
      {
        symptom: "Material shows as grey/white in the WebXR scene",
        cause:   "The browser WebGL renderer or Three.js material doesn't pick up the Principled BSDF IOR.",
        fix:     "WebGL does not support IOR natively. The GLB exports the base colour and roughness, which is enough for the facet-glint effect. For the browser, the visual work is done by the flat normals and the scene's light direction — not by IOR. Set the scene light to 45° to get clean facet highlights.",
      },
      {
        symptom: "Pavilion is too shallow, gem looks like a lens rather than a stone",
        cause:   "PAVILION_PULL constant is too low.",
        fix:     "Increase PAVILION_PULL from the default 1.65 toward 2.2–2.5. The culet should be visibly deeper than the girdle radius for the stone to read correctly from a 30° viewing angle.",
      },
    ],
  },
  base,
);
