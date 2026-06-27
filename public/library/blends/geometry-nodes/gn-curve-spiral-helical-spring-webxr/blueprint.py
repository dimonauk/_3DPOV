"""
GN Curve Spiral — Parametric Helical Spring: Compression, Volute & Tension Variants (Blender 5.1)
CC0 · Holoflow Studio

Technique: GeometryNodeCurveSpiral generates a helix directly inside Geometry Nodes
from six parameters — Rotations, Start Radius, End Radius, Height, Resolution, and
Reverse. Piped through CurveToMesh with a circle cross-section it becomes a solid
spring wire in three to five nodes, no Screw modifier and no Bezier curve editing
required.

Three spring archetypes share the same tree, differing only in parameter values:
  Compression spring  — Start Radius == End Radius; Height == natural length
  Volute/conical      — Start Radius != End Radius; base wide, apex narrow
  Tension spring      — same as compression but Height stretched by TENSION_FACTOR

Handedness (Reverse flag): False → right-hand helix (conventional engineering spring);
True → left-hand. Physical simulations (Bullet, Havok) compute different torsional
coupling for each chirality when torque constraints are applied; VRM spring bones are
chirality-agnostic.

Resolution trade-off: control-point count per rotation (SPRING_RESOLUTION) sets the
polygon density around the helix axis, not around the wire cross-section. 8 is jagged,
16 is good for thumbnails, 32 gives smooth curves above 45° view angle in WebXR, 64
adds ~2× vertex count with diminishing visual return.

Outside sources:
  Blender Manual — Spiral Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/primitives/spiral.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Wikipedia — Helix
    https://en.wikipedia.org/wiki/Helix
    CC-BY-SA 3.0 · Wikipedia contributors (cites Cauchy, PD)
  Three.js CatmullRomCurve3 (WebXR helix approximation)
    https://github.com/mrdoob/three.js/blob/dev/src/extras/curves/CatmullRomCurve3.js
    MIT · Ricardo Cabello (mrdoob) + three.js contributors
"""

import bpy
import bmesh
import math
import os

