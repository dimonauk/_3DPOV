import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDualMeshVoronoiSphereBody() {
  return (
    <>
      <p>
        The <code>Dual Mesh</code> node converts any triangulated mesh into its
        topological dual: every triangle becomes a vertex, every vertex becomes a
        polygon face. On a subdivided icosphere this produces the classic
        hexagonal/pentagonal tiling of a geodesic dome — twelve pentagons fixed at
        the original icosahedron vertices, hexagons everywhere the subdivision
        added interior vertices. The result is geometrically identical to a
        Buckminster Fuller class-I dome or a C₆₀ fullerene cage, generated with
        three nodes.
      </p>

      <p>
        The non-obvious step is position re-projection after the dual. Each new
        vertex is placed at the centroid of its source triangle, and the centroid
        of a spherical triangle lies strictly inside the sphere — the average of
        three unit vectors is not itself a unit vector. Without correction the
        sphere surface bows inward at every hex panel and the silhouette looks
        lumpy. A{" "}
        <code>VectorMath(NORMALIZE)</code> node reduces the centroid position to a
        unit direction, then{" "}
        <code>VectorMath(SCALE, SPHERE_RADIUS)</code> pushes it out to the true
        sphere surface. Each hex/pent face is then geometrically flat (coplanar),
        so flat-shade normals carry zero error — the technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-custom-split-normals"
          className={lk}
        >
          custom split normals tutorial
        </Link>
        .
      </p>

      <p>
        The twelve pentagons are not a bug — they are topologically inevitable.
        The Euler characteristic of a closed sphere is V − E + F = 2. For a mesh
        of all hexagons plus P pentagons this forces P = 12 regardless of how many
        subdivide levels you apply. The same constraint governs a football, a
        fullerene, and every geodesic dome ever built. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat Zone crystal cluster tutorial
        </Link>
        , which builds radial geometry via a Fermat spiral — a different strategy
        for even spherical coverage that does not rely on Euler-constrained lattice
        theory.
      </p>

      <p>
        The Emission material follows the same pattern as the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>
        : light-independent colour so every panel reads at full brightness in any
        WebXR environment. To assign a distinct colour per face after the Dual
        Mesh, pipe the result into a{" "}
        <code>StoreNamedAttribute(FACE domain)</code> driven by an{" "}
        <code>InputIndex → Modulo → Divide → CombineColor(HSV)</code> field branch
        — the exact technique from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-face-colour-mosaic"
          className={lk}
        >
          Index face colour mosaic tutorial
        </Link>
        . At subdivide level 2, 150 hexagons and 12 pentagons each get a unique hue.
      </p>

      <p>
        Outside sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Blender Manual — Dual Mesh Node
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) — authoritative reference for
        the keep_boundaries parameter and the guarantee that every non-boundary
        input triangle maps to exactly one output vertex. Related pages:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/subdivide_mesh.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Subdivide Mesh
        </a>{" "}
        and{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/triangulate.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Triangulate
        </a>
        .{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group) — source for the flat-normal export rule:
        when <code>export_normals=True</code> and the mesh uses flat shading,
        the exporter writes one unique normal accessor entry per corner (loop),
        not per vertex. Each hex face generates N duplicate corner normals pointing
        straight outward. Related repos:{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          glTF spec
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Sample-Models"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          glTF-Sample-Models
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-dual-mesh-voronoi-sphere",
  title: "GN Dual Mesh — Geodesic Voronoi Sphere (Blender 5.1)",
  date: "2026-05-29",
  summary:
    "Use the Geometry Nodes Dual Mesh node to convert a subdivided icosphere into a hex/pent geodesic dome. Triangulate first (Dual Mesh requires all-triangle input), then re-project dual vertices from triangle centroids back onto the sphere surface with VectorMath(NORMALIZE) × radius. Flat shading reveals the lattice; the twelve pentagons are topologically inevitable via the Euler characteristic.",
  tags: [
    "blender",
    "geometry-nodes",
    "dual-mesh",
    "procedural",
    "geodesic",
    "faceted",
    "webxr",
  ],
  body: GnDualMeshVoronoiSphereBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable building GN node trees in Python via bpy. Know GroupInput, GroupOutput, links.new().",
      "Understand icosphere vs UV sphere topology. Edit Mode familiarity — Tab to see wireframe.",
      "Know what flat shading does vs smooth shading. Covered in the custom split normals tutorial.",
      "Blender 5.1 installed. Able to run scripts headlessly with --background --python.",
    ],
    overview:
      "Create an icosphere (subdivisions=1) then apply a Geometry Nodes modifier whose tree runs: Subdivide Mesh (Level 2) → Triangulate → Dual Mesh → Set Position (Position socket driven by InputPosition → Normalize → Scale). Apply the modifier, shade flat, assign an Emission material, export as Draco-6 GLB. The resulting mesh has 162 faces: 150 hexagons and 12 pentagons. Every face is geometrically flat on the sphere surface.",
    steps: [
      {
        title: "What Dual Mesh does — and why icosphere, not UV sphere",
        body: "The Dual Mesh node performs a topological inversion on the input mesh:\n\n  Every triangle (face) → one vertex in the dual\n  Every vertex          → one polygon face in the dual\n  Every edge            → one edge in the dual (connecting the two dual-vertices\n                          that correspond to the two source faces sharing that edge)\n\nFor a triangulated mesh with F triangles, V vertices, E edges:\n  Dual vertices = F\n  Dual faces    = V\n  Dual edges    = E\n\nAn icosphere subdivided twice has:\n  F = 320 triangles  → 320 dual vertices\n  V = 162 vertices   → 162 dual faces\n  E = 480 edges      → 480 dual edges\n\nA UV sphere at the same subdivision has quad faces. The dual of a quad mesh is\nalso a quad mesh — you get nothing new. The all-triangle icosphere is the\ncorrect seed for the hex/pent tiling.\n\nThe keep_boundaries input:\n  False (default): closes the mesh — boundary vertices (none on a sphere) are\n  included in the dual faces normally. Correct for a closed mesh.\n  True: keeps boundary edges open — correct for a hemisphere or a disk where\n  you want the boundary to remain as edges rather than collapsing inward.\n  For a sphere, keep_boundaries=False always.",
      },
      {
        title: "Build the GN tree: Subdivide → Triangulate → Dual Mesh",
        body: "import bpy\nfrom pathlib import Path\n\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=(0,0,0))\nico_obj      = bpy.context.active_object\nico_obj.name = 'dual_mesh_voronoi_sphere'\n\ntree  = bpy.data.node_groups.new(type='GeometryNodeTree', name='GNDualMeshSphere')\nnodes = tree.nodes\nlinks = tree.links\n\n# Interface sockets (Blender 4.0+ API — tree.inputs.new() is removed)\ntree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\ntree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n\nn_in  = nodes.new('NodeGroupInput');  n_in.location  = (-1100, 0)\nn_out = nodes.new('NodeGroupOutput'); n_out.location  = ( 1000, 0)\n\n# Subdivide Mesh: Level 2 → 320 triangles (4× per level: 20 → 80 → 320)\nn_sub = nodes.new('GeometryNodeSubdivideMesh')\nn_sub.inputs[1].default_value = 2   # Level socket at index 1\nn_sub.location = (-780, 0)\n\n# Triangulate: defensive guard so Dual Mesh always sees all-triangle input.\n# SubdivideMesh on a triangulated mesh stays triangulated, but this guard\n# prevents silent breakage if the source mesh ever gains a quad.\nn_tri = nodes.new('GeometryNodeTriangulate')\nn_tri.location = (-520, 0)\n\n# Dual Mesh: the core operation.\nn_dual = nodes.new('GeometryNodeDualMesh')\nn_dual.inputs[1].default_value = False   # Keep Boundaries = False\nn_dual.location = (-260, 0)\n\n# Wire geometry pipe (position branch comes in the next step)\nlinks.new(n_in.outputs[0],    n_sub.inputs[0])    # Geometry → Subdivide\nlinks.new(n_sub.outputs[0],   n_tri.inputs[0])    # → Triangulate\nlinks.new(n_tri.outputs[0],   n_dual.inputs[0])   # → Dual Mesh\n\n# At this point the Dual Mesh output connects to Set Position (next step).\n\nAfter wiring, scrub SUBDIV_LEVEL from 0 to 3 in the Spreadsheet editor\n(domain=POINT) to watch vertex count change: 12 → 42 → 162 → 642. The\nface count (domain=FACE) changes in lockstep with vertex count because\nDual Mesh swaps the two.",
      },
      {
        title: "Re-project centroid positions onto the sphere surface",
        body: "# Dual vertex positions are triangle centroids — inside the sphere.\n# Re-projection: normalize the centroid direction, scale to sphere radius.\n\n# InputPosition field — reads the (x, y, z) of each vertex in the evaluated mesh.\n# After Dual Mesh this evaluates at POINT domain, giving one centroid per dual vertex.\nn_pos = nodes.new('GeometryNodeInputPosition')\nn_pos.location = (-260, -260)\n\n# VectorMath NORMALIZE — output is the unit vector pointing from origin toward\n# the centroid. Magnitude becomes 1.0; direction is preserved.\nn_norm = nodes.new('ShaderNodeVectorMath')\nn_norm.operation = 'NORMALIZE'\nn_norm.location  = (0, -260)\n\n# VectorMath SCALE — multiplies the unit vector by a scalar.\n# inputs[0] = Vector (the unit direction)\n# inputs[3] = Scale  (float; index 3 because indices 1-2 are for 3-input operations)\nn_scale = nodes.new('ShaderNodeVectorMath')\nn_scale.operation = 'SCALE'\nn_scale.inputs[3].default_value = 1.0   # SPHERE_RADIUS = 1.0 metres\nn_scale.location = (260, -260)\n\n# SetPosition: applies the computed on-sphere position to every dual vertex.\n# inputs[0]=Geometry, inputs[1]=Selection(default True), inputs[2]=Position\n# inputs[3]=Offset(default zero) — leave 1 and 3 disconnected.\nn_setpos = nodes.new('GeometryNodeSetPosition')\nn_setpos.location = (520, 0)\n\nlinks.new(n_dual.outputs[0],    n_setpos.inputs[0])   # Dual Mesh → Geometry\nlinks.new(n_pos.outputs[0],     n_norm.inputs[0])     # Position → Normalize\nlinks.new(n_norm.outputs[0],    n_scale.inputs[0])    # Unit vec → Scale\nlinks.new(n_scale.outputs[0],   n_setpos.inputs[2])   # Sphere pos → Position\nlinks.new(n_setpos.outputs[0],  n_out.inputs[0])      # → Group Output\n\n# Assign modifier\ngn_mod            = ico_obj.modifiers.new('DualMeshVoronoi', 'NODES')\ngn_mod.node_group = tree\n\nVerification:\n  In the 3D viewport, with the modifier live, the sphere should look perfectly\n  round at all view angles. To check the re-projection is doing work, temporarily\n  disconnect the Scale node's output from SetPosition.inputs[2] — the sphere\n  will visibly collapse at the hex centres. Reconnect to restore.\n  Spreadsheet at POINT domain: confirm vertex count = 162. At FACE domain: 162\n  faces. Check that the IcoSphere (subdivisions=1) base object has only 20 faces\n  (visible before the modifier runs by disabling the GN modifier eye icon).",
      },
      {
        title: "Apply, flat shade, and assign Emission material",
        body: "# Apply modifier — converts the live GN evaluation to a static mesh.\n# Required for export and for flat-shading ops to run on the evaluated geometry.\nbpy.context.view_layer.objects.active = ico_obj\nico_obj.select_set(True)\nbpy.ops.object.modifier_apply(modifier=gn_mod.name)\n\n# Shade flat — each hex/pent face is coplanar so flat normals carry zero error.\n# bpy.ops.object.shade_flat() sets poly.use_smooth = False for all faces.\nbpy.ops.object.shade_flat()\n\n# Emission material — light-independent colour for WebXR.\nmat = bpy.data.materials.new('DualMeshEmit')\nmat.use_nodes = True\nnt  = mat.node_tree\nnt.nodes.clear()\n\nn_emit = nt.nodes.new('ShaderNodeEmission')\nn_emit.inputs['Color'].default_value    = (0.18, 0.52, 0.90, 1.0)   # cobalt-blue\nn_emit.inputs['Strength'].default_value = 2.2\nn_emit.location = (-200, 0)\n\nn_mat_out = nt.nodes.new('ShaderNodeOutputMaterial')\nn_mat_out.location = (60, 0)\nnt.links.new(n_emit.outputs['Emission'], n_mat_out.inputs['Surface'])\n\nico_obj.data.materials.append(mat)\n\nWhy flat shading is correct here:\n  After re-projection every hexagonal face is planar — all N vertices of the\n  face lie on the same plane tangent to the sphere. Flat shading assigns each\n  face the exact geometric normal of that tangent plane. Smooth shading would\n  average normals across edges, making faces appear curved even though they are\n  truly flat. The visual goal — reading the lattice as distinct panels — depends\n  on each face having a single uniform normal that differs from its neighbours.",
      },
      {
        title: "Export as GLB — how flat normals travel through glTF",
        body: "bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)\n\nbpy.ops.export_scene.gltf(\n    filepath                             = str(GLB_OUT),\n    export_format                        = 'GLB',\n    use_selection                        = True,\n    export_apply                         = True,\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_normals                       = True,\n    export_materials                     = 'EXPORT',\n    export_image_format                  = 'WEBP',\n)\n\nHow flat normals expand in glTF:\n  A flat-shaded mesh is Blender-internally stored with one normal per LOOP\n  (corner), not per vertex. Each face corner stores the face's geometric normal.\n  Vertices shared between faces carry different normals in each face context.\n\n  glTF has no concept of split normals — every vertex in an accessor has one\n  normal. The KhronosGroup/glTF-Blender-IO exporter handles this by duplicating\n  vertices at sharp edges: every face corner that disagrees with a shared vertex\n  becomes a new vertex in the glTF buffer. For a 162-face sphere:\n\n    Blender vertex count:  162\n    glTF vertex count:     depends on face count and edge topology\n                           (each hex: 6 corners, each pent: 5 corners)\n                           162 faces × ~5.77 avg corners ≈ 934 glTF vertices\n\n  In Three.js, geometry.attributes.normal.array will have one outward-facing\n  normal per expanded vertex — all flat, no interpolation.\n\nDraco at level 6 on a 162-face sphere:\n  The mesh is small — even uncompressed the GLB is under 20 KB. Draco is used\n  here for consistency with the studio pipeline, not for significant size saving.\n  The quantisation step at level 6 uses 11-bit position precision, which at\n  unit sphere radius gives ~0.5 mm vertex accuracy — well within visual tolerance.",
      },
    ],
    finalResult:
      "A .blend containing a 162-face geodesic sphere (150 hexagons + 12 pentagons) built by a GN modifier: Subdivide Mesh(2) → Triangulate → Dual Mesh → Set Position (normalize + scale re-projection). Modifier applied, mesh flat-shaded, cobalt-blue Emission material assigned. Draco-6 GLB exported with flat split normals expanded to ~934 glTF vertices. Topologically correct geodesic dome — the twelve pentagons are Euler-constrained and unavoidable.",
    variations: [
      "Increase SUBDIV_LEVEL to 3 for a 642-face lattice (630 hex + 12 pent). Silhouette quality improves significantly; GLB grows to ~60 KB compressed. Use for desktop WebXR; stay at level 2 for mobile (Quest 3 handles 162 faces trivially).",
      "Per-face colour: after Set Position, add StoreNamedAttribute(FACE domain, FLOAT_COLOR) driven by InputIndex → Modulo(12) → Divide(12) → CombineColor(HSV). The 12 pentagons get hue 0.0-0.9167 in steps; hexagons cycle through all 12 hues. See the Index face colour mosaic tutorial for the exact wiring.",
      "Geodesic lines: after modifier apply, add a Wireframe modifier (Thickness 0.008 m, Replace Original OFF) to extract lattice edges as a tube mesh. Assign a darker emission colour so the edge cage floats above the face panels. Export separately and layer in Three.js with depthTest=false to avoid z-fighting.",
      "Animated inflate: before modifier apply, animate SPHERE_RADIUS from 0.0 → 1.0 over 24 frames via a driver on n_scale.inputs[3].default_value. The sphere expands from a point outward as if inflating. Bake the animation to shape keys for GLB export — GN modifier values do not animate in glTF natively.",
    ],
    troubleshooting: [
      {
        symptom: "Dual Mesh output is a pointy polyhedron, not a round sphere",
        cause:
          "Set Position re-projection is disconnected or the Scale value is 0. Without normalization the centroid positions are the raw triangle centroids (inside the sphere), making each face dip inward at its centre.",
        fix:
          "Confirm links.new(n_scale.outputs[0], n_setpos.inputs[2]). Check n_scale.inputs[3].default_value == SPHERE_RADIUS. In the viewport with the modifier live, the sphere should look perfectly round from all angles.",
      },
      {
        symptom: "Dual Mesh node not found (node type error in Python)",
        cause:
          "Typo in the node type string. The correct type is 'GeometryNodeDualMesh' (no spaces, capital D, capital M).",
        fix:
          "Use nodes.new('GeometryNodeDualMesh'). Verify in the Blender GN editor: Shift+A → Mesh → Dual Mesh. The bl_idname is shown in the tooltip when you hover the Add menu item.",
      },
      {
        symptom: "All 12 faces are pentagons, no hexagons — looks like a dodecahedron",
        cause:
          "Subdivide Mesh Level is 0. The base icosphere has 20 triangles and 12 vertices; its dual is a dodecahedron with 12 pentagonal faces and 20 vertices — correct topology at level 0, wrong for a geodesic sphere.",
        fix:
          "Set SUBDIV_LEVEL to at least 1 (42 dual faces, 30 hex + 12 pent) or 2 (162 faces) for the characteristic geodesic look.",
      },
      {
        symptom: "Modifier apply fails with 'context is incorrect'",
        cause:
          "The object is not active or not in Object Mode. bpy.ops.object.modifier_apply() requires the target to be the active object in Object Mode.",
        fix:
          "Add bpy.context.view_layer.objects.active = ico_obj and ico_obj.select_set(True) immediately before the modifier_apply call. Ensure no other operator left Blender in Edit Mode.",
      },
    ],
  },
  base
);
