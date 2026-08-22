"""
GN Foreach Element Zone on Curves — Per-Spline Ribbon Builder
Blender 5.1  ·  Holoflow Studio

Technique:
  The Foreach Element Zone (added in Blender 4.3, stable in 5.1) can iterate over
  *splines* in a multi-spline Curves object — one loop iteration per spline.
  Inside the zone each iteration sees a single-spline Curves sub-object, so every
  node that queries geometry (Spline Length, Curve to Mesh, etc.) operates on that
  one strand in isolation. Results are accumulated (joined) into a single Geometry
  output after all iterations complete.

  This tutorial builds the GN node tree programmatically via bpy so every link,
  default value, and socket panel is spelled out explicitly — the intention is to
  teach the Python GN API alongside the Foreach Zone concept.

  Studio application: 8 helical poi light-painting strands, each resampled to
  uniform spacing, converted to a ribbon mesh whose width is proportional to the
  strand's arc length and whose emission colour is keyed from the strand index.
  Export as Draco-6 GLB for WebXR bloom display.

Artefacts produced:
  hf_poi_ribbons.blend  — Blender scene with modifier setup + 8 emission materials
  hf_poi_ribbons.glb    — Draco-6 GLB for WebXR (8 distinct ribbon meshes joined)

Run:  blender --background --python blueprint.py
  or: paste into Blender Text Editor → Run Script
"""

import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────

SLUG         = "gn-foreach-element-zone-curve-per-spline-accumulation-poi-ribbon-webxr"
N_STRANDS    = 8        # number of helical strands; each becomes one spline
HELIX_TURNS  = 3.0      # full rotations in the helix
HELIX_HEIGHT = 4.0      # total height (m) per strand
HELIX_RADIUS = 1.2      # horizontal radius (m) per strand
CP_PER       = 48       # bezier control points per spline (Blender auto-handles)
RESAMPLE_CT  = 96       # uniform resample count inside GN
BASE_RADIUS  = 0.04     # ribbon half-width at arc-length = 0 (m)
RADIUS_SCALE = 0.010    # extra radius per metre of arc length
EXPORT_GLB   = True
OUT_BLEND    = f"//hf_poi_ribbons.blend"
OUT_GLB      = f"//hf_poi_ribbons.glb"
DRACO_LEVEL  = 6        # Draco mesh compression (0-10)

# Emission colours per strand — warm-to-cool spectrum for light-painting clarity
STRAND_COLOURS = [
    (1.0, 0.25, 0.05, 1.0),   # red-orange
    (1.0, 0.55, 0.05, 1.0),   # amber
    (0.9, 0.90, 0.05, 1.0),   # yellow
    (0.2, 0.95, 0.15, 1.0),   # green
    (0.05, 0.80, 0.90, 1.0),  # cyan
    (0.05, 0.30, 1.00, 1.0),  # blue
    (0.50, 0.05, 1.00, 1.0),  # violet
    (1.00, 0.05, 0.60, 1.0),  # hot pink
]

# ── Scene setup ───────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.curves) + \
                 list(bpy.data.node_groups) + list(bpy.data.materials):
        bpy.data.batch_remove([block])


# ── Build multi-strand Curves object ─────────────────────────────────────────

def build_helix_curve(strand_idx: int) -> tuple[list[Vector], list[float]]:
    """
    Return (co_list, handle_offsets) for one helical strand.

    Each strand is a left-handed helix whose horizontal radius, height-offset
    and angular phase vary with strand_idx.  Varying radius and phase produces
    a bundle of non-intersecting strands that collectively trace the volume a
    poi reaches during a sustained spiral performance.
    """
    phase   = strand_idx * (2 * math.pi / N_STRANDS)
    r_local = HELIX_RADIUS * (0.6 + 0.4 * (strand_idx / max(N_STRANDS - 1, 1)))
    h_off   = strand_idx * 0.15   # slight vertical spread so strands don't overlap

    cos_list: list[Vector] = []
    for i in range(CP_PER):
        t   = i / (CP_PER - 1)             # 0 → 1
        ang = phase + t * HELIX_TURNS * 2 * math.pi
        x   = r_local * math.cos(ang)
        y   = r_local * math.sin(ang)
        z   = h_off + t * HELIX_HEIGHT - HELIX_HEIGHT / 2
        cos_list.append(Vector((x, y, z)))

    return cos_list


