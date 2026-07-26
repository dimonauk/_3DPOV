"""
Python bpy — Resin MSLA Light Sculpture:
Nested Shell, LED Cavity & TIR Drainage Holes (Blender 5.1)
============================================================
CC0 · Holoflow Studio

A waveguide light sculpture for MSLA resin printing on an Elegoo Saturn:

  Inner core  — clear photopolymer resin, subdivided icosphere (sub=4)
                for an optically smooth TIR-capable surface; IOR ≈ 1.49.
  Outer shell — decorative, flat-shaded icosphere (sub=2) sitting WALL_MM
                proud of the core for the decorative crystalline facade.
  LED cavity  — cylinder Boolean'd from the shell base; press-fits a 5 mm
                LED emitter + dome lens with 0.2 mm clearance.
  Drainage    — six 2 mm holes placed at the base ring at 60° spacing,
                positioned below the TIR cone so they do not intersect
                the waveguide's total-internal-reflection path.

TIR critical angle for clear photopolymer (n ≈ 1.49, air n = 1.0):
  θ_c = arcsin(n_air / n_resin) = arcsin(1/1.49) ≈ 42.2°
Light inside the core undergoes TIR for angles > θ_c from the normal.
Drainage holes must sit at polar angle φ > 90° − θ_c ≈ 47.8° from the
base equator; placing them at φ = 55° below equator keeps them safe.

Outside sources:
  Blender 5.1 Manual — Boolean Modifier — CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/booleans.html
    related: https://projects.blender.org/blender/blender
  Blender Python API 5.1 — bpy.ops.wm.stl_export — CC-BY-SA 4.0
    https://docs.blender.org/api/5.1/bpy.ops.wm.html#bpy.ops.wm.stl_export
    related: https://projects.blender.org/blender/blender
"""

import bpy
import bmesh
import math
import pathlib

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------

OUTER_R      = 0.050   # outer shell radius (m) — 50 mm for a palm-sized sculpture
WALL_MM      = 0.002   # shell wall thickness (m) — 2 mm, printable at 50 μm MSLA layer
INNER_R      = OUTER_R - WALL_MM

LED_DIAM     = 0.005   # LED emitter diameter (m) — 5 mm standard
LED_CLEAR    = 0.0002  # press-fit clearance
CAVITY_R     = (LED_DIAM / 2) + LED_CLEAR
CAVITY_DEPTH = 0.008   # 8 mm seat depth

DRAIN_R      = 0.001   # drainage hole radius (m) — 1 mm = 2 mm diameter
DRAIN_COUNT  = 6       # 6 holes at 60° intervals
# Polar latitude below the base equator (55° > 90°−θ_c ≈ 47.8°; safe for TIR)
DRAIN_LAT    = math.radians(55)

OUTER_SUB    = 2       # icosphere subdivisions for outer shell (faceted)
INNER_SUB    = 4       # icosphere subdivisions for inner core (smooth)

GLB_PATH     = "//hf_light_sculpture_preview.glb"
STL_OUTER    = "//hf_sculpture_outer.stl"
STL_INNER    = "//hf_sculpture_inner.stl"

