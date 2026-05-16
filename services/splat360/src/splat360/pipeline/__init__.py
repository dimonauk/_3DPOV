"""splat360.pipeline — the eight stages.

    1. ingest         — accept the submission, materialise to work dir
    2. metadata       — ExifTool + DJI telemetry box → poses CSV
    3. frames         — FFmpeg fps-decimate (video only)
    4. camera_model   — choose fisheye-pair / equirect / cubemap path
    5. sfm            — COLMAP or GLOMAP, with GPS priors when present
    6. train          — gsplat or Brush
    7. postprocess    — .ply → .splat / .ksplat, transient cleanup
    8. publish        — final URL + SplatRecord shape

Each stage is its own module. Stages communicate via the job working
directory on disk, not in-process state — so any stage can be re-run
or resumed independently.
"""
