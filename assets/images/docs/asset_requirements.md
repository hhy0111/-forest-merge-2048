# 이미지 자산 정리/요구사항

## 현재 정리 완료 위치

### 원본 보관
- `assets/images/source/raw/splash_loading.png`
- `assets/images/source/raw/lobby_home.png`
- `assets/images/source/raw/main_game.png`
- `assets/images/source/raw/mini_game_bonus.png`
- `assets/images/source/raw/result_reward_shop.png`
- `assets/images/source/raw/tile_evolution_guide.png`
- `assets/images/source/raw/effects_feedback_guide.png`
- `assets/images/source/raw/ui_concept_collage_alt_theme.png`

### 앱 적용용 화면 이미지
- 트림본(여백 제거): `assets/images/screens/concept_trimmed/*.png`
- 모바일 1080x1920: `assets/images/screens/mobile_1080x1920/*.png`

### 가이드 이미지
- `assets/images/guides/tile_evolution_guide.png`
- `assets/images/guides/effects_feedback_guide.png`
- `assets/images/guides/ui_concept_collage_alt_theme.png`

## 권장 사용 규격
- 화면 배경(세로): 1080x1920, PNG
- 로비/메인/결과/미니게임/스플래시: `assets/images/screens/mobile_1080x1920/`
- 원본 시안 보관: `assets/images/source/raw/`
- 문서/참고 가이드: `assets/images/guides/`

## 추가 필요 파일 (현재 누락)
1. 앱 아이콘 세트
- 원본: 1024x1024 (`assets/images/branding/app_icon_1024.png`)
- Android Adaptive Icon: foreground/background 분리 (`assets/images/branding/adaptive_*`)
- iOS App Icon 세트 생성용 원본 포함

2. 게임 블록 개별 스프라이트
- 2~2048 단계(최소 11단계)
- 권장: 256x256 + 128x128
- 위치: `assets/images/gameplay/tiles/`

3. 아이템 아이콘 5종
- undo / shuffle / hammer / double_score / startup
- 권장: 128x128
- 위치: `assets/images/gameplay/items/`

4. UI 아이콘/버튼 분리 리소스
- 설정, 랭킹, 미션, 상점, 뒤로가기, 재시작
- 버튼 상태: normal/pressed/disabled
- 위치: `assets/images/ui/icons/`, `assets/images/ui/buttons/`

5. 이펙트 스프라이트
- 합성 글로우, 파티클, 콤보 버스트, 클리어 플래시
- 권장: 개별 PNG 또는 시트 2048x2048 이하
- 위치: `assets/images/vfx/`

## 참고
- 현재 화면 시안은 완성 목업 이미지(플랫) 중심이라, 실제 게임 UI 구현 시에는 요소 분리 리소스(아이콘/버튼/타일/VFX)가 추가로 필요함.
- `ui_concept_collage_alt_theme.png`는 색감/구성 참고용이며 메인 테마(Forest Merge)와 스타일이 다름.
