param(
  [string]$WorkspaceRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PxhopencodeRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$initJson = Join-Path $PxhopencodeRoot "runtime\memory\init.json"

$isEmbedded = $PxhopencodeRoot -match '\\.opencode$'
if ($isEmbedded) {
  $parentRoot = Split-Path $PxhopencodeRoot -Parent
  if ($WorkspaceRoot -eq (Get-Location).Path) {
    $WorkspaceRoot = $parentRoot
  }
  $memoryDir = Join-Path $PxhopencodeRoot ".memory"
  Write-Output "[MODE] Embedded: .memory/ at $memoryDir"
} else {
  $memoryDir = Join-Path $WorkspaceRoot ".memory"
}

if ($isEmbedded) {
  $nestedGit = Join-Path $PxhopencodeRoot ".git"
  if (Test-Path -LiteralPath $nestedGit) {
    Write-Output "[CLEAN] Removing .opencode/.git..."
    & cmd /c "attrib -R -H -S ""$nestedGit"" /S /D 2>nul"
    $extPath = "\\?\$nestedGit"
    Remove-Item -LiteralPath $extPath -Recurse -Force -ErrorAction SilentlyContinue 2>$null
    if (-not (Test-Path -LiteralPath $nestedGit)) {
      Write-Output "   [OK] Removed"
    } else {
      & cmd /c "rmdir /s /q ""$nestedGit"" 2>nul"
      if (-not (Test-Path -LiteralPath $nestedGit)) { Write-Output "   [OK] Removed" }
      else { Write-Output "   [WARN] Could not remove .opencode/.git" }
    }
  }
}

if (Test-Path $memoryDir) {
  $idx = Join-Path $memoryDir "index.json"
  if (Test-Path $idx) {
    Write-Output "[SKIP] .memory/ exists, skip init"
    $persistScript = Join-Path $PxhopencodeRoot "runtime\bin\persist.mjs"
    if (Test-Path $persistScript) {
      & node $persistScript repair
      if ($LASTEXITCODE -ne 0) {
        Write-Error "[FAIL] Could not repair existing .memory/ schema"
        exit $LASTEXITCODE
      }
    }
# ── PROMPT COMPILER AUTO-BUILD ────────────────────────────────
$compilerDist = Join-Path $PxhopencodeRoot "prompt-compiler" "dist" "index.js"
if (-not (Test-Path $compilerDist)) {
  Write-Output "[BUILD] prompt-compiler dist/ missing — building..."
  Push-Location (Join-Path $PxhopencodeRoot "prompt-compiler")
  & "npm" install --silent 2>&1 | Out-Null
  & "npx" tsc 2>&1 | Out-Null
  Pop-Location
  if (Test-Path $compilerDist) {
    Write-Output "[OK] prompt-compiler built (dist/)"
  } else {
    Write-Output "[WARN] prompt-compiler build failed — compile command will use source"
  }
}

exit 0
  }
}

if (-not (Test-Path $initJson)) {
  Write-Error "[FAIL] init.json not found at $initJson"
  exit 1
}

$initRaw = Get-Content $initJson -Raw
$init = $initRaw | ConvertFrom-Json
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$projectName = Split-Path $WorkspaceRoot -Leaf

$fw = $null; $lang = $null; $rt = $null; $bt = @(); $tf = $null; $li = $null; $dt = @()

if (Test-Path (Join-Path $WorkspaceRoot "package.json")) {
  $lang = "TypeScript"; $rt = "node"; $bt = @("npm")
  $pj = Get-Content (Join-Path $WorkspaceRoot "package.json") -Raw | ConvertFrom-Json
  if ($pj.scripts.lint) { $li = "eslint" }
  if ($pj.scripts.test) { $tf = if ($pj.devDependencies.vitest) { "vitest" } elseif ($pj.devDependencies.jest) { "jest" } else { "node:test" } }
  if ($pj.dependencies.next) { $fw = "nextjs"; $dt = @("vercel") }
  elseif ($pj.dependencies.react) { $fw = "react"; $dt = @("vercel") }
  elseif ($pj.dependencies.phaser) { $fw = "phaser"; $dt = @("vercel","itchio") }
  elseif ($pj.dependencies.three) { $fw = "threejs"; $dt = @("vercel") }
  elseif ($pj.name -eq "pxhopencode") { $fw = "opencode"; $dt = @("opencode") }
} elseif (Test-Path (Join-Path $WorkspaceRoot "Cargo.toml")) {
  $lang = "Rust"; $rt = "rust"; $li = "clippy"; $tf = "cargo test"; $bt = @("cargo")
} elseif (Test-Path (Join-Path $WorkspaceRoot "pyproject.toml")) {
  $lang = "Python"; $rt = "python"; $li = "ruff"; $tf = "pytest"; $bt = @("pip")
}

$fs = @()
foreach ($d in @("src","agents","runtime","workflows","skills","_shared","components","pages","api","lib","hooks","styles","server","public","docs","tests","e2e")) {
  if (Test-Path (Join-Path $WorkspaceRoot $d)) { $fs += "$d/" }
}

$projectId = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($WorkspaceRoot.ToUpper()))

