import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SculptFaceSetsZoneMaskingBody() {
  return (
    <>
      <p>
        <strong>Sculpt Face Sets</strong> partition a sculpted mesh into
        colour-coded integer regions before retopology.  Each region is an ID
        stored in the internal <code>.sculpt_face_set</code> attribute on the{" "}
        <strong>FACE domain</strong> — accessible from Python as{" "}
        <code>mesh.attributes[&apos;.sculpt_face_set&apos;]</code>.  In Sculpt
        Mode the IDs drive colour overlays, masking, hide/show, and — after a
        majority-vote conversion — the vertex groups that anchor an armature for
        a VRM character.
      </p>
      <p>
        This tutorial covers the full pipeline: assign face sets programmatically,
        use them as sculpt masks interactively, convert to vertex groups, derive a{" "}
        <code>hs_zone_col</code> vertex-colour attribute for Three.js, and export
        a Draco-compressed GLB.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The .sculpt_face_set attribute
      </h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`mesh = bpy.context.active_object.data

# Create attribute headless-safe (Blender does not create it until
# the mesh first enters Sculpt Mode interactively):
attr = mesh.attributes.new('.sculpt_face_set', 'INT', 'FACE')

# Assign zone IDs by Z-height band of face centroid:
# Apply transforms first — face.center is in object space!
for i, face in enumerate(mesh.polygons):
    z = face.center.z
    attr.data[i].value = (1 if z > 0.20 else
                          2 if z > 0.025 else
                          3 if z > -0.15 else 4)
# Zone 1 = cranial cap  Zone 2 = facial  Zone 3 = jaw  Zone 4 = base`}</pre>
      <p>
        The leading dot marks the attribute as Blender-internal; it is hidden in the
        UI Attributes list but is fully readable via Python.  ID&nbsp;0 is the
        default (no set assigned, grey overlay); IDs&nbsp;1+ get distinct overlay
        hues that are <em>random per session</em> — the integer ID is the stable
        identifier, not the hue.
      </p>
      <p>
        <code>face.center</code> returns the arithmetic mean of the face&rsquo;s
        vertex positions in object space — the same centroid used as the sort
        weight in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sort-elements-sequential-face-reveal"
          className={lk}
        >
          Sort Elements — Sequential Face Reveal
        </Link>
        .  You must call{" "}
        <code>bpy.ops.object.transform_apply(scale=True)</code> before reading it,
        or the thresholds will be off by the object&rsquo;s scale factor.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Interactive operators</h2>
      <p>
        In a live sculpt session, face sets are usually created through operators
        rather than direct attribute writes (operators require Sculpt Mode context):
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`# Flood-fill from surface angle breaks (23 ° threshold):
bpy.ops.sculpt.face_sets_create(mode='FACE_ANGLE', threshold=0.4)

# Fill the unmasked region:
bpy.ops.sculpt.face_sets_create(mode='VISIBLE')

# Auto-detect from UV loop seams:
bpy.ops.sculpt.face_sets_init(mode='LOOP_SEAM', threshold=0.5)

# Keyboard shortcuts in Sculpt Mode:
# Ctrl+W  → flood-fill mask from face set under cursor
# H       → hide active face set    Alt+H → show all
# A       → invert mask`}</pre>
      <p>
        The <code>threshold</code> in{" "}
        <code>face_sets_init(mode=&apos;FACE_ANGLE&apos;)</code> mirrors the
        auto-smooth angle in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
          className={lk}
        >
          GN Smooth by Angle — Auto-Smooth Replacement
        </Link>
        : 0.4 rad (≈ 23°) splits adjacent faces that differ by more than 23° of
        normal angle, giving organic-form zone boundaries; 0.1 rad (≈ 6°) detects
        even shallow slope changes for hard-surface panel detection.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Mask from face set</h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`Sculpt Mode session:
  1. Hover over Zone 2 (facial band) → Ctrl+W
     → mask flood-fills the entire Zone 2 face set
  2. A → invert mask → Zones 1, 3, 4 are now masked
  3. Draw brush on Zone 2 — strokes only affect that zone
  4. Shift+H → hide all other zones → work in isolation`}</pre>
      <p>
        Flood-fill masking is significantly faster than freehand masking because
        the fill respects set boundaries exactly.  For a VRM character this means
        you can refine the mouth area (Zone 2) without accidentally distorting the
        jaw (Zone 3).  The same mask-primitive approach is described in{" "}
        <Link
          href="/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh"
          className={lk}
        >
          Dynamic Topology + Voxel Remesh
        </Link>
        , where masking protects the skull rear during frontal sculpting.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Converting to vertex groups
      </h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`# Majority-vote: each vertex goes to the zone most of its faces belong to
vert_zone_votes = [{} for _ in range(len(mesh.vertices))]
for face in mesh.polygons:
    zid = attr.data[face.index].value
    for vi in face.vertices:
        vert_zone_votes[vi][zid] = vert_zone_votes[vi].get(zid, 0) + 1

for zone_id in (1, 2, 3, 4):
    vg = obj.vertex_groups.new(name=f"hs_zone_{zone_id:02d}")
    majority_verts = [
        vi for vi, votes in enumerate(vert_zone_votes)
        if votes and max(votes, key=votes.get) == zone_id
    ]
    vg.add(majority_verts, 1.0, 'REPLACE')`}</pre>
      <p>
        The resulting <code>hs_zone_01 … hs_zone_04</code> groups become the seed
        envelopes for the weight-paint pass described in{" "}
        <Link
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
          className={lk}
        >
          Weight Paint — VRM Deformation Envelope
        </Link>
        .  Boundary vertices are assigned to their dominant zone by the majority
        vote, so the groups are non-overlapping and ready for{" "}
        <code>bpy.ops.object.parent_set(type=&apos;ARMATURE_NAME&apos;)</code>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Vertex colour export for Three.js
      </h2>
      <p>
        <code>.sculpt_face_set</code> is excluded from GLB output by the glTF
        exporter.  Derive a <code>BYTE_COLOR</code> attribute on the{" "}
        <strong>CORNER domain</strong> to carry zone data into Three.js:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto leading-relaxed">{`ZONE_COLOURS = {1: (0.90, 0.22, 0.22, 1.0),  # red
                2: (0.22, 0.78, 0.32, 1.0),  # green
                3: (0.20, 0.42, 0.88, 1.0),  # blue
                4: (0.88, 0.68, 0.12, 1.0)}  # amber