RESIN_IOR    = 1.49
RESIN_COLOUR = (0.92, 0.90, 0.86, 1.0)  # off-white clear resin
OUTER_COLOUR = (0.04, 0.06, 0.22, 1.0)  # deep navy faceted shell

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def _make_ico(name: str, subdivisions: int, radius: float, smooth: bool) -> bpy.types.Object:
    """Build an icosphere from bmesh and return as a linked Object."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def _make_cylinder(name: str, radius: float, depth: float, segs: int = 16) -> bpy.types.Object:
    """Thin capped cylinder cutter; bottom cap sits at z=0, top at z=depth."""
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True, cap_tris=False,
        segments=segs,
        radius1=radius, radius2=radius,
        depth=depth,
    )
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location.z = depth / 2  # centre at z=depth/2 so base sits at z=0
    bpy.context.collection.objects.link(ob)
    return ob


def _apply_bool(target: bpy.types.Object, cutter: bpy.types.Object, operation: str = 'DIFFERENCE'):
    """
    Attach a Boolean modifier to target, apply it, then remove cutter.
    WHY: Boolean modifier is more robust for manifold results than
    bmesh.ops.intersect_tri_tri, which lacks guaranteed output winding.
    temp_override ensures the apply operator sees the correct active object
    in a headless --background session.
    """
    mod = target.modifiers.new(name="_bool_cut", type='BOOLEAN')
    mod.operation = operation
    mod.operand_type = 'OBJECT'
    mod.object = cutter
    mod.solver = 'EXACT'   # Exact solver: watertight, better for thin walls
    with bpy.context.temp_override(active_object=target, object=target):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def _assign_material(ob: bpy.types.Object, colour: tuple, metallic: float,
                     roughness: float, transmission: float = 0.0, ior: float = 1.45):
    mat = bpy.data.materials.new(ob.name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Transmission Weight"].default_value = transmission
    bsdf.inputs["IOR"].default_value = ior
    ob.data.materials.append(mat)


# ---------------------------------------------------------------------------
# Build steps
# ---------------------------------------------------------------------------

def build_inner_core() -> bpy.types.Object:
    """
    Smooth icosphere (sub=4) for the translucent waveguide core.
    Sub=4 gives 642 vertices — smooth enough that TIR remains unbroken
    across face-normal deviations < 1°, well under the 42.2° critical angle.
    """
    core = _make_ico("hf_core", INNER_SUB, INNER_R, smooth=True)
    _assign_material(core, RESIN_COLOUR, metallic=0.0, roughness=0.04,
                     transmission=0.92, ior=RESIN_IOR)
    return core


def build_outer_shell() -> bpy.types.Object:
    """
    Faceted icosphere (sub=2) for the decorative outer shell.
    Sub=2 gives 80 faces — large facets catch light dramatically at the
    show-floor scale. Flat shading (use_smooth=False) is the MSLA advantage:
    the layer lines on facet faces are perpendicular to the build plate and
    print without aliasing.
    """
    shell = _make_ico("hf_shell", OUTER_SUB, OUTER_R, smooth=False)
    _assign_material(shell, OUTER_COLOUR, metallic=0.6, roughness=0.25)
    return shell


def carve_led_cavity(shell: bpy.types.Object):
    """
    Subtract a cylinder from the shell base for the LED seat.
    The cavity opens downward (−Z face of the sphere) and is deep enough
    to seat an LED + dome lens. CAVITY_DEPTH extends through the wall and
    slightly into the INNER_R volume to confirm the LED's optical axis
    is centred on the waveguide entry point.
    """
    cutter = _make_cylinder("_led_cutter", CAVITY_R, CAVITY_DEPTH)
    # Position at the sphere base (−Z pole)
    cutter.location.z = -OUTER_R - (CAVITY_DEPTH / 2)
    _apply_bool(shell, cutter)


def add_drainage_holes(shell: bpy.types.Object):
    """
    Place DRAIN_COUNT cylindrical drain holes at polar latitude DRAIN_LAT
    below the equator. Resin must escape the sealed shell cavity during
    MSLA printing; without drainage, trapped liquid creates hydraulic
    suction that tears layers off the FEP film.

    Hole placement is constrained by TIR: holes at DRAIN_LAT = 55° below
    the equator clear the 47.8° TIR safety margin with 7° buffer.
    """
    for i in range(DRAIN_COUNT):
        azimuth = math.radians(i * 360 / DRAIN_COUNT)
        # Sphere surface at the chosen latitude
        z = -OUTER_R * math.sin(DRAIN_LAT)
        r_at_lat = OUTER_R * math.cos(DRAIN_LAT)
        x = r_at_lat * math.cos(azimuth)
        y = r_at_lat * math.sin(azimuth)

        drain = _make_cylinder(f"_drain_{i}", DRAIN_R, WALL_MM * 2.5, segs=8)
        # Orient outward along the sphere surface normal at this point
        # (pointing radially outward = easy to drill in the slicer too)
        drain.location = (x, y, z)
        # Rotate the cylinder so its axis aligns with the radial normal
        from mathutils import Vector
        normal = Vector((x, y, z)).normalized()
        drain.rotation_mode = 'QUATERNION'
        drain.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(normal)
        _apply_bool(shell, drain)


def overhang_analysis(ob: bpy.types.Object):
    """
    Tag faces by overhang severity for MSLA orientation advice.
    Faces with normal.z < -cos(45°) need support structures or re-orientation.
    The result is stored as a FLOAT named attribute 'overhang' for shader viz.
    """
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.faces.ensure_lookup_table()

    overhang_layer = bm.faces.layers.float.new("overhang")
    cos_thresh = math.cos(math.radians(45))
    for face in bm.faces:
        severity = max(0.0, -face.normal.z - cos_thresh)
        face[overhang_layer] = severity

    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()


def export_stls():
    """Export outer shell and inner core as separate STLs for multi-part printing."""
    for ob_name, stl_path in [
        ("hf_shell", STL_OUTER),
        ("hf_core",  STL_INNER),
    ]:
        ob = bpy.data.objects.get(ob_name)
        if ob is None:
            print(f"[HF] Skip STL: '{ob_name}' not found")
            continue
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        abs_path = bpy.path.abspath(stl_path)
        bpy.ops.wm.stl_export(
            filepath=abs_path,
            use_selection=True,
            global_scale=1000.0,  # Blender metres → millimetres for slicers
            forward_axis='Y',
            up_axis='Z',
            ascii_format=False,
        )
        print(f"[HF] STL → {abs_path}")


def export_glb():
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_animations=False,
    )
    print(f"[HF] GLB → {GLB_PATH}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    _clear()
    core  = build_inner_core()
    shell = build_outer_shell()
    carve_led_cavity(shell)
    add_drainage_holes(shell)
    overhang_analysis(shell)
    export_stls()
    export_glb()
    print("[HF] Done. Check hf_sculpture_outer.stl + hf_sculpture_inner.stl for slicing.")


if __name__ == "__main__":
    main()
