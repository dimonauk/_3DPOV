# start_ollama_proxy.ps1 — Launch the Ollama bearer-auth proxy on the
# studio bench. Reads OLLAMA_PROXY_AUTH_TOKEN from .env.bench, activates
# anaconda base, and starts uvicorn on port 8002.
#
# Pre-flight checklist:
#   1. Ollama is running on localhost:11434 (`ollama serve` or service)
#   2. .env.bench exists with OLLAMA_PROXY_AUTH_TOKEN set to the same
#      value as Vercel's OLLAMA_AUTH_TOKEN env var
#   3. Tailscale sidecar at D:\Tools\tailscale-ollama\ is configured
#      to forward port 8002 → tailnet HTTPS
#
# Anaconda base is the right interpreter:
#   - fastapi, uvicorn, httpx already installed (or pip install)
#   - matches the SHARP-ONNX launcher pattern

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Load env from .env.bench (gitignored).
$envPath = Join-Path $scriptDir ".env.bench"
if (-not (Test-Path $envPath)) {
    Write-Error "Missing $envPath. Copy .env.bench.example and fill in OLLAMA_PROXY_AUTH_TOKEN."
}
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $kv = $line -split "=", 2
        if ($kv.Length -eq 2) {
            Set-Item -Path "env:$($kv[0].Trim())" -Value $kv[1].Trim()
        }
    }
}

if (-not $env:OLLAMA_PROXY_AUTH_TOKEN) {
    Write-Error "OLLAMA_PROXY_AUTH_TOKEN not set in .env.bench."
}

# 2. Verify Ollama is reachable on localhost:11434 before binding.
try {
    $tags = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3
    Write-Host "Ollama reachable. Models loaded:"
    Write-Host $tags.Content
} catch {
    Write-Warning "Ollama not reachable at localhost:11434 — proxy will start but /health will report upstream-down."
    Write-Warning "Start Ollama with: ollama serve"
}

# 3. Anaconda base python by full path.
$pythonExe = "C:\Users\dimon\anaconda3\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Error "Anaconda Python not found at $pythonExe. Adjust path or install anaconda."
}

# 4. Bind to 0.0.0.0 so the Tailscale sidecar can reach via host.docker.internal.
Push-Location $scriptDir
try {
    Write-Host "Starting ollama_proxy on 0.0.0.0:8002 (auth required: yes)..."
    & $pythonExe -m uvicorn ollama_proxy:app --host 0.0.0.0 --port 8002
} finally {
    Pop-Location
}
