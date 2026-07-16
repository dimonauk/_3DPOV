import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.BooleanModifier</code> merges, subtracts, or intersects
        two mesh objects. Its sibling{" "}
        <code>bpy.types.WeldModifier</code> fuses near-duplicate vertices within
        a threshold distance. Together they form the canonical scripted
        compound-body pipeline: Boolean builds the topology, Weld cleans the
        seam. For faceted low-poly props going into WebXR the order is
        non-negotiable — apply Boolean first, then Weld, never the other way
        around.
      </p>

      <h2>Why two modifiers instead of one</h2>
      <p>
        The Boolean solver guarantees a manifold mesh where the two input bodies
        overlap, but it cannot know whether the two surfaces were originally
        flush. When a flat face of the column base sits exactly on the top face
        of the plate, the EXACT solver inserts new edges along the intersection
        but keeps both sets of vertices — one from the plate, one from the
        column — separated by a distance smaller than a floating-point epsilon.
        These <em>near-duplicates</em> are invisible in the viewport but cause
        lightmap seams, doubled normals, and degenerate triangles during GLB
        export. The Weld pass exists purely to collapse them.
      </p>

      <h2>EXACT vs FAST solver</h2>
      <pre><code>{`mod = base_obj.modifiers.new("Bool_Union", 'BOOLEAN')
mod.operation = 'UNION'
mod.object    = cutter_obj

# 'EXACT' — exact arithmetic predicates (Mesh Boolean library).
# Guaranteed manifold result on planar seams. Required for flat-faced props.
mod.solver = 'EXACT'

# 'FAST' — BVH approximation. Can leave micro-gaps on coplanar faces.
# Use only for convex rounded shapes where solve time matters.
mod.solver = 'FAST'`}</code></pre>
      <p>
        The practical rule: always start with <code>EXACT</code> and fall back
        to <code>FAST</code> only if the solve time is a problem. For low-poly
        props under 2 000 faces, EXACT completes in under a millisecond.
      </p>

      <h2>use_hole_tolerant — the escape hatch</h2>
      <p>
        If EXACT reports a non-manifold failure — usually because one input mesh
        has an interior face or a zero-area edge — enable{" "}
        <code>mod.use_hole_tolerant = True</code>. This triggers a flood-fill
        repair pass on the cutter before solving, at the cost of a few extra
        triangles at concave edges. For studio props built from clean bmesh
        primitives it should never be needed; it is the escape hatch when you
        import geometry from an external source.
      </p>

      <h2>Building the primitives</h2>
      <pre><code>{`import bpy, math, bmesh

PLATE_X, PLATE_Y, PLATE_Z = 0.90, 0.60, 0.10  # half-extents (m)
COLUMN_RADIUS = 0.22
COLUMN_HEIGHT = 0.70
COLUMN_SEGMENTS = 6  # hexagonal

def make_plate(name):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= PLATE_X
        v.co.y *= PLATE_Y
        v.co.z *= PLATE_Z
    bm.normal_update()
    mesh = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

def make_column(name):
    bm = bmesh.new()
    bot, top = [], []
    for i in range(COLUMN_SEGMENTS):
        a = math.tau * i / COLUMN_SEGMENTS
        x, y = COLUMN_RADIUS * math.cos(a), COLUMN_RADIUS * math.sin(a)
        bot.append(bm.verts.new((x, y, 0.0)))
        top.append(bm.verts.new((x, y, COLUMN_HEIGHT)))
    bm.faces.new(list(reversed(bot)))  # reversed for outward normal
    bm.faces.new(top)
    for i in range(COLUMN_SEGMENTS):
        j = (i + 1) % COLUMN_SEGMENTS
        bm.faces.new([bot[i], bot[j], top[j], top[i]])
    bm.normal_update()
    mesh = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location.z = PLATE_Z  # column base flush with plate top
    return obj`}</code></pre>

      <h2>Stacking the modifiers in the correct order</h2>
      <pre><code>{`plate  = make_plate("hf_plate")
column = make_column("hf_column")

# 1. Boolean UNION — merges column topology into plate
bool_mod = plate.modifiers.new("Bool_Union", 'BOOLEAN')
bool_mod.operation = 'UNION'
bool_mod.object    = column
bool_mod.solver    = 'EXACT'
bool_mod.use_self  = False

# 2. Weld — collapses near-duplicate seam verts produced by the boolean
weld_mod = plate.modifiers.new("Weld_Junction", 'WELD')
weld_mod.merge_threshold = 0.0001
# mode='CONNECTED' — only merges edge-adjacent pairs; safe on multi-surface mesh
weld_mod.mode = 'CONNECTED'`}</code></pre>
      <p>
        <code>&apos;CONNECTED&apos;</code> mode is the safer choice.{" "}
        <code>&apos;ALL&apos;</code> merges globally across all geometry — if
        two separate surfaces of the prop happen to be within threshold of each
        other, <code>&apos;ALL&apos;</code> would incorrectly merge them.{" "}
        <code>&apos;CONNECTED&apos;</code> only fuses pairs that already share
        an edge, targeting precisely the seam geometry the boolean introduced.
      </p>

      <h2>Applying and cleaning up</h2>
      <pre><code>{`bpy.context.view_layer.objects.active = plate
bpy.ops.object.select_all(action='DESELECT')
plate.select_set(True)
bpy.ops.object.mode_set(mode='OBJECT')

# Apply in stack order.
# list() copy is mandatory — iterating the live collection skips every other
# modifier because apply() mutates the collection in place.
for mod in list(plate.modifiers):
    bpy.ops.object.modifier_apply(modifier=mod.name)

# Remove cutter before export — it appears as a second mesh in the GLB otherwise
cutter_mesh = column.data
bpy.data.objects.remove(column, do_unlink=True)
if cutter_mesh.users == 0:
    bpy.data.meshes.remove(cutter_mesh)`}</code></pre>

      <h2>Export to GLB</h2>
      <pre><code>{`bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath("//hf_boolean_weld_prop.glb"),
    export_format = 'GLB',
    use_selection = True,
    export_apply  = False,   # modifiers already applied; skips a second bake
    export_yup    = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
)`}</code></pre>
      <p>
        <code>export_apply=False</code> because the modifiers have already been
        applied manually. Passing <code>True</code> with an empty modifier stack
        is harmless but wasteful — it triggers a depsgraph evaluation that
        returns the same mesh.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Boolean produces empty result</strong>: the cutter must have{" "}
        <code>hide_viewport = False</code> at apply-time. The EXACT solver reads
        the cutter&rsquo;s evaluated mesh; a viewport-hidden object returns an
        empty evaluated mesh and the union collapses to just the base geometry.
      </p>
      <p>
        <strong>Weld merges across unrelated surfaces</strong>: switch from{" "}
        <code>mode=&apos;ALL&apos;</code> to{" "}
        <code>mode=&apos;CONNECTED&apos;</code>, or lower{" "}
        <code>merge_threshold</code>.
      </p>
      <p>
        <strong>modifier_apply raises RuntimeError</strong>: the target object
        must be in OBJECT mode and set as{" "}
        <code>bpy.context.view_layer.objects.active</code>. The operator fails
        silently in EDIT mode.
      </p>
      <p>
        <strong>Cutter mesh left with zero users</strong>: always call{" "}
        <code>bpy.data.meshes.remove(mesh)</code> when{" "}
        <code>mesh.users == 0</code> — orphan data blocks persist in the .blend
        file and bloat save size.
      </p>
      <p>
        <strong>EXACT solver hangs on large mesh</strong>: check input meshes
        for non-manifold edges via Mesh Analysis overlay in Edit Mode. Enable{" "}
        <code>use_hole_tolerant</code> as a first fix, then repair with{" "}
        <code>bmesh.ops.holes_fill()</code>.
      </p>

      <h2>Further reading in this studio</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply"
            className={lk}
          >
            Python Modifier Stack — Pre-export Apply Pipeline
          </Link>{" "}
          — the general pattern for stacking and applying any modifier sequence
          before GLB export, including dependency ordering.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
            className={lk}
          >
            bmesh.ops — Extrude, Bevel &amp; Bridge: Hard-Surface Prop
            Construction
          </Link>{" "}
          — the bmesh-only route to hard-surface topology for when you want
          non-destructive boolean behaviour at the raw operator level.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
            className={lk}
          >
            bpy.context.temp_override() — Headless Mesh Repair Pipeline
          </Link>{" "}
          — how to run operators like <code>modifier_apply</code> in headless
          scripts by injecting the correct context override.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export"
            className={lk}
          >
            Depsgraph Object Instances — GN Scatter &amp; Merged Static GLB for
            WebXR
          </Link>{" "}
          — after building individual props with Boolean + Weld, this pipeline
          scatters and merges them into a single static GLB for WebXR scenes.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/booleans.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Boolean Modifier — Blender Manual
          </a>{" "}
          (CC BY-SA 4.0). Covers solver options, limitation matrix, and the
          exact algorithm reference. Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.BooleanModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.BooleanModifier API
          </a>
          ,{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          KhronosGroup —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0). The bundled Blender exporter — understanding its{" "}
          <code>export_apply</code> flag is essential for correct modifier-baked
          GLB output. Related:{" "}
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
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr",
    title:
      "Python bpy.types.BooleanModifier + WeldModifier — Compound-body Prop Construction, Junction Weld & GLB Export for WebXR (Blender 5.1)",
    blurb:
      "Boolean UNION merges two bmesh-built primitives but leaves near-duplicate seam vertices. WeldModifier (mode='CONNECTED', threshold=0.0001) collapses them. Learn the EXACT vs FAST solver trade-off, why apply order is non-negotiable, the cutter cleanup pattern before GLB export, and how export_apply interacts with a pre-applied modifier stack.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "boolean",
      "weld",
      "modifier",
      "bmesh",
      "low-poly",
      "hard-surface",
      "glb",
      "webxr",
    ],
    difficulty: "intermediate",
  }
);
