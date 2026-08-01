"""
record.py — Viewport animation render for SDF CSG Poi Head.
Outputs:
    public/library/videos/scripting/
    python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr/
    viewport.mp4

Builds the scene (calls the same SDF + Surface Nets logic), then renders
a 10-second slow orbit revealing the concave dome and equatorial ring.

Run:
    blender --python record.py
"""

import bpy, bmesh, numpy as np, math, os

# ── Constants (must match blueprint.py) ───────────────────────────────────────
GRID_N   = 72;  BBOX    = 1.05;  ISO      = 0.0
SMOOTH_K = 0.12; BODY_R  = 0.44; RING_R   = 0.39; RING_T  = 0.055
DOME_OFS = 0.27; DOME_R  = 0.42; STEM_R   = 0.046; STEM_LEN = 0.30
OBJECT_N = "hf_sdf_csg_poi_anim"
FPS      = 30;  N_FRAMES = 300   # 10 s orbit

VIDEO_DIR = ("//../../videos/scripting/"
             "python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr/")

# ── SDF + Boolean ops (inline) ────────────────────────────────────────────────

def sdf_sphere(pts, r):
    return np.linalg.norm(pts, axis=-1) - r

def sdf_torus(pts, R, r):
    xz = np.linalg.norm(np.stack([pts[:, 0], pts[:, 2]], axis=-1), axis=-1) - R
    return np.sqrt(xz ** 2 + pts[:, 1] ** 2) - r

def sdf_capsule(pts, a, b, r):
    a, b   = np.asarray(a, np.float32), np.asarray(b, np.float32)
    ab     = b - a
    denom  = float(np.dot(ab, ab)) + 1e-12
    t      = np.clip(np.einsum('ij,j->i', pts - a, ab) / denom, 0.0, 1.0)
    return np.linalg.norm(pts - (a + t[:, None] * ab), axis=-1) - r

def op_smin(a, b, k=SMOOTH_K):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return a * h + b * (1.0 - h) - k * h * (1.0 - h)

def op_smax(a, b, k=SMOOTH_K):  return -op_smin(-a, -b, k)
def op_sdiff(a, b, k=SMOOTH_K): return op_smax(a, -b, k)

def scene_poi(pts):
    body  = sdf_sphere(pts, BODY_R)
    ring  = sdf_torus(pts, RING_R, RING_T)
    shell = op_smin(body, ring)
    dome  = sdf_sphere(pts - np.float32([0.0, DOME_OFS, 0.0]), DOME_R)
    shape = op_sdiff(shell, dome, k=SMOOTH_K * 0.55)
    stem  = sdf_capsule(pts, (0, -BODY_R+0.04, 0), (0, -BODY_R-STEM_LEN, 0), STEM_R)
    return op_smin(shape, stem, k=0.07)

# ── Build mesh ────────────────────────────────────────────────────────────────
coords   = np.linspace(-BBOX, BBOX, GRID_N, dtype=np.float32)
X, Y, Z  = np.meshgrid(coords, coords, coords, indexing='ij')
pts_flat = np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=-1)
F        = scene_poi(pts_flat).reshape(GRID_N, GRID_N, GRID_N)
INSIDE   = F < ISO
N = GRID_N
mark = np.zeros((N, N, N), dtype=bool)
FWDS = ((0,1,0,0),(1,0,1,0),(2,0,0,1))
for ax, di, dj, dk in FWDS:
    lo = [slice(None)]*3; lo[ax] = slice(None,N-1)
    hi = [slice(None)]*3; hi[ax] = slice(1,None)
    diff = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
    mark[tuple(lo)] |= diff; mark[tuple(hi)] |= diff
surf_ijk = np.argwhere(mark); M = len(surf_ijk)
verts_w  = np.empty((M, 3), dtype=np.float32); cell_map = {}
for m, (ci,cj,ck) in enumerate(surf_ijk):
    ep = []
    for ax, di, dj, dk in FWDS:
        ni,nj,nk = ci+di,cj+dj,ck+dk
        if ni<N and nj<N and nk<N:
            va,vb = float(F[ci,cj,ck]),float(F[ni,nj,nk])
            if (va<ISO)!=(vb<ISO):
                t=(ISO-va)/(vb-va+1e-12)
                ep.append(np.array([coords[ci],coords[cj],coords[ck]])+t*(np.array([coords[ni],coords[nj],coords[nk]])-np.array([coords[ci],coords[cj],coords[ck]])))
    verts_w[m]=np.mean(ep,axis=0) if ep else np.array([coords[ci],coords[cj],coords[ck]])
    cell_map[(ci,cj,ck)]=m
