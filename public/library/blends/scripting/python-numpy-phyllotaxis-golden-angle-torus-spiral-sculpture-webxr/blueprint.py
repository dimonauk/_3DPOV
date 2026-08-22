"""
Phyllotaxis — Golden Angle Spiral, Fibonacci Parastichies & Torus Lattice
Holoflow Studio | Blender 5.1 | CC0

Technique:
Place floret n at polar (r, θ) where:
  r = C·√n           (uniform area density — equal floret area everywhere)
  θ = n·α            (golden angle α = 2π/φ² ≈ 137.508°, φ = golden ratio)

Why α? The continued-fraction expansion of φ is [1;1,1,1,...] — every
partial quotient is 1, making φ the hardest positive irrational to
approximate by rationals (Hurwitz 1891). Rotating by α·n therefore
avoids every periodic resonance: no pair of florets clusters on any
rational sub-division of the circle. Fibonacci numbers 8,13,21,34,55
emerge as the count of clockwise / counter-clockwise spiral arms because
they are the denominators of the CF convergents to α/(2π) = 1/φ².

Two output objects:
  DISK  — 500-floret Vogel sunflower, octagonal extruded pillars
  TORUS — 300-floret lattice on torus surface via Weyl equidistribution
"""
import bpy, bmesh, math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────
PHI           = (1 + math.sqrt(5)) / 2
GOLDEN_ANGLE  = 2 * math.pi / (PHI * PHI)   # ≈ 2.39996 rad = 137.508°
N_DISK        = 500     # floret count — disk
DISK_SCALE    = 0.086   # m; r = DISK_SCALE·√n
FLORET_R      = 0.034   # m; floret polygon circumradius
FLORET_H      = 0.013   # m; uniform extrusion height
SEG           = 8       # octagon: faceted studio aesthetic
N_TORUS       = 300     # floret count — torus
TORUS_R_MAJOR = 1.1     # m; axis → tube centre
TORUS_R_MINOR = 0.38    # m; tube radius
T_FLORET_R    = 0.052   # m; torus floret polygon radius
T_FLORET_H    = 0.018   # m; torus floret extrusion height
GLB_PATH      = "//hf_phyllotaxis.glb"

# ── Geometry helpers ───────────────────────────────────────────────────────

def _floret(bm, pos, normal, tangent, radius, height, seg):
    """
    Append an extruded regular polygon (floret) to bm.
    WHY single BMesh: 500 separate bpy.ops.object.add calls take ~90 s;
    one BMesh flush is < 1 s. Gram-Schmidt keeps tangent ⊥ normal
    when input has floating-point drift (critical on torus surface).
    """
    n = normal.normalized()
    t = (tangent - tangent.dot(n) * n).normalized()
    b = n.cross(t)
    bot, top = [], []
    for i in range(seg):
        a   = 2 * math.pi * i / seg
        off = radius * (math.cos(a) * t + math.sin(a) * b)
        bot.append(bm.verts.new(pos + off))
        top.append(bm.verts.new(pos + off + height * n))
    bm.faces.new(bot[::-1])      # bottom: reversed winding → inward normal
    bm.faces.new(top)
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new([bot[i], bot[j], top[j], top[i]])


