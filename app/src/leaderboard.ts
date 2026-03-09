import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseApp } from './firebase';

export type RankingPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

export type LeaderboardEntry = {
  id: string;
  uid: string;
  score: number;
  maxTile: number;
  createdAt?: number;
};

export type RankedLeaderboardEntry = LeaderboardEntry & {
  rank: number;
};

export type LeaderboardFetchResult = {
  entries: LeaderboardEntry[];
  myRecord?: RankedLeaderboardEntry;
  viewerUid?: string;
  totalEntries: number;
  errorCode?: string;
};

type PendingScore = {
  score: number;
  maxTile: number;
  ts: number;
};

type PeriodSnapshot = {
  key: string;
  score: number;
  maxTile: number;
  updatedAt?: number;
};

type RawLeaderboardDoc = {
  uid?: unknown;
  all?: unknown;
  daily?: unknown;
  weekly?: unknown;
  monthly?: unknown;
  score?: unknown;
  maxTile?: unknown;
  createdAt?: unknown;
};

const LEADERBOARD_COLLECTION = 'leaderboard';
const QUEUE_KEY = 'fm_leaderboard_queue_v1';
const QUEUE_LIMIT = 50;
const FETCH_SCAN_LIMIT = 1000;
const RANKING_PERIODS: RankingPeriod[] = ['all', 'daily', 'weekly', 'monthly'];

let authReady = false;
let authInit: Promise<void> | null = null;
let currentUid: string | null = null;
let onlineListenerAttached = false;
let pendingQueue = loadQueue();

let lastWarnSignature = '';
let lastWarnAt = 0;

function parseFirebaseError(err: unknown) {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code ?? 'unknown')
      : 'unknown';

  const message =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: unknown }).message ?? '')
      : '';

  return { code, message };
}

function warnLeaderboard(context: string, err: unknown) {
  const { code, message } = parseFirebaseError(err);
  const signature = `${context}:${code}:${message}`;
  const now = Date.now();

  // Suppress repeated identical warnings in short windows to keep logs readable.
  if (signature === lastWarnSignature && now - lastWarnAt < 10_000) {
    return;
  }

  lastWarnSignature = signature;
  lastWarnAt = now;

  console.warn(`[Leaderboard] ${context} failed (${code})${message ? `: ${message}` : ''}`);
}

function toSafeInt(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.floor(numberValue));
}

function toMillis(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || value === null) return undefined;

  if ('toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    const millis = (value as { toMillis: () => number }).toMillis();
    if (Number.isFinite(millis)) return millis;
  }

  return undefined;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function weekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const weekday = start.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  start.setDate(start.getDate() - offset);
  return start;
}

function getPeriodKey(period: RankingPeriod, now = new Date()) {
  if (period === 'all') return 'all';
  if (period === 'daily') return dateKey(now);
  if (period === 'weekly') return `week-${dateKey(weekStart(now))}`;
  return monthKey(now);
}

function getPeriodStart(period: RankingPeriod, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'daily') {
    return start.getTime();
  }

  if (period === 'weekly') {
    return weekStart(now).getTime();
  }

  start.setDate(1);
  return start.getTime();
}

function parsePeriodSnapshot(raw: unknown): PeriodSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.key !== 'string') return null;

  const score = toSafeInt(value.score);
  if (score <= 0) return null;

  return {
    key: value.key,
    score,
    maxTile: toSafeInt(value.maxTile),
    updatedAt: toMillis(value.updatedAt),
  };
}

function readPeriodSnapshot(data: RawLeaderboardDoc, period: RankingPeriod): PeriodSnapshot | null {
  if (period === 'all') return parsePeriodSnapshot(data.all);
  if (period === 'daily') return parsePeriodSnapshot(data.daily);
  if (period === 'weekly') return parsePeriodSnapshot(data.weekly);
  return parsePeriodSnapshot(data.monthly);
}

