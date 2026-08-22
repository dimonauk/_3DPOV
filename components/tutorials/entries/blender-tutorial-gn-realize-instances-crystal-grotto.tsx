import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnRealizeInstancesBody() {
  return (
    <>
      <p>
        <strong>GeometryNodeRealizeInstances</strong> converts Blender&rsquo;s
        lightweight instance list into actual vertex geometry.  Inside a Geometry
        Nodes modifier, <em>Instance on Points</em> does not create real mesh
        vertices — it records a list of transforms (position, rotation, scale)
        each pointing at the same prototype mesh.  This is efficient for display
        (Blender renders 110 crystals by drawing one shard 110 times with different
        matrices), but it presents a problem for export: the GLB vertex buffer
        needs real vertex data, and Draco can only compress real vertices.  Without
        Realize Instances in the node tree, <code>export_apply=True</code> bakes
        the modifier, but the exporter may write only the single prototype shard
        plus a list of transforms under the{" "}
        <code>EXT_mesh_gpu_instancing</code> glTF extension — a representation
        that some WebXR viewers and all Draco compressors cannot handle.  Realize
        Instances solves this by collapsing all 110 copies into a single merged
        vertex buffer at evaluation time.  The resulting mesh has ~2 860 vertices
        (110 copies × 26-vertex shard), Draco level 6 compresses it to roughly
        6 KB, and Three.js loads it with a plain <code>GLTFLoader</code>.  See
        how Instance on Points is first set up in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points tutorial
        </Link>
        , and how the full GLB export pipeline works in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          GN UV Unwrap + Pack Islands — GLB Export tutorial
        </Link>
        .
      </p>

      <p>
        The subtler challenge is keeping per-instance data alive through
        realization.  When Geometry Nodes evaluates a{" "}
        <code>FunctionNodeRandomValue</code> field with seed 31, the value it
        returns depends on the <em>domain</em> it is evaluated at.  At INSTANCE
        domain — one evaluation per instance — you get one hue per crystal.  At
        POINT domain — one evaluation per vertex — you get a different random
        value at every vertex of every crystal: a per-vertex noise pattern rather
        than a per-crystal colour.  Realize Instances destroys the INSTANCE domain
        entirely, so if you wire{" "}
        <code>RandomValue → StoreNamedAttribute</code> with no Capture Attribute
        in between, the Store node evaluates after realization and reads POINT
        domain, producing per-vertex chaos.  The fix is{" "}
        <strong>CaptureAttribute placed before Realize Instances</strong>, with{" "}
        <code>domain&thinsp;=&thinsp;INSTANCE</code>.  This stamps the random
        hue onto the instance data structure before it is destroyed.  When Realize
        Instances runs, it copies every instance&rsquo;s captured attribute to all
        the vertices produced by that instance — every vertex of a single crystal
        gets the same value.  The domain is now POINT (the only one that survives
        realization), but the value is still uniform across each crystal.  The
        Attribute output from Capture Attribute carries this propagated field
        forward to the StoreNamedAttribute node, which gives it the stable name{" "}
        <code>crystal_hue</code>.  The same CaptureAttribute pattern for named
        attributes in general is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          GN Capture Attribute + Named Attribute tutorial
        </Link>
        .
      </p>

      <p>
        On the material side, <code>ShaderNodeAttribute</code> with{" "}
        <code>attribute_type&thinsp;=&thinsp;&apos;GEOMETRY&apos;</code> reads the
        per-vertex float from the mesh in the shader graph.  Its{" "}
        <code>Fac</code> output connects to a <code>HueSaturation</code> node&rsquo;s
        Hue socket, converting the [0, 1] float into a full-saturation colour.
        Emission at strength 1.6 makes each crystal self-illuminate — important
        in a cave scene where direct lighting would darken back-facing shards.
        After <code>export_apply&thinsp;=&thinsp;True</code> bakes the modifier
        and <code>export_attributes&thinsp;=&thinsp;True</code> writes the custom
        accessor, the GLB stores <code>_crystal_hue</code> as a float32 per-vertex
        array.  In Three.js, read it via{" "}
        <code>geometry.attributes[&apos;_crystal_hue&apos;]</code> and apply it
        with a custom shader material or a{" "}
        <code>MeshStandardMaterial</code> with vertex colours.  The phyllotaxis
        tutorial uses the same Realize Instances pattern for Draco compression —
        see the notes in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower"
          className={lk}
        >
          GN Rotate Instances — Phyllotaxis Sunflower tutorial
        </Link>
        .  For delivering the final GLB into a WebXR scene with the Holoflow
        exporter, the faceted gem pipeline is the established precedent:{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          Faceted Gem WebXR Export tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-realize-instances-crystal-grotto",
  title:
    "GN Realize Instances — Crystal Grotto: Per-Instance Colour Attributes and GLB Export Prep (Blender 5.1)",
  date: "2026-06-10",
  kind: "tutorial",
  excerpt:
    "GeometryNodeRealizeInstances converts a lightweight instance list into a real merged vertex buffer, enabling Draco GLB export of Instance on Points geometry. This tutorial demonstrates the CaptureAttribute(domain=INSTANCE)→RealizeInstances→StoreNamedAttribute pipeline that keeps per-crystal hues alive through realization, driving unique emission colour on each of 110 hexagonal shards.",
  Body: GnRealizeInstancesBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-instance-on-points",
      label: "Tutorial — GN Instance on Points",
      note: "The foundational InstanceOnPoints setup that this tutorial extends with Realize Instances.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-capture-attribute-named-attribute",
      label: "Tutorial — GN Capture Attribute + Named Attribute",
      note: "Deep dive on CaptureAttribute domain semantics and the Named Attribute read pattern in materials.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb",
      label: "Tutorial — GN UV Unwrap + Pack Islands — GLB Export",
      note: "Full GLB export pipeline with UV, Draco, and WebP textures from a GN modifier.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-gem-webxr",
      label: "Tutorial — Faceted Gem WebXR Export",
      note: "WebXR delivery pipeline for faceted geometry; complementary to the crystal grotto export approach.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower",
      label: "Tutorial — GN Rotate Instances — Phyllotaxis Sunflower Array",
      note: "Another InstanceOnPoints + RealizeInstances workflow; compare golden-angle scatter vs face-based Poisson scatter.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/realize_instances.html",
      label:
        "Blender Manual — Realize Instances Node (CC-BY-SA 4.0 — Blender Documentation Team)",
      note: "Official node reference. Key facts: single Geometry input/output; no domain selector; the Realize Depth input (default 0 = fully recursive) controls how many levels of nested instances are realized — useful when instances themselves contain GN modifiers with sub-instances. After realization, the output is always a standard mesh with POINT and FACE domains. Related: blender/blender source tree, geometry_nodes_realize_instances.cc for implementation; the CaptureAttribute node reference at /modeling/geometry_nodes/attribute/capture_attribute.html.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — Official glTF Exporter (Apache-2.0 — Khronos Group)",
      note: "The Blender glTF exporter source. Relevant for understanding how export_apply=True evaluates the NODES modifier stack, how export_attributes=True writes custom vertex attributes with underscore prefix (glTF spec §2.4 custom attributes), and how EXT_mesh_gpu_instancing is written for un-realized instance geometry. Related projects: KhronosGroup/glTF (specification, Apache-2.0), KhronosGroup/glTF-Sample-Models (test assets, Apache-2.0), three.js GLTFLoader source.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "blender-scripting — Headless bpy Scripting Patterns (MIT — Nicolas Janakiev)",
      note: "Reference collection covering node group construction, interface socket enumeration via ng.interface.items_tree, ObjectInfo transform_space modes, and bmesh polygon construction. The socket identifier lookup pattern (iterating items_tree for name → identifier mapping) used in blueprint.py is demonstrated in the node_groups examples. Related sibling resources: blender-python-snippets (Blender Artists community, CC0).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "one hour",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-realize-instances-crystal-grotto/",
    prerequisites: [
      "Comfortable with the Geometry Nodes editor: can add nodes, connect sockets, read a node graph.",
      "Blender 5.1 installed; can run a .py script via the Text Editor workspace.",
      "Understands Instance on Points basics — what instances are and how DistributePointsOnFaces scatters them.",
      "Has read or worked through the Capture Attribute + Named Attribute tutorial.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeRealizeInstances exists since Blender 3.0. In 5.1 it is listed under Instances in the Add Node (Shift+A) menu. The Rotation output on DistributePointsOnFaces (for normal alignment) requires Blender 4.0+. The domain='INSTANCE' on CaptureAttribute is available since Blender 3.2.",
      },
    ],
    steps: [
      {
        title: "Understand the instance model and why Realize Instances is necessary",
        body: "A Geometry Nodes modifier can hold two very different kinds of geometry:\n\n  REAL GEOMETRY: actual vertex/edge/face data. Blender stores the vertex buffer\n    in memory. Draco compresses it. The GLB POSITION accessor holds it.\n\n  INSTANCE GEOMETRY: a list of transform records, each pointing to a prototype mesh.\n    There is no vertex buffer — just (translation, rotation, scale) × N and one\n    shared mesh.\n\nInstanceOnPoints produces INSTANCE geometry. This is the correct tool for\nlarge counts: 110 crystals stored as 110 transform records + 1 prototype mesh\nis far cheaper than 110 × 26 = 2 860 vertices. Blender renders instances by\ndrawing the prototype mesh 110 times with different matrices (GPU instancing).\n\nHowever:\n  1. Draco operates on vertex buffers — it cannot compress a transform list.\n  2. The glTF exporter may write un-realized instances using EXT_mesh_gpu_instancing,\n     which many WebXR viewers (including some versions of Three.js and all\n     Holoflow exporter configurations) do not handle correctly.\n  3. Per-instance attributes (one value per instance) do not have a glTF\n     equivalent — they must be converted to per-vertex attributes before export.\n\nGeometryNodeRealizeInstances resolves all three: it evaluates every instance\ninto real vertices at modifier evaluation time, producing a single merged mesh\nthat exports cleanly as a standard POSITION/NORMAL/attribute accessor set.",
      },
      {
        title: "Build the hexagonal crystal shard prototype with bmesh",
        body: "The prototype is a 6-sided prism tapering to an apex:\n\n  n = 6 sides\n  h = SHARD_HEIGHT = 0.28 m\n  tip_z = h × (1 − SHARD_TIP_FRAC) = 0.28 × 0.72 = 0.2016 m\n\n  base ring: 6 vertices at Z = 0, radius SHARD_HEX_RADIUS = 0.042 m\n  top ring:  6 vertices at Z = tip_z, radius 0.021 m (50 % taper)\n  apex:      1 vertex at Z = h\n\n  Faces:\n    bm.faces.new(reversed(base_verts))  — bottom cap, −Z normal\n    for i in range(6): bm.faces.new([base[i], base[i+1], top[i+1], top[i]])\n    for i in range(6): bm.faces.new([top[i], top[i+1], apex])\n\n  mesh.shade_flat() propagates to realized copies.\n  obj.hide_render = True; obj.hide_viewport = True\n    — the prototype must not appear directly in the render.\n\nWHY reversed(base_verts) for the bottom cap:\n  Blender determines face normal from vertex winding order (right-hand rule).\n  Going around the ring in the same angular order as construction gives a +Z\n  normal (face visible from above). The base cap faces DOWNWARD, so we reverse\n  to get a −Z normal pointing away from the crystal body.\n\nWHY hexagonal cross-section:\n  6 sides gives a faceted gem character with flat shading. 4 sides reads as a\n  post or pillar; 8 sides looks nearly round at small scale. The tapered top ring\n  (50 % radius) produces a clear shoulder and apex — recognisably crystalline.",
      },
      {
        title: "Scatter instances on a sphere with DistributePointsOnFaces",
        body: "Node setup:\n\n  dpt = GeometryNodeDistributePointsOnFaces\n  dpt.mode = 'POISSON_DISK'\n  dpt.inputs['Distance Min'] = SPHERE_RADIUS × 0.14  (≈ 0.123 m)\n\nPOISSON_DISK distributes points such that no two points are closer than Distance Min.\nThis produces a natural, non-uniform scatter without the grid artefacts of RANDOM mode.\nDistance Min = 14 % of sphere radius limits crystal overlap without producing perfectly\nregular spacing.\n\n  ionp = GeometryNodeInstanceOnPoints\n  oi   = GeometryNodeObjectInfo  → inputs[0] = shard_obj\n  oi.transform_space = 'ORIGINAL'\n\n  links.new(dpt.outputs['Points'],    ionp.inputs['Points'])\n  links.new(dpt.outputs['Rotation'],  ionp.inputs['Rotation'])\n  links.new(oi.outputs['Geometry'],   ionp.inputs['Instance'])\n\nWHY transform_space='ORIGINAL':\n  'ORIGINAL' uses the prototype object's mesh as-is, in its own local space.\n  'RELATIVE' would offset each instance relative to the scatter sphere origin,\n  causing crystals to be displaced sideways if the prototype is not at origin.\n\nWHY DistributePointsOnFaces.Rotation (not Normal):\n  The Rotation output (added in Blender 4.0) directly provides the Euler rotation\n  that aligns the instance's +Z axis to the face normal. This is the same as\n  AlignEulerToVector(Normal, axis='Z') but more concise. All crystals grow\n  perpendicular to the sphere surface.\n\nHeight variety via random Z scale:\n  rscl = FunctionNodeRandomValue(data_type='FLOAT', Min=0.45, Max=2.0, Seed=7)\n  cscl = ShaderNodeCombineXYZ(X=1.0, Y=1.0)\n  links.new(rscl.outputs['Value'], cscl.inputs['Z'])\n  links.new(cscl.outputs['Vector'], ionp.inputs['Scale'])\n  Scaling only Z preserves the hex cross-section while varying crystal height.",
      },
      {
        title: "CaptureAttribute at INSTANCE domain — the order-sensitive step",
        body: "This step is the entire reason for the tutorial.\n\n  rhue = FunctionNodeRandomValue(data_type='FLOAT', Min=0.0, Max=1.0, Seed=31)\n  cap  = GeometryNodeCaptureAttribute\n  cap.domain    = 'INSTANCE'\n  cap.data_type = 'FLOAT'\n\n  links.new(ionp.outputs['Instances'],  cap.inputs['Geometry'])\n  links.new(rhue.outputs['Value'],      cap.inputs[1])  # Value socket\n\nWhat CaptureAttribute does:\n  It evaluates the field connected to its Value socket AT the specified domain,\n  stores the result in the geometry's attribute data, and exposes that stored\n  result via the Attribute output (a field referencing the now-committed value).\n\nWhy INSTANCE domain here:\n  At this point in the node chain, the geometry IS instances (not real vertices).\n  Domain='INSTANCE' tells CaptureAttribute to evaluate one value per instance.\n  rhue produces a different random float for each instance index (0, 1, 2…).\n  After capture, instance 0 has hue=0.312, instance 1 has hue=0.751, etc.\n\nWhy this must come BEFORE RealizeInstances:\n  After RealizeInstances, the INSTANCE domain no longer exists in the geometry.\n  If you place CaptureAttribute after Realize, its domain='INSTANCE' has nothing\n  to evaluate against — it falls back to POINT domain, giving a different random\n  value at each vertex of every crystal: multicolour noise per shard, not one\n  colour per shard.\n\nVerify the correct behaviour: in the Spreadsheet editor (Object Data Properties),\n  set the domain to INSTANCE before RealizeInstances and confirm one row per shard.",
      },
      {
        title: "RealizeInstances and StoreNamedAttribute — naming the attribute",
        body: "  real  = GeometryNodeRealizeInstances\n  links.new(cap.outputs['Geometry'], real.inputs['Geometry'])\n\nRealizeInstances evaluates:\n  1. For each instance, it expands the prototype mesh vertices into world space\n     (applying the instance transform: scatter point + normal rotation + Z scale).\n  2. It copies all INSTANCE-domain attributes to the vertex data of the resulting mesh.\n     Each vertex of crystal_0 gets the value that was stored on instance_0.\n  3. The output is a single merged mesh with POINT domain attributes.\n\nNow StoreNamedAttribute gives the propagated value a stable name:\n\n  store = GeometryNodeStoreNamedAttribute\n  store.domain    = 'POINT'\n  store.data_type = 'FLOAT'\n  store.inputs['Name']   = 'crystal_hue'\n\n  links.new(real.outputs['Geometry'],   store.inputs['Geometry'])\n  links.new(cap.outputs[1],             store.inputs[3])  # Attribute → Value\n\nWHY StoreNamedAttribute after Realize (not before):\n  NamedAttribute in materials reads from the mesh's POINT domain. The captured\n  INSTANCE attribute is only accessible via the Attribute field output — it is\n  not automatically promoted to a named attribute. StoreNamedAttribute at POINT\n  domain writes it with the name 'crystal_hue', making it available to materials\n  via ShaderNodeAttribute(attribute_name='crystal_hue').\n\nWHY store.inputs[3] and not store.inputs['Value']:\n  Both work. Index notation is safer against sub-version socket renaming.\n  cap.outputs[1] is the Attribute field output; store.inputs[3] is the Value\n  socket on StoreNamedAttribute (after Geometry, Selection, Name).",
      },
      {
        title: "Emission material driven by the named attribute",
        body: "In the shader graph:\n\n  attr = ShaderNodeAttribute\n  attr.attribute_type = 'GEOMETRY'\n  attr.attribute_name = 'crystal_hue'\n\n  hsv  = ShaderNodeHueSaturation\n  hsv.inputs['Saturation'] = 0.90\n  hsv.inputs['Value']      = 1.00\n  hsv.inputs['Fac']        = 1.00\n\n  emit = ShaderNodeEmission\n  emit.inputs['Strength'] = 1.6\n\n  links: attr.Fac → hsv.Hue → hsv.Color → emit.Color → emit.Emission → Output.Surface\n\nWHY ShaderNodeAttribute.Fac not .Color:\n  When attribute_type='GEOMETRY' and the attribute is a FLOAT scalar,\n  the Fac output returns that scalar directly. The Color output would\n  interpret a float as (f, f, f, 1) — grey. Fac → hsv.Hue converts the\n  float through the full colour wheel: 0.0=red, 0.33=green, 0.66=blue, 1.0=red.\n\nWHY Emission not Principled BSDF:\n  Principled BSDF with per-vertex base colour requires an additional attribute\n  switch node to pipe GEOMETRY domain colour into the Base Color socket. Emission\n  reads the attribute directly and produces lighting-independent output — crystals\n  glow their own hue regardless of the key light direction, which is the correct\n  read for cave bioluminescence.",
      },
      {
        title: "Export to GLB and read the attribute in Three.js",
        body: "Export at a static frame (before the rotation animation is baked):\n\n  bpy.ops.export_scene.gltf(\n      filepath='//crystal_grotto.glb',\n      export_format='GLB',\n      export_apply=True,          # bakes the NODES modifier\n      export_attributes=True,     # writes custom vertex attributes\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_yup=True,\n      export_animations=False,\n  )\n\nexport_apply=True:\n  The NODES modifier is evaluated at the current frame, Realize Instances runs,\n  and the resulting mesh is what goes into the GLB. Without this flag, the exporter\n  writes the unmodified sphere geometry (the scatter surface, not the crystals).\n\nexport_attributes=True:\n  The 'crystal_hue' named attribute is written as the glTF custom vertex attribute\n  '_crystal_hue' (underscore prefix per glTF spec §2.4). The value is a float32\n  accessor bound to the POSITION's vertex count.\n\nVerify in a glTF JSON inspector:\n  meshes[0].primitives[0].attributes._crystal_hue → accessor index N\n  accessors[N].type = 'SCALAR', componentType = 5126 (FLOAT)\n  min/max should be [0.0, 1.0]\n\nThree.js consumption:\n  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'\n  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'\n  loader.load('/library/blends/geometry-nodes/gn-realize-instances-crystal-grotto/crystal_grotto.glb',\n    gltf => {\n      const mesh = gltf.scene.children[0]\n      const hues = mesh.geometry.attributes['_crystal_hue']  // Float32BufferAttribute\n      // Use in a ShaderMaterial as vHue varying, or map through a gradient texture\n    }\n  )",
      },
    ],
    finalResult:
      "A coloured crystal grotto sphere: 110 hexagonal shards each glowing a unique hue, realized into a single ~2 860-vertex mesh. The .blend file includes a 120-frame rotation animation. The GLB is ~6 KB Draco-compressed and carries the _crystal_hue float32 vertex attribute for Three.js consumption.",
    variations: [
      "Negative-space interior grotto: invert the sphere normals (Flip Faces node before DistributePointsOnFaces, or set Scale_Z = -1 on the scatter sphere) so crystals grow inward from the sphere surface. Place the camera inside. Add a HDRI environment texture for ambient cave lighting. Scale the sphere to SPHERE_RADIUS=2.5 m so the camera is fully enclosed. The export is identical — Realize Instances runs the same way; only the shard orientation changes.",
      "Animated seed morphing: add a second group input 'Seed' wired to DistributePointsOnFaces.Seed and FunctionNodeRandomValue.Seed. Keyframe mod[seed_id] from 0 to 30 over 120 frames with LINEAR interpolation. Each frame, the scatter pattern and all hues change — a flickering bioluminescent effect. Export with export_animations=True to capture the seed keyframes. Note: this exports an animation track on the modifier socket, not shape keys; playback in Three.js requires the GLTF animation clip from gltf.animations[0].",
      "Multi-prototype crystal types: add a second shard prototype (e.g. a square-based prism using n=4). Use FunctionNodeRandomValue(data_type='INT', Min=0, Max=1) at INSTANCE domain to choose between the two. Wire the integer to InstanceOnPoints.Pick Instance (enabled) and InstanceOnPoints.Instance Index. This demonstrates instance picking with Realize Instances: the realized mesh merges both prototype types into one vertex buffer, each shard type keeping its geometry but sharing the same material and _crystal_hue attribute.",
    ],
    troubleshooting: [
      {
        symptom: "All crystals are the same colour after realization",
        cause: "CaptureAttribute is placed AFTER RealizeInstances in the node chain, so it evaluates at POINT domain (per-vertex random) rather than INSTANCE domain (per-crystal random). Per-vertex random values in an emission material produce a noisy result that averages to a near-neutral colour in EEVEE's screen-space evaluation.",
        fix: "Move CaptureAttribute to before RealizeInstances. In the Geometry Nodes editor, confirm the connection order: ionp.Instances → cap.Geometry → real.Geometry → store.Geometry. The Spreadsheet editor with domain set to INSTANCE (before Realize) should show one distinct float per shard row.",
      },
      {
        symptom: "export_apply=True exports a smooth sphere, not crystals",
        cause: "The NODES modifier is disabled (the eye/render icon in the modifier stack is off), or the node group has a broken link preventing evaluation.",
        fix: "Enable the NODES modifier in the Properties panel → Modifiers tab. Check the Geometry Nodes editor for red sockets (type mismatch) or missing object references (the shard_obj ObjectInfo input). Re-run blueprint.py if needed — it re-creates the entire node graph from scratch.",
      },
      {
        symptom: "GLB loads in Three.js but geometry.attributes['_crystal_hue'] is undefined",
        cause: "export_attributes=True was not set, or the attribute name in StoreNamedAttribute does not match the name used in the glTF accessor lookup.",
        fix: "Re-export with export_attributes=True. Verify the attribute name in store.inputs['Name'].default_value is exactly 'crystal_hue' (no trailing space). In the GLB JSON, the accessor name will be '_crystal_hue' (underscore prefix added by the exporter per glTF spec §2.4). Three.js attribute key must include the underscore: geometry.attributes['_crystal_hue'], not geometry.attributes['crystal_hue'].",
      },
    ],
  },
  base,
);

export { entry };
