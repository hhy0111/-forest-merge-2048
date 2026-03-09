
import './style.css';
import {
  TILE_ASSETS,
  BOARD_BG,
  BOARD_FRAME,
  BOARD_GRID,
  CELL_EMPTY,
  GAME_BG,
} from './assets';
import { initAds, refreshAdsLayout, showBanner, showRewardedAd } from './ads';
import { fetchTopScores, formatLeaderboardName, initLeaderboard, submitLeaderboardScore, type RankingPeriod } from './leaderboard';
import { initAnalytics, trackEvent, trackScreen } from './analytics';
import {
  canMove,
  cloneGrid,
  createEmptyGrid,
  getEmptyCells,
  GRID_SIZE,
  type Direction,
  type Grid,
} from './game/engine';
import {
  UPGRADE_CLEAR_BONUS_STEP,
  UPGRADE_COMBO_RATE_STEP,
  UPGRADE_DEFS,
  UPGRADE_ECONOMY_RATE_STEP,
  UPGRADE_END_BONUS_RATE_STEP,
  UPGRADE_SCORE_RATE_STEP,
  calcAdRewardPoints,
  calcComboBonus,
  calcEconomyRate,
  calcEndReward,
  calcScoreBoostRate,
  calcUpgradeCost,
  type UpgradeKey,
} from './game/progression';

const bootSplashEl = document.querySelector<HTMLDivElement>('#boot-splash');

function dismissBootSplash() {
  if (!bootSplashEl || bootSplashEl.classList.contains('hidden')) return;
  bootSplashEl.classList.add('hidden');
  window.setTimeout(() => bootSplashEl.remove(), 280);
}

type Screen = 'splash' | 'lobby' | 'upgrade' | 'game' | 'minigame' | 'result' | 'ranking';
type ItemKey = 'undo' | 'shuffle' | 'hammer' | 'double' | 'start';

type ItemDef = {
  label: string;
  price: number;
  limit: number;
  desc: string;
};


const ITEM_DEFS: Record<ItemKey, ItemDef> = {
  undo: { label: 'Undo', price: 120, limit: 3, desc: 'Revert last move' },
  shuffle: { label: 'Shuffle', price: 180, limit: 2, desc: 'Shuffle current tiles' },
  hammer: { label: 'Hammer', price: 260, limit: 1, desc: 'Remove a tile' },
  double: { label: 'Double Score', price: 220, limit: 2, desc: '2x score for 20s' },
  start: { label: 'Start Upgrade', price: 300, limit: 1, desc: 'Start one tier higher' },
};


const STORAGE_KEY = 'fm_state_v1';
const AD_BONUS_POINTS = 60;
const MINIGAME_SECONDS = 30;
const MINIGAME_MIN_POINTS = 50;
const MINIGAME_MAX_POINTS = 120;
const MINIGAME_BUFF_SECONDS = 10;
const MINIGAME_BUFF_THRESHOLD = 12;
const MOVE_DURATION = 140;
const SCORE_TO_POINTS = 120;
const COUNTDOWN_ASSETS: Record<number, string> = {
  3: './images/tutorial/countdown_3.png',
  2: './images/tutorial/countdown_2.png',
  1: './images/tutorial/countdown_1.png',
  0: './images/tutorial/countdown_go.png',
};
const CLEAR_BONUS = 150;
const STREAK_BONUS_RATE = 0.3;
const STREAK_MAX = 3;
const SPAWN_RATE_4 = 0.1;
const RANKING_PERIOD_LABEL: Record<RankingPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  all: 'All-time',
};

interface PlayerState {
  points: number;
  bestScore: number;
  clearStreak: number;
  inventory: Record<ItemKey, number>;
  upgrades: Record<UpgradeKey, number>;
  nextGameBoostSeconds: number;
}

const DEFAULT_STATE: PlayerState = {
  points: 0,
  bestScore: 0,
  clearStreak: 0,
  inventory: {
    undo: 0,
    shuffle: 0,
    hammer: 0,
    double: 0,
    start: 0,
  },
  upgrades: {
    score: 0,
    combo: 0,
    endBonus: 0,
    economy: 0,
    clear: 0,
  },
  nextGameBoostSeconds: 0,
};

