## Automated Summary
- Automated: PASS (`npm run test`)
- Build: PASS (`npm run build`)
- Date: 2026-03-05

# QA Run Log

## Run Template
- Date:
- Build/Commit:
- Tester:
- Device/OS/Browser:
- Summary:
- Pass rate:

### Checklist
- [ ] Splash -> Lobby 전환
- [ ] Lobby 버튼 동작 (Start/Bonus/Shop/Upgrades/Settings)
- [ ] 게임 시작 시 타일 2개 생성
- [ ] 스와이프/키 입력 반응
- [ ] 타일 이동 애니메이션
- [ ] 합쳐짐 이펙트(흔들림/팝)
- [ ] 합쳐질 때 점수 팝업
- [ ] 콤보 팝업 중앙 표시
- [ ] 1024 긴장 UI 표시
- [ ] 2048 클리어 오버레이
- [ ] Game Over 오버레이
- [ ] 결과 화면 점수/포인트 표시
- [ ] 광고 보상 버튼(1회 제한)
- [ ] 아이템 구매/사용 제한 정상
- [ ] 업그레이드 화면 진입/복귀
- [ ] 업그레이드 구매 후 레벨/포인트 반영
- [ ] 업그레이드 적용 후 점수/종료 보너스 소폭 상승
- [ ] 미니게임 타이머/진행바
- [ ] 미니게임 히트/미스 이펙트
- [ ] 미니게임 보상/버프 지급
- [ ] 배너 광고 영역 표시
- [ ] 랭킹 탭 전환(일/주/월/전체)
- [ ] 랭킹 내 최고 기록 카드 표시
- [ ] 랭킹 Top3 강조 스타일 표시
- [ ] 동일 uid 반복 플레이 시 문서 1개 유지
- [ ] 낮은 점수 제출 시 최고점 유지
- [ ] 높은 점수 제출 시 최고점 갱신
- [ ] 오프라인 시 랭킹 안내 문구 표시
- [ ] 온라인 복귀 시 queue flush 후 반영

### Issues
-

---

## Run 2026-03-05
- Date: 2026-03-05
- Build/Commit:
- Tester:
- Device/OS/Browser:
- Summary:
- Pass rate:

### Checklist
- [ ] Splash -> Lobby 전환
- [ ] Lobby 버튼 동작 (Start/Bonus/Shop/Upgrades/Settings)
- [ ] 게임 시작 시 타일 2개 생성
- [ ] 스와이프/키 입력 반응
- [ ] 타일 이동 애니메이션
- [ ] 합쳐짐 이펙트(흔들림/팝)
- [ ] 합쳐질 때 점수 팝업
- [ ] 콤보 팝업 중앙 표시
- [ ] 1024 긴장 UI 표시
- [ ] 2048 클리어 오버레이
- [ ] Game Over 오버레이
- [ ] 결과 화면 점수/포인트 표시
- [ ] 광고 보상 버튼(1회 제한)
- [ ] 아이템 구매/사용 제한 정상
- [ ] 업그레이드 화면 진입/복귀
- [ ] 업그레이드 구매 후 레벨/포인트 반영
- [ ] 업그레이드 적용 후 점수/종료 보너스 소폭 상승
- [ ] 미니게임 타이머/진행바
- [ ] 미니게임 히트/미스 이펙트
- [ ] 미니게임 보상/버프 지급
- [ ] 배너 광고 영역 표시
- [ ] 랭킹 탭 전환(일/주/월/전체)
- [ ] 랭킹 내 최고 기록 카드 표시
- [ ] 랭킹 Top3 강조 스타일 표시
- [ ] 동일 uid 반복 플레이 시 문서 1개 유지
- [ ] 낮은 점수 제출 시 최고점 유지
- [ ] 높은 점수 제출 시 최고점 갱신
- [ ] 오프라인 시 랭킹 안내 문구 표시
- [ ] 온라인 복귀 시 queue flush 후 반영

### Issues
-


