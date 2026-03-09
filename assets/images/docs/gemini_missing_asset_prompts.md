# NOTE (2026-03-04)
현재 기준 누락 에셋 없음. 신규 에셋 누락 발생 시에만 아래 배치를 사용.

# Gemini 누락 에셋 요청 프롬프트 (출시 기준)

이 문서는 현재 프로젝트에서 아직 없는 파일만 생성하기 위한 요청문입니다.
기준 문서: `assets/images/docs/v2_asset_status_and_gaps.md`

## 공통 고정 지시문 (모든 배치 맨 앞에 붙이기)
```text
모바일 2D 퍼즐 게임 "Forest Merge" 아트 스타일로 제작해줘.

스타일 고정:
- 판타지 숲 세계관, 청록/민트 + 골드 포인트
- 작은 해상도에서도 식별 가능한 선명한 실루엣
- 전체 세트 간 색감/광원/재질 일관성 유지

법적 안전 규칙:
- 특정 IP/브랜드/로고/캐릭터/인물/작가/스튜디오를 연상시키는 요소는 금지.
- 기존 작품의 스타일/구도를 모방하지 말고, 완전히 독창적인 결과물로 제작해줘.

출력 고정 규칙:
- 내가 지정한 파일명/해상도를 정확히 지켜줘.
- 파일별 개별 PNG로 제공해줘.
- 별도 지시가 없으면 배경은 완전 투명(RGBA)으로 출력해줘.
- UI 스킨(버튼/패널/프레임)은 텍스트를 넣지 말아줘.
- 가장자리 잘림이 없도록 오브젝트 외곽 여백(safe padding) 4~8px 확보해줘.
```

---

## Batch 1) 브랜딩/스토어 누락분
```text
[공통 고정 지시문]

아래 파일을 생성해줘.

- app_icon_1024.png (1024x1024, 불투명)
- adaptive_icon_foreground.png (432x432, 투명)
- adaptive_icon_background.png (432x432, 불투명)
- splash_logo_only.png (1536x1536, 투명)
- title_logo_horizontal.png (2048x1024, 투명)
- store_feature_graphic.png (1024x500, 불투명)
- store_promo_banner.png (1920x1080, 불투명)

추가 조건:
- 앱 아이콘은 작은 썸네일에서도 식별성 최우선
- 브랜드 요소: 숲, 수정, 빛나는 씨앗, 진화한 나무
```

저장 위치:
- `assets/images/branding/`

---

## Batch 2) 타일 보조 파츠 누락분
```text
[공통 고정 지시문]

아래 파일을 생성해줘. 모두 투명 PNG.

- tile_frame_base_256.png (256x256)
- tile_frame_rare_256.png (256x256)
- tile_shadow_soft_256.png (256x256)

추가 조건:
- 기존 tile 아이콘 위에 합성해도 위화감 없게 제작
- rare 프레임은 base 대비 발광/디테일 강화
- shadow는 너무 진하지 않게 부드러운 반투명
```

저장 위치:
- `assets/images/gameplay/tiles/`

---

## Batch 3) 보드 보조 파츠 누락분
```text
[공통 고정 지시문]

아래 파일을 생성해줘.

- board_overlay_vignette.png (1536x1536, 투명)
- board_grid_line_soft.png (1536x1536, 투명)
- cell_glow_hint_256.png (256x256, 투명)

추가 조건:
- 보드 파츠는 4x4 셀 배치와 정렬 맞게 제작
- overlay는 플레이 방해 없는 약한 비네트
- hint glow는 셀 위에 덧씌워도 가독성 유지
```

저장 위치:
- `assets/images/gameplay/board/`

---

## Batch 4) UI/패널 누락분
```text
[공통 고정 지시문]

아래 파일을 생성해줘.

- panel_popup_large_1280x960.png (1280x960, 투명)
- progress_bar_fill_1024x128.png (1024x128, 투명)
- icon_music_on.png (256x256, 투명)

추가 조건:
- panel_popup_large는 9-slice 확장 가능한 구조
- progress_bar_fill은 좌->우 채움 애니메이션용 반복 가능한 중앙 패턴
- icon_music_on은 icon_music_off와 동일 스타일 세트
```

저장 위치:
- `assets/images/ui/panels/`
- `assets/images/ui/icons/`

---

## Batch 5) VFX 스프라이트시트 누락분
```text
[공통 고정 지시문]

아래 VFX를 제작해줘. 시트는 모두 투명 PNG.

시트 공통 규칙:
- 셀 크기 256x256
- 프레임 수 8~16
- 시트 최대 크기 2048x2048
- 각 파일마다 프레임 수와 권장 fps를 메모로 함께 제공
- 프레임은 256x256 그리드에 정확히 정렬하고, 시트 크기는 256의 정수배로 맞춰줘
- 권장 레이아웃 예시:
  - 8프레임: 1행 8열 (2048x256)
  - 12프레임: 3행 4열 (1024x768)
  - 16프레임: 4행 4열 (1024x1024)

필수 시트 파일:
- fx_merge_burst_sheet.png
- fx_merge_glow_ring_sheet.png
- fx_combo_burst_sheet.png
- fx_pre_goal_warning_sheet.png
- fx_game_clear_flash_sheet.png
- fx_tile_spawn_sheet.png
- fx_coin_pop_sheet.png
- fx_button_tap_spark_sheet.png

추가 강조:
- 아래 4개 시트는 반드시 8~16프레임의 시트로 제작(단일 1프레임 불가)
  - fx_game_clear_flash_sheet.png
  - fx_tile_spawn_sheet.png
  - fx_coin_pop_sheet.png
  - fx_button_tap_spark_sheet.png

단일 오버레이 파일:
- fx_screen_vignette_clear.png (1080x1920, 투명)
- fx_screen_vignette_warning.png (1080x1920, 투명)

추가 조건:
- 경고 효과는 붉은 계열, 클리어 효과는 금빛/민트 계열
- 과도한 노이즈 없이 합성 친화적 알파 표현
```

저장 위치:
- `assets/images/vfx/sheets/`
- `assets/images/vfx/overlays/`

---

## Batch 6) 튜토리얼/공통 누락분
```text
[공통 고정 지시문]

아래 파일을 생성해줘.

- countdown_1.png (512x512, 투명)
- loading_spinner_256.png (256x256, 투명)
- touch_feedback_dot_128.png (128x128, 투명)

추가 조건:
- countdown_2, countdown_3, countdown_go와 시각 톤 일치
- loading_spinner는 회전 애니메이션 전제로 중심 정렬
- touch_feedback_dot은 터치 반응 강조용으로 과하지 않게 발광
```

저장 위치:
- `assets/images/tutorial/`
- `assets/images/ui/common/`

---

## 최종 검수 요청 프롬프트 (마지막)
```text
방금 생성한 파일들을 아래 기준으로 자체 검수해줘.

1) 파일명 100% 일치
2) 해상도 정확히 일치
3) 투명/불투명 조건 준수
4) 가장자리 잘림(클리핑) 없음
5) 동일 카테고리 내 스타일 일관성 유지

위반 항목은 같은 파일명으로 수정본을 다시 출력해줘.
```