function loadState(): PlayerState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(DEFAULT_STATE);
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      inventory: {
        ...DEFAULT_STATE.inventory,
        ...(parsed.inventory ?? {}),
      },
      upgrades: {
        ...DEFAULT_STATE.upgrades,
        ...(parsed.upgrades ?? {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function getUpgradeLevel(key: UpgradeKey) {
  return Math.max(0, Math.floor(state.upgrades[key] ?? 0));
}

function getUpgradeCost(key: UpgradeKey, level: number) {
  const def = UPGRADE_DEFS[key];
  return calcUpgradeCost(def.baseCost, level);
}

function getScoreUpgradeRate() {
  return calcScoreBoostRate(getUpgradeLevel('score'));
}

function getComboBonusForCurrentChain(chainCount: number, mergeScore: number) {
  return calcComboBonus(chainCount, mergeScore, getUpgradeLevel('combo'));
}

function getEconomyRate() {
  return calcEconomyRate(getUpgradeLevel('economy'));
}

function getAdRewardPoints() {
  return calcAdRewardPoints(AD_BONUS_POINTS, getUpgradeLevel('economy'));
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
  <div class="app-shell">
    <section class="screen-view active" data-screen="splash">
      <div class="splash">
        <div class="splash-logo">Forest Merge 2048</div>
        <div class="splash-sub">Image Block Puzzle</div>
        <div class="loading-bar"><span></span></div>
        <div class="loading-text">Loading resources...</div>
      </div>
    </section>

    <section class="screen-view" data-screen="lobby">
      <header class="topbar">
        <div class="title">Forest Merge 2048</div>
        <div class="score-box">
          <span>Points</span>
          <strong id="lobby-points">0</strong>
        </div>
      </header>

      <div class="panel lobby-panel">
        <div class="lobby-meta">
          <div>
            <div class="label">Clear Streak</div>
            <div class="value" id="lobby-streak">0</div>
          </div>
          <div>
            <div class="label">Next Buff</div>
            <div class="value" id="lobby-buff">None</div>
          </div>
        </div>
        <div class="lobby-actions">
          <button class="button-primary" id="lobby-start">Start Game</button>
          <button class="button-secondary" id="lobby-mini">Bonus Mode</button>
          <button class="button-ghost" id="lobby-shop">Shop / Rewards</button>
          <button class="button-ghost" id="lobby-upgrade">Upgrades</button>
          <button class="button-ghost" id="lobby-rank">Ranking</button>
          <button class="button-ghost" id="lobby-settings">Settings</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Start Upgrade</div>
        <div class="toggle-row">
          <div>
            <div class="label">Use Start Upgrade Token</div>
            <div class="hint">Starts with one tile tier higher.</div>
          </div>
          <button class="toggle" id="start-upgrade-toggle" data-active="false">OFF</button>
        </div>
        <div class="inventory-row">
          <div class="label">Tokens</div>
          <div class="value" id="lobby-start-count">0</div>
        </div>
      </div>

      <div class="banner-ad" id="banner-lobby">Banner Ad Placeholder</div>
    </section>

    <section class="screen-view" data-screen="upgrade">
      <header class="topbar">
        <div class="title">Upgrades</div>
        <button class="button-ghost" id="upgrade-back">Back</button>
      </header>

      <div class="panel">
        <div class="panel-title">Permanent Boosts</div>
        <div class="upgrade-note">Small, permanent bonuses. Designed to stay balanced.</div>
        <div class="upgrade-list" id="upgrade-list"></div>
      </div>
    </section>
    <section class="screen-view" data-screen="ranking">
      <header class="topbar">
        <div class="title">Ranking</div>
        <button class="button-ghost" id="ranking-back">Back</button>
      </header>

      <div class="panel">
        <div class="panel-title">Top Players</div>
        <div class="ranking-filters" id="ranking-filters">
          <button class="ranking-filter active" data-period="daily">Daily</button>
          <button class="ranking-filter" data-period="weekly">Weekly</button>
          <button class="ranking-filter" data-period="monthly">Monthly</button>
          <button class="ranking-filter" data-period="all">All-time</button>
        </div>
        <div class="ranking-my-card" id="ranking-my-card"></div>
        <div class="ranking-list" id="ranking-list"></div>
        <div class="ranking-note" id="ranking-note"></div>
      </div>
    </section>
    <section class="screen-view" data-screen="game">
      <header class="topbar">
        <div>
          <div class="title">Forest Merge 2048</div>
          <div class="sub">Score x<em id="game-multiplier">1.0</em></div>
        </div>
        <div class="scores">
          <div class="score-box">
            <span>Score</span>
            <strong id="game-score">0</strong>
          </div>
          <div class="score-box">
            <span>Best</span>
            <strong id="game-best">0</strong>
          </div>
          <div class="score-box">
            <span>Points</span>
            <strong id="game-points">0</strong>
          </div>
        </div>
      </header>

      <div class="game-meta">
        <div class="meta-chip">Combo <span id="game-combo">0</span></div>
        <div class="meta-chip">Streak <span id="game-streak">0</span></div>
        <div class="meta-chip" id="game-boost">Boost: None</div>
      </div>

      <div class="board-wrap" id="board-wrap">
        <div class="board-bg"></div>
        <div class="board-frame"></div>
        <div class="board-grid" id="board"></div>
        <div class="tile-layer" id="tile-layer"></div>
        <div class="score-pop-layer" id="score-pop-layer"></div>
        <div class="board-grid board-grid-overlay"></div>
        <div class="overlay hidden" id="game-overlay">
          <div class="overlay-card">
            <div class="overlay-title" id="game-overlay-title">Game Over</div>
            <div class="overlay-desc" id="game-overlay-desc">No more moves.</div>
            <div class="overlay-actions">
              <button id="game-overlay-primary">View Result</button>
              <button id="game-overlay-secondary">Retry</button>
            </div>
          </div>
        </div>
      </div>
      <div class="combo-pop" id="combo-pop"></div>

      <div class="alert" id="game-alert"></div>

      <div class="item-bar">
        <button class="item-button" id="item-undo">
          <span>Undo</span>
          <strong id="item-undo-count">0</strong>
        </button>
        <button class="item-button" id="item-shuffle">
          <span>Shuffle</span>
          <strong id="item-shuffle-count">0</strong>
        </button>
        <button class="item-button" id="item-hammer">
          <span>Hammer</span>
          <strong id="item-hammer-count">0</strong>
        </button>
        <button class="item-button" id="item-double">
          <span>Double</span>
          <strong id="item-double-count">0</strong>
        </button>
      </div>

      <div class="controls">
        <button class="button-ghost" id="game-exit">Back to Lobby</button>
        <button class="button-secondary" id="game-restart">Restart</button>
      </div>
    </section>

    <section class="screen-view" data-screen="minigame">
      <header class="topbar">
        <div class="title">Bonus Mode</div>
        <div class="score-box">
          <span>Points</span>
          <strong id="mini-total-points">0</strong>
        </div>
      </header>

      <div class="panel minigame-panel">
        <div class="panel-title">Tap the glowing tile</div>
        <div class="minigame-meta">
          <div>Time <strong id="mini-time">30</strong>s</div>
          <div>Hits <strong id="mini-score">0</strong></div>
        </div>
        <div class="minigame-progress">
          <div class="minigame-progress-bar" id="mini-progress-bar"></div>
        </div>
        <div class="minigame-grid" id="minigame-grid"></div>
        <div class="minigame-countdown hidden" id="minigame-countdown">
          <img id="minigame-countdown-img" alt="" />
        </div>
        <div class="minigame-actions">
          <button class="button-primary" id="minigame-start">Start</button>
          <button class="button-ghost" id="minigame-exit">Back to Lobby</button>
        </div>
        <div class="minigame-result" id="minigame-result"></div>
      </div>
    </section>
    <section class="screen-view" data-screen="result">
      <header class="topbar">
        <div class="title">Result + Shop</div>
        <div class="score-box">
          <span>Total Points</span>
          <strong id="result-total-points">0</strong>
        </div>
      </header>

      <div class="panel" id="result-panel">
        <div class="panel-title">Last Run Summary</div>
        <div class="result-grid">
          <div><span>Score</span><strong id="result-score">0</strong></div>
          <div><span>Best</span><strong id="result-best">0</strong></div>
          <div><span>Max Tile</span><strong id="result-max-tile">0</strong></div>
          <div><span>Max Combo</span><strong id="result-combo">0</strong></div>
        </div>
        <div class="result-grid">
          <div><span>Base Points</span><strong id="result-base">0</strong></div>
          <div><span>Clear Bonus</span><strong id="result-clear">0</strong></div>
          <div><span>Streak Bonus</span><strong id="result-streak">0</strong></div>
          <div><span>Upgrade Bonus</span><strong id="result-upgrade">0</strong></div>
        </div>
        <div class="result-grid">
          <div><span>Total Earned</span><strong id="result-earned">0</strong></div>
        </div>
        <div class="result-actions">
          <button class="button-secondary" id="result-watch">Watch Ad +${AD_BONUS_POINTS}</button>
          <button class="button-primary" id="result-play">Play Again</button>
          <button class="button-ghost" id="result-lobby">Back to Lobby</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Item Shop</div>
        <div id="shop-list" class="shop-list"></div>
      </div>

      <div class="banner-ad" id="banner-result">Banner Ad Placeholder</div>
    </section>
  </div>
  <div class="toast" id="toast"></div>
`;
const screens = Array.from(document.querySelectorAll<HTMLElement>('.screen-view'));
const toastEl = document.querySelector<HTMLDivElement>('#toast')!;

function showScreen(screen: Screen) {
  if (currentScreen !== screen) {
    trackScreen(screen);
  }
  screens.forEach((view) => {
    view.classList.toggle('active', view.dataset.screen === screen);
  });
  currentScreen = screen;
  document.body.classList.toggle('input-locked', screen === 'game' || screen === 'minigame');
  refreshAdsLayout();
}

function showToast(message: string) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  window.setTimeout(() => toastEl.classList.remove('show'), 1600);
}

function emitSfx(name: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent('game:sfx', { detail: { name, ...detail } }));
}

function emitFx(name: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent('game:fx', { detail: { name, ...detail } }));
}

function emitHaptic(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

let state = loadState();
let currentScreen: Screen = 'splash';
let startUpgradeArmed = false;
let activeRankingPeriod: RankingPeriod = 'daily';

const lobbyPointsEl = document.querySelector<HTMLDivElement>('#lobby-points')!;
const lobbyStreakEl = document.querySelector<HTMLDivElement>('#lobby-streak')!;
const lobbyBuffEl = document.querySelector<HTMLDivElement>('#lobby-buff')!;
const lobbyStartCountEl = document.querySelector<HTMLDivElement>('#lobby-start-count')!;
const startUpgradeToggle = document.querySelector<HTMLButtonElement>('#start-upgrade-toggle')!;

const lobbyStartBtn = document.querySelector<HTMLButtonElement>('#lobby-start')!;
const lobbyMiniBtn = document.querySelector<HTMLButtonElement>('#lobby-mini')!;
const lobbyShopBtn = document.querySelector<HTMLButtonElement>('#lobby-shop')!;
const lobbyUpgradeBtn = document.querySelector<HTMLButtonElement>('#lobby-upgrade')!;
const lobbyRankBtn = document.querySelector<HTMLButtonElement>('#lobby-rank')!;
const lobbySettingsBtn = document.querySelector<HTMLButtonElement>('#lobby-settings')!;

const gameScoreEl = document.querySelector<HTMLDivElement>('#game-score')!;
const gameBestEl = document.querySelector<HTMLDivElement>('#game-best')!;
const gamePointsEl = document.querySelector<HTMLDivElement>('#game-points')!;
const gameComboEl = document.querySelector<HTMLDivElement>('#game-combo')!;
const gameStreakEl = document.querySelector<HTMLDivElement>('#game-streak')!;
const gameBoostEl = document.querySelector<HTMLDivElement>('#game-boost')!;
const gameMultiplierEl = document.querySelector<HTMLSpanElement>('#game-multiplier')!;
const gameAlertEl = document.querySelector<HTMLDivElement>('#game-alert')!;
const comboPopEl = document.querySelector<HTMLDivElement>('#combo-pop')!;
const gameExitBtn = document.querySelector<HTMLButtonElement>('#game-exit')!;
const gameRestartBtn = document.querySelector<HTMLButtonElement>('#game-restart')!;

const itemUndoBtn = document.querySelector<HTMLButtonElement>('#item-undo')!;
const itemShuffleBtn = document.querySelector<HTMLButtonElement>('#item-shuffle')!;
const itemHammerBtn = document.querySelector<HTMLButtonElement>('#item-hammer')!;
const itemDoubleBtn = document.querySelector<HTMLButtonElement>('#item-double')!;
const itemUndoCount = document.querySelector<HTMLDivElement>('#item-undo-count')!;
const itemShuffleCount = document.querySelector<HTMLDivElement>('#item-shuffle-count')!;
const itemHammerCount = document.querySelector<HTMLDivElement>('#item-hammer-count')!;
const itemDoubleCount = document.querySelector<HTMLDivElement>('#item-double-count')!;
const itemButtons: Partial<Record<ItemKey, HTMLButtonElement>> = {
  undo: itemUndoBtn,
  shuffle: itemShuffleBtn,
  hammer: itemHammerBtn,
  double: itemDoubleBtn,
};

const overlayEl = document.querySelector<HTMLDivElement>('#game-overlay')!;
const overlayTitleEl = document.querySelector<HTMLDivElement>('#game-overlay-title')!;
const overlayDescEl = document.querySelector<HTMLDivElement>('#game-overlay-desc')!;
const overlayPrimaryBtn = document.querySelector<HTMLButtonElement>('#game-overlay-primary')!;
const overlaySecondaryBtn = document.querySelector<HTMLButtonElement>('#game-overlay-secondary')!;

const boardEl = document.querySelector<HTMLDivElement>('#board')!;
const tileLayerEl = document.querySelector<HTMLDivElement>('#tile-layer')!;
const scorePopLayerEl = document.querySelector<HTMLDivElement>('#score-pop-layer')!;
const boardWrapEl = document.querySelector<HTMLDivElement>('#board-wrap')!;
const boardBgEl = document.querySelector<HTMLDivElement>('.board-bg')!;
const boardFrameEl = document.querySelector<HTMLDivElement>('.board-frame')!;
const boardGridOverlayEl = document.querySelector<HTMLDivElement>('.board-grid-overlay')!;

const upgradeListEl = document.querySelector<HTMLDivElement>('#upgrade-list')!;
const upgradeBackBtn = document.querySelector<HTMLButtonElement>('#upgrade-back')!;

const miniTotalPointsEl = document.querySelector<HTMLDivElement>('#mini-total-points')!;
const miniTimeEl = document.querySelector<HTMLSpanElement>('#mini-time')!;
const miniScoreEl = document.querySelector<HTMLSpanElement>('#mini-score')!;
const miniProgressBarEl = document.querySelector<HTMLDivElement>('#mini-progress-bar')!;
const miniGridEl = document.querySelector<HTMLDivElement>('#minigame-grid')!;
const miniCountdownEl = document.querySelector<HTMLDivElement>('#minigame-countdown')!;
const miniCountdownImg = document.querySelector<HTMLImageElement>('#minigame-countdown-img')!;
const miniStartBtn = document.querySelector<HTMLButtonElement>('#minigame-start')!;
const miniExitBtn = document.querySelector<HTMLButtonElement>('#minigame-exit')!;
const miniResultEl = document.querySelector<HTMLDivElement>('#minigame-result')!;

const resultTotalPointsEl = document.querySelector<HTMLDivElement>('#result-total-points')!;
const resultScoreEl = document.querySelector<HTMLDivElement>('#result-score')!;
const resultBestEl = document.querySelector<HTMLDivElement>('#result-best')!;
const resultMaxTileEl = document.querySelector<HTMLDivElement>('#result-max-tile')!;
const resultComboEl = document.querySelector<HTMLDivElement>('#result-combo')!;
const resultBaseEl = document.querySelector<HTMLDivElement>('#result-base')!;
const resultClearEl = document.querySelector<HTMLDivElement>('#result-clear')!;
const resultStreakEl = document.querySelector<HTMLDivElement>('#result-streak')!;
const resultUpgradeEl = document.querySelector<HTMLDivElement>('#result-upgrade')!;
const resultEarnedEl = document.querySelector<HTMLDivElement>('#result-earned')!;
const resultWatchBtn = document.querySelector<HTMLButtonElement>('#result-watch')!;
const resultPlayBtn = document.querySelector<HTMLButtonElement>('#result-play')!;
const resultLobbyBtn = document.querySelector<HTMLButtonElement>('#result-lobby')!;
const rankingListEl = document.querySelector<HTMLDivElement>('#ranking-list')!;
const rankingMyCardEl = document.querySelector<HTMLDivElement>('#ranking-my-card')!;
const rankingNoteEl = document.querySelector<HTMLDivElement>('#ranking-note')!;
const rankingBackBtn = document.querySelector<HTMLButtonElement>('#ranking-back')!;
const rankingFilterEls = Array.from(document.querySelectorAll<HTMLButtonElement>('.ranking-filter'));
const shopListEl = document.querySelector<HTMLDivElement>('#shop-list')!;
const bannerLobbyEl = document.querySelector<HTMLDivElement>('#banner-lobby')!;
const bannerResultEl = document.querySelector<HTMLDivElement>('#banner-result')!;

boardBgEl.style.backgroundImage = `url(${BOARD_BG})`;
boardFrameEl.style.backgroundImage = `url(${BOARD_FRAME})`;
boardGridOverlayEl.style.backgroundImage = `url(${BOARD_GRID})`;
document.body.style.backgroundImage = `url(${GAME_BG})`;

initAds();
initLeaderboard();
initAnalytics();
showBanner(bannerLobbyEl, 'banner_lobby');
showBanner(bannerResultEl, 'banner_result');
setRankingPeriod(activeRankingPeriod);

for (let i = 0; i < 16; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.index = String(i);
  cell.style.backgroundImage = `url(${CELL_EMPTY})`;
  boardEl.appendChild(cell);
}

const miniCells: HTMLDivElement[] = [];
for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.className = 'mini-cell';
  cell.dataset.index = String(i);
  const core = document.createElement('div');
  core.className = 'mini-cell-core';
  cell.appendChild(core);
  miniGridEl.appendChild(cell);
  miniCells.push(cell);
}

let grid = createEmptyGrid();
let idGrid = createEmptyGrid();
let nextTileId = 1;
const tileElements = new Map<number, HTMLDivElement>();
let isAnimating = false;
let score = 0;
let combo = 0;
let maxCombo = 0;
let maxTile = 0;
let gameActive = false;
let hammerArmed = false;
let scoreMultiplier = 1;
let doubleActiveUntil: number | null = null;
let boostTimer: number | null = null;

const undoStack: Array<{ grid: Grid; idGrid: Grid; score: number; combo: number; maxTile: number }> = [];
let usedInRun: Record<ItemKey, number> = {
  undo: 0,
  shuffle: 0,
  hammer: 0,
  double: 0,
  start: 0,
};

let lastResult: {
  score: number;
  best: number;
  maxTile: number;
  maxCombo: number;
  basePoints: number;
  clearBonus: number;
  streakBonus: number;
  upgradeBonus: number;
  totalEarned: number;
  cleared: boolean;
  adClaimed: boolean;
} | null = null;
function setTileValue(el: HTMLDivElement, value: number) {
  const inner = el.querySelector<HTMLDivElement>('.tile-inner');
  if (!inner) return;
  const asset = TILE_ASSETS[value];
  if (asset) {
    inner.style.backgroundImage = `url(${asset})`;
    inner.textContent = '';
  } else {
    inner.style.backgroundImage = '';
    inner.textContent = String(value);
  }
  el.setAttribute('data-value', String(value));
}

function createTileElement(id: number, value: number) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.id = String(id);
  const inner = document.createElement('div');
  inner.className = 'tile-inner';
  tile.appendChild(inner);
  setTileValue(tile, value);
  tileLayerEl.appendChild(tile);
  tileElements.set(id, tile);
  return tile;
}

function getCellMetrics() {
  const rect = tileLayerEl.getBoundingClientRect();
  const gapValue = getComputedStyle(tileLayerEl).getPropertyValue('--board-gap');
  const gap = Number.parseFloat(gapValue) || 0;
  if (rect.width <= 0) {
    return { cellSize: 0, gap };
  }
  const cellSize = (rect.width - gap * (GRID_SIZE - 1)) / GRID_SIZE;
  return { cellSize, gap };
}

function positionForCell(r: number, c: number, cellSize: number, gap: number) {
  return {
    x: c * (cellSize + gap),
    y: r * (cellSize + gap),
  };
}

function syncTilesInstant() {
  const { cellSize, gap } = getCellMetrics();
  if (cellSize <= 0) return;
  tileLayerEl.classList.add('no-anim');
  const presentIds = new Set<number>();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const id = idGrid[r][c];
      if (!id) continue;
      presentIds.add(id);
      let el = tileElements.get(id);
      if (!el) {
        el = createTileElement(id, grid[r][c]);
      }
      setTileValue(el, grid[r][c]);
      el.classList.remove('removing');
      el.style.width = `${cellSize}px`;
      el.style.height = `${cellSize}px`;
      const pos = positionForCell(r, c, cellSize, gap);
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    }
  }
  tileElements.forEach((el, id) => {
    if (!presentIds.has(id)) {
      el.remove();
      tileElements.delete(id);
    }
  });
  requestAnimationFrame(() => tileLayerEl.classList.remove('no-anim'));
}

function findIdPosition(id: number) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (idGrid[r][c] === id) return { r, c };
    }
  }
  return null;
}

function spawnRandomTile(value?: number) {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return null;
  const idx = Math.floor(Math.random() * empty.length);
  const { r, c } = empty[idx];
  const nextValue = value ?? (Math.random() < 1 - SPAWN_RATE_4 ? 2 : 4);
  grid[r][c] = nextValue;
  const id = nextTileId++;
  idGrid[r][c] = id;
  return { id, r, c, value: nextValue };
}

type MoveMeta = {
  id: number;
  from: { r: number; c: number };
  to: { r: number; c: number };
  value: number;
  mergedInto?: number;
  mergeValue?: number;
};

function moveGridWithIds(current: Grid, currentIds: Grid, dir: Direction) {
  const size = current.length;
  const next = createEmptyGrid(size);
  const nextIds = createEmptyGrid(size);
  const moves: MoveMeta[] = [];
  const mergedIds: number[] = [];
  let moved = false;
  let scoreDelta = 0;

  const pushMove = (
    id: number,
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    value: number,
    mergedInto?: number,
    mergeValue?: number
  ) => {
    moves.push({
      id,
      from: { r: fromR, c: fromC },
      to: { r: toR, c: toC },
      value,
      mergedInto,
      mergeValue,
    });
  };

  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < size; r++) {
      const cols = Array.from({ length: size }, (_, i) => i);
      if (dir === 'right') cols.reverse();
      const line = cols
        .map((c) => ({ r, c, value: current[r][c], id: currentIds[r][c] }))
        .filter((tile) => tile.value > 0);
      let target = 0;
      for (let i = 0; i < line.length; i++) {
        const tile = line[i];
        const nextTile = line[i + 1];
        const destC = dir === 'right' ? size - 1 - target : target;
        if (nextTile && nextTile.value === tile.value) {
          const mergedValue = tile.value * 2;
          next[r][destC] = mergedValue;
          nextIds[r][destC] = tile.id;
          scoreDelta += mergedValue;
          mergedIds.push(tile.id);
          pushMove(tile.id, tile.r, tile.c, r, destC, tile.value, undefined, mergedValue);
          pushMove(nextTile.id, nextTile.r, nextTile.c, r, destC, nextTile.value, tile.id, mergedValue);
          moved = true;
          i++;
          target++;
        } else {
          next[r][destC] = tile.value;
          nextIds[r][destC] = tile.id;
          pushMove(tile.id, tile.r, tile.c, r, destC, tile.value);
          if (tile.c !== destC) moved = true;
          target++;
        }
      }
    }
  } else {
    for (let c = 0; c < size; c++) {
      const rows = Array.from({ length: size }, (_, i) => i);
      if (dir === 'down') rows.reverse();
      const line = rows
        .map((r) => ({ r, c, value: current[r][c], id: currentIds[r][c] }))
        .filter((tile) => tile.value > 0);
      let target = 0;
      for (let i = 0; i < line.length; i++) {
        const tile = line[i];
        const nextTile = line[i + 1];
        const destR = dir === 'down' ? size - 1 - target : target;
        if (nextTile && nextTile.value === tile.value) {
          const mergedValue = tile.value * 2;
          next[destR][c] = mergedValue;
          nextIds[destR][c] = tile.id;
          scoreDelta += mergedValue;
          mergedIds.push(tile.id);
          pushMove(tile.id, tile.r, tile.c, destR, c, tile.value, undefined, mergedValue);
          pushMove(nextTile.id, nextTile.r, nextTile.c, destR, c, nextTile.value, tile.id, mergedValue);
          moved = true;
          i++;
          target++;
        } else {
          next[destR][c] = tile.value;
          nextIds[destR][c] = tile.id;
          pushMove(tile.id, tile.r, tile.c, destR, c, tile.value);
          if (tile.r !== destR) moved = true;
          target++;
        }
      }
    }
  }

  return { grid: next, idGrid: nextIds, moved, scoreDelta, moves, mergedIds };
}

function shuffleGridWithIds(current: Grid, currentIds: Grid, rng: () => number = Math.random) {
  const tiles: Array<{ value: number; id: number }> = [];
  for (let r = 0; r < current.length; r++) {
    for (let c = 0; c < current.length; c++) {
      if (current[r][c] > 0) {
        tiles.push({ value: current[r][c], id: currentIds[r][c] });
      }
    }
  }
  const next = createEmptyGrid(current.length);
  const nextIds = createEmptyGrid(current.length);
  const empties = getEmptyCells(next);
  while (tiles.length > 0) {
    const valueIndex = Math.floor(rng() * tiles.length);
    const tile = tiles.splice(valueIndex, 1)[0];
    const cellIndex = Math.floor(rng() * empties.length);
    const cell = empties.splice(cellIndex, 1)[0];
    next[cell.r][cell.c] = tile.value;
    nextIds[cell.r][cell.c] = tile.id;
  }
  return { grid: next, idGrid: nextIds };
}

function updateBoostLabel() {
  if (doubleActiveUntil && doubleActiveUntil > Date.now()) {
    const remaining = Math.max(0, Math.ceil((doubleActiveUntil - Date.now()) / 1000));
    gameBoostEl.textContent = `Boost: Double (${remaining}s)`;
  } else {
    gameBoostEl.textContent = 'Boost: None';
  }
  gameMultiplierEl.textContent = scoreMultiplier.toFixed(1);
}

function activateDoubleScore(seconds: number) {
  const now = Date.now();
  const until = now + seconds * 1000;
  doubleActiveUntil = doubleActiveUntil ? Math.max(doubleActiveUntil, until) : until;
  scoreMultiplier = 2;

  if (boostTimer) window.clearInterval(boostTimer);
  boostTimer = window.setInterval(() => {
    if (!doubleActiveUntil) return;
    if (doubleActiveUntil <= Date.now()) {
      doubleActiveUntil = null;
      scoreMultiplier = 1;
      if (boostTimer) window.clearInterval(boostTimer);
      boostTimer = null;
    } else {
      updateBoostLabel();
    }
  }, 250);

  updateBoostLabel();
}

function renderLobby() {
  lobbyPointsEl.textContent = formatNumber(state.points);
  lobbyStreakEl.textContent = String(state.clearStreak);
  lobbyBuffEl.textContent = state.nextGameBoostSeconds
    ? `Double ${state.nextGameBoostSeconds}s`
    : 'None';
  lobbyStartCountEl.textContent = formatNumber(state.inventory.start);
  startUpgradeToggle.dataset.active = String(startUpgradeArmed);
  startUpgradeToggle.textContent = startUpgradeArmed ? 'ON' : 'OFF';
}

function renderGame() {
  gameScoreEl.textContent = formatNumber(score);
  gameBestEl.textContent = formatNumber(state.bestScore);
  gamePointsEl.textContent = formatNumber(state.points);
  gameComboEl.textContent = String(combo);
  gameStreakEl.textContent = String(state.clearStreak);

  itemUndoCount.textContent = formatNumber(state.inventory.undo);
  itemShuffleCount.textContent = formatNumber(state.inventory.shuffle);
  itemHammerCount.textContent = formatNumber(state.inventory.hammer);
  itemDoubleCount.textContent = formatNumber(state.inventory.double);

  itemUndoBtn.classList.toggle('disabled', !canUseItem('undo'));
  itemShuffleBtn.classList.toggle('disabled', !canUseItem('shuffle'));
  itemHammerBtn.classList.toggle('disabled', !canUseItem('hammer'));
  itemDoubleBtn.classList.toggle('disabled', !canUseItem('double'));

  if (hammerArmed) {
    gameAlertEl.textContent = 'Hammer active: select a tile to remove.';
  } else if (maxTile >= 1024 && maxTile < 2048) {
    gameAlertEl.textContent = 'One step to Legend!';
  } else {
    gameAlertEl.textContent = '';
  }

  boardWrapEl.classList.toggle('hammer-armed', hammerArmed);
  updateBoostLabel();

}


function showComboPop(count: number, bonusScore = 0) {
  if (!comboPopEl) return;
  comboPopEl.textContent = bonusScore > 0 ? `${count} Combo +${bonusScore}` : `${count} Combo`;
  comboPopEl.classList.remove('show');
  void comboPopEl.offsetWidth;
  comboPopEl.classList.add('show');
}

function spawnScorePop(value: number, r: number, c: number) {
  const { cellSize, gap } = getCellMetrics();
  if (cellSize <= 0) return;
  const pos = positionForCell(r, c, cellSize, gap);
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = `+${value}`;
  pop.style.left = `${pos.x + cellSize / 2}px`;
  pop.style.top = `${pos.y + cellSize / 2}px`;
  scorePopLayerEl.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove());
  window.setTimeout(() => pop.remove(), 900);
}

function animateMoves(moves: MoveMeta[], mergedIds: number[], spawnIds: number[]) {
  const { cellSize, gap } = getCellMetrics();
  if (cellSize <= 0) {
    syncTilesInstant();
    isAnimating = false;
    return;
  }

  tileLayerEl.classList.remove('no-anim');
  const removeIds = new Set<number>();

  moves.forEach((move) => {
    if (move.mergedInto) removeIds.add(move.id);
    let el = tileElements.get(move.id);
    if (!el) {
      el = createTileElement(move.id, move.value);
    }
    setTileValue(el, move.value);
    el.style.width = `${cellSize}px`;
    el.style.height = `${cellSize}px`;
    const pos = positionForCell(move.to.r, move.to.c, cellSize, gap);
    if (move.mergedInto) el.classList.add('removing');
    el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });

  spawnIds.forEach((id) => {
    const pos = findIdPosition(id);
    if (!pos) return;
    const value = grid[pos.r][pos.c];
    let el = tileElements.get(id);
    if (!el) {
      el = createTileElement(id, value);
    }
    setTileValue(el, value);
    el.classList.add('spawn');
    el.style.width = `${cellSize}px`;
    el.style.height = `${cellSize}px`;
    const coords = positionForCell(pos.r, pos.c, cellSize, gap);
    el.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
  });

  const mergePops = moves
    .filter((move) => move.mergeValue && !move.mergedInto)
    .map((move) => ({
      value: move.mergeValue as number,
      r: move.to.r,
      c: move.to.c,
    }));

  if (mergePops.length > 0) {
    window.setTimeout(() => {
      mergePops.forEach((pop) => spawnScorePop(pop.value, pop.r, pop.c));
    }, MOVE_DURATION - 10);
  }

  window.setTimeout(() => {
    removeIds.forEach((id) => {
      const el = tileElements.get(id);
      if (!el) return;
      el.remove();
      tileElements.delete(id);
    });

    mergedIds.forEach((id) => {
      const pos = findIdPosition(id);
      if (!pos) return;
      const el = tileElements.get(id);
      if (!el) return;
      setTileValue(el, grid[pos.r][pos.c]);
      el.classList.add('merge');
      window.setTimeout(() => el.classList.remove('merge'), 180);
    });

    spawnIds.forEach((id) => {
      const el = tileElements.get(id);
      if (el) el.classList.remove('spawn');
    });

    syncTilesInstant();
    isAnimating = false;
  }, MOVE_DURATION + 30);
}

function renderResult() {
  resultTotalPointsEl.textContent = formatNumber(state.points);

  if (!lastResult) {
    resultScoreEl.textContent = '-';
    resultBestEl.textContent = formatNumber(state.bestScore);
    resultMaxTileEl.textContent = '-';
    resultComboEl.textContent = '-';
    resultBaseEl.textContent = '-';
    resultClearEl.textContent = '-';
    resultStreakEl.textContent = '-';
    resultUpgradeEl.textContent = '-';
    resultEarnedEl.textContent = '-';
    resultWatchBtn.disabled = true;
    resultWatchBtn.textContent = 'Watch Ad +0';
    return;
  }

  resultScoreEl.textContent = formatNumber(lastResult.score);
  resultBestEl.textContent = formatNumber(lastResult.best);
  resultMaxTileEl.textContent = formatNumber(lastResult.maxTile);
  resultComboEl.textContent = formatNumber(lastResult.maxCombo);
  resultBaseEl.textContent = formatNumber(lastResult.basePoints);
  resultClearEl.textContent = formatNumber(lastResult.clearBonus);
  resultStreakEl.textContent = formatNumber(lastResult.streakBonus);
  resultUpgradeEl.textContent = formatNumber(lastResult.upgradeBonus);
  resultEarnedEl.textContent = formatNumber(lastResult.totalEarned);

  resultWatchBtn.disabled = lastResult.adClaimed;
  resultWatchBtn.textContent = lastResult.adClaimed
    ? 'Ad bonus claimed'
    : `Watch Ad +${formatNumber(getAdRewardPoints())}`;
}

function setRankingPeriod(period: RankingPeriod) {
  activeRankingPeriod = period;
  rankingFilterEls.forEach((btn) => {
    const btnPeriod = btn.dataset.period;
    btn.classList.toggle('active', btnPeriod === period);
  });
}

function createRankingRow(
  rank: number,
  name: string,
  scoreValue: number,
  maxTileValue: number,
  options: { isSelf?: boolean; isMyCard?: boolean } = {}
) {
  const row = document.createElement('div');
  row.className = 'ranking-item';

  if (rank === 1) row.classList.add('top-1');
  if (rank === 2) row.classList.add('top-2');
  if (rank === 3) row.classList.add('top-3');
  if (options.isSelf) row.classList.add('is-self');
  if (options.isMyCard) row.classList.add('is-my-card');

  const topBadge = rank === 1 ? '1ST' : rank === 2 ? '2ND' : rank === 3 ? '3RD' : '';

  row.innerHTML = `
    <div class="ranking-rank">${topBadge ? `<span class="ranking-top-badge">${topBadge}</span>` : ''}#${rank}</div>
    <div class="ranking-name">${name}</div>
    <div class="ranking-score">${formatNumber(scoreValue)}</div>
    <div class="ranking-meta">Max ${formatNumber(maxTileValue)}</div>
  `;

  return row;
}

async function renderRanking() {
  rankingListEl.innerHTML = '';
  rankingMyCardEl.innerHTML = '';

  if (!navigator.onLine) {
    rankingMyCardEl.innerHTML = `
      <div class="ranking-my-title">My Best</div>
      <div class="ranking-my-empty">Rankings are unavailable offline.</div>
    `;
    rankingNoteEl.textContent = 'Offline: ranking is unavailable.';
    return;
  }

  rankingNoteEl.textContent = 'Loading...';
  const { entries, myRecord, viewerUid, totalEntries, errorCode } = await fetchTopScores(activeRankingPeriod, 20);

  if (errorCode) {
    if (errorCode.includes('permission-denied')) {
      rankingNoteEl.textContent = 'Permission denied. Check Firestore rules.';
    } else if (errorCode.includes('failed-precondition')) {
      rankingNoteEl.textContent = 'Firestore index is required. Open the error link in console and create index.';
    } else {
      rankingNoteEl.textContent = `Ranking load failed (${errorCode}).`;
    }
    return;
  }

  if (myRecord) {
    const title = document.createElement('div');
    title.className = 'ranking-my-title';
    title.textContent = 'My Best';
    rankingMyCardEl.appendChild(title);
    rankingMyCardEl.appendChild(
      createRankingRow(
        myRecord.rank,
        formatLeaderboardName(myRecord.uid),
        myRecord.score,
        myRecord.maxTile,
        { isSelf: true, isMyCard: true }
      )
    );
  } else {
    rankingMyCardEl.innerHTML = `
      <div class="ranking-my-title">My Best</div>
      <div class="ranking-my-empty">No score submitted yet.</div>
    `;
  }

  if (!entries.length) {
    rankingNoteEl.textContent = `No ${RANKING_PERIOD_LABEL[activeRankingPeriod].toLowerCase()} rankings yet.`;
    return;
  }

  rankingNoteEl.textContent = `${RANKING_PERIOD_LABEL[activeRankingPeriod]} Top 20 · ${formatNumber(totalEntries)} total`;

  entries.forEach((entry, index) => {
    const row = createRankingRow(
      index + 1,
      formatLeaderboardName(entry.uid),
      entry.score,
      entry.maxTile,
      { isSelf: viewerUid === entry.uid }
    );
    rankingListEl.appendChild(row);
  });
}
function getUpgradeEffectLabel(key: UpgradeKey, level: number) {
  if (key === 'score') {
    return `Merge score +${formatRate(level * UPGRADE_SCORE_RATE_STEP)}`;
  }
  if (key === 'combo') {
    return `Combo bonus +${formatRate(level * UPGRADE_COMBO_RATE_STEP)} per chain step`;
  }
  if (key === 'endBonus') {
    return `End points +${formatRate(level * UPGRADE_END_BONUS_RATE_STEP)}`;
  }
  if (key === 'economy') {
    return `All rewards +${formatRate(level * UPGRADE_ECONOMY_RATE_STEP)}`;
  }
  return `Clear bonus +${formatNumber(level * UPGRADE_CLEAR_BONUS_STEP)}`;
}

function renderUpgrade() {
  upgradeListEl.innerHTML = '';

  (Object.keys(UPGRADE_DEFS) as UpgradeKey[]).forEach((key) => {
    const def = UPGRADE_DEFS[key];
    const level = getUpgradeLevel(key);
    const nextLevel = Math.min(def.maxLevel, level + 1);
    const isMax = level >= def.maxLevel;
    const cost = getUpgradeCost(key, level);

    const currentLabel = getUpgradeEffectLabel(key, level);
    const nextLabel = isMax ? 'MAX reached' : getUpgradeEffectLabel(key, nextLevel);

    const card = document.createElement('div');
    card.className = 'shop-item upgrade-item';
    card.innerHTML = `
      <div class="shop-info">
        <div class="shop-title">${def.label}</div>
        <div class="shop-desc">${def.desc}</div>
        <div class="shop-meta">Level ${level}/${def.maxLevel}</div>
        <div class="upgrade-effect">Current: ${currentLabel}</div>
        <div class="upgrade-effect">Next: ${nextLabel}</div>
      </div>
      <div class="shop-buy">
        <div class="shop-price">${isMax ? 'MAX' : `${formatNumber(cost)} pts`}</div>
        <button class="button-secondary" data-upgrade="${key}" ${isMax ? 'disabled' : ''}>${
          isMax ? 'MAX' : 'Upgrade'
        }</button>
      </div>
    `;

    const button = card.querySelector<HTMLButtonElement>('button')!;
    if (!isMax) {
      button.disabled = state.points < cost;
      button.addEventListener('click', () => buyUpgrade(key));
    }

    upgradeListEl.appendChild(card);
  });
}

function buyUpgrade(key: UpgradeKey) {
  const def = UPGRADE_DEFS[key];
  const level = getUpgradeLevel(key);

  if (level >= def.maxLevel) {
    showToast('Already max level.');
    return;
  }

  const cost = getUpgradeCost(key, level);
  if (state.points < cost) {
    showToast('Not enough points.');
    return;
  }

  state.points -= cost;
  state.upgrades[key] = level + 1;
  saveState();

  trackEvent('upgrade_purchase', {
    upgrade: key,
    level: level + 1,
    cost,
  });

  renderUpgrade();
  renderLobby();
  renderGame();
  renderResult();

  showToast(`${def.label} Lv.${level + 1} unlocked.`);
}

function renderShop() {
  shopListEl.innerHTML = '';
  (Object.keys(ITEM_DEFS) as ItemKey[]).forEach((key) => {
    const def = ITEM_DEFS[key];
    const itemEl = document.createElement('div');
    itemEl.className = 'shop-item';
    itemEl.innerHTML = `
      <div class="shop-info">
        <div class="shop-title">${def.label}</div>
        <div class="shop-desc">${def.desc}</div>
        <div class="shop-meta">Owned: ${formatNumber(state.inventory[key])} · Limit: ${def.limit}</div>
      </div>
      <div class="shop-buy">
        <div class="shop-price">${formatNumber(def.price)} pts</div>
        <button class="button-secondary" data-item="${key}">Buy</button>
      </div>
    `;
    const button = itemEl.querySelector<HTMLButtonElement>('button')!;
    button.addEventListener('click', () => buyItem(key));
    shopListEl.appendChild(itemEl);
  });
}

function renderAll() {
  renderLobby();
  renderUpgrade();
  renderGame();
  renderResult();
  renderShop();
  syncTilesInstant();
}

function startGame() {
  overlayEl.classList.add('hidden');
  scorePopLayerEl.innerHTML = '';
  comboPopEl.classList.remove('show');
  tileElements.forEach((el) => el.remove());
  tileElements.clear();
  tileLayerEl.innerHTML = '';
  grid = createEmptyGrid();
  idGrid = createEmptyGrid();
  score = 0;
  combo = 0;
  maxCombo = 0;
  maxTile = 0;
  gameActive = true;
  hammerArmed = false;
  isAnimating = false;
  scoreMultiplier = 1;
  doubleActiveUntil = null;
  if (boostTimer) {
    window.clearInterval(boostTimer);
    boostTimer = null;
  }

  undoStack.length = 0;
  usedInRun = {
    undo: 0,
    shuffle: 0,
    hammer: 0,
    double: 0,
    start: 0,
  };

  if (startUpgradeArmed && state.inventory.start > 0) {
    state.inventory.start -= 1;
    usedInRun.start += 1;
    startUpgradeArmed = false;
    spawnRandomTile(4);
    spawnRandomTile();
  } else {
    spawnRandomTile();
    spawnRandomTile();
  }

  maxTile = Math.max(...grid.flat());

  trackEvent('game_start', {
    start_upgrade: usedInRun.start > 0,
    upgrade_score_level: getUpgradeLevel('score'),
    upgrade_combo_level: getUpgradeLevel('combo'),
    upgrade_end_bonus_level: getUpgradeLevel('endBonus'),
    upgrade_economy_level: getUpgradeLevel('economy'),
    upgrade_clear_level: getUpgradeLevel('clear'),
  });

  if (state.nextGameBoostSeconds > 0) {
    activateDoubleScore(state.nextGameBoostSeconds);
    state.nextGameBoostSeconds = 0;
  }

  saveState();
  renderLobby();
  renderGame();
  showScreen('game');
  requestAnimationFrame(() => {
    syncTilesInstant();
  });
}

function canUseItem(key: ItemKey) {
  if (!gameActive) return false;
  if (isAnimating) return false;
  if (state.inventory[key] <= 0) return false;
  if (usedInRun[key] >= ITEM_DEFS[key].limit) return false;
  return true;
}

function useItem(key: ItemKey) {
  state.inventory[key] -= 1;
  usedInRun[key] += 1;
  saveState();
  emitSfx('item_use', { key });
  emitHaptic(8);
  triggerItemFx(key);
  pulseItemButton(key);
  trackEvent('item_use', { item: key });
}

const ITEM_FX_CLASSES = ['item-undo', 'item-shuffle', 'item-hammer', 'item-double'];

function triggerItemFx(key: ItemKey) {
  if (key === 'start') return;
  const className = `item-${key}`;
  boardWrapEl.classList.remove('item-fx', ...ITEM_FX_CLASSES);
  void boardWrapEl.offsetWidth;
  boardWrapEl.classList.add('item-fx', className);
  window.setTimeout(() => {
    boardWrapEl.classList.remove('item-fx', className);
  }, 550);
}

function pulseItemButton(key: ItemKey) {
  const btn = itemButtons[key];
  if (!btn) return;
  btn.classList.remove('use');
  void btn.offsetWidth;
  btn.classList.add('use');
  window.setTimeout(() => btn.classList.remove('use'), 450);
}

function handleMove(dir: Direction) {
  if (!gameActive || hammerArmed || isAnimating) return;
  const prev = { grid: cloneGrid(grid), idGrid: cloneGrid(idGrid), score, combo, maxTile };
  const result = moveGridWithIds(grid, idGrid, dir);
  if (!result.moved) return;

  emitSfx('move', { dir });

  undoStack.push(prev);
  if (undoStack.length > 10) undoStack.shift();

  grid = result.grid;
  idGrid = result.idGrid;

  let comboBonusScore = 0;

  if (result.scoreDelta > 0) {
    combo += 1;
    maxCombo = Math.max(maxCombo, combo);

    const scoreBoostRate = 1 + getScoreUpgradeRate();
    const scoreGain = Math.floor(result.scoreDelta * scoreMultiplier * scoreBoostRate);
    comboBonusScore = getComboBonusForCurrentChain(combo, result.scoreDelta);
    score += scoreGain + comboBonusScore;

    emitSfx('merge', { score: result.scoreDelta });
    emitFx('merge', { score: result.scoreDelta });
    emitHaptic(10);
    if (combo >= 2) {
      showComboPop(combo, comboBonusScore);
      emitSfx('combo', { combo });
      emitFx('combo', { combo });
      emitHaptic([0, 20]);
    }
  } else {
    combo = 0;
  }

  const previousMax = maxTile;
  const spawned = spawnRandomTile();
  maxTile = Math.max(...grid.flat());
  if (maxTile > previousMax && maxTile >= 128) {
    boardWrapEl.classList.add('board-glow');
    window.setTimeout(() => boardWrapEl.classList.remove('board-glow'), 350);
  }

  if (score > state.bestScore) {
    state.bestScore = score;
    saveState();
  }

  renderGame();
  isAnimating = true;
  animateMoves(result.moves, result.mergedIds, spawned ? [spawned.id] : []);

  const shouldClear = maxTile >= 2048;
  const shouldGameOver = !canMove(grid);
  if (shouldClear || shouldGameOver) {
    window.setTimeout(() => finishGame(shouldClear), MOVE_DURATION + 40);
  }
}

function finishGame(cleared: boolean) {
  if (!gameActive) return;
  gameActive = false;
  isAnimating = false;
  if (cleared) {
    emitSfx('game_clear');
    emitFx('game_clear');
    emitHaptic([20, 40, 20]);
  } else {
    emitSfx('game_over');
    emitFx('game_over');
    emitHaptic(30);
  }
  if (boostTimer) {
    window.clearInterval(boostTimer);
    boostTimer = null;
  }
  doubleActiveUntil = null;
  scoreMultiplier = 1;

  const reward = calcEndReward({
    score,
    cleared,
    clearStreak: state.clearStreak,
    scoreToPoints: SCORE_TO_POINTS,
    baseClearBonus: CLEAR_BONUS,
    streakBonusRate: STREAK_BONUS_RATE,
    streakMax: STREAK_MAX,
    endBonusLevel: getUpgradeLevel('endBonus'),
    economyLevel: getUpgradeLevel('economy'),
    clearBonusLevel: getUpgradeLevel('clear'),
  });

  const {
    basePoints,
    clearBonus,
    streakBonus,
    endBonus,
    economyBonus,
    upgradeBonus,
    totalEarned,
    nextClearStreak,
  } = reward;

  state.clearStreak = nextClearStreak;
  state.points += totalEarned;
  saveState();

  lastResult = {
    score,
    best: state.bestScore,
    maxTile,
    maxCombo,
    basePoints,
    clearBonus,
    streakBonus,
    upgradeBonus,
    totalEarned,
    cleared,
    adClaimed: false,
  };

  overlayTitleEl.textContent = cleared ? 'Clear!' : 'Game Over';
  overlayDescEl.textContent = cleared
    ? 'You reached the legend tile.'
    : 'No more moves available.';
  overlayEl.classList.remove('hidden');
  trackEvent('game_end', {
    cleared,
    score,
    max_tile: maxTile,
    max_combo: maxCombo,
    points_earned: totalEarned,
    points_upgrade_bonus: upgradeBonus,
    points_end_bonus: endBonus,
    points_economy_bonus: economyBonus,
  });
  if (score > 0) {
    void submitLeaderboardScore(score, maxTile);
  }
  renderLobby();
  renderResult();
  renderUpgrade();
}

function claimAdBonus() {
  if (!lastResult || lastResult.adClaimed) return;
  lastResult.adClaimed = true;
  const rewardedPoints = getAdRewardPoints();
  state.points += rewardedPoints;
  saveState();
  trackEvent('ad_reward', {
    source: 'result',
    points: rewardedPoints,
    points_economy_bonus: rewardedPoints - AD_BONUS_POINTS,
  });
  renderResult();
  renderLobby();
  renderUpgrade();
}

function buyItem(key: ItemKey) {
  const def = ITEM_DEFS[key];
  if (state.points < def.price) {
    showToast('Not enough points.');
    return;
  }
  state.points -= def.price;
  state.inventory[key] += 1;
  saveState();
  trackEvent('shop_purchase', { item: key, price: def.price });
  renderShop();
  renderLobby();
  renderUpgrade();
  renderGame();
  renderResult();
  showToast(`${def.label} purchased.`);
}

function toggleStartUpgrade() {
  if (!startUpgradeArmed && state.inventory.start <= 0) {
    showToast('No Start Upgrade tokens.');
    return;
  }
  startUpgradeArmed = !startUpgradeArmed;
  renderLobby();
}

function handleUndo() {
  if (!canUseItem('undo')) {
    showToast('Undo unavailable.');
    return;
  }
  const last = undoStack.pop();
  if (!last) {
    showToast('Nothing to undo.');
    return;
  }
  useItem('undo');
  grid = last.grid;
  idGrid = last.idGrid;
  score = last.score;
  combo = last.combo;
  maxTile = last.maxTile;
  isAnimating = false;
  renderGame();
  syncTilesInstant();
}

function handleShuffle() {
  if (!canUseItem('shuffle')) {
    showToast('Shuffle unavailable.');
    return;
  }
  useItem('shuffle');
  const shuffled = shuffleGridWithIds(grid, idGrid);
  grid = shuffled.grid;
  idGrid = shuffled.idGrid;
  maxTile = Math.max(...grid.flat());
  isAnimating = false;
  renderGame();
  syncTilesInstant();
}

function handleHammer() {
  if (!canUseItem('hammer')) {
    showToast('Hammer unavailable.');
    return;
  }
  hammerArmed = true;
  renderGame();
}

function handleDouble() {
  if (!canUseItem('double')) {
    showToast('Double unavailable.');
    return;
  }
  useItem('double');
  activateDoubleScore(20);
  renderGame();
}

function handleHammerClick(cellIndex: number) {
  if (!hammerArmed) return;
  const r = Math.floor(cellIndex / 4);
  const c = cellIndex % 4;
  if (grid[r][c] === 0) {
    showToast('Select a tile to remove.');
    return;
  }
  grid = cloneGrid(grid);
  idGrid = cloneGrid(idGrid);
  grid[r][c] = 0;
  idGrid[r][c] = 0;
  hammerArmed = false;
  useItem('hammer');
  maxTile = Math.max(...grid.flat());
  isAnimating = false;
  renderGame();
  syncTilesInstant();
}

function handleExitGame() {
  if (gameActive && !confirm('Exit to lobby? Current run will be lost.')) return;
  gameActive = false;
  hammerArmed = false;
  isAnimating = false;
  overlayEl.classList.add('hidden');
  if (boostTimer) {
    window.clearInterval(boostTimer);
    boostTimer = null;
  }
  doubleActiveUntil = null;
  scoreMultiplier = 1;
  showScreen('lobby');
  renderLobby();
}

function swipeDirection(dx: number, dy: number): Direction | null {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < 24) return null;
  if (absX > absY) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function cellIndexFromPoint(x: number, y: number) {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;
  const cell = el.closest('.cell') as HTMLElement | null;
  if (!cell) return null;
  const index = Number(cell.dataset.index ?? '');
  return Number.isFinite(index) ? index : null;
}

let startX = 0;
let startY = 0;
let isPointerDown = false;

function beginBoardGesture(x: number, y: number) {
  isPointerDown = true;
  startX = x;
  startY = y;
}

function endBoardGesture(x: number, y: number) {
  if (!isPointerDown) return;
  isPointerDown = false;
  const dir = swipeDirection(x - startX, y - startY);
  if (dir) {
    handleMove(dir);
    return;
  }
  if (hammerArmed) {
    const index = cellIndexFromPoint(x, y);
    if (index !== null) handleHammerClick(index);
  }
}

boardWrapEl.addEventListener('pointerdown', (e) => {
  if (currentScreen !== 'game') return;
  beginBoardGesture(e.clientX, e.clientY);
  e.preventDefault();
  try {
    boardWrapEl.setPointerCapture(e.pointerId);
  } catch {
    // Ignore capture errors on unsupported browsers.
  }
});

boardWrapEl.addEventListener('pointermove', (e) => {
  if (!isPointerDown || currentScreen !== 'game') return;
  e.preventDefault();
});

boardWrapEl.addEventListener('pointerup', (e) => {
  if (!isPointerDown) return;
  try {
    boardWrapEl.releasePointerCapture(e.pointerId);
  } catch {
    // Ignore release errors on unsupported browsers.
  }
  e.preventDefault();
  endBoardGesture(e.clientX, e.clientY);
});

boardWrapEl.addEventListener('pointercancel', () => {
  isPointerDown = false;
});

if (!(window as Window & { PointerEvent?: typeof PointerEvent }).PointerEvent) {
  boardWrapEl.addEventListener(
    'touchstart',
    (e) => {
      if (currentScreen !== 'game' || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      beginBoardGesture(touch.clientX, touch.clientY);
      e.preventDefault();
    },
    { passive: false }
  );

  boardWrapEl.addEventListener(
    'touchmove',
    (e) => {
      if (!isPointerDown || currentScreen !== 'game') return;
      e.preventDefault();
    },
    { passive: false }
  );

  boardWrapEl.addEventListener(
    'touchend',
    (e) => {
      if (!isPointerDown || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      e.preventDefault();
      endBoardGesture(touch.clientX, touch.clientY);
    },
    { passive: false }
  );

  boardWrapEl.addEventListener('touchcancel', () => {
    isPointerDown = false;
  });
}

boardWrapEl.addEventListener('click', (e) => {
  if (currentScreen !== 'game') return;
  const target = e.target as HTMLElement;
  const cell = target.closest('.cell') as HTMLElement | null;
  if (!cell) return;
  const index = Number(cell.dataset.index || 0);
  handleHammerClick(index);
});

window.addEventListener('keydown', (e) => {
  if (currentScreen !== 'game') return;
  switch (e.key) {
    case 'ArrowLeft':
      handleMove('left');
      break;
    case 'ArrowRight':
      handleMove('right');
      break;
    case 'ArrowUp':
      handleMove('up');
      break;
    case 'ArrowDown':
      handleMove('down');
      break;
    default:
      break;
  }
});

window.addEventListener('resize', () => {
  syncTilesInstant();
});

startUpgradeToggle.addEventListener('click', toggleStartUpgrade);

lobbyStartBtn.addEventListener('click', startGame);
lobbyMiniBtn.addEventListener('click', () => {
  showScreen('minigame');
  renderMini();
});
lobbyShopBtn.addEventListener('click', () => {
  showScreen('result');
  renderResult();
  renderShop();
});
lobbyUpgradeBtn.addEventListener('click', () => {
  showScreen('upgrade');
  renderUpgrade();
});
lobbyRankBtn.addEventListener('click', () => {
  showScreen('ranking');
  void renderRanking();
});
lobbySettingsBtn.addEventListener('click', () => showToast('Settings coming soon.'));

gameExitBtn.addEventListener('click', handleExitGame);
gameRestartBtn.addEventListener('click', startGame);

itemUndoBtn.addEventListener('click', handleUndo);
itemShuffleBtn.addEventListener('click', handleShuffle);
itemHammerBtn.addEventListener('click', handleHammer);
itemDoubleBtn.addEventListener('click', handleDouble);

overlayPrimaryBtn.addEventListener('click', () => {
  showScreen('result');
  renderResult();
  renderShop();
});
overlaySecondaryBtn.addEventListener('click', startGame);

resultWatchBtn.addEventListener('click', async () => {
  if (!lastResult || lastResult.adClaimed) return;
  const result = await showRewardedAd('reward_result');
  if (!result.rewarded) {
    showToast('Ad skipped.');
    return;
  }
  claimAdBonus();
  showToast('Ad reward granted.');
});
resultPlayBtn.addEventListener('click', startGame);
resultLobbyBtn.addEventListener('click', () => {
  showScreen('lobby');
  renderLobby();
});

rankingFilterEls.forEach((btn) => {
  btn.addEventListener('click', () => {
    const period = btn.dataset.period;
    if (period !== 'daily' && period !== 'weekly' && period !== 'monthly' && period !== 'all') return;
    if (period === activeRankingPeriod) return;
    setRankingPeriod(period);
    void renderRanking();
  });
});
rankingBackBtn.addEventListener('click', () => {
  showScreen('lobby');
  renderLobby();
});
upgradeBackBtn.addEventListener('click', () => {
  showScreen('lobby');
  renderLobby();
});

let miniActiveIndex = -1;
let miniHits = 0;
let miniTimeLeft = MINIGAME_SECONDS;
let miniTicker: number | null = null;
let miniCountdown: number | null = null;
let miniCountdownTimer: number | null = null;
let miniCountdownPhase: number | null = null;

function renderMini() {
  miniTotalPointsEl.textContent = formatNumber(state.points);
  miniTimeEl.textContent = String(miniTimeLeft);
  miniScoreEl.textContent = String(miniHits);
  const ratio = Math.max(0, miniTimeLeft) / MINIGAME_SECONDS;
  miniProgressBarEl.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  miniProgressBarEl.classList.toggle('danger', miniTimeLeft <= 5);
}

function highlightMiniCell() {
  if (miniActiveIndex >= 0) miniCells[miniActiveIndex].classList.remove('active');
  miniActiveIndex = Math.floor(Math.random() * miniCells.length);
  miniCells[miniActiveIndex].classList.add('active');
}

function spawnMiniFx(cell: HTMLDivElement, kind: 'hit' | 'miss') {
  const fx = document.createElement('div');
  fx.className = `mini-fx ${kind}`;
  cell.appendChild(fx);
  fx.addEventListener('animationend', () => fx.remove());
  window.setTimeout(() => fx.remove(), 500);
}

function showCountdownPhase(phase: number) {
  const asset = COUNTDOWN_ASSETS[phase];
  if (!asset) return;
  miniCountdownImg.src = asset;
  miniCountdownEl.classList.remove('hidden');
  miniCountdownEl.classList.remove('pulse');
  void miniCountdownEl.offsetWidth;
  miniCountdownEl.classList.add('pulse');
}

function clearCountdown() {
  if (miniCountdownTimer) {
    window.clearTimeout(miniCountdownTimer);
    miniCountdownTimer = null;
  }
  miniCountdownPhase = null;
  miniCountdownEl.classList.add('hidden');
}

function startMiniCountdown() {
  if (miniCountdownTimer) return;
  miniCountdownPhase = 3;
  showCountdownPhase(miniCountdownPhase);
  const phases = [3, 2, 1, 0];
  let index = 0;

  const step = () => {
    if (index >= phases.length) {
      clearCountdown();
      beginMiniGame();
      return;
    }
    miniCountdownPhase = phases[index];
    showCountdownPhase(miniCountdownPhase);
    index += 1;
    const delay = miniCountdownPhase === 0 ? 500 : 600;
    miniCountdownTimer = window.setTimeout(step, delay);
  };

  miniCountdownTimer = window.setTimeout(step, 10);
}

function endMiniGame() {
  if (miniTicker) window.clearInterval(miniTicker);
  if (miniCountdown) window.clearInterval(miniCountdown);
  miniTicker = null;
  miniCountdown = null;
  clearCountdown();
  miniStartBtn.disabled = false;
  if (miniActiveIndex >= 0) miniCells[miniActiveIndex].classList.remove('active');
  miniActiveIndex = -1;

  const baseReward = Math.min(
    MINIGAME_MAX_POINTS,
    Math.max(MINIGAME_MIN_POINTS, MINIGAME_MIN_POINTS + miniHits * 3)
  );
  const economyBonus = Math.floor(baseReward * getEconomyRate());
  const reward = baseReward + economyBonus;

  state.points += reward;
  let buffAwarded = false;
  emitSfx('minigame_end', { reward });
  if (miniHits >= MINIGAME_BUFF_THRESHOLD) {
    state.nextGameBoostSeconds = Math.max(state.nextGameBoostSeconds, MINIGAME_BUFF_SECONDS);
    buffAwarded = true;
  }
  trackEvent('minigame_end', {
    hits: miniHits,
    reward,
    reward_base: baseReward,
    reward_economy_bonus: economyBonus,
    buff: buffAwarded,
  });
  saveState();

  miniResultEl.innerHTML = `Reward: <strong>${formatNumber(reward)}</strong> points${
    economyBonus > 0 ? ` (+${formatNumber(economyBonus)} economy)` : ''
  }${buffAwarded ? ' · Bonus buff earned!' : ''}`;

  renderMini();
  renderLobby();
  renderUpgrade();
  renderResult();
}

function cancelMiniGame() {
  if (miniTicker) window.clearInterval(miniTicker);
  if (miniCountdown) window.clearInterval(miniCountdown);
  miniTicker = null;
  miniCountdown = null;
  clearCountdown();
  miniStartBtn.disabled = false;
  miniActiveIndex = -1;
  miniHits = 0;
  miniTimeLeft = MINIGAME_SECONDS;
  miniResultEl.textContent = '';
  miniCells.forEach((cell) => cell.classList.remove('active'));
  renderMini();
}

function beginMiniGame() {
  miniStartBtn.disabled = true;
  miniHits = 0;
  miniTimeLeft = MINIGAME_SECONDS;
  miniResultEl.textContent = '';
  emitSfx('minigame_start');
  trackEvent('minigame_start');
  emitHaptic(10);
  highlightMiniCell();
  renderMini();

  miniTicker = window.setInterval(() => {
    highlightMiniCell();
  }, 900);

  miniCountdown = window.setInterval(() => {
    miniTimeLeft -= 1;
    renderMini();
    if (miniTimeLeft <= 0) {
      endMiniGame();
    }
  }, 1000);
}

function startMiniGame() {
  if (miniTicker || miniCountdown || miniCountdownTimer) return;
  miniStartBtn.disabled = true;
  startMiniCountdown();
}

function bindTap(element: HTMLElement, onTap: () => void) {
  let swallowClickUntil = 0;

  element.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    swallowClickUntil = Date.now() + 320;
    onTap();
  });

  element.addEventListener('click', (e) => {
    if (Date.now() < swallowClickUntil) {
      e.preventDefault();
      return;
    }
    onTap();
  });
}

miniCells.forEach((cell, index) => {
  bindTap(cell, () => {
    if (miniTimeLeft <= 0) return;
    if (miniCountdownPhase !== null) return;
    if (index === miniActiveIndex) {
      miniHits += 1;
      spawnMiniFx(cell, 'hit');
      emitSfx('minigame_hit');
      emitHaptic(6);
      highlightMiniCell();
      renderMini();
    } else {
      spawnMiniFx(cell, 'miss');
      emitSfx('minigame_miss');
      emitHaptic(4);
    }
  });
});

bindTap(miniStartBtn, startMiniGame);
bindTap(miniExitBtn, () => {
  if (miniTicker || miniCountdown) cancelMiniGame();
  showScreen('lobby');
  renderLobby();
});

showScreen('splash');
renderAll();
window.requestAnimationFrame(() => {
  dismissBootSplash();
});

window.setTimeout(() => {
  showScreen('lobby');
  renderLobby();
  dismissBootSplash();
}, 1200);






