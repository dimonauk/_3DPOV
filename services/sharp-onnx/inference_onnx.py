#!/usr/bin/env python3
"""ONNX Inference Script for SHARP Model.

Loads an ONNX model (fp32 or fp16), runs inference on an input image,
and exports the result as a PLY file.

Usage:
    # Convert and validate FP16 model
    python convert_onnx.py -o sharp_fp16.onnx -q fp16 --validate

    # Run inference with FP16 model
    python inference_onnx.py -m sharp_fp16.onnx -i test.png -o test.ply -d 0.5
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from plyfile import PlyData, PlyElement

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
LOGGER = logging.getLogger(__name__)

DEFAULT_HEIGHT = 1536
DEFAULT_WIDTH = 1536


def linear_to_srgb(linear: float) -> float:
    if linear <= 0.0031308:
        return linear * 12.92
    return 1.055 * pow(linear, 1.0 / 2.4) - 0.055


def rgb_to_sh(rgb: float) -> float:
    coeff_degree0 = 1.0 / np.sqrt(4.0 * np.pi)
    return (rgb - 0.5) / coeff_degree0


def inverse_sigmoid(x: float) -> float:
    x = np.clip(x, 1e-6, 1.0 - 1e-6)
    return np.log(x / (1.0 - x))


def preprocess_image(image_path: str | Path, target_size: tuple[int, int] = (DEFAULT_HEIGHT, DEFAULT_WIDTH)):
    """Load and preprocess an image for ONNX inference."""
    image_path = Path(image_path)
    target_h, target_w = target_size

    img = Image.open(image_path)
    original_size = img.size
    focal_length_px = original_size[0]

    if img.size != (target_w, target_h):
        img = img.resize((target_w, target_h), Image.BILINEAR)

    img_np = np.array(img, dtype=np.float32) / 255.0

    if img_np.shape[2] == 4:
        img_np = img_np[:, :, :3]

    img_np = np.transpose(img_np, (2, 0, 1))
    img_np = np.expand_dims(img_np, axis=0)

    LOGGER.info(f"Loaded image: {image_path}, original size: {original_size}")
    LOGGER.info(f"Preprocessed shape: {img_np.shape}, range: [{img_np.min():.4f}, {img_np.max():.4f}]")

    return img_np, float(focal_length_px), original_size


def run_inference(onnx_path: str | Path, image: np.ndarray, disparity_factor: float = 1.0) -> dict[str, np.ndarray]:
    """Run ONNX inference on the preprocessed image."""
    onnx_path = Path(onnx_path)

    LOGGER.info(f"Loading ONNX model: {onnx_path}")
    
    # Configure session to suppress constant folding warnings for FP16 ops
    # These warnings are benign - FP16 Sqrt/Tile ops run correctly but can't be pre-folded
    sess_options = ort.SessionOptions()
    sess_options.log_severity_level = 3  # 0=Verbose, 1=Info, 2=Warning, 3=Error, 4=Fatal
    
    # Use CPUExecutionProvider for universal compatibility
    # Works on all platforms and handles large models with external data files
    session = ort.InferenceSession(str(onnx_path), sess_options, providers=['CPUExecutionProvider'])
    LOGGER.info("Using CPUExecutionProvider for inference")

    input_names = [inp.name for inp in session.get_inputs()]
    output_names = [out.name for out in session.get_outputs()]

    LOGGER.info(f"Input names: {input_names}")
    LOGGER.info(f"Output names: {output_names}")

    inputs = {
        "image": image.astype(np.float32),
        "disparity_factor": np.array([disparity_factor], dtype=np.float32)
    }

    LOGGER.info("Running inference...")
    raw_outputs = session.run(None, inputs)

    outputs = {}

    if len(raw_outputs) == 1:
        concat = raw_outputs[0]
        sizes = [3, 3, 4, 3, 1]
        names = [
            "mean_vectors_3d_positions",
            "singular_values_scales",
            "quaternions_rotations",
            "colors_rgb_linear",
            "opacities_alpha_channel"
        ]
        start = 0
        for name, size in zip(names, sizes):
            outputs[name] = concat[:, :, start:start + size]
            start += size
    elif len(raw_outputs) == 5:
        names = [
            "mean_vectors_3d_positions",
            "singular_values_scales",
            "quaternions_rotations",
            "colors_rgb_linear",
            "opacities_alpha_channel"
        ]
        for name, out in zip(names, raw_outputs):
            outputs[name] = out
    else:
        for name, out in zip(output_names, raw_outputs):
            outputs[name] = out

    for name, arr in outputs.items():
        LOGGER.info(f"  {name}: shape {arr.shape}")

    return outputs


def export_ply(outputs: dict[str, np.ndarray], output_path: str | Path,
               focal_length_px: float, image_shape: tuple[int, int],
               decimation: float = 1.0, depth_scale: float = 1.0) -> None:
    """Export Gaussians to PLY file format."""
    output_path = Path(output_path)

    mean_vectors = outputs["mean_vectors_3d_positions"]
    singular_values = outputs["singular_values_scales"]
    quaternions = outputs["quaternions_rotations"]
    colors = outputs["colors_rgb_linear"]
    opacities = outputs["opacities_alpha_channel"]

    mean_vectors = mean_vectors[0]
    singular_values = singular_values[0]
    quaternions = quaternions[0]
    colors = colors[0]
    opacities = opacities[0]

    num_gaussians = mean_vectors.shape[0]
    LOGGER.info(f"Exporting {num_gaussians} Gaussians to PLY")

    if decimation < 1.0:
        log_scales = np.log(np.maximum(singular_values, 1e-10))
        scale_product = np.exp(np.sum(log_scales, axis=1))
        importance = scale_product * opacities

        indices = np.argsort(-importance)
        keep_count = max(1, int(num_gaussians * decimation))
        keep_indices = indices[:keep_count]
        keep_indices.sort()

        LOGGER.info(f"Decimating: keeping {keep_count} of {num_gaussians} ({decimation * 100:.1f}%)")

        mean_vectors = mean_vectors[keep_indices]
        singular_values = singular_values[keep_indices]
        quaternions = quaternions[keep_indices]
        colors = colors[keep_indices]
        opacities = opacities[keep_indices]
        num_gaussians = keep_count

    vertex_data = np.zeros(num_gaussians, dtype=[
        ('x', 'f4'), ('y', 'f4'), ('z', 'f4'),
        ('f_dc_0', 'f4'), ('f_dc_1', 'f4'), ('f_dc_2', 'f4'),
        ('opacity', 'f4'),
        ('scale_0', 'f4'), ('scale_1', 'f4'), ('scale_2', 'f4'),
        ('rot_0', 'f4'), ('rot_1', 'f4'), ('rot_2', 'f4'), ('rot_3', 'f4')
    ])

    # Model outputs [z*x_ndc, z*y_ndc, z] where z is normalized depth and x_ndc, y_ndc ∈ [-1, 1]
    # The model's depth is scale-invariant and normalized to a small range (typically ~0.5-0.7)
    # We need to:
    # 1. Expand the depth range for proper 3D relief
    # 2. Convert projective coords to camera space: x_cam = (z*x_ndc) / focal_ndc
    
    img_h, img_w = image_shape
    z_raw = mean_vectors[:, 2]
    
    # Normalize depth to start at 1.0 and scale for better 3D relief
    # depth_scale > 1.0 exaggerates depth differences (useful for flat scenes)
    z_min = np.min(z_raw)
    z_normalized = z_raw / z_min  # Now min depth = 1.0
    
    # Apply depth scale to exaggerate depth differences around the median
    if depth_scale != 1.0:
        z_median = np.median(z_normalized)
        z_normalized = z_median + (z_normalized - z_median) * depth_scale
    
    # Scale factor to convert from NDC to camera space
    # For a camera with focal length f and image width w: focal_ndc = 2*f/w
    # With f = w (90° FOV assumption): focal_ndc = 2.0
    focal_ndc = 2.0 * focal_length_px / img_w
    
    # Compute camera-space coordinates
    # The projective values need to be scaled by the same depth normalization
    scale_factor = 1.0 / (z_min * focal_ndc)
    
    vertex_data['x'] = mean_vectors[:, 0] * scale_factor
    vertex_data['y'] = mean_vectors[:, 1] * scale_factor
    vertex_data['z'] = z_normalized
    
    LOGGER.info(f"Depth range: {z_raw.min():.3f} - {z_raw.max():.3f} -> normalized: 1.0 - {z_normalized.max():.3f}")

    for i in range(num_gaussians):
        r, g, b = colors[i]
        srgb_r = linear_to_srgb(float(r))
        srgb_g = linear_to_srgb(float(g))
        srgb_b = linear_to_srgb(float(b))

        vertex_data['f_dc_0'][i] = rgb_to_sh(srgb_r)
        vertex_data['f_dc_1'][i] = rgb_to_sh(srgb_g)
        vertex_data['f_dc_2'][i] = rgb_to_sh(srgb_b)

    vertex_data['opacity'] = inverse_sigmoid(opacities)

    # Scale the Gaussian sizes to match the transformed coordinate space
    vertex_data['scale_0'] = np.log(np.maximum(singular_values[:, 0] * scale_factor, 1e-10))
    vertex_data['scale_1'] = np.log(np.maximum(singular_values[:, 1] * scale_factor, 1e-10))
    vertex_data['scale_2'] = np.log(np.maximum(singular_values[:, 2] / z_min, 1e-10))  # Z scale uses depth normalization

    vertex_data['rot_0'] = quaternions[:, 0]
    vertex_data['rot_1'] = quaternions[:, 1]
    vertex_data['rot_2'] = quaternions[:, 2]
    vertex_data['rot_3'] = quaternions[:, 3]

    vertex_element = PlyElement.describe(vertex_data, 'vertex')

    # Extrinsic: 4x4 identity matrix as 16 separate properties
    extrinsic_data = np.zeros(1, dtype=[('extrinsic', 'f4', (16,))])
    extrinsic_data['extrinsic'][0] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    extrinsic_element = PlyElement.describe(extrinsic_data, 'extrinsic')

    img_h, img_w = image_shape
    # Intrinsic: 3x3 matrix as 9 separate properties
    intrinsic_data = np.zeros(1, dtype=[('intrinsic', 'f4', (9,))])
    intrinsic_data['intrinsic'][0] = [focal_length_px, 0, img_w / 2, 0, focal_length_px, img_h / 2, 0, 0, 1]
    intrinsic_element = PlyElement.describe(intrinsic_data, 'intrinsic')

    # Image size: 2 separate uint32 properties
    image_size_data = np.zeros(1, dtype=[('image_size', 'u4', (2,))])
    image_size_data['image_size'][0] = [img_w, img_h]
    image_size_element = PlyElement.describe(image_size_data, 'image_size')

    # Frame: 2 separate int32 properties
    frame_data = np.zeros(1, dtype=[('frame', 'i4', (2,))])
    frame_data['frame'][0] = [1, num_gaussians]
    frame_element = PlyElement.describe(frame_data, 'frame')

    z_values = mean_vectors[:, 2]
    z_safe = np.maximum(z_values, 1e-6)
    disparities = 1.0 / z_safe
    disparities.sort()
    disparity_10 = disparities[int(len(disparities) * 0.1)] if len(disparities) > 0 else 0.0
    disparity_90 = disparities[int(len(disparities) * 0.9)] if len(disparities) > 0 else 1.0
    disparity_data = np.zeros(1, dtype=[('disparity', 'f4', (2,))])
    disparity_data['disparity'][0] = [disparity_10, disparity_90]
    disparity_element = PlyElement.describe(disparity_data, 'disparity')

    # Color space: single uchar property
    color_space_data = np.zeros(1, dtype=[('color_space', 'u1')])
    color_space_data['color_space'][0] = 1
    color_space_element = PlyElement.describe(color_space_data, 'color_space')

    # Version: 3 uchar properties
    version_data = np.zeros(1, dtype=[('version', 'u1', (3,))])
    version_data['version'][0] = [1, 5, 0]
    version_element = PlyElement.describe(version_data, 'version')

    PlyData([
        vertex_element,
        extrinsic_element,
        intrinsic_element,
        image_size_element,
        frame_element,
        disparity_element,
        color_space_element,
        version_element
    ], text=False).write(str(output_path))

    LOGGER.info(f"Saved PLY with {num_gaussians} Gaussians to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="ONNX Inference for SHARP - Generate 3D Gaussians from an image"
    )
    parser.add_argument("-m", "--model", type=str, required=True,
                        help="Path to ONNX model file")
    parser.add_argument("-i", "--input", type=str, required=True,
                        help="Path to input image")
    parser.add_argument("-o", "--output", type=str, required=True,
                        help="Path to output file (.ply)")
    parser.add_argument("-d", "--decimate", type=float, default=1.0,
                        help="Decimation ratio 0.0-1.0 (default: 1.0 = keep all)")
    parser.add_argument("--disparity-factor", type=float, default=1.0,
                        help="Disparity factor for depth conversion (default: 1.0)")
    parser.add_argument("--depth-scale", type=float, default=1.0,
                        help="Depth exaggeration factor (>1.0 increases 3D relief, default: 1.0)")

    args = parser.parse_args()

    # Preprocess image
    image, focal_length_px, image_shape = preprocess_image(args.input)

    # Run inference
    outputs = run_inference(args.model, image, args.disparity_factor)

    # Export to PLY
    export_ply(outputs, args.output, focal_length_px, image_shape, args.decimate, args.depth_scale)


if __name__ == "__main__":
    main()
