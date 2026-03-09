import { FIREBASE_CONFIG, getFirebaseApp } from './firebase';

type AnalyticsEvent = {
  name: string;
  params?: Record<string, unknown>;
  ts: number;
};

const ANALYTICS_QUEUE_KEY = 'fm_analytics_queue_v1';
const QUEUE_LIMIT = 200;

let analyticsReady = false;
let initPromise: Promise<void> | null = null;
let logEventFn: ((name: string, params?: Record<string, unknown>) => void) | null = null;
let queue: AnalyticsEvent[] = loadQueue();
let onlineListenerAttached = false;

function ensureOnlineListener() {
  if (onlineListenerAttached) return;
  onlineListenerAttached = true;
  window.addEventListener('online', () => {
    initAnalytics();
    flushQueue();
  });
}

function loadQueue() {
  try {
    const raw = localStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!raw) return [] as AnalyticsEvent[];
    const parsed = JSON.parse(raw) as AnalyticsEvent[];
    if (!Array.isArray(parsed)) return [] as AnalyticsEvent[];
    return parsed.filter((entry) => entry && typeof entry.name === 'string');
  } catch {
    return [] as AnalyticsEvent[];
  }
}

function saveQueue() {
  try {
    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage write failures (quota/private mode).
  }
}

function enqueue(event: AnalyticsEvent) {
  queue.push(event);
  if (queue.length > QUEUE_LIMIT) {
    queue = queue.slice(queue.length - QUEUE_LIMIT);
  }
  saveQueue();
}

function flushQueue() {
  if (!analyticsReady || !logEventFn) return;
  if (!navigator.onLine) return;
  if (!queue.length) return;

  const pending = [...queue];
  const sender = logEventFn;
  queue = [];
  saveQueue();

  pending.forEach((event) => {
    try {
      sender(event.name, event.params);
    } catch {
      enqueue(event);
    }
  });
}

export function initAnalytics() {
  ensureOnlineListener();
  if (!FIREBASE_CONFIG.measurementId) return;
  if (analyticsReady || initPromise) return;
  if (!navigator.onLine) return;

  initPromise = (async () => {
    try {
      const { getAnalytics, logEvent, setAnalyticsCollectionEnabled } = await import('firebase/analytics');
      const analytics = getAnalytics(getFirebaseApp());
      setAnalyticsCollectionEnabled(analytics, true);
      logEventFn = (name, params) => {
        logEvent(analytics, name, params);
      };
      analyticsReady = true;
      flushQueue();
    } catch (err) {
      console.warn('Analytics init failed', err);
      analyticsReady = false;
      logEventFn = null;
    } finally {
      initPromise = null;
    }
  })();
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  const event: AnalyticsEvent = {
    name,
    params,
    ts: Date.now(),
  };

  if (!navigator.onLine || !analyticsReady || !logEventFn) {
    enqueue(event);
    return;
  }

  try {
    logEventFn(name, params);
  } catch {
    enqueue(event);
  }
}

export function trackScreen(screen: string) {
  trackEvent('screen_view', { screen_name: screen });
}
