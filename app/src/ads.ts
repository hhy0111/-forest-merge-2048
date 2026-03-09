export type AdPlacement = 'banner_lobby' | 'banner_result' | 'reward_result';

export type RewardResult = {
  rewarded: boolean;
};

type NativeAdsBridge = {
  showBanner: (placement: AdPlacement) => void;
  hideBanner: () => void;
  showRewardedAd: (placement: AdPlacement, requestId: string) => void;
};

declare global {
  interface Window {
    AndroidAds?: NativeAdsBridge;
    __onAndroidRewardedAdResult?: (requestId: string, rewarded: boolean) => void;
  }
}

const bannerRegistry = new Map<HTMLElement, AdPlacement>();
const pendingRewards = new Map<string, (result: RewardResult) => void>();
let nativeBannerPlacement: AdPlacement | null = null;
let rewardSeq = 0;
let rewardCallbackBound = false;

function hasNativeBridge() {
  return typeof window.AndroidAds !== 'undefined';
}

function bindRewardCallback() {
  if (rewardCallbackBound) return;
  rewardCallbackBound = true;

  window.__onAndroidRewardedAdResult = (requestId, rewarded) => {
    const resolver = pendingRewards.get(requestId);
    if (!resolver) return;
    pendingRewards.delete(requestId);
    resolver({ rewarded: Boolean(rewarded) });
  };
}

function findVisibleBannerPlacement(): AdPlacement | null {
  for (const [container, placement] of bannerRegistry.entries()) {
    if (!container.classList.contains('ad-ready')) continue;
    if (container.offsetParent === null) continue;
    return placement;
  }
  return null;
}

function syncNativeBanner() {
  if (!hasNativeBridge()) return;
  const bridge = window.AndroidAds!;
  const placement = findVisibleBannerPlacement();

  if (!placement) {
    if (nativeBannerPlacement !== null) {
      bridge.hideBanner();
      nativeBannerPlacement = null;
    }
    return;
  }

  if (nativeBannerPlacement === placement) return;
  bridge.showBanner(placement);
  nativeBannerPlacement = placement;
}

export function initAds() {
  if (hasNativeBridge()) {
    bindRewardCallback();
    return;
  }
  // Web fallback: placeholder only.
}

export function showBanner(container: HTMLElement, placement: AdPlacement) {
  container.dataset.adPlacement = placement;
  container.classList.add('ad-ready');
  bannerRegistry.set(container, placement);

  if (hasNativeBridge()) {
    container.textContent = '';
    syncNativeBanner();
    return;
  }

  container.textContent = 'Banner Ad Placeholder';
}

export function hideBanner(container: HTMLElement) {
  container.classList.remove('ad-ready');
  bannerRegistry.delete(container);

  if (hasNativeBridge()) {
    container.textContent = '';
    syncNativeBanner();
    return;
  }

  container.textContent = '';
}

export function refreshAdsLayout() {
  if (!hasNativeBridge()) return;
  syncNativeBanner();
}

export async function showRewardedAd(placement: AdPlacement): Promise<RewardResult> {
  if (hasNativeBridge()) {
    bindRewardCallback();

    return new Promise((resolve) => {
      const requestId = `reward_${Date.now()}_${++rewardSeq}`;
      pendingRewards.set(requestId, resolve);

      const timeout = window.setTimeout(() => {
        if (!pendingRewards.has(requestId)) return;
        pendingRewards.delete(requestId);
        resolve({ rewarded: false });
      }, 30_000);

      const wrappedResolve = (result: RewardResult) => {
        window.clearTimeout(timeout);
        resolve(result);
      };

      pendingRewards.set(requestId, wrappedResolve);

      try {
        window.AndroidAds!.showRewardedAd(placement, requestId);
      } catch {
        pendingRewards.delete(requestId);
        window.clearTimeout(timeout);
        resolve({ rewarded: false });
      }
    });
  }

  return new Promise((resolve) => {
    const ok = confirm('Watch ad to claim bonus?');
    window.setTimeout(() => resolve({ rewarded: ok }), 200);
  });
}
