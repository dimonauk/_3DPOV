"""
GN String to Curves — Procedural 3D Text Generator  (Blender 5.1)
blueprint.py — run via Text Editor › Run Script, or:
               blender --background --python blueprint.py

WHY STRING TO CURVES RATHER THAN A TEXT OBJECT
  A Blender Text Object (Add › Text) is interactive and convenient for
  one-offs, but it lives outside Geometry Nodes and cannot be driven by GN
  group inputs.  GeometryNodeStringToCurves is the GN-native path: the string
  becomes a group socket that can be set programmatically, swept by a Python
  driver, or read from a custom object property — essential for generative
  workflows where the label text changes per instance.

WHY REALIZE INSTANCES BEFORE FILL CURVE
  StringToCurves outputs "Curve Instances" — each character is a separate
  curve instance, NOT a merged curve geometry.  FillCurve only fills actual
  curve splines; given an instances container, it sees no splines and returns
  an empty mesh.  RealizeInstances collapses all character instances into one
  flat curve geometry that FillCurve can iterate over.

WHY INDIVIDUAL FACES ON EXTRUDE MESH
  With Individual Faces = False, ExtrudeMesh treats all top-face polygons as
  a single slab and only extrudes the outer boundary — leaving gaps between
  characters hollow.  Individual Faces = True extrudes each polygon
  independently so every letter gets its own side walls and back face.
  Critical for any multi-character string whose outer silhouette is not convex.

WHY BEVEL MESH ON ALL EDGES
  Hard machine-cut letter edges look flat under directional light regardless
  of Roughness or Metallic values.  A 2-segment bevel (0.008 m, ~5% of
  em-height) creates a narrow specular highlight rim that reads as a
  physically plausible manufactured edge.  Same principle as the worn-metal
  shader tutorial, achieved here in mesh topology rather than a second material.

STRING ANIMATION LIMITATION
  The String socket type does NOT support F-curve keyframes — Blender has no
  STRING interpolation mode.  To animate text: bind a custom String property
  on the object to the group input via a driver, then keyframe the custom
  property.  Alternatively bake each frame from Python:
    for i in range(1, 10):
        mod["Socket_0"] = f"FRAME {i:02d}"
        sc.frame_set(i)
        bpy.ops.wm.save_as_mainfile(filepath=f"//frame_{i:02d}.blend")

OUTSIDE SOURCES
  String to Curves — CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/text/string_to_curves.html
  Inter Typeface — OFL 1.1  Rasmus Andersson
    https://github.com/rsms/inter
    Related: https://github.com/google/fonts (Apache-2.0 / OFL font collection)
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
TEXT_STRING    = "HOLOFLOW"        # UTF-8 string; ASCII-safe for BFont built-in
FONT_NAME      = "Bfont Regular"   # built-in; swap for a loaded .ttf name
TEXT_SIZE      = 1.0               # em-height (metres)
ALIGN_X        = "CENTER"          # LEFT / CENTER / RIGHT / JUSTIFY / FLUSH
ALIGN_Y        = "BOTTOM_BASELINE" # matches standard typographic baseline

EXTRUDE_DEPTH  = 0.06              # letter Z-depth (metres)
BEVEL_AMOUNT   = 0.008             # chamfer width (metres)
BEVEL_SEGS     = 2                 # segments → 45° fillet approximation

BASE_COLOR     = (0.04, 0.62, 0.9, 1.0)   # studio teal
METALLIC       = 0.82
ROUGHNESS      = 0.10

ANIM_FRAMES    = 60                # 2.5 s at 24 fps
OUTPUT_BLEND   = "//procedural_text.blend"
OUTPUT_GLB     = "//procedural_text.glb"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for item in list(col):
            col.remove(item)


def make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("text_mat")
    mat.use_nodes = True
    pb = mat.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = BASE_COLOR
    pb.inputs["Metallic"].default_value   = METALLIC
    pb.inputs["Roughness"].default_value  = ROUGHNESS
    return mat


def build_gn_tree(mat: bpy.types.Material) -> bpy.types.GeometryNodeTree:
    """
    Wires the full text→mesh pipeline as a reusable Geometry Nodes group.
    GroupInput exposes Text / Depth / Size as animatable modifier properties.
    """
    ng  = bpy.data.node_groups.new("ProceduralText", "GeometryNodeTree")
    ni  = ng.interface
    nds = ng.nodes
    lks = ng.links

    # ── group interface ────────────────────────────────────────────────────────
    ni.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    s_text  = ni.new_socket("Text",  in_out="INPUT", socket_type="NodeSocketString")
    s_depth = ni.new_socket("Depth", in_out="INPUT", socket_type="NodeSocketFloat")
    s_size  = ni.new_socket("Size",  in_out="INPUT", socket_type="NodeSocketFloat")
    s_text.default_value  = TEXT_STRING
    s_depth.default_value = EXTRUDE_DEPTH
    s_size.default_value  = TEXT_SIZE

    # ── node factory ──────────────────────────────────────────────────────────
    def nd(t, lbl="", x=0, y=0):
        n = nds.new(t)
        n.label    = lbl
        n.location = (x, y)
        return n

    n_in   = nd("NodeGroupInput",              "Inputs",    -1000,    0)
    n_out  = nd("NodeGroupOutput",             "Output",     1400,    0)
    n_s2c  = nd("GeometryNodeStringToCurves",  "Str→Curves",  -700,    0)
    n_real = nd("GeometryNodeRealizeInstances","Realise",     -440,    0)
    n_fill = nd("GeometryNodeFillCurve",       "FillCurve",   -200,    0)
    n_cxyz = nd("ShaderNodeCombineXYZ",        "Depth→Z",     -200, -220)
    n_extr = nd("GeometryNodeExtrudeMesh",     "Extrude",       60,    0)
    n_bvl  = nd("GeometryNodeBevelMesh",       "Bevel",        320,    0)
    n_smat = nd("GeometryNodeSetMaterial",     "SetMat",       580,    0)
    n_mati = nd("GeometryNodeInputMaterial",   "Material",     380, -200)

    # ── configure nodes ───────────────────────────────────────────────────────
    font = bpy.data.fonts.get(FONT_NAME) or bpy.data.fonts.load("<builtin>")
    n_s2c.font    = font
    n_s2c.align_x = ALIGN_X
    n_s2c.align_y = ALIGN_Y

    # NGONS preserves bezier outline fidelity; use TRIANGLES for 3D-print manifold
    n_fill.mode = "NGONS"

    n_extr.mode = "FACES"
    n_extr.inputs["Individual Faces"].default_value = True

    n_bvl.mode = "EDGES"
    n_bvl.inputs["Amount"].default_value   = BEVEL_AMOUNT
    n_bvl.inputs["Segments"].default_value = BEVEL_SEGS

    n_mati.material = mat

    # ── wires ─────────────────────────────────────────────────────────────────
    lks.new(n_in.outputs["Text"],             n_s2c.inputs["String"])
    lks.new(n_in.outputs["Size"],             n_s2c.inputs["Size"])
    lks.new(n_s2c.outputs["Curve Instances"], n_real.inputs["Geometry"])
    lks.new(n_real.outputs["Geometry"],       n_fill.inputs["Curve"])
    lks.new(n_fill.outputs["Mesh"],           n_extr.inputs["Mesh"])
    lks.new(n_in.outputs["Depth"],            n_cxyz.inputs["Z"])
    lks.new(n_cxyz.outputs["Vector"],         n_extr.inputs["Offset"])
    lks.new(n_extr.outputs["Mesh"],           n_bvl.inputs["Mesh"])
    lks.new(n_bvl.outputs["Mesh"],            n_smat.inputs["Geometry"])
    lks.new(n_mati.outputs["Material"],       n_smat.inputs["Material"])
    lks.new(n_smat.outputs["Geometry"],       n_out.inputs["Geometry"])

    return ng


def make_scaffold_object(ng) -> bpy.types.Object:
    """
    Empty mesh carrier for the GN modifier.  No GroupInput.Geometry socket is
    wired, so the carrier contributes zero vertices — StringToCurves is the
    sole geometry source inside the tree.
    """
    me  = bpy.data.meshes.new("text_carrier")
    obj = bpy.data.objects.new("procedural_text", me)
    bpy.context.collection.objects.link(obj)
    mod = obj.modifiers.new("GN_Text", "NODES")
    mod.node_group = ng
    return obj


def setup_scene() -> None:
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.render.fps    = 24
    sc.frame_start, sc.frame_end = 1, ANIM_FRAMES

    bpy.ops.object.camera_add(location=(0.0, -5.5, 1.2))
    cam = bpy.context.active_object
    cam.name = "TextCam"
    sc.camera = cam
    cam.rotation_euler = (math.radians(78), 0.0, 0.0)

    bpy.ops.object.light_add(type="SUN", location=(4.0, -3.0, 8.0))
    sun = bpy.context.active_object
    sun.data.energy    = 4.5
    sun.rotation_euler = (math.radians(48), 0.0, math.radians(28))

    bpy.ops.object.light_add(type="AREA", location=(-4.0, 2.0, 3.5))
    fill = bpy.context.active_object
    fill.data.energy = 90.0
    fill.data.color  = (0.76, 0.86, 1.0)   # cool-bounce tint
    fill.data.size   = 4.0

    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.shading.type = "MATERIAL"
            break


def animate_orbit() -> None:
    """
    Slow rising arc: camera lifts from near-baseline to three-quarter view.
    Simple location + rotation tween — no pivot empty needed for a short clip.
    """
    cam = bpy.data.objects["TextCam"]
    sc  = bpy.context.scene

    def key(frame, loc, rx, rz=0.0):
        sc.frame_set(frame)
        cam.location       = loc
        cam.rotation_euler = (math.radians(rx), 0.0, math.radians(rz))
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    key(1,           (0.0, -5.5, 0.4),  88,  0)
    key(ANIM_FRAMES, (0.3, -5.0, 2.8),  58, -8)

    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"


def export_files() -> None:
    bpy.context.scene.frame_set(30)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_animations=False,
    )
    print(f"[ProceduralText] GLB → {bpy.path.abspath(OUTPUT_GLB)}")


def main() -> None:
    clear_scene()
    mat = make_material()
    ng  = build_gn_tree(mat)
    make_scaffold_object(ng)
    setup_scene()
    animate_orbit()
    export_files()
    print("[ProceduralText] Done.")


if __name__ == "__main__" or True:
    main()
