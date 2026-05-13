# splat-pipeline.ps1
#
# Orchestrator for the three-step CCTV -> SHARP -> register pipeline.
# Runs each step in sequence, captures logs to tmp/logs/, and surfaces
# a single summary line at the end.
#
# Usage (from the project root, D:\.github\_3DPOV):
#   pwsh -File scripts/splat-pipeline.ps1
#   pwsh -File scripts/splat-pipeline.ps1 -SkipFetch
#   pwsh -File scripts/splat-pipeline.ps1 -StagingDir ".\tmp\staging" -OutputDir ".\tmp\splats"
#
# Schedule via Windows Task Scheduler — see docs/CCTV_PIPELINE.md for
# the exact action-line and trigger configuration.

[CmdletBinding()]
param(
    [string]$StagingDir = ".\tmp\staging",
    [string]$OutputDir  = ".\tmp\splats",
    [string]$SharpRepo  = "",
    [switch]$SkipFetch,
    [switch]$SkipSharp,
    [switch]$SkipRegister,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$startedAt = Get-Date

# Resolve project root from the script's own location so this script
# works no matter where Task Scheduler invokes it from.
$scriptRoot   = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot  = Resolve-Path (Join-Path $scriptRoot "..")
Set-Location $projectRoot

$logDir = Join-Path $projectRoot "tmp\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp  = $startedAt.ToString("yyyy-MM-dd-HHmmss")
$logFile = Join-Path $logDir "splat-pipeline-$stamp.log"

function Write-Log {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"), $Message
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Body
    )
    Write-Log "STEP $Name — start"
    try {
        & $Body
        Write-Log "STEP $Name — ok"
    } catch {
        Write-Log "STEP $Name — FAILED: $($_.Exception.Message)"
        throw
    }
}

Write-Log "splat-pipeline starting in $projectRoot"
Write-Log "log: $logFile"

# Count splats already registered so we can report a delta at the end.
$zonesPath = Join-Path $projectRoot "data\neo-london\zones.json"
$splatsRegisteredBefore = 0
if (Test-Path $zonesPath) {
    try {
        $zonesBefore = Get-Content -Raw $zonesPath | ConvertFrom-Json
        $splatsRegisteredBefore = ($zonesBefore | Where-Object { $_.plyUrl } | Measure-Object).Count
    } catch {
        Write-Log "warn: could not parse zones.json before run: $($_.Exception.Message)"
    }
}

try {
    if (-not $SkipFetch) {
        Invoke-Step -Name "1/3 cctv-fetch" -Body {
            $args = @("exec", "tsx", "scripts/cctv-fetch.ts")
            if ($DryRun) { $args += "--dry-run" }
            & pnpm @args 2>&1 | Tee-Object -Append -FilePath $logFile
            if ($LASTEXITCODE -ne 0) {
                throw "cctv-fetch exited with code $LASTEXITCODE"
            }
        }
    } else {
        Write-Log "STEP 1/3 cctv-fetch — skipped"
    }

    if (-not $SkipSharp) {
        Invoke-Step -Name "2/3 sharp-runner" -Body {
            $args = @("scripts/sharp-runner.py", "--staging", $StagingDir, "--output", $OutputDir)
            if ($SharpRepo) { $args += @("--sharp-repo", $SharpRepo) }
            & python @args 2>&1 | Tee-Object -Append -FilePath $logFile
            if ($LASTEXITCODE -ne 0) {
                throw "sharp-runner exited with code $LASTEXITCODE"
            }
        }
    } else {
        Write-Log "STEP 2/3 sharp-runner — skipped"
    }

    if (-not $SkipRegister) {
        Invoke-Step -Name "3/3 register-splat" -Body {
            $args = @("exec", "tsx", "scripts/register-splat.ts", "--output", $OutputDir, "--batch")
            if ($DryRun) { $args += "--dry-run" }
            & pnpm @args 2>&1 | Tee-Object -Append -FilePath $logFile
            if ($LASTEXITCODE -ne 0) {
                throw "register-splat exited with code $LASTEXITCODE"
            }
        }
    } else {
        Write-Log "STEP 3/3 register-splat — skipped"
    }

    $splatsRegisteredAfter = 0
    if (Test-Path $zonesPath) {
        try {
            $zonesAfter = Get-Content -Raw $zonesPath | ConvertFrom-Json
            $splatsRegisteredAfter = ($zonesAfter | Where-Object { $_.plyUrl } | Measure-Object).Count
        } catch {
            Write-Log "warn: could not parse zones.json after run: $($_.Exception.Message)"
        }
    }
    $delta = $splatsRegisteredAfter - $splatsRegisteredBefore
    $elapsed = (Get-Date) - $startedAt

    Write-Log ("DONE in {0:N1}s. {1} new splats registered. Review zones.json and commit." -f $elapsed.TotalSeconds, $delta)
    if ($delta -gt 0) {
        Write-Host ""
        Write-Host "Next: git add data/neo-london/zones.json public/splats/*.ply && git commit && git push"
    }
    exit 0
} catch {
    Write-Log "PIPELINE ABORTED: $($_.Exception.Message)"
    exit 1
}
