# GDD Summary - Forest Merge 2048 (Image Block)

## Goal
- Rebuild 2048 into an image-block mobile-friendly experience.
- Support point economy, items, and banner ads for a service-ready MVP.

## Core Loop
1. Lobby -> choose Start / Bonus / Upgrades
2. Upgrade screen -> spend points for small permanent boosts
3. Swipe to merge image blocks -> score and combos
4. Clear or fail -> reward calculation -> result + shop
5. Spend points on items/upgrades -> re-enter game
6. Optional bonus mini-game -> extra points + temporary buff

## Target Clear Condition
- Clear when a 2048-tier image block is created.

## Screens (MVP)
1. Splash/Loading
2. Lobby/Home
3. Upgrade
4. Main Game (2048 Image Board)
5. Bonus Mini-game
6. Result/Reward/Shop

## Economy Summary
- Points = floor(Game Score / 120)
- Clear bonus: +150 points
- Clear streak bonus: +30% of (base+clear) per streak step, max 3 streaks
- Upgrade bonuses are stackable and scale up to level 100 each
- Bonus mini-game: 50~120 points, with optional temporary buff

## Items
- Undo: 120 pts, limit 3 per game
- Shuffle: 180 pts, limit 2 per game
- Hammer: 260 pts, limit 1 per game
- Double Score: 220 pts, limit 2 per game, 20 sec
- Start Upgrade: 300 pts, pre-game, 1 use

## Fun Effects
- Combo count from consecutive merges
- High-tier merge glow + brief slow motion feel
- Tension UI when reaching 1024 (one step before clear)

## Ads Policy
- Banner only in Lobby (`banner_lobby`) and Result/Shop (`banner_result`)
- Reward ad only from Result reward button (`reward_result`)
- No banner on Game/Bonus/Splash/Ranking to avoid input disruption

## Done Criteria
- 6 screens flow end-to-end
- Merge/score/points/items working
- Banner placement verified
- QA checklist >= 95% pass rate

## Upgrades (Permanent)
- Max level: 100 for each upgrade
- Cost scaling: next cost = floor(baseCost * 1.5^currentLevel)
- Score Boost: +0.35% merge score per level
- Combo Boost: +0.08% merge score per combo chain step per level
- End Bonus: +0.2% post-game point bonus per level
- Economy Boost: +0.25% to all point rewards per level (game end, mini-game, ad reward)
- Clear Bonus+: +1 clear bonus point per level
