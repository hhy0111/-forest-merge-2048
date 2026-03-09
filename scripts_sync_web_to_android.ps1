$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$webProject = Join-Path $root 'app'
$webDist = Join-Path $webProject 'dist'
$androidAssets = Join-Path $root 'android-wrapper\app\src\main\assets\web'

$requiredImages = @(
  'images/branding/app_icon_1024.png',
  'images/backgrounds/game_bg_1080x1920.png',
  'images/gameplay/board/board_bg_inner_4x4.png',
  'images/gameplay/board/board_frame_4x4.png',
  'images/gameplay/board/board_grid_line_soft.png',
  'images/gameplay/board/cell_empty_normal_256.png',
  'images/gameplay/tiles/v2_256/tile_2_seed.png',
  'images/gameplay/tiles/v2_256/tile_4_sprout.png',
  'images/gameplay/tiles/v2_256/tile_8_flower.png',
  'images/gameplay/tiles/v2_256/tile_16_branch.png',
  'images/gameplay/tiles/v2_256/tile_32_tree.png',
  'images/gameplay/tiles/v2_256/tile_64_crystal.png',
  'images/gameplay/tiles/v2_256/tile_128_emblem.png',
  'images/gameplay/tiles/v2_256/tile_256_lantern.png',
  'images/gameplay/tiles/v2_256/tile_512_totem.png',
  'images/gameplay/tiles/v2_256/tile_1024_core.png',
  'images/gameplay/tiles/v2_256/tile_2048_final.png',
  'images/tutorial/countdown_1.png',
  'images/tutorial/countdown_2.png',
  'images/tutorial/countdown_3.png',
  'images/tutorial/countdown_go.png',
  'images/minigame/minigame_target_orb_256.png',
  'images/minigame/minigame_hit_effect_256.png',
  'images/minigame/minigame_miss_effect_256.png'
)

Push-Location $webProject
npm run build
Pop-Location

if (-not (Test-Path $webDist)) {
  throw "Web dist not found: $webDist"
}

if (Test-Path $androidAssets) {
  Remove-Item -Path $androidAssets -Recurse -Force
}

New-Item -ItemType Directory -Path $androidAssets -Force | Out-Null

# Copy compiled app shell first.
Copy-Item -Path (Join-Path $webDist 'index.html') -Destination $androidAssets -Force
$indexPath = Join-Path $androidAssets 'index.html'
if (Test-Path $indexPath) {
  (Get-Content -Path $indexPath -Raw).Replace(' crossorigin', '') | Set-Content -Path $indexPath -Encoding utf8
}
Copy-Item -Path (Join-Path $webDist 'assets') -Destination $androidAssets -Recurse -Force

# Copy only runtime-required image files to keep APK size manageable.
foreach ($relativePath in $requiredImages) {
  $source = Join-Path $webDist $relativePath
  if (-not (Test-Path $source)) {
    Write-Warning "Missing required asset: $relativePath"
    continue
  }
  $destination = Join-Path $androidAssets $relativePath
  $destinationDir = Split-Path -Parent $destination
  if (-not (Test-Path $destinationDir)) {
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
  }
  Copy-Item -Path $source -Destination $destination -Force
}

Write-Output "Synced web assets to: $androidAssets"
