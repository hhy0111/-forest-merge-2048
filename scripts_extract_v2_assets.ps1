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

function Resize-Square {
    param([string]$Source,[string]$Dest,[int]$Size)
    $src=[System.Drawing.Bitmap]::new($Source)
    $dst=[System.Drawing.Bitmap]::new($Size,$Size,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[System.Drawing.Graphics]::FromImage($dst)
    try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $scale=[Math]::Min($Size/$src.Width,$Size/$src.Height)
        $w=[int][Math]::Round($src.Width*$scale)
        $h=[int][Math]::Round($src.Height*$scale)
        $x=[int](($Size-$w)/2)
        $y=[int](($Size-$h)/2)
        $g.DrawImage($src,[System.Drawing.Rectangle]::new($x,$y,$w,$h))
        $dst.Save($Dest,[System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $g.Dispose(); $dst.Dispose(); $src.Dispose() }
}

function Resize-Height {
    param([string]$Source,[string]$Dest,[int]$TargetHeight)
    $src=[System.Drawing.Bitmap]::new($Source)
    $tw=[int][Math]::Round($src.Width*($TargetHeight/$src.Height))
    $dst=[System.Drawing.Bitmap]::new($tw,$TargetHeight,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[System.Drawing.Graphics]::FromImage($dst)
    try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src,[System.Drawing.Rectangle]::new(0,0,$tw,$TargetHeight))
        $dst.Save($Dest,[System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $g.Dispose(); $dst.Dispose(); $src.Dispose() }
}

$pack='assets/images/reference/packs'

$dirs=@(
'assets/images/gameplay/tiles/v2_raw','assets/images/gameplay/tiles/v2_256','assets/images/gameplay/tiles/v2_128','assets/images/gameplay/tiles/v2_64',
'assets/images/gameplay/items/v2_raw','assets/images/gameplay/items/v2_256','assets/images/gameplay/items/v2_128','assets/images/gameplay/items/v2_64',
'assets/images/gameplay/currency/v2_raw','assets/images/gameplay/currency/v2_256','assets/images/gameplay/currency/v2_128','assets/images/gameplay/currency/v2_64',
'assets/images/gameplay/board/v2_raw',
'assets/images/ui/icons/v2_raw','assets/images/ui/icons/v2_256','assets/images/ui/icons/v2_128','assets/images/ui/icons/v2_64',
'assets/images/ui/buttons/v2_raw','assets/images/ui/buttons/v2_hd','assets/images/ui/buttons/v2_sd',
'assets/images/ui/panels/v2_raw',
'assets/images/vfx/v2_raw','assets/images/vfx/v2_1080h',
'assets/images/tutorial/v2','assets/images/minigame/v2',
'assets/images/branding/v2'
)
$dirs | ForEach-Object { Ensure-Dir $_ }

# Tiles v2
$srcTiles=Join-Path $pack 'pack_tiles_evolution_set_v2.png'
$tiles=@(
@{n='tile_2_seed';x=46;y=31;w=193;h=193},
@{n='tile_4_sprout';x=289;y=31;w=193;h=193},
@{n='tile_8_flower';x=776;y=31;w=193;h=193},
@{n='tile_16_branch';x=46;y=282;w=193;h=193},
@{n='tile_32_tree';x=533;y=282;w=193;h=193},
@{n='tile_64_crystal';x=776;y=282;w=193;h=193},
@{n='tile_128_emblem';x=289;y=531;w=193;h=193},
@{n='tile_256_lantern';x=533;y=531;w=193;h=193},
@{n='tile_512_totem';x=46;y=531;w=193;h=193},
@{n='tile_1024_core';x=289;y=785;w=193;h=193},
@{n='tile_2048_final';x=533;y=785;w=193;h=193}
)
foreach($t in $tiles){
  $raw="assets/images/gameplay/tiles/v2_raw/$($t.n).png"
  Crop-Save $srcTiles $raw $t.x $t.y $t.w $t.h
  Resize-Square $raw "assets/images/gameplay/tiles/v2_256/$($t.n).png" 256
  Resize-Square $raw "assets/images/gameplay/tiles/v2_128/$($t.n).png" 128
  Resize-Square $raw "assets/images/gameplay/tiles/v2_64/$($t.n).png" 64
}

# Items/Currency/Badges v2
$srcItem=Join-Path $pack 'pack_items_currency_badges_status_v2.png'
$items=@(
@{n='item_undo';x=32;y=18;w=192;h=192},
@{n='item_shuffle';x=288;y=18;w=192;h=192},
@{n='item_hammer';x=544;y=18;w=192;h=192},
@{n='item_double_score';x=800;y=18;w=192;h=192},
@{n='item_startup';x=32;y=270;w=192;h=150}
)
foreach($i in $items){
  $raw="assets/images/gameplay/items/v2_raw/$($i.n).png"; Crop-Save $srcItem $raw $i.x $i.y $i.w $i.h
  Resize-Square $raw "assets/images/gameplay/items/v2_256/$($i.n).png" 256
  Resize-Square $raw "assets/images/gameplay/items/v2_128/$($i.n).png" 128
  Resize-Square $raw "assets/images/gameplay/items/v2_64/$($i.n).png" 64
}
$curr=@(
@{n='currency_leaf';x=32;y=270;w=192;h=150},
@{n='currency_coin';x=224;y=270;w=192;h=150},
@{n='currency_gem';x=416;y=270;w=192;h=150},
@{n='currency_energy';x=800;y=270;w=192;h=150}
)
foreach($c in $curr){
  $raw="assets/images/gameplay/currency/v2_raw/$($c.n).png"; Crop-Save $srcItem $raw $c.x $c.y $c.w $c.h
  Resize-Square $raw "assets/images/gameplay/currency/v2_256/$($c.n).png" 256
  Resize-Square $raw "assets/images/gameplay/currency/v2_128/$($c.n).png" 128
  Resize-Square $raw "assets/images/gameplay/currency/v2_64/$($c.n).png" 64
}
$badges=@(
@{n='badge_new';x=0;y=452;w=280;h=188},
@{n='badge_best';x=272;y=458;w=188;h=188},
@{n='badge_locked';x=516;y=460;w=188;h=188},
@{n='badge_ad_bonus';x=768;y=460;w=188;h=188},
@{n='icon_timer';x=714;y=672;w=120;h=108},
@{n='icon_combo';x=836;y=672;w=120;h=108}
)
foreach($b in $badges){ Crop-Save $srcItem "assets/images/ui/panels/v2_raw/$($b.n).png" $b.x $b.y $b.w $b.h }

# UI icons/buttons v2
$srcUI=Join-Path $pack 'pack_ui_icons_buttons_states_v2.png'
$icons=@(
@{n='icon_sound_on';x=158;y=30;w=96;h=96},
@{n='icon_next';x=286;y=30;w=96;h=96},
@{n='icon_home';x=412;y=30;w=96;h=96},
@{n='icon_play';x=538;y=30;w=96;h=96},
@{n='icon_retry';x=664;y=30;w=96;h=96},
@{n='icon_close';x=790;y=30;w=96;h=96},
@{n='icon_back';x=790;y=166;w=96;h=96},
@{n='icon_shop';x=286;y=166;w=96;h=96},
@{n='icon_mission';x=30;y=166;w=96;h=96},
@{n='icon_ranking';x=538;y=166;w=96;h=96},
@{n='icon_settings';x=664;y=166;w=96;h=96},
@{n='icon_ads';x=916;y=30;w=96;h=96},
@{n='icon_sound_off';x=160;y=282;w=64;h=64},
@{n='icon_music_off';x=223;y=282;w=64;h=64},
@{n='icon_pause';x=286;y=282;w=64;h=64}
)
foreach($ic in $icons){
  $raw="assets/images/ui/icons/v2_raw/$($ic.n).png"; Crop-Save $srcUI $raw $ic.x $ic.y $ic.w $ic.h
  Resize-Square $raw "assets/images/ui/icons/v2_256/$($ic.n).png" 256
  Resize-Square $raw "assets/images/ui/icons/v2_128/$($ic.n).png" 128
  Resize-Square $raw "assets/images/ui/icons/v2_64/$($ic.n).png" 64
}
$buttons=@(
@{n='btn_primary_wide_normal';x=16;y=403;w=223;h=118},
@{n='btn_primary_wide_pressed';x=247;y=403;w=223;h=118},
@{n='btn_secondary_wide_normal';x=477;y=403;w=225;h=118},
@{n='btn_secondary_wide_pressed';x=706;y=403;w=223;h=118},
@{n='btn_primary_wide_disabled';x=16;y=560;w=223;h=112},
@{n='btn_secondary_wide_disabled';x=706;y=560;w=223;h=112},
@{n='btn_pill_small_normal';x=24;y=724;w=178;h=100},
@{n='btn_pill_small_pressed';x=214;y=724;w=178;h=100},
@{n='btn_pill_small_disabled';x=612;y=724;w=178;h=100},
@{n='btn_icon_round_normal';x=25;y=839;w=166;h=166},
@{n='btn_icon_round_pressed';x=219;y=839;w=166;h=166},
@{n='btn_icon_round_disabled';x=412;y=839;w=166;h=166},
@{n='frame_banner_ad_normal';x=654;y=844;w=365;h=140}
)
foreach($b in $buttons){
  $raw="assets/images/ui/buttons/v2_raw/$($b.n).png"; Crop-Save $srcUI $raw $b.x $b.y $b.w $b.h
  Resize-Height $raw "assets/images/ui/buttons/v2_hd/$($b.n).png" 96
  Resize-Height $raw "assets/images/ui/buttons/v2_sd/$($b.n).png" 64
}

# Panels/HUD v2
$srcPanel=Join-Path $pack 'pack_panels_hud_frames_v2.png'
$panels=@(
@{n='panel_primary_bg';x=34;y=25;w=230;h=367},
@{n='panel_secondary_bg';x=258;y=25;w=233;h=367},
@{n='panel_result_bg';x=572;y=35;w=388;h=233},
@{n='panel_shop_item_card';x=548;y=300;w=311;h=152},
@{n='panel_shop_item_card_alt';x=39;y=425;w=281;h=161},
@{n='panel_popup_compact';x=281;y=454;w=247;h=145},
@{n='progress_bar_frame';x=541;y=659;w=412;h=98},
@{n='tab_active';x=35;y=646;w=234;h=121},
@{n='tab_inactive';x=253;y=647;w=254;h=117},
@{n='score_plate';x=42;y=830;w=264;h=125},
@{n='combo_plate';x=303;y=818;w=193;h=189},
@{n='toast_bg';x=702;y=835;w=259;h=130}
)
foreach($p in $panels){ Crop-Save $srcPanel "assets/images/ui/panels/v2_raw/$($p.n).png" $p.x $p.y $p.w $p.h }

# Board v2
$srcBoard=Join-Path $pack 'pack_board_4x4_dark_grid_v2.png'
$board=@(
@{n='board_frame_4x4_dark';x=38;y=24;w=950;h=960},
@{n='board_bg_inner_dark';x=106;y=90;w=814;h=814},
@{n='cell_empty_normal';x=240;y=146;w=136;h=136},
@{n='cell_empty_hint';x=640;y=337;w=136;h=136},
@{n='cell_empty_blocked';x=640;y=146;w=136;h=136},
@{n='cell_spawn_flash';x=432;y=337;w=136;h=136},
@{n='cell_drag_target_highlight';x=640;y=721;w=136;h=136}
)
foreach($b in $board){ Crop-Save $srcBoard "assets/images/gameplay/board/v2_raw/$($b.n).png" $b.x $b.y $b.w $b.h }

# Tutorial/Minigame FX v2
$srcTut=Join-Path $pack 'pack_tutorial_countdown_fx_v2.png'
$tut=@(
@{n='tutorial_swipe_hand';x=60;y=52;w=198;h=198;dir='assets/images/tutorial/v2'},
@{n='tutorial_swipe_arrow';x=262;y=34;w=288;h=214;dir='assets/images/tutorial/v2'},
@{n='tutorial_highlight_ring';x=648;y=40;w=286;h=226;dir='assets/images/tutorial/v2'},
@{n='minigame_target_orb';x=56;y=338;w=236;h=238;dir='assets/images/minigame/v2'},
@{n='minigame_hit_effect';x=298;y=338;w=266;h=282;dir='assets/images/minigame/v2'},
@{n='minigame_miss_effect';x=584;y=340;w=356;h=272;dir='assets/images/minigame/v2'},
@{n='countdown_3';x=52;y=704;w=278;h=300;dir='assets/images/tutorial/v2'},
@{n='countdown_2';x=352;y=714;w=262;h=300;dir='assets/images/tutorial/v2'},
@{n='countdown_go';x=630;y=720;w=380;h=290;dir='assets/images/tutorial/v2'}
)
foreach($t in $tut){ Crop-Save $srcTut (Join-Path $t.dir ($t.n+'.png')) $t.x $t.y $t.w $t.h }

# Branding v2
$srcBrand=Join-Path $pack 'pack_branding_logo_title_variants_v2.png'
$brand=@(
@{n='logo_round_forest_merge';x=32;y=32;w=224;h=224},
@{n='logo_title_tree_horizontal';x=282;y=34;w=460;h=300},
@{n='logo_circle_bg_only';x=760;y=31;w=224;h=224},
@{n='title_scene_hero';x=8;y=450;w=1008;h=510}
)
foreach($b in $brand){ Crop-Save $srcBrand "assets/images/branding/v2/$($b.n).png" $b.x $b.y $b.w $b.h }

# VFX board burst variants v2
$srcVfx=Join-Path $pack 'pack_vfx_board_burst_variants_v2.png'
$vfx=@(
@{n='fx_board_burst_blue_a';x=0;y=0;w=512;h=512},
@{n='fx_board_burst_blue_b';x=512;y=0;w=512;h=512},
@{n='fx_board_burst_white';x=0;y=512;w=512;h=512},
@{n='fx_board_burst_red_warning';x=512;y=512;w=512;h=512}
)
foreach($v in $vfx){
  $raw="assets/images/vfx/v2_raw/$($v.n).png"
  Crop-Save $srcVfx $raw $v.x $v.y $v.w $v.h
  Resize-Height $raw "assets/images/vfx/v2_1080h/$($v.n).png" 1080
}