def _mesh_obj(bm, name):
    """Convert BMesh → Mesh → Object; flat-shade all faces."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = False
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# ── Disk: Vogel 1979 sunflower model ─────────────────────────────────────

def build_disk():
    """
    r = DISK_SCALE·√n, θ = (n-1)·α (start n=1 avoids r=0 degenerate floret).
    Tangent = radial direction so octagon edges align with the spiral arms —
    makes the Fibonacci parastichies visible in the rendered view.
    """
    bm   = bmesh.new()
    z_up = Vector((0, 0, 1))
    for n in range(1, N_DISK + 1):
        r     = DISK_SCALE * math.sqrt(n)
        theta = (n - 1) * GOLDEN_ANGLE
        cx, cy = math.cos(theta), math.sin(theta)
        pos   = Vector((r * cx, r * cy, 0.0))
        tang  = Vector((cx, cy, 0.0))      # radial outward tangent
        _floret(bm, pos, z_up, tang, FLORET_R, FLORET_H, SEG)
    return _mesh_obj(bm, "hf_phyllotaxis_disk")

# ── Torus: Weyl equidistributed lattice ──────────────────────────────────

def build_torus():
    """
    Floret n at azimuthal v=n·α, poloidal u=n·α/φ.
    WHY two irrational increments? Weyl 1916: (nα, nβ) is equidistributed
    on the 2-torus when α/β is irrational. Here α/β = φ (irrational),
    so the lattice covers the surface without gaps or bunching.

    Surface point:
      p = (R + r·cos u)·(cos v, sin v, 0) + (0, 0, r·sin u)
    Outward normal (same as displacement from tube centre):
      n̂ = cos(u)·r̂ + sin(u)·ẑ
    Azimuthal tangent:
      t̂ = d/dv of centre-of-tube = (−sin v, cos v, 0)
    """
    bm = bmesh.new()
    for n in range(N_TORUS):
        v  = n * GOLDEN_ANGLE
        u  = n * GOLDEN_ANGLE / PHI
        sv, cv = math.sin(v), math.cos(v)
        su, cu = math.sin(u), math.cos(u)
        r_hat  = Vector((cv, sv, 0.0))
        pos    = TORUS_R_MAJOR * r_hat + TORUS_R_MINOR * (cu * r_hat + Vector((0, 0, su)))
        normal = (cu * r_hat + Vector((0, 0, su))).normalized()
        tang   = Vector((-sv, cv, 0.0))
        _floret(bm, pos, normal, tang, T_FLORET_R, T_FLORET_H, SEG)
    return _mesh_obj(bm, "hf_phyllotaxis_torus")

# ── Emission material ──────────────────────────────────────────────────────

def _emission_mat(name, col_a, col_b):
    """
    Emission shader with object-space X position driving a ColourRamp.
    No UV needed: colour varies spatially across the sculpture, indexing
    florets by their position in the spiral without any mesh attribute bake.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    emit  = nt.nodes.new("ShaderNodeEmission")
    ramp  = nt.nodes.new("ShaderNodeValToRGB")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep   = nt.nodes.new("ShaderNodeSeparateXYZ")
    mth   = nt.nodes.new("ShaderNodeMath")
    emit.inputs["Strength"].default_value = 2.6
    cr = ramp.color_ramp
    cr.elements[0].color = (*col_a, 1.0)
    cr.elements[1].color = (*col_b, 1.0)
    mth.operation = "MULTIPLY_ADD"
    mth.inputs[1].default_value = 0.11    # scale X-range to 0-1
    mth.inputs[2].default_value = 0.0
    nt.links.new(coord.outputs["Object"],  sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"],         mth.inputs[0])
    nt.links.new(mth.outputs["Value"],     ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"],    emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

# ── Main ──────────────────────────────────────────────────────────────────

def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    disk  = build_disk()
    torus = build_torus()

    # Gold → violet for disk; cyan → magenta for torus
    disk.data.materials.append(
        _emission_mat("mat_disk",
                      col_a=(1.0, 0.76, 0.05),
                      col_b=(0.55, 0.10, 0.95)))
    torus.data.materials.append(
        _emission_mat("mat_torus",
                      col_a=(0.05, 0.88, 0.95),
                      col_b=(0.90, 0.18, 0.60)))

    disk.location  = (3.2, 0.0, 0.0)   # side-by-side layout
    torus.location = (0.0, 0.0, 0.0)

    scene = bpy.context.scene
    scene.render.engine       = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_bloom     = True
    scene.eevee.bloom_threshold = 0.5
    world_bg = (scene.world.node_tree.nodes.get("Background")
                if scene.world else None)
    if world_bg:
        world_bg.inputs["Color"].default_value = (0.005, 0.005, 0.01, 1.0)

    # Export torus as GLB (studio showcase object)
    bpy.ops.object.select_all(action="DESELECT")
    torus.select_set(True)
    bpy.context.view_layer.objects.active = torus
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[hf] phyllotaxis torus GLB → {GLB_PATH}")
    print(f"[hf] disk florets: {N_DISK}  torus florets: {N_TORUS}")


main()
