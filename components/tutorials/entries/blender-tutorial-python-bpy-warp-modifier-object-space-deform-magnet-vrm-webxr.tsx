import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>WarpModifier</strong> deforms mesh by remapping vertex positions
        from one Object transformation space (the <em>From</em> empty) into
        another (the <em>To</em> empty). Vertices near the From empty are
        interpolated toward where they would be if the From empty&rsquo;s local
        space were replaced by the To empty&rsquo;s — pulling, rotating, and
        scaling simultaneously depending on how the two empties differ. A vertex
        group masks the effect zone, and the falloff type controls how steeply
        the influence decays with distance from From.
      </p>
      <p>
        This tutorial builds a faceted VRM sleeve accessory whose cuff is shaped
        by two stacked WarpModifiers: one that swings the cuff forward (gravity
        drape via a translation offset) and one that spirals the cuff edge
        around the wrist axis (twist via a rotation offset). Both are baked into
        the mesh before Solidify and GLB export, producing a clean static prop
        with no runtime modifier cost.
      </p>

      <h2>The transform behind the modifier</h2>
      <p>
        Understanding the maths prevents two common surprises. The modifier
        computes:
      </p>
      <pre><code>{`M = ob_to.matrix_world @ ob_from.matrix_world.inverted()

# Per vertex:
factor = strength × falloff(dist(v, ob_from) / falloff_radius)
         × vertex_group_weight
v_warped = lerp(v_original, M @ v_original, factor)`}</code></pre>
      <p>
        When the two empties are identical, <code>M</code> is the identity
        matrix and the modifier is a no-op — confirming you need at least a
        translation or rotation difference. When only translation differs,
        vertices are pulled toward <code>ob_to.location</code>. When only
        rotation differs, vertices spiral around the axis defined by
        <code>ob_from.location</code>. Both can be combined by moving{" "}
        <em>and</em> rotating the To empty, but in practice stacking two
        separate WarpModifiers (one per intention) is easier to iterate on
        because each slider controls one design variable independently.
      </p>

      <h2>Setting up WarpModifier via Python</h2>
      <pre><code>{`import bpy
from mathutils import Vector, Euler
import math

# Create empties — WarpModifier needs live bpy.types.Object references
from_e = bpy.data.objects.new("warp_from", None)
bpy.context.collection.objects.link(from_e)
from_e.location = Vector((0, 0, 0))    # wrist centre

to_e = bpy.data.objects.new("warp_to_drape", None)
bpy.context.collection.objects.link(to_e)
to_e.location = Vector((0.030, 0.012, 0.015))  # offset → drape direction

# Add the modifier
mod = ob.modifiers.new("Drape", "WARP")
mod.object_from      = from_e
mod.object_to        = to_e
mod.strength         = 0.82
mod.falloff_radius   = 0.090   # metres; vertices beyond this are unaffected
mod.falloff_type     = "SMOOTH"
mod.vertex_group     = "cuff_zone"
# mod.invert_vertex_group = True  # deform everything EXCEPT the named group`}</code></pre>
      <p>
        The empties must be linked into the same scene collection as the mesh
        object or Blender&rsquo;s dependency graph will not resolve them. They
        are deleted from the scene before GLB export to keep the node list clean.
      </p>

      <h2>Falloff types compared</h2>
      <p>
        The <code>falloff_type</code> enum controls how deformation fades from
        full strength (at the From empty) to zero (at <code>falloff_radius</code>
        distance):
      </p>
      <ul>
        <li>
          <code>SMOOTH</code> — cubic ease-in / ease-out. The broadest, softest
          falloff; almost no deformation near the boundary. Good for large-area
          gravity drape where any hard edge would be visible.
        </li>
        <li>
          <code>SPHERE</code> — √(1 − (d/r)²). Starts boldly, drops off quickly
          at the boundary. Good for tight cuff twists where you want the effect
          concentrated near the wrist and nearly invisible 30% out.
        </li>
        <li>
          <code>ROOT</code> — √(d/r) inverted. Slowest fall-off; maximum
          deformation across nearly the full radius. Risky on large meshes —
          can deform areas you didn&rsquo;t intend.
        </li>
        <li>
          <code>SHARP</code> — (1 − d/r)². Aggressive — most deformation is
          concentrated within 30% of the From empty, almost nothing at 60%+.
          Useful for pinch effects (joint volume preservation).
        </li>
        <li>
          <code>LINEAR</code> — constant rate of decrease. Predictable but
          produces a visible seam at the radius boundary unless masked precisely.
        </li>
        <li>
          <code>CONSTANT</code> — full strength everywhere inside the radius,
          zero outside. Useful only for debugging or deliberately hard deformation
          zones.
        </li>
      </ul>

      <h2>Vertex group for zone masking</h2>
      <p>
        Assigning a linear weight gradient to the cuff zone — weight 1.0 at the
        hem, 0.0 at the cutoff ring — prevents the Warp falloff from cutting
        abruptly at a ring boundary. The two falloff mechanisms compound: the
        group weight and the spatial falloff both contribute, so the transition
        is doubly smooth with no seam.
      </p>
      <pre><code>{`VG_CUFF   = "cuff_zone"
CUFF_FRAC = 0.22   # bottom 22% of rings

vg = ob.vertex_groups.new(name=VG_CUFF)
cutoff = int(RINGS * CUFF_FRAC)   # last ring with nonzero weight

for ri in range(cutoff + 1):
    w = 1.0 - (ri / max(cutoff, 1))   # linear ramp, ring 0 = full weight
    indices = [verts[ri][si].index for si in range(SEGS)]
    vg.add(indices, w, "REPLACE")`}</code></pre>

      <h2>Stacking two WarpModifiers</h2>
      <p>
        The second WarpModifier receives the already-deformed geometry from the
        first as its input. Stacking order matters because the second modifier
        sees the warped vertex positions, not the original ones. In practice
        this means:
      </p>
      <ul>
        <li>
          <strong>Drape first, Twist second</strong> — the twist operates on
          the already-forward-swung cuff, so the spiral is centred on the drape
          target, not the undeformed wrist centre. This is usually correct for
          VRM clothing because the physical drape happens before any wrist
          rotation.
        </li>
        <li>
          <strong>Twist first, Drape second</strong> — the drape pulls the
          twisted geometry. This produces a slightly different silhouette at
          the cuff edge — the spiral follows the pull direction rather than
          the sleeve axis. Neither is wrong; choose by visual inspection.
        </li>
      </ul>
      <pre><code>{`# Second WarpModifier — twist via rotated To empty
twist_to = bpy.data.objects.new("warp_to_twist", None)
bpy.context.collection.objects.link(twist_to)
twist_to.rotation_euler = Euler((0, 0, math.radians(13.0)), "XYZ")
# twist_to.location stays at (0,0,0) — pure rotation, no translation

mod2 = ob.modifiers.new("Twist", "WARP")
mod2.object_from    = from_e          # same From as the drape modifier
mod2.object_to      = twist_to
mod2.strength       = 0.55
mod2.falloff_radius = 0.068
mod2.falloff_type   = "SPHERE"        # tighter than drape — only cuff hem spirals
mod2.vertex_group   = VG_CUFF`}</code></pre>

      <h2>Baking and export</h2>
      <p>
        WarpModifier references live Object pointers — the empties must exist at
        export time if you export with modifiers applied by the glTF exporter.
        The safer approach for static WebXR props is to bake the modifiers into
        the base mesh before export, then delete the empties. This is done via
        the depsgraph evaluated mesh path:
      </p>
      <pre><code>{`bpy.context.view_layer.objects.active = ob
dg      = bpy.context.evaluated_depsgraph_get()
ob_ev   = ob.evaluated_get(dg)
me_baked = bpy.data.meshes.new_from_object(ob_ev)   # snapshot the evaluated mesh

old_me  = ob.data
ob.data = me_baked
bpy.data.meshes.remove(old_me)
ob.modifiers.clear()                 # modifiers now baked — stack is empty

for e in [from_e, drape_to, twist_to]:
    bpy.data.objects.remove(e, do_unlink=True)   # empties gone, GLB stays clean`}</code></pre>

      <h2>Strength outside [0, 1]</h2>
      <p>
        Strength values above 1.0 overshoot the To transform — the cuff swings
        past the To empty rather than stopping at it. Values below 0.0 deform in
        the opposite direction (cuff pulls away from To). Both are valid for
        cartoon squash-and-stretch rigs. For realistic VRM clothing, keep
        strength in the range 0.5–0.95 to avoid uncanny overshoot at slow
        keyframe interpolation speeds.
      </p>

      <h2>Cross-references</h2>
      <p>
        For empty-driven vertex deformation using a different mechanism, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr"
          className={lk}
        >
          HookModifier — vertex bind & empty deform
        </Link>{" "}
        tutorial: Hook pins specific vertices to an empty directly, while Warp
        operates on a distance field and is better suited to smooth continuous
        deformation. For the upstream weight pipeline that feeds the{" "}
        <code>vertex_group</code> input, see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr"
          className={lk}
        >
          VertexWeightEdit + VertexWeightMix — S-curve remap & group blend
        </Link>
        . For fixing deformation artefacts that Warp can introduce at joint
        creases, see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr"
          className={lk}
        >
          CorrectiveSmoothModifier — joint-volume recovery
        </Link>
        . For cage-based VRM clothing deformation as an alternative to Warp, see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr"
          className={lk}
        >
          MeshDeformModifier — cage bind & VRM clothing
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.WarpModifier.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bpy.types.WarpModifier (Blender 5.1)
          </a>{" "}
          — CC-BY-SA-4.0. Related project:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender
          </a>
          .
        </li>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/modifiers/deform/warp.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Warp Modifier — Blender Manual 5.1
          </a>{" "}
          — CC-BY-SA-4.0. Related project:{" "}
          <a
            href="https://projects.blender.org/blender/blender-manual"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender-manual
          </a>
          .
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0. Related project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noreferrer"
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
    slug: "blender-tutorial-python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr",
    title:
      "Python bpy.types.WarpModifier — Two-Object Space Warp, Magnetic Pull & VRM Sleeve Cuff Drape (Blender 5.1)",
    date: "2026-07-20",
    topics: ["blender", "scripting", "vrm", "webxr"],
    description:
      "Stack two WarpModifiers — a SMOOTH-falloff drape warp and a SPHERE-falloff axial twist — to shape a faceted VRM sleeve cuff without sculpting, then bake via depsgraph evaluated mesh and export as a clean single-node GLB.",
  },
  {
    files: [
      {
        label: "blueprint.py",
        language: "python",
        path: "public/library/blends/scripting/python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr/blueprint.py",
      },
      {
        label: "record.py",
        language: "python",
        path: "public/library/blends/scripting/python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr/record.py",
      },
    ],
    body: <Body />,
  }
);
