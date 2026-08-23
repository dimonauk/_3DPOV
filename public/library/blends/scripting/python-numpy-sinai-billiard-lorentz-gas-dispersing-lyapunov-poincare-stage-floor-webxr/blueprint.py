# blueprint.py — Sinai Billiard / Lorentz Gas: Poincaré Section Stage Floor
# Blender 5.1 · python bpy + numpy
# ================================================================
# TECHNIQUE IN THREE SENTENCES
# The Sinai billiard places a circular hard-disk scatterer inside a
# square unit cell with periodic boundary conditions. Because the
# disk is convex (dispersing), each reflection defocuses nearby rays,
# forcing exponential orbit divergence — the Lyapunov exponent is
# strictly positive. We simulate many trajectories, bin each disk
# collision in Birkhoff coordinates (s, p = sin θ), and lift that
# 2-D density histogram into a Z-height stage floor exported as GLB.
# ================================================================

import math, time
import numpy as np
import bpy, bmesh

# ─── NAMED CONSTANTS ──────────────────────────────────────────
L            = 1.0      # half-side of periodic square cell; particle in [-L,L]²
DISK_R       = 0.38     # hard-disk radius — must satisfy DISK_R < L√2 ≈ 1.41
                        # WHY 0.38: maximises chaos while leaving enough free path
                        # for the billiard to "mix" across the cell; too close to
                        # L would produce very short paths and poor statistics
N_TRAJ       = 60       # independent trajectories
N_ITER       = 2500     # disk-collision bounces per trajectory (total 150 000)
N_S          = 64       # arc-length bins along disk boundary
N_P          = 48       # sin-angle bins in [-1, 1]
FLOOR_W      = 4.0      # stage-floor width in metres  (s axis → X)
FLOOR_D      = 3.0      # stage-floor depth in metres  (p axis → Y)
H_SCALE      = 0.38     # maximum ridge height in metres
LYAP_EPS     = 1e-7     # shadow-trajectory separation for Lyapunov estimate
SEED         = 17
EXPORT_PATH  = "//sinai_floor.glb"

# ─── BILLIARD GEOMETRY ────────────────────────────────────────

def _disk_t(px, py, vx, vy):
    """First positive t for line hitting the disk |pos + t*vel|² = R²."""
    # Quadratic: t² + 2bt + c = 0, a=1 since |vel|=1
    b = px * vx + py * vy
    c = px * px + py * py - DISK_R * DISK_R
    disc = b * b - c          # discriminant = R² - dist²(centre, line)
    if disc <= 0.0:
        return None            # line misses disk entirely
    sq = math.sqrt(disc)
    t1 = -b - sq              # first intersection (entering disk)
    if t1 > 1e-9:
        return t1
    t2 = -b + sq              # second (exit) — only if we started inside (shouldn't)
    return t2 if t2 > 1e-9 else None


def _wall_t(px, py, vx, vy):
    """Smallest positive t for crossing any periodic boundary face."""
    best = math.inf
    for p, v, limit in [(px, vx, L), (py, vy, L)]:
        if abs(v) < 1e-12:
            continue
        for sign in (1, -1):
            t = (sign * limit - p) / v
            if 1e-9 < t < best:
                best = t
    return best


def _wrap(val, limit):
    """Wrap a coordinate into (-limit, +limit] with periodic BCs."""
    two_l = 2.0 * limit
    val = val % two_l          # in [0, 2L)
    if val > limit:
        val -= two_l           # shift to (-L, L]
    return val

# ─── SIMULATION ───────────────────────────────────────────────

