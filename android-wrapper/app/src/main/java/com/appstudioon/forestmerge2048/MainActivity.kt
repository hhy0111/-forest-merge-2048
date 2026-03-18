package com.appstudioon.forestmerge2048

import android.annotation.SuppressLint
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

  private lateinit var webView: WebView
  private lateinit var bannerContainer: FrameLayout

  private var bannerAdView: AdView? = null
  private var currentBannerPlacement: String? = null

  private val rewardedAds = mutableMapOf<String, RewardedAd?>()
  private val rewardedLoading = mutableSetOf<String>()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    webView = findViewById(R.id.web_view)
    bannerContainer = findViewById(R.id.banner_container)

    MobileAds.initialize(this)
    setupWebView()
    preloadRewardedAd("reward_result")
    preloadRewardedAd("reward_lobby")
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun setupWebView() {
    val assetLoader = WebViewAssetLoader.Builder()
      .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
      .build()

    webView.settings.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
      mediaPlaybackRequiresUserGesture = false
      allowFileAccess = true
      allowContentAccess = true
      setSupportZoom(false)
      builtInZoomControls = false
      displayZoomControls = false
      mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
    }

    webView.setBackgroundColor(Color.parseColor("#0D2F2E"))
    webView.isVerticalScrollBarEnabled = false
    webView.isHorizontalScrollBarEnabled = false

    webView.webViewClient = object : WebViewClientCompat() {
      override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
      ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(request.url)
      }

      override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(Uri.parse(url))
      }

      override fun onPageFinished(view: WebView, url: String) {
        super.onPageFinished(view, url)
        Log.d("FM2048Web", "page finished: $url")
      }
    }

    webView.webChromeClient = object : WebChromeClient() {
      override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
        Log.d(
          "FM2048Web",
          "${consoleMessage.messageLevel()}: ${consoleMessage.message()} (${consoleMessage.sourceId()}:${consoleMessage.lineNumber()})"
        )
        return super.onConsoleMessage(consoleMessage)
      }
    }

    webView.addJavascriptInterface(AndroidAdsBridge(), "AndroidAds")
    webView.loadUrl(getString(R.string.web_entry_url))
  }

  private fun bannerUnitIdForPlacement(placement: String): String? {
    return when (placement) {
      "banner_lobby" -> getString(R.string.ad_unit_banner_lobby)
      "banner_result" -> getString(R.string.ad_unit_banner_result)
      else -> null
    }
  }

  private fun rewardedUnitIdForPlacement(placement: String): String? {
    return when (placement) {
      "reward_result" -> getString(R.string.ad_unit_reward_result)
      "reward_lobby" -> getString(R.string.ad_unit_reward_lobby)
      else -> null
    }
  }

  private fun showBannerInternal(placement: String) {
    val unitId = bannerUnitIdForPlacement(placement) ?: run {
      hideBannerInternal()
      return
    }

    if (currentBannerPlacement == placement && bannerAdView != null) return

    bannerAdView?.destroy()
    bannerContainer.removeAllViews()

    val adView = AdView(this).apply {
      adUnitId = unitId
      setAdSize(AdSize.BANNER)
    }

    bannerContainer.addView(adView)
    bannerContainer.visibility = View.VISIBLE
    bannerAdView = adView
    currentBannerPlacement = placement
    adView.loadAd(AdRequest.Builder().build())
  }

  private fun hideBannerInternal() {
    currentBannerPlacement = null
    bannerAdView?.destroy()
    bannerAdView = null
    bannerContainer.removeAllViews()
    bannerContainer.visibility = View.GONE
  }

  private fun preloadRewardedAd(placement: String) {
    val unitId = rewardedUnitIdForPlacement(placement) ?: return
    if (rewardedAds[placement] != null) return
    if (rewardedLoading.contains(placement)) return

    rewardedLoading.add(placement)
    RewardedAd.load(
      this,
      unitId,
      AdRequest.Builder().build(),
      object : RewardedAdLoadCallback() {
        override fun onAdLoaded(ad: RewardedAd) {
          rewardedAds[placement] = ad
          rewardedLoading.remove(placement)
        }

        override fun onAdFailedToLoad(error: LoadAdError) {
          rewardedAds.remove(placement)
          rewardedLoading.remove(placement)
        }
      }
    )
  }

  private fun showRewardedAdInternal(placement: String, requestId: String) {
    if (rewardedUnitIdForPlacement(placement) == null) {
      sendRewardResult(requestId, rewarded = false)
      return
    }

    val ad = rewardedAds[placement]
    if (ad == null) {
      sendRewardResult(requestId, rewarded = false)
      preloadRewardedAd(placement)
      return
    }

    var rewarded = false

    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
      override fun onAdDismissedFullScreenContent() {
        rewardedAds.remove(placement)
        sendRewardResult(requestId, rewarded)
        preloadRewardedAd(placement)
      }

      override fun onAdFailedToShowFullScreenContent(adError: AdError) {
        rewardedAds.remove(placement)
        sendRewardResult(requestId, rewarded = false)
        preloadRewardedAd(placement)
      }

      override fun onAdShowedFullScreenContent() {
        rewardedAds.remove(placement)
      }
    }

    ad.show(this) {
      rewarded = true
    }
  }

  private fun sendRewardResult(requestId: String, rewarded: Boolean) {
    val escapedRequestId = JSONObject.quote(requestId)
    val rewardedLiteral = if (rewarded) "true" else "false"
    val js = "window.__onAndroidRewardedAdResult && window.__onAndroidRewardedAdResult($escapedRequestId, $rewardedLiteral);"
    webView.post {
      webView.evaluateJavascript(js, null)
    }
  }

  override fun onDestroy() {
    bannerAdView?.destroy()
    webView.removeJavascriptInterface("AndroidAds")
    webView.destroy()
    rewardedAds.clear()
    rewardedLoading.clear()
    super.onDestroy()
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    if (webView.canGoBack()) {
      webView.goBack()
      return
    }
    super.onBackPressed()
  }

  inner class AndroidAdsBridge {
    @JavascriptInterface
    fun showBanner(placement: String) {
      runOnUiThread {
        showBannerInternal(placement)
      }
    }

    @JavascriptInterface
    fun hideBanner() {
      runOnUiThread {
        hideBannerInternal()
      }
    }

    @JavascriptInterface
    fun showRewardedAd(placement: String, requestId: String) {
      runOnUiThread {
        showRewardedAdInternal(placement, requestId)
      }
    }
  }
}

