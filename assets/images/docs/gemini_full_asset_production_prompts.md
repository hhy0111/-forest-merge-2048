# Gemini 전체 이미지 제작 프롬프트 (개발 완료 기준)

## 목적
이 문서는 2048 기반 `Forest Merge` 모바일 게임을 실제 출시 가능 수준까지 개발하기 위해 필요한 이미지 자산을 Gemini로 생성할 때 쓰는 통합 프롬프트 세트입니다.

## 사용 순서
1. `Batch A`부터 순서대로 Gemini에 요청한다.
2. 배치마다 결과를 저장한 뒤 다음 배치를 요청한다.
3. 파일명은 반드시 문서의 이름을 그대로 사용한다.
4. PNG는 기본적으로 `RGBA(투명 배경)`로 받는다.

## 공통 스타일 고정 프롬프트 (모든 배치에 앞에 붙여서 사용)
```text
모바일 2D 퍼즐 게임 "Forest Merge" 아트 스타일로 에셋을 제작해줘.

고정 스타일:
- 판타지 숲 세계관, 청록/민트 + 골드 포인트
- 부드러운 글로우, 과한 노이즈/번짐 금지
- 작은 해상도에서도 인식 가능한 선명한 실루엣
- 전체 세트 간 색감/광원/재질 일관성 유지

법적 안전 규칙:
- 특정 IP/브랜드/로고/캐릭터/인물/작가/스튜디오를 연상시키는 요소는 금지.
- 기존 작품의 스타일/구도를 모방하지 말고, 완전히 독창적인 결과물로 제작해줘.

중요 제작 규칙:
- UI 스킨(버튼/패널/프레임)은 텍스트를 넣지 않는다.
- 아이콘/오브젝트는 배경 완전 투명 PNG로 출력한다.
- 각 파일은 개별 파일로 저장 가능한 형태로 제공한다.
- 파일명은 내가 지정한 이름을 그대로 사용한다.
- 동일 오브젝트는 중심 정렬, 일관된 여백 비율을 유지한다.
```

---

## Batch A: 브랜딩/스토어/런치 이미지
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

아래 브랜딩 파일을 생성해줘.

파일 목록:
- app_icon_1024.png (1024x1024)
- adaptive_icon_foreground.png (432x432, 투명)
- adaptive_icon_background.png (432x432, 불투명)
- splash_logo_only.png (1536x1536, 투명)
- title_logo_horizontal.png (2048x1024, 투명)
- store_feature_graphic.png (1024x500)
- store_promo_banner.png (1920x1080)

조건:
- 앱 아이콘은 작은 크기에서 식별성 최우선
- 로고는 텍스트 윤곽이 깨지지 않게 선명하게
- 브랜드 요소: 숲, 수정, 진화, 빛나는 씨앗
```

저장 위치:
- `assets/images/branding/`

---

## Batch B: 타일(2~2048) 최종 런타임 세트
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

2048 진화형 타일 세트를 제작해줘. 숫자 텍스트는 넣지 말고 오브젝트만 넣어줘.

파일명(고정):
- tile_2_seed
- tile_4_sprout
- tile_8_flower
- tile_16_branch
- tile_32_tree
- tile_64_crystal
- tile_128_emblem
- tile_256_lantern
- tile_512_totem
- tile_1024_core
- tile_2048_final

각 파일당 출력:
- {name}_512.png (512x512, 투명)
- {name}_256.png (256x256, 투명)
- {name}_128.png (128x128, 투명)
- {name}_64.png (64x64, 투명)

추가 파일:
- tile_frame_base_256.png (256x256, 투명)
- tile_frame_rare_256.png (256x256, 투명)
- tile_shadow_soft_256.png (256x256, 투명)
```

저장 위치:
- `assets/images/gameplay/tiles/`

---

## Batch C: 보드/셀/그리드 조립 파츠
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

4x4 퍼즐 보드를 조립할 수 있는 분리 파츠를 제작해줘.

파일 목록:
- board_frame_4x4.png (1536x1536, 투명)
- board_bg_inner_4x4.png (1536x1536, 불투명)
- board_overlay_vignette.png (1536x1536, 투명)
- cell_empty_normal_256.png (256x256, 투명)
- cell_empty_hint_256.png (256x256, 투명)
- cell_empty_blocked_256.png (256x256, 투명)
- cell_glow_hint_256.png (256x256, 투명)
- cell_spawn_flash_256.png (256x256, 투명)
- board_grid_line_soft.png (1536x1536, 투명)
- board_drag_target_highlight.png (256x256, 투명)

조건:
- 보드 프레임은 모서리 디테일과 외곽 장식 포함
- 셀 파츠는 서로 톤이 충돌하지 않게 명도 차이 유지
```

저장 위치:
- `assets/images/gameplay/board/`

---

## Batch D: 아이템/재화/상태 아이콘
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

아이템과 재화 아이콘을 제작해줘. 전부 투명 PNG.

아이템 파일:
- item_undo_512.png
- item_shuffle_512.png
- item_hammer_512.png
- item_double_score_512.png
- item_startup_512.png

재화 파일:
- currency_leaf_256.png
- currency_coin_256.png
- currency_gem_256.png
- currency_energy_256.png

상태/배지 파일:
- badge_new_256.png
- badge_best_256.png
- badge_locked_256.png
- badge_ad_bonus_256.png
- icon_timer_256.png
- icon_combo_256.png

추가 변형:
- 위 파일 중 item_* 와 currency_* 는 128/64 버전도 함께 제공
```

저장 위치:
- `assets/images/gameplay/items/`
- `assets/images/gameplay/currency/`
- `assets/images/ui/badges/`

---

## Batch E: UI 아이콘 + 버튼 상태 3종(필수)
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

