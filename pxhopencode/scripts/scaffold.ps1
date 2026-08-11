param(
  [string]$Type = "web",
  [string]$Name = "my-project"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$validTypes = @("web", "game", "ai", "tool")
if ($validTypes -notcontains $Type) {
  Write-Host "[FAIL] Invalid type '$Type'. Use: web, game, ai, tool" -ForegroundColor Red
  exit 1
}

$Target = Join-Path (Get-Location) $Name
if (Test-Path $Target) {
  Write-Host "[FAIL] '$Name' already exists at $Target" -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Path "$Target\src" -Force | Out-Null
New-Item -ItemType Directory -Path "$Target\public" -Force | Out-Null

@"
{
  "name": "$Name",
  "version": "0.1.0",
  "private": true,
  "scripts": {
"@ | Out-File -FilePath "$Target\package.json" -Encoding utf8

if ($Type -eq "web") {
  Add-Content -Path "$Target\package.json" -Value '    "dev": "vite"'
} elseif ($Type -eq "game") {
  Add-Content -Path "$Target\package.json" -Value '    "dev": "echo open index.html in browser"'
} else {
  Add-Content -Path "$Target\package.json" -Value '    "start": "node index.js"'
}

@"
  }
}
"@ | Out-File -FilePath "$Target\package.json" -Encoding utf8 -Append

@"
node_modules/
.env
dist/
.opencode/
.github/
.vibe/
.memory/
promptLog.txt
"@ | Out-File -FilePath "$Target\.gitignore" -Encoding utf8

$Html = @"
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>$Name</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
"@
$Html | Out-File -FilePath "$Target\index.html" -Encoding utf8

"console.log('$Name — powered by pxhopencode');" | Out-File -FilePath "$Target\src\main.ts" -Encoding utf8

Write-Host "[OK] Project '$Name' ($Type) scaffolded at:" -ForegroundColor Green
Write-Host "     $Target" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: cd $Name ; opencode" -ForegroundColor Yellow