function isBetterScore(nextScore: number, nextMaxTile: number, prevScore: number, prevMaxTile: number) {
  if (nextScore !== prevScore) return nextScore > prevScore;
  return nextMaxTile > prevMaxTile;
}

function shouldUseCandidate(next: LeaderboardEntry, current?: LeaderboardEntry) {
  if (!current) return true;
  if (next.score !== current.score) return next.score > current.score;
  if (next.maxTile !== current.maxTile) return next.maxTile > current.maxTile;
  return (next.createdAt ?? 0) > (current.createdAt ?? 0);
}

function pickEntryFromNewDoc(
  docId: string,
  uid: string,
  data: RawLeaderboardDoc,
  period: RankingPeriod,
  periodKey: string
): LeaderboardEntry | null {
  const snapshot = readPeriodSnapshot(data, period);
  if (!snapshot) return null;
  if (period !== 'all' && snapshot.key !== periodKey) return null;

  return {
    id: docId,
    uid,
    score: snapshot.score,
    maxTile: snapshot.maxTile,
    createdAt: snapshot.updatedAt,
  };
}

function pickEntryFromLegacyDoc(
  docId: string,
  uid: string,
  data: RawLeaderboardDoc,
  period: RankingPeriod,
  periodStart: number
): LeaderboardEntry | null {
  const score = toSafeInt(data.score);
  if (score <= 0) return null;

  const createdAt = toMillis(data.createdAt);
  if (period !== 'all' && (createdAt ?? 0) < periodStart) return null;

  return {
    id: docId,
    uid,
    score,
    maxTile: toSafeInt(data.maxTile),
    createdAt,
  };
}

function loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [] as PendingScore[];
    const parsed = JSON.parse(raw) as PendingScore[];
    if (!Array.isArray(parsed)) return [] as PendingScore[];
    return parsed.filter((entry) => entry && typeof entry.score === 'number');
  } catch {
    return [] as PendingScore[];
  }
}

function saveQueue() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(pendingQueue));
  } catch {
    // Ignore storage failures.
  }
}

function enqueue(score: PendingScore) {
  pendingQueue.push(score);
  if (pendingQueue.length > QUEUE_LIMIT) {
    pendingQueue = pendingQueue.slice(pendingQueue.length - QUEUE_LIMIT);
  }
  saveQueue();
}

function ensureOnlineListener() {
  if (onlineListenerAttached) return;
  onlineListenerAttached = true;
  window.addEventListener('online', () => {
    void initLeaderboard();
    void flushQueue();
  });
}

async function ensureAuth() {
  ensureOnlineListener();
  if (authReady) return;
  if (!navigator.onLine) return;
  if (authInit) return authInit;

  authInit = (async () => {
    try {
      const auth = getAuth(getFirebaseApp());
      if (auth.currentUser) {
        currentUid = auth.currentUser.uid;
        authReady = true;
        return;
      }
      const result = await signInAnonymously(auth);
      currentUid = result.user.uid;
      authReady = true;
    } catch (err) {
      warnLeaderboard('anonymous_auth', err);
      authReady = false;
    } finally {
      authInit = null;
    }
  })();

  return authInit;
}

export async function initLeaderboard() {
  await ensureAuth();
  if (authReady) {
    await flushQueue();
  }
}

export async function flushQueue() {
  if (!navigator.onLine) return;
  await ensureAuth();
  if (!authReady) return;
  if (!pendingQueue.length) return;

  const batch = [...pendingQueue];
  pendingQueue = [];
  saveQueue();

  for (const entry of batch) {
    const ok = await submitScore(entry, true);
    if (!ok) {
      enqueue(entry);
    }
  }
}

