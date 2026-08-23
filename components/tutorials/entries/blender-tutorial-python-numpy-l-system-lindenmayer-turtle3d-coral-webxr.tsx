import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  slug: "blender-tutorial-python-numpy-l-system-lindenmayer-turtle3d-coral-webxr",
  title:
    "Python numpy — L-System Lindenmayer: 3D Turtle String Rewriting, Rodrigues Rotation Frame & Branching Coral GLB for WebXR + 3D Print (Blender 5.1)",
  lede: "Expand a three-symbol Lindenmayer production rule ('A → F[+&A][-&A][^A]') through five generations of simultaneous string substitution, then walk the result with a 3D turtle carrying a (fwd, up, right) frame updated by Rodrigues rotation — no gimbal lock, no quaternion overhead — to collect 121 polyline branches; pack all branches into a single Blender Curve object where per-point .radius scales bevel_depth for a root-to-tip taper, and export the evaluated mesh as a Draco-compressed GLB ready for WebXR or MSLA light-sculpture printing.",
  date: "2026-07-26",
  externalSources: [
    {
      label:
        "Prusinkiewicz & Lindenmayer — 'The Algorithmic Beauty of Plants' (1990, Springer-Verlag) — coral preset Fig. 1.24c — freely distributed by the authors at algorithmicbotany.org",
      url: "http://algorithmicbotany.org/papers/abop/abop.pdf",
      licence: "Academic free-use (authors' explicit distribution)",
      author: "Aristid Lindenmayer / Przemysław Prusinkiewicz — University of Calgary",
    },
    {
      label:
        "numpy — N-dimensional array library — BSD-3-Clause (provides mathutils fallback arithmetic and trigonometry for offline mesh pre-computation)",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy Developers — https://github.com/numpy/numpy",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>Why L-Systems, and why this rule?</h2>
      <p>
        Aristid Lindenmayer introduced L-Systems in 1968 to model algae cell
        division: a context-free grammar where every symbol in a string is
        rewritten simultaneously on each generation step rather than one at a
        time. The resulting strings grow exponentially in length but compactly
        encode the self-similar structure of branching organisms. The rule used
        here —{" "}
        <code>{"A → F[+&A][-&A][^A]"}</code> — generates a tri-axial coral fan:
        each node sprouts three child branches via a yaw+pitch rightward tilt,
        a yaw+pitch leftward tilt, and a pure pitch upward tilt, giving genuine
        3D spread.
      </p>
      <p>
        The studio cares about it for two reasons. First, the resulting GLB reads
        as a sea-fan light sculpture in WebXR: held in front of an XR camera,
        the tapered tubes catch light from all angles. Second, printed in clear
        MSLA resin the nested cylinders act as waveguides — each branch tip
        becomes a point source of LED light conducted from the base, just as in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
          className={lk}
        >
          resin light-sculpture tutorial
        </Link>
        .
      </p>

      <h2>Step 1 — String expansion</h2>
      <p>
        String expansion is a single loop of character-level dictionary lookup:
      </p>
      <pre>{`AXIOM       = "A"
RULES       = {"A": "F[+&A][-&A][^A]"}
GENERATIONS = 5

def expand(axiom, rules, n):
    s = axiom
    for _ in range(n):
        s = "".join(rules.get(c, c) for c in s)
    return s

l_str = expand(AXIOM, RULES, GENERATIONS)
# len(l_str) at gen=5 ≈ 2 428 characters`}</pre>
      <p>
        The string at generation 5 contains 121 <code>F</code> symbols (the
        geometric segments), 121 pairs of <code>[</code>/<code>]</code>, and
        the rotation symbols that orient each child branch. The total character
        count grows as{" "}
        <code>{"O(|rule|ⁿ)"}</code> — stay below generation 7 to avoid
        multi-megabyte strings.
      </p>

      <h2>Step 2 — The 3D turtle and Rodrigues rotation</h2>
      <p>
        The turtle carries three orthonormal vectors{" "}
        <code>(fwd, up, right)</code> — Prusinkiewicz & Lindenmayer call these{" "}
        <em>H</em> (heading), <em>U</em> (up), and <em>L</em> (left). Rotations
        are applied via Rodrigues&apos; formula to avoid quaternion normalisation
        overhead and sidestep gimbal lock entirely:
      </p>
      <pre>{`def _rot(v, axis, angle_rad):
    axis = axis.normalized()
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return v * c + axis.cross(v) * s + axis * (axis.dot(v) * (1.0 - c))

# yaw left (+):
fwd   = _rot(fwd,   up,    +ANGLE)
right = _rot(right, up,    +ANGLE)

# pitch down (&) — uses right as axis to rotate fwd and up:
fwd = _rot(fwd, right, +ANGLE)
up  = _rot(up,  right, +ANGLE)`}</pre>
      <p>
        The key insight: <code>+/-</code> rotate <em>only</em> <code>fwd</code>{" "}
        and <code>right</code> (keeping <code>up</code> fixed), while{" "}
        <code>&amp;/^</code> rotate <code>fwd</code> and <code>up</code>{" "}
        (keeping <code>right</code> fixed). The two rotation axes are
        orthogonal, so branches spawned from a combination like{" "}
        <code>[+&amp;A]</code> lean diagonally out of both the yaw and pitch
        planes simultaneously — this is what produces real 3D spread rather than
        a flat fan.
      </p>

      <h2>Step 3 — Branch collection</h2>
      <p>
        Each <code>[</code> symbol saves the full turtle state and starts a new
        branch path from the current position. Each <code>]</code> saves the
        completed child branch and pops the parent state. Because the rule
        produces only one <code>F</code> per node before the three
        sub-branches, every branch is a 2-point polyline (start, end):
      </p>
      <pre>{`elif sym == "[":
    stack.append((pos.copy(), fwd.copy(), up.copy(), right.copy(),
                  depth, step, radius, active))
    active = [pos.copy()]  # new branch starts here
    depth  += 1
    step   *= TAPER_STEP   # 0.72 — child is 72% the length of its parent
    radius *= TAPER_RAD    # 0.70 — child is 70% as thick
elif sym == "]":
    if len(active) >= 2:
        branches.append((depth, active))
    (pos, fwd, up, right, depth, step, radius, active) = stack.pop()`}</pre>
      <p>
        At generation 5 this yields 121 branch entries: 1 at depth 0 (trunk
        base), 3 at depth 1, 9 at depth 2, 27 at depth 3, and 81 at depth 4.
        The 243 depth-5 child As in the unexpanded leaves produce no{" "}
        <code>F</code>, so no extra branches arise there.
      </p>

      <h2>Step 4 — Curve object with tapered POLY splines</h2>
      <p>
        All 121 branches go into one <code>bpy.types.Curve</code> data-block as
        individual POLY splines. Per-point <code>.radius</code> multiplies{" "}
        <code>bevel_depth</code> to taper each branch from root to tip:
      </p>
      <pre>{`cd = bpy.data.curves.new("hf_coral_curve", type="CURVE")
cd.dimensions       = "3D"
cd.bevel_mode       = "ROUND"
cd.bevel_depth      = BEVEL_DEPTH   # 0.022 m = 22 mm trunk radius
cd.bevel_resolution = BEVEL_RES     # 3 → 8-sided octagon
cd.use_fill_caps    = True
cd.twist_mode       = "MINIMUM"     # parallel-transport frame

for branch_depth, pts in branches:
    n = len(pts)
    sp = cd.splines.new(type="POLY")
    sp.points.add(n - 1)
    depth_r = TAPER_RAD ** branch_depth   # 0.70^d — 70% per level
    for j, pt in enumerate(pts):
        t = j / max(n - 1, 1)
        r = depth_r * max(1.0 - 0.8 * t, 0.05)  # floor at 5%
        sp.points[j].co     = (pt.x, pt.y, pt.z, 1.0)
        sp.points[j].radius = r`}</pre>
      <p>
        The <code>bevel_mode = "ROUND"</code> and <code>bevel_depth</code>{" "}
        combination creates a circular cross-section whose diameter at any point
        equals <code>2 × bevel_depth × point.radius</code>. Using{" "}
        <code>twist_mode = "MINIMUM"</code> (parallel transport) prevents the
        tube cross-section from spinning relative to the branch direction — the
        right default for organic shapes where arbitrary twist reads as
        artefact. See the comparison with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
          className={lk}
        >
          torus knot parallel-transport tutorial
        </Link>{" "}
        for a precise treatment of the minimum-rotation frame.
      </p>

      <h2>Step 5 — Mesh conversion and GLB export</h2>
      <p>
        Converting a Curve to a mesh without UI context uses the evaluated
        depsgraph — this bakes the bevel modifier (and any other modifiers on
        the object) entirely in-memory without touching the viewport:
      </p>
      <pre>{`dg     = bpy.context.evaluated_depsgraph_get()
ev_obj = curve_obj.evaluated_get(dg)
mesh   = bpy.data.meshes.new_from_object(ev_obj)

for poly in mesh.polygons:
    poly.use_smooth = False   # flat-shaded faceted aesthetic

mesh_obj = bpy.data.objects.new("hf_l_system_coral_mesh", mesh)
bpy.context.collection.objects.link(mesh_obj)`}</pre>
      <p>
        Flat shading gives the bevel-generated tube faces a faceted look
        consistent with the studio&apos;s low-poly visual language — the same
        choice made in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
          className={lk}
        >
          Surface Nets gyroid tutorial
        </Link>
        . Smooth shading would require a custom normals pass via{" "}
        <code>bpy.ops.object.shade_smooth_by_angle()</code> and is a legitimate
        alternative when the coral needs to read as organic rather than
        crystalline.
      </p>

      <h2>Step 6 — Material and emission</h2>
      <pre>{`mat = bpy.data.materials.new("hf_coral_emit")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()
out  = nt.nodes.new("ShaderNodeOutputMaterial")
emit = nt.nodes.new("ShaderNodeEmission")
emit.inputs["Color"].default_value    = (0.25, 0.85, 0.95, 1.0)
emit.inputs["Strength"].default_value = 4.0
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])`}</pre>
      <p>
        A pure Emission shader (no diffuse or specular components) lets EEVEE
        Next&apos;s bloom post-process create the bioluminescent corona without
        any additional light rigs. In Cycles, the same shader drives photon
        emission from branch surfaces — useful for the long-exposure accumulation
        technique described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-cycles-long-exposure-render-loop-numpy-exr-max-fold-light-trail"
          className={lk}
        >
          Cycles long-exposure render loop tutorial
        </Link>
        .
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Coral looks like a flat fan rather than 3D.</strong> The{" "}
          <code>&amp;</code> (pitch down) symbol is responsible for the third
          dimension. Confirm <code>RULES = {"{"}"A": "F[+&A][-&A][^A]"{"}"}</code> —
          if the rule is missing <code>&amp;</code> and uses only <code>+/-</code>,
          branches stay in the XZ plane.
        </li>
        <li>
          <strong>String expands to millions of characters.</strong>{" "}
          <code>GENERATIONS = 7</code> with a branching factor of 3 gives
          3⁷ = 2 187 leaf branches and a string of &gt;50 000 characters; Python
          handles it but the Curve will have thousands of splines. Drop back to
          5 or 6.
        </li>
        <li>
          <strong>GLB is too large for WebXR.</strong> GENERATIONS=5 produces
          approximately 121 × 8 × 2 = 1 936 tube faces. Draco level 6 compresses
          this to around 60–80 KB. If it is larger, confirm{" "}
          <code>export_draco_mesh_compression_enable = True</code> in the export
          call.
        </li>
        <li>
          <strong>Tube caps missing.</strong> Set{" "}
          <code>cd.use_fill_caps = True</code> before adding splines. Caps close
          each 2-point tube at both ends; without them the branch tips are open
          cylinders that show through in WebXR.
        </li>
        <li>
          <strong>Branch junction looks rough.</strong> Where a parent branch
          ends and three child branches start, the caps of all four cylinders
          overlap at the same point. This creates a natural node swell — it is the
          intended visual. If it is too pronounced, reduce{" "}
          <code>BEVEL_DEPTH</code> or add a Decimate modifier (ratio 0.9) to the
          mesh after conversion.
        </li>
        <li>
          <strong>For 3D-print prep</strong>, disable{" "}
          <code>use_fill_caps</code> temporarily, combine all splines into one
          manifold mesh with Merge by Distance (threshold 1 mm), re-cap with Fill
          Holes, then see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
            className={lk}
          >
            MSLA light-sculpture workflow
          </Link>{" "}
          for shell offset and drainage hole placement.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body);
