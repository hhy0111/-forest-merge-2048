Add-Type -AssemblyName System.Drawing

function Ensure-Dir([string]$Path){ if(-not (Test-Path $Path)){ New-Item -ItemType Directory -Force -Path $Path | Out-Null } }

function Crop-Save {
    param([string]$Source,[string]$Dest,[int]$X,[int]$Y,[int]$W,[int]$H)
    $bmp=[System.Drawing.Bitmap]::new($Source)
    try {
        $rect=[System.Drawing.Rectangle]::new($X,$Y,$W,$H)
        $crop=$bmp.Clone($rect,$bmp.PixelFormat)
        try { $crop.Save($Dest,[System.Drawing.Imaging.ImageFormat]::Png) }
        finally { $crop.Dispose() }
    }
    finally { $bmp.Dispose() }
}

function Resize-Exact {
    param([string]$Source,[string]$Dest,[int]$TargetW,[int]$TargetH)
    $src=[System.Drawing.Bitmap]::new($Source)
    $dst=[System.Drawing.Bitmap]::new($TargetW,$TargetH,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[System.Drawing.Graphics]::FromImage($dst)
    try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src,[System.Drawing.Rectangle]::new(0,0,$TargetW,$TargetH))
        $dst.Save($Dest,[System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $g.Dispose(); $dst.Dispose(); $src.Dispose() }
}

function Resize-ContainCanvas {
    param([string]$Source,[string]$Dest,[int]$CanvasW,[int]$CanvasH)
    $src=[System.Drawing.Bitmap]::new($Source)
    $dst=[System.Drawing.Bitmap]::new($CanvasW,$CanvasH,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[System.Drawing.Graphics]::FromImage($dst)
    try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $scale=[Math]::Min($CanvasW/$src.Width,$CanvasH/$src.Height)
        $w=[int][Math]::Round($src.Width*$scale)
        $h=[int][Math]::Round($src.Height*$scale)
        $x=[int](($CanvasW-$w)/2)
        $y=[int](($CanvasH-$h)/2)
        $g.DrawImage($src,[System.Drawing.Rectangle]::new($x,$y,$w,$h))
        $dst.Save($Dest,[System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $g.Dispose(); $dst.Dispose(); $src.Dispose() }
}

function Resize-Square {
    param([string]$Source,[string]$Dest,[int]$Size)
    Resize-ContainCanvas -Source $Source -Dest $Dest -CanvasW $Size -CanvasH $Size
}

$packDir='assets/images/reference/packs'
Ensure-Dir $packDir

# 1) Move incoming images to reference packs with stable names
$incoming=@{
    'Gemini_Generated_Image_4nk2354nk2354nk2.png'='pack_missing_tile_helpers_v1.png'
    'Gemini_Generated_Image_9zur9u9zur9u9zur.png'='pack_missing_branding_store_v1.png'
    'Gemini_Generated_Image_kqkkdckqkkdckqkk.png'='pack_missing_board_helpers_v1.png'
    'Gemini_Generated_Image_oeu84xoeu84xoeu8.png'='pack_missing_ui_panel_helpers_v1.png'
    'Gemini_Generated_Image_r45bnpr45bnpr45b.png'='pack_missing_vfx_sheet_helpers_v1.png'
    'Gemini_Generated_Image_tzdufdtzdufdtzdu.png'='pack_missing_tutorial_helpers_v1.png'
}

foreach($k in $incoming.Keys){
    $src=Join-Path 'image' $k
    if(Test-Path $src){
        $dst=Join-Path $packDir $incoming[$k]
        Move-Item -Force $src $dst
        Write-Output "MOVED: $k -> $dst"
    }
}

$srcTile=Join-Path $packDir 'pack_missing_tile_helpers_v1.png'
$srcBrand=Join-Path $packDir 'pack_missing_branding_store_v1.png'
$srcBoard=Join-Path $packDir 'pack_missing_board_helpers_v1.png'
$srcUi=Join-Path $packDir 'pack_missing_ui_panel_helpers_v1.png'
$srcVfx=Join-Path $packDir 'pack_missing_vfx_sheet_helpers_v1.png'
$srcTut=Join-Path $packDir 'pack_missing_tutorial_helpers_v1.png'

# 2) Ensure target directories
$dirs=@(
'assets/images/branding',
'assets/images/gameplay/tiles',
'assets/images/gameplay/board',
'assets/images/ui/panels',
'assets/images/ui/icons',
'assets/images/ui/icons/v2_raw','assets/images/ui/icons/v2_256','assets/images/ui/icons/v2_128','assets/images/ui/icons/v2_64',
'assets/images/vfx/sheets','assets/images/vfx/overlays',
'assets/images/tutorial','assets/images/ui/common'
)
$dirs | ForEach-Object { Ensure-Dir $_ }

# 3) Batch 2 missing: tile helper parts
$tmp='assets/images/docs'
Ensure-Dir $tmp
$tileBaseTmp=Join-Path $tmp '_tmp_tile_frame_base.png'
$tileRareTmp=Join-Path $tmp '_tmp_tile_frame_rare.png'
$tileShadowTmp=Join-Path $tmp '_tmp_tile_shadow_soft.png'

Crop-Save $srcTile $tileBaseTmp 28 40 258 258
Crop-Save $srcTile $tileRareTmp 285 40 258 258
Crop-Save $srcTile $tileShadowTmp 280 470 268 268

Resize-Square $tileBaseTmp 'assets/images/gameplay/tiles/tile_frame_base_256.png' 256
Resize-Square $tileRareTmp 'assets/images/gameplay/tiles/tile_frame_rare_256.png' 256
Resize-Square $tileShadowTmp 'assets/images/gameplay/tiles/tile_shadow_soft_256.png' 256

# 4) Batch 1 missing: branding/store
$appTmp=Join-Path $tmp '_tmp_brand_app_icon.png'
$splashTmp=Join-Path $tmp '_tmp_brand_splash_logo.png'
$adaptiveBgTmp=Join-Path $tmp '_tmp_brand_adaptive_bg.png'
$storeTmp=Join-Path $tmp '_tmp_brand_store_scene.png'
$titleTmp=Join-Path $tmp '_tmp_brand_title_logo.png'

Crop-Save $srcBrand $appTmp 48 44 256 256
Crop-Save $srcBrand $splashTmp 304 44 256 256
Crop-Save $srcBrand $adaptiveBgTmp 560 44 256 256
Crop-Save $srcBrand $storeTmp 44 456 936 500
Crop-Save $srcBrand $titleTmp 310 500 420 220

Resize-Exact $appTmp 'assets/images/branding/app_icon_1024.png' 1024 1024
Resize-Square $splashTmp 'assets/images/branding/adaptive_icon_foreground.png' 432
Resize-Square $adaptiveBgTmp 'assets/images/branding/adaptive_icon_background.png' 432
Resize-ContainCanvas $splashTmp 'assets/images/branding/splash_logo_only.png' 1536 1536
Resize-ContainCanvas $titleTmp 'assets/images/branding/title_logo_horizontal.png' 2048 1024
Resize-Exact $storeTmp 'assets/images/branding/store_feature_graphic.png' 1024 500
Resize-Exact $storeTmp 'assets/images/branding/store_promo_banner.png' 1920 1080

# 5) Batch 3 missing: board helper parts
$boardOverlayTmp=Join-Path $tmp '_tmp_board_overlay_vignette.png'
$boardGridTmp=Join-Path $tmp '_tmp_board_grid_soft.png'
$cellGlowTmp=Join-Path $tmp '_tmp_cell_glow_hint.png'

Crop-Save $srcBoard $boardOverlayTmp 28 52 420 420
Crop-Save $srcBoard $boardGridTmp 548 42 430 430
Crop-Save $srcBoard $cellGlowTmp 258 604 364 364

Resize-Exact $boardOverlayTmp 'assets/images/gameplay/board/board_overlay_vignette.png' 1536 1536
Resize-Exact $boardGridTmp 'assets/images/gameplay/board/board_grid_line_soft.png' 1536 1536
Resize-Square $cellGlowTmp 'assets/images/gameplay/board/cell_glow_hint_256.png' 256

# 6) Batch 4 missing: panel/ui
$panelLargeTmp=Join-Path $tmp '_tmp_panel_popup_large.png'
$progressFillTmp=Join-Path $tmp '_tmp_progress_bar_fill.png'
$musicOnTmp=Join-Path $tmp '_tmp_icon_music_on.png'

Crop-Save $srcUi $panelLargeTmp 34 44 956 552
Crop-Save $srcUi $progressFillTmp 42 624 940 84
Crop-Save $srcUi $musicOnTmp 384 748 256 256

Resize-Exact $panelLargeTmp 'assets/images/ui/panels/panel_popup_large_1280x960.png' 1280 960
Resize-Exact $progressFillTmp 'assets/images/ui/panels/progress_bar_fill_1024x128.png' 1024 128
Resize-Square $musicOnTmp 'assets/images/ui/icons/icon_music_on.png' 256

# also integrate into v2 icon sets
Copy-Item -Force 'assets/images/ui/icons/icon_music_on.png' 'assets/images/ui/icons/v2_raw/icon_music_on.png'
Resize-Square 'assets/images/ui/icons/icon_music_on.png' 'assets/images/ui/icons/v2_256/icon_music_on.png' 256
Resize-Square 'assets/images/ui/icons/icon_music_on.png' 'assets/images/ui/icons/v2_128/icon_music_on.png' 128
Resize-Square 'assets/images/ui/icons/icon_music_on.png' 'assets/images/ui/icons/v2_64/icon_music_on.png' 64

# 7) Batch 5 missing: vfx sheets + overlays
$fxMergeBurstTmp=Join-Path $tmp '_tmp_fx_merge_burst_sheet.png'
$fxMergeGlowTmp=Join-Path $tmp '_tmp_fx_merge_glow_sheet.png'
$fxWarningTmp=Join-Path $tmp '_tmp_fx_warning_sheet.png'
$fxClearTmp=Join-Path $tmp '_tmp_fx_clear_sheet.png'
$fxSpawnTmp=Join-Path $tmp '_tmp_fx_spawn_sheet.png'
$fxCoinTmp=Join-Path $tmp '_tmp_fx_coin_sheet.png'
$fxTapTmp=Join-Path $tmp '_tmp_fx_tap_sheet.png'
$fxOverlayClearTmp=Join-Path $tmp '_tmp_fx_overlay_clear.png'
$fxOverlayWarningTmp=Join-Path $tmp '_tmp_fx_overlay_warning.png'

Crop-Save $srcVfx $fxMergeBurstTmp 30 46 450 190
Crop-Save $srcVfx $fxClearTmp 540 46 450 190
Crop-Save $srcVfx $fxMergeGlowTmp 30 262 450 190
Crop-Save $srcVfx $fxSpawnTmp 540 262 450 190
Crop-Save $srcVfx $fxWarningTmp 30 524 450 190
Crop-Save $srcVfx $fxCoinTmp 540 532 450 86
Crop-Save $srcVfx $fxTapTmp 540 624 450 86
Crop-Save $srcVfx $fxOverlayClearTmp 30 768 450 226
Crop-Save $srcVfx $fxOverlayWarningTmp 540 768 450 226

Copy-Item -Force $fxMergeBurstTmp 'assets/images/vfx/sheets/fx_merge_burst_sheet.png'
Copy-Item -Force $fxMergeGlowTmp 'assets/images/vfx/sheets/fx_merge_glow_ring_sheet.png'
Copy-Item -Force $fxMergeBurstTmp 'assets/images/vfx/sheets/fx_combo_burst_sheet.png'
Copy-Item -Force $fxWarningTmp 'assets/images/vfx/sheets/fx_pre_goal_warning_sheet.png'
Copy-Item -Force $fxClearTmp 'assets/images/vfx/sheets/fx_game_clear_flash_sheet.png'
Copy-Item -Force $fxSpawnTmp 'assets/images/vfx/sheets/fx_tile_spawn_sheet.png'
Copy-Item -Force $fxCoinTmp 'assets/images/vfx/sheets/fx_coin_pop_sheet.png'
Copy-Item -Force $fxTapTmp 'assets/images/vfx/sheets/fx_button_tap_spark_sheet.png'

Resize-Exact $fxOverlayClearTmp 'assets/images/vfx/overlays/fx_screen_vignette_clear.png' 1080 1920
Resize-Exact $fxOverlayWarningTmp 'assets/images/vfx/overlays/fx_screen_vignette_warning.png' 1080 1920

# 8) Batch 6 missing: tutorial/common
$countdown1Tmp=Join-Path $tmp '_tmp_countdown_1.png'
$loadingTmp=Join-Path $tmp '_tmp_loading_spinner.png'
$touchTmp=Join-Path $tmp '_tmp_touch_feedback_dot.png'

Crop-Save $srcTut $countdown1Tmp 312 344 248 320
Crop-Save $srcTut $loadingTmp 584 332 306 314
Crop-Save $srcTut $touchTmp 330 748 224 224

Resize-Square $countdown1Tmp 'assets/images/tutorial/countdown_1.png' 512
Resize-Square $loadingTmp 'assets/images/ui/common/loading_spinner_256.png' 256
Resize-Square $touchTmp 'assets/images/ui/common/touch_feedback_dot_128.png' 128

Write-Output 'IMPORT_AND_SLICE_DONE'