faces = []
for ci,cj,ck in surf_ijk:
    for ax,di,dj,dk in FWDS:
        ni,nj,nk=ci+di,cj+dj,ck+dk
        if ni>=N or nj>=N or nk>=N: continue
        if INSIDE[ci,cj,ck]==INSIDE[ni,nj,nk]: continue
        if ax==0: ring=[(ci,cj,ck),(ci,cj-1,ck),(ci,cj-1,ck-1),(ci,cj,ck-1)]
        elif ax==1: ring=[(ci,cj,ck),(ci-1,cj,ck),(ci-1,cj,ck-1),(ci,cj,ck-1)]
        else: ring=[(ci,cj,ck),(ci-1,cj,ck),(ci-1,cj-1,ck),(ci,cj-1,ck)]
        ids=[cell_map.get(r) for r in ring]
        if all(v is not None for v in ids):
            faces.append(ids if INSIDE[ci,cj,ck] else ids[::-1])

for o in list(bpy.data.objects):
    if o.name.startswith(OBJECT_N): bpy.data.objects.remove(o,do_unlink=True)
mesh=bpy.data.meshes.new(OBJECT_N); bm=bmesh.new()
bvs=[bm.verts.new(v.tolist()) for v in verts_w]; bm.verts.ensure_lookup_table()
for f in faces:
    try: bm.faces.new([bvs[i] for i in f])
    except ValueError: pass
bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-4)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
bm.to_mesh(mesh); bm.free(); mesh.update()
obj=bpy.data.objects.new(OBJECT_N,mesh)
bpy.context.collection.objects.link(obj)
obj.rotation_euler=(math.radians(-90),0,0)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True); bpy.context.view_layer.objects.active=obj
bpy.ops.object.transform_apply(rotation=True)

# Material
mat=bpy.data.materials.new("HF_SDF_REC"); mat.use_nodes=True
b=mat.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value=(0.46,0.10,0.88,1)
b.inputs["Emission Color"].default_value=(0.46,0.10,0.88,1)
b.inputs["Emission Strength"].default_value=2.5
b.inputs["Metallic"].default_value=0.3; b.inputs["Roughness"].default_value=0.3
obj.data.materials.append(mat)

# ── Orbit camera ─────────────────────────────────────────────────────────────
bpy.context.scene.frame_start=1; bpy.context.scene.frame_end=N_FRAMES
bpy.context.scene.render.fps=FPS
bpy.context.scene.render.resolution_x=1920; bpy.context.scene.render.resolution_y=1080

cam_data=bpy.data.cameras.new("RecCam"); cam_data.lens=85
cam=bpy.data.objects.new("RecCam",cam_data)
bpy.context.collection.objects.link(cam); bpy.context.scene.camera=cam

# Insert keyframes for a full 360° orbit at distance 2.6 m, tilt 20° above equator
orbit_r=2.6; orbit_tilt=math.radians(20)
for fr in range(1, N_FRAMES+1):
    angle=2*math.pi*(fr-1)/N_FRAMES
    cam.location=(orbit_r*math.sin(angle)*math.cos(orbit_tilt),
                  -orbit_r*math.cos(angle)*math.cos(orbit_tilt),
                  orbit_r*math.sin(orbit_tilt))
    # Point camera at origin
    dx,dy,dz=-cam.location[0],-cam.location[1],-cam.location[2]
    cam.rotation_euler=(math.atan2(math.sqrt(dx**2+dy**2),dz)-math.pi/2,
                        0,
                        math.atan2(dx,dy)+math.pi)
    cam.keyframe_insert("location",frame=fr)
    cam.keyframe_insert("rotation_euler",frame=fr)

# Lighting
sun=bpy.data.lights.new("Sun","SUN"); sun.energy=5.0; sun.color=(0.95,0.9,1.0)
so=bpy.data.objects.new("Sun",sun); bpy.context.collection.objects.link(so)
so.location=(2,2,4)

# EEVEE Next render
bpy.context.scene.render.engine="BLENDER_EEVEE_NEXT"
bpy.context.scene.eevee.use_bloom=True; bpy.context.scene.eevee.bloom_intensity=0.18
bpy.context.scene.render.filepath=bpy.path.abspath(VIDEO_DIR)
bpy.context.scene.render.image_settings.file_format="FFMPEG"
bpy.context.scene.render.ffmpeg.format="MPEG4"
bpy.context.scene.render.ffmpeg.codec="H264"
bpy.context.scene.render.ffmpeg.constant_rate_factor="MEDIUM"
os.makedirs(bpy.path.abspath(VIDEO_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)
print("[HF] Record complete → viewport.mp4")
