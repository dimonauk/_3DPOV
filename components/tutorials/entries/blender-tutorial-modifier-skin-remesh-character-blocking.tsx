import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SkinRemeshBody() {
  return (
    <>
      <p>
        The Skin modifier is one of Blender&apos;s most underused blocking tools. Give it a
        mesh composed solely of vertices and edges — no faces at all — and it sweeps a
        manifold quad shell along every edge, mitre-joining the tubes at each vertex. The
        cross-section at each vertex is an independent ellipse defined by{" "}
        <code>MeshSkinVertex.radius&nbsp;=&nbsp;(rx,&nbsp;ry)</code>: two floats, one for
        the X half-width, one for the Z half-width of the local cross-section plane. This
        makes the modifier strictly topological: resizing the head radius leaves the neck
        untouched, which is the primary reason to prefer it over metaballs for proportional
        blocking. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-metaball-organic-blob-creature-glb"
          className={lk}
        >
          Metaball organic blob tutorial
        </Link>{" "}
        where proximity-field blending is actually desirable; for a humanoid with discrete
        limbs it becomes a liability.
      </p>
      <p>
        The raw Skin output is not suitable for export: it produces sharp pinch artefacts at
        high-valence joints (pelvis, shoulder yoke) and its quad topology is irregular.
        Adding <strong>Voxel Remesh</strong> above Skin in the stack resolves both problems.
        Voxel Remesh converts the Skin shell into an OpenVDB signed distance field,
        isosurfaces at the zero crossing, and outputs a near-uniform quad mesh. Setting{" "}
        <code>adaptivity&nbsp;=&nbsp;0.0</code> gives perfectly even cell density — ideal
        input for the Decimate modifier below. The voxel size controls the trade-off: at
        0.055 m a standing character produces roughly 2 500 quads before decimation — light
        enough for WebXR at full scene density, heavy enough to hold readable limb silhouettes.
        The full pipeline is shown in relation to the rest of the low-poly production chain
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate LOD tutorial
        </Link>
        .
      </p>
      <p>
        Once Voxel Remesh has produced a uniform quad grid, <strong>Decimate (Planar)</strong>{" "}
        dissolves any edge whose two incident faces share a dihedral angle within the threshold
        — here 5°. The Voxel mesh has many micro-triangles on near-flat surfaces; these are
        all redundant for a flat-shaded low-poly render. After dissolution at 5° the face
        count typically drops to 800–1 200 large polygons with hard silhouette edges intact —
        exactly the faceted aesthetic used across the{" "}
        <Link href="/atelier" className={lk}>
          Holoflow Atelier
        </Link>
        . The blocked character is then ready for the{" "}
        <Link
          href="/tutorials/blender-tutorial-retopology-polybuild-shrinkwrap"
          className={lk}
        >
          PolyBuild retopology pass
        </Link>{" "}
        if clean edge-loops are needed, or can go directly to VRM rigging using the blocking
        mesh as an envelope proxy — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm"
          className={lk}
        >
          Stretchy IK tutorial
        </Link>{" "}
        for the armature setup that follows this blocking step.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-skin-remesh-character-blocking",
  title:
    "Modifier — Skin + Voxel Remesh: Low-Poly Character Blocking for VRM and WebXR (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Build a humanoid character proxy from a pure edge skeleton using the Skin modifier, then clean the topology with Voxel Remesh and flatten it to a faceted low-poly shell via Decimate Planar — ready for GLB export and VRM rigging.",
  Body: SkinRemeshBody,
};

export const entry = buildInstructable(
  {
    time: "one sitting",
    difficulty: "intermediate",
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/modifiers/modifier-skin-remesh-character-blocking/",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Skin modifier and MeshSkinVertex Python API stable since 2.7x. Voxel Remesh requires 2.82+. BLENDER_EEVEE_NEXT engine requires 4.2+.",
      },
    ],
    prerequisites: [
      "Can add modifiers and read the Properties panel → Modifier tab.",
      "Comfortable in the Scripting workspace — can open and run a text block.",
      "Understands the concept of a modifier stack (order matters: bottom modifier runs first).",
    ],
    steps: [
      {
        title: "Why an edge mesh — no faces",
        body:
          "The Skin modifier reads the mesh as a graph: vertices are nodes, edges are bones. It ignores faces entirely, so the input should contain only vertices and edges. A face on the input is not an error, but its interior is not swept — it simply adds noise to the Skin output at no benefit.\n\nIn Edit Mode: add vertices with Ctrl+LMB (or script VERTS/EDGES), extrude with E, and never fill faces. The skeleton should look like a stick figure.",
      },
      {
        title: "Per-vertex radius: the (rx, ry) ellipse",
        body:
          "In Edit Mode, select a vertex and press Ctrl+A to drag the cross-section radius interactively. In Python:\n\n  sk = obj.data.skin_vertices[0]\n  sk.data[i].radius = (rx, ry)   # metres\n\nrx controls the width along the local X axis of the edge, ry along local Z. Setting rx != ry produces a flattened oval — useful for wrists (thin), feet (wide, flat), and the torso (deeper front-to-back in anatomically accurate blocking). The Skin modifier creates this MeshSkinVertexLayer automatically when it is added; no manual initialisation is needed.",
      },
      {
        title: "Root mark: control Catmull-Clark propagation",
        body:
          "The Skin modifier uses a Catmull-Clark-like subdivision to smooth the joint quads. The subdivision direction propagates from the root vertex outward through the edge graph. Mark the head vertex as root:\n\n  sk.data[0].use_root = True\n\nWithout a root, the solver picks a leaf vertex arbitrarily. At the pelvis — where three or four limbs fork — an arbitrary root can twist the quad orientation at the hip sockets, producing a corkscrew artefact. A head root causes the four limb chains to each receive consistent orientation from a single stable propagation direction.",
      },
      {
        title: "Voxel Remesh: voxel_size and adaptivity",
        body:
          "  rem = obj.modifiers.new('Remesh', type='REMESH')\n  rem.mode         = 'VOXEL'\n  rem.voxel_size   = 0.055  # metres — ~2 500 quads on a 2 m humanoid\n  rem.adaptivity   = 0.0    # uniform density\n  rem.use_smooth_shade = False\n\nSetting adaptivity > 0 coarsens flat areas to save triangles — useful for hard-surface models but counterproductive here, because it creates large irregular cells on the torso that Decimate cannot dissolve uniformly. Keep adaptivity at 0.0 so the entire mesh has the same cell size entering the Decimate step.",
      },
      {
        title: "Decimate Planar: dissolving the remesh noise",
        body:
          "  dec = obj.modifiers.new('Decimate', type='DECIMATE')\n  dec.decimate_type          = 'DISSOLVE'\n  dec.angle_limit            = math.radians(5)  # 5°\n  dec.use_dissolve_boundaries = False\n\nVoxel Remesh leaves micro-triangles on near-flat surfaces — these are edges between faces whose dihedral angle is less than 1°. The 5° threshold dissolves all of them plus any shallow creases on the torso surface, collapsing them into the large flat polygons that define the faceted character aesthetic. Silhouette edges at limb joints have dihedral angles of 30–90° and are unaffected.\n\nuse_dissolve_boundaries = False is required; setting it True would dissolve boundary edges of the mesh — acceptable for a closed manifold but changes the silhouette if there are open holes.",
      },
      {
        title: "GLB export: apply_modifiers bakes the full stack",
        body:
          "  bpy.ops.export_scene.gltf(\n      filepath      = bpy.path.abspath('//character_block.glb'),\n      use_selection = True,\n      export_apply  = True,   # runs Skin → Remesh → Decimate\n      export_format = 'GLB',\n      export_yup    = True,\n      export_draco_mesh_compression_enable = True,\n      export_draco_mesh_compression_level  = 6,\n      export_image_format = 'WEBP',\n  )\n\nexport_apply=True evaluates the full modifier stack before writing geometry. The base edge mesh (with only 15 vertices and 14 edges) is never written to the GLB — only the evaluated result is. This keeps the file small and avoids confusing any runtime glTF loader that might not support edge-only geometry.",
      },
    ],
    finalResult:
      "A flat-shaded low-poly humanoid blocking mesh (~800–1 200 faces) exported as a GLB with Draco compression and +Y up convention. The mesh has no interior edges, a closed manifold, and suitable topology for weight painting and VRM joint binding. Run record.py to produce a 10-second turntable viewport.mp4.",
    variations: [
      "Symmetrise the skeleton before adding modifiers: set each left-side vertex VERTS entry to have its X coordinate negated for the right side, as shown in the VERTS table. Alternatively, add a Mirror modifier BELOW Skin so Skin receives the mirrored edge graph. Stack order would be: Mirror (bottom) → Skin → Remesh → Decimate (top). This halves the skeleton authoring work at the cost of the Mirror modifier computing first.",
      "For creature blocking (quadruped, multi-armed), increase the joint count and adjust the edge connections. The Skin + Voxel pipeline handles any edge graph — a spider skeleton with eight leg chains, a serpent spine, a winged humanoid. The only constraint is that the graph must be connected (no isolated subgraphs) or the Remesh step produces separate shells that must be joined later.",
      "After exporting the blocking GLB, load it into Three.js or Babylon.js as a low-poly stand-in while the high-resolution version loads. Swap the geometry when the user is close enough to trigger the LOD threshold. The blocking mesh's Draco-compressed GLB is typically under 20 KB — suitable as the immediate-load tier in a WebXR scene.",
    ],
    troubleshooting: [
      {
        symptom: "skin_vertices[0] raises IndexError immediately after adding the modifier",
        cause:
          "The Skin modifier adds the MeshSkinVertexLayer during the modifier init, but bpy may not flush the layer to obj.data until the depsgraph is evaluated. This can happen when the object was just created in the same script execution.",
        fix:
          "Insert bpy.context.view_layer.update() after adding the Skin modifier and before accessing obj.data.skin_vertices. This forces a depsgraph evaluation that flushes the new attribute layer to the base mesh.",
      },
      {
        symptom: "Twisted or corkscrew quads at the pelvis or shoulder fork",
        cause:
          "No root vertex is marked, or the root is on a leaf rather than the highest joint in the hierarchy. The Catmull-Clark propagation direction is inconsistent across the fork.",
        fix:
          "Mark the topmost joint (head or neck) as root: sk.data[0].use_root = True. If the skeleton has multiple disconnected components, mark one root per component.",
      },
      {
        symptom: "Voxel Remesh produces a blocky result that misses thin limbs",
        cause:
          "voxel_size is too large relative to the smallest limb radius. If a limb radius (e.g. 0.06 m) is smaller than voxel_size (0.08 m), the wrist may be represented by only one voxel cell and the Remesh output collapses it to a blob or loses it entirely.",
        fix:
          "Rule of thumb: voxel_size < (smallest limb radius × 1.5). For a wrist radius of 0.06 m, use voxel_size ≤ 0.045. Alternatively raise LIMB_RAD so no radius is smaller than voxel_size × 0.7.",
      },
    ],
  },
  base,
);
