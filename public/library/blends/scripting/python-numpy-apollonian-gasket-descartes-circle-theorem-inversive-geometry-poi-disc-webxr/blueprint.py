"""
Apollonian Gasket – Descartes Circle Theorem, Inversive Geometry & Fractal Disc Poi Head
Blender 5.1 · Python scripting · Holoflow Studio

Technique in brief
──────────────────
The Apollonian gasket is the unique fractal obtained by repeatedly filling every
interstice of three mutually-tangent circles with the (unique) Soddy circle that
fits snugly inside it.  Each new circle satisfies Descartes' Circle Theorem:

    (k₁+k₂+k₃+k₄)² = 2(k₁²+k₂²+k₃²+k₄²)

where kᵢ = 1/rᵢ is the *curvature* (signed negative for the outer enclosing circle).

Rather than solving this as a quadratic (which requires choosing a sqrt branch),
this blueprint uses the *Apollonian reflection identity*:

    k_new = 2(kB+kC+kD) − kA
    z_new = 2(zB+zC+zD) − zA         (where zᵢ = kᵢ · centerᵢ ∈ ℂ)

Given any Apollonian quadruple (A,B,C,D) the fifth circle in the interstice
opposite A is found by purely linear arithmetic — no branch cuts, no complex sqrt.

Starting quadruple (−1, 2, 2, 3) is the unique integer Apollonian packing that
fits symmetrically inside a unit disc, verified by:
    (−1+2+2+3)² = 36 = 2(1+4+4+9).

Mesh: each gasket circle → extruded disc (flat cylinder).  Height is proportional
to generation depth, creating a terraced fractal relief suitable as a poi-head
shield disc.  Vertex colour maps depth → HSV ramp (cyan → magenta).
"""

import bpy, math, colorsys
from collections import deque

# ── Parameters (all tunable) ─────────────────────────────────────────────────
MIN_RADIUS     = 0.018    # fractal cutoff: circles smaller than this are skipped
DISC_SEGMENTS  = 16       # polygon facets per disc edge (power of 2 preferred)
DISC_THICKNESS = 0.012    # extrusion height of each disc (Blender unit = m)
HEIGHT_STEP    = 0.040    # z-rise per generation depth level (m)
OUTER_RADIUS   = 1.0      # radius of enclosing circle (normalised; scaled at end)
POI_DIAMETER   = 0.12     # target poi head diameter (m) — applied via scale
POLE_RADIUS    = 0.025    # radius of central handle stub (m)
POLE_HEIGHT    = 0.15     # length of handle stub (m)
OBJ_NAME       = "hf_apollonian_gasket"
COL_NAME       = "HF_Apollonian"
BLEND_PATH     = "//hf_apollonian_gasket.blend"


# ── Apollonian Gasket Generator ───────────────────────────────────────────────
# Uses reflection identity: no complex sqrt needed.
# Each circle encoded as (k, z) where z = k·center ∈ ℂ.

def build_apollonian(min_r: float) -> list:
    """
    Return [(cx, cy, radius, depth), ...] for all gasket circles.

    Base quadruple (outer, left, right, top) in (k, z=k·c) notation:
      outer : k=−1, z=0                 (enclosing unit disc)
      left  : k=+2, z=−1                (centre=−½, tangent left)
      right : k=+2, z=+1                (centre=+½, tangent right)
      top   : k=+3, z=+2i               (centre=+2i/3, fits between l/r/outer)

    BFS pops (k_par, z_par, kB, zB, kC, zC, kD, zD, depth).
    Generates circle N opposite par from triple (B,C,D).
    Recurses with N replacing par in 3 sub-triples.
    """
    OUTER = (-1.0,  0+0j)
    LEFT  = ( 2.0, -1+0j)   # z = k·(−½) = −1
    RIGHT = ( 2.0, +1+0j)   # z = k·(+½) = +1
    TOP   = ( 3.0, +2j)     # z = k·(+2i/3) = 2i

    circles: list = []
    seen: set     = set()

    def _add(k: float, z: complex, depth: int) -> bool:
        if k <= 0:
            return False
        r  = 1.0 / k
        cx = z.real / k
        cy = z.imag / k
        # Circle must lie inside the outer unit disc
        if math.hypot(cx, cy) + r > OUTER_RADIUS + 1e-9:
            return False
        if r < min_r:
            return False
        key = (round(k, 4), round(cx, 6), round(cy, 6))
        if key in seen:
            return False
        seen.add(key)
        circles.append((cx, cy, r, depth))
        return True

    _add(*LEFT,  0)
    _add(*RIGHT, 0)
    _add(*TOP,   0)

    # Seed all four gaps of the base quadruple
    # Item format: (k_par, z_par, kB, zB, kC, zC, kD, zD, depth)
    queue = deque([
        (*OUTER, *LEFT,  *RIGHT, *TOP,   1),  # gap opposite outer
        (*LEFT,  *OUTER, *RIGHT, *TOP,   1),  # gap opposite left
        (*RIGHT, *OUTER, *LEFT,  *TOP,   1),  # gap opposite right
        (*TOP,   *OUTER, *LEFT,  *RIGHT, 1),  # gap opposite top (→ bottom)
    ])

    while queue:
        kP, zP, kB, zB, kC, zC, kD, zD, d = queue.popleft()
        # Reflection: circle N opposite P in gap (B, C, D)
        kN = 2.0*(kB + kC + kD) - kP
        zN = 2.0*(zB + zC + zD) - zP
        if _add(kN, zN, d):
            # Three new sub-gaps: N replaces P, each of B/C/D becomes new parent
            queue.append((kD, zD, kB, zB, kC, zC, kN, zN, d + 1))
            queue.append((kC, zC, kB, zB, kD, zD, kN, zN, d + 1))
            queue.append((kB, zB, kC, zC, kD, zD, kN, zN, d + 1))

    return circles