async function submitScore(entry: PendingScore, fromQueue = false) {
  if (!navigator.onLine) {
    if (!fromQueue) enqueue(entry);
    return false;
  }

  await ensureAuth();
  if (!authReady || !currentUid) {
    if (!fromQueue) enqueue(entry);
    return false;
  }

  try {
    const db = getFirestore(getFirebaseApp());
    const score = toSafeInt(entry.score);
    const maxTile = toSafeInt(entry.maxTile);
    const now = new Date();

    const ref = doc(collection(db, LEADERBOARD_COLLECTION), currentUid);
    const snapshot = await getDoc(ref);
    const existing = (snapshot.data() ?? {}) as RawLeaderboardDoc;

    const patch: Record<string, unknown> = {
      uid: currentUid,
    };

    let changed = !snapshot.exists();

    for (const period of RANKING_PERIODS) {
      const key = getPeriodKey(period, now);
      const current = readPeriodSnapshot(existing, period);

      let shouldUpdate = false;
      if (!current) {
        shouldUpdate = true;
      } else if (period === 'all') {
        shouldUpdate = isBetterScore(score, maxTile, current.score, current.maxTile);
      } else if (current.key !== key) {
        shouldUpdate = true;
      } else {
        shouldUpdate = isBetterScore(score, maxTile, current.score, current.maxTile);
      }

      if (shouldUpdate) {
        patch[period] = {
          key,
          score,
          maxTile,
          updatedAt: serverTimestamp(),
        };
        changed = true;
      }
    }

    if (!changed) return true;

    await setDoc(ref, patch, { merge: true });
    return true;
  } catch (err) {
    warnLeaderboard('submit_score', err);
    if (!fromQueue) enqueue(entry);
    return false;
  }
}

export async function submitLeaderboardScore(score: number, maxTile: number) {
  const entry: PendingScore = {
    score,
    maxTile,
    ts: Date.now(),
  };
  return submitScore(entry);
}

export async function fetchTopScores(period: RankingPeriod, count = 20): Promise<LeaderboardFetchResult> {
  if (!navigator.onLine) {
    return { entries: [], totalEntries: 0, viewerUid: currentUid ?? undefined };
  }

  await ensureAuth();

  try {
    const db = getFirestore(getFirebaseApp());
    const q = query(collection(db, LEADERBOARD_COLLECTION), limit(FETCH_SCAN_LIMIT));
    const snapshot = await getDocs(q);

    const periodKey = getPeriodKey(period);
    const periodStart = period === 'all' ? 0 : getPeriodStart(period);
    const uniqueByUid = new Map<string, LeaderboardEntry>();

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as RawLeaderboardDoc;
      const uid = typeof data.uid === 'string' ? data.uid : docSnapshot.id;
      if (!uid) continue;

      const fromNewDoc = pickEntryFromNewDoc(docSnapshot.id, uid, data, period, periodKey);
      const fromLegacyDoc = fromNewDoc
        ? null
        : pickEntryFromLegacyDoc(docSnapshot.id, uid, data, period, periodStart);
      const candidate = fromNewDoc ?? fromLegacyDoc;
      if (!candidate) continue;

      const current = uniqueByUid.get(uid);
      if (shouldUseCandidate(candidate, current)) {
        uniqueByUid.set(uid, candidate);
      }
    }

    const sortedEntries = [...uniqueByUid.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.maxTile !== a.maxTile) return b.maxTile - a.maxTile;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

    const myRecord = currentUid
      ? (() => {
          const index = sortedEntries.findIndex((entry) => entry.uid === currentUid);
          if (index < 0) return undefined;
          return {
            ...sortedEntries[index],
            rank: index + 1,
          };
        })()
      : undefined;

    return {
      entries: sortedEntries.slice(0, count),
      myRecord,
      viewerUid: currentUid ?? undefined,
      totalEntries: sortedEntries.length,
    };
  } catch (err) {
    warnLeaderboard('fetch_scores', err);
    const { code: errorCode } = parseFirebaseError(err);

    return {
      entries: [],
      myRecord: undefined,
      viewerUid: currentUid ?? undefined,
      totalEntries: 0,
      errorCode,
    };
  }
}

export function formatLeaderboardName(uid: string) {
  if (!uid) return 'Anon';
  return `Anon-${uid.slice(0, 6).toUpperCase()}`;
}
