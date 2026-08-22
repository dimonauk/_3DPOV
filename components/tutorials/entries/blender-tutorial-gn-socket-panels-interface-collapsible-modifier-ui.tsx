import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Geometry Nodes modifier with twelve exposed sockets produces a flat
        list in the Properties panel that is genuinely difficult to navigate.
        Blender 5.0 solved this with <strong>Socket Panels</strong> —
        collapsible sections declared in the node group&apos;s interface that
        group related parameters together without adding any nodes to the graph.
        The only API surface is{" "}
        <code>node_group.interface.new_panel(name, default_closed=False)</code>{" "}
        and the <code>parent=</code> keyword on <code>new_socket()</code>. Both
        are available from Python, so entire production modifier layouts can be
        authored headlessly and version-controlled.
      </p>
      <p>
        This builds on the foundation of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          GN Tree API tutorial
        </Link>
        , which covers <code>bpy.data.node_groups.new()</code>, node
        creation, and socket wiring. Panels sit entirely within{" "}
        <code>NodeTreeInterface</code> — they are not nodes — so they
        compose cleanly with any existing tree-building workflow.
      </p>

      <h2>The 4.x → 5.0 interface change</h2>
      <p>
        In Blender 3.x, group inputs and outputs lived on deprecated
        &ldquo;tree-level&rdquo; collections (<code>tree.inputs</code>,{" "}
        <code>tree.outputs</code>). Blender 4.0 replaced these with{" "}
        <code>tree.interface</code>, a <code>NodeTreeInterface</code> that owns
        all sockets and — since 5.0 — panels:
      </p>
      <pre>{`# 3.x pattern — removed in 4.0:
#   tree.inputs.new('NodeSocketFloat', 'Scale')

# 4.x flat interface — still works in 5.x:
s = tree.interface.new_socket("Scale", in_out='INPUT',
        socket_type='NodeSocketFloat')

# 5.0+ panels — 4.x silently ignores the parent= kwarg:
panel = tree.interface.new_panel("Noise", default_closed=False)
s = tree.interface.new_socket("Scale", in_out='INPUT',
        socket_type='NodeSocketFloat', parent=panel)`}</pre>
      <p>
        The <code>parent=</code> keyword is the entire feature. Sockets without
        a parent appear above all panels; sockets with a parent appear inside
        their panel in declaration order.
      </p>

      <h2>Default-closed panels</h2>
      <p>
        <code>default_closed=True</code> collapses the section on first use.
        Use it for parameters that are configured once and rarely revisited —
        ribbon tube radius, export flags, UV seam toggles. Use{" "}
        <code>default_closed=False</code> (the default) for parameters that
        artists adjust every session. The &ldquo;Ribbon&rdquo; panel in this
        blueprint is set closed; &ldquo;Curve Shape&rdquo; and &ldquo;Noise
        Displacement&rdquo; are set open.
      </p>
      <p>
        For the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr"
          className={lk}
        >
          Curve to Mesh ribbon
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-instance-on-points-scatter-webxr"
          className={lk}
        >
          Distribute Points scatter
        </Link>{" "}
        modifiers, which each expose eight to fourteen parameters, panels
        reduce the visible slot count from &ldquo;scrolling list&rdquo; to
        three or four labelled sections.
      </p>

      <h2>Socket identifiers for keyframing</h2>
      <p>
        When a GN modifier has panels, its inputs are still keyed by socket
        identifier strings (e.g. <code>&quot;Socket_3&quot;</code>) in the
        modifier dict. Panels do not change this — they are a UI grouping
        only. To keyframe a modifier input from Python:
      </p>
      <pre>{`# Find the identifier for "Noise Scale"
ng = bpy.data.node_groups["HF_PoiEnergyRibbon"]
noise_id = next(
    item.identifier
    for item in ng.interface.items_tree
    if getattr(item, 'name', '') == "Noise Scale"
)

# Insert a keyframe on the modifier value
mod = ob.modifiers["HF_PoiEnergyRibbon"]
mod[noise_id] = 4.0
mod.keyframe_insert(data_path=f'["{noise_id}"]', frame=1)`}</pre>
      <p>
        <code>items_tree</code> walks the flat list of all interface items —
        panels and sockets interleaved — in their display order. Panels have{" "}
        <code>item_type == 'PANEL'</code>; sockets have{" "}
        <code>item_type == 'SOCKET'</code>. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          FCurve keyframe tutorial
        </Link>{" "}
        covers the animation side of this in depth.
      </p>

      <h2>The Poi Energy Ribbon modifier</h2>
      <p>
        The blueprint builds a complete production modifier: a noise-displaced
        tube mesh along an input curve, with its ten parameters organised into
        three panels. The GN graph is identical to a hand-built one — panels
        are invisible at the node level.
      </p>
      <pre>{`Node graph:
  GroupInput
    ├─ Geometry ──────────────► ResampleCurve ──► CurveToMesh ──► SetPosition ──► SetMaterial ──► GroupOutput
    ├─ Resample Count ────────► ResampleCurve.Count
    ├─ Profile Resolution ────► CurveCircle.Resolution  ──► CurveToMesh.Profile
    ├─ Ribbon Radius ─────────► CurveCircle.Radius
    ├─ Fill Caps ─────────────► CurveToMesh.Fill Caps
    ├─ Noise Scale ───────────► NoiseTexture.Scale
    ├─ Noise Detail ──────────► NoiseTexture.Detail
    ├─ Noise Roughness ───────► NoiseTexture.Roughness
    ├─ Noise Strength ──┐
    │                   ▼
    │  Position ──► NoiseTexture.Fac ──► Math×Strength ──► VectorScale
    └─ Normal ─────────────────────────────────────────────► VectorScale ──► SetPosition.Offset`}</pre>
      <p>
        The <code>VectorMath SCALE</code> node&apos;s float input is{" "}
        <code>inputs[3]</code> — not <code>inputs[1]</code>. The SCALE
        operation internally has four input slots (three Vector + one Float),
        even though only the first Vector and the Float are active. This is a
        common source of silent mis-wiring when building trees from Python.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "GN — Socket Panels: Organising Geometry Nodes Group Inputs into Collapsible Modifier-UI Sections with NodeTreeInterfacePanel (Blender 5.1)",
  lede: "Blender 5.0 introduced NodeTreeInterfacePanel — a collapsible section in the modifier UI declared entirely in Python via node_group.interface.new_panel() and the parent= kwarg on new_socket(); this tutorial builds a complete Poi Energy Ribbon GN modifier from scratch, organises its ten inputs into three panels, and demonstrates the identifier-based keyframing that remains unchanged by panel structure.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-socket-panels-interface-collapsible-modifier-ui/",
  steps: [
    {
      title: "Run blueprint.py — helix, node group, material, modifier",
      body: "Open Blender 5.1 · Scripting workspace. Open `blueprint.py` and press **Run Script**.\n\n`_purge()` removes all existing data blocks. `_make_helix()` builds a 3-loop POLY curve as the poi spinner path. `_make_gn_tree()` creates the `HF_PoiEnergyRibbon` node group with three panels. `_apply()` attaches the modifier to the helix. `_eevee()` + `_camera()` set up the render environment.",
    },
    {
      title: "Inspect the panels in the modifier UI",
      body: "Select the `hf_poi_energy_ribbon` object. Open **Properties → Modifier Properties** (spanner icon).\n\nYou should see the `HF_PoiEnergyRibbon` modifier with three collapsible sections: **Curve Shape** (Resample Count, Profile Resolution), **Noise Displacement** (Noise Scale, Noise Strength, Noise Detail, Noise Roughness), and **Ribbon** (collapsed by default — Ribbon Radius, Fill Caps).\n\nClick the ▶ triangle next to **Ribbon** to expand it. Note that it respects `default_closed=True` on first open.\n\nIn the Python console, inspect the interface:\n```python\nng = bpy.data.node_groups['HF_PoiEnergyRibbon']\nfor item in ng.interface.items_tree:\n    print(item.item_type, getattr(item, 'name', ''))\n```\nOutput shows `PANEL Curve Shape`, `SOCKET Resample Count`, `SOCKET Profile Resolution`, `PANEL Noise Displacement`, etc.",
    },
    {
      title: "Live parameter tweaking — verify panel groups",
      body: "With the modifier panel open and the viewport in **Rendered** mode (press Z → Rendered):\n\n• Expand **Noise Displacement** and drag **Noise Scale** from 4 to 14. The tube surface texture frequency increases in real time.\n• Set **Noise Strength** to 0.05. The tube swells and distorts visibly.\n• Expand **Ribbon** and change **Ribbon Radius** from 0.008 to 0.025. The tube fattens.\n\nObserve that parameters in different panels remain visually separate — there is no cross-contamination of UI groups, which is the entire purpose of the panel system.",
    },
    {
      title: "Keyframe a modifier input using the socket identifier",
      body: "In the Python console:\n```python\nimport bpy\nob  = bpy.data.objects['hf_poi_energy_ribbon']\nmod = ob.modifiers['HF_PoiEnergyRibbon']\nng  = mod.node_group\n\n# Find the identifier for 'Noise Scale'\nnoise_id = next(\n    item.identifier\n    for item in ng.interface.items_tree\n    if getattr(item, 'name', '') == 'Noise Scale'\n)\nprint(noise_id)  # e.g. 'Socket_5'\n\n# Keyframe at two frames\nbpy.context.scene.frame_set(1)\nmod[noise_id] = 2.0\nmod.keyframe_insert(data_path=f'[\"{noise_id}\"]', frame=1)\n\nbpy.context.scene.frame_set(60)\nmod[noise_id] = 12.0\nmod.keyframe_insert(data_path=f'[\"{noise_id}\"]', frame=60)\n```\nScrub the timeline. The noise scale animates — panels have no effect on identifier-based keyframing.",
    },
    {
      title: "Record.py animation render",
      body: "Open `record.py` in the Scripting workspace. Press **Run Script**.\n\n`record.py` discovers the `Noise Scale` socket identifier at runtime via `items_tree`, then inserts three keyframes (1→1.0, 60→10.0, 120→1.0) and calls `bpy.ops.render.opengl(animation=True)` to write 120 frames of rendered viewport to:\n`public/library/videos/geometry-nodes/gn-socket-panels-interface-collapsible-modifier-ui/viewport.mp4`\n\nThen follow `SCREEN-RECORDING-NOTES.md` to capture the screen recording.",
    },
  ],
  finalResult:
    "A `HF_PoiEnergyRibbon` Geometry Nodes modifier with ten group inputs organised into three collapsible panels (Curve Shape open, Noise Displacement open, Ribbon closed). The modifier is applied to a 3-loop helix POLY curve, producing a noise-displaced 8-sided tube mesh with an EEVEE Next emission material. The socket identifier lookup in record.py demonstrates the runtime-safe pattern for keyframing panelled modifier inputs.",
  variations: [
    "Add a fourth panel 'Export' with a Boolean 'Draco Compress' and an Object 'Target Collection' socket. Set it `default_closed=True`. Use these sockets in a post-processing subgraph that conditionally applies a Decimate node before output. The panel keeps export options out of the main artist workflow without hiding them entirely.",
    "Iterate ng.interface.items_tree and print each PANEL item's child count by filtering the flat list between consecutive panel items. This lets you programmatically audit any GN modifier in the scene for parameter count per panel — useful for validating that production assets meet a layout spec (e.g. no panel may exceed eight sockets).",
    "Add a 'Material' NodeSocketMaterial socket inside the Ribbon panel: `iface.new_socket('Ribbon Material', in_out='INPUT', socket_type='NodeSocketMaterial', parent=p_ribbon)`. Wire it into the Set Material node. Now artists can swap the emission colour directly from the modifier panel without entering the node group.",
    "Create a second panel 'Debug' (default_closed=True) with a Boolean 'Show Wireframe' socket. Wire it through a Merge by Distance node whose Merge Distance is controlled by a Math MULTIPLY: `Noise Strength × (1 − Show Wireframe)`. When Show Wireframe=True, merge distance collapses to 0 and the tube topology becomes visible as a faceted cage.",
  ],
  troubleshooting: [
    {
      symptom: "new_panel() raises AttributeError — 'NodeTreeInterface' has no attribute 'new_panel'",
      cause:
        "Running on Blender 4.x. The `new_panel()` method was added in Blender 5.0. In 4.x, NodeTreeInterface exists but panels do not.",
      fix: "Check version at runtime: `import bpy; major, minor = bpy.app.version[:2]; has_panels = (major, minor) >= (5, 0)`. In 4.x, skip the `new_panel()` call and fall back to a flat interface. The `parent=` kwarg is silently ignored on 4.x if you leave it in.",
    },
    {
      symptom: "Panel appears but all sockets are outside it — not grouped",
      cause:
        "Sockets were added to the interface before the panel was created, so they have no parent. The `parent=` kwarg must be passed at creation time.",
      fix: "Check the declaration order in _make_gn_tree(). The panel must be created with `new_panel()` before any `new_socket()` call that references it. Alternatively, move existing sockets into a panel after the fact using `interface.move_to_parent(socket_item, panel_item, to_position=0)`.",
    },
    {
      symptom: "Modifier panel shows no panels — flat list of sockets",
      cause:
        "The modifier was applied before the panels were added to the interface, and Blender cached the flat layout.",
      fix: "Remove the modifier with `ob.modifiers.remove(mod)` and re-apply with `_apply(ob, ng)`. Alternatively, toggle the modifier off and on to force a UI refresh.",
    },
    {
      symptom: "VectorMath SCALE produces zero offset — ribbon unaffected by noise",
      cause:
        "The noise float was linked to `n_vsc.inputs[1]` (a hidden Vector input) instead of `n_vsc.inputs[3]` (the actual Scale float input for the SCALE operation).",
      fix: "In the Python console: `print([i.name for i in ng.nodes['Vector Math'].inputs])`. The output should be `['Vector', 'Vector', 'Vector', 'Scale']`. The SCALE float is always index 3. Correct the link: `links.new(n_mul.outputs['Value'], n_vsc.inputs[3])`.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender 5.0 Release Notes — Geometry Nodes: Socket Panels — CC0 — Blender Foundation",
      href: "https://www.blender.org/download/releases/5-0/",
    },
    {
      label:
        "Blender Python API — bpy.types.NodeTreeInterface — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.NodeTreeInterface.html",
    },
    {
      label:
        "Blender Projects — NodeTreeInterface panel implementation — CC0 — Blender Foundation",
      href: "https://projects.blender.org/blender/blender",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Tree API — Building a Geometry Nodes Modifier Tree from Python",
      href: "/tutorials/blender-tutorial-python-bpy-geonodes-tree-api",
    },
    {
      label:
        "Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon Prop for WebXR",
      href: "/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr",
    },
    {
      label:
        "Distribute Points & Instance on Points — Poisson-Disk Crystal Garden Scatter for WebXR",
      href: "/tutorials/blender-tutorial-gn-distribute-points-instance-on-points-scatter-webxr",
    },
    {
      label:
        "FCurve Keyframe Insertion — NLA Strip Sequencing & Poi Performance Animated GLB",
      href: "/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
    },
    {
      label:
        "Repeat Zone — Crystal Antenna Procedural Growth for WebXR",
      href: "/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-socket-panels-interface-collapsible-modifier-ui",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "scripting",
      "modifier",
      "procedural",
      "webxr",
    ],
    body: Body,
  },
  data,
);