# ── Mesh Assembly ─────────────────────────────────────────────────────────────
def assemble_mesh(circles: list) -> bpy.types.Object:
    """
    Build one mesh object from all Apollonian discs via from_pydata (fast path).
    Each circle → cylinder with N-gon top and bottom and N side quads.
    Vertex colour FLOAT_COLOR attribute encodes depth via HSV ramp.
    """
    max_depth = max(d for *_, d in circles) or 1
    seg       = DISC_SEGMENTS
    verts     = []
    faces     = []
    col_vals  = []
    vi        = 0

    for cx, cy, r, depth in circles:
        t        = depth / max_depth
        # Ramp: cyan (h=0.55) → magenta (h=0.85) as depth increases
        hue      = 0.55 + t * 0.30
        sat      = 0.70 + t * 0.25
        val      = 0.95 - t * 0.12
        rgb      = colorsys.hsv_to_rgb(hue, sat, val)
        rgba     = (*rgb, 1.0)

        z0 = depth * HEIGHT_STEP
        z1 = z0 + DISC_THICKNESS

        cos_a = [math.cos(2 * math.pi * i / seg) for i in range(seg)]
        sin_a = [math.sin(2 * math.pi * i / seg) for i in range(seg)]
        base  = vi

        # Bottom ring then top ring
        for i in range(seg):
            verts.append((cx + r * cos_a[i], cy + r * sin_a[i], z0))
            col_vals.append(rgba)
        for i in range(seg):
            verts.append((cx + r * cos_a[i], cy + r * sin_a[i], z1))
            col_vals.append(rgba)
        vi += 2 * seg

        # Bottom cap (reversed winding → outward normal downward)
        faces.append(list(range(base, base + seg))[::-1])
        # Top cap
        faces.append(list(range(base + seg, base + 2 * seg)))
        # Side quads
        for i in range(seg):
            j = (i + 1) % seg
            faces.append([base + i, base + j, base + seg + j, base + seg + i])

    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()

    # Colour attribute (Blender 5.1 preferred API: color_attributes)
    attr = mesh.color_attributes.new("Col", type="FLOAT_COLOR", domain="POINT")
    for i, rgba in enumerate(col_vals):
        attr.data[i].color = rgba

    mesh.update()
    return mesh


# ── Scene Build ───────────────────────────────────────────────────────────────
def build_scene(circles: list) -> bpy.types.Object:
    # ── Collection ────────────────────────────────────────────────────────────
    if COL_NAME in bpy.data.collections:
        coll = bpy.data.collections[COL_NAME]
        for ob in list(coll.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(coll)
    coll = bpy.data.collections.new(COL_NAME)
    bpy.context.scene.collection.children.link(coll)

    # ── Disc mesh object ──────────────────────────────────────────────────────
    mesh = assemble_mesh(circles)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    coll.objects.link(obj)
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

    # ── Vertex-colour material ─────────────────────────────────────────────────
    mat   = bpy.data.materials.new(f"{OBJ_NAME}_mat")
    mat.use_nodes = True
    nt    = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vcol  = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "Col"
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Metallic"].default_value  = 0.55
    nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    out.location  = (400, 0);  bsdf.location = (200, 0);  vcol.location = (0, 0)
    obj.data.materials.append(mat)

    # ── Handle stub (central pole) ────────────────────────────────────────────
    bpy.ops.mesh.primitive_cylinder_add(
        radius=POLE_RADIUS, depth=POLE_HEIGHT,
        location=(0, 0, -POLE_HEIGHT / 2),
    )
    pole = bpy.context.object
    pole.name = f"{OBJ_NAME}_pole"
    for c in bpy.context.scene.collection.children:
        if pole.name in [o.name for o in c.objects]:
            c.objects.unlink(pole)
    coll.objects.link(pole)

    # ── Camera ────────────────────────────────────────────────────────────────
    cam_d = bpy.data.cameras.new("Cam_Apollonian")
    cam_d.lens = 50
    cam  = bpy.data.objects.new("Cam_Apollonian", cam_d)
    coll.objects.link(cam)
    cam.location       = (0, -3.8, 2.2)
    cam.rotation_euler = (math.radians(58), 0, 0)
    bpy.context.scene.camera = cam

    # ── Sun light ─────────────────────────────────────────────────────────────
    sun_d = bpy.data.lights.new("Key", type="SUN")
    sun_d.energy = 3.2
    sun  = bpy.data.objects.new("Key", sun_d)
    coll.objects.link(sun)
    sun.location       = (2.0, -2.0, 4.0)
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

    return obj


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Apollonian Gasket blueprint — Blender 5.1")
    circles = build_apollonian(MIN_RADIUS)
    print(f"  {len(circles)} circles, depth 0‥{max(d for *_,d in circles)}")

    obj = build_scene(circles)
    print(f"  Mesh: {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces")

    # Scale to POI_DIAMETER (current OUTER_RADIUS normalised to 1 m)
    s = POI_DIAMETER / (2 * OUTER_RADIUS)
    obj.scale = (s, s, s)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
    print(f"Saved → {BLEND_PATH}")
