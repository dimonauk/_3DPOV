import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function MetaballBlobBody() {
  return (
    <>
      <p>
        Every metaball element defines a radially symmetric potential field
        whose value at any point in space is{" "}
        <code>stiffness / (distance² + ε)</code>. Blender sums the contributions
        from every element in the datablock and runs a{" "}
        <strong>marching-cubes</strong> pass on a regular grid to extract the
        isosurface where the cumulative field equals{" "}
        <code>threshold</code>. The visual surface you see is purely a
        consequence of where that equation happens to cross the chosen level —
        there is no explicit geometry until conversion time. This is the only
        Blender object type where moving two pieces closer together causes them
        to grow new topology between them, rather than simply overlapping.
      </p>

      <p>
        The <code>threshold</code> property is the central design parameter.
        Lower values mean a{" "}
        <em>lower bar</em> for the combined field to clear: elements merge
        from a greater distance, producing a rounder, more inflated result.
        Higher values demand a stronger combined field: elements must be nearly
        touching before a bridge forms, and the surface shrinks inward on each
        element individually. The blob creature in this tutorial is built at{" "}
        <code>threshold=0.60</code> — a conservative middle ground where the
        head and body share a visible neck bridge but the arms remain clearly
        distinct limbs. Compare this approach with the geometry-node method in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-volume-organic-coral"
          className={lk}
        >
          GN Points to Volume — Organic Coral tutorial
        </Link>
        , which builds implicit organic forms via a voxel grid rather than
        a continuous field — a fundamentally different topology-generation
        strategy with different performance characteristics.
      </p>

      <p>
        The <code>CAPSULE</code> element type extends the spherical field along
        a local axis controlled by <code>element.size_x</code>, which is the
        half-length on each side of the centre. A CAPSULE with{" "}
        <code>radius=0.29, size_x=0.52</code> behaves like a BALL of radius
        0.29 swept along a 1.04 m line segment — the field is constant
        along the stem and falls off spherically at both caps. This gives
        the arm elements a natural shoulder and elbow flare without requiring
        any manual mesh editing, unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb"
          className={lk}
        >
          Multires Sculpting pipeline
        </Link>{" "}
        where the shoulder topology is carved by hand. Stiffness on the arms
        is set slightly lower (1.8 vs 2.0 on the body) so the field decays
        more gradually — this creates a wider, softer blend zone at the
        shoulder rather than a sharp pinch.
      </p>

      <p>
        Negative elements flip the sign of their contribution to the cumulative
        field. Where an element with <code>use_negative=True</code> is strong,
        the total field value <em>decreases</em>, pushing the isosurface
        inward or removing it entirely. The eye sockets use this property with
        a high stiffness value (3.2) so the field drops off sharply away from
        the element centre — producing a clean circular depression rather than a
        broad shallow dent. The radius must be meaningfully smaller than the
        host element (here 0.22 vs 0.62 on the head) or the negative element
        punches completely through the surface. After conversion, those
        depressions take an{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin"
          className={lk}
        >
          SSS skin shader
        </Link>{" "}
        particularly well because the socket curvature concentrates thickness
        variation, which the subsurface scatter radius translates into visible
        colour depth.
      </p>

      <p>
        Conversion (<code>bpy.ops.object.convert(target=&lsquo;MESH&rsquo;)</code>)
        evaluates the isosurface at{" "}
        <code>mball.render_resolution</code> — set this to your export
        quality (0.025 m here) <em>before</em> calling convert, not after.
        The resulting mesh is all triangles; apply{" "}
        <code>shade_smooth()</code> to suppress the faceting artefacts on
        organic silhouettes. The converted mesh exports cleanly with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Python batch GLB exporter
        </Link>{" "}
        at Draco level 6, compressing the dense marching-cubes triangle soup by
        roughly 70 % without visible quality loss on viewer-distance assets.
      </p>

      <p>
        <strong>Outside reference 1 — Blender Manual: Meta Objects</strong>{" "}
        (
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/metas/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        , CC-BY-SA&nbsp;4.0, Blender Documentation Team). Documents all five
        element types, the Resolution and Threshold properties, the
        multi-object name-prefix merging behaviour, and the Viewport Update
        modes. The same organisation also maintains the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/metas/properties.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Meta Properties reference
        </a>{" "}
        covering Stiffness and Negative element semantics.
      </p>

      <p>
        <strong>Outside reference 2 — Paul Bourke: Metaballs</strong>{" "}
        (
        <a
          href="http://paulbourke.net/geometry/metaballs/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          paulbourke.net
        </a>
        , permissive attribution, Paul Bourke). Presents the potential field
        derivation from first principles, the original Wyvill soft-object
        function as an alternative to the Blinn inverse-square model, and a
        worked C implementation of the marching-cubes polygon extraction.
        Bourke&rsquo;s site also hosts the canonical{" "}
        <a
          href="http://paulbourke.net/geometry/polygonise/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Polygonising a Scalar Field
        </a>{" "}
        reference — the look-up tables Blender internally uses for the
        marching-cubes triangulation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-metaball-organic-blob-creature-glb",
  title:
    "Metaball Objects — Organic Blob Creature: Element Types, Threshold, Negative Elements, and GLB Conversion (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Build a five-element metaball creature using BALL body/head, CAPSULE arms, and NEGATIVE eye sockets. Learn why threshold and stiffness govern merging, how render_resolution determines converted-mesh quality, and how to export a Draco-compressed GLB after bpy.ops.object.convert. Includes a threshold-pulse viewport animation showing the merge/separate transition live.",
  Body: MetaballBlobBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Python scripting in Blender: bpy.data, bpy.ops, bpy.context. The Python Add-on tutorial covers the extension platform; this tutorial uses bpy directly without registering an add-on.",
      "Understanding of mesh topology: faces, vertices, normals, smooth shading. The Multires Sculpt tutorial introduced these in the context of organic forms.",
      "GLB export pipeline: Draco compression, export_apply. Covered in the Python Batch GLB Exporter tutorial.",
      "Blender 5.1 installed. No extra extensions required — MetaBall is a built-in object type.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "MetaBall objects and all five element types (BALL, CAPSULE, PLANE, ELLIPSOID, CUBE) have been stable since Blender 2.x. The Principled BSDF v2 input names (Subsurface Weight, Subsurface Radius) require Blender 4.0+. bpy.context.temp_override() for convert() requires Blender 3.2+.",
      },
    ],
    steps: [
      {
        title: "Understand the field equation, isosurface, and threshold",
        body:
          "Blender evaluates a scalar field F(x,y,z) at every grid cell vertex:\n  F = Σ stiffness_i / (dist(P, element_i)² + 1e-6)\n\nThe surface you see is where F = threshold.  This has two immediate consequences:\n  1. Moving elements CLOSER raises F at the midpoint → surface bridges form.\n  2. Raising threshold demands a HIGHER combined field → surface retreats.\n\nKey insight for creature building:\n  At threshold=0.60, the head (r=0.62) placed 1.58 m above the body (r=1.15)\n  leaves a gap of roughly 1.58 - 1.15 - 0.62 = -0.19 m of overlap — the radii\n  intentionally penetrate to guarantee a neck bridge at this threshold.\n  Calculate the required overlap: gap < 0 ensures merging; gap > 0 requires\n  a lower threshold to form a bridge.",
      },
      {
        title: "Create the MetaBall datablock and body element",
        body:
          "Prefer the direct data API over bpy.ops.object.metaball_add() in scripts:\n  mball = bpy.data.metaballs.new('blob_creature')\n  obj   = bpy.data.objects.new('blob_creature', mball)\n  bpy.context.scene.collection.objects.link(obj)\n\nWHY avoid bpy.ops.object.metaball_add():\n  The operator uses bpy.context.active_object for placement and sets the\n  type on whatever metaball happens to be active — fragile when the scene\n  already has other metaball objects. The data-API path is explicit.\n\nSet global metaball properties:\n  mball.resolution        = 0.06    # viewport grid cell (m)\n  mball.render_resolution = 0.025   # export mesh fineness (m)\n  mball.threshold         = 0.60\n  mball.update_method     = 'HALFRES'  # re-eval at half res while dragging\n\nAdd the body BALL:\n  body = mball.elements.new()   # new() with no args defaults to type='BALL'\n  body.radius    = 1.15\n  body.stiffness = 2.0\n  body.co        = (0.0, 0.0, 0.0)  # element position in object local space",
      },
      {
        title: "Add the head BALL and observe the neck bridge",
        body:
          "  head        = mball.elements.new()\n  head.type   = 'BALL'\n  head.radius = 0.62\n  head.stiffness = 2.0\n  head.co     = (0.0, 0.0, 1.58)\n\nbpy.context.view_layer.update()   # trigger isosurface re-evaluation\n\nThe gap between body top (z ≈ 1.15) and head bottom (z ≈ 1.58 - 0.62 = 0.96)\nis negative — the element radii overlap by 0.19 m.  At threshold=0.60 this\ncreates a visible neck bridge.  Experiment with increasing head.co.z to 2.0:\nthe bridge thins and eventually disappears.  That's the threshold playing out\nin 3-D: you're watching the isosurface track the combined field contour.",
      },
      {
        title: "Add CAPSULE arm elements — size_x is the half-length",
        body:
          "  for side in (-1.0, 1.0):\n      arm           = mball.elements.new()\n      arm.type      = 'CAPSULE'\n      arm.radius    = 0.29       # cross-section radius\n      arm.size_x    = 0.52       # half-length along element local X\n      arm.stiffness = 1.8        # softer decay for a wider shoulder blend\n      arm.co        = (side * 1.12, 0.0, 0.22)\n\nThe total CAPSULE length = 2 * size_x + 2 * radius = 2*0.52 + 2*0.29 = 1.62 m.\nBecause the element has no rotation applied here, it extends along the object's\nglobal X axis — the arms reach left and right naturally.\n\nWHY stiffness=1.8 vs 2.0 on the body:\n  Lower stiffness = field decays slower with distance = wider influence zone.\n  The arm element needs to 'reach' across the gap to the body to create a\n  shoulder bridge without the arm centre being inside the body.  At stiffness\n  2.0 the arms would appear as separate blobs; at 1.8 the field overlaps\n  enough to bridge cleanly.",
      },
      {
        title: "Add NEGATIVE elements for eye sockets",
        body:
          "  for side in (-1.0, 1.0):\n      eye              = mball.elements.new()\n      eye.type         = 'BALL'\n      eye.radius       = 0.22\n      eye.stiffness    = 3.2      # HIGH stiffness → sharp socket edge\n      eye.use_negative = True     # SUBTRACTS from field\n      eye.co           = (side * 0.24, -0.60, 1.74)  # pushed toward -Y (camera)\n\nThe negative element contributes -3.2 / (d² + ε) at each point.  Where the\neye element is strong (near its centre), the combined field dips below\nthreshold — the isosurface retreats, creating a concavity.\n\nSizing rules:\n  eye.radius < head.radius / 2 → depression (not a hole)\n  eye.radius > head.radius / 2 → punches through entirely\n\nHigh stiffness (3.2) means the field drops to near-zero within ~1.5× the\nradius.  This gives a clean, well-defined socket rim.  A soft eye element\n(stiffness 1.2) would produce a vague shallow dimple instead.",
      },
      {
        title: "Tune threshold, resolution, and update_method",
        body:
          "Threshold range guide for this creature:\n  0.30 → 0.45   arms separate from body; eye sockets disappear\n  0.55 → 0.65   balanced; neck + shoulders merged, eyes visible\n  0.75 → 0.90   head begins to separate; arms already disconnected\n\nResolution trade-off:\n  0.06 m (viewport) — ~20 k triangles; fast to evaluate\n  0.025 m (render_resolution for convert) — ~120 k triangles; clean silhouette\n  0.01 m — ~600 k triangles; overkill for most WebXR use cases\n\nUpdate methods:\n  'ALWAYS'  — recalculates full grid on every transform; very slow above 50 k tris\n  'HALFRES' — halves resolution while dragging, snaps to full on release\n  'NEVER'   — update only on explicit redraw; fastest for many elements\n  'FAST'    — like ALWAYS but skips render-res evaluation; good balance",
      },
      {
        title: "Apply Principled BSDF v2 SSS material",
        body:
          "  mat  = bpy.data.materials.new('blob_skin')\n  mat.use_nodes = True\n  bsdf = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')\n  out  = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')\n  mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])\n\n  bsdf.inputs['Base Color'].default_value            = (0.72, 0.88, 0.55, 1.0)\n  bsdf.inputs['Roughness'].default_value             = 0.38\n  # Principled v2 (Blender 4.0+): 'Subsurface Weight', NOT 'Subsurface'\n  bsdf.inputs['Subsurface Weight'].default_value     = 0.14\n  bsdf.inputs['Subsurface Radius'].default_value     = (0.90, 1.20, 0.60)\n  bsdf.inputs['Subsurface IOR'].default_value        = 1.40\n\n  obj.data.materials.append(mat)\n\nWHY SSS Radius differs per channel:\n  Red (0.90) scatters the most — skin looks warm at grazing incidence.\n  Green (1.20) scatters furthest — subsurface looks green at moderate depth.\n  Blue (0.60) scatters least — thin areas stay colour-accurate.\n  This mimics biological translucency in plant/creature skin.",
      },
      {
        title: "Convert MetaBall to Mesh and inspect topology",
        body:
          "  # Set fine resolution BEFORE converting — convert() reads render_resolution\n  obj.data.render_resolution = 0.025\n  bpy.context.view_layer.update()\n\n  bpy.ops.object.select_all(action='DESELECT')\n  obj.select_set(True)\n  bpy.context.view_layer.objects.active = obj\n\n  with bpy.context.temp_override(active_object=obj, selected_objects=[obj]):\n      bpy.ops.object.convert(target='MESH')\n\n  bpy.ops.object.shade_smooth()\n\nAfter convert(), obj.data is a bpy.types.Mesh, NOT a MetaBall.  The\noriginal mball datablock is orphaned (0 users) and will be garbage-collected\non the next save.  If you need to re-edit elements, undo or keep the .blend\nwith the unconverted version.\n\nMarching cubes produces all-triangle topology, typically 80-150 k triangles\nat render_resolution=0.025.  shade_smooth() is critical: the flat normals on\nthe raw tri soup make the creature look faceted; smooth shading recovers the\norganic silhouette by interpolating normals across faces.",
      },
      {
        title: "Export Draco-compressed GLB",
        body:
          "  bpy.ops.export_scene.gltf(\n      filepath     = '//blob_creature.glb',\n      export_format = 'GLB',\n      export_apply  = True,      # bakes any remaining modifier stack\n      use_selection = True,      # only the creature object\n      export_draco_mesh_compression_enable = True,\n      export_draco_mesh_compression_level  = 6,\n      export_image_format = 'WEBP',\n  )\n\nexpected GLB size at DRACO level 6: 180–350 kB (vs ~5–8 MB uncompressed)\n\nDraco compresses the 80-150 k triangle marching-cubes mesh particularly\nwell because the vertices have no UV coordinates (metaballs have no UV\nunless you manually unwrap after conversion) and the connectivity is\nhighly regular — the marching-cubes grid pattern compresses better than\nhand-authored organic meshes.",
      },
    ],
    finalResult:
      "A blob_creature.blend containing a five-element MetaBall object with BALL body+head, CAPSULE arms, and NEGATIVE eye sockets at threshold=0.60. A converted mesh at render_resolution=0.025 with shade_smooth applied. A blob_creature.glb exported with Draco level 6 compression (~200–350 kB). A 150-frame viewport animation in record.py showing threshold pulsing from 0.60 → 0.35 → 0.60 with simultaneous camera orbit.",
    variations: [
      "Animate threshold with an F-curve for a morphing sequence: insert keyframes via mball.keyframe_insert(data_path='threshold', frame=N). Watching the elements separate and remerge is the clearest possible visualisation of the field model — use it in a tutorial intro clip.",
      "Multi-object merging: any MetaBall objects whose names share a common prefix (e.g., 'blob', 'blob.001', 'blob.002') contribute their elements to ONE merged surface. This lets you scatter creature parts in separate collections and merge them selectively by naming convention — useful for building a crowd of blobs.",
      "ELLIPSOID elements: set ele.type='ELLIPSOID' and ele.size_x, ele.size_y, ele.size_z independently to build elongated or flattened influence zones. A wide flat ELLIPSOID at the creature's base creates a ground-contact blob without the pill shape of a CAPSULE.",
      "Geometry Nodes on the converted mesh: once the MetaBall is converted to a Mesh, apply a GN Extrude Mesh modifier to extrude alternate face groups outward — creating spikes or armour plates on the blob's organic surface.",
    ],
    troubleshooting: [
      {
        symptom: "Elements visible but do not merge into a single surface",
        cause:
          "threshold is too high for the current element radii and positions. The combined field at the midpoint between elements never reaches threshold.",
        fix:
          "Lower mball.threshold incrementally (try 0.45, then 0.35). Alternatively, increase the stiffness of the elements that should bridge: higher stiffness means the field is stronger closer to the centre, making midpoint bridging more likely. Check actual gap: print the distance between element.co values and compare to the sum of their radii.",
      },
      {
        symptom: "bpy.ops.object.convert raises RuntimeError: Operator poll failed",
        cause:
          "The operator requires OBJECT mode and an active object selected in the correct context. In background mode (blender --background), the default context may not satisfy the poll.",
        fix:
          "Wrap the call with bpy.context.temp_override(active_object=obj, selected_objects=[obj]). Ensure bpy.context.mode == 'OBJECT' — in a background script the mode is set correctly by default, but if earlier code called bpy.ops.object.editmode_toggle() without toggling back, mode will be 'EDIT'.",
      },
      {
        symptom: "Negative eye socket elements produce no visible depression",
        cause:
          "Eye element radius is too large relative to the head element radius, causing the negative field to fully cancel the head surface rather than indent it. Or the eye element is positioned outside the head ball's influence zone.",
        fix:
          "Keep eye.radius < head.radius * 0.40. Verify eye.co places the element's centre inside the head ball volume: distance(eye.co, head.co) < head.radius. Increase eye.stiffness to 3.5–4.0 for a sharper, more visible socket edge.",
      },
      {
        symptom: "Converted GLB mesh appears blocky or faceted at viewer distance",
        cause:
          "render_resolution was still set to the viewport value (0.06 m) when convert() ran. The conversion used the coarse viewport grid rather than the fine export grid.",
        fix:
          "Set obj.data.render_resolution = 0.025 and call bpy.context.view_layer.update() BEFORE convert(). Verify after conversion: bpy.data.meshes['blob_creature'].polygons will show ~80–150 k faces at 0.025 m, not ~5–8 k at 0.06 m. If the mesh is already converted with wrong resolution, undo (Ctrl+Z) and re-run with the corrected sequence.",
      },
    ],
  },
  base,
);