UI 아이콘 세트와 버튼 스킨 상태별(normal/pressed/disabled)을 만들어줘.

아이콘 파일(투명 PNG, 256 기본 + 128/64 제공):
- icon_back
- icon_next
- icon_home
- icon_pause
- icon_play
- icon_retry
- icon_settings
- icon_shop
- icon_mission
- icon_ranking
- icon_sound_on
- icon_sound_off
- icon_music_on
- icon_music_off
- icon_ads
- icon_close

버튼 스킨 파일(텍스트 금지, 투명 PNG):
- btn_primary_wide_normal.png (1024x256)
- btn_primary_wide_pressed.png (1024x256)
- btn_primary_wide_disabled.png (1024x256)
- btn_secondary_wide_normal.png (1024x256)
- btn_secondary_wide_pressed.png (1024x256)
- btn_secondary_wide_disabled.png (1024x256)
- btn_pill_small_normal.png (512x160)
- btn_pill_small_pressed.png (512x160)
- btn_pill_small_disabled.png (512x160)
- btn_icon_round_normal.png (256x256)
- btn_icon_round_pressed.png (256x256)
- btn_icon_round_disabled.png (256x256)
- frame_banner_ad_normal.png (1200x180)

조건:
- 버튼은 9-slice로 늘려도 모서리 형태가 유지되게 디자인
```

저장 위치:
- `assets/images/ui/icons/`
- `assets/images/ui/buttons/`

---

## Batch F: 패널/팝업/상점 UI 조립팩
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

결과창/상점/보상창/설정창을 조립할 수 있는 패널 파츠를 만들어줘.
텍스트는 절대 넣지 말고 프레임/배경만 제작.

파일 목록:
- panel_primary_bg_1024x640.png
- panel_secondary_bg_1024x640.png
- panel_result_bg_1280x720.png
- panel_shop_item_card_768x320.png
- panel_popup_compact_768x480.png
- panel_popup_large_1280x960.png
- tab_active_512x160.png
- tab_inactive_512x160.png
- progress_bar_frame_1024x128.png
- progress_bar_fill_1024x128.png
- score_plate_512x160.png
- combo_plate_512x160.png
- toast_bg_768x192.png

조건:
- 패널은 내부 컨텐츠가 잘 보이도록 대비 확보
- 결과/상점 화면에서 재화 아이콘이 묻히지 않도록 채도 제어
```

저장 위치:
- `assets/images/ui/panels/`
- `assets/images/ui/hud/`

---

## Batch G: VFX 스프라이트시트(애니메이션용)
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

모바일 퍼즐 게임용 VFX를 프레임 시트로 제작해줘.
모든 시트는 투명 PNG, 최대 2048x2048.

출력 규칙:
- 셀 크기: 256x256
- 프레임 수: 8~16
- 파일명 + 메타(프레임 수, 권장 fps) 제공

필수 파일:
- fx_merge_burst_sheet.png
- fx_merge_glow_ring_sheet.png
- fx_combo_burst_sheet.png
- fx_pre_goal_warning_sheet.png
- fx_game_clear_flash_sheet.png
- fx_tile_spawn_sheet.png
- fx_coin_pop_sheet.png
- fx_button_tap_spark_sheet.png

추가 단일 이미지:
- fx_screen_vignette_clear.png (1080x1920, 투명)
- fx_screen_vignette_warning.png (1080x1920, 투명)
```

저장 위치:
- `assets/images/vfx/sheets/`
- `assets/images/vfx/overlays/`

---

## Batch H: 튜토리얼/미니게임/UX 보조 자산
Gemini 요청 프롬프트:
```text
[공통 스타일 고정 프롬프트]

튜토리얼과 미니게임에 필요한 보조 이미지를 제작해줘.

파일 목록:
- tutorial_swipe_hand_512.png (투명)
- tutorial_swipe_arrow_512.png (투명)
- tutorial_highlight_ring_512.png (투명)
- minigame_target_orb_256.png (투명)
- minigame_hit_effect_256.png (투명)
- minigame_miss_effect_256.png (투명)
- countdown_3.png (512x512, 투명)
- countdown_2.png (512x512, 투명)
- countdown_1.png (512x512, 투명)
- countdown_go.png (512x512, 투명)
- loading_spinner_256.png (투명)
- touch_feedback_dot_128.png (투명)
```

저장 위치:
- `assets/images/tutorial/`
- `assets/images/minigame/`
- `assets/images/ui/common/`

---

## 최종 검수 체크리스트 (Gemini에 마지막으로 요청)
Gemini 요청 프롬프트:
```text
방금 생성한 에셋들을 아래 기준으로 자체 검수해줘.

검수 기준:
1) 파일명 오탈자 없음
2) 배경 투명 규칙 위반 없음
3) 상태별(normal/pressed/disabled) 시각 차이 명확
4) 작은 크기(64/128)에서 식별성 유지
5) 동일 카테고리 간 스타일/광원 일관성

위반 항목이 있으면 수정본을 파일명 동일하게 다시 출력해줘.
```

---

## 실제 적용 전 로컬 체크 항목
- 버튼/패널 텍스트가 이미지에 포함되면 재생성 요청
- 아이콘 외곽 잘림 여부 확인
- 9-slice 늘림 테스트(버튼/패널)
- 저해상도(64px) 가독성 확인
- Android/iOS 아이콘 safe area 확인

## 권장 파일 배치 루트
- 브랜딩: `assets/images/branding/`
- 게임플레이: `assets/images/gameplay/`
- UI: `assets/images/ui/`
- 이펙트: `assets/images/vfx/`
- 튜토리얼/미니게임: `assets/images/tutorial/`, `assets/images/minigame/`
