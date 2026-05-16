"""
crews/sculpture_maker.py
========================
CrewAI multi-agent workflow for the Photo → Sculpture pipeline.

Four agents collaborate to take a light-painting photograph and produce a
print-ready STL:

  1. PhotoAnalyst  — examines the source image, identifies subject vs background,
                     measures dominant features (trail brightness, motion direction)
  2. DepthDesigner — proposes per-pixel depth values for Voxelorama based on
                     brightness/saturation analysis
  3. MeshSmith     — drives the mesh operations: voxelize, simplify, repair
  4. PrintValidator — confirms the final mesh is SLA-ready (watertight, sized,
                     poly count under farm limits)

The crew runs sequentially. Each agent has access to the same MCP tool surface
defined in ../mcp_server.py, exposed here as CrewAI-compatible tool shims.

Usage:
    from crews.sculpture_maker import run_sculpture_maker
    result = run_sculpture_maker(
        photo_path=r"D:\HoloFlow\projects\trail_001.png",
        max_print_size_mm=150,
        target_faces=20000,
    )
"""

from __future__ import annotations
import os
from pathlib import Path
from typing import Optional

try:
    from crewai import Agent, Task, Crew, Process
    from crewai.tools import tool
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False


# Import the underlying functions (NOT through MCP — direct Python calls are
# faster within the same process; MCP is for external clients like Claude Desktop)
import sys
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))

import pixelorama_bridge as pb
from mqtt_bus import emit_pipeline_stage


# ============================================================================
# Tool shims — wrap our existing functions as CrewAI tools
# ============================================================================

if CREWAI_AVAILABLE:

    @tool("Inspect mesh metadata")
    def inspect_mesh_tool(mesh_path: str) -> str:
        """Read mesh metadata: vertex/face count, watertight status, volume,
        bounding box, surface area. Input: absolute path to STL/OBJ/PLY."""
        try:
            import trimesh
            p = Path(mesh_path)
            if not p.exists():
                return f"ERROR: mesh not found at {mesh_path}"
            mesh = trimesh.load(p, force="mesh")
            return (
                f"vertices={len(mesh.vertices)}, faces={len(mesh.faces)}, "
                f"watertight={mesh.is_watertight}, volume_mm3={mesh.volume if mesh.is_volume else 'N/A'}, "
                f"bbox_mm={mesh.extents.tolist()}, area_mm2={mesh.area:.1f}"
            )
        except Exception as e:
            return f"ERROR: {e}"

    @tool("Voxelize mesh to occupancy grid")
    def voxelize_mesh_tool(mesh_path: str, pitch_mm: float = 10.0) -> str:
        """Voxelize an STL/OBJ to a 3D occupancy grid at the given pitch in mm.
        Returns path to the .npy grid + statistics."""
        try:
            import trimesh
            import numpy as np
            p = Path(mesh_path)
            mesh = trimesh.load(p, force="mesh")
            voxelized = mesh.voxelized(pitch=pitch_mm / 1000.0)
            voxelized.fill()
            grid = voxelized.matrix.astype(np.uint8)
            out = pb.BRIDGE_SCRATCH / f"{p.stem}_voxels_{int(pitch_mm)}mm.npy"
            np.save(out, grid)
            return (
                f"voxelized: shape={list(grid.shape)}, occupied={int(grid.sum())}, "
                f"output={out}"
            )
        except Exception as e:
            return f"ERROR: {e}"

    @tool("Simplify mesh to target poly count")
    def simplify_mesh_tool(mesh_path: str, target_faces: int = 20000) -> str:
        """Reduce a mesh's poly count via QEM. Required before SLA upload."""
        try:
            import trimesh
            p = Path(mesh_path)
            mesh = trimesh.load(p, force="mesh")
            simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
            out = pb.BRIDGE_SCRATCH / f"{p.stem}_simplified_{target_faces}f.stl"
            simplified.export(out)
            return f"simplified to {len(simplified.faces)} faces, output={out}"
        except Exception as e:
            return f"ERROR: {e}"

    @tool("Repair mesh to be manifold/watertight")
    def repair_mesh_tool(mesh_path: str) -> str:
        """Fix non-manifold edges, fill holes, ensure correct normals."""
        try:
            import trimesh
            p = Path(mesh_path)
            mesh = trimesh.load(p, force="mesh")
            trimesh.repair.fix_normals(mesh)
            trimesh.repair.fill_holes(mesh)
            trimesh.repair.fix_inversion(mesh)
            out = pb.BRIDGE_SCRATCH / f"{p.stem}_repaired.stl"
            mesh.export(out)
            return (
                f"repaired: watertight={mesh.is_watertight}, "
                f"vertices={len(mesh.vertices)}, faces={len(mesh.faces)}, output={out}"
            )
        except Exception as e:
            return f"ERROR: {e}"

    @tool("Generate lithophane STL from image")
    def lithophane_tool(
        image_path: str, max_depth_mm: float = 3.0, width_mm: float = 150.0,
    ) -> str:
        """Convert a photo to a relief STL where brightness controls thickness.
        Use for cases where Voxelorama isn't appropriate (single-frame stills)."""
        try:
            import lithophane as lp
            import numpy as np
            from PIL import Image
            p = Path(image_path)
            img = Image.open(p).convert("L")
            arr = np.array(img)
            out = pb.BRIDGE_SCRATCH / f"{p.stem}_lithophane.stl"
            lp.lithophane(
                input_image=arr, output_path=str(out),
                width_mm=width_mm, max_depth_mm=max_depth_mm,
                base_thickness_mm=0.8,
            )
            return f"lithophane generated: {out} ({max_depth_mm}mm deep)"
        except Exception as e:
            return f"ERROR: {e}"

    @tool("Analyse image brightness and trail features")
    def analyse_image_tool(image_path: str) -> str:
        """Examine a long-exposure photo: dominant brightness, trail count,
        recommended depth-mapping function."""
        try:
            import cv2
            import numpy as np
            p = Path(image_path)
            img = cv2.imread(str(p), cv2.IMREAD_COLOR)
            if img is None:
                return f"ERROR: could not decode {image_path}"
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape

            # Brightness stats
            mean = float(gray.mean())
            median = float(np.median(gray))
            p95 = float(np.percentile(gray, 95))

            # Bright pixel ratio
            bright_pixels = int((gray > 200).sum())
            bright_ratio = bright_pixels / (h * w)

            # Trail count via contour detection
            blurred = cv2.GaussianBlur(gray, (7, 7), 0)
            _, binary = cv2.threshold(blurred, 180, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS)
            substantial_trails = sum(1 for c in contours if cv2.arcLength(c, False) > 50)

            depth_strategy = (
                "linear-bright" if bright_ratio < 0.05
                else "log-bright"  if bright_ratio < 0.20
                else "quantized"
            )

            return (
                f"dimensions={w}x{h}, mean={mean:.1f}, median={median:.1f}, p95={p95:.1f}, "
                f"bright_pixel_ratio={bright_ratio:.3f}, trail_count={substantial_trails}, "
                f"recommended_depth_strategy={depth_strategy}"
            )
        except Exception as e:
            return f"ERROR: {e}"


