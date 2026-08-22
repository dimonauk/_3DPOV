import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ModifierSubdivCreaseBevelWeightBody() {
  return (
    <>
      <p>
        Catmull-Clark subdivision rounds everything. The craft of
        hard-surface SubD is controlling exactly <em>which</em> edges resist
        that rounding and by how much. Blender gives you three independent
        tools for this, and they are not interchangeable — each one lives at
        a different point in the pipeline and solves a different class of
        problem.
      </p>

      <p>
        <strong>Support loop cuts</strong> (Ctrl+R, slid close to an edge)
        work by topology: two extra edge loops near a corner geometrically
        constrain how far the SubD algorithm can pull the corner inward.
        They are reliable and readable but they add edge density — a long
        horizontal rail needs two parallel loops running its entire length,
        which makes later editing painful.{" "}
        <strong>Edge Crease</strong> solves exactly that: a per-edge float
        in the <code>crease_edge</code> mesh attribute tells Catmull-Clark
        to treat the edge as fully (1.0) or partially (0.0–1.0) fixed,
        adding no geometry at all. It is the correct choice for long
        silhouette lines and any topology where loop cuts would create
        unwanted T-junctions.{" "}
        <strong>Bevel Weight</strong>, stored in{" "}
        <code>bevel_weight_edge</code>, does something different again: it
        does not affect SubDiv directly. It selects which edges the{" "}
        <em>Bevel modifier</em> chamfers. Because Bevel sits{" "}
        <em>before</em> SubDiv in the stack, the chamfer is real geometry
        by the time Catmull-Clark runs — a physically present angled face
        at every tagged edge, not a shading approximation.
      </p>

      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer"
          className={lk}
        >
          Geometry Nodes Bevel Mesh tutorial
        </Link>
        , which does the same chamfer operation procedurally inside a GN
        modifier. The modifier-stack approach here is simpler for a static
        mesh; the GN approach is better when the chamfer width needs to vary
        per-instance or respond to a custom attribute.
      </p>

      <p>
        The scene is a machined mount block: a rectangular slab with a
        recessed panel groove inset on its top face. That groove creates a
        T-junction topology (the groove walls meet the top annulus ring at
        a corner the outer loop cuts cannot reach) — exactly the situation
        where Crease + Bevel Weight replaces what would otherwise be an
        impractical manual loop-cut job.
      </p>

      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>
          Outer silhouette edges: <code>crease_edge = 1.0</code> — the
          profile never rounds; the block stays orthogonal in silhouette.
        </li>
        <li>
          Groove inner rim: <code>crease_edge = 0.5</code> — SubDiv still
          pulls the edge slightly, giving a soft organic step rather than a
          knife-sharp one.
        </li>
        <li>
          Top outer rim: <code>bevel_weight_edge = 1.0</code> — Bevel
          modifier cuts a 10 mm, 2-segment circular-profile chamfer.
        </li>
        <li>
          Base outer rim: <code>bevel_weight_edge = 0.6</code> — same
          modifier produces a lighter chamfer because the weight is lower.
          The Bevel modifier&rsquo;s width is scaled by the weight.
        </li>
      </ul>

      <p>
        The finished modifier stack reads:{" "}
        <strong>Bevel (Limit: Weight)</strong> → <strong>SubDiv (CC,
        level&nbsp;2)</strong> → <strong>Weighted Normal</strong>. Reordering
        Bevel after SubDiv hides the chamfer inside the smooth surface and
        is the single most common hard-surface SubD mistake. Weighted Normal
        last is required because the annulus faces (flat) transition to the
        curved side walls, creating a shading seam that only face-area
        weighting resolves. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-low-poly-faceted-hard-surface"
          className={lk}
        >
          flat-shaded faceted hard-surface tutorial
        </Link>{" "}
        for the opposite philosophy: <em>no</em> SubDiv, deliberate facets.
      </p>

      <p>
        For normal baking — taking this smooth high-poly and projecting its
        normals onto a low-poly game mesh — the process picks up from the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking tutorial
        </Link>
        . Once baked, the low-poly carries the chamfer in its normal map
        rather than in its polygon count, which is the standard WebXR asset
        pipeline.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface",
  title:
    "Modifier Stack — Subdivision Surface + Edge Crease + Bevel Weight: Hard-Surface SubD Workflow (Blender 5.1)",
  date: "2026-06-17",
  kind: "tutorial",
  excerpt:
    "Three sharpness controls, three different roles: support loop cuts (topology-based), Edge Crease (crease_edge attribute, no geometry), and Bevel Weight (bevel_weight_edge → Bevel Modifier chamfer before SubDiv). Demonstrates on a machined mount block with a recessed panel groove — a T-junction topology that makes loop cuts impractical. Modifier order: Bevel (Weight limit) → SubDiv (CC) → Weighted Normal. Full bpy blueprint, viewport animation, GLB export.",
  Body: ModifierSubdivCreaseBevelWeightBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "intermediate",
    libraryPath:
      "blends/modifiers/modifier-subdiv-crease-bevel-weight-hard-surface",
    prerequisites: [
      "Comfortable in Edit Mode: loop cuts (Ctrl+R), edge selection, face extrusion.",
      "Modifier stack basics: adding, ordering, and toggling viewport visibility.",
      "Familiarity with the Properties panel → Modifier Properties tab.",
      "Blender 5.1 installed. Edge Crease and Bevel Weight as named mesh attributes (bevel_weight_edge, crease_edge) require Blender 3.4 or later.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "bevel_weight_edge and crease_edge migrated from legacy custom data layers to named mesh attributes in Blender 3.4. The blueprint.py uses mesh.attributes API, which is correct for 5.1. The Weighted Normal modifier's face_influence flag requires Blender 2.82+.",
      },
    ],
    steps: [
      {
        title: "Create the mount block mesh with bmesh",
        body:
          "Build the 16-vertex geometry programmatically:\n\n  import bmesh\n  bm = bmesh.new()\n  hw, hd = W/2, D/2\n\n  # Bottom ring\n  b0 = bm.verts.new((-hw, -hd, 0.0))\n  b1 = bm.verts.new(( hw, -hd, 0.0))\n  b2 = bm.verts.new(( hw,  hd, 0.0))\n  b3 = bm.verts.new((-hw,  hd, 0.0))\n\n  # Top ring\n  t0 = bm.verts.new((-hw, -hd, H))\n  ...\n\n  # Top inset ring (panel groove outer boundary)\n  pi = PANEL_INSET\n  p0 = bm.verts.new((-hw+pi, -hd+pi, H))\n  ...\n\n  # Groove floor ring (z = H + PANEL_DEPTH)\n  g0 = bm.verts.new((-hw+pi, -hd+pi, H + PANEL_DEPTH))\n  ...\n\nFace winding: CCW when viewed from outside. bm.normal_update() after all faces are added so the SubDiv algorithm receives correct normals on the first evaluation.",
      },
      {
        title: "Set Edge Crease via bmesh crease layer",
        body:
          "crease_edge is a named mesh attribute in Blender 5.1. The bmesh API exposes it via layers.crease.verify() — this method creates the attribute if it does not exist and returns the layer handle.\n\n  cl = bm.edges.layers.crease.verify()\n\n  # Outer silhouette: fully sharp\n  for a, b in [(b0,b1),(b1,b2),(b2,b3),(b3,b0)]:   # bottom ring\n      e = bm.edges.get([a, b])\n      if e: e[cl] = 1.0\n\n  for a, b in [(b0,t0),(b1,t1),(b2,t2),(b3,t3)]:   # vertical corners\n      e = bm.edges.get([a, b])\n      if e: e[cl] = 1.0\n\n  # Groove inner rim: half tension\n  for a, b in [(p0,p1),(p1,p2),(p2,p3),(p3,p0)]:\n      e = bm.edges.get([a, b])\n      if e: e[cl] = 0.5\n\nValue 1.0: SubDiv treats the edge as rigid — no curvature applied.\nValue 0.5: SubDiv applies half the normal curvature — a soft pull rather than no pull. Useful at the groove rim to avoid a knife-sharp step.\nValue 0.0 (default): fully smooth subdivision.",
      },
      {
        title: "Set Bevel Weight via mesh attribute API",
        body:
          "Convert bmesh to mesh first, then use the mesh.attributes API:\n\n  bm.to_mesh(mesh)\n  bm.free()\n\n  if 'bevel_weight_edge' not in mesh.attributes:\n      mesh.attributes.new(name='bevel_weight_edge', type='FLOAT', domain='EDGE')\n  bwt = mesh.attributes['bevel_weight_edge']\n\nRe-open with a second bmesh session to look up edge indices by vertex pairs:\n\n  bm2 = bmesh.new()\n  bm2.from_mesh(mesh)\n  bm2.edges.ensure_lookup_table()\n  bm2.verts.ensure_lookup_table()\n\n  def edge_idx(vi, vj):\n      v_a = bm2.verts[vi]\n      for e in v_a.link_edges:\n          if e.other_vert(v_a) == bm2.verts[vj]:\n              return e.index\n      return None\n\n  # Vertex indices match creation order: b0=0..b3=3, t0=4..t3=7, p0=8..p3=11, g0=12..g3=15\n  for vi, vj in [(4,5),(5,6),(6,7),(7,4)]:   # top rim: full bevel\n      idx = edge_idx(vi, vj)\n      if idx is not None:\n          bwt.data[idx].value = 1.0\n\n  for vi, vj in [(0,1),(1,2),(2,3),(3,0)]:   # base rim: lighter bevel\n      idx = edge_idx(vi, vj)\n      if idx is not None:\n          bwt.data[idx].value = 0.6\n\nVertex creation order in a bmesh is preserved at bm.to_mesh() time unless you call bm.verts.sort(), which we do not. The double-bmesh pattern (one for crease, one for bevel weight) avoids trying to mix the bmesh layer API with the mesh attribute API in a single session — the two APIs cannot share the same bmesh handle cleanly.",
      },
      {
        title: "Add Bevel modifier (Limit Method: Weight)",
        body:
          "Bevel must be the FIRST modifier in the stack:\n\n  bev = obj.modifiers.new('Bevel', 'BEVEL')\n  bev.limit_method       = 'WEIGHT'   # only chamfers edges with bevel_weight > 0\n  bev.width              = 0.010       # 10 mm chamfer\n  bev.segments           = 2           # 1 = straight bevel; 2 = single arc segment\n  bev.profile            = 0.5         # 0.5 = circular arc; 1.0 = flat 45° line\n  bev.use_clamp_overlap  = True        # prevents self-intersection at tight corners\n  bev.loop_slide         = True        # endpoints slide along adjacent loops\n\nWhy profile = 0.5? A circular arc profile on a 2-segment bevel creates a quarter-circle chamfer that SubDiv then further refines — the final result looks machined rather than hand-filed. A straight profile (1.0) with 1 segment is cheaper and fine for game assets; it reads as a precise cut chamfer.",
      },
      {
        title: "Add Subdivision Surface modifier",
        body:
          "SubDiv goes second:\n\n  sub = obj.modifiers.new('SubDiv', 'SUBSURF')\n  sub.subdivision_type = 'CATMULL_CLARK'\n  sub.levels           = 2     # viewport: 4× face count per level\n  sub.render_levels    = 3     # render: 8× finer than level 2\n  sub.use_creases      = True  # read crease_edge attribute — OFF by default pre-4.x\n\nCatmull-Clark vs Simple: Simple subdivides without smoothing (useful for pixel art or preserving hard topology). Always use CATMULL_CLARK for hard-surface SubD.\n\nLevel cost: level 2 = 4 quadruples the face count. Level 3 = 64×. For a 16-face base mesh: level 2 = 1 024 faces, level 3 = 4 096. Keep viewport at 2; use 3 only for render or baking.",
      },
      {
        title: "Add Weighted Normal modifier",
        body:
          "WeightedNormal must be last:\n\n  wn = obj.modifiers.new('WeightedNormal', 'WEIGHTED_NORMAL')\n  wn.weight          = 100   # maximum face-area weighting\n  wn.face_influence  = True  # face strength from Sharp edges takes priority\n\nWhy is this needed? After SubDiv, the normals at the boundary between the flat top annulus (the rim band between outer top edge and groove rim) and the curved side walls are interpolated across the transition — the vertex normals on the transition strip average the flat face normal and the curved side normal, producing a visible shading seam. Weighted Normal recalculates vertex normals by weighting face contributions by their area: large flat faces (top annulus, side walls) dominate, suppressing the seam.\n\nface_influence = True: Mark Sharp edges (set automatically on any edge with Crease = 1.0) act as hard normal boundaries. This means the outer silhouette corners get crisp shading terminations.",
      },
      {
        title: "Apply modifiers and export GLB",
        body:
          "For GLB export the modifier stack must be applied (or use export_apply=True):\n\n  bpy.ops.export_scene.gltf(\n      filepath='//mount_block.glb',\n      export_format='GLB',\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_yup=True,          # +Y up for WebXR convention\n  )\n\nexport_apply=True applies modifiers at export without baking them into the .blend file. This is the correct approach: keep the non-destructive modifier stack intact in the .blend for editing, and only realise it at export time.\n\nDraco level 6: moderate-to-high compression. The SubD mesh at level 3 has ~4 096 faces per base face → test Draco 4 vs 6 if WebXR load time is a concern. GLB size difference between Draco 4 and 6 on this mesh is typically <15%.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Bevel modifier chamfers ALL edges, not just the tagged rim",
        cause:
          "bev.limit_method is not set to 'WEIGHT', or the bevel_weight_edge attribute has not been created on the mesh.",
        fix:
          "Check bev.limit_method == 'WEIGHT'. Verify 'bevel_weight_edge' in obj.data.attributes — if missing, call mesh.attributes.new(name='bevel_weight_edge', type='FLOAT', domain='EDGE') and re-set the values.",
      },
      {
        symptom: "Outer silhouette corners round despite Crease = 1.0",
        cause: "sub.use_creases = False (not the default in 5.1, but can be set accidentally).",
        fix: "sub.use_creases = True. Also verify crease_edge attribute exists: 'crease_edge' in obj.data.attributes.",
      },
      {
        symptom: "Shading seam visible on the top annulus / side wall boundary",
        cause:
          "Weighted Normal modifier is absent or placed before SubDiv. It must read the final subdivided mesh normals.",
        fix:
          "Ensure WeightedNormal is last in the stack. In the modifier list, drag it below SubDiv. Set wn.face_influence = True to propagate Mark Sharp boundaries from Crease edges.",
      },
      {
        symptom: "Bevel weight not saved when file is re-opened",
        cause:
          "mesh.update() was not called after writing to mesh.attributes, or the attribute was created on a bmesh that was freed before bm.to_mesh().",
        fix:
          "Always call mesh.update() after writing attribute data. Check that the second bmesh session (bm2) calls bm2.to_mesh(mesh) and bm2.free() before mesh.update().",
      },
      {
        symptom: "GLB has no visible chamfer — looks like un-bevelled SubD",
        cause: "export_apply=False and modifiers are not applied in the .blend before export.",
        fix:
          "Pass export_apply=True to bpy.ops.export_scene.gltf(). This applies modifiers at export time. Alternatively, apply the stack manually (Ctrl+A in modifier panel) before exporting.",
      },
      {
        symptom: "Groove walls have inverted normals (appear dark in EEVEE)",
        cause:
          "Face winding order on groove walls is CW when viewed from outside. bm.normal_update() was not called after face creation.",
        fix:
          "Call bm.normal_update() after all faces are added and before setting crease values. Alternatively, select all in Edit Mode and run Mesh → Normals → Recalculate Outside (Shift+N).",
      },
    ],
  },
  base,
);
