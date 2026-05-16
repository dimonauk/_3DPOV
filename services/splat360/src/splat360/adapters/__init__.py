"""splat360.adapters — camera-specific quirks.

Each adapter knows:
  - the camera's file naming convention
  - where its telemetry lives (EXIF tag set, embedded MP4 box, SRT)
  - the fisheye lens calibration prior (FOV, principal point, distortion)
  - any oddities (Avata 360's rotating lenses; Osmo 360's IMU stream box)

The pipeline's metadata + ingest stages pick an adapter from the
submission's `camera` field and delegate camera-specific work to it.
"""
