import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.BuildModifier</code> is Blender&rsquo;s native
        face-reveal tool. It suppresses faces in the <em>evaluated</em> mesh
        rather than toggling material alpha or visibility flags, which means
        hidden faces cast no shadows, consume no render buckets, and produce
        zero z-fighting. The result is a clean, controllable construction
        animation with a single modifier and no shape-key overhead.
      </p>
      <p>
        This tutorial builds a faceted crystal geode that grows strictly
        bottom-to-top over 80 frames. The reveal order is controlled by sorting
        the BMesh face list before the modifier is applied — no randomness, no
        driver, just sorted face indices.
      </p>

      <h2>How Build modifier counts visible faces</h2>
      <p>
        At any given timeline frame <em>F</em>, the number of visible faces is:
      </p>
      <pre><code>{`visible = clamp(
    round(total_faces * (F - frame_start) / frame_duration),
    0, total_faces
)`}</code></pre>
      <p>
        In <strong>sequential mode</strong> (<code>use_random_order=False</code>
        ), face 0 appears first and face N-1 last. The modifier reads the mesh
        as it sits in the data block — no shuffling occurs. Controlling reveal
        order therefore reduces to controlling the face index order, which Python
        does directly via <code>bm.faces.sort()</code>.
      </p>

      <h2>Sorting face indices for directed growth</h2>
      <pre><code>{`bm = bmesh.new()
bm.from_mesh(mesh)

# Sort ascending Z — bottommost faces get index 0 (appear first)
bm.faces.sort(key=lambda f: f.calc_center_median().z)

bm.to_mesh(mesh)   # writes sorted order permanently
bm.free()`}</code></pre>
      <p>
        <code>bm.faces.sort(key=…)</code> is an in-place Python sort on the
        BMesh face sequence. After <code>bm.to_mesh()</code>, the mesh data
        block stores faces in that order. The Build modifier subsequently reveals
        them exactly bottom-to-top without any seed or driver. The same trick
        works for radial growth (sort by angle from origin), spiral growth (sort
        by polar angle + radius), or material-band reveals (sort by material
        index). For more on custom face-order attributes in Geometry Nodes, see
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sort-elements-sequential-face-reveal"
          className={lk}
        >
          GN Sort Elements tutorial
        </Link>
        .
      </p>

      <h2>BuildModifier API</h2>
      <pre><code>{`mod               = ob.modifiers.new("CrystalGrowth", 'BUILD')
mod.frame_start   = 1      # first face appears at this timeline frame
mod.frame_duration = 80    # total frames to fully reveal all faces
mod.use_random_order = False  # sequential: reveals face[0] first
mod.use_random_order = True   # random: Fisher-Yates shuffle
mod.seed          = 42     # shuffle seed (only used when random)
mod.use_reverse   = False  # True = demolish (faces disappear on schedule)`}</code></pre>
      <p>
        A demolish effect (<code>use_reverse=True</code>) uses the same
        schedule but removes faces instead of adding them. Combining a reversed
        build with a looped NLA strip produces a pulsing &ldquo;dissolve and
        regrow&rdquo; animation — useful for VRM ability effects. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-layered-action-layers-strips-blending"
          className={lk}
        >
          layered action strips tutorial
        </Link>{" "}
        for the NLA wiring.
      </p>

      <h2>Depsgraph snapshot — reading mid-build geometry headlessly</h2>
      <p>
        The Build modifier is a <em>per-frame</em> evaluate operation. To
        capture the partial mesh at any frame without entering the UI, use the
        evaluated depsgraph:
      </p>
      <pre><code>{`scene.frame_set(30)                           # advance the timeline
dg  = bpy.context.evaluated_depsgraph_get()   # fresh evaluation
ev  = ob.evaluated_get(dg)                    # evaluated object copy
snp = bpy.data.meshes.new_from_object(        # extract plain Mesh
    ev, depsgraph=dg
)
# snp is now a Mesh containing only the faces visible at frame 30`}</code></pre>
      <p>
        <code>bpy.data.meshes.new_from_object(ev, depsgraph=dg)</code> is the
        Blender 4.0+ headless-safe API. It is context-free — no active 3D
        Viewport or selected object required. The resulting Mesh has no modifier
        reference; it can be wrapped in a temporary object and exported directly
        to GLB. See the full depsgraph pipeline in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export"
          className={lk}
        >
          depsgraph instance export tutorial
        </Link>
        .
      </p>

      <h2>Five growth-stage GLBs</h2>
      <pre><code>{`def export_snapshot(frame_num, stage_idx):
    scene.frame_set(frame_num)
    dg  = bpy.context.evaluated_depsgraph_get()
    ev  = ob.evaluated_get(dg)
    snp = bpy.data.meshes.new_from_object(ev, depsgraph=dg)

    snp_ob = bpy.data.objects.new(f"hf_crystal_stage_{stage_idx}", snp)
    scene.collection.objects.link(snp_ob)

    bpy.ops.export_scene.gltf(
        filepath=f"hf_crystal_stage_{stage_idx}.glb",
        use_selection=True,
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
    )
    scene.collection.objects.unlink(snp_ob)
    bpy.data.meshes.remove(snp)   # prevent accumulation

for s in range(5):
    frac  = s / 4.0
    frame = max(1, round(1 + frac * 80))
    export_snapshot(frame, s)`}</code></pre>
      <p>
        Each snapshot is linked, exported, then immediately unlinked and removed
        to prevent mesh accumulation. This is the same pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-asset-metadata-mark-tag-batch-glb-webxr"
          className={lk}
        >
          batch-export tutorial
        </Link>
        ; the cleanup discipline is critical for headless scripts that run
        unattended.
      </p>

      <h2>_reveal_order attribute for Three.js</h2>
      <p>
        A single final-state GLB cannot encode reveal timing. Instead, the
        blueprint writes a face-domain <code>_reveal_order</code> INT attribute
        that Three.js reads to reconstruct the sequence:
      </p>
      <pre><code>{`# Write reveal_order BEFORE removing the BuildModifier
rev_attr = mesh.attributes.new("_reveal_order", 'INT', 'FACE')
for i in range(len(mesh.polygons)):
    rev_attr.data[i].value = i  # face index == reveal order (post-sort)

# Export the final-state GLB with the attribute
ob.modifiers.remove(mod)   # remove Build so all faces export
bpy.ops.export_scene.gltf(
    filepath="hf_crystal_geode.glb",
    export_attributes=True,   # carries _reveal_order per-face
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)`}</code></pre>
      <p>
        In the glTF accessor, <code>_reveal_order</code> appears as a{" "}
        <code>SCALAR</code> / <code>UNSIGNED_INT</code> per-vertex attribute
        (face-domain values are replicated per corner on export). In Three.js:
      </p>
      <pre><code>{`// Three.js: animate crystal growth by face reveal_order
const revealOrder = geometry.attributes._reveal_order.array;
const maxOrder    = Math.max(...revealOrder);

function updateCrystal(progress) {   // progress 0..1
  const threshold = progress * maxOrder;
  // Build a new index buffer excluding faces above threshold
  const newIndices = [];
  for (let t = 0; t < geometry.index.count; t += 3) {
    const fi = Math.floor(t / 3);           // face index
    if (revealOrder[geometry.index.array[t]] <= threshold)
      newIndices.push(...geometry.index.array.slice(t, t + 3));
  }
  geometry.setIndex(newIndices);
}`}</code></pre>
      <p>
        This approach retains Draco compression on the final asset, avoids
        uploading 5 separate GLBs, and lets the reveal timing live entirely in
        JavaScript without baking a morph-target sequence. The Poke-spike
        geometry used here is explored further in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr"
          className={lk}
        >
          bmesh.ops.poke tutorial
        </Link>
        .
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Modifier ignores frame_set()</strong> — call{" "}
          <code>evaluated_depsgraph_get()</code> <em>after</em>{" "}
          <code>scene.frame_set()</code>; a cached depsgraph will return the
          previous frame&rsquo;s geometry.
        </li>
        <li>
          <strong>All faces vanish at frame 1</strong> — <code>frame_start</code>{" "}
          must be ≥ 1. The default is 1 and the formula clamps at 0 visible faces
          when <code>F &lt; frame_start</code>. If frame_start=0 and
          frame_set(0), the clamped result is 0 faces — an empty mesh.
        </li>
        <li>
          <strong>Sorted order not preserved after modifier apply</strong> — do
          not call <code>bpy.ops.object.modifier_apply()</code> before reading
          snapshots. Apply collapses the modifier into the base mesh and freezes
          it at the current frame.
        </li>
        <li>
          <strong>export_apply=True loses growth animation</strong> — for static
          snapshot GLBs use <code>export_apply=False</code> on the snapshot
          object (the modifier was already evaluated by{" "}
          <code>new_from_object</code>). For the live-modifier .blend, also keep
          <code>export_apply=False</code> and let the exporter sample frames via
          <code>export_animations=True</code>.
        </li>
      </ul>

      <h2>Sources</h2>
      <p>
        Blender Manual — Build Modifier (CC-BY-SA 4.0, Blender Foundation):{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/build.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org / Build Modifier
        </a>
        . bpy.types.BuildModifier API reference (CC-BY-SA 4.0, Blender
        Foundation):{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.BuildModifier.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org / bpy.types.BuildModifier
        </a>
        . glTF-Blender-IO (Apache-2.0, Khronos Group):{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com / KhronosGroup / glTF-Blender-IO
        </a>
        . Related: glTF 2.0 Specification (Apache-2.0, Khronos):{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com / KhronosGroup / glTF
        </a>
        .
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
        content: `import bpy, bmesh, math, os
from mathutils import Vector

ICO_SUBDIV     = 1
POKE_HEIGHT    = 0.18
SCALE_Z        = 1.55
BUILD_FRAMES   = 80
STAGE_COUNT    = 5
DRACO_LEVEL    = 6

# Reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = BUILD_FRAMES + 10

# Build crystal mesh
mesh = bpy.data.meshes.new("hf_crystal_geode")
bm   = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIV, radius=0.9,
                            matrix=__import__("mathutils").Matrix.Identity(4),
                            calc_uvs=False)
for v in bm.verts:
    v.co.z *= SCALE_Z
bm.faces.ensure_lookup_table()

# Poke all faces into spikes
poke_result = bmesh.ops.poke(bm, faces=list(bm.faces))
for apex in poke_result['verts']:
    n = Vector((0, 0, 0))
    for lf in apex.link_faces:
        n += lf.normal
    if n.length > 0.001:
        n.normalize()
    apex.co += n * POKE_HEIGHT

bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

# Z-sort faces for bottom-to-top reveal
bm.faces.sort(key=lambda f: f.calc_center_median().z)
bm.to_mesh(mesh)
bm.free()
mesh.update()

# Write _reveal_order face attribute
rev = mesh.attributes.new("_reveal_order", 'INT', 'FACE')
for i in range(len(mesh.polygons)):
    rev.data[i].value = i

# Material
mat = bpy.data.materials.new("hf_crystal")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.48, 0.78, 1.0, 1)
bsdf.inputs["Roughness"].default_value  = 0.12
bsdf.inputs["Emission Color"].default_value = (0.35, 0.60, 1.0, 1)
bsdf.inputs["Emission Strength"].default_value = 0.45
mesh.materials.append(mat)

ob = bpy.data.objects.new("hf_crystal_geode", mesh)
scene.collection.objects.link(ob)
for poly in mesh.polygons:
    poly.use_smooth = False

# BuildModifier
mod               = ob.modifiers.new("CrystalGrowth", 'BUILD')
mod.frame_start   = 1
mod.frame_duration = BUILD_FRAMES
mod.use_random_order = False
mod.use_reverse   = False

# Export 5 snapshots
def export_snapshot(frame_num, stage_idx, out_path):
    scene.frame_set(frame_num)
    dg  = bpy.context.evaluated_depsgraph_get()
    ev  = ob.evaluated_get(dg)
    snp = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    snp_ob = bpy.data.objects.new(f"stage_{stage_idx}", snp)
    scene.collection.objects.link(snp_ob)
    for poly in snp.polygons:
        poly.use_smooth = False
    bpy.ops.object.select_all(action='DESELECT')
    snp_ob.select_set(True)
    bpy.context.view_layer.objects.active = snp_ob
    bpy.ops.export_scene.gltf(
        filepath=out_path, export_format='GLB', use_selection=True,
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True, export_attributes=True,
    )
    scene.collection.objects.unlink(snp_ob)
    bpy.data.meshes.remove(snp)

for s in range(STAGE_COUNT):
    frac  = s / (STAGE_COUNT - 1)
    frame = max(1, round(1 + frac * BUILD_FRAMES))
    export_snapshot(frame, s, f"/tmp/hf_crystal_stage_{s}.glb")

# Final-state GLB with _reveal_order
ob.modifiers.remove(mod)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath="/tmp/hf_crystal_geode.glb",
    export_format='GLB', use_selection=True,
    export_apply=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True, export_attributes=True,
)
print("Done.")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-build-modifier-face-reveal-crystal-growth-webxr",
    title:
      "Python bpy.types.BuildModifier — Face-Reveal Sequence, Depsgraph Snapshot & Z-Sorted Crystal Growth for WebXR (Blender 5.1)",
    tags: ["blender", "python", "modifier", "animation", "webxr", "scripting"],
    date: "2026-07-20",
    Body,
  }
);
