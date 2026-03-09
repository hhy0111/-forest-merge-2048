import { describe, expect, it } from 'vitest';
import {
  UPGRADE_DEFS,
  calcAdRewardPoints,
  calcComboBonus,
  calcEndReward,
  calcUpgradeCost,
} from './progression';

describe('progression', () => {
  it('grows upgrade cost by 1.5x each level (floored)', () => {
    const base = UPGRADE_DEFS.score.baseCost;
    expect(calcUpgradeCost(base, 0)).toBe(140);
    expect(calcUpgradeCost(base, 1)).toBe(210);
    expect(calcUpgradeCost(base, 2)).toBe(315);
    expect(calcUpgradeCost(base, 3)).toBe(472);
  });

  it('returns zero combo bonus for invalid chain/merge', () => {
    expect(calcComboBonus(1, 128, 10)).toBe(0);
    expect(calcComboBonus(3, 0, 10)).toBe(0);
    expect(calcComboBonus(3, 128, 0)).toBe(0);
  });

  it('caps combo chain factor and applies level rate', () => {
    // chainCount 10 -> chainFactor capped at 6
    const bonus = calcComboBonus(10, 256, 20);
    expect(bonus).toBe(Math.floor(256 * 6 * (20 * 0.0008)));
  });

  it('calculates end reward with streak + upgrade bonuses', () => {
    const out = calcEndReward({
      score: 9600,
      cleared: true,
      clearStreak: 1,
      scoreToPoints: 120,
      baseClearBonus: 150,
      streakBonusRate: 0.3,
      streakMax: 3,
      endBonusLevel: 10,
      economyLevel: 10,
      clearBonusLevel: 10,
    });

    expect(out.basePoints).toBe(80);
    expect(out.clearBonus).toBe(160);
    expect(out.streakBonus).toBe(72); // (80+160)*0.3
    expect(out.endBonus).toBe(6); // floor(312*0.02)
    expect(out.economyBonus).toBe(7); // floor((312+6)*0.025)
    expect(out.upgradeBonus).toBe(13);
    expect(out.totalEarned).toBe(325);
    expect(out.nextClearStreak).toBe(2);
  });

  it('calculates ad reward with economy bonus', () => {
    expect(calcAdRewardPoints(60, 0)).toBe(60);
    expect(calcAdRewardPoints(60, 10)).toBe(61); // floor(60*0.025)=1
    expect(calcAdRewardPoints(60, 40)).toBe(66); // floor(60*0.10)=6
  });
});
