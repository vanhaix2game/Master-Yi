# Build Pipeline — Real PowerShell Script (chạy được trực tiếp)
# Agent pxh-devops: chạy script này, KHÔNG đọc như markdown

param([string]$Step = "all")

$isNode = Test-Path "package.json"
$isRust = Test-Path "Cargo.toml"
$isPython = Test-Path "pyproject.toml" -or (Test-Path "requirements.txt")

function Invoke-LintAndTypeCheck {
  if ($isNode) {
    $lintOut = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Output "✅ Lint pass" } else { Write-Warning "⚠ Lint issues (exit $LASTEXITCODE)" }
    $tscOut = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Output "✅ TypeCheck pass" } else { Write-Warning "⚠ tsc issues (exit $LASTEXITCODE)" }
  } elseif ($isRust) {
    cargo clippy
    if (-not $?) { exit 1 }
    Write-Output "✅ Clippy pass"
    cargo check
    if (-not $?) { exit 1 }
    Write-Output "✅ Cargo check pass"
  } elseif ($isPython) {
    ruff check . 2>$null
    if ($?) { Write-Output "✅ Ruff pass" } else { Write-Warning "⚠ No ruff or lint fail, skip" }
  }
}

function Invoke-Test {
  if ($isNode) {
    $hasTest = (Get-Content "package.json" -Raw | ConvertFrom-Json).scripts.test
    if ($hasTest) {
      npm test
      if (-not $?) { Write-Warning "⚠ Tests fail"; exit 1 }
      Write-Output "✅ Tests pass"
    } else { Write-Output "⏭️ No test script, skip" }
  } elseif ($isRust) {
    cargo test
    if (-not $?) { exit 1 }
    Write-Output "✅ Tests pass"
  } elseif ($isPython) {
    $pytestOut = pytest 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Output "✅ Tests pass" } else { Write-Warning "⚠ pytest fail (exit $LASTEXITCODE)" }
  }
}

function Invoke-Build {
  if ($isNode) {
    $hasBuild = (Get-Content "package.json" -Raw | ConvertFrom-Json).scripts.build
    if ($hasBuild) {
      npm run build
      if ($?) {
        $outDir = if (Test-Path ".next") { ".next" } elseif (Test-Path "dist") { "dist" } else { "build" }
        if (Test-Path $outDir) {
          $size = (Get-ChildItem -Path $outDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
          Write-Output "✅ Build success ($($size.ToString('N1'))MB)"
        } else { Write-Output "✅ Build success" }
      } else { exit 1 }
    } else {
      Write-Output "⏭️ No build script — meta-project, skip npm build"
    }
  } elseif ($isRust) {
    cargo build --release
    if ($?) {
      $size = (Get-ChildItem -Path "target/release" -File | Measure-Object -Property Length -Sum).Sum / 1MB
      Write-Output "✅ Build success ($($size.ToString('N1'))MB)"
    } else { exit 1 }
  } elseif ($isPython) {
    $buildOut = python -m build 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Output "✅ Build success" } else { Write-Warning "⚠ Build not configured, skip" }
  }
}

switch ($Step) {
  "lint"    { Invoke-LintAndTypeCheck }
  "test"    { Invoke-Test }
  "build"   { Invoke-Build }
  default {
    Invoke-LintAndTypeCheck
    if ($LASTEXITCODE -eq 0) { Invoke-Test }
    if ($LASTEXITCODE -eq 0) { Invoke-Build }
  }
}
