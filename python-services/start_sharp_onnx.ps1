# start_sharp_onnx.ps1 — Launch the SHARP-ONNX FastAPI service on the
# studio bench. Loads SHARP_ONNX_AUTH_TOKEN from .env.bench (sibling
# file, gitignored), activates the anaconda base, and starts uvicorn
# bound to all interfaces on port 7845.
#
# Anaconda base is the right interpreter:
#   - onnxruntime with CUDAExecutionProvider
#   - numpy, plyfile
#   - nvidia-cudnn-cu12, nvidia-cublas-cu12 for the DLL-path stitch
#
# The Tailscale sidecar (D:\Tools\tailscale-sharp-onnx) terminates HTTPS
# and proxies inbound traffic to host.docker.internal:7845 — it expects
# THIS process to be listening on 0.0.0.0:7845.
#
# Run: pwsh .\start_sharp_onnx.ps1

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Load env from .env.bench (gitignored).
$envPath = Join-Path $scriptDir ".env.bench"
if (-not (Test-Path $envPath)) {
    Write-Error "Missing $envPath — generate the token first."
    exit 1
}
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $kv = $line -split "=", 2
        if ($kv.Length -eq 2) {
            $name = $kv[0].Trim()
            $value = $kv[1].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}
if (-not $env:SHARP_ONNX_AUTH_TOKEN) {
    Write-Error "SHARP_ONNX_AUTH_TOKEN not set after loading $envPath"
    exit 1
}
Write-Host "Bearer token loaded ($($env:SHARP_ONNX_AUTH_TOKEN.Length) chars)" -ForegroundColor Green

# 2. Use anaconda base's python by full path. Activating via cmd/activate.bat
# is fragile because PATH changes don't survive across the cmd→PowerShell
# boundary; full-path invocation avoids the whole problem. Anaconda's
# python finds its own site-packages via sys.path discovery from its
# installed location, so no PATH manipulation is needed.
$pythonExe = "C:\Users\dimon\anaconda3\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Error "anaconda python not found at $pythonExe"
    exit 1
}
Write-Host "Using $pythonExe" -ForegroundColor Green

# 3. Start uvicorn. Hosts on 0.0.0.0 so the Docker sidecar can reach
# it via host.docker.internal:7845. Drop to 127.0.0.1 if you ever
# want to lock the service to bench-local only (and bypass the sidecar).
Push-Location $scriptDir
try {
    Write-Host "Starting sharp_onnx_service on 0.0.0.0:7845..." -ForegroundColor Cyan
    & $pythonExe -m uvicorn sharp_onnx_service:app --host 0.0.0.0 --port 7845
} finally {
    Pop-Location
}