def build_curves_object() -> bpy.types.Object:
    """
    Create a Curves object with N_STRANDS splines using the data API.

    Blender 5.1 "Curves" (bpy.types.Curves, not the older CurveData) uses the
    attribute-domain API: curves.points and curves.curves for fine-grained
    access.  We use bpy.ops.curves.new() to initialise, then populate via the
    attribute API.
    """
    # Create via operator — gives us a properly initialised Curves data block.
    # WHY operator rather than bpy.data.curves.new():  bpy.data.curves.new()
    # creates the legacy SplineCurve type.  The new Curves type is created by
    # the operator or by  bpy.data.hair_curves.new() (which also works for
    # non-hair curves in 5.x, despite the name).
    curves_data = bpy.data.curves.new("hf_poi_strands", "CURVE")
    curves_data.dimensions = "3D"
    curves_data.resolution_u = 12

    obj = bpy.data.objects.new("hf_poi_strands", curves_data)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    # Populate splines — one per strand
    for s_idx in range(N_STRANDS):
        positions = build_helix_curve(s_idx)

        if s_idx == 0:
            spline = curves_data.splines.new("POLY")
            spline.points.add(len(positions) - 1)
        else:
            spline = curves_data.splines.new("POLY")
            spline.points.add(len(positions) - 1)

        for p_idx, co in enumerate(positions):
            spline.points[p_idx].co = (co.x, co.y, co.z, 1.0)

    return obj


# ── Emission materials ────────────────────────────────────────────────────────

def build_emission_materials() -> list[bpy.types.Material]:
    """
    One Emission-only material per strand.  The emission strength is uniform
    (glow in EEVEE, light contribution in Cycles).  Material index 0-7 maps
    to STRAND_COLOURS[0-7] — the GN modifier assigns material indices per spline.

    WHY Emission?  Poi light-painting photography captures emissive light
    trails against a dark background; Principled BSDF's base colour would be
    invisible in a real exposure or in a dark WebXR scene without HDR lighting.
    """
    mats = []
    for idx, rgba in enumerate(STRAND_COLOURS):
        mat = bpy.data.materials.new(f"hf_strand_{idx:02d}")
        mat.use_nodes = True
        tree = mat.node_tree
        tree.nodes.clear()

        out  = tree.nodes.new("ShaderNodeOutputMaterial")
        emit = tree.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value      = rgba
        emit.inputs["Strength"].default_value   = 3.0   # HDR for EEVEE bloom

        tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        mats.append(mat)

    return mats


# ── Geometry Nodes modifier ───────────────────────────────────────────────────

def _new_node(nodes, bl_idname: str, **defaults) -> bpy.types.Node:
    """Create a node and optionally set default input values."""
    n = nodes.new(bl_idname)
    for socket_name, val in defaults.items():
        if socket_name in n.inputs:
            n.inputs[socket_name].default_value = val
    return n


