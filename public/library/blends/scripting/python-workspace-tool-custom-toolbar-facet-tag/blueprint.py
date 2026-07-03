"""
blueprint.py  –  Python bpy.types.WorkSpaceTool: Click-Tag holoflow:facet
Blender 5.1  |  Python 3.11+  |  CC0
=====================================================================
Technique
---------
bpy.types.WorkSpaceTool registers a fully integrated toolbar entry that
appears in the 3-D Viewport's T-panel in Edit-Mesh mode, sitting after
the built-in Select tool under a separator.  Clicking any face with the
tool active fires HLF_OT_facet_tag_click, which calls view3d.select() to
move the cursor, reads the active face from bmesh, then writes an INT
attribute named 'holoflow:facet' to that face's FACE domain slot.

WorkSpaceTools are NOT registered via bpy.utils.register_class().
They require bpy.utils.register_tool() — a separate registry entry.
The tool class itself is never instantiated; its class attributes
(bl_keymap, draw_settings) are read statically by the Blender UI layer.

Key API facts
-------------
  bl_keymap       — class-attribute tuple of (op_idname, event_dict, kwargs);
                    not a classmethod or staticmethod
  draw_settings   — @staticmethod; called every redraw to fill the header
                    bar when the tool is active
  bl_cursor       — one of bpy.types.Window.cursor_modal_set enum strings
  bl_context_mode — 'EDIT_MESH' restricts tool to Edit-Mesh context only
  bl_widget       — None = no gizmo; 'GIZMO_GT_dial_3d' etc. to attach one
  after=          — set of idname strings, NOT class refs
  separator=True  — draws a dividing line above the tool in the toolbar

Attribute API distinction
-------------------------
  Object Mode: me.attributes.new(name, type, domain) + attr.data[i].value
  Edit Mode:   bmesh.from_edit_mesh(me) + bm.faces.layers.int.new(name)
               + bmesh.update_edit_mesh(me)
  Both paths refer to the same underlying CustomData layer; bmesh write
  is the ONLY safe method while in EDIT_MESH mode.
"""

import bpy
import bmesh

# ── constants ─────────────────────────────────────────────────
ATTR_NAME   = "holoflow:facet"  # colon-key name survives GLB export_extras
TOOL_IDNAME = "mesh_tool.holoflow_facet_tag"
GRID_DIV    = 10                # 10×10 = 100 demo faces


# ── property group ────────────────────────────────────────────
class HLF_TagToolProps(bpy.types.PropertyGroup):
    """Transient settings stored on WindowManager (reset each session)."""
    enable: bpy.props.BoolProperty(
        name="Enable",
        description="Write 1 to holoflow:facet on click; uncheck to write 0",
        default=True,
    )


# ── operator ──────────────────────────────────────────────────
class HLF_OT_facet_tag_click(bpy.types.Operator):
    """Click a face to write holoflow:facet (0 or 1) via bmesh INT layer"""
    bl_idname  = "mesh.holoflow_facet_tag_click"
    bl_label   = "Tag Face Facet"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return (
            context.active_object is not None
            and context.active_object.type == 'MESH'
            and context.mode == 'EDIT_MESH'
        )

    def invoke(self, context, event):
        # 1. Click-select the face under the cursor.
        #    deselect_all=True clears prior selection so bm.faces.active
        #    reflects exactly the clicked face, not a stale multi-selection.
        bpy.ops.view3d.select(
            location=(event.mouse_region_x, event.mouse_region_y),
            deselect_all=True,
        )

        obj = context.active_object
        me  = obj.data
        bm  = bmesh.from_edit_mesh(me)
        bm.faces.ensure_lookup_table()

        active_face = bm.faces.active
        if active_face is None:
            # Clicked empty space — no face under cursor
            return {'CANCELLED'}

        # 2. Get or create the INT layer.
        #    .get() returns None if the layer does not yet exist on the mesh.
        #    .new() creates it with all values zeroed; prior faces become 0 implicitly.
        int_layer = bm.faces.layers.int.get(ATTR_NAME)
        if int_layer is None:
            int_layer = bm.faces.layers.int.new(ATTR_NAME)

        # 3. Write value from the header-bar toggle.
        props = context.window_manager.hlf_tag_tool_props
        active_face[int_layer] = 1 if props.enable else 0

        # 4. Sync bmesh → mesh data.  destructive=False: no topology change,
        #    so Blender skips the expensive loop-triangle rebuild.
        bmesh.update_edit_mesh(me, loop_triangles=False, destructive=False)
        return {'FINISHED'}


