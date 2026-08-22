import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function WireframeBody() {
  return (
    <>
      <p>
        The Wireframe modifier converts every edge of a mesh into a four-sided
        tube — a quad strip running the length of the edge, mitre-joined at each
        vertex. Two geometry modes differ at those vertex joints.{" "}
        <strong>Simple mode</strong> (
        <code>use_even_offset&nbsp;=&nbsp;False</code>) extends each quad strip
        along its edge direction until adjacent strips collide. At a
        high-valence vertex — the 5-valent poles and equatorial nodes of a
        level-1 icosphere, for instance — the five incoming strips overlap and
        produce a star-burst artefact that becomes increasingly pronounced as
        tube thickness approaches edge length.{" "}
        <strong>Even mode</strong> (
        <code>use_even_offset&nbsp;=&nbsp;True</code>) computes the bisecting
        plane between each pair of incident edges and clips the strip precisely
        there, so every joint closes cleanly regardless of valence or dihedral
        angle. Use Even mode as the default; Simple mode exists for
        high-poly meshes where the artefact is sub-pixel.
      </p>
      <p>
        The boolean <code>use_replace</code> controls what geometry survives
        alongside the tubes. With <code>True</code>, all source faces are
        removed and only the tube skeleton remains — the right choice for
        geodesic display objects, structural cages, and low-poly neon sculptures
        destined for WebXR. With <code>False</code>, original faces and tubes
        coexist in the same mesh, which enables the <code>material_offset</code>{" "}
        system: shift tube faces to a second material slot without any manual
        face selection in Edit Mode. Slot&nbsp;0 carries an opaque PBR base;
        slot&nbsp;1 carries an Emission shader. The result is a solid panel with
        a glowing edge cage — identical in concept to the rim-material system in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print"
          className={lk}
        >
          Solidify modifier tutorial
        </Link>
        , where <code>material_offset_rim</code> assigns rim faces to a reveal
        slot. The same modifier-stack ordering rules apply: Wireframe above
        Solidify to cage a solidified wall, Wireframe above Boolean so cutters
        affect the source mesh topology before tubes are generated.
      </p>
      <p>
        Open boundary edges — edges adjacent to only one face — are excluded by
        default. Enable <code>use_boundary&nbsp;=&nbsp;True</code> to include
        them, which is essential for any open-shell mesh (a flat grid, a
        hemisphere dome, a subdivided disk); without it the perimeter of the
        grid carries no tubes and the object looks unfinished. The GLB produced
        here integrates directly with the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate LOD workflow
        </Link>{" "}
        — decimate the source icosphere before adding Wireframe to reduce tube
        count proportionally, or decimate the applied wireframe mesh in Planar
        mode (all tube walls are flat quads and dissolve with zero visual
        change). For the neon-glow visual finish on the emissive tube material,
        see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel"
          className={lk}
        >
          Holographic Panel Emission + Fresnel shader
        </Link>
        , which adds a Fresnel rim into the same emission slot for a depth
        gradient across the tube surface that reads as genuine volumetric glow
        without any volumetric shader cost.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-wireframe-edge-tube-neon-skeleton",
  title:
    "Modifier — Wireframe: Edge-Tube Neon Skeleton for WebXR and Low-Poly Display (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Convert a low-poly icosphere into a pure edge-tube skeleton using Even offset mode, then overlay an orange neon wire cage onto a flat panel grid using material_offset — both exported as a single GLB for WebXR.",
  Body: WireframeBody,
};

export const entry = buildInstructable(
  {
    time: "one sitting",
    difficulty: "beginner",
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/modifiers/modifier-wireframe-edge-tube-neon-skeleton/",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Wireframe modifier available since Blender 2.66. use_relative and use_boundary added in 2.7x. All parameters confirmed stable in 5.1.",
      },
    ],
    prerequisites: [
      "Can navigate the Properties → Modifier panel (wrench icon) and add a modifier.",
      "Knows how to add objects and open the Material Properties panel.",
      "Understands material slots — the +/− buttons in Properties → Material.",
    ],
    steps: [
      {
        title: "Even vs Simple offset — the one switch that matters most",
        body:
          "Open Modifier Properties (wrench icon) → Add → Wireframe. Two sub-modes:\n\nSimple (use_even_offset = False): each tube quad extends along the edge until it meets the adjacent quad. At a 5-valent vertex (common in icospheres, pentagons in any tri mesh) five quad strips overlap at the joint, producing a star-burst of faces. At low thickness this is invisible; at WIRE_A_THICKNESS = 0.04 m it is clearly wrong.\n\nEven (use_even_offset = True): the modifier calculates the bisecting plane between each pair of adjacent tube quads and clips both strips to that plane. Result: a clean mitre joint at every vertex, regardless of valence. The vertex cap is a convex polygon whose face count equals the vertex valence (5 faces at a 5-valent node).\n\nPython:\n  mod.use_even_offset = True   # Even — always use this\n  mod.use_even_offset = False  # Simple — only for poly counts > 1M where speed matters\n\nVerification: orbit to a 5-valent vertex in Solid view. With Even mode, the joint looks like a small pentagon. Switch to Simple — the star-burst is immediately visible as overlapping faces in X-ray view (Alt+Z).",
      },
      {
        title: "use_replace: pure skeleton vs hybrid solid+wire",
        body:
          "use_replace is the key architectural decision for the Wireframe modifier:\n\nTrue: all source mesh faces are deleted. Only the tube geometry remains. Use for display objects where the mesh IS the wireframe — geodesic spheres, structural lattices, neon sculptures. The tube mesh is its own closed manifold (all tube walls are quads; caps close the tube ends at each vertex).\n\nFalse: source faces and tube quads coexist as islands in the same mesh. Use for overlaying a wire cage onto a solid object — architectural panels, holographic displays, hard-surface edge highlights. In this mode, add two material slots and set material_offset = 1 to push tube faces to slot 1. Source faces remain on slot 0.\n\nPython:\n  mod.use_replace    = True   # pure skeleton (wire_sphere in this tutorial)\n  mod.use_replace    = False  # hybrid (wire_panel in this tutorial)\n  mod.material_offset = 1     # tube faces → slot 1 when use_replace=False",
      },
      {
        title: "Building the icosphere skeleton (use_replace=True)",
        body:
          "Icosphere level 1 is the canonical test case for Wireframe:\n  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0)\n\nLevel-1 icosphere topology:\n  20 triangular faces · 30 edges · 12 vertices (all valence-5)\n\nWHY subdivisions=1 rather than 2 or 3: at level 1 each tube is clearly visible and individually identifiable as a geodesic strut. At level 2 (320 faces, 480 edges) the tubes become indistinct at camera distance — the mesh reads as a fuzzy lattice rather than a structural skeleton. For display purposes at WebXR viewing distance, level 1 or 2 is the sweet spot.\n\nAfter adding the object:\n  mod = obj.modifiers.new('Wireframe', 'WIREFRAME')\n  mod.thickness       = 0.040   # fat tube — reads clearly in viewport\n  mod.use_even_offset = True\n  mod.use_relative    = False   # absolute thickness, same on every edge\n  mod.use_boundary    = False   # closed mesh — all edges have 2 adjacent faces\n  mod.use_replace     = True\n  mod.material_offset = 0       # single slot — only tubes survive\n\nAdd an Emission-only material (no BSDF) to maximise luminance on a dark background.",
      },
      {
        title: "Building the panel grid (use_replace=False + material_offset)",
        body:
          "The panel demonstrates the two-slot material workflow:\n\n  bm = bmesh.new()\n  bmesh.ops.create_grid(bm, x_segments=4, y_segments=4, size=1.2)\n  bm.to_mesh(mesh)\n\nbmesh.ops.create_grid produces a flat quad grid. x_segments=4, y_segments=4 gives a 4×4 grid — 16 quad faces, 25 vertices, 40 interior edges, 16 boundary edges.\n\nMaterial slots:\n  slot 0 — PANEL_BASE: Principled BSDF, near-black (charcoal)\n  slot 1 — PANEL_WIRE: Emission shader, orange\n\nWireframe modifier:\n  mod.use_replace     = False  # keep panel faces\n  mod.use_boundary    = True   # include 16 perimeter edges\n  mod.material_offset = 1      # tube faces → slot 1 (PANEL_WIRE)\n  mod.thickness       = 0.025  # thinner tube, overlaid on panel\n\nBoundary effect: disable use_boundary and watch the four outer edges lose their tubes — the panel looks like a floating interior lattice with no frame. Re-enable to restore the outer rectangle of tubes. This is critical for any open mesh.",
      },
      {
        title: "Relative thickness and the use_relative flag",
        body:
          "use_relative = False (default): mod.thickness is an absolute distance in world units. Every edge in the mesh gets a tube of identical radius. Good when edges are all roughly the same length (icosphere, subdivided plane).\n\nuse_relative = True: mod.thickness becomes a fraction of each individual edge's length. A 0.1 m edge with thickness=0.2 gets a 0.02 m radius tube; a 0.5 m edge gets a 0.1 m tube. Use this when the mesh has edges of very different lengths — otherwise short edges get tubes so fat they completely occlude the vertex joint, while long edges look hairline-thin.\n\nPython:\n  mod.use_relative = True    # thickness = fraction of edge length\n  mod.thickness    = 0.15    # 15% of each edge's length\n\nTest: create a plane, subdivide once, scale two vertices far out. Without use_relative, the short and long edges get identical tubes and the short-edge joints are completely buried. With use_relative, both read at the same visual weight.\n\nFor the icosphere with uniform edge lengths (all 30 edges equal in a geodesic), use_relative and absolute thickness are equivalent. The difference matters on irregular remeshed or sculpted topology.",
      },
      {
        title: "Modifier stack: Wireframe above Solidify and Boolean",
        body:
          "Wireframe below Solidify: Solidify receives the tube mesh and tries to give wall thickness to quad tubes. Result is a double-walled hollow tube — rarely desired, and manifold only if the tube mesh was already closed (it is, for use_replace=True). For caging a solidified architectural wall, Wireframe must be ABOVE Solidify:\n\n  [0] Solidify   — adds wall thickness to source flat planes\n  [1] Wireframe  — generates tubes on the solidified wall's edges\n\nWireframe below Boolean: the Boolean modifier receives the tube mesh. Difference-mode Boolean carves a void from the tube quads, producing partial tubes — useful for a cutaway diagram, but not for a clean edge cage. Place Wireframe ABOVE Boolean to cage a post-cut solid:\n\n  [0] Boolean    — cuts shape from solid body\n  [1] Wireframe  — cages the cut result\n\nFor stack ordering principles, see the Boolean Exact Hard-Surface Trim tutorial, which establishes the general rule: additive topology modifiers (Solidify, Boolean Union) first; subtractive (Boolean Difference) second; surface-reading modifiers (Wireframe, Bevel) last.",
      },
      {
        title: "Export GLB with apply-on-duplicate",
        body:
          "The Wireframe modifier is a lazy GN-style evaluation — the tube geometry does not exist in bpy.data.meshes until the modifier is applied. Exporting with export_apply=True via bpy.ops.export_scene.gltf() materialises the modifier at export time:\n\n  bpy.ops.export_scene.gltf(\n      filepath=GLB_OUT,\n      use_selection=True,\n      export_apply=True,               # applies modifier stack\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_yup=True,\n  )\n\nThe blueprint instead uses the apply-on-duplicate pattern to keep the source modifier live for editing in the .blend file. Both approaches produce identical GLBs; the difference is only in whether the working file is modified. Prefer export_apply=True for one-off batch exports; prefer apply-on-duplicate when the .blend must survive as an editable asset.\n\nExpected GLB content:\n  wire_sphere_export: ~480 quads (30 edges × 4 quads per tube + 12 cap polygons)\n  wire_panel_export:  ~256 quads panel + ~448 quads tubes (56 edges × 8 tube quads)",
      },
    ],
    finalResult:
      "Two Blender objects: a teal emission icosphere skeleton (level-1, 30 edge-tubes, use_replace=True) and an orange neon-grid flat panel (4×4 quads, use_replace=False, material_offset=1 for the emissive tube cage). Both are exported into a single wire_skeleton.glb via Draco L6 + WebP, ready for WebXR scenes as structural display geometry.",
    variations: [
      "Animated tube thickness via a driver: add a scene Custom Property 'wire_pulse' (range 0–1), then right-click mod.thickness → Add Driver. Set the driver expression to 'sin(frame * 0.1) * 0.02 + 0.03'. The tube radius oscillates between 0.01 m and 0.05 m creating a breathing neon effect. Bake to NLA if exporting animated GLB via gltf().",
      "Vertex-group masking for selective wireframe: in Edit Mode, weight-paint a vertex group (e.g. 'wire_mask'). In the Wireframe modifier, set Vertex Group = 'wire_mask'. Edges between weighted vertices generate tubes; unweighted edges are skipped. Use this to give a character mesh glowing veins only along specific edge loops — face-cage edges remain invisible while arm and leg topology lights up.",
      "Wireframe + Subdivision for rounded tubes: place a Subdivision Surface modifier ABOVE the Wireframe modifier in the stack (lower index = evaluated first). SubDiv adds edge loops inside each tube quad, rounding the square cross-section into an octagon or circle. mod.use_even_offset must be True for the SubDiv to round cleanly at vertex joints — Simple mode star-burst artefacts compound badly under SubDiv.",
    ],
    troubleshooting: [
      {
        symptom: "Star-burst overlap at every vertex joint",
        cause:
          "mod.use_even_offset is False (Simple mode). Quad strips from adjacent edges are not clipped to bisecting planes and overlap at the joint.",
        fix:
          "Set mod.use_even_offset = True in the modifier panel or in Python. Confirm in X-ray view (Alt+Z) — overlapping faces disappear and each joint becomes a clean polygon. If the artefact persists after enabling Even, check that the mesh has no doubled vertices (Mesh → Merge by Distance in Edit Mode).",
      },
      {
        symptom: "Boundary edges have no tubes — open mesh perimeter is bare",
        cause:
          "mod.use_boundary is False. Open (boundary) edges — adjacent to only one face — are skipped by default.",
        fix:
          "Enable mod.use_boundary = True. In the Properties panel: Modifier → Wireframe → Boundary. Confirm by switching to Edge Select Mode in Edit Mode and checking that the outer loop is now tube geometry in the modifier viewport.",
      },
      {
        symptom: "Wireframe tubes disappear in the exported GLB",
        cause:
          "export_apply was not set and the modifier was not applied before export. The exporter serialised the unmodified source mesh (an empty icosphere or a flat plane with no tube geometry).",
        fix:
          "Either add export_apply=True to bpy.ops.export_scene.gltf(), or use the apply-on-duplicate pattern from blueprint.py. Open the GLB in a glTF viewer (e.g. gltf.report) and check that the mesh triangle count matches the expected tube count, not just the source polygon count.",
      },
      {
        symptom: "Tube faces show the wrong material — all use slot 0",
        cause:
          "mod.material_offset is 0 (the default). Tube faces are not shifted to a second slot. OR the object has only one material slot — material_offset=1 has nothing to shift to.",
        fix:
          "Add a second material slot to the object before using material_offset. Verify in Properties → Material that two slots exist. Set mod.material_offset = 1 in Python or the modifier panel. In Material Preview mode, the tube faces should switch to the second material's colour.",
      },
    ],
  },
  base,
);
