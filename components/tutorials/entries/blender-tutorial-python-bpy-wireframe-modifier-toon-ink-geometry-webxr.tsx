import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.WireframeModifier</code> converts every edge of a mesh
        into a flat quad tube. The result is real polygon geometry — it has
        normals, accepts materials, and exports cleanly to GLB. That makes it
        the correct tool for toon ink lines in WebXR, where no Freestyle
        equivalent exists and <code>THREE.EdgesGeometry</code> produces
        1-pixel-thick lines that vanish at oblique angles.
      </p>

      <h2>Why not Freestyle</h2>
      <p>
        Freestyle is a post-process pass that runs inside Blender's compositing
        pipeline. Three.js, Babylon.js, and PlayCanvas have no analogue: there
        is no{" "}
        <code>THREE.FreestylePass</code>, no WebXR extension for vector line
        rendering, no depth-aware edge detection in standard glTF materials.
        The only portable ink-line technique is to bake the lines as actual
        mesh geometry before export and let the runtime treat them as ordinary
        triangles.
      </p>
      <p>
        The GP3 Line Art modifier (see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gp3-lineart-modifier-toon-outline-batch-vrm"
          className={lk}
        >
          GP3 LineArt tutorial
        </Link>
        ) solves the same problem from the Grease Pencil side: it generates
        strokes that can also be converted to mesh. WireframeModifier is
        simpler when you only need ink on structural edges, not silhouette-based
        contours.
      </p>

      <h2>The replace problem</h2>
      <p>
        WireframeModifier does not add wire quads on top of the existing mesh:
        it <em>replaces</em> all faces with quads, leaving only the wire
        geometry. If you apply it to your fill object, you lose the fill. The
        solution is to duplicate the mesh before applying.
      </p>
      <pre><code>{`# ─── Fill object ─────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.6)
ico_fill      = bpy.context.active_object
ico_fill.name = "hf_fill"

for poly in ico_fill.data.polygons:
    poly.use_smooth = False    # flat-shade: each face its own constant normal

ico_fill.data.materials.append(mat_fill)  # slot 0 → fill faces
ico_fill.data.materials.append(mat_wire)  # slot 1 → reserved for wire object

# ─── Wire object ──────────────────────────────────────────────────────────
ico_wire      = ico_fill.copy()
ico_wire.data = ico_fill.data.copy()   # deep copy: modifier targets this mesh
ico_wire.name = "hf_wire"
bpy.context.collection.objects.link(ico_wire)`}</code></pre>

      <h2>Modifier parameters</h2>
      <pre><code>{`wf = ico_wire.modifiers.new("Wireframe", 'WIREFRAME')
wf.thickness = 0.0095      # absolute tube half-width in metres

# use_even_offset=True: uniform line weight regardless of local edge length.
# WHY: on a subdivided icosphere, edge lengths vary by ~8 % across latitudes.
# Without even offset, wires near poles appear thicker than wires at the equator.
wf.use_even_offset = True

# use_relative_offset=False: absolute offset, not scaled by adjacent edge length.
# True produces calligraphic variable-weight lines — wrong for cel-animation ink.
wf.use_relative_offset = False

# use_boundary=True: include open mesh boundary edges.
# Without this, any cut or open border produces an unlined rim.
wf.use_boundary = True

# material_offset shifts the wire-quad material index by N above the source face.
# All icosphere faces are at slot 0 → wire quads land at slot 0 + 1 = 1.
wf.material_offset = 1`}</code></pre>
      <p>
        The <code>crease_weight</code> property (default 0.0) controls how
        strongly Subdivision Surface respects wire edges — not relevant here,
        but worth knowing if you stack a Subdiv on top.
      </p>

      <h2>Applying the modifier</h2>
      <pre><code>{`bpy.context.view_layer.objects.active = ico_wire
bpy.ops.object.modifier_apply(modifier="Wireframe")
# ico_wire now contains only wire quads; all original faces are gone.
# Face material indices: slot 1 (mat_wire) on every quad.`}</code></pre>
      <p>
        After apply, <code>ico_wire</code> has no modifier stack. The wire
        quads are baked mesh data — stable across file saves, Python restarts,
        and GLB export.
      </p>

      <h2>Z-fighting and polygon offset</h2>
      <p>
        Wire quads straddle the fill surface plane: the modifier extrudes half
        the tube inward and half outward from the source edge. Where a wire quad
        crosses a fill face, both occupy the same depth value and the GPU
        alternates between them per-pixel — a classic Z-fight.
      </p>
      <p>
        The fix lives in the runtime, not in Blender. In Three.js, set{" "}
        <code>polygonOffset</code> on the wire material:
      </p>
      <pre><code>{`// Three.js runtime — apply after loading the GLB
gltf.scene.traverse((node) => {
  if (node.isMesh && node.name === "hf_wire") {
    node.material.polygonOffset        = true;
    node.material.polygonOffsetFactor  = -1;  // push wire slightly toward cam
    node.material.polygonOffsetUnits   = -1;
    node.material.needsUpdate          = true;
  }
});`}</code></pre>
      <p>
        <code>polygonOffsetFactor = -1</code> biases the wire mesh's depth
        values a fraction of a pixel toward the camera, resolving the fight
        without visibly shifting the geometry. This is the same mechanism used
        by decal rendering — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
          className={lk}
        >
          edge attribute tutorial
        </Link>{" "}
        for how edge-level flags feed the same pipeline.
      </p>

      <h2>Export — two objects in one GLB</h2>
      <pre><code>{`bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = ico_fill

bpy.ops.export_scene.gltf(
    filepath="/tmp/hf_wireframe_toon.glb",
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
    export_apply=False,   # transforms already applied with transform_apply()
    use_selection=True,
    export_yup=True,      # +Y up for WebXR
)`}</code></pre>
      <p>
        The resulting GLB contains two mesh primitives:{" "}
        <code>hf_fill</code> with the cobalt facet material and{" "}
        <code>hf_wire</code> with the near-black ink material. Both share the
        same world transform. Draco compresses each independently; wire quads
        compress well because they are regular, repetitive geometry.
      </p>
      <p>
        For faceted shading details on the fill mesh — including why{" "}
        <code>use_smooth = False</code> is set per polygon rather than via an
        operator — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr"
          className={lk}
        >
          custom split normals tutorial
        </Link>
        . For modifier stack apply order and why{" "}
        <code>export_apply=False</code> is safe after{" "}
        <code>bpy.ops.object.transform_apply()</code>, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
          className={lk}
        >
          Boolean + Weld tutorial
        </Link>
        .
      </p>

      <h2>Thickness calibration</h2>
      <p>
        A reliable starting formula: set <code>WIRE_THICKNESS</code> to 1.5 %
        of the object's bounding-box diagonal. For an icosphere of radius 0.6 m
        (diagonal ≈ 1.2 m), that gives{" "}
        <code>1.2 × 0.015 = 0.018 m</code>. Halve it for a crisp single-pixel-
        equivalent line: <code>0.009 m</code>. Adjust upward for thick manga
        outlines, downward for architectural technical drawings.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Wire vanishes at grazing angles.</strong> Wire quads have no
        thickness in the Z direction — they are flat quads laid along each edge.
        At true grazing angle (90°) they are edge-on and disappear. This is
        physically correct behaviour, not a bug. Use a slightly larger{" "}
        <code>thickness</code> value or accept the limitation as part of the
        aesthetic.
      </p>
      <p>
        <strong>Wire is thicker near the poles.</strong> Set{" "}
        <code>use_even_offset = True</code>. If already set, confirm{" "}
        <code>use_relative_offset = False</code>.
      </p>
      <p>
        <strong>Boundary edges have no wire.</strong> Set{" "}
        <code>use_boundary = True</code> before applying.
      </p>
      <p>
        <strong>Wire quads have the wrong material.</strong> Check{" "}
        <code>material_offset</code> equals the slot index of your wire
        material on the source object. If the source has only one material slot
        (index 0), <code>material_offset = 1</code> requires a second slot to
        exist — even if empty — or Blender wraps back to 0. Append a dummy slot
        if needed.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr"
            className={lk}
          >
            Custom Split Normals — per-loop normal authoring for faceted GLB
          </Link>{" "}
          — the fill mesh companion technique.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
            className={lk}
          >
            Edge Attributes — sharp_edge / crease_edge / use_seam pipeline
          </Link>{" "}
          — controlling which edges WireframeModifier emphasises via vertex
          groups.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-gp3-lineart-modifier-toon-outline-batch-vrm"
            className={lk}
          >
            GP3 Line Art Modifier — silhouette-based toon outlines for VRM
          </Link>{" "}
          — the vector-stroke alternative for contour lines rather than
          structural edges.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
            className={lk}
          >
            Boolean + Weld — compound-body prop construction and GLB export
          </Link>{" "}
          — modifier stack and export_apply patterns that compose with this
          pipeline.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/wireframe.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Wireframe Modifier
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation). Complete parameter reference
          including <code>crease_weight</code> and vertex-group masking.
          Related pages:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/solidify.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solidify Modifier
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/freestyle/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Freestyle renderer
          </a>
          .
        </li>
        <li>
          <a
            href="https://threejs.org/docs/#api/en/materials/Material.polygonOffset"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Three.js — Material.polygonOffset
          </a>{" "}
          (MIT, mrdoob et al.). The canonical Z-fighting mitigation for
          co-planar geometry. Related:{" "}
          <a
            href="https://github.com/mrdoob/three.js"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            three.js
          </a>
          ,{" "}
          <a
            href="https://github.com/pmndrs/drei"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            @pmndrs/drei
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group). The bundled Blender exporter —
          understanding <code>export_apply</code>, <code>use_selection</code>,
          and Draco compression flags is essential for correct multi-object GLB
          output. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF spec
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-wireframe-modifier-toon-ink-geometry-webxr",
    title:
      "Python bpy.types.WireframeModifier — Toon Ink Geometry Bake: Edge-to-Quad Conversion & Polygon-Offset Z-Fight Mitigation for WebXR (Blender 5.1)",
    blurb:
      "WebXR runtimes have no Freestyle equivalent — ink lines must be real polygon geometry. WireframeModifier converts every edge to a flat quad tube and assigns it a separate material slot. Learn why the modifier replaces (not augments) faces, the duplicate-then-apply pattern for a two-object fill+wire GLB, use_even_offset vs use_relative_offset for uniform line weight, and the Three.js polygonOffset recipe that prevents Z-fighting where wire quads cross the fill surface.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "wireframe",
      "toon",
      "cel-shading",
      "npr",
      "modifier",
      "glb",
      "webxr",
      "three-js",
      "low-poly",
    ],
    difficulty: "intermediate",
  }
);
