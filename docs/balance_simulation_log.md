# Balance Simulation Log (Initial)

## Assumptions
- Player baseline: 2048 familiar
- No item use in baseline run
- Standard 90/10 spawn

## Observations (manual baseline)
- Typical score range: 2,000 ~ 6,000
- Estimated points: 16 ~ 50 points per run
- Clear rate (target 2048): low for casual, moderate for skilled

## Notes
- Item pricing tuned to require multiple runs per purchase
- Clear bonus intended to make clearing feel materially rewarding

## Next
- Add scripted simulation for item efficiency & abuse detection


## Upgrade Economy Checkpoints (2026-03-06)

### Cost growth (next upgrade cost)
Formula: `floor(baseCost * 1.5^currentLevel)`

| Level | Score | Combo | End Bonus | Economy | Clear Bonus+ |
|---:|---:|---:|---:|---:|---:|
| 0 | 140 | 120 | 180 | 200 | 130 |
| 1 | 210 | 180 | 270 | 300 | 195 |
| 2 | 315 | 270 | 405 | 450 | 292 |
| 3 | 472 | 405 | 607 | 675 | 438 |
| 5 | 1,063 | 911 | 1,366 | 1,518 | 987 |
| 8 | 3,588 | 3,075 | 4,613 | 5,125 | 3,331 |
| 10 | 8,073 | 6,919 | 10,379 | 11,533 | 7,496 |
| 15 | 61,305 | 52,547 | 78,820 | 87,578 | 56,926 |
| 20 | 465,535 | 399,030 | 598,546 | 665,051 | 432,283 |

### Effect growth
| Level | Score Boost | Combo Boost (per chain step) | End Bonus | Economy Boost | Clear Bonus+ |
|---:|---:|---:|---:|---:|---:|
| 1 | +0.35% | +0.08% of merge score | +0.20% | +0.25% | +1 |
| 5 | +1.75% | +0.40% of merge score | +1.00% | +1.25% | +5 |
| 10 | +3.50% | +0.80% of merge score | +2.00% | +2.50% | +10 |
| 20 | +7.00% | +1.60% of merge score | +4.00% | +5.00% | +20 |

### Tuning conclusion
- Early power band is roughly level 1~8 per upgrade.
- Level 10+ is intentionally expensive and long-term progression.
- With current economy (typical 16~50 points/run), upgrades are a long grind unless boosted by clear performance and ad reward loops.
- If progression feels too slow in QA, adjust base costs first (not multiplier) to preserve late-game sink.