# ── Parameters ─────────────────────────────────────────────────────────────────
SPRING_ROTATIONS  = 8.0    # total coil count; float allows partial final turn
SPRING_START_R    = 1.0    # helix radius at bottom (m); change for conical spring
SPRING_END_R      = 1.0    # helix radius at top (m); != START_R → volute taper
SPRING_HEIGHT     = 4.0    # total Z span of spring (m)
SPRING_RESOLUTION = 32     # control points per full rotation; 32 → smooth at 45° view
SPRING_REVERSE    = False  # False = right-hand (conventional); True = left-hand
WIRE_RADIUS       = 0.12   # cross-section circle radius (wire gauge, m)
WIRE_SEGMENTS     = 12     # cross-section polygon sides; 12 looks round in WebXR
SPRING_COL        = (0.72, 0.74, 0.76, 1.0)  # brushed steel (linear RGBA)
SPRING_METALLIC   = 0.92
SPRING_ROUGHNESS  = 0.22
OBJ_NAME          = "Spring_Host"
NG_NAME           = "GN_HelicalSpring"
MA_NAME           = "Spring_BrushedSteel"
BLEND_OUT         = "//spring_coil.blend"
GLB_OUT           = "//spring_coil.glb"


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("Spring_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("Spring_"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("GN_Helical"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("Spring_"):
            bpy.data.materials.remove(ma)


def _build_gn_tree() -> bpy.types.NodeTree:
    """
    Node graph (left → right):
      CurveSpiral ──────────────────────────────────┐
                                                     ├─ CurveToMesh ─ SetShadeSmooth ─ GroupOutput
      CurvePrimitiveCircle (profile) ───────────────┘
    """
    ng = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    def n(t, x, y):
        nd = ng.nodes.new(t)
        nd.location = (x, y)
        return nd

    def lk(src, dst):
        ng.links.new(src, dst)

    # ── Helix path ─────────────────────────────────────────────────────────────
    sprl = n("GeometryNodeCurveSpiral", -400, 100)
    # Resolution = control points per rotation (32 × 8 rotations = 256 total points)
    sprl.inputs["Resolution"].default_value    = SPRING_RESOLUTION
    sprl.inputs["Rotations"].default_value     = SPRING_ROTATIONS
    sprl.inputs["Start Radius"].default_value  = SPRING_START_R
    sprl.inputs["End Radius"].default_value    = SPRING_END_R
    sprl.inputs["Height"].default_value        = SPRING_HEIGHT
    sprl.inputs["Reverse"].default_value       = SPRING_REVERSE

    # ── Wire cross-section circle ───────────────────────────────────────────────
    circ = n("GeometryNodeCurvePrimitiveCircle", -400, -150)
    # RADIUS mode: uniform circle; set Resolution and Radius inputs
    circ.mode = 'RADIUS'
    circ.inputs["Resolution"].default_value = WIRE_SEGMENTS
    circ.inputs["Radius"].default_value     = WIRE_RADIUS

    # ── Extrude circle along helix ──────────────────────────────────────────────
    ctm = n("GeometryNodeCurveToMesh", -100, 0)
    # Fill Caps = True adds flat disk faces at each wire end; prevents open tube ends
    ctm.inputs["Fill Caps"].default_value = True

    # ── Smooth shading: round wire, not faceted ─────────────────────────────────
    smt = n("GeometryNodeSetShadeSmooth", 150, 0)
    smt.domain = 'FACE'
    smt.inputs["Shade Smooth"].default_value = True

    # ── Output ──────────────────────────────────────────────────────────────────
    out = n("NodeGroupOutput", 380, 0)

    lk(sprl.outputs["Curve"],         ctm.inputs["Curve"])
    lk(circ.outputs["Curve"],         ctm.inputs["Profile Curve"])
    lk(ctm.outputs["Mesh"],           smt.inputs["Geometry"])
    lk(smt.outputs["Geometry"],       out.inputs["Geometry"])

    return ng


def _make_material() -> bpy.types.Material:
    """Principled BSDF brushed steel; metallic + anisotropy gives wire-drawn look."""
    ma = bpy.data.materials.new(MA_NAME)
    ma.use_nodes = True
    nt = ma.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out.location  = (300, 0)
    bsdf.location = (0, 0)

    bsdf.inputs["Base Color"].default_value  = SPRING_COL
    bsdf.inputs["Metallic"].default_value    = SPRING_METALLIC
    bsdf.inputs["Roughness"].default_value   = SPRING_ROUGHNESS
    # Anisotropy along the wire direction gives a drawn-steel micro-groove look
    bsdf.inputs["Anisotropic"].default_value = 0.45

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return ma


def _build_host() -> bpy.types.Object:
    """Single-vertex mesh; the GN modifier replaces all geometry at evaluation time."""
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    bm.verts.new((0.0, 0.0, 0.0))
    bm.to_mesh(me)
    bm.free()
    me.update()
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    return ob


def _add_modifier(ob: bpy.types.Object,
                  ng: bpy.types.NodeTree,
                  ma: bpy.types.Material) -> None:
    """Attach GN modifier, then assign the material so CurveToMesh inherits it."""
    mod = ob.modifiers.new("GN_Spring", "NODES")
    mod.node_group = ng
    ob.data.materials.append(ma)


def _export_glb(ob: bpy.types.Object) -> None:
    bpy.context.scene.frame_set(1)

    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))

    # apply=True forces modifier evaluation; required for GN output in GLB
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[blueprint] GLB written → {GLB_OUT}")


def main() -> None:
    _cleanup()
    ng = _build_gn_tree()
    ma = _make_material()
    ob = _build_host()
    _add_modifier(ob, ng, ma)
    _export_glb(ob)
    print("[blueprint] done — spring_coil.blend + spring_coil.glb")


if __name__ == "__main__":
    main()