# ============================================================================
# Crew definition + runner
# ============================================================================

def run_sculpture_maker(
    photo_path: str,
    max_print_size_mm: float = 150,
    target_faces: int = 20000,
    llm_model: Optional[str] = None,
) -> dict:
    """
    Run the four-agent SculptureMaker crew on a single photo.

    Args:
        photo_path: absolute path to source image (PNG/JPG/etc)
        max_print_size_mm: largest dimension the SLA print may have
        target_faces: poly count limit for the final STL
        llm_model: e.g. 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', or local Ollama tag.
                   Defaults to CREWAI_LLM env var or 'gpt-4o-mini'.

    Returns:
        dict with 'output' (final STL path), 'log' (crew transcript),
        'final_mesh_stats' (inspect result)
    """
    if not CREWAI_AVAILABLE:
        return {"error": "crewai not installed. Run: pip install crewai"}

    emit_pipeline_stage("sculpture_maker", "started",
                        f"photo={photo_path}, max_size={max_print_size_mm}mm")

    # LLM model selection — CrewAI reads from env by default
    if llm_model:
        os.environ["CREWAI_LLM_MODEL"] = llm_model
    model = os.environ.get("CREWAI_LLM_MODEL", "gpt-4o-mini")

    # ---- Agents ----
    photo_analyst = Agent(
        role="Photo Analyst",
        goal=(
            "Examine the source light-painting photograph and extract objective "
            "metrics: brightness distribution, trail count, recommended depth-mapping "
            "strategy. Output one paragraph of structured findings."
        ),
        backstory=(
            "You're a former forensic photographer turned generative-art consultant. "
            "Cynical about beauty, sharp about light. You judge images by histograms, "
            "not vibes."
        ),
        tools=[analyse_image_tool],
        verbose=True,
        llm=model,
    )

    depth_designer = Agent(
        role="Depth Designer",
        goal=(
            "Based on the Photo Analyst's findings, propose a depth-mapping plan for "
            "Voxelorama: which brightness ranges become which depth values, the maximum "
            "depth in mm, and whether to invert. Pick a SCALE matching max_print_size_mm."
        ),
        backstory=(
            "You design parametric wall art for a living. You can hold five competing "
            "constraints in your head: optical readability, structural integrity, "
            "print-bed dimensions, material cost, and aesthetic punch."
        ),
        tools=[],
        verbose=True,
        llm=model,
    )

    mesh_smith = Agent(
        role="Mesh Smith",
        goal=(
            "Convert the depth design into a real STL: lithophane from the photo first, "
            "then voxelize at appropriate pitch, simplify to under the target_faces limit, "
            "and repair to watertight. Report the path of the final STL."
        ),
        backstory=(
            "A retired 3D-print farm operator who lost three printers to non-manifold "
            "uploads. Now mesh integrity is your religion."
        ),
        tools=[lithophane_tool, voxelize_mesh_tool, simplify_mesh_tool, repair_mesh_tool],
        verbose=True,
        llm=model,
    )

    print_validator = Agent(
        role="Print Validator",
        goal=(
            "Inspect the final STL produced by Mesh Smith. Confirm: watertight, under "
            "target_faces, bbox fits within max_print_size_mm on the longest axis. "
            "Issue a clear PASS or FAIL with reasons."
        ),
        backstory=(
            "You wrote the rejection rules for a major SLA print farm. You can sniff "
            "a non-manifold mesh from three states away."
        ),
        tools=[inspect_mesh_tool],
        verbose=True,
        llm=model,
    )

    # ---- Tasks ----
    t1 = Task(
        description=(
            f"Analyse this photo for sculpture suitability:\n"
            f"  path: {photo_path}\n"
            f"  target_max_size_mm: {max_print_size_mm}\n"
            f"Use analyse_image to get metrics. Identify whether it's a single bright "
            f"subject vs scattered trails. Note recommended depth strategy."
        ),
        expected_output=(
            "One paragraph summarising image characteristics and depth strategy."
        ),
        agent=photo_analyst,
    )

    t2 = Task(
        description=(
            f"Given the photo analyst's findings, propose:\n"
            f"  1. max_depth_mm (between 1.0 and 5.0)\n"
            f"  2. lithophane width_mm (must be <= {max_print_size_mm})\n"
            f"  3. whether to invert (dark->thick instead of bright->thick)\n"
            f"  4. voxel pitch_mm for downstream voxelization (1-20)\n"
            f"Justify each choice in one sentence."
        ),
        expected_output=(
            "Concrete numeric proposal: max_depth_mm, width_mm, invert(yes/no), pitch_mm."
        ),
        agent=depth_designer,
        context=[t1],
    )

    t3 = Task(
        description=(
            f"Execute the depth designer's plan:\n"
            f"  1. lithophane_tool to make initial STL from {photo_path}\n"
            f"  2. voxelize_mesh_tool at the chosen pitch\n"
            f"  3. simplify_mesh_tool with target_faces={target_faces}\n"
            f"  4. repair_mesh_tool on the simplified STL\n"
            f"Pass each output path to the next step. Report the FINAL STL path."
        ),
        expected_output="Path to the final repaired STL, plus per-step poly counts.",
        agent=mesh_smith,
        context=[t2],
    )

    t4 = Task(
        description=(
            f"Inspect the final STL produced by the Mesh Smith. Validate:\n"
            f"  - is_watertight = True\n"
            f"  - faces <= {target_faces}\n"
            f"  - bbox longest dimension <= {max_print_size_mm} mm\n"
            f"Issue PASS or FAIL with the specific values. If FAIL, recommend next steps."
        ),
        expected_output="PASS/FAIL verdict with the three checked values.",
        agent=print_validator,
        context=[t3],
    )

    crew = Crew(
        agents=[photo_analyst, depth_designer, mesh_smith, print_validator],
        tasks=[t1, t2, t3, t4],
        process=Process.sequential,
        verbose=True,
    )

    try:
        result = crew.kickoff()
        emit_pipeline_stage("sculpture_maker", "completed",
                            f"crew result: {str(result)[:200]}")
        return {
            "status": "ok",
            "model": model,
            "result": str(result),
            "photo_path": photo_path,
        }
    except Exception as e:
        emit_pipeline_stage("sculpture_maker", "failed", str(e))
        return {"error": str(e), "status": "failed"}


if __name__ == "__main__":
    import sys as _sys
    if len(_sys.argv) < 2:
        print("Usage: python sculpture_maker.py <photo_path> [max_print_mm] [target_faces]")
        _sys.exit(1)
    result = run_sculpture_maker(
        photo_path=_sys.argv[1],
        max_print_size_mm=float(_sys.argv[2]) if len(_sys.argv) > 2 else 150,
        target_faces=int(_sys.argv[3]) if len(_sys.argv) > 3 else 20000,
    )
    import json
    print(json.dumps(result, indent=2, default=str))
