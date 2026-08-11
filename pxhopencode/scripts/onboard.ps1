$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

# Detect standalone vs embedded
if (Test-Path "$Root\.opencode") {
  $Mode = "embedded"
  $PxhopencodeRoot = $Root
  $WorkspaceRoot = Split-Path -Parent $Root
  $MemoryRoot = "$Root\.opencode\.memory"
} else {
  $Mode = "standalone"
  $PxhopencodeRoot = $Root
  $WorkspaceRoot = $Root
  $MemoryRoot = "$Root\.memory"
}

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   PXHOPENCODE — AI Company for Vibe Coding" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# Check memory
if (Test-Path $MemoryRoot) {
  $files = @(Get-ChildItem -Path $MemoryRoot -Filter "*.json" -ErrorAction SilentlyContinue).Count
  Write-Host "  [OK] Memory initialized ($files files)" -ForegroundColor Green
} else {
  Write-Host "  [..] Memory not initialized yet." -ForegroundColor Yellow
  Write-Host "       Run start.bat or init-memory.ps1 first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Available commands:" -ForegroundColor White
Write-Host "  -------------------" -ForegroundColor DarkGray
Write-Host "  opencode           Start vibe coding session" -ForegroundColor Cyan
Write-Host "  vibe init          Create new project" -ForegroundColor Cyan
Write-Host "  vibe status        Check session status" -ForegroundColor Cyan
Write-Host "  vibe resume        Resume unfinished session" -ForegroundColor Cyan
Write-Host "  vibe feedback      Send feedback" -ForegroundColor Cyan
Write-Host "  vibe scaffold      Scaffold from template" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Type 'opencode' to begin coding!" -ForegroundColor Green
Write-Host ""
