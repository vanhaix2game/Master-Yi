param(
  [switch]$Help
)

if ($Help) {
  Write-Output @"
pxhopencode Start — deterministic session init

Usage:   powershell -ExecutionPolicy Bypass -File "_shared/scripts/start.ps1"
         powershell -ExecutionPolicy Bypass -File ".opencode/_shared/scripts/start.ps1"

What it does:
  1. Runs init-memory.ps1 (creates .memory/ with 13 JSON files, updates .gitignore, removes nested .git)
  2. Verifies everything is correct
  3. Launches opencode CLI

This is the 100% guaranteed way to init before first session.
You can also just run "opencode" — the agent will auto-init on first prompt.
"@
  exit 0
}

# Step 1: Detect mode (path-based, giống init-memory.ps1)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PxhopencodeRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$isEmbedded = $PxhopencodeRoot -match '\\.opencode$'

if ($isEmbedded) {
  $scriptPath = ".opencode/_shared/scripts/init-memory.ps1"
} else {
  $scriptPath = "_shared/scripts/init-memory.ps1"
}

# Step 2: Run init
if (Test-Path $scriptPath) {
  Write-Output "==> Running init-memory.ps1..."
  & powershell.exe -ExecutionPolicy Bypass -File $scriptPath
  if ($LASTEXITCODE -ne 0) {
    Write-Error "init-memory.ps1 failed (exit $LASTEXITCODE)"
    exit 1
  }
} else {
  Write-Error "init-memory.ps1 not found at $scriptPath"
  Write-Error "Run from project root (standalone) or parent of .opencode/ (embedded)"
  exit 1
}

# Step 3: Verify
if ($isEmbedded) {
  $memoryDir = ".opencode/.memory"
} else {
  $memoryDir = ".memory"
}

$ok = $true

if (-not (Test-Path $memoryDir)) {
  Write-Error "FAIL: $memoryDir not created"
  $ok = $false
} else {
  $jsonCount = (Get-ChildItem "$memoryDir/*.json").Count
  if ($jsonCount -lt 13) {
    Write-Error "FAIL: $memoryDir has $jsonCount JSON files (need 13)"
    $ok = $false
  } else {
    Write-Output "OK: $memoryDir ($jsonCount JSON files)"
  }
}

if ($isEmbedded) {
  if (-not (Test-Path ".gitignore")) {
    Write-Error "FAIL: .gitignore not created at workspace root"
    $ok = $false
  } else {
    Write-Output "OK: .gitignore exists"
  }
  if (Test-Path ".opencode/.git") {
    Write-Error "FAIL: .opencode/.git still exists"
    $ok = $false
  } else {
    Write-Output "OK: .opencode/.git removed"
  }
}

if (-not $ok) {
  Write-Error "Init verification FAILED. Fix issues above, then re-run."
  exit 1
}

# Step 4: Launch opencode
Write-Output "==> All checks passed. Launching opencode..."
opencode
