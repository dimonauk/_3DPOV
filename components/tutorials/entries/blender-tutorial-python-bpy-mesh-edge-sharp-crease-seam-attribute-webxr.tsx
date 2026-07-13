import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.1 moved three per-edge data channels from fixed
        per-element properties into named{" "}
        <code>Attribute</code> layers on the mesh:{" "}
        <code>&quot;sharp_edge&quot;</code> (BOOLEAN),{" "}
        <code>&quot;crease_edge&quot;</code> (FLOAT), and — not yet migrated
        as of 5.1 — UV seam flags which stay on{" "}
        <code>MeshEdge.use_seam</code>. The same release also removed{" "}
        <code>mesh.use_auto_smooth</code> entirely. Understanding both changes
        is necessary before any shading-related Python script will behave
        correctly in Blender 5.1; the old patterns still{" "}
        <em>run</em> (compatibility shims) but bypass the attribute layer and
        produce inconsistent results when combined with Geometry Nodes or the
        new Smooth by Angle modifier. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr"
          className={lk}
        >
          custom split normals tutorial
        </Link>
        , which offers full per-loop control at the cost of a larger GLB.
        Sharp-edge marks are simpler and produce smaller exports for
        the majority of faceted low-poly work.
      </p>

      <h2>sharp_edge — the canonical 5.1 route</h2>
      <p>
        <code>me.attributes[&quot;sharp_edge&quot;]</code> is a built-in
        BOOLEAN attribute on the EDGE domain. It may not be materialised on
        a freshly-created mesh (all values implicitly False), so the safe
        access pattern is:
      </p>
      <pre><code>{`sharp_attr = (me.attributes.get("sharp_edge") or
             me.attributes.new("sharp_edge", type='BOOLEAN', domain='EDGE'))
sharp_attr.data.foreach_set("value", sharp_flags)  # arr.array('B', ...)`}</code></pre>
      <p>
        The compatibility shim{" "}
        <code>me.edges.foreach_set(&quot;use_edge_sharp&quot;, flags)</code>{" "}
        writes the same underlying data, but any code that subsequently reads
        back via <code>me.attributes[&quot;sharp_edge&quot;]</code> sees the
        correct values regardless of which route wrote them — they are the
        same storage.
      </p>
      <p>
        Sharp edges drive the GLB exporter&rsquo;s vertex splitting: each
        marked edge causes the vertices on either side to be duplicated with
        divergent normal vectors. For the 42-vertex dome in this blueprint,
        expect approximately 57 vertices in the exported GLB — each sharp
        boundary adds roughly one extra vertex per edge endpoint. This is
        smaller than the custom-normals route, which always duplicates at
        face boundaries.
      </p>
      <p>
        Compute the dihedral angle in bmesh before writing back to the mesh:{" "}
        <code>e.link_faces[0].normal.angle(e.link_faces[1].normal)</code>{" "}
        returns radians. Guard <code>len(e.link_faces) &lt; 2</code> for
        boundary edges — those are always sharp by convention and the fallback
        value would mask the problem.
      </p>

      <h2>crease_edge — SubSurf sharpness weights</h2>
      <p>
        <code>me.attributes[&quot;crease_edge&quot;]</code> is a FLOAT
        attribute (0.0 = no sharpness preservation, 1.0 = full crease — edge
        stays hard under subdivision). Like <code>sharp_edge</code>, use
        the <code>.get() or .new()</code> pattern for safety, then write with
        <code>foreach_set(&quot;value&quot;, arr.array(&apos;f&apos;, ...))</code>.
        The crease only has a visible effect when a{" "}
        <em>Subdivision Surface</em> modifier is present. For WebXR exports
        that target real-time Three.js without SubSurf, pre-populating crease
        values is purely metadata that keeps the blend file ready for artist
        refinement without re-scripting. The equatorial loop at{" "}
        <code>crease=0.85</code> prevents the dome base from pinching inward
        under subdivision while leaving the facet faces smooth.
      </p>

      <h2>use_seam — not yet an attribute in 5.1</h2>
      <p>
        UV seam marks remain on <code>me.edges</code> in Blender 5.1, not yet
        migrated to the Attribute system.{" "}
        <code>me.edges.foreach_set(&quot;use_seam&quot;, flags)</code> is both the
        current and the canonical route. The blueprint marks meridian seams
        using angular proximity to each longitude sector boundary — a clean
        basis for the UV atlas workflow covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr"
          className={lk}
        >
          UV layer atlas-pack tutorial
        </Link>
        . Pole verts (near-zero XY radius) are skipped — their atan2 is
        undefined and they should not carry seams because every face fan
        around the pole is a UV island of its own.
      </p>

      <h2>Smooth shading + sharp marks = the new auto-smooth</h2>
      <p>
        The removed <code>use_auto_smooth</code> computed a per-edge sharp
        threshold at viewport / render time. Replacing it:{" "}
        (1) enable smooth shading on every polygon with{" "}
        <code>me.polygons.foreach_set(&quot;use_smooth&quot;, [1]*N)</code>,
        then (2) write explicit{" "}
        <code>sharp_edge</code> flags wherever hard breaks are needed. The
        result is identical shading but computed once at script time rather
        than per-frame — slightly faster for static props and exactly
        reproducible across Blender versions. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          limited-dissolve faceted ornament tutorial
        </Link>{" "}
        uses flat shading on individual faces instead; sharp marks with global
        smooth shading is the alternative that gives correct normals at every
        face corner without duplicating faces. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
          className={lk}
        >
          Enneper surface tutorial
        </Link>{" "}
        demonstrates the third approach: per-vertex colour attributes as a
        shading alternative for purely flat data.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      tools: [
        { name: "Blender 5.1", url: "https://www.blender.org/download/" },
      ],
    },
    code: [
      {
        filename: "blueprint.py",
        language: "python",
        content: `import bpy, bmesh, math, array as arr

SLUG            = "python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
EXPORT_PATH     = f"/tmp/{SLUG}.glb"
ICO_SUBDIVS, ICO_RADIUS = 2, 1.0
SHARP_DEG, SEAM_MERIDIANS, CREASE_EQUATOR = 40.0, 8, 0.85

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()

me = bpy.data.meshes.new("faceted_dome")
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIVS, radius=ICO_RADIUS)
bm.normal_update()
faces_south = [f for f in bm.faces if f.calc_center_median().z < -0.05]
bmesh.ops.delete(bm, geom=faces_south, context='FACES')
boundary = [e for e in bm.edges if e.is_boundary]
if boundary:
    bmesh.ops.edgeloop_fill(bm, edges=boundary)
bm.normal_update(); bm.to_mesh(me); bm.free(); me.update()

# Smooth shading on all faces — sharp edges supply the breaks.
me.polygons.foreach_set("use_smooth", arr.array('B', [1]*len(me.polygons)))
me.update()

# ── Sharp edges via Attribute API (5.1 canonical) ─────────────────────────
bm2 = bmesh.new(); bm2.from_mesh(me); bm2.edges.ensure_lookup_table()
SHARP_RAD = math.radians(SHARP_DEG)
sharp_flags = arr.array('B', [0]*len(me.edges))
for e in bm2.edges:
    if e.is_boundary or len(e.link_faces) < 2:
        sharp_flags[e.index] = 1; continue
    if e.link_faces[0].normal.angle(e.link_faces[1].normal) > SHARP_RAD:
        sharp_flags[e.index] = 1
bm2.free()
sharp_attr = (me.attributes.get("sharp_edge") or
              me.attributes.new("sharp_edge", type='BOOLEAN', domain='EDGE'))
sharp_attr.data.foreach_set("value", sharp_flags)

# ── Crease weights (equatorial loop) ────────────────────────────────────────
crease_attr = (me.attributes.get("crease_edge") or
               me.attributes.new("crease_edge", type='FLOAT', domain='EDGE'))
crease_vals = arr.array('f', [0.0]*len(me.edges))
verts = me.vertices
for e in me.edges:
    v0, v1 = verts[e.vertices[0]], verts[e.vertices[1]]
    if abs(v0.co.z) < 0.18 and abs(v1.co.z) < 0.18:
        crease_vals[e.index] = CREASE_EQUATOR
crease_attr.data.foreach_set("value", crease_vals)

# ── UV seams — still on MeshEdge in 5.1, not an attribute yet ────────────
sector_angle = 2.0*math.pi/SEAM_MERIDIANS; SEAM_TOL = sector_angle*0.12
seam_flags = arr.array('B', [0]*len(me.edges))
for e in me.edges:
    v0, v1 = verts[e.vertices[0]], verts[e.vertices[1]]
    if v0.co.x**2+v0.co.y**2 < 1e-8 or v1.co.x**2+v1.co.y**2 < 1e-8:
        continue
    a0 = math.atan2(v0.co.y,v0.co.x)%(2*math.pi)
    a1 = math.atan2(v1.co.y,v1.co.x)%(2*math.pi)
    for m in range(SEAM_MERIDIANS):
        meridian = m*sector_angle
        d0 = abs((a0-meridian+math.pi)%(2*math.pi)-math.pi)
        d1 = abs((a1-meridian+math.pi)%(2*math.pi)-math.pi)
        if d0 < SEAM_TOL and d1 < SEAM_TOL: seam_flags[e.index]=1; break
me.edges.foreach_set("use_seam", seam_flags)
me.update()

mat = bpy.data.materials.new("FacetedDome"); mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.12, 0.50, 0.82, 1.0)
bsdf.inputs["Roughness"].default_value = 0.28
me.materials.append(mat)

ob = bpy.data.objects.new("faceted_dome", me)
bpy.context.scene.collection.objects.link(ob)

bpy.ops.wm.save_as_mainfile(filepath="//faceted_dome.blend")
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH, export_format='GLB',
    export_yup=True, export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
)
print(f"sharp={sum(sharp_flags)} seam={sum(seam_flags)}")
print(f"exported → {EXPORT_PATH}")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr",
    title:
      "Python Mesh Edge Attributes: Sharp Mark, Crease & Seam API for Faceted Low-Poly GLB (Blender 5.1)",
    blurb:
      "Blender 4.1 moved edge sharpness and crease weights from per-element properties into named Mesh Attribute layers. Learn the correct 5.1 Python route — me.attributes['sharp_edge'] and me.attributes['crease_edge'] — then compute angle-based sharp marks via bmesh, set equatorial crease weights, and mark meridian UV seams for a clean faceted dome GLB.",
    Body,
    createdAt: new Date("2026-07-13"),
    tags: [
      "blender",
      "python",
      "scripting",
      "webxr",
      "mesh",
      "attributes",
      "sharp-edges",
      "faceted",
      "low-poly",
    ],
    difficulty: "intermediate",
  }
);
