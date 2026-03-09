$src='image'
$dst='assets/images/reference/packs'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$rename=@{
'Gemini_Generated_Image_187ctd187ctd187c.png'='pack_items_currency_badges_status_v2.png'
'Gemini_Generated_Image_3b0ivq3b0ivq3b0i.png'='pack_panels_hud_frames_v2.png'
'Gemini_Generated_Image_4g3ina4g3ina4g3i.png'='pack_tiles_evolution_set_v2.png'
'Gemini_Generated_Image_jq0afdjq0afdjq0a.png'='pack_board_4x4_dark_grid_v2.png'
'Gemini_Generated_Image_nm8mumnm8mumnm8m.png'='pack_tutorial_countdown_fx_v2.png'
'Gemini_Generated_Image_oqx3meoqx3meoqx3.png'='pack_ui_icons_buttons_states_v2.png'
'Gemini_Generated_Image_v3c99xv3c99xv3c9.png'='pack_branding_logo_title_variants_v2.png'
'Gemini_Generated_Image_xe917cxe917cxe91.png'='pack_vfx_board_burst_variants_v2.png'
'Gemini_Generated_Image_2d36zs2d36zs2d36.png'='pack_board_parts_dark_vine_theme.png'
'Gemini_Generated_Image_w3ww9zw3ww9zw3ww.png'='pack_panels_cards_and_shop_mock.png'
'Gemini_Generated_Image_whijz3whijz3whij.png'='pack_logo_and_title_scene.png'
'Gemini_Generated_Image_yrdpgyrdpgyrdpgy.png'='pack_vfx_bursts_tile_states_coin_flash.png'
}
$report=@()
foreach($k in $rename.Keys){
  $s=Join-Path $src $k
  if(-not (Test-Path $s)){ continue }
  $targetName=$rename[$k]
  $d=Join-Path $dst $targetName
  if(Test-Path $d){
    $h1=(Get-FileHash $s -Algorithm SHA256).Hash
    $h2=(Get-FileHash $d -Algorithm SHA256).Hash
    if($h1 -eq $h2){
      Remove-Item -Force $s
      $report += [PSCustomObject]@{Incoming=$k; Action='dedup_removed'; Target=$targetName}
    } else {
      $alt=[System.IO.Path]::GetFileNameWithoutExtension($targetName) + '_incoming_' + (Get-Date -Format 'HHmmss') + '.png'
      Move-Item -Force $s (Join-Path $dst $alt)
      $report += [PSCustomObject]@{Incoming=$k; Action='moved_alt'; Target=$alt}
    }
  } else {
    Move-Item -Force $s $d
    $report += [PSCustomObject]@{Incoming=$k; Action='moved'; Target=$targetName}
  }
}
$report | Format-Table -AutoSize