function Write-JsonFile {
  param($Path, $Content)
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($Path), $Content, $utf8NoBom)
}

$fwList = if ($fw) { "`"$fw`"" } else { "" }
$indexJson = @"
{"version":"1.0","project_id":"$projectId","project_name":"$projectName","created":"$now","updated":"$now","memory_count":0,"confidence":{},"tags":[],"frameworks":[$fwList]}
"@
$indexJson = $indexJson -replace '"frameworks":\[""\]', '"frameworks":[]'
$indexJson = $indexJson -replace '"frameworks":\[,\]', '"frameworks":[]'

$projectConfidence = if ($fw -or $lang) { 70 } else { 0 }
$fStr = if ($fw) { "`"$fw`"" } else { "null" }
$lStr = if ($lang) { "`"$lang`"" } else { "null" }
$rStr = if ($rt) { "`"$rt`"" } else { "null" }
$pmStr = "null"
$btStr = if ($bt.Count -gt 0) { '["' + ($bt -join '","') + '"]' } else { "[]" }
$dtStr = if ($dt.Count -gt 0) { '["' + ($dt -join '","') + '"]' } else { "[]" }
$tfStr = if ($tf) { "`"$tf`"" } else { "null" }
$liStr = if ($li) { "`"$li`"" } else { "null" }
$fsStr = if ($fs.Count -gt 0) { '["' + ($fs -join '","') + '"]' } else { "[]" }

$projectJson = @"
{"version":"1.0","created":"$now","updated":"$now","confidence":$projectConfidence,"framework":$fStr,"language":$lStr,"runtime":$rStr,"package_manager":$pmStr,"build_tools":$btStr,"ui_library":null,"testing_framework":$tfStr,"linter":$liStr,"formatter":null,"game_engine":null,"deployment_target":$dtStr,"folder_structure":$fsStr,"conventions":{}}
"@
$projectJson = $projectJson -replace '"build_tools":\[""\]', '"build_tools":[]'
$projectJson = $projectJson -replace '"build_tools":\[,', '"build_tools":['

New-Item -ItemType Directory -Force -Path $memoryDir | Out-Null

$count = 0
$pm = $init.files.PSObject.Properties
foreach ($entry in $pm) {
  $name = $entry.Name
  $path = Join-Path $memoryDir $name

  if ($name -eq "index.json") { Write-JsonFile $path $indexJson }
  elseif ($name -eq "project.json") { Write-JsonFile $path $projectJson }
  else {
    $raw = $entry.Value | ConvertTo-Json -Depth 10 -Compress
    $raw = $raw -replace '"confidence":\s*\{\}', '"confidence":{}'
    $raw = $raw -replace '"bugs":\s*\{\}', '"bugs":[]'
    $raw = $raw -replace '"decisions":\s*\{\}', '"decisions":[]'
    $raw = $raw -replace '"snapshots":\s*\{\}', '"snapshots":[]'
    $raw = $raw -replace '"entries":\s*\{\}', '"entries":[]'
    $raw = $raw -replace '"workflows":\s*\{\}', '"workflows":[]'
    $raw = $raw -replace '"optimizations":\s*\{\}', '"optimizations":[]'
    $raw = $raw -replace '"repeated_instructions":\s*\{\}', '"repeated_instructions":[]'
    $raw = $raw -replace '"optimized_templates":\s*\{\}', '"optimized_templates":[]'
    $raw = $raw -replace '"common_patterns":\s*\{\}', '"common_patterns":[]'
    $raw = $raw -replace '"preferences":\s*\{\}', '"preferences":{}'
    $raw = $raw -replace '"habits":\s*\{\}', '"habits":[]'
    $raw = $raw -replace '"folder_organization":\s*\{\}', '"folder_organization":[]'
    $raw = $raw -replace '"stores":\s*\{\}', '"stores":[]'
    $raw = $raw -replace '"error_handling":\s*\{\}', '"error_handling":[]'
    $raw = $raw -replace '"logging":\s*\{\}', '"logging":[]'
    $raw = $raw -replace '"api_wrappers":\s*\{\}', '"api_wrappers":[]'
    $raw = $raw -replace '"state_management":\s*\{\}', '"state_management":[]'
    $raw = $raw -replace '"modules":\s*\{\}', '"modules":[]'
    $raw = $raw -replace '"services":\s*\{\}', '"services":[]'
    $raw = $raw -replace '"dependencies":\s*\{\}', '"dependencies":[]'
    $raw = $raw -replace '"coding_philosophy":\s*\{\}', '"coding_philosophy":[]'
    $raw = $raw -replace '"profile":\s*\{\}', '"profile":[]'
    $raw = $raw -replace '"build_tools":\s*\{\}', '"build_tools":[]'
    $raw = $raw -replace '"deployment_target":\s*\{\}', '"deployment_target":[]'
    $raw = $raw -replace '"folder_structure":\s*\{\}', '"folder_structure":[]'
    $raw = $raw -replace '"naming":\s*\{\}', '"naming":{}'
    $raw = $raw -replace '"imports":\s*\{\}', '"imports":{}'
    $raw = $raw -replace '"flows":\s*\{\}', '"flows":{}'
    $raw = $raw -replace '"tiers":\s*\{\}', '"tiers":[]'
    $raw = $raw -replace '"boundaries":\s*\{\}', '"boundaries":[]'
    $raw = $raw -replace '"tags":\s*\{\}', '"tags":[]'
    $raw = $raw -replace '"data":\s*\{\}', '"data":[]'
    $raw = $raw -replace '"event":\s*\{\}', '"event":[]'
    $raw = $raw -replace '"state":\s*\{\}', '"state":[]'
    $raw = $raw -replace '"api":\s*\{\}', '"api":[]'
    Write-JsonFile $path $raw
  }
  $count++
}

Write-Output "[OK] .memory/ initialized: $count files created"

# ── MEMORY AUTO-SEED ──────────────────────────────────────────
# Populate architecture + patterns + preferences so memory_count > 0
$seedCount = 0

# 1. Architecture: scan top-level dirs
$archDirs = @()
foreach ($d in @("src","agents","runtime","workflows","skills","components","pages","api","lib","hooks","styles","server","public","docs","tests","e2e")) {
  $full = Join-Path $WorkspaceRoot $d
  if (Test-Path $full) { $archDirs += "$d/" }
}
if ($archDirs.Count -gt 0) {
  $archPath = Join-Path $memoryDir "architecture.json"
  $archData = Get-Content $archPath -Raw | ConvertFrom-Json
  $archData | Add-Member -MemberType NoteProperty -Name "directories" -Value ($archDirs -join ",") -Force
  $archData | Add-Member -MemberType NoteProperty -Name "depth" -Value 2 -Force
  Write-JsonFile $archPath ($archData | ConvertTo-Json -Compress)
  $seedCount++
}

# 2. Preferences: detect tools beyond framework
$prefPath = Join-Path $memoryDir "preferences.json"
$pref = Get-Content $prefPath -Raw | ConvertFrom-Json
$pref | Add-Member -MemberType NoteProperty -Name "language" -Value $lang -Force
$pref | Add-Member -MemberType NoteProperty -Name "runtime" -Value $rt -Force
$pref | Add-Member -MemberType NoteProperty -Name "build_tools" -Value ($bt -join ",") -Force
$pref | Add-Member -MemberType NoteProperty -Name "testing_framework" -Value $tf -Force
$pref | Add-Member -MemberType NoteProperty -Name "linter" -Value $li -Force
$pref | Add-Member -MemberType NoteProperty -Name "framework" -Value $fw -Force
$pref | Add-Member -MemberType NoteProperty -Name "deployment" -Value ($dt -join ",") -Force
$pref | Add-Member -MemberType NoteProperty -Name "project_name" -Value $projectName -Force
Write-JsonFile $prefPath ($pref | ConvertTo-Json -Compress)
$seedCount++

# 3. Patterns: detect naming conventions from src/ files
$namingKebab = 0; $namingCamel = 0; $namingPascal = 0; $namingSnake = 0
$srcDir = Join-Path $WorkspaceRoot "src"
if (Test-Path $srcDir) {
  Get-ChildItem $srcDir -Recurse -File -Name -Include *.ts,*.tsx,*.js,*.jsx,*.vue,*.css,*.scss -ErrorAction SilentlyContinue | ForEach-Object {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($_)
    if ($base -cmatch '^[a-z][a-z0-9]*(-[a-z0-9]+)+$') { $namingKebab++ }
    elseif ($base -cmatch '^[a-z][a-zA-Z0-9]*$') { $namingCamel++ }
    elseif ($base -cmatch '^[A-Z][a-zA-Z0-9]*$') { $namingPascal++ }
    elseif ($base -cmatch '^[a-z][a-z0-9]*(_[a-z0-9]+)+$') { $namingSnake++ }
  }
}
$convention = if ($namingPascal -gt $namingCamel -and $namingPascal -gt $namingKebab) { "PascalCase" }
  elseif ($namingCamel -gt $namingPascal -and $namingCamel -gt $namingKebab) { "camelCase" }
  elseif ($namingKebab -gt $namingPascal -and $namingKebab -gt $namingCamel) { "kebab-case" }
  elseif ($namingSnake -gt 0) { "snake_case" }
  else { "unknown" }
$patternsPath = Join-Path $memoryDir "patterns.json"
$patterns = Get-Content $patternsPath -Raw | ConvertFrom-Json
$patterns | Add-Member -MemberType NoteProperty -Name "naming" -Value $convention -Force
$patterns | Add-Member -MemberType NoteProperty -Name "framework" -Value $fw -Force
$patterns | Add-Member -MemberType NoteProperty -Name "language" -Value $lang -Force
Write-JsonFile $patternsPath ($patterns | ConvertTo-Json -Compress)
$seedCount++

# 4. Populate project.json with detailed framework detection
$projPath = Join-Path $memoryDir "project.json"
$projData = Get-Content $projPath -Raw | ConvertFrom-Json
$projData | Add-Member -MemberType NoteProperty -Name "naming_convention" -Value $convention -Force
if ($archDirs.Count -gt 0) {
  $projData | Add-Member -MemberType NoteProperty -Name "directories" -Value ($archDirs -join ",") -Force
}
Write-JsonFile $projPath ($projData | ConvertTo-Json -Compress)

# 5. Update index.json memory_count
$idxPath = Join-Path $memoryDir "index.json"
$idxData = Get-Content $idxPath -Raw | ConvertFrom-Json
$idxData.memory_count = $seedCount
$idxData.confidence = @{
  "project" = $projectConfidence
  "patterns" = if ($convention -ne "unknown") { 70 } else { 0 }
  "preferences" = if ($fw) { 80 } else { 30 }
}
$idxData.updated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-JsonFile $idxPath ($idxData | ConvertTo-Json -Compress)
Write-Output "[SEED] .memory/ populated: $seedCount categories (architecture, preferences, patterns)"

$gitignorePath = Join-Path $WorkspaceRoot ".gitignore"
$templateGitignore = Join-Path $PxhopencodeRoot ".gitignore"

$templateEntries = @()
if (Test-Path $templateGitignore) {
  $templateEntries = Get-Content $templateGitignore | Where-Object {
    $_ -match "\S" -and $_ -notmatch "^\s*#"
  }
}

if (-not (Test-Path $gitignorePath)) {
  $templateEntries | Set-Content -Path $gitignorePath -Encoding UTF8
  Write-Output "[OK] .gitignore created from pxhopencode template ($($templateEntries.Count) entries)"
} else {
  $current = Get-Content $gitignorePath -Raw
  $lineBreak = if ($current -match "\r\n") { "`r`n" } else { "`n" }
  $appendCount = 0
  $linesToAppend = @()

  foreach ($entry in $templateEntries) {
    $escaped = [regex]::Escape($entry.Trim())
    $covered = $current -match "(^|$lineBreak)$escaped($|$lineBreak)"
    $hasIgnoreAll = $current -match "(^|`n)\s*\*\s*(`n|`$)"
    if (-not $covered -and -not $hasIgnoreAll) {
      $linesToAppend += $entry
      $appendCount++
    }
  }

  if ($appendCount -gt 0) {
    $toAdd = ($linesToAppend -join $lineBreak).Trim()
    $appendValue = $lineBreak + $lineBreak + "# pxhopencode" + $lineBreak + $toAdd
    Add-Content -Path $gitignorePath -Value $appendValue -Encoding UTF8 -NoNewline
    Write-Output "[OK] .gitignore updated: added $appendCount entries from pxhopencode template"
  } else {
    Write-Output "[OK] .gitignore already covers all pxhopencode entries"
  }
}

exit 0
