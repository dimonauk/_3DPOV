"""
Python bpy.types.BooleanModifier + bpy.types.WeldModifier
Compound-body prop construction, junction weld & GLB export for WebXR.

Technique: Boolean UNION two bmesh-built primitives → WeldModifier collapses
near-duplicate junction vertices → apply both modifiers in correct order →
export faceted low-poly GLB.

WHY this over manual mesh editing:
  Repeatable for batch prop generation.  Non-destructive until modifier apply.
  EXACT solver preserves flat faces — essential for the faceted low-poly look.
  Weld pass eliminates the near-duplicate vertices the boolean leaves at the
  seam, preventing shading artefacts and bad lightmap UVs.

Blender 5.1 notes:
  BooleanModifier.solver:
    'EXACT'  — uses exact arithmetic predicates (Mesh Boolean library).
               Guaranteed manifold result on planar seams. Slower than FAST.
    'FAST'   — BVH-based approximation. Can leave micro-gaps on coplanar faces;
               safe for convex rounded objects but unreliable on flat-faced props.
  BooleanModifier.use_hole_tolerant:
    Enable if EXACT fails on non-manifold input; triggers a flood-fill repair
    pass first, at the cost of slightly more triangulation.
  WeldModifier.mode:
    'ALL'       — merges globally across disconnected components; risky if
                  two separate surfaces happen to sit within threshold.
    'CONNECTED' — merges only vertices that share an edge; correct for
                  a column-on-plate where the two surfaces touch but are close.
  Apply order: Boolean FIRST (produces the merged topology), then Weld
  (sees the post-boolean seam vertices).  Reversing the order is a no-op —
  Weld on un-merged geometry finds nothing within threshold.
"""

import bpy
import math
import bmesh

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
SLUG             = "hf_boolean_weld_prop"
PLATE_X          = 0.90   # half-extent of base plate along X (metres)
PLATE_Y          = 0.60   # half-extent of base plate along Y
PLATE_Z          = 0.10   # half-height of base plate
COLUMN_RADIUS    = 0.22   # radius of hexagonal column
COLUMN_HEIGHT    = 0.70   # column height above base plate
COLUMN_SEGMENTS  = 6      # 6 = hexagonal; increase for rounder look
WELD_THRESHOLD   = 0.0001 # merge distance (metres) — catches boolean seam verts
EXPORT_PATH      = "//hf_boolean_weld_prop.glb"


# ─── SCENE SETUP ──────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


# ─── GEOMETRY BUILDERS ────────────────────────────────────────────────────────

def make_plate(name: str):
    """Rectangular slab — base landing plate."""
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
    # Centre of plate at Z=0; top face at +PLATE_Z, bottom at -PLATE_Z
    return obj


def make_column(name: str):
    """
    Hexagonal prism column.  Base sits at Z = PLATE_Z (top of plate) so the
    column and plate are in contact — that contact zone is where the boolean
    will merge topology and the weld will clean up seam vertices.
    """
    bm = bmesh.new()
    bot, top = [], []
    for i in range(COLUMN_SEGMENTS):
        a = math.tau * i / COLUMN_SEGMENTS
        x, y = COLUMN_RADIUS * math.cos(a), COLUMN_RADIUS * math.sin(a)
        bot.append(bm.verts.new((x, y, 0.0)))
        top.append(bm.verts.new((x, y, COLUMN_HEIGHT)))
    # Bottom cap: reversed so normal points -Z (outward)
    bm.faces.new(list(reversed(bot)))
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
    # Raise column so its base is flush with top face of plate
    obj.location.z = PLATE_Z
    return obj


# ─── MODIFIERS ────────────────────────────────────────────────────────────────

def add_boolean_union(base_obj, cutter_obj):
    """
    Attach BooleanModifier UNION to base_obj.
    The cutter_obj is consumed into base_obj's topology during apply.
    WHY cutter must remain visible: the EXACT solver reads the cutter's
    evaluated mesh at apply-time; hide_render=True is fine, hide_viewport=True
    blocks the solver and produces an empty boolean result.
    """
    mod                   = base_obj.modifiers.new("Bool_Union", 'BOOLEAN')
    mod.operation         = 'UNION'
    mod.object            = cutter_obj
    mod.solver            = 'EXACT'
    mod.use_self          = False   # two separate manifold objects
    mod.use_hole_tolerant = False   # enable only if EXACT reports non-manifold
    return mod


def add_weld(obj):
    """
    Stack a WeldModifier after the Boolean.
    mode='CONNECTED' — merge only edge-adjacent near-duplicates.
    This targets the boolean seam precisely without risk of collapsing
    geometry on the opposite face of the plate.
    """
    mod                 = obj.modifiers.new("Weld_Junction", 'WELD')
    mod.merge_threshold = WELD_THRESHOLD
    mod.mode            = 'CONNECTED'
    return mod


# ─── APPLY PIPELINE ───────────────────────────────────────────────────────────

def apply_modifiers(obj):
    """
    Apply every modifier in stack order.
    bpy.ops.object.modifier_apply() requires OBJECT mode + active object.
    Order is determined by modifier list index (not by name).
    Boolean must precede Weld in the stack — guaranteed here by add order.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='OBJECT')
    for mod in list(obj.modifiers):  # list() copy — live collection mutates on apply
        bpy.ops.object.modifier_apply(modifier=mod.name)


def remove_cutter(obj):
    """
    Delete the cutter object and its orphan mesh after modifier apply.
    Critical: if the cutter remains in the scene at export time, export_apply=False
    would include it as a second mesh in the GLB.
    """
    mesh = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)


# ─── FINISHING ────────────────────────────────────────────────────────────────

def flat_shade(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = False


def assign_material(obj):
    mat = bpy.data.materials.new("hf_stone_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.68, 0.64, 0.57, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.80
    bsdf.inputs["Metallic"].default_value   = 0.0
    obj.data.materials.append(mat)


def export_glb(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath      = bpy.path.abspath(EXPORT_PATH),
        export_format = 'GLB',
        use_selection = True,
        export_apply  = False,          # modifiers already applied above
        export_yup    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    clear_scene()

    plate  = make_plate("hf_plate")
    column = make_column("hf_column")

    add_boolean_union(plate, column)
    add_weld(plate)                 # stacked after boolean — order matters

    apply_modifiers(plate)
    remove_cutter(column)           # clean up before export

    flat_shade(plate)
    assign_material(plate)
    plate.name = SLUG
    plate.data.name = SLUG + "_mesh"

    export_glb(plate)
    print(f"[holoflow] exported {EXPORT_PATH}")


if __name__ == "__main__":
    main()