# ── workspace tool ────────────────────────────────────────────
class HLF_WT_facet_tag(bpy.types.WorkSpaceTool):
    """Custom toolbar tool: click-assign holoflow:facet on any face."""
    bl_space_type   = 'VIEW_3D'
    bl_context_mode = 'EDIT_MESH'   # invisible outside Edit-Mesh
    bl_idname       = TOOL_IDNAME
    bl_label        = "HF Facet Tag"
    bl_description  = (
        "Click a face to toggle holoflow:facet (INT, FACE domain). "
        "GLB with export_extras=True embeds the value in glTF extras "
        "for runtime reading in Three.js / WebXR."
    )
    bl_icon   = "BRUSHES_ALL"   # built-in icon; no custom SVG file needed
    bl_cursor = "CROSSHAIR"     # cursor while tool is active
    bl_widget = None            # no gizmo overlay; set 'GIZMO_GT_dial_3d' to attach one

    # Class-attribute tuple — NOT a method.
    # Each item: (operator_idname, event_props_dict, operator_kwargs_dict).
    # PRESS fires on mouse-down, giving immediate visual feedback.
    # Use "CLICK" (value='CLICK') to require press + release without drag
    # if accidental drag-tagging is a concern for the workflow.
    bl_keymap = (
        (
            "mesh.holoflow_facet_tag_click",
            {"type": "LEFTMOUSE", "value": "PRESS"},
            {},
        ),
    )

    @staticmethod
    def draw_settings(context, layout, tool):
        """Injected into the viewport header bar while this tool is active."""
        props = context.window_manager.hlf_tag_tool_props
        row = layout.row(align=True)
        # toggle=True renders as a pressed/unpressed button instead of a checkbox
        row.prop(props, "enable", text="Enable", toggle=True)
        row.separator()
        val = "1 (tagged)" if props.enable else "0 (cleared)"
        row.label(text=f"writes holoflow:facet = {val}")


# ── demo scene ────────────────────────────────────────────────
def build_scene():
    """10×10 grid with checkerboard holoflow:facet pattern and preview material."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_DIV, y_subdivisions=GRID_DIV,
        size=2.0, location=(0, 0, 0),
    )
    obj      = bpy.context.active_object
    obj.name = "facet_demo_grid"
    me       = obj.data
    me.name  = "facet_demo_grid_mesh"

    # Object-Mode attribute write — safe because we're not in Edit Mode here
    attr = (me.attributes[ATTR_NAME]
            if ATTR_NAME in me.attributes
            else me.attributes.new(name=ATTR_NAME, type='INT', domain='FACE'))

    for i in range(len(me.polygons)):
        row, col          = divmod(i, GRID_DIV)
        attr.data[i].value = 1 if (row + col) % 2 == 0 else 0

    # Preview material: reads holoflow:facet → orange=1, grey=0
    mat   = bpy.data.materials.new("facet_preview")
    mat.use_nodes = True
    nt    = mat.node_tree
    nodes, links = nt.nodes, nt.links
    nodes.clear()

    out    = nodes.new("ShaderNodeOutputMaterial")
    bsdf   = nodes.new("ShaderNodeBsdfPrincipled")
    named  = nodes.new("ShaderNodeAttribute")
    named.attribute_name = ATTR_NAME
    named.attribute_type = 'GEOMETRY'
    mix    = nodes.new("ShaderNodeMix")
    mix.data_type    = 'RGBA'
    mix.clamp_factor = True
    grey   = nodes.new("ShaderNodeRGB")
    grey.outputs[0].default_value   = (0.18, 0.18, 0.18, 1.0)
    orange = nodes.new("ShaderNodeRGB")
    orange.outputs[0].default_value = (1.0, 0.45, 0.05, 1.0)

    links.new(named.outputs['Fac'],  mix.inputs['Factor'])
    links.new(grey.outputs[0],       mix.inputs['A'])
    links.new(orange.outputs[0],     mix.inputs['B'])
    links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])

    for n, x, y in [
        (out, 600, 0), (bsdf, 300, 0), (mix, 0, 0),
        (named, -300, 100), (grey, -300, -60), (orange, -300, -200),
    ]:
        n.location = (x, y)

    me.materials.append(mat)

    print("[holoflow] Demo grid built.")
    print("[holoflow] Run register() then switch to Edit Mode → T → HF Facet Tag.")


# ── registration ──────────────────────────────────────────────
CLASSES = [HLF_TagToolProps, HLF_OT_facet_tag_click]


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    # register_tool — note: NOT register_class
    # after= takes a set of idname strings (not class references)
    # separator=True draws a thin line above the tool in the toolbar
    bpy.utils.register_tool(HLF_WT_facet_tag,
                             after={"builtin.select"}, separator=True)
    bpy.types.WindowManager.hlf_tag_tool_props = bpy.props.PointerProperty(
        type=HLF_TagToolProps,
    )


def unregister():
    # Delete PointerProperty BEFORE unregister_class to avoid RNA reference error
    if hasattr(bpy.types.WindowManager, "hlf_tag_tool_props"):
        del bpy.types.WindowManager.hlf_tag_tool_props
    try:
        bpy.utils.unregister_tool(HLF_WT_facet_tag)
    except Exception:
        pass
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    try:
        unregister()
    except Exception:
        pass
    register()
    build_scene()
