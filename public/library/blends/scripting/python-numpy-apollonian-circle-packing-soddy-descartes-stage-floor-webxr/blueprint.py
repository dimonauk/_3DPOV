"""
Apollonian Circle Packing — Descartes' Circle Theorem & Soddy Gasket
Holoflow Studio | Blender 5.1 | CC0

Technique:
Represent circles as *complex curvatures* (k, kz = k·centre) where k = 1/r.
Descartes' theorem (1643, extended to complex plane by Gossett 1937):
  k4  = k1+k2+k3  ±  2·√(k1·k2 + k2·k3 + k3·k1)
  kz4 = kz1+kz2+kz3 ± 2·√(kz1·kz2 + kz2·kz3 + kz3·kz1)

The elegant "mirror" formula avoids the ±√ in the recursion:
  k_new  = 2(k2+k3+k4)  - k1
  kz_new = 2(kz2+kz3+kz4) - kz1
This preserves integer curvatures throughout (Sarnak 2007).

Seed quadruple (-1, 2, 2, 3) with:
  c0 = k=-1, z=0        (enclosing unit circle)
  c1 = k=2,  z=0.5      (right inner disk, r=0.5)
  c2 = k=2,  z=-0.5     (left inner disk, r=0.5)
  c3 = k=3,  z=2i/3     (upper disk, r=1/3)

Each positive-curvature circle becomes a bas-relief cylinder:
height proportional to log(curvature), emission colour by curvature rank.
"""
import bpy, bmesh, math, cmath
from collections import deque

# ── Parameters ──────────────────────────────────────────────────────────
K_MAX          = 180       # stop at curvature ≥ K_MAX  (r ≤ 1/K_MAX)
WORLD_SCALE    = 4.0       # outer-circle radius in Blender metres
SEG            = 8         # polygon sides — faceted aesthetic
EXTRUDE_MAX    = 0.12      # max bas-relief height (m) for smallest circles
EXTRUDE_MIN    = 0.005     # min height for largest inner circles
GLB_PATH       = "//hf_apollonian_floor.glb"
BLEND_NAME     = "ApollonianFloor"
ROUND_DP       = 5         # decimal places for deduplication

# ── Apollonian engine ───────────────────────────────────────────────────
def _sqrt_complex(z: complex) -> complex:
    """Principal square root of complex number (avoids cmath branch cut issue)."""
    r, a = abs(z), cmath.phase(z)
    return cmath.rect(math.sqrt(r), a / 2)


def _mirror(ki: float, kzi: complex, others: list) -> tuple:
    """
    Given circle i and the other 3 circles in a quadruple, return the
    complementary Apollonius circle across the interstice opposite to ci.

    Formula:  k_new  = 2(ka+kb+kc)  - ki
              kz_new = 2(kza+kzb+kzc) - kzi
    WHY: Both solutions of the Descartes quadratic share the same sum:
         k_orig + k_new = 2(ka+kb+kc), so k_new = 2·sum - ki.
    """
    k_sum  = sum(c[0] for c in others)
    kz_sum = sum(c[1] for c in others)
    return (2 * k_sum - ki, 2 * kz_sum - kzi)


def generate_apollonian(seed: list, k_max: int) -> list[tuple]:
    """
    BFS over quadruples. Returns list of (k, z, r) for all positive-curvature
    circles with k < k_max.

    Deduplication key: (k, round(cx, DP), round(cy, DP)) as a frozenset
    — circles are position-independent so we key on (k, cx, cy).
    """
    circles_seen: set = set()
    result: list = []

    def _key(k: float, kz: complex) -> tuple:
        if abs(k) < 1e-9:
            return (0, 0.0, 0.0)
        cx = round((kz / k).real, ROUND_DP)
        cy = round((kz / k).imag, ROUND_DP)
        return (round(k), cx, cy)

    def _register(k: float, kz: complex):
        if k <= 0 or k >= k_max:
            return
        key = _key(k, kz)
        if key in circles_seen:
            return
        circles_seen.add(key)
        cx = (kz / k).real
        cy = (kz / k).imag
        result.append((k, cx, cy, 1.0 / k))

    # Register seed circles (excluding the outer bounding circle k=-1)
    for k, kz in seed:
        _register(k, kz)

    queue: deque = deque([seed])
    visited_quads: set = set()

    while queue:
        quad = queue.popleft()
        quad_key = frozenset(_key(c[0], c[1]) for c in quad)
        if quad_key in visited_quads:
            continue
        visited_quads.add(quad_key)

        for i in range(4):
            ki, kzi = quad[i]
            others = [quad[j] for j in range(4) if j != i]
            k_new, kz_new = _mirror(ki, kzi, others)
            if k_new <= 0 or k_new >= k_max:
                continue
            _register(k_new, kz_new)
            new_quad = others + [(k_new, kz_new)]
            new_key = frozenset(_key(c[0], c[1]) for c in new_quad)
            if new_key not in visited_quads:
                queue.append(new_quad)

    return result


