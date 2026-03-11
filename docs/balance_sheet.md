# Balance Sheet (Initial)

## Tile Generation
- Spawn chance: 90% for 2, 10% for 4
- Board size: 4x4

## Scoring
- Merge score: merged tile value is added to score
- Combo: +1 per move with at least one merge (resets on no-merge move)

## Points Conversion
- Base points: floor(score / 120)
- Clear bonus: +150
- Clear streak bonus: +30% per streak step (max 3 streaks)

## Balance Hooks (Code Constants)
- SCORE_TO_POINTS = 120
- CLEAR_BONUS = 150
- STREAK_BONUS_RATE = 0.3
- STREAK_MAX = 3
- SPAWN_RATE_4 = 0.1
- UPGRADE_COST_MULTIPLIER = 1.5
- UPGRADE_SCORE_RATE_STEP = 0.0035
- UPGRADE_COMBO_RATE_STEP = 0.0008
- UPGRADE_END_BONUS_RATE_STEP = 0.002
- UPGRADE_ECONOMY_RATE_STEP = 0.0025
- UPGRADE_CLEAR_BONUS_STEP = 1
- UPGRADE_LOBBY_AD_RATE_STEP = 0.002
- LOBBY_AD_BONUS_POINTS = 30

## Mini-game Reward
- Duration: 30 seconds
- Reward range: 50~120 points
- Bonus buff: Double score 10s for next game if hit threshold met

## Items
| Item | Price | Effect | Limit per game |
|---|---:|---|---:|
| Undo | 120 | Revert last move | 3 |
| Shuffle | 180 | Re-shuffle board | 2 |
| Hammer | 260 | Remove a selected tile | 1 |
| Double Score | 220 | 2x score for 20 sec | 2 |
| Start Upgrade | 300 | One starting tile +1 tier | 1 (pre-game) |

## Guardrails
- Ranking separation or score coefficient if excessive item use
- Daily free currency cap (future)
- Difficulty: early curve softened, high score curve flattens

## Permanent Upgrades (Lobby -> Upgrades)
| Upgrade | Effect per level | Max level | Base cost |
|---|---|---:|---:|
| Score Boost | +0.35% merge score | 100 | 140 |
| Combo Boost | +0.08% merge score per combo chain step | 100 | 120 |
| End Bonus | +0.2% post-game point bonus | 100 | 180 |
| Economy Boost | +0.25% all point rewards | 100 | 200 |
| Clear Bonus+ | +1 clear bonus point | 100 | 130 |
| Lobby Ad Boost | +0.2% lobby ad reward | 100 | 150 |

Cost formula:
- next cost = floor(baseCost * 1.5^currentLevel)

Notes:
- Economy Boost applies to game-end reward, mini-game reward, and rewarded-ad points.
- Lobby Ad Boost applies only to lobby rewarded-ad points.
- Result rewarded-ad keeps base reward and Economy Boost only.
- Level means current level before purchase in the cost formula.

## Fine-tuned Progression Checkpoints
- Cost grows by 1.5x per level for all upgrades.
- Approx cost multiplier from level 0 to 10: x57.67
- Approx cost multiplier from level 0 to 20: x3325
- Early levels (1~8) are the practical power band for most players.
