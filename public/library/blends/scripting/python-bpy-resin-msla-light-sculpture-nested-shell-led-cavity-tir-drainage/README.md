# Resin MSLA Light Sculpture — Nested Shell, LED Cavity & TIR Drainage
## Blender 5.1 · Python bpy · CC0 · Holoflow Studio

A headless Python script that builds a two-part waveguide light sculpture
ready for MSLA resin printing on the Elegoo Saturn (or any mono-LCD SLA printer).

### What it builds

```
  ┌─────────────────────────────────┐
  │  Outer shell  (hf_sculpture_outer.stl)
  │   • Sub=2 icosphere, flat-shaded, OUTER_R = 50 mm
  │   • Wall thickness 2 mm
  │   • LED cavity Ø 5.4 mm at −Z pole
  │   • 6 × Ø 2 mm drainage holes at 55° below equator
  │
  │  Inner core   (hf_sculpture_inner.stl)
  │   • Sub=4 icosphere, smooth, INNER_R = 48 mm
  │   • Clear/translucent photopolymer resin
  │   • Acts as TIR waveguide; LED couples at base cavity
  └─────────────────────────────────┘
```

### TIR physics
Total internal reflection in photopolymer resin (n ≈ 1.49):
- Critical angle θ_c = arcsin(1/1.49) ≈ **42.2°**
- Light rays inside the core at > 42.2° from surface normal are trapped
- Drainage holes sit at 55° below the equator → 7° clear of the TIR cone

### Running the script

```bash
# Run in headless mode (no display required):
blender --background --python blueprint.py

# Outputs:
#   hf_sculpture_outer.stl   ← outer shell for slicer
#   hf_sculpture_inner.stl   ← waveguide core for slicer
#   hf_light_sculpture_preview.glb  ← WebXR preview
```

### Elegoo Saturn print settings (recommended)

| Layer thickness | Exposure (base) | Exposure (normal) |
|-----------------|-----------------|-------------------|
| 50 μm           | 30 s            | 2.8 s             |

Print inner core in clear resin. Print outer shell in desired colour resin.
Post-cure separately; sand the inner core to optical clarity.

### Cross-references
- Codex: [Waveguide Object](/codex/waveguide-object)
- Codex: [Waveguide Optics Deep Dive](/codex/waveguide-optics-deep-dive)
- Tutorial: [Hollow Shell Python](/tutorials/blender-tutorial-python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr)
- Tutorial: [3D Print Mesh Analysis](/tutorials/blender-tutorial-python-3d-print-mesh-analysis)
