import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Geometry Nodes modifier runs in the context of the object that
        owns it — yet there is no direct way to ask &ldquo;where am I in world
        space?&rdquo; from inside the tree. The answer is{" "}
        <code>GeometryNodeSelfObject</code>, which outputs an Object socket
        pointing back at the modifier&apos;s host. Feeding that into{" "}
        <code>Object Info (transform_space = ORIGINAL)</code> gives the
        evaluated world matrix at depsgraph time — including{" "}
        <code>Location.Z</code>, which we combine with the local{" "}
        <code>Position.Z</code> field to build a world-height scalar per face
        centre. The result drives{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scale-elements-noise-driven-face-scale-diamond-plate"
          className={lk}
        >
          Scale Elements
        </Link>{" "}
        and emission colour simultaneously, turning an icosphere into a crystal
        that glows brightest near the world floor and dims as it rises — with no
        baking required.
      </p>

      <p className="mt-4">
        This is distinct from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-is-viewport-render-lod-switch-webxr"
          className={lk}
        >
          Is Viewport node
        </Link>
        , which switches geometry based on render context, and from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-active-camera-billboard-sprite-webxr-hud"
          className={lk}
        >
          Active Camera node
        </Link>
        , which reads the scene camera. Self Object reads the modifier
        object&apos;s own evaluated state — the only mechanism for truly
        self-referential GN behaviour.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why not <code>Length(Position)</code>?
      </h2>
      <p className="mt-2">
        <code>GeometryNodeInputPosition</code> returns coordinates in the
        object&apos;s <em>local</em> space. If you compute{" "}
        <code>Length(Position.Z)</code> and move the object 3 m upward, the
        gradient does not shift — the faces that were brightest at origin are
        still brightest at height 3, because local Z has not changed. Self
        Object breaks this dependency: it reads the depsgraph-evaluated world
        Location at the time GN runs, so the gradient updates every time you
        drag the object in the viewport.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Rotation caveat</h2>
      <p className="mt-2">
        The blueprint uses{" "}
        <code>local_pos.Z + obj.location.Z</code> as an approximation of world
        Z. This is exact only when the object has zero rotation. For a
        fully general solution, the Blender 5.1 node{" "}
        <code>FunctionNodeTransformPoint</code> (Utilities → Matrix → Transform
        Point) accepts a Vector and the Object Info <code>Matrix</code> output
        and returns the true world-space position per point. The tutorial uses
        the simpler form intentionally to keep the graph readable while still
        demonstrating the complete Self Object → Object Info → Location chain.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          Blender Manual — Self Object Node · CC-BY-SA 4.0 · Blender Foundation
          ·{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/self_object.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>{" "}
          · siblings: github.com/blender/blender, blender/blender-developer-docs
        </li>
        <li>
          njanakiev/blender-scripting — object-transform examples · MIT ·
          Nikolai Janakiev ·{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>{" "}
          · siblings: njanakiev/scikit-spatial, njanakiev/python-snippets
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-self-object-world-height-proximity-crystal-webxr",
  title:
    "GN Self Object + Object Info — World-Height Proximity Gradient: Self-Referencing Crystal for WebXR (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Use GeometryNodeSelfObject to read the modifier object's own world Z inside a GN tree, build a height-driven proximity gradient, and wire it to face scale + emission on a faceted crystal WebXR prop.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "2–3 hours",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 is open-source",
    supplies: {
      materials: [
        {
          name: "Blender 5.1",
          url: "https://www.blender.org/download/releases/5-1/",
          note: "GeometryNodeSelfObject available since Blender 3.5; 5.1 has the stable API.",
        },
      ],
      tools: [
        { name: "Geometry Nodes editor" },
        { name: "Spreadsheet editor (attribute inspection)" },
        { name: "Python Scripting workspace (blueprint.py runner)" },
        { name: "Material Properties → Shader Editor" },
      ],
    },
    prerequisites: [
      "Can build a GN tree by hand (add node, connect socket, set properties)",
      "Understands the difference between field sockets and geometry sockets",
      "Has run at least one blueprint.py in the Scripting workspace",
    ],
    steps: [
      {
        title: "Create an icosphere and open the GN editor",
        body: "Add → Mesh → Ico Sphere, Subdivisions = 2 (80 faces — enough for a\nfaceted crystal without exploding poly count).  Add a Geometry Nodes\nmodifier in Properties → Modifier.  Open the Geometry Nodes editor\n(Shift+F3).  You will see the default Group Input → Group Output wire.",
      },
      {
        title: "Add Self Object → Object Info chain",
        body: "Shift+A → Input → Scene → Self Object.\nShift+A → Input → Scene → Object Info.  Set Transform Space = Original.\nWire:  Self Object.Object → Object Info.Object.\n\nWHY ORIGINAL not RELATIVE: 'Relative' evaluates the object's matrix\nrelative to itself — Location is always (0,0,0).  'Original' returns the\ndepsgraph-evaluated world matrix at the current frame.",
      },
      {
        title: "Extract world Z from Location and local Z from Position",
        body: "Shift+A → Utilities → Vector → Separate XYZ.  Wire:\n  Object Info.Location → this Separate XYZ → Z output = obj_world_z.\n\nShift+A → Input → Geometry → Position.\nShift+A → Utilities → Vector → Separate XYZ.  Wire:\n  Position → this second Separate XYZ → Z = local_face_z.\n\nShift+A → Utilities → Math.  Set operation = Add.  Wire:\n  local_face_z → Math.inputs[0]\n  obj_world_z  → Math.inputs[1]\n  Math.Value = approximate world Z per face centre.",
      },
      {
        title: "Map world Z → proximity_t and store as named attribute",
        body: "Shift+A → Utilities → Map Range.  Clamp ON.\n  From Min = -0.5  (WORLD_FLOOR: fully hot)\n  From Max = 3.5   (WORLD_CEIL: fully cool)\n  To Min = 1.0     (low Z → proximity_t = 1)\n  To Max = 0.0     (high Z → proximity_t = 0)\n\nShift+A → Attribute → Store Named Attribute.\n  Domain = Point\n  Data Type = Float\n  Name = 'proximity_t'\nWire:\n  Group Input.Geometry → Store.Geometry\n  Map Range.Result    → Store.Value",
      },
      {
        title: "Flat-shade and drive Scale Elements",
        body: "Shift+A → Mesh → Set Shade Smooth.  Domain = Face.  Shade Smooth = OFF.\nWire: Store.Geometry → Shade.Geometry.\n\nShift+A → Utilities → Map Range (second node).  Clamp ON.\n  From Min = 0, From Max = 1\n  To Min = 0.35 (SCALE_COOL), To Max = 1.6 (SCALE_HOT)\nWire: proximity_t → second Map Range.Value.\n\nShift+A → Mesh → Scale Elements.  Domain = Face.  Scale Mode = Uniform.\nWire:\n  Shade.Geometry   → Scale Elements.Geometry\n  second MapRange  → Scale Elements.Scale\n\nScale Elements UNIFORM operates about each face's individual centroid —\nfaces splay open like petals rather than translating the mesh origin.",
      },
      {
        title: "Set material and close the node graph",
        body: "Shift+A → Geometry → Set Material.  Assign a new material (see step 7).\nWire: Scale Elements.Geometry → Set Material.Geometry → Group Output.\n\nIn Properties → Modifier, confirm the GN modifier is enabled and the\nnode group is attached.",
      },
      {
        title: "Wire the emission material via Named Attribute",
        body: "In the Material Shader Editor (Shader Editor workspace):\n\nShift+A → Input → Attribute.\n  Attribute Name = 'proximity_t'\n  Type = Geometry\n\nShift+A → Converter → Color Ramp.\n  Stop 0 (pos 0.0) = deep violet  (0.15, 0.05, 0.35)\n  Stop 1 (pos 1.0) = cyan         (0.05, 0.80, 1.00)\n\nShift+A → Shader → Emission.  Strength = 4.0.\nMaterial Output.Surface ← Emission ← Color Ramp ← Attribute.Fac.\n\nIn the 3D Viewport press G Z and drag: the glow band slides in real-time.",
      },
      {
        title: "Animate and export GLB",
        body: "Keyframe the crystal's Z location:\n  Frame 1:  Z = 0  →  I → Location\n  Frame 60: Z = 3  →  I → Location\n\nPlay back: the cyan glow band travels from base to tip as the crystal rises.\n\nExport GLB (File → Export → glTF 2.0):\n  Format: GLB, Apply Modifiers: ON, +Y Up: ON\n  Draco: enabled, level 6\n  Attributes: ON  (preserves proximity_t in the GLB)\n  Image format: WebP\n\nOr run: export_glb() in blueprint.py after main().\nExpected: ~30 KB GLB, 320 vertices, 80 tris (flat icosphere after bake).",
      },
    ],
    finalResult:
      "A faceted icosphere crystal whose face scale and emission colour are driven by a live world-height proximity gradient — computed entirely inside the GN tree via Self Object + Object Info. Exports as crystal_proximity.glb (~30 KB, Draco 6, +Y up) with the proximity_t vertex attribute preserved for Three.js. The rising animation in record.py demonstrates the glow band moving from base to apex over 60 frames.",
    variations: [
      "World-distance from a target object (not world origin): add a second Object socket Group Input, wire a reference object's Object Info alongside Self Object, compute the vector between the two Location outputs, take its length, and use that as the proximity field. This creates cross-object proximity effects without any Python scripting.",
      "Pulsing animation with drivers: instead of keyframing object.location.z, add a GN Group Input socket 'Phase' (Float, driven by a sine wave driver on bpy.context.scene.frame_current). Multiply the sine output against WORLD_CEIL/2 and feed into the MapRange.From Max socket via a Group Input. The gradient oscillates without the object physically moving.",
      "Multi-crystal array: use a Collection Info node to instance 10–20 crystals at random positions, then apply the Self Object GN to each instance's realised geometry. Because each instance is a separate evaluated object, Self Object correctly reads each one's individual world position — no instancing hack needed.",
    ],
    troubleshooting: [
      {
        symptom: "Glow gradient does not change when I move the object",
        cause:
          "Object Info has transform_space = 'RELATIVE' instead of 'ORIGINAL'.",
        fix:
          "Select the Object Info node → N-panel → Properties → Transform Space = Original.  In Relative mode, Location is always (0,0,0) because it is evaluated relative to the object itself.",
      },
      {
        symptom: "proximity_t shows as all 0 in the Spreadsheet",
        cause:
          "The Store Named Attribute domain is 'Edge' or 'Face' instead of 'Point', or the data_type is not 'FLOAT'.",
        fix:
          "Check Store Named Attribute: Domain = Point, Data Type = Float.  The Map Range.Result socket must be a Float scalar (not a Vector) before wiring into Value.",
      },
      {
        symptom: "Emission material shows purple/pink noise instead of the gradient",
        cause:
          "Attribute node attribute_type is 'OBJECT' or 'INSTANCER' instead of 'GEOMETRY'.",
        fix:
          "Select the Attribute shader node → Properties → Type = Geometry.  GEOMETRY scope reads vertex/face attributes baked into the mesh by GN StoreNamedAttribute.",
      },
      {
        symptom: "GLB export produces 0 attributes in gltf-validator",
        cause:
          "export_attributes=False (the default) strips custom named attributes on export.",
        fix:
          "In the export dialog → Data tab → enable 'Custom Attributes'.  In blueprint.py this corresponds to export_attributes=True in bpy.ops.export_scene.gltf().",
      },
    ],
  },
  base,
);
