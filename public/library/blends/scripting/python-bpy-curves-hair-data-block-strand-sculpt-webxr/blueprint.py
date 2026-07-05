"""
Python bpy.types.Curves — Procedural Hair Strand Data Block for WebXR / VRM
Blender 5.1 | Holoflow Studio | CC0

Technique: bpy.types.Curves  (NOT bpy.types.Curve bezier/NURBS)
  Blender 3.3 introduced a dedicated Curves data type as the new hair substrate.
  Each strand is a polyline whose control points are stored as flat arrays in
  named attributes — the same foreach_set / foreach_get interface as mesh
  attributes.  The Curves block has two geometry domains:

    POINT  — one element per control point across all strands
    CURVE  — one element per strand (cycle/type flag, surface UV, etc.)

  Critical invariant: topology is declared BEFORE geometry.
  add_curves(counts) builds the offset array that partitions the flat POINT
  buffer into individual strands.  Every subsequent attribute write is a
  single numpy/array.array call — no Python-level per-point loops needed.

WHY direct data API over bpy.ops.object.curves_empty_hair_add():
  The operator requires an active surface object in Object mode.  Calling
  bpy.data.curves.new() + add_curves() works in any context, including
  headless batch scripts.  The surface binding is then set via
  curves_data.surface, which is a pure property assignment.
"""

import bpy
import math
import numpy as np
import os

# ── Parameters ────────────────────────────────────────────────────────────────
SURFACE_NAME  = "HF_HairSphere"
HAIR_NAME     = "HF_HairStrands"
N_STRANDS     = 64          # guide count — GN interpolates to render density
SEG_COUNT     = 7           # control points per strand (root inclusive)
STRAND_LENGTH = 0.22        # world-space length in metres
ROOT_RADIUS   = 0.0050      # tube radius at root — tapers to TIP_RADIUS
TIP_RADIUS    = 0.0007      # fine point at tip
GRAVITY       = 0.42        # 0 = radial straight; 1 = fully draped downward
SPHERE_R      = 0.84        # head-cap radius (1.7 m figure, scaled for vis)
COS_MIN       = 0.12        # restrict roots to upper hemisphere
OUTPUT_DIR    = bpy.path.abspath("//output/")
OUTPUT_GLB    = os.path.join(OUTPUT_DIR, "hair_strands_webxr.glb")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fibonacci_upper_hemisphere(n: int) -> list[tuple[float, float, float]]:
    """
    Deterministic even distribution on the upper hemisphere using the golden-ratio
    Fibonacci spiral.  No randomness — reproducible every run.
    COS_MIN restricts to a polar cap so no roots sit near the equator.
    """
    golden = (1.0 + math.sqrt(5.0)) / 2.0
    pts: list[tuple[float, float, float]] = []
    for i in range(n):
        cos_theta = 1.0 - (i + 0.5) / n * (1.0 - COS_MIN)
        sin_theta = math.sqrt(max(0.0, 1.0 - cos_theta * cos_theta))
        phi = 2.0 * math.pi * i / golden
        pts.append((sin_theta * math.cos(phi),
                    sin_theta * math.sin(phi),
                    cos_theta))
    return pts


def _sphere_uv(nx: float, ny: float, nz: float) -> tuple[float, float]:
    """Equirectangular UV for a unit normal on the sphere surface."""
    u = (math.atan2(ny, nx) / (2.0 * math.pi)) % 1.0
    v = math.acos(max(-1.0, min(1.0, nz))) / math.pi
    return u, v


# ── Build surface mesh ────────────────────────────────────────────────────────

def build_surface() -> bpy.types.Object:
    """
    UV sphere as the hair surface.  UV sphere (not ico) is used because the
    primitive_uv_sphere_add operator auto-creates a 'UVMap' UV layer, matching
    the name we assign to curves_data.surface_uv_map.  That string pairing is
    what sculpt-mode grooming and the GN 'Deform Curves on Surface' modifier
    use to snap roots to the surface.
    """
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=SPHERE_R,
        segments=32,
        ring_count=16,
        enter_editmode=False,
        location=(0, 0, 0),
    )
    sphere_ob = bpy.context.active_object
    sphere_ob.name = SURFACE_NAME
    return sphere_ob


# ── Build hair curves ─────────────────────────────────────────────────────────

