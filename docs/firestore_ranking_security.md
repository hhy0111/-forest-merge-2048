# Firestore Ranking Security & Data Policy

## 1) Security rules (production baseline)
- Rule file: `app/firestore.rules`
- Apply path in Firebase Console:
  - Firebase Console -> Cloud Firestore -> Rules
  - Replace with `app/firestore.rules` content
  - Click `Publish`

## 2) Ranking data policy
- Collection: `leaderboard`
- Document ID: `uid`
- One document per user (best-record policy)
- Document shape:

```json
{
  "uid": "<auth uid>",
  "all": { "key": "all", "score": 12345, "maxTile": 2048, "updatedAt": "timestamp" },
  "daily": { "key": "2026-03-06", "score": 4020, "maxTile": 512, "updatedAt": "timestamp" },
  "weekly": { "key": "week-2026-03-02", "score": 7810, "maxTile": 1024, "updatedAt": "timestamp" },
  "monthly": { "key": "2026-03", "score": 9900, "maxTile": 1024, "updatedAt": "timestamp" }
}
```

## 3) Why this policy
- Prevents one user from occupying many rows in leaderboard
- Keeps write volume stable (no per-run document explosion)
- Keeps daily/weekly/monthly and overall tabs with current-bucket best score

## 4) Legacy document handling
- Existing legacy run-documents can remain.
- App now prioritizes per-user policy and deduplicates by `uid` when reading.
- Optional cleanup: remove legacy docs later with Admin SDK or Firebase Extension.

## 5) Verification checklist
1. Sign in anonymously (Auth -> Anonymous enabled).
2. Play 2+ runs with same account.
3. In Firestore `leaderboard`, verify same `uid` document is updated (not new docs each run).
4. Check ranking tabs: daily / weekly / monthly / all.
5. Confirm unauthenticated write is denied by rules.
6. Confirm delete is denied.


## 6) Firestore index status
- Current leaderboard read query uses:
  - `collection('leaderboard')`
  - `limit(1000)`
  - no `where`, no `orderBy`
- For this query shape, no composite index is required.
- If you later add `where + orderBy` for server-side sorting/filtering, Firestore may return `failed-precondition` with an index creation link.

## 7) Runtime troubleshooting guide
- `permission-denied` in ranking:
  1. Firebase Console -> Firestore -> Rules
  2. Ensure `leaderboard/{uid}` read/create/update rules are published.
  3. Ensure Anonymous Auth is enabled.
- `failed-precondition` in ranking:
  1. Open browser console error link.
  2. Create requested Firestore index.
  3. Wait index build completion, then retry.
- `Rankings are unavailable offline`:
  - Device is offline; ranking read/write queue will flush after reconnect.

## 8) Operations checklist (before release)
1. Rules published from `app/firestore.rules`.
2. Anonymous Auth enabled.
3. Firestore location fixed to production region.
4. Manual test: submit score -> ranking reflects update.
5. Manual test: lower score does not overwrite higher score.
6. Manual test: same UID keeps single document.
7. Manual test: offline play -> reconnect -> queue flush succeeds.

## 9) 2026-03-09 REST smoke verification (completed)
- Test method: Firebase Identity Toolkit anonymous sign-in + Firestore REST document writes.
- Project: `forest-merge-2048`
- Results:
  - owner create (`leaderboard/{uid}`): `200`
  - same owner lower-score overwrite attempt: `403` (blocked as expected)
  - same owner higher-score update: `200`
  - different uid write to other user's doc: `403` (blocked as expected)
  - public leaderboard read: `200`

This confirms the current published rules enforce owner-only writes and progressive score updates while keeping leaderboard reads public.