def simulate(rng):
    density = np.zeros((N_S, N_P), dtype=np.float64)
    lyap_samples = []

    for _ in range(N_TRAJ):
        # Start just outside disk, moving away
        phi0 = rng.uniform(0.0, 2.0 * math.pi)
        px = (DISK_R + 0.02) * math.cos(phi0)
        py = (DISK_R + 0.02) * math.sin(phi0)
        da  = rng.uniform(0.0, 2.0 * math.pi)
        vx  = math.cos(da)
        vy  = math.sin(da)
        # Ensure outward from disk (dot product > 0)
        if px * vx + py * vy < 0.0:
            vx, vy = -vx, -vy

        # Shadow trajectory for Lyapunov: offset perpendicularly
        spx = px + LYAP_EPS * (-vy)
        spy = py + LYAP_EPS * ( vx)
        svx, svy = vx, vy          # same initial direction

        for _ in range(N_ITER):
            td = _disk_t(px, py, vx, vy)
            tw = _wall_t(px, py, vx, vy)

            if td is not None and td < tw:
                # ── Disk reflection ────────────────────────────
                # Advance to collision point
                px, py = px + td * vx, py + td * vy
                # Outward normal (unit vector from disk centre)
                nx, ny = px / DISK_R, py / DISK_R
                # Specular reflection: v → v - 2(v·n)n
                vdotn  = vx * nx + vy * ny  # < 0 (particle approaching)
                vx -= 2.0 * vdotn * nx
                vy -= 2.0 * vdotn * ny

                # Birkhoff coordinates (s, p) ─────────────────
                # s: normalised arc-length ∈ [0,1) — angle/(2π)
                angle = math.atan2(py, px)
                s_frac = (angle / (2.0 * math.pi)) % 1.0
                s_idx  = int(s_frac * N_S) % N_S
                # p = sin(angle of departure from outward normal)
                #   = outgoing velocity · tangent direction
                # Tangent counterclockwise: t̂ = (-sin φ, cos φ) = (-ny, nx)
                p_val  = vx * (-ny) + vy * nx   # ∈ [-1, 1]
                p_idx  = int((p_val + 1.0) * 0.5 * N_P)
                p_idx  = max(0, min(N_P - 1, p_idx))
                density[s_idx, p_idx] += 1.0

                # Shadow trajectory ────────────────────────────
                std = _disk_t(spx, spy, svx, svy)
                if std is not None:
                    spx += std * svx;  spy += std * svy
                    snx, sny = spx / DISK_R, spy / DISK_R
                    sdot = svx * snx + svy * sny
                    svx -= 2.0 * sdot * snx
                    svy -= 2.0 * sdot * sny
                # Lyapunov sample: separation growth ratio
                sep = math.sqrt((px - spx) ** 2 + (py - spy) ** 2)
                if sep > 0.0:
                    lyap_samples.append(math.log(sep / LYAP_EPS))
                    # Renormalise shadow back to LYAP_EPS from main particle
                    ratio = LYAP_EPS / sep
                    spx = px + (spx - px) * ratio
                    spy = py + (spy - py) * ratio
                    # Keep shadow velocity unit-length
                    smag = math.sqrt(svx * svx + svy * svy)
                    if smag > 0.0:
                        svx /= smag;  svy /= smag

            else:
                # ── Periodic boundary wrap ─────────────────────
                px, py = px + tw * vx, py + tw * vy
                px = _wrap(px, L);  py = _wrap(py, L)
                spx += tw * svx;    spy += tw * svy
                spx = _wrap(spx, L);spy = _wrap(spy, L)

    lyap = float(np.mean(lyap_samples)) if lyap_samples else 0.0
    print(f"[Sinai] Lyapunov exponent λ ≈ {lyap:.4f}  (expected >0 for dispersing billiard)")
    return density

# ─── RUN ──────────────────────────────────────────────────────
rng = np.random.default_rng(SEED)
t0  = time.perf_counter()
density = simulate(rng)
print(f"[Sinai] Simulation: {time.perf_counter()-t0:.1f}s")

# Normalise to [0, 1]
d_max  = density.max() or 1.0
d_norm = density / d_max       # uniform ergodic → nearly flat; fluctuations visible

# ─── BUILD MESH ───────────────────────────────────────────────
# (N_S+1) × (N_P+1) vertices; N_S × N_P quad faces
# WHY quad grid: stage floors need continuous Z heights; quads give
# smooth shading normals without the discontinuities of a tri mesh
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

nv_s = N_S + 1
nv_p = N_P + 1
verts_co = []
for j in range(nv_p):
    y_m = (j / N_P - 0.5) * FLOOR_D
    for i in range(nv_s):
        x_m = (i / N_S - 0.5) * FLOOR_W
        si   = min(i, N_S - 1)
        pj   = min(j, N_P - 1)
        z_m  = float(d_norm[si, pj]) * H_SCALE
        verts_co.append((x_m, y_m, z_m))

faces = []
for j in range(N_P):
    for i in range(N_S):
        a = j * nv_s + i
        faces.append((a, a + 1, a + 1 + nv_s, a + nv_s))

mesh = bpy.data.meshes.new("sinai_floor")
mesh.from_pydata(verts_co, [], faces)
mesh.update()

obj = bpy.data.objects.new("sinai_floor", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "stage-floor"

# ─── VERTEX COLOUR: cobalt → amber by density ─────────────────
bm = bmesh.new()
bm.from_mesh(mesh)
bm.verts.ensure_lookup_table()
col_layer = bm.loops.layers.float_color.new("SinaiDensity")
for face in bm.faces:
    for loop in face.loops:
        co   = loop.vert.co
        si   = max(0, min(N_S - 1, round((co.x / FLOOR_W + 0.5) * N_S)))
        pj   = max(0, min(N_P - 1, round((co.y / FLOOR_D + 0.5) * N_P)))
        t    = float(d_norm[si, pj])
        # cobalt(0.10,0.28,0.78) → amber(0.92,0.58,0.08)
        loop[col_layer] = (0.10 + t * 0.82, 0.28 + t * 0.30,
                           0.78 - t * 0.70, 1.0)
bm.to_mesh(mesh)
bm.free()

# ─── MATERIAL ─────────────────────────────────────────────────
mat  = bpy.data.materials.new("SinaiFloor")
mat.use_nodes = True
nt   = mat.node_tree
nt.nodes.clear()
out  = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
vcol = nt.nodes.new("ShaderNodeVertexColor")
vcol.layer_name = "SinaiDensity"
bsdf.inputs["Roughness"].default_value = 0.52
bsdf.inputs["Metallic"].default_value  = 0.12
nt.links.new(vcol.outputs["Color"],  bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])
mesh.materials.append(mat)

# ─── EXPORT ───────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_colors=True,
)
print("[Sinai] GLB export complete →", EXPORT_PATH)
