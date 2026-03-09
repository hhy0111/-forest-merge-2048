# 개발 시작 전 추가 이미지 요청 프롬프트 (Gemini)

## 왜 추가가 필요한가
현재 폴더의 분할 리소스는 통이미지 크롭 기반이라 빠른 프로토타입에는 충분하지만,
실제 개발/현지화/상태 전환(pressed/disabled)/애니메이션 대응에는 한계가 있습니다.

핵심 추가 요청 방향:
- 텍스트가 박힌 버튼 대신 `텍스트 없는 버튼 스킨`
- 배경이 섞인 아이콘 대신 `투명 배경 아이콘`
- 보드/셀/팝업 등 `UI 조립용 파츠`
- 프레임 기반 `VFX 시트`

---

## P0 (개발 시작 필수)

### Prompt 1) 타일 마스터팩 (투명 PNG)
```text
모바일 퍼즐게임 "Forest Merge"용 타일 아이콘 세트를 만들어줘.
숫자 표기/텍스트 없이 순수 오브젝트만, 배경은 완전 투명 처리.

스타일:
- 판타지 숲 테마, 금빛 테두리, 청록/민트 계열 하이라이트
- 단계가 올라갈수록 희귀도와 광채가 증가
- 모든 타일은 같은 프레임 비율과 중심 정렬

필수 타일 11종 (파일명 고정):
1) tile_2_seed
2) tile_4_sprout
3) tile_8_flower
4) tile_16_branch
5) tile_32_tree
6) tile_64_crystal
7) tile_128_emblem
8) tile_256_lantern
9) tile_512_totem
10) tile_1024_core
11) tile_2048_final

출력 규격:
- 각 타일: 512x512 PNG (RGBA, transparent)
- 추가 리사이즈 버전: 256x256, 128x128
- 파일명은 위 이름 그대로
```

### Prompt 2) 아이템 아이콘 5종 (투명 PNG)
```text
2048 변형 게임용 아이템 아이콘 5종을 제작해줘.
배경 없는 투명 PNG로 제공하고, 원형 버튼 배경 없이 순수 아이콘 오브젝트만 출력.

아이템 목록 (파일명 고정):
- item_undo
- item_shuffle
- item_hammer
- item_double_score
- item_startup

스타일:
- Forest Merge 세계관과 동일한 금빛/청록 포인트
- 작은 사이즈에서도 인식 가능하게 단순 명확한 실루엣

출력:
- 512x512 PNG (투명), 128x128, 64x64
```

### Prompt 3) UI 아이콘 기본팩 (투명 PNG)
```text
모바일 게임 UI용 아이콘 세트를 제작해줘.
텍스트 없이 아이콘만, 투명 PNG.

아이콘 목록 (파일명 고정):
- icon_back
- icon_shop
- icon_mission
- icon_ranking
- icon_settings
- icon_retry
- icon_pause
- icon_home

스타일:
- Forest Merge 테마 일관성 유지
- 선명한 외곽, 작은 크기 가독성 우선

출력:
- 256x256 PNG (투명)
- 128x128, 64x64 버전도 함께
```

### Prompt 4) 텍스트 없는 버튼 스킨 (상태 3종)
```text
게임 UI 버튼 스킨을 텍스트 없는 형태로 제작해줘.
(문구는 개발 코드에서 렌더링할 예정)

버튼 타입:
1) primary_wide  (주요 CTA)
2) secondary_wide
3) small_pill
4) ad_banner_frame

상태:
- normal
- pressed
- disabled

파일명 규칙:
- btn_{type}_{state}.png
예) btn_primary_wide_normal.png

출력 조건:
- 투명 PNG
- 9-slice 적용 가능한 구조(모서리 보존, 중앙 확장 가능한 디자인)
- 기본 해상도:
  - wide: 1024x256
  - pill: 512x160
  - ad_banner_frame: 1200x180
```

### Prompt 5) 보드 조립용 파츠
```text
2048 변형(4x4) 보드 UI를 조립할 수 있도록 분리 파츠를 제작해줘.
텍스트 없음, 투명 PNG.

필수 파츠:
- board_frame_4x4
- board_bg_inner
- cell_empty_normal
- cell_empty_hint
- cell_empty_blocked
- tile_glow_overlay
- tile_spawn_flash

출력:
- board_frame_4x4: 1536x1536
- board_bg_inner: 1536x1536
- cell 계열: 256x256
- overlay/flash: 256x256

스타일:
- Forest Merge 테마 일관성
- 타일(128/256) 위에 겹쳐도 어색하지 않게 채도/명도 조절
```

---

## P1 (개발 안정화에 필요)

### Prompt 6) VFX 시트 (프레임 애니메이션)
```text
모바일 2D 게임용 VFX 스프라이트 시트를 제작해줘.
배경 투명 PNG, 프레임 분리가 쉬운 일정 그리드.

이펙트 목록:
1) fx_merge_burst
2) fx_combo_burst
3) fx_goal_warning_pulse
4) fx_clear_flash
5) fx_coin_pop

요구사항:
- 각 효과: 8~16프레임
- 시트 크기: 최대 2048x2048
- 프레임당 권장 셀: 256x256
- 파일명: fx_{name}_sheet.png
- 각 시트마다 프레임 수/재생속도(ms) 메모 포함
```

### Prompt 7) 팝업/패널 조립팩
```text
결과창/상점/보상창에 사용할 패널 UI 파츠를 제작해줘.
텍스트 없는 투명 PNG, 9-slice 확장 가능 구조.

필수:
- panel_primary
- panel_secondary
- panel_shop_item
- panel_reward_highlight
- badge_new
- badge_best

기본 출력:
- panel 계열: 1024x640
- badge 계열: 256x128
- 상태별(normal/highlight)도 함께 제공
```

---

## P2 (출시 준비)

### Prompt 8) 앱 아이콘/스토어 그래픽
```text
Forest Merge 앱 브랜딩 리소스를 제작해줘.

필수 산출:
1) app_icon_1024.png (iOS/Android 공용 원본)
2) adaptive_icon_foreground.png (432x432)
3) adaptive_icon_background.png (432x432)
4) store_feature_graphic.png (1024x500)

스타일:
- 타이틀 로고 + 대표 오브젝트(씨앗/나무/크리스탈) 조합
- 작은 썸네일에서도 식별되는 강한 실루엣
```

---

## 전달 팁
- 한 번에 전부 요청하지 말고, `P0 -> P1 -> P2` 순으로 나눠 요청하면 품질 관리가 쉽습니다.
- 요청시 "배경 완전 투명", "텍스트 제외", "파일명 고정"을 반드시 반복해 주세요.
- 생성본을 받으면 아래 위치에 넣어주세요:
  - 타일: `assets/images/gameplay/tiles/`
  - 아이템: `assets/images/gameplay/items/`
  - 아이콘: `assets/images/ui/icons/`
  - 버튼: `assets/images/ui/buttons/`
  - 보드/패널/VFX: `assets/images/ui/`, `assets/images/vfx/`
