# V2 Asset Status And Gap Feedback

## 1) 정리/이동 완료
원본 통이미지(1024x1024)에서 사용 가능한 조각 에셋으로 분리했고, 아래 경로로 배치했습니다.

- `assets/images/reference/packs/pack_items_currency_badges_status_v2.png`
- `assets/images/reference/packs/pack_panels_hud_frames_v2.png`
- `assets/images/reference/packs/pack_tiles_evolution_set_v2.png`
- `assets/images/reference/packs/pack_board_4x4_dark_grid_v2.png`
- `assets/images/reference/packs/pack_tutorial_countdown_fx_v2.png`
- `assets/images/reference/packs/pack_ui_icons_buttons_states_v2.png`
- `assets/images/reference/packs/pack_branding_logo_title_variants_v2.png`
- `assets/images/reference/packs/pack_vfx_board_burst_variants_v2.png`

## 2) 바로 사용 가능한 추출본 (v2)
- 타일: `assets/images/gameplay/tiles/v2_raw`, `assets/images/gameplay/tiles/v2_256`, `assets/images/gameplay/tiles/v2_128`, `assets/images/gameplay/tiles/v2_64`
- 아이템: `assets/images/gameplay/items/v2_raw`, `assets/images/gameplay/items/v2_256`, `assets/images/gameplay/items/v2_128`, `assets/images/gameplay/items/v2_64`
- 재화: `assets/images/gameplay/currency/v2_raw`, `assets/images/gameplay/currency/v2_256`, `assets/images/gameplay/currency/v2_128`, `assets/images/gameplay/currency/v2_64`
- 보드: `assets/images/gameplay/board/v2_raw`
- UI 아이콘: `assets/images/ui/icons/v2_raw`, `assets/images/ui/icons/v2_256`, `assets/images/ui/icons/v2_128`, `assets/images/ui/icons/v2_64`
- 버튼: `assets/images/ui/buttons/v2_raw`, `assets/images/ui/buttons/v2_hd`, `assets/images/ui/buttons/v2_sd`
- 패널/배지: `assets/images/ui/panels/v2_raw`
- 튜토리얼/미니게임: `assets/images/tutorial/v2`, `assets/images/minigame/v2`
- 브랜딩: `assets/images/branding/v2`
- VFX: `assets/images/vfx/v2_raw`, `assets/images/vfx/v2_1080h`

## 3) 현재 품질 체크 메모
- 대부분 아이콘/버튼/타일은 경계 끊김 없이 사용 가능.
- `assets/images/ui/panels/v2_raw/panel_result_bg.png`는 좌측 가장자리 아주 미세한 이웃 프레임 흔적이 남아 있을 수 있어, 출시용 최종본에서는 단일 PNG 재생성 권장.
- 보드 셀 계열(`cell_empty_*`)은 통이미지 기반 추출이라 배경 질감이 일부 포함됨. 기능 구현에는 문제 없지만, 완전 분리형 파츠가 필요하면 전용 생성본 권장.

## 4) 개발 완료(출시 기준) 관점에서 추가 필요/부족 목록

### 2026-03-04 체크 결과
- 프롬프트 기준 필수 파일 전부 존재 확인됨 (누락 없음).
- 품질 이슈/재생성 권장 사항은 3) 품질 체크 메모 참고.
## 5) 참고
- 디버그 검사용 `_tmp_*.png` 파일이 `assets/images/docs` 아래에 남아 있습니다. 런타임 참조 경로에는 영향이 없습니다.
