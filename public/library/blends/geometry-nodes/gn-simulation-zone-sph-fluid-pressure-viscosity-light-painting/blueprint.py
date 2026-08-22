"""
GN Simulation Zone — Smoothed Particle Hydrodynamics (SPH) Blender 5.1
Reference: Müller, Charypar, Gross "Particle-Based Fluid Simulation for
Interactive Applications" SCA 2003  https://matthias-research.github.io/pages/publications/sca03.pdf

Kernels (1-neighbour GN approximation)
  Pressure  f_p = K_P · max(0, H − dist) · normalize(sep_ij)
  Viscosity f_v = K_V · (vel_j − vel_i)
  Boundary  bowl XZ repulsion + floor Y repulsion
  Integrator: symplectic Euler (vel then pos)

Why IndexOfNearest over BlurAttribute?
  BlurAttribute averages over mesh edge-graph — correct for continua
  (cloth, wave). SPH requires spatial proximity not graph adjacency.
  IndexOfNearest is the only GN node that queries actual 3-D distance,
  giving a physically meaningful kernel support query.
"""

import bpy, bmesh
from math import pi, sqrt, cos, sin

SLUG        = "hf_sph_fluid"
N_PART      = 320
EMIT_R      = 0.60
EMIT_H      = 0.40
SPH_H       = 0.35
K_PRESS     = 18.0
K_VISC      = 0.25
GRAVITY     = -6.0
K_WALL      = 14.0
BOWL_R      = 0.85
BOWL_FLOOR  = -0.55
DT          = 1.0 / 24.0
EMIT_VEL    = 1.2

# ── Cleanup ───────────────────────────────────────────────────────────────────
for n in [SLUG, SLUG + "_mat", SLUG]:
    for col in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        if n in col: col.remove(col[n])

# ── Emitter mesh (spiral column) ──────────────────────────────────────────────
# Spiral prevents t=0 stacking: every particle starts in a distinct neighbourhood.
me = bpy.data.meshes.new(SLUG)
bm = bmesh.new()
vl = bm.verts.layers.float_vector.new("vel")
for i in range(N_PART):
    t = i / N_PART
    a = t * 6 * pi
    r = EMIT_R * sqrt(t + 0.05)
    y = EMIT_H * (1.0 - t)
    v = bm.verts.new((r * cos(a), y, r * sin(a)))
    v[vl] = (-EMIT_VEL * sin(a), -0.5, EMIT_VEL * cos(a))
bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new(SLUG, me)
bpy.context.scene.collection.objects.link(ob)
bpy.context.scene.frame_start, bpy.context.scene.frame_end = 1, 120

