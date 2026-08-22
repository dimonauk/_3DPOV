import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnFaceGroupBoundariesPanelGroovesBody() {
  return (
    <>
      <p>
        Every approach to procedural panel lines begins with the same question:
        which edges should become grooves?{" "}
        <code>GeometryNodeFaceGroupBoundaries</code> answers that question
        directly.  Given a per-face integer field — any integer field, from a
        noise texture, a material index, a proximity test, or a hand-painted
        attribute — it outputs a per-<em>edge</em> boolean that is{" "}
        <code>True</code> wherever two adjacent faces carry different IDs.
        Those boundary edges are the exact skeleton of your panel layout.  No
        manual selection, no edge-crease painting, no UV-seam detection: the
        topology of your clustering field determines the groove positions
        automatically and re-generates whenever you change the noise seed,
        scale, or number of groups.
      </p>

      <p>
        The contrast with the two sibling approaches is worth stating clearly
        before you wire anything.{" "}
        <Link href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines" className={lk}>
          Extrude Mesh panel lines
        </Link>{" "}
        selects edges by angle threshold and extrudes them outward — a
        bottom-up method that reads the geometry as given and adds geometry
        along already-defined hard edges.{" "}
        <Link href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface" className={lk}>
          Mesh Boolean hard surface
        </Link>{" "}
        subtracts cutter volumes — a top-down method that carves actual
        recesses into the body mesh at the cost of Boolean overhead.
        FaceGroupBoundaries is a third option: it derives groove positions from
        a <em>field assignment</em> rather than from existing geometry or a
        cutter volume.  That makes it procedurally restyle-able at near-zero
        cost: swap the noise seed, the number of groups, or the texture scale,
        and the grooves redistribute instantly.
      </p>

      <p>
        The face set field in this blueprint is built from a 4-D Noise
        Texture (seed controlled via the W dimension) fed through{" "}
        <code>MapRange</code> and <code>FunctionNodeFloatToInt(FLOOR)</code>.
        The explicit <code>FunctionNodeFloatToInt</code> cast matters: while
        Blender will implicitly coerce a FLOAT field to INT when the downstream
        socket demands it, the rounding behaviour of an implicit cast is
        implementation-defined and has changed between minor versions.{" "}
        <code>FunctionNodeFloatToInt</code> with{" "}
        <code>rounding_mode=&apos;FLOOR&apos;</code> is explicit, deterministic,
        and documents intent.  The same field drives both{" "}
        <code>StoreNamedAttribute</code> (to persist the face set for the
        per-face colour ramp) and <code>FaceGroupBoundaries</code> (for groove
        detection) in a single evaluation pass — no redundant re-sampling.
        Compare this named-attribute storage pattern with the{" "}
        <Link href="/tutorials/blender-tutorial-gn-index-face-colour-mosaic" className={lk}>
          GN Index Face Colour Mosaic tutorial
        </Link>
        , which also writes a per-face colour at FACE domain but uses{" "}
        <code>InputIndex</code> as its source field rather than noise.
      </p>

      <p>
        The extracted boundary edges flow through{" "}
        <code>SeparateGeometry(domain=&apos;EDGE&apos;)</code> →{" "}
        <code>MeshToCurve</code> →{" "}
        <code>SetCurveRadius</code> →{" "}
        <code>CurveToMesh</code> to become raised tube geometry — weld-seam
        ridges in the studio&apos;s aesthetic rather than recessed channels.
        For actual sunken grooves, feed the same tube mesh into a{" "}
        <code>GeometryNodeMeshBoolean(DIFFERENCE)</code> — the{" "}
        <Link href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface" className={lk}>
          Boolean tutorial
        </Link>{" "}
        covers the subtraction setup in detail.  The final{" "}
        <code>JoinGeometry</code> merges the per-zone-coloured panel body with
        the dark-metallic groove tubes into a single mesh object.  The
        Principled BSDF panel material reads the <code>panel_col</code>{" "}
        FLOAT_COLOR attribute via{" "}
        <code>ShaderNodeAttribute(attribute_type=&apos;GEOMETRY&apos;)</code>,
        the same lookup technique used in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map" className={lk}>
          Vertex Valence Heat Map
        </Link>{" "}
        and the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear" className={lk}>
          Worn Metal Edge Wear
        </Link>{" "}
        shader — the recurring pattern of storing data in GN then reading it in
        the material graph.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-face-group-boundaries-panel-grooves",
  title:
    "GN Face Group Boundaries — Procedural Panel Groove Engraving: Noise-Clustered Face Sets and Edge-to-Tube Geometry (Blender 5.1)",
  date: "2026-06-10",
  kind: "tutorial",
  excerpt:
    "GeometryNodeFaceGroupBoundaries converts a per-face integer field into a per-edge boolean that is True wherever adjacent faces belong to different sets — the exact skeleton for procedural panel-line grooves. This tutorial drives it with a noise-clustered FunctionNodeFloatToInt field, extracts the boundary edges via SeparateGeometry(EDGE), converts them to tube geometry through MeshToCurve → CurveToMesh, and joins the result with a per-zone-coloured metallic panel body. Expert coverage of the face set field chain, explicit FLOAT→INT casting, the three competing groove-generation approaches, and GLB export with FLOAT_COLOR named attributes.",
  Body: GnFaceGroupBoundariesPanelGroovesBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines",
      label: "Tutorial — GN Extrude Mesh Panel Lines",
      note: "The angle-threshold approach to panel lines: selects hard edges by dihedral angle and extrudes them — the geometry-first alternative to FaceGroupBoundaries' field-assignment approach.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface",
      label: "Tutorial — GN Mesh Boolean Hard Surface",
      note: "Subtracts cutter volumes for actual recessed grooves — feed the same FaceGroupBoundaries tube output into Boolean(DIFFERENCE) for sunken channels instead of raised ridges.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-index-face-colour-mosaic",
      label: "Tutorial — GN Index Face Colour Mosaic",
      note: "Per-face FACE domain colour storage using InputIndex — the same StoreNamedAttribute / ShaderNodeAttribute pattern, but driven by sequential index rather than noise clustering.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map",
      label: "Tutorial — GN Vertex Valence Heat Map",
      note: "Reads mesh connectivity via topology nodes and stores results as FLOAT_COLOR per vertex — the same named-attribute pipeline in POINT domain; contrast with this tutorial's FACE domain storage.",
    },
    {
      href: "/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear",
      label: "Tutorial — Shader: Procedural Worn Metal Edge Wear",
      note: "Applies the Bevel node to darken groove edges in the shader graph — a natural complement to the geometry-level grooves produced here.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/face_group_boundaries.html",
      label:
        "Blender Manual — Face Group Boundaries Node (CC-BY-SA 4.0 — Blender Documentation Team)",
      note: "Full node reference. Key facts: type identifier GeometryNodeFaceGroupBoundaries; single input 'Face Set' (INT field, evaluates at FACE domain on each adjacent face per edge); single output 'Boundary Edges' (BOOLEAN field, evaluates at EDGE domain — True where the two adjacent face values differ). Added in Blender 3.6. Related nodes: GeometryNodeEdgePathsToCurves (walks boundary paths as ordered curves), GeometryNodeFaceIsViewportInsideFace (face containment). Related developers docs: developer.blender.org/docs/release_notes/3.6/geometry_nodes/.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference collection of headless bpy patterns. Covers node group construction with ng.interface.new_socket(), FunctionNodeFloatToInt rounding_mode enumeration, GeometryNodeSeparateGeometry domain attribute, and ShaderNodeAttribute attribute_type='GEOMETRY' for reading custom GN attributes in materials — all patterns used in this blueprint. Related: blender-python-snippets community collection (CC0).",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — Official glTF Exporter (Apache-2.0 — Khronos Group)",
      note: "Exporter source for export_colors and export_attributes flags. FLOAT_COLOR attributes export as VEC4 float accessors in the glTF primitive. In Three.js, access as mesh.geometry.attributes.panel_col or (if promoted to COLOR_0) via MeshStandardMaterial({ vertexColors: true }). Related: KhronosGroup/glTF specification (Apache-2.0), KhronosGroup/glTF-Sample-Models (Apache-2.0).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "50 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Familiar with the Geometry Nodes editor: can add and connect nodes.",
      "Blender 5.1 installed; can run a .py script from the Text Editor workspace.",
      "Understands named attributes (see the Capture Attribute tutorial).",
      "Optional: read the Extrude Mesh Panel Lines tutorial for the angle-threshold alternative.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeFaceGroupBoundaries was introduced in Blender 3.6 and is fully stable in 5.1. It appears under Mesh in the Add Node menu inside a Geometry Nodes editor. FunctionNodeFloatToInt is under Utilities ▸ Math. GeometryNodeSeparateGeometry with domain='EDGE' requires Blender 3.4+.",
      },
    ],
    steps: [
      {
        title: "Understand GeometryNodeFaceGroupBoundaries: what it does and when to use it",
        body: `GeometryNodeFaceGroupBoundaries is a pure field node with no Geometry socket:
  Type identifier: 'GeometryNodeFaceGroupBoundaries'
  inputs[0]  'Face Set'       (INT field)  — the face group ID, evaluated at FACE domain
                                              for each of the two faces adjacent to each edge.
  outputs[0] 'Boundary Edges' (BOOL field) — True at EDGE domain where the two adjacent
                                              face values differ; False where they are equal.

WHY NO GEOMETRY INPUT:
  FaceGroupBoundaries is a topology query, not a geometry transform.
  It derives the edge boolean from the face adjacency of the mesh it is
  attached to via the GN modifier's geometry context.  The face set values
  come entirely from the upstream field — not from any stored attribute on
  the mesh unless you explicitly feed a NamedAttribute node.

WHEN TO USE IT:
  Use FaceGroupBoundaries when your panel layout is determined by a FIELD
  (noise, proximity, material index, a weight paint map) rather than by
  existing sharp edges or UV seams.  If the layout is driven by existing
  geometry (hard edges from bevel modelling), the Extrude Mesh approach
  (bevel_weight selection → ExtrudeMesh) is cheaper.  If you need actual
  recessed geometry, combine FaceGroupBoundaries with MeshBoolean.

FACE DOMAIN EVALUATION:
  The 'Face Set' field evaluates once per adjacent face on each edge.
  A 6-face cube with SubdivideMesh(level=3) has 6 × 4³ = 384 faces and
  384 × 2 = 768 half-edge evaluations for the face set field.
  With 12 panel zones and NOISE_SCALE=0.85, approximately 40–60 % of edges
  become boundary edges — the exact count depends on the noise field.`,
      },
      {
        title: "Build the noise-driven face set field",
        body: `# 1. Position field — evaluates at face centres when consumed at FACE domain
pos = N.new('GeometryNodeInputPosition')

# 2. 4-D Noise Texture — W dimension acts as a seed-only axis
noi = N.new('ShaderNodeTexNoise')
noi.noise_dimensions = '4D'
noi.inputs['Scale'].default_value      = NOISE_SCALE   # 0.85
noi.inputs['Detail'].default_value     = 3.0
noi.inputs['Roughness'].default_value  = 0.60
noi.inputs['Distortion'].default_value = 0.25
noi.inputs['W'].default_value          = float(NOISE_SEED)  # 3.0
L.new(pos.outputs['Position'], noi.inputs['Vector'])

# 3. Map Fac [0,1] → [0, NUM_GROUPS - ε] before floor
mran = N.new('ShaderNodeMapRange')
mran.data_type = 'FLOAT'; mran.clamp = True
mran.inputs['To Max'].default_value = float(NUM_GROUPS) - 0.001
# WHY subtract ε: FLOOR(NUM_GROUPS - 0.001) = NUM_GROUPS - 1, not NUM_GROUPS.
# Without ε, the rare noise value of exactly 1.0 (at clamp boundary) would
# give FLOOR(12.0) = 12, which is outside [0, 11], creating a stray 13th zone.

# 4. Explicit FLOAT→INT cast
ftoi = N.new('FunctionNodeFloatToInt')
ftoi.rounding_mode = 'FLOOR'
L.new(mran.outputs['Result'], ftoi.inputs['Float'])

WHY FunctionNodeFloatToInt INSTEAD OF ShaderNodeMath(FLOOR):
  ShaderNodeMath outputs FLOAT.  FaceGroupBoundaries expects INT.
  An implicit cast from FLOAT to INT is supported but its rounding
  behaviour is not documented by the node API spec — it may change
  between Blender sub-versions.  FunctionNodeFloatToInt with
  rounding_mode='FLOOR' documents intent and is guaranteed to match
  Python int(math.floor(x)) semantics.`,
      },
      {
        title: "Store face_set attribute and run FaceGroupBoundaries",
        body: `# Store face_set as INT attribute at FACE domain for two reasons:
# (1) The colour ramp downstream needs the integer value per face.
# (2) In the viewport you can inspect it via Attribute spreadsheet.
sfs = N.new('GeometryNodeStoreNamedAttribute')
sfs.data_type = 'INT'; sfs.domain = 'FACE'
sfs.inputs['Name'].default_value = 'face_set'
sfs.inputs[1].default_value = True          # Selection = all faces
L.new(sdiv.outputs['Mesh'],        sfs.inputs[0])   # Geometry
L.new(ftoi.outputs['Integer'],     sfs.inputs[3])   # Value (INT socket)

# FaceGroupBoundaries — driven by the same ftoi field (not a NamedAttribute read)
fgb = N.new('GeometryNodeFaceGroupBoundaries')
L.new(ftoi.outputs['Integer'], fgb.inputs['Face Set'])

WHY WIRE ftoi → BOTH sfs AND fgb:
  Using the same upstream field node means the noise is evaluated once per face
  in the GN pass, and both consumers (StoreNamedAttribute at FACE, and
  FaceGroupBoundaries at EDGE) receive consistent values.  If we instead wired
  fgb to a NamedAttribute('face_set') node reading the stored attribute, that
  would require sfs to execute first — creating an implicit ordering dependency
  that the GN evaluator does not guarantee between field nodes.  Direct field
  wiring is always safer.

INSPECTING IN THE VIEWPORT:
  Select the cube, open Spreadsheet editor, set Domain to Face.
  You should see a 'face_set' column with integers 0–11.
  Boundary detection: set Domain to Edge.  There is no 'Boundary Edges'
  column (it is a field output, not stored), but you can add a second
  StoreNamedAttribute(domain='EDGE', data_type='BOOLEAN', name='is_boundary')
  fed from fgb.outputs['Boundary Edges'] to inspect boundary count.`,
      },
      {
        title: "Extract boundary edges and convert to groove tube curves",
        body: `# Separate only the boundary edges (EDGE domain)
sep = N.new('GeometryNodeSeparateGeometry')
sep.domain = 'EDGE'
L.new(sfs.outputs['Geometry'],          sep.inputs['Geometry'])
L.new(fgb.outputs['Boundary Edges'],    sep.inputs['Selection'])
# sep.outputs[0] = selected part (boundary edges only, as an edge-only mesh)
# sep.outputs[1] = inverted  (all other geometry)

# SeparateGeometry(domain='EDGE') output:
#   Keeps edges where selection=True.
#   Retains the vertices connected to those edges.
#   Drops all faces.  The result is a valid mesh with vertices + edges, no polys.

# Convert edge mesh → curve (each connected edge chain → one spline)
m2c = N.new('GeometryNodeMeshToCurve')
L.new(sep.outputs[0], m2c.inputs['Mesh'])

WHY MeshToCurve ON AN EDGE-ONLY MESH:
  MeshToCurve converts each connected chain of edges into a poly spline.
  Because SeparateGeometry already isolated only the boundary edges, the
  'Selection' input of MeshToCurve is not needed here (all edges in the
  input geometry are boundary edges).

# Set uniform radius before sweep
scr = N.new('GeometryNodeSetCurveRadius')
scr.inputs['Radius'].default_value = GROOVE_RADIUS  # 0.020 m
L.new(m2c.outputs['Curve'], scr.inputs['Curve'])

# Small square-section circle for the tube cross-section
circ = N.new('GeometryNodeCurvePrimitiveCircle')
circ.mode = 'RADIUS'
circ.inputs['Resolution'].default_value = CIRCLE_VERTS  # 4 = square; 8 = round
circ.inputs['Radius'].default_value     = GROOVE_RADIUS

# Sweep profile along curves → tube mesh
c2m = N.new('GeometryNodeCurveToMesh')
c2m.inputs['Fill Caps'].default_value = True
L.new(scr.outputs['Curve'],  c2m.inputs['Curve'])
L.new(circ.outputs['Curve'], c2m.inputs['Profile Curve'])

WHY Fill Caps=True:
  Without caps the tube ends are open holes — fine for long continuous seams
  but visually broken at short isolated boundary segments.  Caps add a flat
  polygon at each open end, making every tube segment a closed solid manifold
  and preventing dark interior faces from showing in specular reflections.`,
      },
      {
        title: "Add per-zone colours to panel body and join geometry",
        body: `# Map face_set integer → per-face colour using a second MapRange + ColorRamp
mran2 = N.new('ShaderNodeMapRange')
mran2.data_type = 'FLOAT'; mran2.clamp = True
mran2.inputs['From Max'].default_value = float(NUM_GROUPS - 1)
mran2.inputs['To Max'].default_value   = 1.0
L.new(ftoi.outputs['Integer'], mran2.inputs['Value'])

cr_node = N.new('ShaderNodeValToRGB')
cr = cr_node.color_ramp
# Four stops in a muted dark-steel palette (suitable for WebXR ambient)
cr.elements[0].position = 0.0;  cr.elements[0].color = (0.120, 0.175, 0.230, 1.0)
cr.elements[1].position = 1.0;  cr.elements[1].color = (0.200, 0.140, 0.240, 1.0)
cr.elements.new(0.33).color  = (0.050, 0.120, 0.160, 1.0)
cr.elements.new(0.66).color  = (0.170, 0.220, 0.180, 1.0)
L.new(mran2.outputs['Result'], cr_node.inputs['Fac'])

spc = N.new('GeometryNodeStoreNamedAttribute')
spc.data_type = 'FLOAT_COLOR'; spc.domain = 'FACE'
spc.inputs['Name'].default_value = 'panel_col'
L.new(sfs.outputs['Geometry'],   spc.inputs[0])
L.new(cr_node.outputs['Color'],  spc.inputs[3])

# Assign groove material via SetMaterial node
smg = N.new('GeometryNodeSetMaterial')
L.new(c2m.outputs['Mesh'], smg.inputs['Geometry'])
# smg.inputs['Material'].default_value = groove_mat  (set in main() after creation)

# Join panel body + groove tubes into one mesh object
join = N.new('GeometryNodeJoinGeometry')
L.new(spc.outputs['Geometry'], join.inputs[0])  # panel body (first input)
L.new(smg.outputs['Geometry'], join.inputs[0])  # groove tubes (second input)
L.new(join.outputs['Geometry'], gout.inputs['Geometry'])

WHY JoinGeometry INSTEAD OF SEPARATE OBJECTS:
  A single-object GLB is simpler to load in Three.js (one gltf.scene child,
  one geometry buffer) and correctly reflects the panel + groove as one
  logical hard-surface piece.  The two sub-meshes within the joined geometry
  each carry their own material index (0 = panel body, 1 = groove material),
  which the glTF exporter maps to separate primitive entries under one mesh.`,
      },
      {
        title: "Export GLB and access panel_col in Three.js",
        body: `bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    export_format='GLB',
    export_apply=True,         # bake NODES modifier — required
    export_colors=True,        # include vertex/face colour attributes
    export_attributes=True,    # include custom named attributes
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
)

In Three.js to read the per-face panel colours:
  loader.load('panel_grooves.glb', gltf => {
    gltf.scene.traverse(obj => {
      if (!obj.isMesh) return;
      const geo = obj.geometry;
      // panel_col may land as COLOR_0 (promoted) or as _panel_col (custom)
      const hasCol = geo.attributes.color || geo.attributes['_panel_col'];
      if (hasCol) {
        obj.material = new THREE.MeshStandardMaterial({ vertexColors: true });
      }
    });
    scene.add(gltf.scene);
  });

FACE vs VERTEX domain in GLB:
  Blender's 'face_col' FLOAT_COLOR attribute at FACE domain is converted by
  glTF-Blender-IO to a per-corner (per-loop) attribute before export,
  because glTF only supports per-vertex accessors.  The exporter replicates
  the face colour to every corner of each face.  In Three.js this creates
  a non-indexed geometry (or an indexed geometry with duplicated vertices at
  face boundaries), which is correct — the face colours will be flat with no
  interpolation across face edges, as intended for hard-surface panels.

BAKING FOR SMALLER GLB:
  The panel_col attribute adds ~N_faces × 16 bytes to the file.  For a
  production WebXR asset, bake panel_col to a 512×512 image texture via
  bpy.ops.object.bake(type='DIFFUSE') after UV-unwrapping, then export
  with the baked texture and export_attributes=False to halve the file size.
  The GN UV Unwrap + Pack Islands tutorial covers the UV setup.`,
      },
    ],
    finalResult:
      "A metallic cube covered with 12 noise-clustered panel zones, each zone in a distinct dark-steel tint, with raised weld-seam tube geometry tracing the Voronoi-like boundaries between zones. The .blend file contains a 80-frame rotation animation. The GLB exports with the panel_col FLOAT_COLOR attribute and two material primitives (panel body + groove).",
    variations: [
      "Voronoi clustering: replace the Noise Texture with a Voronoi Texture (feature='F1', distance='EUCLIDEAN'). Map the Distance output (0..max_dist) through MapRange → FloatToInt for face set IDs. The panel boundaries will follow exact Voronoi cell walls rather than noise gradients, giving a more regular hexagonal or irregular polygon tiling depending on scale.",
      "Material-driven panels: replace the noise-based face_set with a NamedAttribute reading the mesh's material index (if you paint materials manually in Edit Mode). FaceGroupBoundaries will then place groove lines exactly where material assignments change — useful for hard-surface models where the panel layout is already defined by material zones.",
      "Sunken grooves via Boolean: instead of JoinGeometry, feed the groove tube mesh into GeometryNodeMeshBoolean(DIFFERENCE) with the panel body as the base. The tubes subtract recessed channels from the surface. Increase GROOVE_RADIUS to 0.04 and CIRCLE_VERTS to 8 for a clearly visible channel. Add a Subdivision Surface below the Boolean to smooth the groove edges.",
    ],
    troubleshooting: [
      {
        symptom: "FaceGroupBoundaries outputs True on every edge (entire mesh is 'boundary')",
        cause:
          "The Face Set field evaluates to a different value at every face — likely because the noise scale is too high (every face gets a unique noise sample) or NUM_GROUPS is equal to the number of faces.",
        fix: "Lower NOISE_SCALE (try 0.3–0.5 for a 2m cube at SUBDIV_LEVEL=3). Inspect the face_set attribute in the Spreadsheet editor (Domain=Face) to confirm clusters: you should see repeated integers across contiguous face groups, not all unique values.",
      },
      {
        symptom: "No groove tubes visible — CurveToMesh produces empty geometry",
        cause:
          "SeparateGeometry(domain='EDGE') received a False boolean selection everywhere, OR MeshToCurve received an edge-only mesh with zero edges. Check that sep.domain == 'EDGE' (not 'FACE') and that fgb.inputs['Face Set'] is correctly wired to the ftoi integer output.",
        fix: "Add a StoreNamedAttribute(domain='EDGE', data_type='BOOLEAN', name='is_boundary') driven from fgb.outputs['Boundary Edges'] on the sfs.outputs['Geometry']. Open Spreadsheet → Edge domain. If all values are False, the field chain is broken. If values are True but tubes are absent, check that sep.outputs[0] (not outputs[1]) feeds into MeshToCurve.",
      },
      {
        symptom: "panel_col attribute not accessible in Three.js after GLB load",
        cause:
          "export_attributes=False was passed to the glTF exporter, or the attribute was stored at FACE domain in Blender but landed under a different name after the exporter promoted it to a per-corner accessor.",
        fix: "In the browser console, log mesh.geometry.attributes after loading — custom glTF attributes are prefixed with an underscore per the spec, so 'panel_col' becomes '_panel_col'. Access via geo.attributes['_panel_col']. If it promoted to COLOR_0, use vertexColors: true on MeshStandardMaterial.",
      },
    ],
  },
  base,
);

export { entry };