## Run 2026-03-06 (Upgrade + Ops)
- Date: 2026-03-06
- Build/Commit: local workspace
- Tester: Codex
- Device/OS/Browser: Android Emulator (FM2048_API34)
- Summary: Build/test passed. Runtime smoke blocked by unstable emulator reconnect/disconnect.
- Pass rate: N/A (environment blocked)

### Verified
- [x] `npm run test` passed (engine + progression tests)
- [x] `npm run build` passed
- [x] Android debug build (`:app:assembleDebug`) passed
- [x] App install (`adb install -r`) succeeded when device connected

### Blockers
- Emulator repeatedly disconnected from ADB during runtime checks.
- Could not complete deterministic UI flow validation (Lobby -> Upgrades -> purchase).

### Next Action
- Re-run smoke QA on stable emulator/device:
  1. Lobby -> Upgrades navigation
  2. Purchase one upgrade and verify level/point change
  3. Verify reward calculations (game end / mini-game / ad reward) with Economy Boost

## Run 2026-03-06 (Android Swipe/Input Fix)
- Date: 2026-03-06
- Build/Commit: local workspace
- Tester: Codex
- Device/OS/Browser: Android Emulator (FM2048_API34, WebView wrapper)
- Summary: Verified game input now works in Android WebView. Swipe directions update board/score/combo correctly.
- Pass rate: 8/8 targeted checks

### Targeted Checks
- [x] Lobby loads after splash (short solid-color transition, then normal)
- [x] Start Game opens game screen
- [x] Swipe left processed
- [x] Swipe right processed
- [x] Swipe up processed (merge + score change)
- [x] Swipe down processed (merge + score/combo change)
- [x] No zoom-stretch behavior during gestures
- [x] App remains responsive after multiple gestures

### Notes
- Observed transient solid background for a few seconds before lobby appears on cold launch; game then loads and runs normally.
- Emulator ADB connectivity is still occasionally unstable, but this run completed end-to-end.

## Run 2026-03-09 (Step 1-3 Closeout)
- Date: 2026-03-09
- Build/Commit: local workspace
- Tester: Codex
- Device/OS/Browser: Android Emulator (FM2048_API34, WebView wrapper)
- Summary: Launch transition stabilized (no blank-only phase), core lobby/game/ranking flow re-verified, and Firebase rules behavior validated.
- Pass rate: 24/29 targeted checks

### Verified
- [x] Splash -> Lobby transition (boot splash visible, then lobby)
- [x] Lobby buttons open target screens (Start/Bonus/Shop/Upgrades/Ranking/Settings toast)
- [x] Game start spawns initial tiles
- [x] Swipe input works on Android WebView (left/right/up/down)
- [x] Merge updates score in runtime play
- [x] Banner ad shows in lobby
- [x] Result/Shop screen opens from lobby
- [x] Upgrade screen opens from lobby
- [x] Upgrade purchase updates level and next cost (Clear Bonus+ Lv1 observed; next cost 195)
- [x] Ranking opens and reads live data
- [x] Ranking filters switch (Daily/Weekly/Monthly/All-time)
- [x] My record card section displayed
- [x] Top 1~3 emphasized style displayed
- [x] Firestore owner create/update rule path validated (REST smoke)
- [x] Firestore lower-score overwrite blocked (REST smoke)
- [x] Firestore other-user write blocked (REST smoke)
- [x] Firestore public read allowed for leaderboard (REST smoke)

### Not fully covered in this run
- [ ] Long-session UI checks: 1024 tension banner, 2048 clear overlay, hard game-over overlay
- [ ] Mini-game start/hit/reward loop (ADB tap reliability issue on this emulator session)
- [ ] Offline -> online queue flush end-to-end confirmation on emulator

### Notes
- Boot/launch quality improved: startup now shows the in-page boot splash immediately instead of a plain blank-only phase.
- Emulator ADB touch automation remains intermittently unstable; core gameplay and ranking checks were still completed.

