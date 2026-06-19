import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnGizmoNodesArchBody() {
  return (
    <>
      <p>
        Gizmo nodes, introduced in Blender 5.0, replace the habit of keeping
        the N panel open whilst adjusting a Geometry Nodes modifier. Instead of
        typing into a number field, you drag a coloured arrow that sits directly
        on the geometry surface. The handle knows where the arch shoulder is
        because its <code>Position</code> input is driven by the same{" "}
        <code>Width</code> parameter it controls — so as the arch widens, the
        handle slides outward in lockstep. This &ldquo;self-referential
        position&rdquo; is the gizmo pattern that makes direct manipulation feel
        correct rather than approximate. Compare the sidebar-only approach used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui"
          className={lk}
        >
          Socket Groups parametric crystal tutorial
        </Link>{" "}
        — panels and disclosure triangles organise many sockets well, but they
        still require eyes-off-viewport attention. Gizmos keep the designer
        looking at the geometry throughout.
      </p>

      <p>
        The wiring pattern is a Y-split, not a chain. The Group Input{" "}
        <code>Width</code> socket fans out to two destinations simultaneously:
        the geometry subgraph (where it scales the arch spine) and the Linear
        Gizmo&apos;s <code>Value</code> input. The Gizmo node does not produce
        or transform geometry — its sole output is a <code>NodeSocketGizmo</code>{" "}
        datum that routes to the Group Output&apos;s <code>Gizmos</code> socket.
        When the artist drags the handle, Blender writes back to the modifier
        property that feeds the Group Input, closing the loop. The geometry
        graph never &ldquo;knows&rdquo; a gizmo exists; it just sees an updated
        float. This clean separation means you can add gizmos to any existing
        node group without restructuring it — wire the existing input socket to
        a gizmo and connect the gizmo output to Group Output. That is the entire
        integration cost. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit"
          className={lk}
        >
          Menu Switch tile kit
        </Link>
        , which tackles the orthogonal problem of labelled enum inputs — both
        techniques belong in any production GN modifier that non-technical
        collaborators will use.
      </p>

      <p>
        This blueprint builds a Roman arch (semicircular voussoir ring plus two
        square pillars) from a <code>MeshLine</code> scaffold reshaped by
        per-vertex trigonometry:{" "}
        <code>x&nbsp;=&nbsp;cos(i&nbsp;/&nbsp;N&nbsp;·&nbsp;π)&nbsp;·&nbsp;Width/2</code>,{" "}
        <code>z&nbsp;=&nbsp;sin(i&nbsp;/&nbsp;N&nbsp;·&nbsp;π)&nbsp;·&nbsp;Height</code>.
        This approach deliberately avoids the Arc node (whose radius ties Width
        and Height together) and the CurvePrimitiveLine-then-rotate pattern
        (which needs an extra transform node). By using{" "}
        <code>GeometryNodeInputIndex</code> as the per-vertex integer, then
        dividing by the segment count to get <em>t</em>&nbsp;∈&nbsp;[0,&nbsp;1],
        the arch shape is driven entirely by Group Inputs with no intermediate
        baked values — exactly the state the gizmos need to modify
        interactively. An alternative approach for production tools is described
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          Python add-on Custom Panel tutorial
        </Link>
        : PropertyGroups expose similar parametric controls via the Python UI
        class system, which is appropriate for tools that must work across
        multiple objects or scenes.
      </p>

      <p>
        <strong>Outside sources:</strong>{" "}
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/5.0/Nodes_and_Physics"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender 5.0 Release Notes — Geometry Nodes: Gizmos
        </a>{" "}
        (CC-BY-SA 4.0, Blender Wiki contributors) — the canonical announcement
        of the gizmo node family, covering the Linear, Dial, and Transform
        variants; related projects include the Blender main repository at
        projects.blender.org and the developer design docs at developer.blender.org.{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.GeometryNodeGizmoLinear.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Python API — GeometryNodeGizmoLinear
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) — lists exact socket names,
        Direction default, and the NodeSocketGizmo type; the related API page
        for <code>NodeSocketGizmo</code> describes the multi-input chaining
        behaviour on Group Output.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-gizmo-nodes-interactive-viewport-controls",
  title:
    "GN Gizmo Nodes — Parametric Roman Arch with Interactive Viewport Handles (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Wire Linear Gizmo nodes to Width and Height inputs so you can drag the arch to the right proportions directly in the 3D viewport. Covers the Y-split wiring pattern, self-referential handle positions, the NodeSocketGizmo multi-input socket on Group Output, and the per-vertex cos/sin MeshLine scaffold that gives fully independent Width and Height control.",
  Body: GnGizmoNodesArchBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed — Gizmo nodes require Blender 5.0 or later.",
      "Familiarity with the Geometry Nodes editor: adding nodes, creating sockets, wiring links. The Socket Groups parametric crystal tutorial is a helpful precursor.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodeGizmoLinear and the NodeSocketGizmo Group Output socket were introduced in Blender 5.0. No extensions or add-ons required — gizmo nodes ship with the core.",
      },
    ],
    steps: [
      {
        title: "Understand the Y-split wiring pattern",
        body:
          "# The gizmo does NOT sit between Group Input and the geometry graph.\n# It sits in parallel — a Y-split from the same socket.\n#\n#   Group Input \"Width\" ──┬── geometry subgraph (scale arch)\n#                         └── Gizmo node \"Value\" ──→ Group Output \"Gizmos\"\n#\n# When the artist drags the handle, Blender writes back to the modifier\n# property that feeds Group Input.  The geometry graph sees a changed float.\n# The gizmo is purely a UI overlay — it never touches geometry data.\n#\n# Implication: you can retrofit a gizmo to any existing GN group by\n# fanning out from the socket you want to expose, connecting to a new\n# gizmo node, and routing the gizmo output to Group Output.  Zero\n# restructuring of existing geometry nodes required.",
      },
      {
        title: "Add the NodeSocketGizmo output socket",
        body:
          'import bpy\n\nnt    = bpy.data.node_groups["GN_RomanArch"]\niface = nt.interface\n\n# The Gizmos output socket must be created before gizmo nodes can connect.\n# NodeSocketGizmo is the dedicated type in Blender 5.0+.\n# VERIFY in the Script Console: bpy.types.NodeSocketGizmo\niface.new_socket("Gizmos", in_out="OUTPUT", socket_type="NodeSocketGizmo")\n\n# Confirm the Group Output node gained the socket:\ngo = next(n for n in nt.nodes if n.type == "GROUP_OUTPUT")\nprint([s.name for s in go.inputs])  # "Geometry", "Gizmos"',
      },
      {
        title: "Add the arch spine: MeshLine + InputIndex math",
        body:
          '# MeshLine places SEGMENTS+1 vertices at the origin (offset=(0,0,0)).\n# InputIndex gives each vertex its integer slot i ∈ [0, SEGMENTS].\n# t = i / SEGMENTS → t ∈ [0, 1] across the arch.\n# Angle = t * π  → sweeps from 0 (right foot) to π (left foot).\n# x = cos(angle) * Width/2\n# z = sin(angle) * Height\n# SetPosition reshapes the line to the arch curve.\n# MeshToCurve converts so CurveToMesh can sweep the profile.\n\nimport bpy, math\n\nnt    = bpy.data.node_groups["GN_RomanArch"]\nN     = nt.nodes\nL     = nt.links\n\nSEGMENTS = 32\n\n# Scaffold\nmline = N.new("GeometryNodeMeshLine")\nmline.mode = "OFFSET"\nmline.count_mode = "TOTAL"\nmline.inputs["Count"].default_value  = SEGMENTS + 1\nmline.inputs["Offset"].default_value = (0.0, 0.0, 0.0)\n\ngi = next(n for n in N if n.type == "GROUP_INPUT")\n\n# Per-vertex index\nidx = N.new("GeometryNodeInputIndex")\n\n# t = index / SEGMENTS\nm_t = N.new("ShaderNodeMath")\nm_t.operation = "DIVIDE"\nm_t.inputs[1].default_value = float(SEGMENTS)\nL.new(idx.outputs["Index"], m_t.inputs[0])\n\n# angle = t * pi\nm_ang = N.new("ShaderNodeMath")\nm_ang.operation = "MULTIPLY"\nm_ang.inputs[1].default_value = math.pi\nL.new(m_t.outputs[0], m_ang.inputs[0])\n\nm_cos = N.new("ShaderNodeMath"); m_cos.operation = "COSINE"\nm_sin = N.new("ShaderNodeMath"); m_sin.operation = "SINE"\nL.new(m_ang.outputs[0], m_cos.inputs[0])\nL.new(m_ang.outputs[0], m_sin.inputs[0])\n\nm_hw = N.new("ShaderNodeMath")   # half_width\nm_hw.operation = "MULTIPLY"; m_hw.inputs[1].default_value = 0.5\nL.new(gi.outputs["Width"], m_hw.inputs[0])\n\nm_x = N.new("ShaderNodeMath"); m_x.operation = "MULTIPLY"\nm_z = N.new("ShaderNodeMath"); m_z.operation = "MULTIPLY"\nL.new(m_cos.outputs[0], m_x.inputs[0]); L.new(m_hw.outputs[0],  m_x.inputs[1])\nL.new(m_sin.outputs[0], m_z.inputs[0]); L.new(gi.outputs["Height"], m_z.inputs[1])\n\ncxyz = N.new("ShaderNodeCombineXYZ"); cxyz.inputs["Y"].default_value = 0.0\nL.new(m_x.outputs[0], cxyz.inputs["X"])\nL.new(m_z.outputs[0], cxyz.inputs["Z"])\n\nsetp = N.new("GeometryNodeSetPosition")\nL.new(mline.outputs["Mesh"],  setp.inputs["Geometry"])\nL.new(cxyz.outputs["Vector"], setp.inputs["Position"])\n\nm2c = N.new("GeometryNodeMeshToCurve")\nL.new(setp.outputs["Geometry"], m2c.inputs["Mesh"])',
      },
      {
        title: "Sweep the profile and add pillars",
        body:
          '# Profile: octagonal circle (8 edges) of radius Thickness/2.\n# CurveToMesh sweeps it along the arch spine → voussoir ring.\n# Fill Caps=True closes the two open ends of the half-torus.\n# Two pillar cubes are positioned at (±Width/2, 0, PillarH/2).\n\nm_th2 = N.new("ShaderNodeMath")\nm_th2.operation = "MULTIPLY"; m_th2.inputs[1].default_value = 0.5\nL.new(gi.outputs["Thickness"], m_th2.inputs[0])\n\nprof = N.new("GeometryNodeCurvePrimitiveCircle")\nprof.mode = "RADIUS"\nprof.inputs["Resolution"].default_value = 8\nL.new(m_th2.outputs[0], prof.inputs["Radius"])\n\nc2m = N.new("GeometryNodeCurveToMesh")\nc2m.inputs["Fill Caps"].default_value = True\nL.new(m2c.outputs["Curve"],  c2m.inputs["Curve"])\nL.new(prof.outputs["Curve"], c2m.inputs["Profile Curve"])\n\n# Pillar factory — one cube per side:\ndef make_pillar(N, L, gi, m_hw, m_ph2, x_sign, label):\n    cube = N.new("GeometryNodeMeshCube"); cube.label = label\n    sz   = N.new("ShaderNodeCombineXYZ")\n    L.new(gi.outputs["Thickness"], sz.inputs["X"])\n    L.new(gi.outputs["Depth"],     sz.inputs["Y"])\n    L.new(gi.outputs["PillarH"],   sz.inputs["Z"])\n    L.new(sz.outputs["Vector"], cube.inputs["Size"])\n\n    m_ph2 = N.new("ShaderNodeMath")   # PillarH/2\n    m_ph2.operation = "MULTIPLY"; m_ph2.inputs[1].default_value = 0.5\n    L.new(gi.outputs["PillarH"], m_ph2.inputs[0])\n\n    m_px = N.new("ShaderNodeMath"); m_px.operation = "MULTIPLY"\n    m_px.inputs[1].default_value = x_sign\n    L.new(m_hw.outputs[0], m_px.inputs[0])\n\n    pos = N.new("ShaderNodeCombineXYZ")\n    L.new(m_px.outputs[0],  pos.inputs["X"])\n    L.new(m_ph2.outputs[0], pos.inputs["Z"])\n\n    txfm = N.new("GeometryNodeTransform")\n    L.new(cube.outputs["Mesh"],   txfm.inputs["Geometry"])\n    L.new(pos.outputs["Vector"],  txfm.inputs["Translation"])\n    return txfm\n\nm_ph2 = N.new("ShaderNodeMath"); m_ph2.operation = "MULTIPLY"\nm_ph2.inputs[1].default_value = 0.5\nL.new(gi.outputs["PillarH"], m_ph2.inputs[0])\n\nr_pil = make_pillar(N, L, gi, m_hw, m_ph2, +1.0, "right_pillar")\nl_pil = make_pillar(N, L, gi, m_hw, m_ph2, -1.0, "left_pillar")\n\njg = N.new("GeometryNodeJoinGeometry")\nL.new(c2m.outputs["Mesh"],          jg.inputs["Geometry"])\nL.new(r_pil.outputs["Geometry"],    jg.inputs["Geometry"])\nL.new(l_pil.outputs["Geometry"],    jg.inputs["Geometry"])\n\ngo = next(n for n in N if n.type == "GROUP_OUTPUT")\nL.new(jg.outputs["Geometry"], go.inputs["Geometry"])',
      },
      {
        title: "Add the Width Linear Gizmo",
        body:
          '# The gizmo position is self-referential: it reads Width and Height\n# to position the handle at the arch\'s shoulder as those values change.\n# Width/2 + GZ_OFFSET puts the arrow just outside the arch ring.\n# Height/2 centres it vertically on the arch leg — a natural drag axis.\n\nGZ_OFFSET = 0.5   # metres clearance from arch ring surface\n\n# Position x = Width/2 + offset\ngz_wx = N.new("ShaderNodeMath")\ngz_wx.operation = "ADD"; gz_wx.inputs[1].default_value = GZ_OFFSET\nL.new(m_hw.outputs[0], gz_wx.inputs[0])     # m_hw = half_width, built above\n\n# Position z = Height/2\ngz_wz = N.new("ShaderNodeMath")\ngz_wz.operation = "MULTIPLY"; gz_wz.inputs[1].default_value = 0.5\nL.new(gi.outputs["Height"], gz_wz.inputs[0])\n\ngz_w_pos = N.new("ShaderNodeCombineXYZ")\nL.new(gz_wx.outputs[0], gz_w_pos.inputs["X"])\nL.new(gz_wz.outputs[0], gz_w_pos.inputs["Z"])\n\n# GeometryNodeGizmoLinear — new in Blender 5.0\n# VERIFY: run `bpy.types.GeometryNodeGizmoLinear` in the Python console.\ngz_w = N.new("GeometryNodeGizmoLinear")\ngz_w.label = "width_gizmo"\ngz_w.inputs["Direction"].default_value = (1.0, 0.0, 0.0)   # X axis\nL.new(gi.outputs["Width"],        gz_w.inputs["Value"])\nL.new(gz_w_pos.outputs["Vector"], gz_w.inputs["Position"])\n\n# Route gizmo output to Group Output\'s Gizmos socket\nL.new(gz_w.outputs["Gizmo"], go.inputs["Gizmos"])\nprint("Width gizmo wired.")',
      },
      {
        title: "Add the Height Linear Gizmo",
        body:
          '# Height gizmo sits directly above the crown (x=0, z=Height + offset).\n# Direction Z → dragging upward increases Height.\n\ngz_hz = N.new("ShaderNodeMath")\ngz_hz.operation = "ADD"; gz_hz.inputs[1].default_value = GZ_OFFSET\nL.new(gi.outputs["Height"], gz_hz.inputs[0])\n\ngz_h_pos = N.new("ShaderNodeCombineXYZ")\ngz_h_pos.inputs["X"].default_value = 0.0\ngz_h_pos.inputs["Y"].default_value = 0.0\nL.new(gz_hz.outputs[0], gz_h_pos.inputs["Z"])\n\ngz_h = N.new("GeometryNodeGizmoLinear")\ngz_h.label = "height_gizmo"\ngz_h.inputs["Direction"].default_value = (0.0, 0.0, 1.0)   # Z axis\nL.new(gi.outputs["Height"],       gz_h.inputs["Value"])\nL.new(gz_h_pos.outputs["Vector"], gz_h.inputs["Position"])\n\n# Both gizmos connect to the SAME "Gizmos" socket — it is multi-input\n# in Blender 5.1, analogous to Join Geometry.\n# If this errors: insert a GeometryNodeJoinGizmos node.\nL.new(gz_h.outputs["Gizmo"], go.inputs["Gizmos"])\nprint("Height gizmo wired.  Both gizmos active — select RomanArch to see handles.")',
      },
      {
        title: "Test the gizmos in the viewport",
        body:
          "# 1. Select the RomanArch object in the 3D Viewport.\n# 2. The two arrow handles appear: horizontal at the right shoulder,\n#    vertical above the crown.\n# 3. Hover over the horizontal arrow — cursor changes to a translate icon.\n#    Click-drag right → arch widens.  Arrow tracks the shoulder outward.\n# 4. Hover over the vertical arrow.  Click-drag upward → arch rises.\n#    Arrow moves upward with the crown in real time.\n# 5. Open the N panel (press N) — Width and Height sliders move in sync.\n#    This confirms bidirectional binding: dragging the handle writes back\n#    to the modifier property, which is the same source the sidebar reads.\n#\n# Troubleshooting:\n# • Handles invisible → ensure Object Properties overlay is ON in the\n#   viewport header (the two circle icon).\n# • 'NodeSocketGizmo' AttributeError → you are on Blender < 5.0;\n#   update to 5.1.\n# • 'GeometryNodeGizmoLinear' KeyError → confirm exact type identifier\n#   by running: [t for t in dir(bpy.types) if 'Gizmo' in t]",
      },
      {
        title: "Export arch as GLB",
        body:
          'import bpy\n\n# Apply current GN output (Width=4, Height=2.5 defaults) to a mesh.\n# This bakes the parametric shape for glTF export.\nbpy.ops.object.select_all(action="DESELECT")\narch = bpy.data.objects["RomanArch"]\narch.select_set(True)\nbpy.context.view_layer.objects.active = arch\n\nbpy.ops.object.duplicate()\nbaked = bpy.context.active_object\nbaked.name = "roman_arch_baked"\n\nwith bpy.context.temp_override(active_object=baked):\n    bpy.ops.object.modifier_apply(modifier="GN_RomanArch")\n\nbpy.ops.object.transform_apply(location=True, rotation=True, scale=True)\n\nbpy.ops.export_scene.gltf(\n    filepath="//roman_arch_gizmos.glb",\n    use_selection=True,\n    export_format="GLB",\n    export_apply=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format="WEBP",\n    export_yup=True,\n)\nprint("roman_arch_gizmos.glb exported.")',
      },
    ],
  },
  base,
);
