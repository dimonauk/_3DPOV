import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ModifierScrewRevolveColumnBody() {
  return (
    <>
      <p>
        A lathe produces a solid of revolution by spinning a profile around an
        axis. Blender&rsquo;s Screw modifier does the same thing in a modifier
        slot: give it any mesh containing an edge-chain profile in the XZ plane
        and it sweeps that profile 360° around the Z axis, producing a closed
        surface without any curve objects, operators, or conversions.
      </p>

      <p>
        The distinction from the <em>Screw tool</em> in Edit Mode matters:
        the tool is destructive — it collapses the selection into final
        geometry immediately. The modifier is non-destructive. Move a vertex in
        the source profile and the entire revolution updates live. This makes
        it ideal for iterative modelling: adjusting the column&rsquo;s echinus
        flare or entasis belly (the outward swell at 1/3 shaft height that
        corrects the concavity illusion on straight-sided columns) is a single
        vertex drag rather than a rebuild.
      </p>

      <p>
        The modifier&rsquo;s <code>steps</code> parameter is a direct LOD
        knob — faces around the circumference. Setting it to 12 or 16 gives a
        clean low-poly result for background objects or WebXR scenes where
        polygon budgets are tight; 48–64 reads as smooth to the eye without
        any subdivision. SubDiv can be layered on top as a second modifier for
        render-quality output. The two controls are fully independent, which
        is exactly the situation the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
          className={lk}
        >
          modifier SubDiv tutorial
        </Link>{" "}
        addresses in depth. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-lattice-shrinkwrap-prop-cage"
          className={lk}
        >
          Lattice + Shrinkwrap prop cage tutorial
        </Link>{" "}
        for the pattern of stacking deform modifiers after a generator modifier.
      </p>

      <p>
        Setting <code>screw_offset &gt; 0</code> converts the closed
        revolution into a helix — the profile advances along the Z axis by
        that many metres per 360° turn. Combined with <code>iterations</code>,
        you can produce helical springs, barber-pole columns, or grooved shaft
        forms without any additional mesh operations. The marble material for
        the column surface is a natural companion to the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-marble-veins"
          className={lk}
        >
          procedural marble shader tutorial
        </Link>
        : connect the marble Shader output to the column&rsquo;s material slot
        and the Voronoi vein pattern wraps correctly around the revolution
        surface because the default UV projection is cylindrical.
      </p>

      <p>
        Compared with the curve-based approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          GN Curve to Mesh tutorial
        </Link>
        , the Screw modifier is simpler for rotationally symmetric assets: one
        object, one modifier, no profile curve data block. The batch GLB
        pipeline from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Python batch exporter tutorial
        </Link>{" "}
        picks up Screw-modified objects exactly like any other mesh — because
        <code>export_apply=True</code> realises the modifier at export time,
        the WebXR runtime receives a straightforward polygon mesh.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-screw-revolve-column",
  title:
    "Modifier — Screw: Lathe-Style Revolution Surface for Columns, Goblets & Helical Springs (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "The Screw modifier sweeps an edge-chain profile 360° around an axis — a non-destructive lathe that updates live as you edit the profile. Scene: a Doric column (entasis shaft + echinus capital + abacus slab) with a helix variant for springs. Steps parameter controls LOD directly; SubDiv stacks on top. Full bpy blueprint, automated viewport render, GLB export.",
  Body: ModifierScrewRevolveColumnBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "beginner–intermediate",
    libraryPath: "blends/modifiers/modifier-screw-revolve-column",
    prerequisites: [
      "Comfortable with Blender's 3D Viewport navigation and Edit Mode.",
      "Modifier stack basics: adding, ordering, and toggling viewport visibility.",
      "Familiarity with the Properties panel → Modifier Properties tab.",
      "Blender 5.1 installed (Screw modifier available since Blender 2.5x; bpy API used here is 5.1-compatible).",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "The Screw modifier's use_smooth_shade and use_normal_calculate flags are present in all Blender 2.8x–5.x builds. The bpy.data.meshes API used in blueprint.py requires 3.x or later for the mesh.attributes style; fallback to vertex group / custom data layers not needed in 5.1.",
      },
    ],
    steps: [
      {
        title: "Build the profile edge chain",
        body:
          "The Screw modifier requires a mesh whose edges define the profile to sweep. Only edge connectivity matters — there must be a continuous path from the bottommost vertex to the topmost. Vertices must be in the XZ plane (Y = 0):\n\n  bm = bmesh.new()\n  profile = [\n      (BASE_RADIUS,   0.00),  # bottom of base\n      (BASE_RADIUS,   0.06),  # base shoulder\n      (R + 0.04,      0.10),  # chamfer exit\n      (R,             0.18),  # shaft base\n      (R + 0.010, H * 0.33),  # entasis peak\n      (R,          H - 0.14), # shaft top\n      ...                     # capital and abacus\n  ]\n  verts = [bm.verts.new((r, 0.0, z)) for r, z in profile]\n  for i in range(len(verts) - 1):\n      bm.edges.new([verts[i], verts[i + 1]])\n  bm.to_mesh(mesh)\n  bm.free()\n\nThe Screw modifier traces edges in order, so creation order determines the sweep direction. A bottom-to-top chain produces outward-facing normals for a solid column.",
      },
      {
        title: "Configure the Screw modifier",
        body:
          "Add the modifier and set its core parameters:\n\n  scr = obj.modifiers.new('Screw', 'SCREW')\n  scr.axis                 = 'Z'\n  scr.steps                = STEPS         # LOD control\n  scr.render_steps         = STEPS\n  scr.screw_offset         = 0.0           # 0 = closed revolution\n  scr.iterations           = 1             # one full turn\n  scr.angle                = math.radians(360)\n  scr.use_merge_vertices   = True          # weld seam\n  scr.merge_threshold      = 0.0001\n  scr.use_smooth_shade     = True\n  scr.use_normal_calculate = True\n  scr.use_normal_flip      = False\n\nWhy use_merge_vertices? Without it, the last revolution loop and the first loop are distinct, leaving a visible seam edge. The threshold of 0.0001 m is tight enough to merge only coincident vertices while avoiding false merges on tight-radius profiles.\n\nuse_normal_calculate = True: the Screw modifier generates normals as it sweeps. Without this flag, normals may point inward or average incorrectly at the seam join.\n\nuse_smooth_shade: sets the smooth-shading flag on every polygon. Unlike the shade-smooth operator, this flag is read back by export_scene.gltf as 'mesh.primitives[0].attributes.NORMAL' smoothing — the GLB renderer sees per-vertex normals, not per-face.",
      },
      {
        title: "Set steps for LOD — the primary polygon budget knob",
        body:
          "The steps value directly sets the number of faces around the circumference:\n\n  scr.steps = 12   # low-poly: 12-sided prism, adequate for distant objects\n  scr.steps = 24   # mid-poly: reads smooth for objects 2–5 m from camera\n  scr.steps = 48   # high-poly: indistinguishable from smooth without SubDiv\n  scr.steps = 96   # extreme: only needed for very tight close-ups or print\n\nThe total polygon count on a Screw mesh is: steps × (len(profile) - 1) faces.\nFor this 10-vertex profile: 48 × 9 = 432 quads. Compare with SubDiv: adding\nlevel 2 SubDiv on top of 432 quads = 6 912 quads in viewport. For WebXR at\n60 fps, keep steps ≤ 48 and avoid SubDiv at render-time: bake the smooth\nnormals instead (see the multires bake tutorial).",
      },
      {
        title: "Helix variant: set screw_offset > 0",
        body:
          "Non-zero screw_offset advances the profile along the screw axis by that many metres per 360° rotation:\n\n  scr.screw_offset = 0.06   # 6 cm pitch per turn → helical spring\n  scr.iterations   = 4      # 4 full turns → 4 × 6 cm = 24 cm spring height\n\nThe result is a continuous helical surface — a spring, threaded column, or\ngrooved rod — without adding any geometry to the profile. The open ends\n(top and bottom) are exposed because iterations does not add cap faces.\n\nTo cap the helix: in Edit Mode, select the top/bottom edge loops and press\nF to fill, or add a Solidify modifier with a very small thickness (0.001 m)\nto give the spring wire its circular cross-section. Alternatively, increase\nthe profile to include a small closed circle in the XY plane — the Screw\nmodifier sweeps it correctly.",
      },
      {
        title: "Stack SubDiv for render-quality smoothing",
        body:
          "SubDiv goes after Screw in the modifier stack:\n\n  sub = obj.modifiers.new('SubDiv', 'SUBSURF')\n  sub.subdivision_type = 'CATMULL_CLARK'\n  sub.levels           = 2\n  sub.render_levels    = 3\n  sub.use_creases      = True\n\nWhy Catmull-Clark here instead of Simple? The Screw revolution already\nproduces a rotationally correct mesh; SubDiv adds smooth curvature along\nthe profile direction (the longitude), which the steps parameter cannot\ncontrol. The echinus flare section benefits most — without SubDiv it reads\nas a straight chamfer; with SubDiv it curves gracefully.\n\nSteps and SubDiv interact multiplicatively: increasing steps beyond 24\nbefore adding SubDiv gives diminishing returns because SubDiv also increases\nthe circumference face count. The optimal combination for architectural\nassets: steps=24, levels=2.",
      },
      {
        title: "Export GLB with export_apply=True",
        body:
          "The Screw modifier is non-destructive — it exists only in the .blend.\nexport_apply=True realises it at export time without baking into the .blend:\n\n  bpy.ops.export_scene.gltf(\n      filepath='//column_capital.glb',\n      use_selection=True,\n      export_format='GLB',\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_yup=True,\n  )\n\nDraco compression on a revolution surface: revolution meshes have highly\nregular topology (rows of identical quads) which compresses extremely well\nwith Draco — expect 80–90% reduction from the uncompressed mesh size.\nexport_yup=True converts Blender's Z-up convention to the Y-up standard\nthat Three.js, Babylon.js, and the WebXR device API all expect.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Visible seam line running top-to-bottom on the revolution",
        cause:
          "use_merge_vertices is False, or merge_threshold is too small to bridge the seam gap.",
        fix:
          "Set scr.use_merge_vertices = True and scr.merge_threshold = 0.0001. If the seam gap is larger (profile vertices at large radii), increase threshold to 0.001. In viewport, check by selecting the seam edge in Edit Mode — if two overlapping edges exist rather than one, the merge failed.",
      },
      {
        symptom: "Normals point inward — surface appears dark or inside-out in EEVEE",
        cause:
          "Profile edge chain was created top-to-bottom rather than bottom-to-top, or the profile has X-axis coordinates in the negative range (wrong quadrant).",
        fix:
          "Ensure all profile (radius, height) pairs have radius > 0 (positive X axis) and are ordered bottom → top. Alternatively, set scr.use_normal_flip = True to invert all face normals post-screw. Check in viewport: Enable Face Orientation overlay (Viewport Overlays → Face Orientation) — blue = outward, red = inward.",
      },
      {
        symptom: "Helix open ends — top and bottom of the spring are open loops",
        cause:
          "Expected: the Screw modifier with screw_offset > 0 does not add cap geometry.",
        fix:
          "Fill manually: enter Edit Mode, select the top edge loop (Alt+Click), press F. Repeat for the bottom. For a spring wire with round cross-section, build a small circle profile (4–8 vertices) in the XY plane at the base of the spring and screw that instead of a line.",
      },
      {
        symptom: "SubDiv smooths the capital flare away to a barely visible bump",
        cause:
          "The echinus flare vertices are too close together relative to the SubDiv tension. Catmull-Clark pulls concave sections inward strongly.",
        fix:
          "Add two extra vertices in the profile just before and after the flare peak to constrain the SubDiv curve — similar to support loop cuts for hard-surface SubD. Alternatively, add an Edge Crease (via the bmesh crease layer, as in the SubDiv tutorial) to the outer vertices of the echinus with value 0.6–0.8 to resist smoothing.",
      },
      {
        symptom: "GLB file is unexpectedly large despite Draco enabled",
        cause:
          "steps is set very high (e.g. 96) AND SubDiv levels = 2, resulting in tens of thousands of quads that overwhelm Draco's prediction algorithm.",
        fix:
          "For WebXR: use steps=24, SubDiv disabled, export_apply=True. For render/print: steps=48, SubDiv=2, but export a separate high-poly GLB and use the low-poly at runtime.",
      },
    ],
  },
  base,
);
