# Android WebView + AdMob Integration Plan

## 1) Android wrapper project (prepared)
- Path: `android-wrapper`
- Type: native Android WebView wrapper (Kotlin)
- Main entry: `android-wrapper/app/src/main/java/com/forestmerge/game2048/MainActivity.kt`
- Gradle wrapper: `android-wrapper/gradlew.bat`
- Web asset sync script: `scripts_sync_web_to_android.ps1`
- SDK config script: `scripts_configure_android_sdk.ps1`

## 2) Package name (fixed)
- `applicationId`: `com.forestmerge.game2048`
- `namespace`: `com.forestmerge.game2048`

## 3) Ad placement policy (current game flow)
- `banner_lobby`: Lobby screen only
- `banner_result`: Result/Shop screen only
- `reward_result`: Result screen reward button click
- No banner in Game / Bonus Mode / Splash / Ranking to avoid input disruption

## 4) AdMob IDs applied
- App ID: `ca-app-pub-4402708884038037~5406590795`
- Banner (Lobby): `ca-app-pub-4402708884038037/8512575792`
- Banner (Result): `ca-app-pub-4402708884038037/9098423799`
- Rewarded (Result): `ca-app-pub-4402708884038037/9697664956`

## 5) Build & run order
1. Run `./scripts_sync_web_to_android.ps1` at repository root.
2. Run `./scripts_configure_android_sdk.ps1` at repository root.
3. Open `android-wrapper` in Android Studio.
4. Sync Gradle and run app on device.
5. Verify lobby/result banner and rewarded ad behavior.

## 6) Current verification status
- `npm run build` (web): PASS
- `npm run test` (web): PASS
- `./gradlew.bat -q help` (android): PASS
- `./gradlew.bat clean :app:assembleDebug` (android): PASS
- Debug APK: `android-wrapper/app/build/outputs/apk/debug/app-debug.apk`

## 7) Notes
- Boot splash fallback is injected in `app/index.html` to avoid blank-only startup frames in Android WebView.
- `app/src/ads.ts` supports native bridge (`window.AndroidAds`) + web fallback placeholder.
- `scripts_sync_web_to_android.ps1` now copies only runtime-required image files to reduce APK size.
- Device/emulator is not connected in current environment (`adb devices` empty).