def build_hair_curves(surface_ob: bpy.types.Object) -> bpy.types.Object:
    """
    Create a bpy.types.Curves block with N_STRANDS guide strands.

    Geometry pipeline:
      1. add_curves(counts) — declares topology; positions zeroed.
      2. Write position flat array to 'position' attribute (auto-exists).
      3. Create 'radius' attribute; write taper values.
      4. Create 'surface_uv_coordinate' attribute on CURVE domain; write UVs.
      5. Set surface + uv_map binding for sculpt tools.
    """
    curves_data: bpy.types.Curves = bpy.data.curves.new(HAIR_NAME, type='CURVES')

    # Topology first — one entry per strand, value = point count in that strand.
    # add_curves() creates the offset array; total POINT count = sum(counts).
    counts = [SEG_COUNT] * N_STRANDS
    curves_data.add_curves(counts)
    total_pts = N_STRANDS * SEG_COUNT

    pos_flat = np.zeros(total_pts * 3, dtype=np.float32)  # [x0,y0,z0, x1,y1,z1, …]
    rad_flat = np.zeros(total_pts,     dtype=np.float32)

    normals = _fibonacci_upper_hemisphere(N_STRANDS)

    for si, (nx, ny, nz) in enumerate(normals):
        rx, ry, rz = nx * SPHERE_R, ny * SPHERE_R, nz * SPHERE_R  # root on surface

        for pi in range(SEG_COUNT):
            t  = pi / (SEG_COUNT - 1)    # 0.0 at root, 1.0 at tip
            g  = GRAVITY * t * t          # quadratic — droop grows rapidly near tip

            # Grow direction: outward normal rotated toward -Z by gravity factor.
            dx = nx * (1.0 - g)
            dy = ny * (1.0 - g)
            dz = nz * (1.0 - g) - g      # gravity adds a -Z component
            mag = math.sqrt(dx * dx + dy * dy + dz * dz)
            if mag > 1e-8:
                dx /= mag; dy /= mag; dz /= mag

            arc = STRAND_LENGTH * t
            bi  = (si * SEG_COUNT + pi) * 3
            pos_flat[bi]     = rx + dx * arc
            pos_flat[bi + 1] = ry + dy * arc
            pos_flat[bi + 2] = rz + dz * arc
            rad_flat[si * SEG_COUNT + pi] = ROOT_RADIUS + (TIP_RADIUS - ROOT_RADIUS) * t

    # 'position' is auto-created by add_curves() — no .new() call needed.
    # foreach_set expects a C-contiguous flat sequence: len == total_pts * 3.
    curves_data.attributes['position'].data.foreach_set('vector', pos_flat)

    # 'radius' is NOT auto-created — register the attribute before writing.
    rad_attr = curves_data.attributes.new('radius', 'FLOAT', 'POINT')
    rad_attr.data.foreach_set('value', rad_flat)

    # Surface UV per strand (CURVE domain, FLOAT2 — 2 floats per curve).
    # Blender's sculpt-mode grooming reads these when snapping roots to surface.
    uv_flat = np.zeros(N_STRANDS * 2, dtype=np.float32)
    for si, (nx, ny, nz) in enumerate(normals):
        u, v = _sphere_uv(nx, ny, nz)
        uv_flat[si * 2]     = u
        uv_flat[si * 2 + 1] = v
    surf_uv = curves_data.attributes.new('surface_uv_coordinate', 'FLOAT2', 'CURVE')
    surf_uv.data.foreach_set('vector', uv_flat)

    # Bind the surface so sculpt tools and the GN 'Deform Curves on Surface'
    # modifier can resolve root positions relative to the surface topology.
    curves_data.surface = surface_ob
    curves_data.surface_uv_map = "UVMap"   # must match UV layer name on surface_ob

    hair_ob = bpy.data.objects.new(HAIR_NAME, curves_data)
    bpy.context.collection.objects.link(hair_ob)
    return hair_ob


# ── GLB export ────────────────────────────────────────────────────────────────

def export_glb(hair_ob: bpy.types.Object, surface_ob: bpy.types.Object) -> None:
    """
    Blender 5.1 GLTF exporter does not support the Curves data type — the
    object is silently skipped.  The headless-safe path is depsgraph evaluation:
      evaluated_get(dg) → new_from_object() → mesh with poly-line edges.
    The resulting mesh renders as POINTS / LINE_STRIP primitives in Three.js,
    which is the correct representation for stylised hair in WebXR.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    dg = bpy.context.evaluated_depsgraph_get()
    ev = hair_ob.evaluated_get(dg)
    strand_mesh = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True,
                                                   depsgraph=dg)
    strand_mesh.name = HAIR_NAME + "_Export"
    export_ob = bpy.data.objects.new(HAIR_NAME + "_Export", strand_mesh)
    bpy.context.collection.objects.link(export_ob)

    bpy.ops.object.select_all(action='DESELECT')
    export_ob.select_set(True)
    surface_ob.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )

    bpy.data.objects.remove(export_ob, do_unlink=True)
    bpy.data.meshes.remove(strand_mesh, do_unlink=True)
    print(f"[HF] Exported → {OUTPUT_GLB}")


# ── Entry point ───────────────────────────────────────────────────────────────

def run() -> None:
    for name in (SURFACE_NAME, HAIR_NAME, HAIR_NAME + "_Export"):
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)

    surface_ob = build_surface()
    hair_ob    = build_hair_curves(surface_ob)

    surface_ob["holoflow:facet"] = 0
    hair_ob["holoflow:facet"]    = 0

    export_glb(hair_ob, surface_ob)
    print(f"[HF] Done — {N_STRANDS} strands × {SEG_COUNT} pts = {N_STRANDS * SEG_COUNT} total points")


run()
