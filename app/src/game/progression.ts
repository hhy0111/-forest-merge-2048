export type UpgradeKey = 'score' | 'combo' | 'endBonus' | 'economy' | 'clear';

export type UpgradeDef = {
  label: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
};

export const UPGRADE_DEFS: Record<UpgradeKey, UpgradeDef> = {
  score: {
    label: 'Score Boost',
    desc: 'Increases merge score slightly.',
    maxLevel: 100,
    baseCost: 140,
  },
  combo: {
    label: 'Combo Boost',
    desc: 'Adds a small bonus during combo chains.',
    maxLevel: 100,
    baseCost: 120,
  },
  endBonus: {
    label: 'End Bonus',
    desc: 'Adds a small % bonus to earned points.',
    maxLevel: 100,
    baseCost: 180,
  },
  economy: {
    label: 'Economy Boost',
    desc: 'Increases all point rewards.',
    maxLevel: 100,
    baseCost: 200,
  },
  clear: {
    label: 'Clear Bonus+',
    desc: 'Adds extra clear bonus points.',
    maxLevel: 100,
    baseCost: 130,
  },
};

export const UPGRADE_COST_MULTIPLIER = 1.5;
export const UPGRADE_SCORE_RATE_STEP = 0.0035;
export const UPGRADE_COMBO_RATE_STEP = 0.0008;
export const UPGRADE_END_BONUS_RATE_STEP = 0.002;
export const UPGRADE_ECONOMY_RATE_STEP = 0.0025;
export const UPGRADE_CLEAR_BONUS_STEP = 1;

export function calcUpgradeCost(baseCost: number, level: number) {
  const safeLevel = Math.max(0, Math.floor(level));
  const rawCost = baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, safeLevel);
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(rawCost));
}

export function calcScoreBoostRate(level: number) {
  return Math.max(0, Math.floor(level)) * UPGRADE_SCORE_RATE_STEP;
}

export function calcComboRate(level: number) {
  return Math.max(0, Math.floor(level)) * UPGRADE_COMBO_RATE_STEP;
}

export function calcComboBonus(chainCount: number, mergeScore: number, level: number) {
  if (chainCount < 2 || mergeScore <= 0) return 0;
  const comboRate = calcComboRate(level);
  if (comboRate <= 0) return 0;

  const chainFactor = Math.min(chainCount - 1, 6);
  return Math.floor(mergeScore * chainFactor * comboRate);
}

export function calcEndBonusRate(level: number) {
  return Math.max(0, Math.floor(level)) * UPGRADE_END_BONUS_RATE_STEP;
}

export function calcEconomyRate(level: number) {
  return Math.max(0, Math.floor(level)) * UPGRADE_ECONOMY_RATE_STEP;
}

export function calcClearBonusFlat(level: number) {
  return Math.max(0, Math.floor(level)) * UPGRADE_CLEAR_BONUS_STEP;
}

export function calcAdRewardPoints(baseAdPoints: number, economyLevel: number) {
  const economyBonus = Math.floor(baseAdPoints * calcEconomyRate(economyLevel));
  return baseAdPoints + economyBonus;
}

export type EndRewardInput = {
  score: number;
  cleared: boolean;
  clearStreak: number;
  scoreToPoints: number;
  baseClearBonus: number;
  streakBonusRate: number;
  streakMax: number;
  endBonusLevel: number;
  economyLevel: number;
  clearBonusLevel: number;
};

export type EndRewardOutput = {
  basePoints: number;
  clearBonus: number;
  streakBonus: number;
  endBonus: number;
  economyBonus: number;
  upgradeBonus: number;
  totalEarned: number;
  nextClearStreak: number;
};

export function calcEndReward(input: EndRewardInput): EndRewardOutput {
  const basePoints = Math.floor(input.score / input.scoreToPoints);
  const clearBonus = input.cleared
    ? input.baseClearBonus + calcClearBonusFlat(input.clearBonusLevel)
    : 0;

  let nextClearStreak = 0;
  let streakBonus = 0;

  if (input.cleared) {
    nextClearStreak = Math.min(input.clearStreak + 1, input.streakMax);
    const streakRate = input.streakBonusRate * (nextClearStreak - 1);
    streakBonus = Math.floor((basePoints + clearBonus) * streakRate);
  }

  const subtotalEarned = basePoints + clearBonus + streakBonus;
  const endBonus = Math.floor(subtotalEarned * calcEndBonusRate(input.endBonusLevel));
  const economyBonus = Math.floor((subtotalEarned + endBonus) * calcEconomyRate(input.economyLevel));
  const upgradeBonus = endBonus + economyBonus;
  const totalEarned = subtotalEarned + upgradeBonus;

  return {
    basePoints,
    clearBonus,
    streakBonus,
    endBonus,
    economyBonus,
    upgradeBonus,
    totalEarned,
    nextClearStreak,
  };
}