vc = mesh.attributes.new('hs_zone_col', 'BYTE_COLOR', 'CORNER')
for face in mesh.polygons:
    rgba = ZONE_COLOURS[attr.data[face.index].value]
    for loop_idx in face.loop_indices:
        vc.data[loop_idx].color = rgba

# GLB export: export_colors=True → hs_zone_col becomes COLOR_0
bpy.ops.export_scene.gltf(
    filepath="//sculpt_face_sets_zones.glb",
    export_format='GLB', use_selection=True,
    export_apply=True, export_colors=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6, export_yup=True,
)
# Three.js: new THREE.MeshStandardMaterial({ vertexColors: true })
# reads COLOR_0 → geometry.attributes.color`}</pre>
      <p>
        CORNER domain allows different colours per face for flat-shaded faceted
        meshes; <code>BYTE_COLOR</code> quantises to 8-bit per channel (lossless
        for solid-colour zones, half the file size of <code>FLOAT_COLOR</code>).
        For the full vertex-colour domain and type reference see{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          Vertex Colour Attributes — BYTE_COLOR, FLOAT_COLOR & GLB Export
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <p>
        <strong>Face sets invisible in Sculpt Mode</strong> — open{" "}
        <em>Viewport Overlays → Sculpt Mode Overlays → Face Sets</em>.{" "}
        <strong>All faces show zone 0 after transform apply</strong> — apply
        transforms <em>before</em> assigning face sets, or re-run the assignment
        script.{" "}
        <strong>Vertex colours black in GLB viewer</strong> — confirm{" "}
        <code>export_colors=True</code> was set and the material uses{" "}
        <code>vertexColors: true</code>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/editing/face_sets.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Face Sets
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — authoritative reference for
          creation modes, visibility operators, mask flood-fill, and the{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/controls.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sculpt Controls
          </a>{" "}
          keyboard reference.  Maintained by the sculpt team (Pablo Dobarro,
          Joseph Eagar) who introduced face sets as a first-class attribute in
          Blender 2.90; the attribute internals have been stable since 4.0.
          Related upstream: the{" "}
          <a
            href="https://projects.blender.org/blender/blender/issues?type=bug&label=sculpt"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender sculpt issue tracker
          </a>{" "}
          on projects.blender.org tracks ongoing face-set improvements.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0, Khronos Group) — the bundled Blender glTF exporter;
          colour attribute export is handled in{" "}
          <code>gltf2_blender_gather_primitive_attributes.py</code>.  Sibling
          specification:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#meshes"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF 2.0 Meshes Spec
          </a>{" "}
          — defines <code>COLOR_0</code> as a VEC4 UNSIGNED_BYTE normalised
          accessor matching our <code>BYTE_COLOR</code> attribute exactly.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-sculpt-face-sets-zone-masking-vrm-retopo",
  title:
    "Sculpt Face Sets — Zone Masking, Boundary Sharpen & Pre-Retopology Planning for VRM (Blender 5.1)",
  created: "2026-06-27",
  tags: [
    "blender",
    "sculpting",
    "face-sets",
    "masking",
    "retopology",
    "vrm",
    "vertex-colour",
    "gltf",
    "webxr",
    "python",
  ],
  libraryPath:
    "public/library/blends/sculpting/sculpt-face-sets-zone-masking-vrm-retopo/",
  Body: SculptFaceSetsZoneMaskingBody,
});
