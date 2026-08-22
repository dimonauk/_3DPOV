import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function UdimMultitileBody() {
  return (
    <>
      <p>
        Most texture workflows in Blender pack every UV island into the
        0&ndash;1 UV square and call it done. UDIMs (U-Dimension Image Maps)
        take a different position: each region of a character lives in its own
        numbered tile — 1001, 1002, 1003 — and the renderer resolves which
        image to sample based on the integer part of the U coordinate. The
        practical upside is that you can give the face tile four times the
        resolution of the back-torso tile without any atlas-packing algorithm
        deciding that for you.
      </p>

      <p className="mt-3">
        The same UV painting skills from the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-paint-stylised-low-poly-character"
          className={lk}
        >
          stylised texture-paint tutorial
        </Link>{" "}
        transfer directly — you are still painting onto an image in Texture
        Paint mode. The difference is that switching to a different tile means
        painting an independent image. No island bleeds into its neighbour, and
        you can zoom into one tile at 1:1 pixel scale while the rest stay at
        their native resolutions.
      </p>

      <p className="mt-3">
        The baking step ties directly to the{" "}
        <Link
          href="/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb"
          className={lk}
        >
          multires normal-bake tutorial
        </Link>
        : once your UDIM tiles are painted, you use a second UV channel and a
        Diffuse bake to collapse the multi-tile set into a single 4K atlas for
        GLB export. GLTF 2.0 has no UDIM concept, so the atlas is the export
        target; the UDIM set is your painting master.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        How Blender resolves UDIM tiles
      </h2>
      <p>
        The Image Texture node has a hidden property:{" "}
        <code>image.source</code>. When set to{" "}
        <code>&apos;TILED&apos;</code>, Blender stops treating the image as a
        single file and starts treating it as a tile series. The integer part
        of the incoming U coordinate determines which tile number to load:{" "}
        <code>U = 1.37</code> samples tile 1002 at local U = 0.37. The anchor
        image (tile 1001) must exist; sibling tiles are registered via{" "}
        <code>image.tiles.new(tile_offset=N)</code> in bpy.
      </p>
      <p className="mt-2">
        The <code>&lt;UDIM&gt;</code> token in file paths is optional in
        Blender — it appears in software like Mari and Substance that write
        tiled image sequences with numbered filenames. Blender can read those
        sequences, but it can also construct a tile set from separately-named
        images registered in the tiles list, which is what this blueprint does.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Tile layout strategy
      </h2>
      <p>
        The blueprint splits a 12-segment cylinder torso across three tiles.
        The split is angular: front-facing segments (column indices 0&ndash;5)
        land in tile 1001; back-facing segments (6&ndash;11) land in tile
        1002; the top cap lands in tile 1003. Within each tile the UV
        coordinates are normalised to [0, 1], so each tile fills its full
        square.
      </p>
      <p className="mt-2">
        The seam between tile 1001 and 1002 runs down the sides of the torso —
        under the arm, where any visible seam in painting is hidden. This is
        the same logic used for the manual seams in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          normal and AO bake tutorial
        </Link>
        : place seams where they are invisible on the final model.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export: UDIM → single atlas
      </h2>
      <p>
        The atlas bake uses a dedicated <code>atlas_uv</code> channel where
        tile 1001 occupies U 0.00&ndash;0.33, tile 1002 occupies U
        0.33&ndash;0.66, and tile 1003 occupies U 0.66&ndash;1.00. Blender
        bakes Diffuse Color with <code>use_pass_direct = False</code> so the
        atlas records only the painted colour, not any lighting from the scene.
        The result is a clean material-only atlas that survives import into any
        GLTF viewer.
      </p>
      <p className="mt-2">
        The same bake pattern is used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          shader AOV / custom render passes tutorial
        </Link>{" "}
        for extracting glow and rim passes — the mental model is identical:
        isolate one contribution, write it to an image, use that image
        downstream.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        VRM compatibility
      </h2>
      <p>
        The VRM 1.0 specification (used by the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          weight-paint / VRM rig tutorial
        </Link>
        ) expects a single base-colour texture per material. The atlas
        produced by this workflow satisfies that constraint exactly. When you
        import the exported GLB into a VRM runtime, the torso, back, and neck
        colours are all present in the single atlas — no UDIM support needed
        in the viewer.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "2–3 hours",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1 (free, blender.org)"],
      tools: [
        "blueprint.py (run to generate the .blend file)",
        "record.py (viewport orbit render)",
        "OBS Studio or Windows Game Bar (screen capture)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "Open a terminal in public/library/blends/shading/shader-udim-multitile-vrm-character/ and run: blender --background --python blueprint.py. Blender creates udim_character_torso.blend, the three tile images, and the 4K atlas in a textures/ subfolder. Open the .blend file in Blender to inspect it.",
      },
      {
        title: "Inspect the UV tile layout",
        body: "Select the torso. Open the UV Editor. In the header, enable Image › Show UDIM Tiles. You should see three grey grid squares side by side — tile 1001 (front), 1002 (back), 1003 (cap). Zoom to show all three. Notice that front-facing loops land entirely within the first grid and back-facing loops within the second.",
      },
      {
        title: "Inspect the Image Texture node",
        body: "Open the Shader Editor with the torso selected. Click the Image Texture node labelled 'udim_character_torso.1001'. In the node header, the Source dropdown reads 'TILED'. Below the image preview, the Tiles list shows entries for 1001, 1002, and 1003. This is what tells Blender to resolve UV coordinates across all three files.",
      },
      {
        title: "Paint a test stroke on tile 1001",
        body: "Switch to Texture Paint mode. In the header, set the active image to udim_character_torso.1001. Paint a red brush stroke across the front of the torso. The stroke appears only on the front-facing geometry — tile 1002 (back) is untouched. This tile isolation is the practical advantage of UDIMs for character work: face and body can be painted independently at full resolution.",
      },
      {
        title: "Check the atlas bake",
        body: "In the UV Editor, switch the displayed image to udim_atlas. You see the three tiles stitched into horizontal thirds. The front skin colour occupies the left third, back skin the middle, neck the right. This is the image that was written to textures/udim_character_torso_atlas.png — check that file in an image viewer to confirm the bake.",
      },
      {
        title: "Export GLB with the atlas UV",
        body: "In Object Data Properties › UV Maps, select atlas_uv and click the camera icon to make it the active render UV. File › Export › glTF 2.0. In the export dialog, Geometry › UV Maps = active. The GLB will embed udim_character_torso_atlas.png as the single base-colour texture. Import the GLB into Babylon.js Sandbox or the glTF Validator to confirm one UV buffer and one texture.",
      },
      {
        title: "Record the viewport",
        body: "Close Blender's texture paint mode and return to Object mode. Scripting workspace → open record.py → Run Script. A 300-frame camera orbit renders to public/library/videos/shading/shader-udim-multitile-vrm-character/viewport.mp4. For the screen recording, follow SCREEN-RECORDING-NOTES.md: 1920×1080, OBS window capture, audio off.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Tiles list in Image Texture node shows only 1001",
        cause:
          "The blueprint's make_udim_material() calls image.tiles.new(tile_offset=1) and image.tiles.new(tile_offset=2) to register tiles 1002 and 1003. If the script was interrupted before those calls, only the anchor tile is registered.",
        fix: "In the Python console inside Blender: tex = bpy.data.node_groups or navigate to the Image Texture node, then run: bpy.data.images['udim_character_torso.1001'].tiles.new(tile_offset=1) and .tiles.new(tile_offset=2). Alternatively re-run blueprint.py.",
      },
      {
        symptom: "Bake output is solid black",
        cause:
          "Either (a) atlas_uv is not the active UV channel during bake, or (b) the Image Texture bake-target node was not set as active in the Shader Editor before baking.",
        fix: "In Mesh Data › UV Maps, click atlas_uv so it has the camera icon. In the Shader Editor, click the Image Texture node whose image is udim_atlas — it must have a white highlight (active = most recently clicked). Then press Bake.",
      },
      {
        symptom: "Front tile paint bleeds onto the back half of the torso",
        cause:
          "The active image in Texture Paint mode was set to a TILED image rather than a specific tile. Blender paints through the TILED sampler, which resolves both tiles simultaneously.",
        fix: "In the Texture Paint › Active Image dropdown, select udim_character_torso.1001 explicitly (not the TILED parent). This pins the paint operation to tile 1001 only.",
      },
    ],
    finalResult:
      "A 12-segment torso mesh UV-unwrapped across three UDIM tiles (1001 front / 1002 back / 1003 neck), driven by a TILED Image Texture node in Principled BSDF. A 4K atlas collapses the three tiles for GLB / VRM export. A 10-second viewport orbit records the result.",
  },
  {
    slug: "blender-tutorial-shader-udim-multitile-vrm-character",
    title:
      "Shader: UDIM Multi-Tile UV Layout — Film-Resolution Character Texturing + GLB Atlas Bake (Blender 5.1)",
    date: "2026-06-18",
    kind: "tutorial",
    excerpt:
      "Distribute a VRM humanoid torso across three UDIM tiles (1001 front / 1002 back / 1003 neck) using a manually-authored UV layout and a TILED Image Texture node, then collapse the tile set to a single 4K atlas via a Diffuse bake for GLB / WebXR export.",
    tags: [
      "blender",
      "shading",
      "uv",
      "udim",
      "multi-tile",
      "vrm",
      "character",
      "baking",
      "glb",
    ],
    Body: UdimMultitileBody,
  },
);