def build_gn_modifier(obj: bpy.types.Object, mats: list[bpy.types.Material]) -> None:
    """
    Programmatically build the Geometry Nodes modifier.

    Graph summary (reading left → right):
      GroupInput → ForeachIn ──┐ inside zone:
                               ├── SplineLength
                               ├── Index → Math(MULTIPLY_ADD) → CurveCircle
                               ├── ResampleCurve → CurveToMesh
                               └── SetMaterial ──→ ForeachOut → GroupOutput

    The Foreach Element Zone with domain=SPLINE iterates once per spline.
    Inside the zone the 'Element Geometry' socket delivers a Curves object
    containing exactly ONE spline — so all nodes inside see a single strand.

    Key constraints:
      • Nodes inside the zone must operate on 'Element Geometry', not 'Main Geometry'.
      • SplineLength inside the zone returns the length of the single current spline.
      • Material is applied per iteration so each ribbon segment gets its strand colour.
    """
    ng = bpy.data.node_groups.new("HF_ForeachSplineRibbon", "GeometryNodeTree")

    # Modifier interface sockets (visible in Properties → Modifier tab)
    ng.interface.new_socket("Geometry",     in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Base Radius",  in_out="INPUT",  socket_type="NodeSocketFloat")
    ng.interface.new_socket("Radius Scale", in_out="INPUT",  socket_type="NodeSocketFloat")
    ng.interface.new_socket("Resample",     in_out="INPUT",  socket_type="NodeSocketInt")
    ng.interface.new_socket("Geometry",     in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nds = ng.nodes
    lnk = ng.links

    # ── Outer graph nodes ──────────────────────────────────────────────────
    n_in    = _new_node(nds, "NodeGroupInput")
    n_out   = _new_node(nds, "NodeGroupOutput")
    n_in.location  = (-600, 0)
    n_out.location = ( 900, 0)

    # Foreach Element Zone — domain "SPLINE" means one iteration per spline
    fe_in  = nds.new("GeometryNodeForeachGeometryElementInput")
    fe_out = nds.new("GeometryNodeForeachGeometryElementOutput")
    fe_in.domain = "SPLINE"   # iterate over splines (not POINT, EDGE, FACE)
    fe_in.location  = (-300, 0)
    fe_out.location = ( 600, 0)

    # Pair the zone nodes so Blender treats them as a matched Foreach zone.
    # WHY pair_with_output():  Without pairing, the two nodes are independent
    # and the 'inside the zone' concept doesn't apply — nodes between them are
    # not topologically isolated.  Blender 5.x requires explicit pairing via API.
    fe_in.pair_with_output(fe_out)

    # ── Inside the zone ────────────────────────────────────────────────────
    # All nodes placed between fe_in and fe_out work on a single-spline Curves
    # object carried by the 'Element Geometry' socket of fe_in.

    # Resample the strand to uniform point spacing
    n_resample = _new_node(nds, "GeometryNodeResampleCurve", Count=RESAMPLE_CT)
    n_resample.mode = "COUNT"
    n_resample.location = (-100, 80)

    # Compute arc length of the current spline
    n_spline_len = _new_node(nds, "GeometryNodeSplineLength")
    n_spline_len.location = (-100, -100)

    # Strand index (counts 0…N_STRANDS-1 across loop iterations)
    n_index = _new_node(nds, "GeometryNodeInputIndex")
    n_index.location = (-100, -220)

    # Ribbon radius = BASE_RADIUS + arc_length * RADIUS_SCALE
    # Math MULTIPLY_ADD: value = input0 * input1 + input2
    n_math_r = nds.new("ShaderNodeMath")
    n_math_r.operation = "MULTIPLY_ADD"
    n_math_r.location = (120, -80)
    # Input0 = arc_length (from SplineLength → Length socket)
    # Input1 = RADIUS_SCALE (from modifier socket)
    # Input2 = BASE_RADIUS (from modifier socket)

    # Circle profile — radius driven by n_math_r
    n_circle = _new_node(nds, "GeometryNodeCurvePrimitiveCircle",
                         Resolution=8)   # 8-sided for low-poly WebXR
    n_circle.location = (300, -80)

    # Curve → Mesh ribbon using the circle profile
    n_c2m = _new_node(nds, "GeometryNodeCurveToMesh",
                      **{"Fill Caps": False})
    n_c2m.location = (450, 80)

    # Shade smooth on the ribbon (prevents faceting artefacts on curved strands)
    n_shade = _new_node(nds, "GeometryNodeSetShadeSmooth")
    n_shade.inputs["Shade Smooth"].default_value = True
    n_shade.location = (530, 80)

    # Set material — Material Index = strand index % N_STRANDS
    # Index Switch node selects which material socket is forwarded
    # We keep it simpler: build a named_attribute STRAND_INDEX stored per-point,
    # and use Set Material + Index socket directly.
    # Because material slots must be pre-assigned to the object, we use
    # Set Material Index (integer) instead.
    n_mat_idx = _new_node(nds, "GeometryNodeSetMaterialIndex")
    n_mat_idx.location = (640, 80)

    # ── Links ─────────────────────────────────────────────────────────────

    # Outer: Group Input → Foreach zone main geometry
    lnk.new(n_in.outputs["Geometry"],     fe_in.inputs["Main Geometry"])
    lnk.new(n_in.outputs["Base Radius"],  n_math_r.inputs[2])   # MULTIPLY_ADD add term
    lnk.new(n_in.outputs["Radius Scale"], n_math_r.inputs[1])   # MULTIPLY_ADD mul term
    lnk.new(n_in.outputs["Resample"],     n_resample.inputs["Count"])

    # Inside zone: element geometry → resample
    lnk.new(fe_in.outputs["Element Geometry"], n_resample.inputs["Curve"])

    # Inside zone: SplineLength → arc length field → math node input0
    lnk.new(n_resample.outputs["Curve"],    n_spline_len.inputs["Curve"])
    lnk.new(n_spline_len.outputs["Length"], n_math_r.inputs[0])

    # Inside zone: math radius → circle radius
    lnk.new(n_math_r.outputs["Value"], n_circle.inputs["Radius"])

    # Inside zone: curve + profile → mesh
    lnk.new(n_resample.outputs["Curve"],  n_c2m.inputs["Curve"])
    lnk.new(n_circle.outputs["Curve"],    n_c2m.inputs["Profile Curve"])

    # Inside zone: shade smooth → material index
    lnk.new(n_c2m.outputs["Mesh"],       n_shade.inputs["Geometry"])
    lnk.new(n_shade.outputs["Geometry"], n_mat_idx.inputs["Geometry"])

    # Inside zone: strand index → material slot index
    lnk.new(n_index.outputs["Index"], n_mat_idx.inputs["Material Index"])

    # Inside zone: material-indexed mesh → foreach output element geometry
    lnk.new(n_mat_idx.outputs["Geometry"], fe_out.inputs["Element Geometry"])

    # Outer: foreach accumulated output → group output
    lnk.new(fe_out.outputs["Main Geometry"], n_out.inputs["Geometry"])

    # ── Attach modifier to object ──────────────────────────────────────────
    mod = obj.modifiers.new("HF_ForeachSplineRibbon", "NODES")
    mod.node_group = ng

    # Set modifier socket defaults
    mod["Input_1"] = BASE_RADIUS
    mod["Input_2"] = RADIUS_SCALE
    mod["Input_3"] = RESAMPLE_CT

    # Assign all emission materials to the object — slots 0…N_STRANDS-1
    # The Set Material Index node inside the zone references these slots by int.
    for mat in mats:
        obj.data.materials.append(mat)


# ── GLB export ────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    """
    Export the ribbons as a Draco-compressed GLB.

    Apply the GN modifier first (make_single_user so we don't clobber the
    original data), then export only the selected object.
    """
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    glb_path = bpy.path.abspath(OUT_GLB)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_apply=True,       # bake GN modifier
        use_selection=True,
        export_materials="EXPORT",
        export_normals=True,
        export_colors=True,
    )
    print(f"[hf_ribbon] GLB written → {glb_path}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[hf_ribbon] Building {N_STRANDS}-strand poi ribbon (Foreach Element Zone)")

    clear_scene()

    # Curves object with N_STRANDS poly splines
    curves_obj = build_curves_object()
    print(f"[hf_ribbon] Created Curves object: {curves_obj.name}")

    # Emission materials
    mats = build_emission_materials()
    print(f"[hf_ribbon] Created {len(mats)} emission materials")

    # GN modifier with Foreach Element Zone
    build_gn_modifier(curves_obj, mats)
    print("[hf_ribbon] GN modifier attached")

    # Force dependency graph update so the modifier evaluates
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    _ = curves_obj.evaluated_get(depsgraph)  # triggers evaluation
    print("[hf_ribbon] GN modifier evaluated")

    # Set up world (dark for light-painting preview)
    bpy.context.scene.world.use_nodes = False
    bpy.context.scene.world.color = (0.0, 0.0, 0.0)

    # Camera framing
    bpy.ops.object.camera_add(location=(0, -9, 2))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam

    # Save .blend
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLEND))
    print(f"[hf_ribbon] Blend saved → {bpy.path.abspath(OUT_BLEND)}")

    if EXPORT_GLB:
        export_glb(curves_obj)

    print("[hf_ribbon] Done.")


main()
