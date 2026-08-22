import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SubsurfBody() {
  return (
    <>
      <p>
        The Subdivision Surface modifier applies Catmull-Clark subdivision: each
        level quadruples the face count and positions every new vertex at the
        weighted average of its mesh neighbourhood, converging toward a smooth
        mathematical limit surface. At level&nbsp;2 you have 16&times; the
        original face count; at level&nbsp;3, 64&times;. Blender&rsquo;s{" "}
        <code>use_limit_surface</code> flag asks OpenSubdiv (Pixar&rsquo;s
        implementation) to evaluate the exact limit surface directly rather than
        iterating steps &mdash; cleaner normals at lower levels. When you only
        need smoothed normals without subdividing the geometry, reach instead for
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
          className={lk}
        >
          Smooth by Angle normal split tutorial
        </Link>
        , which replaces 3.x Auto-Smooth and costs nothing in polygon budget. For
        Cycles-only per-pixel displacement that subdivides at render time and
        never touches the WebXR export, see{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles Displacement + Adaptive Subdivision
        </Link>
        .
      </p>
      <p>
        Every hard edge on a Catmull-Clark surface presents the same choice:
        crease weight or support loop. A crease weight (the{" "}
        <code>crease_edge</code> float attribute, range 0&ndash;1) tells the
        subdivision algorithm to treat the edge as if it had infinite mass,
        never rounding it toward the limit surface. The cost is a C2 derivative
        discontinuity: the normal field steps abruptly across the crease
        boundary, and under glancing directional light you will see a faint
        shading seam exactly where it should be invisible. Support loops avoid
        this: a Bevel modifier placed above Subsurf in the modifier stack adds
        narrow parallel edge pairs close to each hard edge; the clustering of
        vertices pulls the limit surface tight without any continuity break.
        Support loops increase poly count, but those polygons feed cleanly into
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate LOD workflow
        </Link>{" "}
        to recover the budget when exporting background assets.
      </p>
      <p>
        For WebXR delivery the workflow is: author at viewport level&nbsp;2,
        optionally render at level&nbsp;3, then export the GLB with the modifier
        applied at level&nbsp;2. A 100-face panel base becomes 1&thinsp;600
        quads &mdash; fine for a hero prop but too heavy for a scattered
        background piece. The standard escape hatch is to bake the
        high-subdivision normals into a texture on the low-poly base &mdash; see
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking Normal&nbsp;+ AO tutorial
        </Link>{" "}
        &mdash; or, when the high-density geometry came from sculpting, use the{" "}
        <Link
          href="/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb"
          className={lk}
        >
          Multires Normal Bake tutorial
        </Link>
        , which bakes directly from a Multires sculpt level rather than a
        separate high-poly object.
      </p>
    </>
  );
}

const base: Entry = {
  slug:  "blender-tutorial-modifier-subdivision-surface-crease-support-loops-webxr",
  title: "Modifier: Subdivision Surface — Crease Weights + Support Loops + OpenSubdiv for Hard-Surface WebXR (Blender 5.1)",
  date:  "2026-06-27",
  kind:  "tutorial",
  excerpt:
    "Two sci-fi console panels built side by side: one uses edge crease weights " +
    "for sharpness, the other a Bevel+Subsurf stack. Expert depth on Catmull-Clark " +
    "continuity, crease attribute migration in Blender 5.1, and choosing the right " +
    "subdivision level for WebXR GLB export.",
  Body:        SubsurfBody,
  libraryPath: "public/library/blends/modifiers/modifier-subdivision-surface-crease-support-loops-webxr/",
  software: [
    {
      name:      "Blender",
      version:   "5.1",
      url:       "https://www.blender.org/download/",
      cost:      "open-source",
      platforms: ["windows", "macos", "linux"],
      note:
        "Edge crease stored as a generic attribute (crease_edge) since Blender 4.1. " +
        "OpenSubdiv limit-surface flag (use_limit_surface) confirmed stable in 5.1.",
    },
  ],
  prerequisites: [
    "Comfortable adding modifiers in the Properties panel.",
    "Knows what a modifier stack is and that order matters.",
    "Basic familiarity with Edit Mode (selecting edges, loop cuts).",
  ],
  steps: [
    {
      title: "Why Subdivision Surface — and when not to use it",
      body:
        "Catmull-Clark subdivision is the right tool when your base mesh " +
        "needs to read as machined metal or organic flesh at close range: hard " +
        "silhouette edges that soften into smooth curved faces. It is the wrong " +
        "tool when every face is already flat (architectural walls, ground planes) " +
        "or when you are targeting low-poly stylised aesthetics.\n\n" +
        "Key Blender 5.1 flag: use_limit_surface=True. The default behaviour " +
        "iterates subdivision steps and evaluates the final mesh vertices. The " +
        "limit-surface flag asks OpenSubdiv to solve for the exact Catmull-Clark " +
        "limit surface positions — same-level geometry is noticeably smoother, " +
        "especially around corners. Enable it by default in all production work.",
    },
    {
      title: "Build the base console panel — box + inset front face",
      body:
        "blueprint.py creates both panels from the same base mesh function.\n\n" +
        "bmesh.ops.create_cube → bmesh.ops.scale to panel proportions (X=0.60, " +
        "Y=0.08, Z=0.40 m). Find the front face (max Y centroid). " +
        "bmesh.ops.inset_region with thickness=0.06 and depth=-0.010 creates a " +
        "frame quad ring + inner screen face; the screen face moves 1 cm inward " +
        "along its own normal (negative depth = inward recess).\n\n" +
        "inset_region returns {'faces': [inner_face]}. Assign screen_face.material_index=1 " +
        "directly on the BMFace. The 4 edges of the screen face are the seam edges " +
        "that each approach handles differently.",
    },
    {
      title: "Panel A — edge crease weights in Blender 5.1",
      body:
        "Since Blender 4.1 the edge crease is a generic float attribute named " +
        "crease_edge, stored per-edge on the mesh. Do not use bpy.ops.mesh.mark_crease() " +
        "in scripts — it depends on Edit Mode operator context and is not data-API safe.\n\n" +
        "In bmesh:\n" +
        "  crease_layer = bm.edges.layers.float.get('crease_edge')\n" +
        "  if crease_layer is None:\n" +
        "      crease_layer = bm.edges.layers.float.new('crease_edge')\n" +
        "  for edge in seam_edges:\n" +
        "      edge[crease_layer] = 0.90\n\n" +
        "0.90 keeps the edge very tight but not perfectly sharp. CREASE_WEIGHT=1.0 " +
        "gives a knife-edge seam with zero rounding — acceptable for low-poly stylised " +
        "work but too harsh for machined-metal aesthetics under close directional light.",
    },
    {
      title: "Panel B — Bevel + Subsurf stack (the support-loop approach)",
      body:
        "Add a Bevel modifier (limit_method='ANGLE', angle=30°, width=0.018, segments=2) " +
        "ABOVE the Subsurf modifier in the stack. Stack order is load-bearing.\n\n" +
        "Bevel first: adds two narrow parallel edge loops, 0.018 m on each side of every " +
        "sharp edge above 30°. This clusters mesh vertices near the hard edge.\n" +
        "Subsurf second: the limit surface is now pulled tight by the vertex cluster, " +
        "staying within 0.018 m of the original edge — with no C2 discontinuity.\n\n" +
        "If Subsurf were above Bevel, the bevel would run on already-subdivided geometry, " +
        "producing dozens of tiny micro-bevels per sharp edge — wrong topology and " +
        "wasted poly budget. Bevel → Subsurf. Always.\n\n" +
        "segments=2 adds one extra loop cap on each bevel arc, making the radius " +
        "profile a proper circular arc rather than a single chamfer.",
    },
    {
      title: "Read the difference under glancing directional light",
      body:
        "Set the Sun lamp angle to 2° (near-point light). Orbit the camera to " +
        "a grazing angle across both panel fronts.\n\n" +
        "Panel_A (crease): look for a faint bright-dark stripe exactly at the inset " +
        "seam. This is the normal discontinuity caused by the crease weight breaking " +
        "Catmull-Clark C2 continuity. It vanishes under diffuse or area lighting but " +
        "reappears whenever the light direction is nearly parallel to the panel surface.\n\n" +
        "Panel_B (bevel+subsurf): the same seam area shows a smooth tonal roll — no " +
        "discrete band. The tighter the BEVEL_WIDTH, the sharper the roll, but it " +
        "remains continuous regardless of light angle.",
    },
    {
      title: "Viewport vs render vs export subdivision levels",
      body:
        "Three separate level settings control poly count in different contexts:\n\n" +
        "  mod.levels        — viewport level during editing (set to 2 for speed)\n" +
        "  mod.render_levels — Cycles / EEVEE render level (can be 3)\n" +
        "  APPLY_LEVEL       — level baked into the GLB for WebXR (blueprint.py: 2)\n\n" +
        "Rule of thumb: one level 2 subsurf on a 6-face cube → 96 quads. Two nested " +
        "subsurf modifiers (level 1 + level 1) → same 96 quads but the intermediate " +
        "mesh costs extra memory. Never nest Subsurf on top of Subsurf.\n\n" +
        "For VRM characters at hero distance, render_levels=3 is standard. For " +
        "WebXR background props, apply_level=1 and bake the normal map.",
    },
    {
      title: "GLB export — applying the right level",
      body:
        "export_apply=True in bpy.ops.export_scene.gltf evaluates all modifiers at " +
        "their current viewport level. blueprint.py temporarily sets mod.levels = " +
        "APPLY_LEVEL before calling the exporter, then restores the editing level " +
        "after — so the scene stays usable.\n\n" +
        "Draco level 6 on a subdivided mesh (smooth geometry with many co-planar-ish " +
        "faces) gives good compression. Edge crease weighting does not survive GLB " +
        "export — the crease is baked into the evaluated mesh geometry. WebXR " +
        "consumers see vertex positions only, not modifier data.\n\n" +
        "WebXR poly budget check: level 2 from a simple panel box ≈ 1 600 triangles. " +
        "For 50 background instances that is 80 k triangles from panels alone. " +
        "Decimate to 400 triangles per panel instance in background LODs.",
    },
  ],
  finalResult:
    "Two Blender objects demonstrating the crease vs support-loop comparison: " +
    "Panel_A_Crease (Subsurf + 0.9 crease on seam edges) and Panel_B_BevelSubsurf " +
    "(Bevel angle-limited + Subsurf). Both exported as separate GLBs at subsurf level 2 " +
    "with Draco 6 compression. The shading difference is visible under tight directional " +
    "light; both look identical under diffuse lighting.",
  variations: [
    "Vertex group masking: set mod.vertex_group to a vertex group name and " +
    "mod.levels_clamp will limit subdivision to vertices in the group. Useful for " +
    "VRM faces where only the eyes and lips need high-res subdivision while the flat " +
    "cranium stays low-poly.",
    "Simple subdivision mode: set mod.subdivision_type='SIMPLE' to subdivide faces " +
    "without smoothing. Useful before a Displacement modifier (Cycles) where you want " +
    "more vertex density on flat surfaces without moving their positions.",
  ],
  troubleshooting: [
    {
      symptom: "Shading kink visible at the crease seam under directional light",
      cause:
        "Expected behaviour for edge crease weights: the C2 derivative discontinuity " +
        "is intrinsic to the crease algorithm, not a Blender bug.",
      fix:
        "Switch to the Bevel+Subsurf approach for this edge if clean normals under " +
        "glancing light are required. Alternatively, use an Area light or HDRI instead " +
        "of a Sun — the kink is invisible under soft lighting.",
    },
    {
      symptom: "Bevel modifier is adding loops on flat faces that should stay flat",
      cause:
        "BEVEL_ANGLE_DEG is too low (e.g. 15°). Flat-to-flat face transitions on " +
        "the inset frame have angles between 15° and 30° and are being bevelled.",
      fix:
        "Raise BEVEL_ANGLE_DEG to 45°. Check the actual dihedral angles by selecting " +
        "an edge in Edit Mode → Item panel → Edge Angle. Set the threshold 5° above " +
        "the highest angle you want to leave un-bevelled.",
    },
    {
      symptom: "Exported GLB is unexpectedly large",
      cause:
        "APPLY_LEVEL is set too high. Level 3 on a complex base mesh can produce " +
        "500 k+ triangles even before Draco compression.",
      fix:
        "Lower APPLY_LEVEL to 1 or 2 and bake the high-resolution normals to a " +
        "texture on the low-poly base using the Texture Baking workflow. Draco " +
        "cannot recover size lost to genuine geometric complexity.",
    },
  ],
};

export const entry = buildInstructable(
  {
    time:       "40 minutes",
    difficulty: "intermediate",
    cost:       "free",
    supplies: {
      materials: [],
      tools: [
        "Blender 5.1 (blender.org/download)",
        "blueprint.py from this library entry",
      ],
    },
    steps:           base.steps ?? [],
    finalResult:     base.finalResult,
    variations:      base.variations,
    troubleshooting: base.troubleshooting,
  },
  base,
);
