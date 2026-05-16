# run_local.ps1 — start the splat360 service against a local venv.
# Foundation-phase: serves /health only; job endpoints return 501.

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

if (-not (Test-Path "$root\.venv")) {
    Write-Host "Creating venv with uv..."
    & uv venv "$root\.venv"
}

& "$root\.venv\Scripts\Activate.ps1"

Write-Host "Installing splat360 (editable)..."
& uv pip install -e "$root"

Write-Host "Starting splat360 on http://0.0.0.0:8390 ..."
& uvicorn splat360.main:app --host 0.0.0.0 --port 8390 --reload --app-dir "$root\src"
