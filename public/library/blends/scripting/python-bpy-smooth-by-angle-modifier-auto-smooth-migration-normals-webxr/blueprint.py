"""
Python SMOOTH_BY_ANGLE Modifier — Auto-Smooth Migration,
Normal Stacking & Faceted GLB for WebXR (Blender 5.1)
Holoflow Studio | CC0

TECHNIQUE
─────────
Blender 4.2 removed mesh.use_auto_smooth and mesh.auto_smooth_angle entirely.
Any script that still sets those properties in Blender 5.1 silently does
nothing — producing either fully flat or fully smooth shading depending on
the geometry's face-mark state.  The replacement is the SMOOTH_BY_ANGLE
modifier, which slots into the modifier stack like any other modifier and
evaluates against the depsgraph at export time.

The key advantages over the old property:
  • Per-object angle (not per-mesh) — linked instances can carry different
    smooth angles by overriding the modifier, not duplicating the mesh.
  • Stack position controls which topology it sees — place it AFTER
    Boolean/Array/Bevel so it smooths the final shape, not the cage.
  • keep_sharp_edges = True honours manually-set sharp_edge bool attributes
    alongside the angle heuristic, giving you two independent levers.
  • Two modifiers with different angles + vertex groups produce per-region
    smooth thresholds on one object — impossible with the old property.

BLENDER 5.1 API
───────────────
  mod = obj.modifiers.new('Smooth by Angle', 'SMOOTH_BY_ANGLE')
  mod.angle          = math.radians(30)   # threshold; default ~0.523 rad (30°)
  mod.keep_sharp_edges = True             # also honour sharp_edge attribute

  Removed in 4.2 (do NOT write in 5.1 — silently ignored):
    mesh.use_auto_smooth       # ← gone
    mesh.auto_smooth_angle     # ← gone

STACK POSITION LAW
──────────────────
  Correct order (bottom → top):
    1. Geometry producers:  Mirror, Array, Boolean, Bevel
    2. SMOOTH_BY_ANGLE      ← here, so it reads the final topology
    3. Subdivision Surface  ← SubD inherits the normals set by SBA
    4. Shrinkwrap / Displace ← (these move geometry but do not rewrite normals)

  Putting SBA above SubD is wrong: SubD recomputes interpolated normals and
  discards the SBA result.  Putting SBA below Boolean means you smooth the
  cage before voids are punched — feature edges inside the void survive and
  look wrong after Catmull-Clark rounds them.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG             = "hf_smooth_demo"
SMOOTH_ANGLE_DEG = 30.0          # edge angle threshold for auto-smooth
OUTPUT_PATH      = "//hf_smooth_demo.glb"
DRACO_LEVEL      = 6

# Geometry dims (metres)
BARREL_RADIUS    = 0.5
BARREL_HEIGHT    = 0.8
BARREL_SEGMENTS  = 16
LID_RADIUS       = 0.45
LID_HEIGHT       = 0.25
LID_SIDES        = 6             # hex lid — all angles ≈120° → below threshold


# ── Helpers ───────────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.remove(block, do_unlink=True)


def build_prop() -> bpy.types.Object:
    """
    Build a cylindrical barrel body with a hexagonal lid.

    Smooth-shading intent:
      • Barrel cylinder (16 sides):  angle between adjacent quads ≈ 22.5°
        → BELOW the 30° threshold → auto-smooth applies → looks smooth.
      • Top/bottom caps of cylinder: angle from vertical quads to horizontal
        cap = 90° → ABOVE threshold → stays hard / flat.
      • Hex lid (6 sides): internal angles ≈ 60° between adjacent lateral
        faces → ABOVE 30° threshold → stays faceted as intended.
      • Lid rim bevel edges: very small angle (<5°) → smooth.

    This one object demonstrates all three cases with a single modifier.
    """
    mesh = bpy.data.meshes.new(SLUG)
    obj  = bpy.data.objects.new(SLUG, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # ── Barrel body ────────────────────────────────────────────────────────
    # Bottom disk
    bottom_verts = []
    for i in range(BARREL_SEGMENTS):
        angle = 2 * math.pi * i / BARREL_SEGMENTS
        x = BARREL_RADIUS * math.cos(angle)
        y = BARREL_RADIUS * math.sin(angle)
        bottom_verts.append(bm.verts.new(Vector((x, y, 0.0))))

    # Top ring
    top_verts = []
    for i in range(BARREL_SEGMENTS):
        angle = 2 * math.pi * i / BARREL_SEGMENTS
        x = BARREL_RADIUS * math.cos(angle)
        y = BARREL_RADIUS * math.sin(angle)
        top_verts.append(bm.verts.new(Vector((x, y, BARREL_HEIGHT))))

    # Side quads
    n = BARREL_SEGMENTS
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([bottom_verts[i], bottom_verts[j],
                      top_verts[j],   top_verts[i]])

    # Bottom cap
    bm.faces.new(bottom_verts[::-1])   # reversed → outward normal

    # Top cap
    bm.faces.new(top_verts)

    # ── Hex lid ────────────────────────────────────────────────────────────
    lid_z0 = BARREL_HEIGHT
    lid_z1 = BARREL_HEIGHT + LID_HEIGHT

    hex_bot = []
    hex_top = []
    for i in range(LID_SIDES):
        angle = 2 * math.pi * i / LID_SIDES + math.pi / LID_SIDES
        x = LID_RADIUS * math.cos(angle)
        y = LID_RADIUS * math.sin(angle)
        hex_bot.append(bm.verts.new(Vector((x, y, lid_z0))))
        hex_top.append(bm.verts.new(Vector((x, y, lid_z1))))

    ns = LID_SIDES
    for i in range(ns):
        j = (i + 1) % ns
        bm.faces.new([hex_bot[i], hex_bot[j], hex_top[j], hex_top[i]])

    bm.faces.new(hex_bot[::-1])
    bm.faces.new(hex_top)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    mesh.update()
    return obj


def mark_sharp_panel_groove(obj: bpy.types.Object) -> None:
    """
    Mark a ring of barrel edges at mid-height as sharp via the sharp_edge
    bool attribute.  These sit well inside the 30° auto-smooth zone
    (angle ≈ 0°) so SMOOTH_BY_ANGLE alone would smooth them.
    With keep_sharp_edges=True the modifier also reads this attribute and
    forces a hard edge at that ring — demonstrating the dual-lever system.

    sharp_edge lives at EDGE domain, type BOOLEAN.  Use foreach_set for speed.
    """
    mesh = obj.data
    if "sharp_edge" not in mesh.attributes:
        mesh.attributes.new("sharp_edge", 'BOOLEAN', 'EDGE')

    sharp_array = [False] * len(mesh.edges)

    # Mark every edge that connects a vertex at barrel mid-height
    mid_z = BARREL_HEIGHT * 0.5
    tol   = 0.02
    for i, edge in enumerate(mesh.edges):
        v0z = mesh.vertices[edge.vertices[0]].co.z
        v1z = mesh.vertices[edge.vertices[1]].co.z
        if abs(v0z - mid_z) < tol and abs(v1z - mid_z) < tol:
            sharp_array[i] = True

    mesh.attributes["sharp_edge"].data.foreach_set("value", sharp_array)
    mesh.update()


def add_smooth_by_angle(obj: bpy.types.Object,
                        angle_deg: float = SMOOTH_ANGLE_DEG) -> None:
    """
    Add the SMOOTH_BY_ANGLE modifier — the 4.2+/5.1 replacement for the
    removed mesh.use_auto_smooth flag.

    CRITICAL: place this modifier AFTER geometry-altering modifiers (Boolean,
    Bevel) and BEFORE Subdivision Surface in the stack.
    """
    # Guard: remove any pre-existing instance so script is idempotent
    existing = obj.modifiers.get("Smooth by Angle")
    if existing:
        obj.modifiers.remove(existing)

    mod = obj.modifiers.new("Smooth by Angle", 'SMOOTH_BY_ANGLE')

    # Angle in RADIANS — a common source of bugs; the UI shows degrees but
    # the Python property is always radians.
    mod.angle = math.radians(angle_deg)

    # keep_sharp_edges=True: sharp_edge attribute marks also produce hard
    # edges regardless of the computed angle.  Set False if you only want
    # automatic angle-based smoothing with no manual overrides.
    mod.keep_sharp_edges = True


def migrate_old_auto_smooth(scene: bpy.types.Scene) -> list[str]:
    """
    Migration helper: scan all mesh objects for the old use_auto_smooth
    pattern and add SMOOTH_BY_ANGLE where missing.

    In Blender 4.2+, mesh.use_auto_smooth is no longer a real attribute;
    it may survive as a custom ID property in older .blend files.  Detect
    its presence via id_data['use_auto_smooth'] and the absence of a
    SMOOTH_BY_ANGLE modifier, then replace it.

    Returns list of object names that were migrated.
    """
    migrated = []
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue

        has_old_flag  = obj.data.get("use_auto_smooth", False)
        has_new_mod   = any(m.type == 'SMOOTH_BY_ANGLE'
                            for m in obj.modifiers)

        if has_old_flag and not has_new_mod:
            old_angle = obj.data.get("auto_smooth_angle",
                                     math.radians(30))
            add_smooth_by_angle(obj, math.degrees(old_angle))

            # Remove stale custom properties from the legacy mesh
            if "use_auto_smooth" in obj.data:
                del obj.data["use_auto_smooth"]
            if "auto_smooth_angle" in obj.data:
                del obj.data["auto_smooth_angle"]

            migrated.append(obj.name)

    return migrated


def export_glb(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath        = bpy.path.abspath(OUTPUT_PATH),
        use_selection   = True,
        export_format   = 'GLB',
        # Depsgraph evaluates SMOOTH_BY_ANGLE before writing normals:
        export_apply    = True,
        # Export custom normals (set by modifier) as the GLB NORMAL accessor:
        export_normals  = True,
        # Draco compression for WebXR delivery:
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
    )


def main() -> None:
    clear_scene()

    obj = build_prop()
    mark_sharp_panel_groove(obj)
    add_smooth_by_angle(obj, SMOOTH_ANGLE_DEG)

    # Demonstrate migration helper on the scene (no-op if already migrated)
    upgraded = migrate_old_auto_smooth(bpy.context.scene)
    if upgraded:
        print(f"Migrated {len(upgraded)} object(s): {upgraded}")

    export_glb(obj)
    print(f"Exported → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