# ── Velocity-magnitude emission material ──────────────────────────────────────
# Length of "vel" attribute drives B-Spline colour ramp:
#   0.0 → violet (slow, pooled)  1.2 → cyan  2.5 → white (fast, falling)
mat = bpy.data.materials.new(SLUG + "_mat")
mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()
def mn(t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items(): setattr(n, k, v)
    return n
def ml(a, b): nt.links.new(a, b)

attr = mn("ShaderNodeAttribute"); attr.attribute_name = "vel"
vmag = mn("ShaderNodeVectorMath"); vmag.operation = "LENGTH"
ramp = mn("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "B_SPLINE"
s    = ramp.color_ramp.elements
s[0].position, s[0].color = 0.00, (0.10, 0.00, 0.55, 1)
s.new(0.35).color = (0.00, 0.65, 0.90, 1)
s.new(0.70).color = (0.10, 0.90, 0.10, 1)
s[1].position, s[1].color = 1.00, (1.00, 1.00, 1.00, 1)
emi  = mn("ShaderNodeEmission"); emi.inputs["Strength"].default_value = 8.0
out  = mn("ShaderNodeOutputMaterial")
ml(attr.outputs["Vector"], vmag.inputs[0])
ml(vmag.outputs["Value"],  ramp.inputs["Fac"])
ml(ramp.outputs["Color"],  emi.inputs["Color"])
ml(emi.outputs["Emission"], out.inputs["Surface"])
ob.data.materials.append(mat)

# ── Geometry Nodes modifier ────────────────────────────────────────────────────
ng  = bpy.data.node_groups.new(SLUG, "GeometryNodeTree")
mod = ob.modifiers.new("SPH", "NODES"); mod.node_group = ng

def N(t, **kw):
    n = ng.nodes.new(t)
    for k, v in kw.items(): setattr(n, k, v)
    return n
def L(a, b): ng.links.new(a, b)

ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
gi = N("NodeGroupInput"); go = N("NodeGroupOutput")

# Simulation zone — state item "vel" persists frame-to-frame on POINT domain
sim_i = N("GeometryNodeSimulationInput")
sim_o = N("GeometryNodeSimulationOutput")
sim_i.pair_with_output(sim_o)
si = sim_i.state_items.new("FLOAT_VECTOR", "vel"); si.attribute_domain = "POINT"
L(gi.outputs["Geometry"], sim_i.inputs["Geometry"])

pos   = N("GeometryNodeInputPosition")
vel_a = N("GeometryNodeInputNamedAttribute", data_type="FLOAT_VECTOR")
vel_a.inputs["Name"].default_value = "vel"

# IndexOfNearest — spatial search (not graph search)
ion   = N("GeometryNodeIndexOfNearest")
sp_p  = N("GeometryNodeSampleIndex", data_type="FLOAT_VECTOR"); sp_p.domain = "POINT"
sp_v  = N("GeometryNodeSampleIndex", data_type="FLOAT_VECTOR"); sp_v.domain = "POINT"

# Separation, distance, normalised direction
sep   = N("ShaderNodeVectorMath", operation="SUBTRACT")
dist  = N("ShaderNodeVectorMath", operation="LENGTH")
nrm   = N("ShaderNodeVectorMath", operation="NORMALIZE")

# Pressure: K_P · max(0, H − dist)
hmd   = N("ShaderNodeMath", operation="SUBTRACT"); hmd.inputs[0].default_value = SPH_H
clmp  = N("ShaderNodeMath", operation="MAXIMUM");  clmp.inputs[1].default_value = 0.0
fpm   = N("ShaderNodeMath", operation="MULTIPLY"); fpm.inputs[1].default_value = K_PRESS
fp    = N("ShaderNodeVectorMath", operation="SCALE")

# Viscosity: K_V · (v_j − v_i)
vdif  = N("ShaderNodeVectorMath", operation="SUBTRACT")
fv    = N("ShaderNodeVectorMath", operation="SCALE"); fv.inputs["Scale"].default_value = K_VISC

# Gravity (pre-scaled by DT for additive simplicity)
gvec  = N("FunctionNodeInputVector"); gvec.vector = (0.0, GRAVITY * DT, 0.0)

# Bowl XZ boundary
sx    = N("ShaderNodeSeparateXYZ")
cxz   = N("ShaderNodeCombineXYZ")
xzl   = N("ShaderNodeVectorMath", operation="LENGTH")
xze   = N("ShaderNodeMath", operation="SUBTRACT"); xze.inputs[0].default_value = BOWL_R
xzcl  = N("ShaderNodeMath", operation="MAXIMUM");  xzcl.inputs[1].default_value = 0.0
xzn   = N("ShaderNodeVectorMath", operation="NORMALIZE")
wsc   = N("ShaderNodeMath", operation="MULTIPLY");  wsc.inputs[1].default_value = -K_WALL
fbx   = N("ShaderNodeVectorMath", operation="SCALE")

# Floor boundary
fly   = N("ShaderNodeMath", operation="SUBTRACT"); fly.inputs[0].default_value = BOWL_FLOOR
flcl  = N("ShaderNodeMath", operation="MAXIMUM");  flcl.inputs[1].default_value = 0.0
flsc  = N("ShaderNodeMath", operation="MULTIPLY");  flsc.inputs[1].default_value = K_WALL
yv    = N("FunctionNodeInputVector"); yv.vector = (0.0, 1.0, 0.0)
fby   = N("ShaderNodeVectorMath", operation="SCALE")

# Sum forces → vel_new = vel_i + Σf·DT
s1 = N("ShaderNodeVectorMath", operation="ADD")
s2 = N("ShaderNodeVectorMath", operation="ADD")
s3 = N("ShaderNodeVectorMath", operation="ADD")
s4 = N("ShaderNodeVectorMath", operation="ADD")
fdt = N("ShaderNodeVectorMath", operation="SCALE"); fdt.inputs["Scale"].default_value = DT
vn  = N("ShaderNodeVectorMath", operation="ADD")   # vel_new

# pos_new = pos_i + vel_new·DT  (symplectic: uses vel_new not vel_i)
pdt = N("ShaderNodeVectorMath", operation="SCALE"); pdt.inputs["Scale"].default_value = DT
pn  = N("ShaderNodeVectorMath", operation="ADD")   # pos_new

# Wiring — neighbour lookup
for geom in (sp_p, sp_v, ion):
    L(sim_i.outputs["Geometry"], geom.inputs["Geometry"])
L(ion.outputs["Index"], sp_p.inputs["Index"])
L(ion.outputs["Index"], sp_v.inputs["Index"])
L(pos.outputs["Position"],     sp_p.inputs["Value"])
L(vel_a.outputs["Attribute"],  sp_v.inputs["Value"])

# Pressure
L(pos.outputs["Position"],    sep.inputs[0])
L(sp_p.outputs["Value"],      sep.inputs[1])
L(sep.outputs["Vector"],      dist.inputs[0])
L(sep.outputs["Vector"],      nrm.inputs[0])
L(dist.outputs["Value"],      hmd.inputs[1])
L(hmd.outputs["Value"],       clmp.inputs[0])
L(clmp.outputs["Value"],      fpm.inputs[0])
L(fpm.outputs["Value"],       fp.inputs["Scale"])
L(nrm.outputs["Vector"],      fp.inputs[0])

# Viscosity
L(sp_v.outputs["Value"],      vdif.inputs[0])
L(vel_a.outputs["Attribute"], vdif.inputs[1])
L(vdif.outputs["Vector"],     fv.inputs[0])

# Bowl XZ
L(pos.outputs["Position"], sx.inputs[0])
L(sx.outputs["X"], cxz.inputs["X"]); L(sx.outputs["Z"], cxz.inputs["Z"])
L(cxz.outputs["Vector"], xzl.inputs[0])
L(cxz.outputs["Vector"], xzn.inputs[0])
L(xzl.outputs["Value"],  xze.inputs[1])
L(xze.outputs["Value"],  xzcl.inputs[0])
L(xzcl.outputs["Value"], wsc.inputs[0])
L(wsc.outputs["Value"],  fbx.inputs["Scale"])
L(xzn.outputs["Vector"], fbx.inputs[0])

# Floor
L(sx.outputs["Y"],          fly.inputs[1])
L(fly.outputs["Value"],     flcl.inputs[0])
L(flcl.outputs["Value"],    flsc.inputs[0])
L(flsc.outputs["Value"],    fby.inputs["Scale"])
L(yv.outputs["Vector"],     fby.inputs[0])

# Force summation
L(fp.outputs["Vector"],  s1.inputs[0]); L(fv.outputs["Vector"],   s1.inputs[1])
L(s1.outputs["Vector"],  s2.inputs[0]); L(gvec.outputs["Vector"], s2.inputs[1])
L(s2.outputs["Vector"],  s3.inputs[0]); L(fbx.outputs["Vector"],  s3.inputs[1])
L(s3.outputs["Vector"],  s4.inputs[0]); L(fby.outputs["Vector"],  s4.inputs[1])
L(s4.outputs["Vector"],  fdt.inputs[0])
L(vel_a.outputs["Attribute"], vn.inputs[0]); L(fdt.outputs["Vector"], vn.inputs[1])

# Symplectic position update
L(vn.outputs["Vector"],       pdt.inputs[0])
L(pos.outputs["Position"],    pn.inputs[0])
L(pdt.outputs["Vector"],      pn.inputs[1])

# Store vel_new → SetPosition → SetPointRadius → SimOut
st = N("GeometryNodeStoreNamedAttribute", data_type="FLOAT_VECTOR"); st.domain = "POINT"
st.inputs["Name"].default_value = "vel"
sp2 = N("GeometryNodeSetPosition")
spr = N("GeometryNodeSetPointRadius")
vl2 = N("ShaderNodeVectorMath", operation="LENGTH")
rsc = N("ShaderNodeMath", operation="MULTIPLY"); rsc.inputs[1].default_value = 0.006
rad = N("ShaderNodeMath", operation="ADD");      rad.inputs[0].default_value = 0.012

L(sim_i.outputs["Geometry"],  st.inputs["Geometry"])
L(vn.outputs["Vector"],       st.inputs["Value"])
L(st.outputs["Geometry"],     sp2.inputs["Geometry"])
L(pn.outputs["Vector"],       sp2.inputs["Position"])
L(vn.outputs["Vector"],       vl2.inputs[0])
L(vl2.outputs["Value"],       rsc.inputs[0])
L(rsc.outputs["Value"],       rad.inputs[1])
L(sp2.outputs["Geometry"],    spr.inputs["Geometry"])
L(rad.outputs["Value"],       spr.inputs["Radius"])
L(spr.outputs["Geometry"],    sim_o.inputs["Geometry"])
L(sim_o.outputs["Geometry"],  go.inputs["Geometry"])

# ── EEVEE settings ────────────────────────────────────────────────────────────
bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
bpy.context.scene.eevee.use_bloom = True
bpy.context.scene.eevee.bloom_intensity = 0.30

print(f"[SPH] {N_PART} particles | H={SPH_H} K_P={K_PRESS} K_V={K_VISC}")