# ── Seed setup ───────────────────────────────────────────────────────────
# Canonical (-1,2,2,3) Apollonian gasket.
# Complex curvatures kz = k·(cx + i·cy):
SEED = [
    (-1, complex(-1, 0)),   # outer circle k=-1, centre 0
    ( 2, complex( 1, 0)),   # right disk k=2,  centre = kz/k = 0.5
    ( 2, complex(-1, 0)),   # left disk  k=2,  centre = -0.5
    ( 3, complex( 0, 2)),   # upper disk k=3,  centre = 2i/3
]


# ── Build Blender mesh ───────────────────────────────────────────────────
def build_mesh(circles: list[tuple]) -> bpy.types.Object:
    """
    Batched bmesh construction — one BMesh for all circles avoids repeated
    bpy.ops overhead. Each circle → SEG-gon extruded to height h.
    Height mapping: h = EXTRUDE_MIN + (EXTRUDE_MAX-EXTRUDE_MIN) * t
    where t = (log(k) - log(k_min)) / (log(k_max) - log(k_min)).
    Largest k → tallest pillar (finest packing), largest circles → flat floor.
    """
    bm = bmesh.new()
    angles = [2 * math.pi * j / SEG for j in range(SEG)]
    cos_a = [math.cos(a) for a in angles]
    sin_a = [math.sin(a) for a in angles]

    if not circles:
        return None

    ks = [c[0] for c in circles]
    log_k_min = math.log(min(ks))
    log_k_max = math.log(max(ks)) if max(ks) > min(ks) else log_k_min + 1.0

    for k, cx, cy, r in circles:
        t = (math.log(k) - log_k_min) / (log_k_max - log_k_min)
        h = EXTRUDE_MIN + (EXTRUDE_MAX - EXTRUDE_MIN) * t
        wx = cx * WORLD_SCALE
        wy = cy * WORLD_SCALE
        wr = r  * WORLD_SCALE

        # Bottom ring (z=0), top ring (z=h)
        bot = [bm.verts.new((wx + wr * cos_a[j], wy + wr * sin_a[j], 0.0))
               for j in range(SEG)]
        top = [bm.verts.new((wx + wr * cos_a[j], wy + wr * sin_a[j],  h))
               for j in range(SEG)]
        top_ctr = bm.verts.new((wx, wy, h))

        # Side quads
        for j in range(SEG):
            bm.faces.new([bot[j], bot[(j + 1) % SEG],
                          top[(j + 1) % SEG], top[j]])
        # Top fan
        for j in range(SEG):
            bm.faces.new([top_ctr, top[j], top[(j + 1) % SEG]])

    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new(BLEND_NAME)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(BLEND_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── Material ─────────────────────────────────────────────────────────────
def assign_material(obj: bpy.types.Object):
    """
    Emission-only material. ColourRamp maps curvature rank to cyan–violet.
    KHR_materials_emissive_strength > 1.0 for WebXR bloom in Three.js.
    """
    mat = bpy.data.materials.new("ApollonianEmit")
    mat.use_nodes = True
    mat.blend_method = "OPAQUE"
    ng = mat.node_tree
    for n in list(ng.nodes):
        ng.nodes.remove(n)

    out   = ng.nodes.new("ShaderNodeOutputMaterial")
    emit  = ng.nodes.new("ShaderNodeEmission")
    ramp  = ng.nodes.new("ShaderNodeValToRGB")
    attr  = ng.nodes.new("ShaderNodeObjectInfo")

    # Violet → cyan
    ramp.color_ramp.interpolation = "LINEAR"
    ramp.color_ramp.elements[0].color = (0.60, 0.15, 1.0, 1.0)  # violet
    ramp.color_ramp.elements[1].color = (0.08, 0.90, 0.95, 1.0)  # cyan

    emit.inputs["Strength"].default_value = 3.0

    ng.links.new(attr.outputs["Random"], ramp.inputs["Fac"])
    ng.links.new(ramp.outputs["Color"], emit.inputs["Color"])
    ng.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    obj.data.materials.append(mat)


# ── GLB export ────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[Apollonian] GLB → {GLB_PATH}")


# ── Main ──────────────────────────────────────────────────────────────────
def main():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    print("[Apollonian] Generating packing …")
    circles = generate_apollonian(SEED, K_MAX)
    print(f"[Apollonian] {len(circles)} circles (k < {K_MAX})")

    obj = build_mesh(circles)
    if obj is None:
        print("[Apollonian] No circles generated.")
        return

    # Flat-shade for faceted WebXR aesthetic
    for poly in obj.data.polygons:
        poly.use_smooth = False

    assign_material(obj)
    export_glb(obj)
    print("[Apollonian] Done.")


main()
