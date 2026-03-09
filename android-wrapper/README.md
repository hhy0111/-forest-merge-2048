# Forest Merge 2048 Android Wrapper

## Project
- Package: `com.forestmerge.game2048`
- Web source: `../app/dist`
- WebView entry: `file:///android_asset/web/index.html`

## Quick Start
1. At repo root, sync web assets:
   - `./scripts_sync_web_to_android.ps1`
2. Configure Android SDK path:
   - `./scripts_configure_android_sdk.ps1`
3. Open `android-wrapper` in Android Studio, then Sync Gradle.
4. Run on device/emulator.

## CLI Build (optional)
- `cd android-wrapper`
- `./gradlew.bat clean :app:assembleDebug`
- APK output: `app/build/outputs/apk/debug/app-debug.apk`

## AdMob mapping
- App ID: `ca-app-pub-4402708884038037~5406590795`
- Lobby banner: `ca-app-pub-4402708884038037/8512575792`
- Result banner: `ca-app-pub-4402708884038037/9098423799`
- Result rewarded: `ca-app-pub-4402708884038037/9697664956`

## Ad policy
- Banner shown only on Lobby / Result screens.
- Rewarded ad shown only from Result reward button.
- No ad on Splash / Game / Bonus / Ranking screens.

## Bridge contract
- JS side expects `window.AndroidAds`
- Methods:
  - `showBanner(placement)`
  - `hideBanner()`
  - `showRewardedAd(placement, requestId)`
- Native returns reward result by invoking:
  - `window.__onAndroidRewardedAdResult(requestId, rewarded)`
