# python-services

Bench-side Python that produces the meshes and data published on
this site. Copied verbatim from The Hangar
(`D:\The_Hangar\python-services\` and
`D:\The_Hangar\apps\prototypes\poi-sculptor\`) so the studio's
working tools live alongside the site that catalogues them.

These scripts are **not** run by the site at request time. They run
on the studio's workstation, produce files, and the files get
published into `/public/assets/`. Treat this directory as **source
material** &mdash; the website doesn't depend on a running Python
process.

## Files

### `morphing_engine.py`

Complete morphing-animation engine implementing fifteen-plus easing
functions. The TypeScript port at `lib/math/easing.ts` mirrors the
named-function API so browser-side animation matches the Python
that produced the design canon. Source: `python-services/morphing_engine.py`
in The Hangar.

### `choreography_engine.js`

JavaScript (ES module) version of the Laban-effort choreography
engine, including the eight Basic Efforts with hex colours and trail
widths, the nine-zone stage grid, and the camera-target switching
logic for FOSSIL_FOLLOW / WIDE_SIDE / ABOVE_ORBIT cinematic modes.
Source: `apps/prototypes/poi-sculptor/choreography_engine.js`.

### `fitness.py`

Multi-axis fitness evaluation for sculptural genomes. Scores each
genome on five axes (printability, optical, complexity, coherence,
novelty) and returns a weighted total in `0..5`. Requires `trimesh`
and `numpy`. Used by `generators.py` during evolution.

### `fresnel_generator.py`

Standalone Blender Python script. Generates parametric Fresnel zone
plates and lenses for resin printing. Computes zone radii from
`r_n = sqrt(n * lambda * f)` and emits a Blender mesh, optionally
exporting STL.

### `caustic_optimizer.py`

Caustic-pattern optimisation for transparent / refractive jewellery.
Computes the surface displacement field that maps an input
luminance image to a desired focal-plane caustic.

### `grin_generator.py`

GRIN (gradient-index) lens generator. Produces parametric lens
geometry with a radially-varying refractive-index profile encoded
as concentric shells.

### `generators.py`

Top-level dispatcher for biomimetic mesh generators &mdash;
phyllotaxis, dragon-scales, radial-sculpture, antlandscape-base,
modular-tree-arm. The meshes in `/public/assets/meshes/biomimetic/`
came out of this script.

### `genome.py`

Backwards-compatibility shim for the HoloFlow genome package. Genome
logic is modularised into `genome/` in The Hangar; here only the
shim is published. Gene names, ranges, crossover, mutation, and
tournament-selection are documented in
`/articles/how-the-studio-breeds-sculptures` (when written).

## License notes

The morphing engine and the easing functions descend from Robert
Penner's easing equations (BSD-license, attribution preserved in the
Python docstrings). The biomimetic generators and the fitness
scoring are studio-original. The choreography engine is studio-original
and references Laban Movement Analysis (Rudolf Laban, 1947) which is
in the public domain.
